import SwiftUI
import WebKit

enum GameMode {
    case demoLP
    case demoFantasy
    case fantasy(stageNumber: String)
    case survival(difficulty: String, characterId: String)
    case survivalStage(stageNumber: Int, characterId: String)
    case lesson(lessonId: UUID)
    case song(songId: String)
    case practice(songId: String)
    case webPage(hash: String)
    case dailyChallenge(difficulty: String)

    var queryParameters: String {
        var params = "platform=ios"
        switch self {
        case .demoLP:
            params += "&mode=demo-lp"
        case .demoFantasy:
            params += "&mode=demo-fantasy&stage=1-1"
        case .fantasy(let stageNumber):
            params += "&mode=fantasy&stage=\(stageNumber)"
        case .survival(let difficulty, let characterId):
            params += "&mode=survival&difficulty=\(difficulty)&characterId=\(characterId)"
        case .survivalStage(let stageNumber, let characterId):
            params += "&mode=survival&stageNumber=\(stageNumber)&characterId=\(characterId)"
        case .lesson(let lessonId):
            params += "&mode=play-lesson&lessonId=\(lessonId.uuidString)"
        case .song(let songId):
            params += "&mode=songs&songId=\(songId)"
        case .practice(let songId):
            params += "&mode=practice&songId=\(songId)"
        case .webPage:
            params += "&mode=web-page"
        case .dailyChallenge(let difficulty):
            params += "&mode=daily-challenge&difficulty=\(difficulty)"
        }
        return params
    }

    var hashFragment: String? {
        switch self {
        case .webPage(let hash): return hash
        case .dailyChallenge(let difficulty): return "daily-challenge?difficulty=\(difficulty)"
        default: return nil
        }
    }
}

struct GameWebView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) private var dismiss
    @StateObject private var coordinator = WebViewCoordinator()

    let mode: GameMode
    let locale: AppLocale
    @State private var resolvedToken: String?
    @State private var tokenReady = false

    private var isDemoMode: Bool {
        switch mode {
        case .demoLP, .demoFantasy: return true
        default: return false
        }
    }

    init(mode: GameMode, locale: AppLocale, authToken: String? = nil) {
        self.mode = mode
        self.locale = locale
        self._resolvedToken = State(initialValue: authToken)
        self._tokenReady = State(initialValue: authToken != nil)
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            if tokenReady || isDemoMode {
                WebViewRepresentable(
                    url: buildURL(),
                    coordinator: coordinator,
                    authToken: resolvedToken
                )
                .ignoresSafeArea()
            } else {
                ProgressView()
                    .tint(.purple)
            }

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
        .task {
            if !isDemoMode && resolvedToken == nil {
                resolvedToken = try? await SupabaseService.shared.accessToken()
            }
            tokenReady = true
        }
        .onAppear {
            coordinator.onGameEnd = { dismiss() }
            coordinator.onScoreReport = { _score in }
            coordinator.midiManager = MIDIManager.shared
        }
        .statusBarHidden()
    }

    private func buildURL() -> URL {
        let base = Config.webAppBaseURL
        var components = URLComponents(url: base.appendingPathComponent("main"), resolvingAgainstBaseURL: false)!
        let queryString = mode.queryParameters + "&lang=\(locale.rawValue)"
        components.query = queryString
        if let hash = mode.hashFragment {
            components.fragment = hash
        }
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
