import SwiftUI

/// ロビー / 結果モーダル。Web `drawLobbyOverlay` と等価のレイアウトで表示する。
struct EarTrainingResultView<Host: EarTrainingLobbyPresentable>: View {
    @ObservedObject var host: Host

    var body: some View {
        if host.showLobbyControls {
            ZStack {
                Color.black.opacity(0.55).ignoresSafeArea()
                VStack(spacing: 14) {
                    titleLine
                    if let rankLine = host.resultRankLine {
                        Text(rankLine)
                            .font(.system(size: 16, weight: .heavy))
                            .foregroundColor(rankColor)
                    }
                    if host.gameState == .gameOver {
                        Text(host.statusText)
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.white.opacity(0.86))
                    }
                    practiceToggle
                    Button(action: { host.startBattle() }) {
                        Text(host.startButtonLabel)
                            .font(.system(size: 17, weight: .heavy))
                            .foregroundColor(Color(hex: "0f172a"))
                            .padding(.horizontal, 28)
                            .padding(.vertical, 12)
                            .background(Color(hex: "facc15"))
                            .clipShape(Capsule())
                    }
                    Button(action: { host.handleBack() }) {
                        Text(host.hudLabels.lobbyBack)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.white.opacity(0.85))
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .overlay(
                                Capsule().stroke(Color.white.opacity(0.5), lineWidth: 1)
                            )
                    }
                    if let progressText = host.lessonProgressText {
                        HStack(spacing: 4) {
                            if host.lessonProgressStatus == .saving {
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
        switch host.resultState {
        case .win: text = host.hudLabels.resultWin
        case .lose: text = host.hudLabels.resultLose
        case .timeOver: text = host.hudLabels.resultTimeOver
        case nil: text = host.stageTitleForLobby
        }
        return Text(text)
            .font(.system(size: 22, weight: .heavy))
            .foregroundColor(.white)
    }

    private var rankColor: Color {
        switch host.lastRank {
        case .perfect: return Color(hex: "fde68a")
        case .great: return Color(hex: "bfdbfe")
        case .good: return Color(hex: "bbf7d0")
        case .fail: return Color(hex: "fca5a5")
        case nil: return .white
        }
    }

    private var practiceToggle: some View {
        Picker(host.isEnglishCopy ? "Mode" : "モード", selection: practiceBinding) {
            Text(host.hudLabels.battleMode).tag(false)
            Text(host.hudLabels.practiceMode).tag(true)
        }
        .pickerStyle(.segmented)
        .frame(maxWidth: 220)
        .disabled(!host.canChangePracticeMode)
    }

    private var practiceBinding: Binding<Bool> {
        Binding(
            get: { host.practiceMode },
            set: { host.setPracticeMode($0) }
        )
    }
}
