import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedTab: Tab = .top

    private var locale: AppLocale { appState.locale }

    var body: some View {
        ZStack {
            TabView(selection: $selectedTab) {
                TopView()
                    .tabItem {
                        Label(
                            locale == .ja ? "トップ" : "Top",
                            systemImage: "house.fill"
                        )
                    }
                    .tag(Tab.top)

                CourseListView()
                    .tabItem {
                        Label(
                            locale == .ja ? "クエスト" : "Quest",
                            systemImage: "book.fill"
                        )
                    }
                    .tag(Tab.quest)

                PlayHubView()
                    .tabItem {
                        Label(
                            locale == .ja ? "プレイ" : "Play",
                            systemImage: "gamecontroller.fill"
                        )
                    }
                    .tag(Tab.play)

                TrainingListView()
                    .tabItem {
                        Label(
                            locale == .ja ? "トレーニング" : "Training",
                            systemImage: "figure.strengthtraining.traditional"
                        )
                    }
                    .tag(Tab.training)

                SettingsView()
                    .tabItem {
                        Label(
                            locale == .ja ? "アカウント" : "Account",
                            systemImage: "person.crop.circle.fill"
                        )
                    }
                    .tag(Tab.account)
            }
            .tint(.purple)

            // アプリ全体で 1 箇所のみ。子画面（LessonDetailView / SurvivalGameView 等）に重ねるとトーストが二重表示になる。
            PlayerXpToastOverlay()
        }
    }
}

enum Tab: Hashable {
    case top
    case quest
    case play
    case training
    case account
}
