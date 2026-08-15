import SwiftUI

/// 耳コピバトル／精密モード向けの線形ロード進捗バー。
struct EarTrainingLoadProgressBar: View {
    /// 0...1。nil のときは不定（線形スタイルのスピナー相当）。
    var progress: Double?
    var tint: Color = .yellow
    var maxWidth: CGFloat = 220

    var body: some View {
        Group {
            if let progress {
                ProgressView(value: min(1, max(0, progress)), total: 1.0)
            } else {
                ProgressView()
            }
        }
        .progressViewStyle(.linear)
        .tint(tint)
        .frame(maxWidth: maxWidth)
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
