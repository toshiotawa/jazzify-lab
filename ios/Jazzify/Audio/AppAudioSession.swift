import AVFoundation
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
    /// 画面録画・ミラーリング中のみ要求する IO バッファ（40ms）。録画 CPU 負荷下のアンダーラン耐性向上。
    private static let capturedIOBufferDuration: TimeInterval = 0.04
    /// 画面キャプチャ / ルート変更後、オーディオ経路が落ち着くまで待つ秒数。
    private static let reconfigureDelay: TimeInterval = 0.15

    private var lastAppliedIOBufferDuration: TimeInterval?
    private var lastAppliedSampleRate: Double?
    private var reconfigureWorkItem: DispatchWorkItem?
    private var captureObserver: NSObjectProtocol?
    private var routeChangeObserver: NSObjectProtocol?
    private var mediaServicesResetObserver: NSObjectProtocol?
    private var hasStarted = false

    private init() {}

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

        let categoryMatches = session.category == .playback
        let optionsMatch = session.categoryOptions.contains(.mixWithOthers)
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

        try? session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
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
        UIScreen.main.isCaptured ? Self.capturedIOBufferDuration : Self.normalIOBufferDuration
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
        ) { [weak self] _ in
            self?.scheduleReconfigure()
        }

        mediaServicesResetObserver = center.addObserver(
            forName: AVAudioSession.mediaServicesWereResetNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.scheduleReconfigure()
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
