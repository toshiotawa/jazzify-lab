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

            FantasyStageView()
                .tabItem {
                    Label(
                        locale == .ja ? "ファンタジー" : "Fantasy",
                        systemImage: "gamecontroller.fill"
                    )
                }
                .tag(Tab.fantasy)

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
    case fantasy
    case settings
}
