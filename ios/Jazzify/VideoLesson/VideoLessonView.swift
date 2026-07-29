import AVFoundation
import AVKit
import SwiftUI

/// 動画視聴課題のネイティブ再生画面。
/// AVPlayerViewController（標準シークバー）+ 累積視聴ゲート + 手動完了。
struct VideoLessonView: View {
    let stage: VideoLessonStageSummary
    let lessonId: UUID
    let lessonSongId: UUID
    let clearConditions: LessonClearConditions?
    let locale: AppLocale
    let onClose: (_ cleared: Bool) -> Void

    @EnvironmentObject private var appState: AppState
    @State private var gateOpen = false
    @State private var progressDisplaySec: Double = 0
    @State private var mediaDurationSec: Double = 0
    @State private var completing = false
    @State private var completeError: String?
    @State private var assignmentStartRecorded = false
    @State private var playerHolder = VideoLessonPlayerHolder()

    private var videoURL: URL? {
        stage.resolvedVideoURL(locale: locale)
    }

    private var requiredRatio: Double {
        stage.effectiveRequiredWatchRatio
    }

    private var remainingSec: Double {
        guard mediaDurationSec > 0 else { return 0 }
        let needed = mediaDurationSec * requiredRatio
        return max(0, needed - progressDisplaySec)
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                if let url = videoURL {
                    VideoLessonAVPlayerRepresentable(
                        url: url,
                        holder: playerHolder,
                        onTick: handleTick,
                        onDuration: { duration in
                            mediaDurationSec = duration
                            reevaluateGate(duration: duration)
                        }
                    )
                    .frame(maxWidth: .infinity)
                    .aspectRatio(16 / 9, contentMode: .fit)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .background(Color.black)
                } else {
                    Text(locale == .ja ? "動画 URL がありません。" : "Video URL is missing.")
                        .foregroundStyle(.red)
                        .padding()
                }

                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text(locale == .ja ? "視聴進捗" : "Watch progress")
                        Spacer()
                        if mediaDurationSec > 0 {
                            Text("\(Int(min(100, (progressDisplaySec / mediaDurationSec) * 100)))%")
                        } else {
                            Text("—")
                        }
                    }
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                    if gateOpen {
                        Text(locale == .ja ? "完了できます" : "Ready to complete")
                            .font(.caption)
                            .foregroundStyle(.green)
                    } else if mediaDurationSec > 0 {
                        Text(
                            locale == .ja
                                ? "完了まであと約\(Int(ceil(remainingSec)))秒"
                                : "About \(Int(ceil(remainingSec)))s left to unlock Complete"
                        )
                        .font(.caption)
                        .foregroundStyle(.orange)
                    }

                    if let completeError {
                        Text(completeError)
                            .font(.caption)
                            .foregroundStyle(.red)
                    }

                    Button {
                        Task { await completeTask() }
                    } label: {
                        Text(
                            completing
                                ? (locale == .ja ? "保存中…" : "Saving…")
                                : (locale == .ja ? "課題を完了する" : "Mark task complete")
                        )
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(!gateOpen || completing || videoURL == nil)
                }
                .padding(.horizontal)

                Spacer(minLength: 0)
            }
            .padding()
            .navigationTitle(stage.localizedTitle(locale))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(locale == .ja ? "戻る" : "Back") {
                        persistPosition()
                        onClose(false)
                    }
                }
            }
        }
        .onAppear {
            configureAudioSession()
            UIApplication.shared.isIdleTimerDisabled = true
            recordAssignmentStartIfNeeded()
            restorePositionIfNeeded()
        }
        .onDisappear {
            UIApplication.shared.isIdleTimerDisabled = false
            persistPosition()
            playerHolder.pause()
        }
    }

    private func handleTick(currentTime: Double) {
        let next = VideoLessonWatchGate.accumulate(
            prevWatched: playerHolder.watchedSec,
            lastTime: playerHolder.lastTime,
            currentTime: currentTime
        )
        playerHolder.watchedSec = next.watched
        playerHolder.lastTime = next.lastTime
        progressDisplaySec = playerHolder.watchedSec
        reevaluateGate(duration: mediaDurationSec)
        let now = Date().timeIntervalSince1970
        if now - playerHolder.lastPersistAt >= 5 {
            playerHolder.lastPersistAt = now
            persistPosition(currentTime: currentTime)
        }
    }

    private func reevaluateGate(duration: Double) {
        if VideoLessonWatchGate.isSatisfied(
            watchedSec: playerHolder.watchedSec,
            durationSec: duration,
            requiredRatio: requiredRatio
        ) {
            gateOpen = true
        }
    }

    private func positionKey() -> String {
        "video_lesson_pos:\(lessonSongId.uuidString):\(stage.resolvedLocaleKey(locale: locale))"
    }

    private func restorePositionIfNeeded() {
        let stored = UserDefaults.standard.double(forKey: positionKey())
        guard stored > 0 else { return }
        playerHolder.pendingSeek = stored
    }

    private func persistPosition(currentTime: Double? = nil) {
        let t = currentTime ?? playerHolder.lastTime
        guard t > 0 else { return }
        UserDefaults.standard.set(t, forKey: positionKey())
    }

    private func configureAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .moviePlayback)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            // ignore
        }
    }

    private func recordAssignmentStartIfNeeded() {
        guard !assignmentStartRecorded, let userId = appState.profile?.id else { return }
        assignmentStartRecorded = true
        AnalyticsTracker.trackAssignmentStart(
            userId: userId,
            lessonId: lessonId,
            lessonSongId: lessonSongId,
            isPractice: false
        )
    }

    @MainActor
    private func completeTask() async {
        guard gateOpen, !completing else { return }
        completing = true
        completeError = nil
        do {
            let ok = try await SupabaseService.shared.recordVideoLessonProgress(
                lessonId: lessonId,
                lessonSongId: lessonSongId,
                clearConditions: clearConditions
            )
            if ok {
                persistPosition()
                onClose(true)
            } else {
                completeError = locale == .ja
                    ? "課題を完了として記録できませんでした。"
                    : "Could not mark the task as complete."
            }
        } catch {
            completeError = locale == .ja
                ? "進捗の保存に失敗しました。"
                : "Failed to save progress."
        }
        completing = false
    }
}

