import SwiftUI

struct DefenseFinishSummary: Equatable {
    let result: DefenseGameResult
    let surviveSec: Int
    let enemiesDefeated: Int
    let starRank: Int?
    let endlessMode: Bool
    let improvedEndlessBest: Bool
}

struct DefenseResultView: View {
    let stageTitle: String
    let summary: DefenseFinishSummary
    let locale: AppLocale
    let nextStepLabel: String?
    let onNextStep: (() -> Void)?
    let onRetry: () -> Void
    let onBackToMap: () -> Void

    private var isStageCleared: Bool {
        summary.result == .clear || summary.endlessMode
    }

    private var titleText: String {
        if summary.endlessMode {
            return locale == .ja ? "エンドレス終了！" : "Endless Complete!"
        }
        if summary.result == .clear {
            return locale == .ja ? "クリア！" : "Clear!"
        }
        return locale == .ja ? "ゲームオーバー" : "Game Over"
    }

    private var titleColor: Color {
        if summary.endlessMode { return Color.yellow }
        return summary.result == .clear ? Color.green : Color.red
    }

    var body: some View {
        ZStack {
            Color(hex: "09070f").ignoresSafeArea()
            VStack(spacing: 16) {
                Text(titleText)
                    .font(.largeTitle.bold())
                    .foregroundStyle(titleColor)
                Text(stageTitle)
                    .font(.headline)
                    .foregroundStyle(.white)
                if let starRank = summary.starRank {
                    Text(DefenseCallResponseTier.formatStarRank(starRank))
                        .font(.title2)
                        .tracking(4)
                        .foregroundStyle(Color.yellow.opacity(0.9))
                }
                Text(locale == .ja
                     ? "生存 \(summary.surviveSec)秒 / 撃破 \(summary.enemiesDefeated)"
                     : "Survived \(summary.surviveSec)s / Defeated \(summary.enemiesDefeated)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                if summary.endlessMode {
                    HStack(spacing: 6) {
                        Text(locale == .ja
                             ? "エンドレス撃破数: \(summary.enemiesDefeated)"
                             : "Endless total KO: \(summary.enemiesDefeated)")
                            .font(.caption.bold())
                            .foregroundStyle(Color.indigo.opacity(0.9))
                        if summary.improvedEndlessBest {
                            Text(locale == .ja ? "自己ベスト更新！" : "New best!")
                                .font(.caption.bold())
                                .foregroundStyle(Color.yellow)
                        }
                    }
                }
                VStack(spacing: 12) {
                    if isStageCleared,
                       let nextStepLabel,
                       let onNextStep {
                        Button(nextStepLabel, action: onNextStep)
                            .buttonStyle(.borderedProminent)
                            .frame(maxWidth: .infinity)
                    }
                    if summary.result != .clear || summary.endlessMode {
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
