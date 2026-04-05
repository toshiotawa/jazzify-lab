import SwiftUI
import UIKit
import WebKit

enum GameMode {
    case demoLP
    case demoFantasy
    case fantasy(stageNumber: String)
    case survival(difficulty: String, characterId: String)
    case survivalStage(stageNumber: Int, characterId: String, hintMode: Bool = false)
    case lesson(lessonId: UUID)
    case song(songId: String)
    case practice(songId: String)
    case webPage(hash: String)
    case dailyChallenge(difficulty: String)

    var preferredOrientations: UIInterfaceOrientationMask {
        return .portrait
    }

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
        case .survivalStage(let stageNumber, let characterId, let hintMode):
            items.append(URLQueryItem(name: "mode", value: "survival"))
            items.append(URLQueryItem(name: "stageNumber", value: String(stageNumber)))
            items.append(URLQueryItem(name: "characterId", value: characterId))
            if hintMode {
                items.append(URLQueryItem(name: "hintMode", value: "true"))
            }
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
        case .survivalStage(let stageNumber, let characterId, let hintMode):
            let base = "ios?platform=ios&mode=survival&stageNumber=\(stageNumber)&characterId=\(characterId)"
            return hintMode ? "\(base)&hintMode=true" : base
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
    /// `MIDIManager.onMIDIEvent` を `WebViewCoordinator` に渡す（`MIDIBridge` を保持しないとコールバックが切れる）
    @State private var midiBridge: MIDIBridge?

    let mode: GameMode
    let locale: AppLocale
    var onClose: (() -> Void)?
    @State private var resolvedAccessToken: String?
    @State private var resolvedRefreshToken: String?
    @State private var tokenReady = false

    private var isDemoMode: Bool {
        switch mode {
        case .demoLP, .demoFantasy: return true
        default: return false
        }
    }

    init(
        mode: GameMode,
        locale: AppLocale,
        accessToken: String? = nil,
        refreshToken: String? = nil,
        onClose: (() -> Void)? = nil
    ) {
        self.mode = mode
        self.locale = locale
        self.onClose = onClose
        self._resolvedAccessToken = State(initialValue: accessToken)
        self._resolvedRefreshToken = State(initialValue: refreshToken)
        let hasPair = accessToken != nil && refreshToken != nil
        self._tokenReady = State(initialValue: hasPair)
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            if tokenReady || isDemoMode {
                WebViewRepresentable(
                    url: buildURL(),
                    coordinator: coordinator,
                    accessToken: resolvedAccessToken,
                    refreshToken: resolvedRefreshToken
                )
                .ignoresSafeArea()
            } else {
                ProgressView()
                    .tint(.purple)
            }

        }
        .task {
            if !isDemoMode && (resolvedAccessToken == nil || resolvedRefreshToken == nil) {
                do {
                    let session = try await SupabaseService.shared.client.auth.session
                    resolvedAccessToken = session.accessToken
                    resolvedRefreshToken = session.refreshToken
                } catch {
                    resolvedAccessToken = nil
                    resolvedRefreshToken = nil
                }
            }
            tokenReady = true
        }
        .onAppear {
            coordinator.onScoreReport = { _score in }
            coordinator.midiManager = MIDIManager.shared
            midiBridge = MIDIBridge(midiManager: MIDIManager.shared, coordinator: coordinator)
            OrientationManager.shared.lock(mode.preferredOrientations)
        }
        .onDisappear {
            midiBridge?.detach()
            midiBridge = nil
            OrientationManager.shared.unlock()
        }
        .onChange(of: coordinator.shouldDismiss) { shouldDismiss in
            if shouldDismiss {
                OrientationManager.shared.unlock()
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
    let accessToken: String?
    let refreshToken: String?

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.preferences.isElementFullscreenEnabled = true

        let userContent = config.userContentController
        userContent.add(coordinator, name: "gameCallback")
        userContent.add(coordinator, name: "midiRequest")
        userContent.add(coordinator, name: "fullscreenChange")

        let fullscreenScript = WKUserScript(
            source: """
            (function(){
                function notify(fs){
                    window.webkit.messageHandlers.fullscreenChange.postMessage(!!fs);
                }
                document.addEventListener('fullscreenchange', function(){
                    notify(document.fullscreenElement);
                });
                document.addEventListener('webkitfullscreenchange', function(){
                    notify(document.webkitFullscreenElement);
                });
            })();
            """,
            injectionTime: .atDocumentEnd,
            forMainFrameOnly: false
        )
        userContent.addUserScript(fullscreenScript)

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = .black
        webView.scrollView.isScrollEnabled = false
        // Safe area 用の自動 content inset により下端に親ビュー色（黒）が露出するのを防ぐ
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.automaticallyAdjustsScrollIndicatorInsets = false
        webView.scrollView.contentInset = .zero
        webView.scrollView.scrollIndicatorInsets = .zero
        webView.scrollView.delaysContentTouches = false
        webView.scrollView.canCancelContentTouches = true
        webView.navigationDelegate = coordinator
        webView.uiDelegate = coordinator
        webView.allowsBackForwardNavigationGestures = false

        coordinator.webView = webView

        if let access = accessToken, let refresh = refreshToken {
            injectAuthTokens(webView: webView, accessToken: access, refreshToken: refresh)
        }
        injectViewportHeight(webView: webView)

        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    private func injectAuthTokens(webView: WKWebView, accessToken: String, refreshToken: String) {
        func jsStringLiteral(_ value: String) -> String {
            guard let data = try? JSONEncoder().encode(value),
                  let s = String(data: data, encoding: .utf8) else {
                return "\"\""
            }
            return s
        }
        let accessLit = jsStringLiteral(accessToken)
        let refreshLit = jsStringLiteral(refreshToken)
        let script = WKUserScript(
            source: """
            window.__NATIVE_AUTH_TOKEN__ = \(accessLit);
            window.__NATIVE_REFRESH_TOKEN__ = \(refreshLit);
            """,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        webView.configuration.userContentController.addUserScript(script)
    }

    private func injectViewportHeight(webView: WKWebView) {
        let source = """
        (function(){
          function setDvh(){
            var h = window.innerHeight || document.documentElement.clientHeight;
            document.documentElement.style.setProperty('--dvh', h + 'px');
          }
          setDvh();
          window.addEventListener('resize', setDvh);
          if(window.visualViewport){
            window.visualViewport.addEventListener('resize', setDvh);
          }
        })();
        """
        let script = WKUserScript(
            source: source,
            injectionTime: .atDocumentEnd,
            forMainFrameOnly: true
        )
        webView.configuration.userContentController.addUserScript(script)
    }
}
