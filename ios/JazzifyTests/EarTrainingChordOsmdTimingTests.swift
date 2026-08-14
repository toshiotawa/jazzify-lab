import XCTest
@testable import Jazzify

/// 鍵盤ヒント点灯窓（Web `isPhraseTimeInChordOsmdVoicingHintWindow` のミラー）。
final class EarTrainingChordOsmdTimingTests: XCTestCase {
    private func isHintOn(_ phraseTimeSec: Double, durationSec: Double = EarTrainingChordOsmdTiming.voicingHintDurationSec) -> Bool {
        EarTrainingChordOsmdTiming.isWithinVoicingHintWindow(
            phraseTimeSec: phraseTimeSec,
            judgedTargetTimeSec: 0,
            durationSec: durationSec
        )
    }

    func testHintLightsForThirtyMsFromJust() {
        XCTAssertTrue(isHintOn(0))
        XCTAssertTrue(isHintOn(0.03))
        XCTAssertFalse(isHintOn(0.031))
    }

    func testHintStaysOffBeforeJust() {
        XCTAssertFalse(isHintOn(-0.001))
        XCTAssertFalse(isHintOn(-0.1))
    }

    func testHintDoesNotFollowJudgmentWindow() {
        for phraseTime in [-0.1, 0.1] {
            XCTAssertTrue(EarTrainingChordOsmdTiming.isWithinJudgmentWindow(
                phraseTimeSec: phraseTime,
                judgedTargetTimeSec: 0
            ))
            XCTAssertFalse(isHintOn(phraseTime))
        }
    }

    func testHintAcceptsScaledDuration() {
        XCTAssertTrue(isHintOn(0.05, durationSec: 0.06))
        XCTAssertFalse(isHintOn(-0.01, durationSec: 0.06))
    }
}
