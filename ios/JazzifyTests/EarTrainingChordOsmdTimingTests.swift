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
        let phraseTimeSec = 1.8

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

    func testSamePitchRepeatMaskActiveEvenWhenPreviousFailedOnScore() {
        let judgedTimes = [1.0, 2.0]
        let singleMidisAt: (Int) -> [Int] = { index in
            index == 0 || index == 1 ? [67] : []
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
            phraseTimeSec: 1.8,
            judgedTargetTimeSec: { judgedTimes[$0] },
            runtimeAt: failedPrevious,
            earlySec: 0.25,
            lateSec: 0.25,
            targetMidisAt: singleMidisAt
        ).repeatPitchClassMask, 1 << 7)
    }

    func testSamePitchRepeatMaskStaysOffForChordOrDifferentPitch() {
        let judgedTimes = [1.0, 2.0]
        let targetMidisAt: (Int) -> [Int] = { index in
            switch index {
            case 0: return [67, 71]
            case 1: return [67]
            default: return [60]
            }
        }

        let chordPrevious: (Int) -> (completed: Bool, failed: Bool, remainingMidis: [Int])? = { index in
            switch index {
            case 0: return (completed: true, failed: false, remainingMidis: [])
            case 1: return (completed: false, failed: false, remainingMidis: [67])
            default: return nil
            }
        }
        XCTAssertEqual(ExpectedPitchCandidateCollectors.collectChordOsmd(
            targetCount: 2,
            phraseTimeSec: 1.8,
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
            phraseTimeSec: 1.8,
            judgedTargetTimeSec: { judgedTimes[$0] },
            runtimeAt: differentPitch,
            earlySec: 0.25,
            lateSec: 0.25,
            targetMidisAt: singleMidisAt
        ).repeatPitchClassMask, 0)
    }

    func testPrecisionSamePitchRepeatMaskActiveBeforeJudgmentWindowWhenPreviousGood() {
        let notes = [
            EarTrainingPrecisionNote(
                id: "a",
                midi: 60,
                startSec: 1.0,
                durationSec: 0.5,
                isBlackKey: false,
                measureNumber: 1,
                isShortNote: false
            ),
            EarTrainingPrecisionNote(
                id: "b",
                midi: 60,
                startSec: 2.0,
                durationSec: 0.5,
                isBlackKey: false,
                measureNumber: 1,
                isShortNote: false
            ),
        ]
        let states: [String: EarTrainingPrecisionJudge.NoteRuntimeState] = [
            "a": EarTrainingPrecisionJudge.NoteRuntimeState(judgment: .good),
            "b": EarTrainingPrecisionJudge.NoteRuntimeState(judgment: .pending),
        ]
        XCTAssertTrue(ExpectedPitchCandidateCollectors.isPrecisionWaitingForSamePitchRepeat(
            notes: notes,
            states: states,
            phraseTimeSec: 0.5,
            windowSec: 0.25
        ))
        XCTAssertEqual(
            ExpectedPitchCandidateCollectors.resolvePrecisionSamePitchRepeatMinIntervalMs(
                notes: notes,
                states: states,
                phraseTimeSec: 0.5,
                windowSec: 0.25
            ),
            500
        )
        XCTAssertEqual(ExpectedPitchCandidateCollectors.collectPrecision(
            notes: notes,
            states: states,
            phraseTimeSec: 0.5,
            windowSec: 0.25
        ).repeatPitchClassMask, 1 << (60 % 12))
    }

    func testPickEarliestTargetIndexPrefersOldestPendingForLateSamePitchInput() {
        let judgedTimes = [0.0, 0.25, 0.5, 0.75]
        let canMatch: [Bool] = [false, true, true, false]
        let picked = EarTrainingChordOsmdTiming.pickEarliestTargetIndex(
            targetCount: judgedTimes.count,
            phraseTimeSec: 0.38,
            judgedTargetTimeSec: { judgedTimes[$0] },
            canMatchTarget: { canMatch[$0] }
        )
        XCTAssertEqual(picked, 1)
        let nearest = EarTrainingChordOsmdTiming.pickNearestTargetIndex(
            targetCount: judgedTimes.count,
            phraseTimeSec: 0.38,
            judgedTargetTimeSec: { judgedTimes[$0] },
            canMatchTarget: { canMatch[$0] }
        )
        XCTAssertEqual(nearest, 2)
    }

    func testPickEarliestTargetIndexSkipsCompletedAndOutOfWindow() {
        let judgedTimes = [0.0, 0.25, 0.5]
        let canMatch: [Bool] = [false, false, true]
        XCTAssertNil(EarTrainingChordOsmdTiming.pickEarliestTargetIndex(
            targetCount: judgedTimes.count,
            phraseTimeSec: 0.05,
            judgedTargetTimeSec: { judgedTimes[$0] },
            canMatchTarget: { canMatch[$0] }
        ))
        XCTAssertEqual(EarTrainingChordOsmdTiming.pickEarliestTargetIndex(
            targetCount: judgedTimes.count,
            phraseTimeSec: 0.55,
            judgedTargetTimeSec: { judgedTimes[$0] },
            canMatchTarget: { canMatch[$0] }
        ), 2)
    }

    func testPickEarliestTargetIndexClosesLateSideAtTwoFiftyMsWithoutArrivalGrace() {
        let judgedTimes = [1.0]
        XCTAssertEqual(EarTrainingChordOsmdTiming.pickEarliestTargetIndex(
            targetCount: 1,
            phraseTimeSec: 1.24,
            judgedTargetTimeSec: { judgedTimes[$0] },
            canMatchTarget: { _ in true }
        ), 0)
        XCTAssertNil(EarTrainingChordOsmdTiming.pickEarliestTargetIndex(
            targetCount: 1,
            phraseTimeSec: 1.26,
            judgedTargetTimeSec: { judgedTimes[$0] },
            canMatchTarget: { _ in true }
        ))
    }

    func testJudgedPhraseSecAlignsOsuLockedAutoParryAndPreImpactHammer() {
        let bpm = 100.0
        let judgedPhraseSec = 2.44
        let approachLeadSec = EarTrainingChordOsmdTiming.approachLeadSec(bpm: bpm)
        let hammerLeadSec = EarTrainingChordOsmdTiming.hammerLeadSec(
            bpm: bpm,
            beatsPerMeasure: 4,
            leadMeasures: EarTrainingChordOsmdTiming.hammerLeadMeasuresDefault
        )
        let throwPhraseSec = judgedPhraseSec - hammerLeadSec
        let impactPhraseSec = judgedPhraseSec + EarTrainingChordOsmdTiming.hammerImpactOffsetSec
        let osuTiming = EarTrainingBattleOsuCircleTiming.resolvePhraseTiming(
            judgedPhraseTimeSec: judgedPhraseSec,
            approachLeadSec: approachLeadSec
        )
        let osuState = EarTrainingBattleOsuCircleTiming.computeFromPhrase(
            phraseTimelineSec: judgedPhraseSec,
            approachStartPhraseSec: osuTiming.approachStartPhraseSec,
            judgedPhraseSec: osuTiming.judgedPhraseSec,
            centerX: 0,
            targetY: 0
        )
        let overlapOuter = EarTrainingBattleOsuCircleTiming.overlapOuterRadiusPx()
        let hammerDuration = impactPhraseSec - throwPhraseSec
        let hammerProgress = hammerDuration > 0
            ? min(1, max(0, (judgedPhraseSec - throwPhraseSec) / hammerDuration))
            : 1

        XCTAssertEqual(osuState.phase, .locked)
        XCTAssertEqual(osuState.outerRadius, overlapOuter)
        XCTAssertTrue(judgedPhraseSec + 1e-9 >= judgedPhraseSec)
        XCTAssertLessThan(hammerProgress, 1)
        XCTAssertLessThan(judgedPhraseSec + 1e-9, impactPhraseSec)
    }

    func testHammerImpactPhraseSecCompletesFlightProgress() {
        let throwPhraseSec = 1.0
        let impactPhraseSec = 2.0
        let duration = impactPhraseSec - throwPhraseSec
        let progress = min(1, max(0, (impactPhraseSec - throwPhraseSec) / duration))
        XCTAssertEqual(progress, 1, accuracy: 1e-9)
    }
}
