import AVFoundation
import QuartzCore
import UIKit

/// アプリ全体の AVAudioSession 設定を単一箇所で管理する。
/// 画面ごとの `.playback` / `.ambient` 切替えによる I/O 再起動と、
/// 録画向け IO バッファ設定の破棄を防ぐ。
final class AppAudioSession {
    static let shared = AppAudioSession()

    /// セッション設定が実際に変わったときに post する（オーディオグラフ再構成用）。
    static let didReconfigureNotification = Notification.Name("AppAudioSession.didReconfigure")

    /// 通常プレイ時の IO バッファ（20ms）。鍵盤 / 正解ルート / デモプレイの低レイテンシを維持する。
    private static let normalIOBufferDuration: TimeInterval = 0.02
    /// マイク入力（PESTO）有効時の IO バッファ（10ms）。オンセット検出レイテンシ短縮。
    private static let recordingIOBufferDuration: TimeInterval = 0.01
    /// 画面録画・ミラーリング中のみ要求する IO バッファ（40ms）。録画 CPU 負荷下のアンダーラン耐性向上。
    private static let capturedIOBufferDuration: TimeInterval = 0.04
    /// 画面キャプチャ / ルート変更後、オーディオ経路が落ち着くまで待つ秒数。
    private static let reconfigureDelay: TimeInterval = 0.15
    /// マイク停止後、`.playback` へ戻すまでの猶予。画面遷移の一瞬の購読 0 でカテゴリ往復しない。
    private static let recordingDisableDebounce: TimeInterval = 2.0
    /// PESTO 推論と一致させる録音時の優先サンプルレート。
    private static let recordingPreferredSampleRate: Double = 48_000
    /// configure() / VPIO 切替直後に自己誘発 routeChange を無視する秒数。
    private static let automaticReconfigureSuppression: TimeInterval = 1.0

    private var lastAppliedIOBufferDuration: TimeInterval?
    private var lastAppliedSampleRate: Double?
    private var reconfigureWorkItem: DispatchWorkItem?
    private var recordingDisableWorkItem: DispatchWorkItem?
    private var captureObserver: NSObjectProtocol?
    private var routeChangeObserver: NSObjectProtocol?
    private var mediaServicesResetObserver: NSObjectProtocol?
    private var hasStarted = false
    private var recordingEnabled = false
    /// この時刻まで routeChange 由来の自動再構成を抑制する（非同期配信の自己発火対策）。
    private var suppressAutomaticReconfigureUntil: CFTimeInterval = 0

    private init() {}

    /// VPIO 有効化や setCategory 直前に呼び、自己誘発 routeChange による BGM 再構築連鎖を防ぐ。
    func suppressAutomaticReconfigure(for duration: TimeInterval = automaticReconfigureSuppression) {
        guard Thread.isMainThread else {
            DispatchQueue.main.async { self.suppressAutomaticReconfigure(for: duration) }
            return
        }
        suppressAutomaticReconfigureUntil = max(
            suppressAutomaticReconfigureUntil,
            CACurrentMediaTime() + duration
        )
    }

    private var isWithinAutomaticReconfigureSuppression: Bool {
        CACurrentMediaTime() < suppressAutomaticReconfigureUntil
    }

    private func postReconfigureIfNeeded(_ didChange: Bool) {
        guard didChange else { return }
        NotificationCenter.default.post(name: Self.didReconfigureNotification, object: self)
    }

    /// マイク入力（PESTO）使用中は `.playAndRecord`、それ以外は `.playback`。
    func setRecordingEnabled(_ enabled: Bool) {
        guard Thread.isMainThread else {
            DispatchQueue.main.async { self.setRecordingEnabled(enabled) }
            return
        }

        if enabled {
            recordingDisableWorkItem?.cancel()
            recordingDisableWorkItem = nil
            guard !recordingEnabled else { return }
            recordingEnabled = true
            let didChange = configure(force: true)
            postReconfigureIfNeeded(didChange)
            return
        }

        guard recordingEnabled else { return }
        recordingDisableWorkItem?.cancel()
        let work = DispatchWorkItem { [weak self] in
            guard let self else { return }
            self.recordingEnabled = false
            let didChange = self.configure(force: true)
            self.postReconfigureIfNeeded(didChange)
        }
        recordingDisableWorkItem = work
        DispatchQueue.main.asyncAfter(deadline: .now() + Self.recordingDisableDebounce, execute: work)
    }

    var isRecordingEnabled: Bool { recordingEnabled }

    /// AppDelegate から 1 回だけ呼ぶ。初期構成 + ライフサイクル監視を開始する。
    func start() {
        guard Thread.isMainThread else {
            DispatchQueue.main.async { self.start() }
            return
        }
        guard !hasStarted else { return }
        hasStarted = true
        _ = configure(force: true)
        registerObservers()
    }

