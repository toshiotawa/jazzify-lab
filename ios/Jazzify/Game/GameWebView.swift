import SwiftUI
import WebKit

enum GameMode {
    case demoLP
    case demoFantasy
    case fantasy(stageNumber: String)
    case lesson(lessonId: UUID)
    case song(songId: String)
    case practice(songId: String)

    var queryParameters: String {
        var params = "platform=ios"
        switch self {
        case .demoLP:
            params += "&mode=demo-lp"
        case .demoFantasy:
            params += "&mode=demo-fantasy&stage=1-1"
        case .fantasy(let stageNumber):
            params += "&mode=fantasy&stage=\(stageNumber)"
        case .lesson(let lessonId):
            params += "&mode=play-lesson&lessonId=\(lessonId.uuidString)"
        case .song(let songId):
            params += "&mode=songs&songId=\(songId)"
        case .practice(let songId):
            params += "&mode=practice&songId=\(songId)"
        }
        return params
    }
}

struct GameWebView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) private var dismiss
    @StateObject private var coordinator = WebViewCoordinator()

    let mode: GameMode
    let locale: AppLocale
    var authToken: String?

    init(mode: GameMode, locale: AppLocale, authToken: String? = nil) {
        self.mode = mode
        self.locale = locale
        self.authToken = authToken
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            WebViewRepresentable(
                url: buildURL(),
                coordinator: coordinator,
                authToken: authToken
            )
            .ignoresSafeArea()

            VStack {
                HStack {
                    Spacer()
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title2)
                            .foregroundStyle(.white.opacity(0.7))
                            .padding(12)
                    }
                }
                Spacer()
            }
        }
        .onAppear {
            coordinator.onGameEnd = { dismiss() }
            coordinator.onScoreReport = { score in
                // future: handle score reports from game
            }
            coordinator.midiManager = MIDIManager.shared
        }
        .statusBarHidden()
    }

    private func buildURL() -> URL {
        let base = Config.webAppBaseURL
        var components = URLComponents(url: base.appendingPathComponent("main"), resolvingAgainstBaseURL: false)!
        let queryString = mode.queryParameters + "&lang=\(locale.rawValue)"
        components.query = queryString
        return components.url ?? base
    }
}

struct WebViewRepresentable: UIViewRepresentable {
    let url: URL
    let coordinator: WebViewCoordinator
    let authToken: String?

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        let userContent = config.userContentController
        userContent.add(coordinator, name: "gameCallback")
        userContent.add(coordinator, name: "midiRequest")

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = .black
        webView.scrollView.isScrollEnabled = false
        webView.navigationDelegate = coordinator
        webView.allowsBackForwardNavigationGestures = false

        coordinator.webView = webView

        if let token = authToken {
            injectAuthToken(webView: webView, token: token)
        }

        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    private func injectAuthToken(webView: WKWebView, token: String) {
        let script = WKUserScript(
            source: "window.__NATIVE_AUTH_TOKEN__ = '\(token)';",
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        webView.configuration.userContentController.addUserScript(script)
    }
}
