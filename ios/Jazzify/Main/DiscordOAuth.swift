import AuthenticationServices
import UIKit

enum DiscordOAuthCallbackStatus: Equatable {
    case joined
    case error
    case cancelled
}

enum DiscordOAuthCallback {
    static let urlScheme = "jazzify"
    static let urlHost = "discord"

    static func status(fromCallbackURL url: URL) -> DiscordOAuthCallbackStatus? {
        guard url.scheme == urlScheme, url.host == urlHost else {
            return nil
        }
        let status = URLComponents(url: url, resolvingAgainstBaseURL: false)?
            .queryItems?
            .first(where: { $0.name == "status" })?
            .value
        return status == "joined" ? .joined : .error
    }
}

@MainActor
final class DiscordOAuthAuthenticator: NSObject, ASWebAuthenticationPresentationContextProviding {
    private var session: ASWebAuthenticationSession?
    private var continuation: CheckedContinuation<DiscordOAuthCallbackStatus, Never>?

    func authenticate(url: URL) async -> DiscordOAuthCallbackStatus {
        await withCheckedContinuation { continuation in
            self.continuation = continuation
            let session = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: DiscordOAuthCallback.urlScheme
            ) { [weak self] callbackURL, error in
                Task { @MainActor in
                    self?.finish(Self.resolveStatus(callbackURL: callbackURL, error: error))
                }
            }
            session.presentationContextProvider = self
            session.prefersEphemeralWebBrowserSession = false
            self.session = session
            if !session.start() {
                self.finish(.error)
            }
        }
    }

    nonisolated static func resolveStatus(callbackURL: URL?, error: Error?) -> DiscordOAuthCallbackStatus {
        if let callbackURL, let status = DiscordOAuthCallback.status(fromCallbackURL: callbackURL) {
            return status
        }
        if let error = error as? ASWebAuthenticationSessionError, error.code == .canceledLogin {
            return .cancelled
        }
        return .error
    }

    private func finish(_ status: DiscordOAuthCallbackStatus) {
        session = nil
        continuation?.resume(returning: status)
        continuation = nil
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        let windows = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
        if let keyWindow = windows.first(where: \.isKeyWindow) {
            return keyWindow
        }
        return windows.first ?? ASPresentationAnchor()
    }
}
