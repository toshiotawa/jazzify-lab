import AuthenticationServices
import XCTest
@testable import Jazzify

final class DiscordOAuthTests: XCTestCase {
    func testCallbackURLParsesJoinedStatus() {
        let url = URL(string: "jazzify://discord?status=joined")
        XCTAssertEqual(DiscordOAuthCallback.status(fromCallbackURL: url!), .joined)
    }

    func testCallbackURLParsesErrorStatus() {
        let url = URL(string: "jazzify://discord?status=error")
        XCTAssertEqual(DiscordOAuthCallback.status(fromCallbackURL: url!), .error)
    }

    func testCallbackURLIgnoresOtherSchemes() {
        let url = URL(string: "https://jazzify.jp/main/dashboard?discord=joined")
        XCTAssertNil(DiscordOAuthCallback.status(fromCallbackURL: url!))
    }

    func testResolveStatusMapsCanceledLogin() {
        let error = NSError(
            domain: ASWebAuthenticationSessionError.errorDomain,
            code: ASWebAuthenticationSessionError.Code.canceledLogin.rawValue
        )
        let status = DiscordOAuthAuthenticator.resolveStatus(callbackURL: nil, error: error)
        XCTAssertEqual(status, .cancelled)
    }

    func testResolveStatusMapsMissingCallbackToError() {
        let status = DiscordOAuthAuthenticator.resolveStatus(callbackURL: nil, error: nil)
        XCTAssertEqual(status, .error)
    }
}
