import SwiftUI

/// ロード進捗バーの表示用定数。実ロードは待たず、完了後の 100% 演出だけ短く待つ。
enum EarTrainingLoadProgress {
    static let started = 0.12
    static let stageLoaded = 0.48
    static let audioReady = 0.74
    static let controllerReady = 0.9

    static let stepAnimationDuration: Double = 0.18
    static let fillAnimationDuration: Double = 0.22
    /// 実処理完了後に 100% を見せる時間（塗り + ごく短い停留）。
    static let completionHoldNanoseconds: UInt64 = 270_000_000
    static let scoreCompleteHoldNanoseconds: UInt64 = 180_000_000

    static func clamped(_ value: Double) -> Double {
        min(1, max(0, value))
    }

    /// 表示進捗は後退させない。完了時は必ず 1。
    static func displayedProgress(current: Double, target: Double, isComplete: Bool) -> Double {
        if isComplete {
            return 1
        }
        return max(clamped(current), clamped(target))
    }
}

/// 耳コピバトル／精密モード向けの線形ロード進捗バー。
struct EarTrainingLoadProgressBar: View {
    /// 0...1。nil のときは不定（線形スタイルのスピナー相当）。
    var progress: Double?
    var tint: Color = .yellow
    var maxWidth: CGFloat = 220

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(tint.opacity(0.22))
                if let progress {
                    Capsule()
                        .fill(tint)
                        .frame(
                            width: max(0, geo.size.width * CGFloat(EarTrainingLoadProgress.clamped(progress)))
                        )
                } else {
                    ProgressView()
                        .progressViewStyle(.linear)
                        .tint(tint)
                }
            }
        }
        .frame(height: 8)
        .frame(maxWidth: maxWidth)
        .animation(
            .easeOut(duration: EarTrainingLoadProgress.stepAnimationDuration),
            value: progress ?? -1
        )
    }
}

/// テキスト + 進捗バーの小さなオーバーレイ。
struct EarTrainingScoreLoadingOverlay: View {
    let message: String
    var progress: Double?

    var body: some View {
        VStack(spacing: 10) {
            Text(message)
                .font(.caption)
                .foregroundStyle(.white.opacity(0.75))
                .multilineTextAlignment(.center)
            EarTrainingLoadProgressBar(progress: progress, tint: .white)
        }
        .padding(.horizontal, 18)
    }
}

/// バトル準備中の全画面バー。実ロード完了後に 100% まで塗ってから閉じる。
struct EarTrainingPreparingOverlay: View {
    let message: String
    var targetProgress: Double
    var isWorkComplete: Bool
    var background: Color = .black
    var barTint: Color = .yellow
    var onVisualComplete: () -> Void

    @State private var displayedProgress: Double = 0
    @State private var didNotifyVisualComplete = false

    var body: some View {
        VStack(spacing: 12) {
            EarTrainingLoadProgressBar(progress: displayedProgress, tint: barTint)
            Text(message)
                .font(.caption)
                .foregroundStyle(.white.opacity(0.8))
                .multilineTextAlignment(.center)
        }
        .padding(.horizontal, 24)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(background.ignoresSafeArea())
        .onAppear {
            applyTarget(animated: true)
        }
        .onChange(of: targetProgress) { _ in
            applyTarget(animated: true)
        }
        .task(id: isWorkComplete) {
            guard isWorkComplete else { return }
            withAnimation(.easeOut(duration: EarTrainingLoadProgress.fillAnimationDuration)) {
                displayedProgress = 1
            }
            try? await Task.sleep(nanoseconds: EarTrainingLoadProgress.completionHoldNanoseconds)
            guard !Task.isCancelled, !didNotifyVisualComplete else { return }
            didNotifyVisualComplete = true
            onVisualComplete()
        }
    }

    private func applyTarget(animated: Bool) {
        let rawTarget = targetProgress > 0 ? targetProgress : EarTrainingLoadProgress.started
        let next = EarTrainingLoadProgress.displayedProgress(
            current: displayedProgress,
            target: rawTarget,
            isComplete: isWorkComplete
        )
        if animated {
            withAnimation(.easeOut(duration: EarTrainingLoadProgress.stepAnimationDuration)) {
                displayedProgress = next
            }
        } else {
            displayedProgress = next
        }
    }
}