    /// AVAudioSession を構成する。同一設定が既に適用済みならスキップ（I/O 再起動グリッチ防止）。
    /// - Parameter force: true のときキャプチャ遷移などで必ず再適用する。
    /// - Returns: 設定が実際に変わった場合 true（通知 post の判定用）。
    @discardableResult
    func configure(force: Bool = false) -> Bool {
        guard Thread.isMainThread else {
            return DispatchQueue.main.sync { configure(force: force) }
        }

        let session = AVAudioSession.sharedInstance()
        let targetBuffer = preferredIOBufferDuration
        let currentSampleRate = session.sampleRate

        let targetCategory: AVAudioSession.Category = recordingEnabled ? .playAndRecord : .playback
        var targetOptions: AVAudioSession.CategoryOptions = [.mixWithOthers]
        if recordingEnabled {
            targetOptions.insert(.defaultToSpeaker)
            // .allowBluetooth は HFP を有効にして出力まで 16kHz モノラルに落ちるため使わない。
            // A2DP のみ許可して再生音質を維持する。
            targetOptions.insert(.allowBluetoothA2DP)
        }

        let categoryMatches = session.category == targetCategory
        let optionsMatch = session.categoryOptions == targetOptions
        let modeMatches = session.mode == .default
        let bufferMatches = lastAppliedIOBufferDuration == targetBuffer
        let sampleRateMatches = lastAppliedSampleRate != nil
            && currentSampleRate > 0
            && lastAppliedSampleRate == currentSampleRate

        if !force, categoryMatches, optionsMatch, modeMatches, bufferMatches, sampleRateMatches {
            return false
        }

        let previousBuffer = lastAppliedIOBufferDuration
        let previousSampleRate = lastAppliedSampleRate

        suppressAutomaticReconfigure(for: Self.automaticReconfigureSuppression)

        try? session.setCategory(targetCategory, mode: .default, options: targetOptions)
        if recordingEnabled {
            // PESTO の 48 kHz と揃え、カテゴリ切替後のレート変動による BGM 再構築を抑える。
            try? session.setPreferredSampleRate(Self.recordingPreferredSampleRate)
        }
        // 44.1 kHz 固定は画面録画 (48 kHz) 時のリサンプル負荷でアンダーランを起こしやすい。
        // ハードウェア優先レート (多くの端末は 48 kHz) に追従させる。
        // 非録画時は 20ms で鍵盤 / 正解ルート / デモプレイの低レイテンシを維持する。
        // 録画中のみ 40ms へ緩め、CPU 負荷下のアンダーラン（「ガガガ」）を抑える。
        try? session.setPreferredIOBufferDuration(targetBuffer)
        lastAppliedIOBufferDuration = targetBuffer
        try? session.setActive(true, options: [])

        let updatedSampleRate = session.sampleRate
        if updatedSampleRate > 0 {
            lastAppliedSampleRate = updatedSampleRate
        }

        return !categoryMatches
            || !optionsMatch
            || !modeMatches
            || previousBuffer != targetBuffer
            || (updatedSampleRate > 0 && previousSampleRate != updatedSampleRate)
    }

    // MARK: - Private

    private var preferredIOBufferDuration: TimeInterval {
        if UIScreen.main.isCaptured { return Self.capturedIOBufferDuration }
        if recordingEnabled { return Self.recordingIOBufferDuration }
        return Self.normalIOBufferDuration
    }

    private func registerObservers() {
        let center = NotificationCenter.default
        let session = AVAudioSession.sharedInstance()

        captureObserver = center.addObserver(
            forName: UIScreen.capturedDidChangeNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.scheduleReconfigure()
        }

        routeChangeObserver = center.addObserver(
            forName: AVAudioSession.routeChangeNotification,
            object: session,
            queue: .main
        ) { [weak self] notification in
            self?.handleRouteChange(notification)
        }

        mediaServicesResetObserver = center.addObserver(
            forName: AVAudioSession.mediaServicesWereResetNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.scheduleReconfigure()
        }
    }

    private func handleRouteChange(_ notification: Notification) {
        guard let reasonValue = notification.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue) else {
            scheduleReconfigure()
            return
        }

        switch reason {
        case .oldDeviceUnavailable, .newDeviceAvailable:
            scheduleReconfigure()
        case .categoryChange, .routeConfigurationChange, .override:
            if isWithinAutomaticReconfigureSuppression { return }
            scheduleReconfigure()
        default:
            break
        }
    }

    private func scheduleReconfigure() {
        reconfigureWorkItem?.cancel()
        let work = DispatchWorkItem { [weak self] in
            guard let self else { return }
            let didChange = self.configure(force: true)
            if didChange {
                NotificationCenter.default.post(name: Self.didReconfigureNotification, object: self)
            }
        }
        reconfigureWorkItem = work
        DispatchQueue.main.asyncAfter(deadline: .now() + Self.reconfigureDelay, execute: work)
    }
}