enum VideoLessonWatchGate {
    static let continuousDeltaMax: Double = 1.25

    static func accumulate(
        prevWatched: Double,
        lastTime: Double,
        currentTime: Double
    ) -> (watched: Double, lastTime: Double) {
        guard currentTime.isFinite, currentTime >= 0 else {
            return (prevWatched, lastTime)
        }
        guard lastTime.isFinite, lastTime >= 0 else {
            return (prevWatched, currentTime)
        }
        let delta = currentTime - lastTime
        if delta > 0, delta <= continuousDeltaMax {
            return (prevWatched + delta, currentTime)
        }
        return (prevWatched, currentTime)
    }

    static func isSatisfied(watchedSec: Double, durationSec: Double, requiredRatio: Double) -> Bool {
        guard watchedSec.isFinite, watchedSec >= 0 else { return false }
        guard durationSec.isFinite, durationSec > 0 else { return false }
        let ratio = min(1, max(0.5, requiredRatio.isFinite ? requiredRatio : 0.9))
        return watchedSec >= durationSec * ratio
    }
}

@MainActor
final class VideoLessonPlayerHolder {
    var watchedSec: Double = 0
    var lastTime: Double = 0
    var lastPersistAt: Double = 0
    var pendingSeek: Double?
    weak var player: AVPlayer?

    func pause() {
        player?.pause()
    }
}

private struct VideoLessonAVPlayerRepresentable: UIViewControllerRepresentable {
    let url: URL
    let holder: VideoLessonPlayerHolder
    let onTick: (Double) -> Void
    let onDuration: (Double) -> Void

    func makeUIViewController(context: Context) -> AVPlayerViewController {
        let controller = AVPlayerViewController()
        let player = AVPlayer(url: url)
        controller.player = player
        holder.player = player
        context.coordinator.observe(player: player, holder: holder, onTick: onTick, onDuration: onDuration)
        player.play()
        return controller
    }

    func updateUIViewController(_ uiViewController: AVPlayerViewController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    final class Coordinator {
        private var timeObserver: Any?
        private weak var observedPlayer: AVPlayer?
        private var durationObservation: NSKeyValueObservation?

        func observe(
            player: AVPlayer,
            holder: VideoLessonPlayerHolder,
            onTick: @escaping (Double) -> Void,
            onDuration: @escaping (Double) -> Void
        ) {
            observedPlayer = player
            let interval = CMTime(seconds: 0.5, preferredTimescale: 600)
            timeObserver = player.addPeriodicTimeObserver(forInterval: interval, queue: .main) { time in
                let seconds = time.seconds
                guard seconds.isFinite else { return }
                if let seek = holder.pendingSeek {
                    holder.pendingSeek = nil
                    let seekTime = CMTime(seconds: seek, preferredTimescale: 600)
                    player.seek(to: seekTime, toleranceBefore: .zero, toleranceAfter: .zero) { _ in
                        holder.lastTime = seek
                        onTick(seek)
                    }
                    return
                }
                onTick(seconds)
            }

            durationObservation = player.currentItem?.observe(\.status, options: [.new]) { item, _ in
                if item.status == .readyToPlay {
                    let duration = item.duration.seconds
                    if duration.isFinite, duration > 0 {
                        DispatchQueue.main.async {
                            onDuration(duration)
                        }
                    }
                }
            }
        }

        deinit {
            if let timeObserver, let player = observedPlayer {
                player.removeTimeObserver(timeObserver)
            }
            durationObservation?.invalidate()
        }
    }
}
