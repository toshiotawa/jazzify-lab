import SwiftUI

/// 風船ラッシュ上部 HUD（残り個数・残り秒・終了）。
struct BalloonRushHUDView: View {
    let timeLeftSec: Int
    let remainPop: Int
    let stageTitle: String
    let hintMode: Bool
    let locale: AppLocale
    let onExit: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(stageTitle)
                    .font(.caption.bold())
                    .foregroundStyle(.white)
                    .lineLimit(1)
                if hintMode {
                    Text(locale == .ja ? "練習（HINT）" : "Practice (HINT)")
                        .font(.caption2)
                        .foregroundStyle(Color(hex: "fde68a"))
                }
            }
            Spacer()
            Text(locale == .ja ? "残り \(remainPop) 個" : "\(remainPop) left")
                .font(.subheadline.bold())
                .foregroundStyle(Color(hex: "7dd3fc"))
            Text(String(format: locale == .ja ? "%d 秒" : "%ds", timeLeftSec))
                .font(.subheadline.bold())
                .foregroundStyle(.white)
                .monospacedDigit()
            Button(action: onExit) {
                Image(systemName: "xmark.circle.fill")
                    .font(.title2)
                    .foregroundStyle(.white.opacity(0.85))
            }
            .buttonStyle(.plain)
            .accessibilityLabel(locale == .ja ? "終了" : "Exit")
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(.black.opacity(0.55))
    }
}
