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

    var queryItems: [URLQueryItem] {
        var items = [URLQueryItem(name: "platform", value: "ios")]
        switch self {
        case .demoLP:
            items.append(URLQueryItem(name: "mode", value: "demo-lp"))
        case .demoFantasy:
            items.append(URLQueryItem(name: "mode", value: "demo-fantasy"))
            items.append(URLQueryItem(name: "stage", value: "1-1"))
        case .fantasy(let stageNumber):
            items.append(URLQueryItem(name: "mode", value: "fantasy"))
            items.append(URLQueryItem(name: "stage", value: stageNumber))
        case .survival(let difficulty, let characterId):
            items.append(URLQueryItem(name: "mode", value: "survival"))
            items.append(URLQueryItem(name: "difficulty", value: difficulty))
            items.append(URLQueryItem(name: "characterId", value: characterId))
        case .survivalStage(let stageNumber, let characterId):
            items.append(URLQueryItem(name: "mode", value: "survival"))
            items.append(URLQueryItem(name: "stageNumber", value: String(stageNumber)))
            items.append(URLQueryItem(name: "characterId", value: characterId))
        case .lesson(let lessonId):
            items.append(URLQueryItem(name: "mode", value: "play-lesson"))
            items.append(URLQueryItem(name: "lessonId", value: lessonId.uuidString))
        case .song(let songId):
            items.append(URLQueryItem(name: "mode", value: "songs"))
            items.append(URLQueryItem(name: "songId", value: songId))
        case .practice(let songId):
            items.append(URLQueryItem(name: "mode", value: "practice"))
            items.append(URLQueryItem(name: "songId", value: songId))
        case .webPage:
            items.append(URLQueryItem(name: "mode", value: "web-page"))
        case .dailyChallenge(let difficulty):
            items.append(URLQueryItem(name: "mode", value: "daily-challenge"))
            items.append(URLQueryItem(name: "difficulty", value: difficulty))
        }
        return items
    }

    var hashFragment: String? {
        switch self {
        case .demoLP:
            return "ios?platform=ios&mode=demo-lp"
        case .demoFantasy:
            return "ios?platform=ios&mode=demo-fantasy&stage=1-1"
        case .fantasy(let stageNumber):
            return "ios?platform=ios&mode=fantasy&stage=\(stageNumber)"
        case .survival(let difficulty, let characterId):
            return "ios?platform=ios&mode=survival&difficulty=\(difficulty)&characterId=\(characterId)"
        case .survivalStage(let stageNumber, let characterId):
            return "ios?platform=ios&mode=survival&stageNumber=\(stageNumber)&characterId=\(characterId)"
        case .lesson(let lessonId):
            return "ios?platform=ios&mode=play-lesson&lessonId=\(lessonId.uuidString)"
        case .song(let songId):
            return "ios?platform=ios&mode=songs&songId=\(songId)"
        case .practice(let songId):
            return "ios?platform=ios&mode=practice&songId=\(songId)"
        case .webPage(let hash):
            return hash
        case .dailyChallenge(let difficulty):
            return "ios?platform=ios&mode=daily-challenge&difficulty=\(difficulty)"
        }
    }
}

struct GameWebView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) private var dismiss
    @StateObject private var coordinator = WebViewCoordinator()

    let mode: GameMode
    let locale: AppLocale
    var onClose: (() -> Void)?
    @State private var resolvedToken: String?
    @State private var tokenReady = false

    private var isDemoMode: Bool {
        switch mode {
        case .demoLP, .demoFantasy: return true
        default: return false
        }
    }

    init(mode: GameMode, locale: AppLocale, authToken: String? = nil, onClose: (() -> Void)? = nil) {
        self.mode = mode
        self.locale = locale
        self.onClose = onClose
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

        }
        .task {
            if !isDemoMode && resolvedToken == nil {
                resolvedToken = try? await SupabaseService.shared.accessToken()
            }
            tokenReady = true
        }
        .onAppear {
            coordinator.onScoreReport = { _score in }
            coordinator.midiManager = MIDIManager.shared
        }
        .onChange(of: coordinator.shouldDismiss) { shouldDismiss in
            if shouldDismiss {
                onClose?()
                dismiss()
            }
        }
        .statusBarHidden()
    }

    private func buildURL() -> URL {
        let base = Config.webAppBaseURL
        var components = URLComponents(url: base.appendingPathComponent("main"), resolvingAgainstBaseURL: false)!
        var items = mode.queryItems
        items.append(URLQueryItem(name: "lang", value: locale.rawValue))
        components.queryItems = items
        if let hash = mode.hashFragment {
            components.percentEncodedFragment = hash
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
