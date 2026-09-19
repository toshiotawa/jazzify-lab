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
    let nextStepLabel: String?
    let onNextStep: (() -> Void)?
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
                VStack(spacing: 12) {
                    if summary.result == .clear,
                       let nextStepLabel,
                       let onNextStep {
                        Button(nextStepLabel, action: onNextStep)
                            .buttonStyle(.borderedProminent)
                            .frame(maxWidth: .infinity)
                    }
                    if summary.result != .clear {
                        Button(locale == .ja ? "もう一度" : "Retry", action: onRetry)
                            .buttonStyle(.bordered)
                            .frame(maxWidth: .infinity)
                    }
                    Button(locale == .ja ? "マップに戻る" : "Back to map", action: onBackToMap)
                        .buttonStyle(.bordered)
                        .frame(maxWidth: .infinity)
                }
                .padding(.top, 8)
            }
            .padding(24)
        }
    }
}
