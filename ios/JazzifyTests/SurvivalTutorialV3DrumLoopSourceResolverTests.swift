import XCTest
@testable import Jazzify

final class SurvivalTutorialV3DrumLoopSourceResolverTests: XCTestCase {
    func testResolvePrefersRemoteWhenUrlPresent() {
        let url = "https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"
        let source = SurvivalTutorialV3DrumLoopSourceResolver.resolve(urlString: url, hasBundledDrumLoop: true)
        guard case let .remote(remote) = source else {
            return XCTFail("Expected remote source")
        }
        XCTAssertEqual(remote.absoluteString, url)
    }

    func testResolveUsesBundledWhenUrlEmpty() {
        let source = SurvivalTutorialV3DrumLoopSourceResolver.resolve(urlString: "  ", hasBundledDrumLoop: true)
        XCTAssertEqual(source, .bundled)
    }

    func testResolveUsesBundledWhenUrlNil() {
        let source = SurvivalTutorialV3DrumLoopSourceResolver.resolve(urlString: nil, hasBundledDrumLoop: true)
        XCTAssertEqual(source, .bundled)
    }

    func testResolveNoneWhenNoUrlAndNoBundle() {
        let source = SurvivalTutorialV3DrumLoopSourceResolver.resolve(urlString: nil, hasBundledDrumLoop: false)
        XCTAssertEqual(source, .none)
    }

    func testResolveTrimsWhitespaceBeforeRemote() {
        let url = "https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"
        let source = SurvivalTutorialV3DrumLoopSourceResolver.resolve(
            urlString: "  \(url)  ",
            hasBundledDrumLoop: false
        )
        guard case let .remote(remote) = source else {
            return XCTFail("Expected remote source")
        }
        XCTAssertEqual(remote.absoluteString, url)
    }
}

final class SurvivalTutorialDemoPlaySchedulerAnchorTests: XCTestCase {
    func testAnchoredDelaySecondsClampsNegativeToZero() {
        XCTAssertEqual(
            SurvivalTutorialDemoPlayScheduler.anchoredDelaySeconds(atSeconds: 1.5, elapsedSeconds: 2.0),
            0,
            accuracy: 0.0001
        )
    }

    func testAnchoredDelaySecondsSubtractsElapsed() {
        XCTAssertEqual(
            SurvivalTutorialDemoPlayScheduler.anchoredDelaySeconds(atSeconds: 1.5, elapsedSeconds: 0.5),
            1.0,
            accuracy: 0.0001
        )
    }

    func testAnchoredDelaySecondsAtAnchorIsFullDelay() {
        XCTAssertEqual(
            SurvivalTutorialDemoPlayScheduler.anchoredDelaySeconds(atSeconds: 1.5, elapsedSeconds: 0),
            1.5,
            accuracy: 0.0001
        )
    }
}
