import SwiftUI

struct PlayMapContainerView: View {
    @EnvironmentObject var appState: AppState

    let initialMode: PlayMapMode

    @State private var mode: PlayMapMode

    init(initialMode: PlayMapMode) {
        self.initialMode = initialMode
        _mode = State(initialValue: initialMode)
    }

    var body: some View {
        Group {
            switch mode {
            case .codeRun:
                CodeRunWorldView(onSwitchMode: { mode = .defense })
            case .defense:
                DefenseDescentView(onSwitchMode: { mode = .codeRun })
            }
        }
        .navigationTitle(mode == .codeRun
            ? (appState.locale == .ja ? "コードラン" : "Code Run")
            : (appState.locale == .ja ? "フレーズディフェンス" : "Phrase Defense"))
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
    }
}
