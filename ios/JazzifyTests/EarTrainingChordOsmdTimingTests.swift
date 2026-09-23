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

    func testHintLightsForOneHundredMsFromJust() {
        XCTAssertTrue(isHintOn(0))
        XCTAssertTrue(isHintOn(0.1))
        XCTAssertFalse(isHintOn(0.101))
    }

    func testHintStaysOffBeforeJust() {
        XCTAssertFalse(isHintOn(-0.001))
        XCTAssertFalse(isHintOn(-0.1))
    }

    func testHintDoesNotFollowJudgmentWindow() {
        for phraseTime in [-0.1, 0.15] {
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

    func testSamePitchRepeatMaskActiveBeforeJudgmentWindowWhenPreviousCompleted() {
        let judgedTimes = [1.0, 2.0]
        let runtimeAt: (Int) -> (completed: Bool, failed: Bool, remainingMidis: [Int])? = { index in
            switch index {
            case 0:
                return (completed: true, failed: false, remainingMidis: [])
            case 1:
                return (completed: false, failed: false, remainingMidis: [67])
            default:
                return nil
            }
        }
        let targetMidisAt: (Int) -> [Int] = { index in
            index == 0 || index == 1 ? [67] : []
        }
        let phraseTimeSec = 1.5

        let candidates = ExpectedPitchCandidateCollectors.collectChordOsmd(
            targetCount: 2,
            phraseTimeSec: phraseTimeSec,
            judgedTargetTimeSec: { judgedTimes[$0] },
            runtimeAt: runtimeAt,
            earlySec: 0.25,
            lateSec: 0.25,
            targetMidisAt: targetMidisAt
        )
        XCTAssertEqual(candidates.repeatPitchClassMask, 1 << 7)
        XCTAssertTrue(ExpectedPitchCandidateCollectors.isChordOsmdWaitingForSamePitchRepeat(
            targetCount: 2,
            phraseTimeSec: phraseTimeSec,
            judgedTargetTimeSec: { judgedTimes[$0] },
            runtimeAt: runtimeAt,
            targetMidisAt: targetMidisAt,
            earlySec: 0.25,
            lateSec: 0.25
        ))
        guard let minIntervalMs = ExpectedPitchCandidateCollectors.resolveChordOsmdSamePitchRepeatMinIntervalMs(
            targetCount: 2,
            phraseTimeSec: phraseTimeSec,
            judgedTargetTimeSec: { judgedTimes[$0] },
            runtimeAt: runtimeAt,
            targetMidisAt: targetMidisAt,
            earlySec: 0.25,
            lateSec: 0.25
        ) else {
            XCTFail("Expected same-pitch repeat min interval")
            return
        }
        XCTAssertEqual(minIntervalMs, 500, accuracy: 1)
    }

    func testSamePitchRepeatMaskStaysOffForFailedPreviousChordOrDifferentPitch() {
        let judgedTimes = [1.0, 2.0]
        let targetMidisAt: (Int) -> [Int] = { index in
            switch index {
            case 0: return [67, 71]
            case 1: return [67]
            default: return [60]
            }
        }
        let failedPrevious: (Int) -> (completed: Bool, failed: Bool, remainingMidis: [Int])? = { index in
            switch index {
            case 0: return (completed: false, failed: true, remainingMidis: [67])
            case 1: return (completed: false, failed: false, remainingMidis: [67])
            default: return nil
            }
        }
        XCTAssertEqual(ExpectedPitchCandidateCollectors.collectChordOsmd(
            targetCount: 2,
            phraseTimeSec: 1.5,
            judgedTargetTimeSec: { judgedTimes[$0] },
            runtimeAt: failedPrevious,
            earlySec: 0.25,
            lateSec: 0.25,
            targetMidisAt: targetMidisAt
        ).repeatPitchClassMask, 0)

        let chordPrevious: (Int) -> (completed: Bool, failed: Bool, remainingMidis: [Int])? = { index in
            switch index {
            case 0: return (completed: true, failed: false, remainingMidis: [])
            case 1: return (completed: false, failed: false, remainingMidis: [67])
            default: return nil
            }
        }
        XCTAssertEqual(ExpectedPitchCandidateCollectors.collectChordOsmd(
            targetCount: 2,
            phraseTimeSec: 1.5,
            judgedTargetTimeSec: { judgedTimes[$0] },
            runtimeAt: chordPrevious,
            earlySec: 0.25,
            lateSec: 0.25,
            targetMidisAt: targetMidisAt
        ).repeatPitchClassMask, 0)

        let differentPitch: (Int) -> (completed: Bool, failed: Bool, remainingMidis: [Int])? = { index in
            switch index {
            case 0: return (completed: true, failed: false, remainingMidis: [])
            case 1: return (completed: false, failed: false, remainingMidis: [60])
            default: return nil
            }
        }
        let singleMidisAt: (Int) -> [Int] = { index in
            index == 0 ? [67] : [60]
        }
        XCTAssertEqual(ExpectedPitchCandidateCollectors.collectChordOsmd(
            targetCount: 2,
            phraseTimeSec: 1.5,
            judgedTargetTimeSec: { judgedTimes[$0] },
            runtimeAt: differentPitch,
            earlySec: 0.25,
            lateSec: 0.25,
            targetMidisAt: singleMidisAt
        ).repeatPitchClassMask, 0)
    }
}
