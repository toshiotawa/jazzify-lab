import XCTest
@testable import Jazzify

final class EarTrainingChordOsmdRhythmTests: XCTestCase {
    func testIsLastTargetInMeasureUsesLatestTimeInSameMeasure() {
        let targets = [
            EarTrainingChordOsmdRhythmTargetRef(targetTimeSec: 1.0, measureNumber: 2, orderIndex: 0),
            EarTrainingChordOsmdRhythmTargetRef(targetTimeSec: 2.0, measureNumber: 2, orderIndex: 1),
            EarTrainingChordOsmdRhythmTargetRef(targetTimeSec: 1.5, measureNumber: 3, orderIndex: 2),
        ]

        XCTAssertFalse(
            EarTrainingChordOsmdRhythm.isLastTargetInMeasure(
                targets: targets,
                target: targets[0]
            )
        )
        XCTAssertTrue(
            EarTrainingChordOsmdRhythm.isLastTargetInMeasure(
                targets: targets,
                target: targets[1]
            )
        )
    }

    func testIsLastTargetInMeasureUsesOrderIndexOnTie() {
        let targets = [
            EarTrainingChordOsmdRhythmTargetRef(targetTimeSec: 2.0, measureNumber: 1, orderIndex: 0),
            EarTrainingChordOsmdRhythmTargetRef(targetTimeSec: 2.0, measureNumber: 1, orderIndex: 1),
        ]

        XCTAssertFalse(
            EarTrainingChordOsmdRhythm.isLastTargetInMeasure(
                targets: targets,
                target: targets[0]
            )
        )
        XCTAssertTrue(
            EarTrainingChordOsmdRhythm.isLastTargetInMeasure(
                targets: targets,
                target: targets[1]
            )
        )
    }

    func testParryEffectRadiusMergesAt251Ms() {
        let radius250 = EarTrainingBattleParryConstants.getParryEffectRadiusAtAge(250)
        let radius251 = EarTrainingBattleParryConstants.getParryEffectRadiusAtAge(251)
        XCTAssertEqual(radius250, EarTrainingBattleParryConstants.mergeRadiusPx, accuracy: 0.5)
        XCTAssertEqual(radius251, EarTrainingBattleParryConstants.mergeRadiusPx, accuracy: 0.5)
    }

    func testParryRingScaleHiddenBefore251Ms() {
        XCTAssertNil(EarTrainingBattleParryConstants.getParryRingScaleAtAge(250))
        XCTAssertNotNil(EarTrainingBattleParryConstants.getParryRingScaleAtAge(251))
    }
}
