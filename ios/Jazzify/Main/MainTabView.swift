import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedTab: Tab = .top

    private var locale: AppLocale { appState.locale }

    var body: some View {
        TabView(selection: $selectedTab) {
            TopView()
                .tabItem {
                    Label(
                        locale == .ja ? "トップ" : "Top",
                        systemImage: "house.fill"
                    )
                }
                .tag(Tab.top)

            LessonListView()
                .tabItem {
                    Label(
                        locale == .ja ? "レッスン" : "Lessons",
                        systemImage: "book.fill"
                    )
                }
                .tag(Tab.lessons)

            SurvivalView()
                .tabItem {
                    Label(
                        locale == .ja ? "サバイバル" : "Survival",
                        systemImage: "flame.fill"
                    )
                }
                .tag(Tab.survival)

            SettingsView()
                .tabItem {
                    Label(
                        locale == .ja ? "設定" : "Settings",
                        systemImage: "gearshape.fill"
                    )
                }
                .tag(Tab.settings)
        }
        .tint(.purple)
    }
}

enum Tab: Hashable {
    case top
    case lessons
    case survival
    case settings
}
