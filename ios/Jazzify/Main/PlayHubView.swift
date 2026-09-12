import SwiftUI

private enum PlayHubDestination: Hashable {
    case codeRun
    case defense
}

struct PlayHubView: View {
    @EnvironmentObject var appState: AppState
    @State private var destination: PlayHubDestination?

    private var locale: AppLocale { appState.locale }
    private var isEnglishCopy: Bool { locale == .en }

    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [Color(hex: "020617"), Color(hex: "1e1b4b"), Color(hex: "020617")],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        Text(isEnglishCopy ? "Play" : "プレイ")
                            .font(.title.bold())
                            .foregroundStyle(.white)

                        Text(isEnglishCopy
                             ? "Practice chords and phrases in dedicated game modes."
                             : "コードとフレーズを専用モードで練習しましょう。")
                            .font(.subheadline)
                            .foregroundStyle(.gray)

                        playModeCard(
                            title: isEnglishCopy ? "Code Run" : "コードラン",
                            description: isEnglishCopy
                                ? "Side-scrolling action: complete chords to jump toward the goal. Auto-run only."
                                : "横スクロールアクション。コード完成でジャンプしてゴールを目指します（オート操作）。",
                            accent: [Color(hex: "92400e"), Color(hex: "7c2d12")],
                            border: Color(hex: "f59e0b").opacity(0.4)
                        ) {
                            destination = .codeRun
                        }

                        playModeCard(
                            title: isEnglishCopy ? "Phrase Defense" : "フレーズディフェンス",
                            description: isEnglishCopy
                                ? "Play notated phrases to slash enemies and survive until the timer ends."
                                : "譜面のフレーズを演奏して敵を倒し、制限時間まで生き残ります。",
                            accent: [Color(hex: "064e3b"), Color(hex: "134e4a")],
                            border: Color(hex: "34d399").opacity(0.4)
                        ) {
                            destination = .defense
                        }
                    }
                    .padding()
                }
            }
            .navigationBarHidden(true)
            .navigationDestination(item: $destination) { dest in
                switch dest {
                case .codeRun:
                    CodeRunWorldView()
                case .defense:
                    DefenseDescentView()
                }
            }
        }
    }

    private func playModeCard(
        title: String,
        description: String,
        accent: [Color],
        border: Color,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 8) {
                Text(title)
                    .font(.title3.bold())
                    .foregroundStyle(.white)
                Text(description)
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.82))
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(20)
            .background(
                LinearGradient(colors: accent, startPoint: .leading, endPoint: .trailing)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(border, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(.plain)
    }
}
