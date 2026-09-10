import SwiftUI

private enum PlayHubSegment: String, CaseIterable, Identifiable {
    case survival
    case training

    var id: String { rawValue }

    func title(locale: AppLocale) -> String {
        switch self {
        case .survival:
            return locale == .ja ? "サバイバル" : "Survival"
        case .training:
            return locale == .ja ? "トレーニング" : "Training"
        }
    }
}

struct PlayHubView: View {
    @EnvironmentObject var appState: AppState
    @State private var segment: PlayHubSegment = .survival

    private var locale: AppLocale { appState.locale }

    var body: some View {
        VStack(spacing: 0) {
            Picker("", selection: $segment) {
                ForEach(PlayHubSegment.allCases) { item in
                    Text(item.title(locale: locale)).tag(item)
                }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)
            .padding(.top, 8)
            .padding(.bottom, 4)

            switch segment {
            case .survival:
                SurvivalView()
            case .training:
                TrainingListView()
            }
        }
    }
}
