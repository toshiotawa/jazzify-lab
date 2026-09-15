import SwiftUI

struct DefenseFinishSummary: Equatable {
    let result: DefenseGameResult
    let surviveSec: Int
    let enemiesDefeated: Int
}

struct DefenseResultView: View {
    let stageTitle: String
    let summary: DefenseFinishSummary
    let locale: AppLocale
    let onRetry: () -> Void
    let onBackToMap: () -> Void

    var body: some View {
        ZStack {
            Color(hex: "09070f").ignoresSafeArea()
            VStack(spacing: 16) {
                Text(summary.result == .clear
                     ? (locale == .ja ? "クリア！" : "Clear!")
                     : (locale == .ja ? "ゲームオーバー" : "Game Over"))
                    .font(.largeTitle.bold())
                    .foregroundStyle(summary.result == .clear ? Color.green : Color.red)
                Text(stageTitle)
                    .font(.headline)
                    .foregroundStyle(.white)
                Text(locale == .ja
                     ? "生存 \(summary.surviveSec)秒 / 撃破 \(summary.enemiesDefeated)"
                     : "Survived \(summary.surviveSec)s / Defeated \(summary.enemiesDefeated)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                HStack(spacing: 12) {
                    Button(locale == .ja ? "もう一度" : "Retry", action: onRetry)
                        .buttonStyle(.bordered)
                    Button(locale == .ja ? "マップに戻る" : "Back to map", action: onBackToMap)
                        .buttonStyle(.borderedProminent)
                }
                .padding(.top, 8)
            }
            .padding(24)
        }
    }
}
