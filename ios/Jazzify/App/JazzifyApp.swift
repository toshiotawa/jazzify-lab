import SwiftUI

@main
struct JazzifyApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
                .task {
                    await appState.bootstrap()
                }
        }
    }
}

struct RootView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        Group {
            switch appState.authState {
            case .loading:
                LaunchScreenView()
            case .unauthenticated:
                LoginView()
            case .authenticated:
                MainTabView()
            }
        }
        .animation(.easeInOut(duration: 0.3), value: appState.authState)
    }
}

struct LaunchScreenView: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "0f172a"), .black],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 16) {
                Image(systemName: "music.note")
                    .font(.system(size: 60))
                    .foregroundStyle(.purple)
                Text("Jazzify")
                    .font(.largeTitle.bold())
                    .foregroundStyle(.white)
                ProgressView()
                    .tint(.purple)
            }
        }
    }
}

struct FeatureInfoModal: View {
    @Environment(\.dismiss) private var dismiss

    let icon: String
    let iconColor: Color
    let title: String
    let description: String
    let locale: AppLocale

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: icon)
                .font(.system(size: 44))
                .foregroundStyle(iconColor)

            Text(title)
                .font(.title2.bold())
                .foregroundStyle(.white)

            Text(description)
                .font(.body)
                .foregroundStyle(Color(hex: "d1d5db"))
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)

            Spacer()

            Button {
                dismiss()
            } label: {
                Text(locale == .ja ? "閉じる" : "Close")
                    .font(.headline)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color(hex: "334155"))
                    .cornerRadius(12)
            }
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(hex: "0f172a"))
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: .alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b, a: UInt64
        switch hex.count {
        case 6:
            (r, g, b, a) = (int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF, 255)
        case 8:
            (r, g, b, a) = (int >> 24 & 0xFF, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (r, g, b, a) = (0, 0, 0, 255)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
