import SwiftUI

/// ロビー / 結果モーダル。Web `drawLobbyOverlay` と等価のレイアウトで表示する。
struct EarTrainingResultView: View {
    @ObservedObject var controller: EarTrainingBattleController

    var body: some View {
        if controller.showLobbyControls {
            ZStack {
                Color.black.opacity(0.55).ignoresSafeArea()
                VStack(spacing: 14) {
                    titleLine
                    if let rankLine = controller.resultRankLine {
                        Text(rankLine)
                            .font(.system(size: 16, weight: .heavy))
                            .foregroundColor(rankColor)
                    }
                    if controller.gameState == .gameOver {
                        Text(controller.statusText)
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.white.opacity(0.86))
                    }
                    practiceToggle
                    Button(action: { controller.startBattle() }) {
                        Text(controller.startButtonLabel)
                            .font(.system(size: 17, weight: .heavy))
                            .foregroundColor(Color(hex: "0f172a"))
                            .padding(.horizontal, 28)
                            .padding(.vertical, 12)
                            .background(Color(hex: "facc15"))
                            .clipShape(Capsule())
                    }
                    Button(action: { controller.handleBack() }) {
                        Text(controller.hudLabels.lobbyBack)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.white.opacity(0.85))
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .overlay(
                                Capsule().stroke(Color.white.opacity(0.5), lineWidth: 1)
                            )
                    }
                    if let progressText = controller.lessonProgressText {
                        HStack(spacing: 4) {
                            if controller.lessonProgressStatus == .saving {
                                ProgressView()
                                    .progressViewStyle(.circular)
                                    .scaleEffect(0.6)
                                    .tint(.white)
                            }
                            Text(progressText)
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundColor(.white.opacity(0.85))
                        }
                    }
                }
                .padding(24)
                .frame(maxWidth: 320)
                .background(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(Color(hex: "0f172a").opacity(0.88))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(Color.white.opacity(0.18), lineWidth: 1)
                )
            }
        }
    }

    private var titleLine: some View {
        let text: String
        switch controller.resultState {
        case .win: text = controller.hudLabels.resultWin
        case .lose: text = controller.hudLabels.resultLose
        case .timeOver: text = controller.hudLabels.resultTimeOver
        case nil: text = controller.stage.localizedTitle(controller.isEnglishCopy ? .en : .ja)
        }
        return Text(text)
            .font(.system(size: 22, weight: .heavy))
            .foregroundColor(.white)
    }

    private var rankColor: Color {
        switch controller.lastRank {
        case .perfect: return Color(hex: "fde68a")
        case .great: return Color(hex: "bfdbfe")
        case .good: return Color(hex: "bbf7d0")
        case .fail: return Color(hex: "fca5a5")
        case nil: return .white
        }
    }

    private var practiceToggle: some View {
        Picker(controller.isEnglishCopy ? "Mode" : "モード", selection: practiceBinding) {
            Text(controller.hudLabels.battleMode).tag(false)
            Text(controller.hudLabels.practiceMode).tag(true)
        }
        .pickerStyle(.segmented)
        .frame(maxWidth: 220)
        .disabled(!controller.canChangePracticeMode)
    }

    private var practiceBinding: Binding<Bool> {
        Binding(
            get: { controller.practiceMode },
            set: { controller.setPracticeMode($0) }
        )
    }
}
