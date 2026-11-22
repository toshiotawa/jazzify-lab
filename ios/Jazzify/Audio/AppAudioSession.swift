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
    static let reconfigureSourceKey = "source"
    static let captureEngineStartSource = "captureEngineStart"

    /// 通常プレイ時の IO バッファ（20ms）。鍵盤 / 正解ルート / デモプレイの低レイテンシを維持する。
    private static let normalIOBufferDuration: TimeInterval = 0.02
    /// マイク入力（PESTO）有効時の IO バッファ（5ms）。オンセット検出レイテンシ短縮。
    private static let recordingIOBufferDuration: TimeInterval = 0.005
    /// 画面録画・ミラーリング中のみ要求する IO バッファ（40ms）。録画 CPU 負荷下のアンダーラン耐性向上。
    private static let capturedIOBufferDuration: TimeInterval = 0.04
    /// 画面キャプチャ / ルート変更後、オーディオ経路が落ち着くまで待つ秒数。
    private static let reconfigureDelay: TimeInterval = 0.15
    /// マイク停止後、`.playback` へ戻すまでの猶予。画面遷移の一瞬の購読 0 でカテゴリ往復しない。
    private static let recordingDisableDebounce: TimeInterval = 2.0
    /// configure() / VPIO 切替直後に自己誘発 routeChange を無視する秒数。
    private static let automaticReconfigureSuppression: TimeInterval = 1.0

    private var lastAppliedIOBufferDuration: TimeInterval?
    private var lastAppliedSampleRate: Double?
    private var lastAppliedPreferredSampleRate: Double?
    private var pendingAlwaysNotify = false
    private var reconfigureWorkItem: DispatchWorkItem?
    private var captureSyncWorkItem: DispatchWorkItem?
    private var recordingDisableWorkItem: DispatchWorkItem?
    private var captureObserver: NSObjectProtocol?
    private var routeChangeObserver: NSObjectProtocol?
    private var mediaServicesResetObserver: NSObjectProtocol?
    private var interruptionObserver: NSObjectProtocol?
    private var didEnterBackgroundObserver: NSObjectProtocol?
    private var didBecomeActiveObserver: NSObjectProtocol?
    private var hasStarted = false
    private var recordingEnabled = false
    private var isBackgrounded = false
    private var pendingReconfigureOnActive = false
    /// この時刻まで routeChange 由来の自動再構成を抑制する（非同期配信の自己発火対策）。
    private var suppressAutomaticReconfigureUntil: CFTimeInterval = 0

    private init() {}

    /// アプリがバックグラウンドにあるときは `AVAudioSession.setActive(true)` / `AVAudioEngine.start()` が
    /// iOS により `561015905` (`AVAudioSessionErrorCodeCannotStartPlaying`) で拒否されるため抑制する。
    static func canActivateAudio(applicationState: UIApplication.State, isBackgrounded: Bool) -> Bool {
        !isBackgrounded && applicationState != .background
    }

    /// `AVAudioSessionErrorCodeCannotStartPlaying` (`561015905` / `'!pla'`) かどうか。
    /// バックグラウンド等で OS が再生開始を拒否したエラーであり、即座のリトライは同じエラーを繰り返すだけになる。
    static func isCannotStartPlayingError(_ error: Error) -> Bool {
        (error as NSError).code == AVAudioSession.ErrorCode.cannotStartPlaying.rawValue
    }

    /// 現在オーディオセッションの有効化および `AVAudioEngine.start()` を実行してよいか。
    var canStartAudioEngine: Bool {
        guard Thread.isMainThread else {
            return DispatchQueue.main.sync { self.canStartAudioEngine }
        }
        return Self.canActivateAudio(
            applicationState: UIApplication.shared.applicationState,
            isBackgrounded: isBackgrounded
        )
    }

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
    /// - Parameter immediate: true のとき録音オフをデバウンスせず即 `.playback` へ切替（入力方式の明示的変更用）。
    func setRecordingEnabled(_ enabled: Bool, immediate: Bool = false) {
        guard Thread.isMainThread else {
            DispatchQueue.main.async { self.setRecordingEnabled(enabled, immediate: immediate) }
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
        recordingDisableWorkItem = nil
        captureSyncWorkItem?.cancel()
        captureSyncWorkItem = nil

        if immediate {
            recordingEnabled = false
            let didChange = configure(force: true)
            postReconfigureIfNeeded(didChange)
            return
        }

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

    /// `PitchInputEngine` がマイク入力エンジンを起動し終えた後に再生エンジン群のみ最終ハードウェアレートへ再同期する。
    /// `AVAudioSession` の再設定は行わず、`PitchInputEngine` 自身はこの通知を無視して再起動ループを防ぐ。
    func notifyPlaybackEnginesAfterCaptureStart() {
        guard Thread.isMainThread else {
            DispatchQueue.main.async { self.notifyPlaybackEnginesAfterCaptureStart() }
            return
        }
        captureSyncWorkItem?.cancel()
        let work = DispatchWorkItem { [weak self] in
            guard let self else { return }
            self.captureSyncWorkItem = nil
            guard !self.isBackgrounded, self.recordingEnabled else { return }
            let session = AVAudioSession.sharedInstance()
            if session.sampleRate > 0 {
                self.lastAppliedSampleRate = session.sampleRate
            }
            AudioRateDiagnostics.logSessionConfigure(
                session: session,
                isCaptured: UIScreen.main.isCaptured,
                recordingEnabled: self.recordingEnabled,
                preferredSampleRate: self.lastAppliedPreferredSampleRate ?? 0,
                targetIOBufferDuration: self.lastAppliedIOBufferDuration ?? 0,
                didChange: true
            )
            NotificationCenter.default.post(
                name: Self.didReconfigureNotification,
                object: self,
                userInfo: [Self.reconfigureSourceKey: Self.captureEngineStartSource]
            )
        }
        captureSyncWorkItem = work
        DispatchQueue.main.asyncAfter(deadline: .now() + Self.reconfigureDelay, execute: work)
    }

    /// AppDelegate から 1 回だけ呼ぶ。初期構成 + ライフサイクル監視を開始する。
    func start() {
        guard Thread.isMainThread else {
            DispatchQueue.main.async { self.start() }
            return
        }
        guard !hasStarted else { return }
        hasStarted = true
        _ = configure(force: true)
        VoiceSpeakerBleedCoordinator.shared.refreshRouteFromSession()
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

        guard Self.canActivateAudio(
            applicationState: UIApplication.shared.applicationState,
            isBackgrounded: isBackgrounded
        ) else {
            pendingReconfigureOnActive = true
            return false
        }

        let session = AVAudioSession.sharedInstance()
        let isCaptured = UIScreen.main.isCaptured
        let isBluetoothOutput = AudioRouteHelper.hasBluetoothOutput(session: session)
        let targetBuffer = preferredIOBufferDuration(isCaptured: isCaptured)
        let targetPreferredSampleRate = AudioOutputFormatResolver.preferredSessionSampleRate(
            recordingEnabled: recordingEnabled,
            isScreenCaptured: isCaptured,
            isBluetoothOutput: isBluetoothOutput
        )
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
        let preferredSampleRateMatches = lastAppliedPreferredSampleRate == targetPreferredSampleRate
        let sampleRateMatches: Bool = {
            guard let lastApplied = lastAppliedSampleRate, currentSampleRate > 0 else { return false }
            return AudioOutputFormatResolver.sampleRatesMatch(currentSampleRate, lastApplied)
        }()

        if !force, categoryMatches, optionsMatch, modeMatches, bufferMatches, preferredSampleRateMatches, sampleRateMatches {
            return false
        }

        let previousBuffer = lastAppliedIOBufferDuration
        let previousSampleRate = lastAppliedSampleRate
        let previousPreferredSampleRate = lastAppliedPreferredSampleRate

        suppressAutomaticReconfigure(for: Self.automaticReconfigureSuppression)

        try? session.setCategory(targetCategory, mode: .default, options: targetOptions)
        try? session.setPreferredSampleRate(targetPreferredSampleRate)
        lastAppliedPreferredSampleRate = targetPreferredSampleRate
        // 非録画時は 20ms で鍵盤 / 正解ルート / デモプレイの低レイテンシを維持する。
        // 録画中のみ 40ms へ緩め、CPU 負荷下のアンダーラン（「ガガガ」）を抑える。
        // 録画中およびマイク有効時は 48 kHz を要求し、ReplayKit / PESTO とレートを揃える。
        try? session.setPreferredIOBufferDuration(targetBuffer)
        lastAppliedIOBufferDuration = targetBuffer
        try? session.setActive(true, options: [])

        let updatedSampleRate = session.sampleRate
        if updatedSampleRate > 0 {
            lastAppliedSampleRate = updatedSampleRate
        }

        let sampleRateChanged: Bool = {
            guard updatedSampleRate > 0 else { return false }
            guard let previous = previousSampleRate else { return true }
            return !AudioOutputFormatResolver.sampleRatesMatch(previous, updatedSampleRate)
        }()

        let didChange = !categoryMatches
            || !optionsMatch
            || !modeMatches
            || previousBuffer != targetBuffer
            || previousPreferredSampleRate != targetPreferredSampleRate
            || sampleRateChanged

        AudioRateDiagnostics.logSessionConfigure(
            session: session,
            isCaptured: isCaptured,
            recordingEnabled: recordingEnabled,
            preferredSampleRate: targetPreferredSampleRate,
            targetIOBufferDuration: targetBuffer,
            didChange: didChange
        )

        return didChange
    }

    // MARK: - Private

    private func preferredIOBufferDuration(isCaptured: Bool) -> TimeInterval {
        if isCaptured { return Self.capturedIOBufferDuration }
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
            self?.scheduleReconfigure(alwaysNotify: true)
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
            self?.scheduleReconfigure(alwaysNotify: true)
        }

        interruptionObserver = center.addObserver(
            forName: AVAudioSession.interruptionNotification,
            object: session,
            queue: .main
        ) { [weak self] notification in
            self?.handleInterruption(notification)
        }

        didEnterBackgroundObserver = center.addObserver(
            forName: UIApplication.didEnterBackgroundNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            guard let self else { return }
            self.isBackgrounded = true
            self.reconfigureWorkItem?.cancel()
            self.reconfigureWorkItem = nil
            self.captureSyncWorkItem?.cancel()
            self.captureSyncWorkItem = nil
            self.pendingAlwaysNotify = false
        }

        didBecomeActiveObserver = center.addObserver(
            forName: UIApplication.didBecomeActiveNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            guard let self else { return }
            self.isBackgrounded = false
            guard self.pendingReconfigureOnActive else { return }
            self.pendingReconfigureOnActive = false
            let didChange = self.configure(force: true)
            self.postReconfigureIfNeeded(didChange)
        }
    }

    private func handleInterruption(_ notification: Notification) {
        guard let typeValue = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue) else {
            return
        }
        guard type == .ended else { return }
        guard let optionsValue = notification.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt else {
            scheduleReconfigure()
            return
        }
        let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
        guard options.contains(.shouldResume) else { return }
        scheduleReconfigure()
    }

    private func handleRouteChange(_ notification: Notification) {
        guard let reasonValue = notification.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue) else {
            scheduleReconfigure()
            return
        }

        switch reason {
        case .oldDeviceUnavailable, .newDeviceAvailable:
            VoiceSpeakerBleedCoordinator.shared.refreshRouteFromSession()
            AudioRateDiagnostics.logRouteChange(
                reason: reason,
                isCaptured: UIScreen.main.isCaptured,
                recordingEnabled: recordingEnabled,
                suppressed: false
            )
            scheduleReconfigure(alwaysNotify: true)
        case .categoryChange, .routeConfigurationChange, .override:
            let suppressed = AudioOutputFormatResolver.shouldSuppressRouteChange(
                reason: reason,
                withinSuppressionWindow: isWithinAutomaticReconfigureSuppression,
                currentSampleRate: AVAudioSession.sharedInstance().sampleRate,
                lastAppliedSampleRate: lastAppliedSampleRate
            )
            AudioRateDiagnostics.logRouteChange(
                reason: reason,
                isCaptured: UIScreen.main.isCaptured,
                recordingEnabled: recordingEnabled,
                suppressed: suppressed
            )
            if suppressed {
                return
            }
            scheduleReconfigure()
        default:
            break
        }
    }

    private func scheduleReconfigure(alwaysNotify: Bool = false) {
        pendingAlwaysNotify = pendingAlwaysNotify || alwaysNotify
        reconfigureWorkItem?.cancel()
        let work = DispatchWorkItem { [weak self] in
            guard let self else { return }
            let forceNotify = self.pendingAlwaysNotify
            self.pendingAlwaysNotify = false
            let didChange = self.configure(force: true)
            if didChange || forceNotify {
                NotificationCenter.default.post(name: Self.didReconfigureNotification, object: self)
            }
        }
        reconfigureWorkItem = work
        DispatchQueue.main.asyncAfter(deadline: .now() + Self.reconfigureDelay, execute: work)
    }
}
