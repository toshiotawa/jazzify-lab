import XCTest
@testable import Jazzify

final class EarTrainingChordOSMDBattleRhythmTargetsTests: XCTestCase {
    private let phraseId = UUID(uuidString: "10000000-0000-4000-8000-000000000001")!
    private let chordAId = UUID(uuidString: "20000000-0000-4000-8000-000000000001")!
    private let chordBId = UUID(uuidString: "20000000-0000-4000-8000-000000000002")!

    private func chord(
        id: UUID,
        orderIndex: Int,
        name: String,
        measureNumber: Int,
        voicing: [String]
    ) -> EarTrainingPhraseChordDetail {
        EarTrainingPhraseChordDetail(
            id: id,
            phraseId: phraseId,
            orderIndex: orderIndex,
            chordName: name,
            measureNumber: measureNumber,
            voicing: voicing,
            voicingStaves: nil
        )
    }

    func testBuildRhythmTargetsFromScoreAppliesTransposeOffsetToMeasureLabels() {
        let drafts = EarTrainingChordOSMDBattleController.buildRhythmTargetsFromScore(
            chords: [
                chord(
                    id: chordAId,
                    orderIndex: 0,
                    name: "Bb7",
                    measureNumber: 1,
                    voicing: ["Bb3", "D4", "F4"]
                ),
                chord(
                    id: chordBId,
                    orderIndex: 1,
                    name: "C/E",
                    measureNumber: 2,
                    voicing: ["E3", "G3"]
                ),
            ],
            bpm: 120,
            beatsPerMeasure: 4,
            attacks: [
                ChordOsmdMusicXmlAttack(
                    measureNumber: 1,
                    beatStartInMeasure: 1,
                    midis: [60, 64, 67]
                ),
                ChordOsmdMusicXmlAttack(
                    measureNumber: 2,
                    beatStartInMeasure: 1,
                    midis: [52, 55]
                ),
            ],
            transposeOffset: 2
        )

        XCTAssertEqual(drafts.count, 2)
        XCTAssertEqual(drafts[0].label, "C7")
        XCTAssertEqual(drafts[1].label, "D/F#")
    }

    func testParryPreciseRingOnSuccessRegardlessOfTimingOffset() {
        XCTAssertTrue(EarTrainingChordOSMDBattleController.parryPreciseRingOnSuccess)
    }

    func testStraightBeatKeysGuardSkipsSwingOnMixedSixteenthBeat() {
        let straightKeys: Set<String> = ["1:0"]
        let even = EarTrainingChordOsmdMusicXmlNormalizer.chordOsmdBeatToTargetTimeSec(
            measureNumber: 1,
            beatStartInMeasure: 1.5,
            bpm: 120,
            beatsPerMeasure: 4,
            isSwing: false
        )
        let guarded = EarTrainingChordOsmdMusicXmlNormalizer.chordOsmdBeatToTargetTimeSec(
            measureNumber: 1,
            beatStartInMeasure: 1.5,
            bpm: 120,
            beatsPerMeasure: 4,
            isSwing: true,
            straightBeatKeys: straightKeys
        )
        XCTAssertEqual(guarded, even, accuracy: 0.00001)
    }

    func testSwungTimelineMapsBackToNotatedEighth() {
        let even = EarTrainingChordOsmdMusicXmlNormalizer.chordOsmdBeatToTargetTimeSec(
            measureNumber: 1,
            beatStartInMeasure: 1.5,
            bpm: 120,
            beatsPerMeasure: 4,
            isSwing: false
        )
        let swing = EarTrainingChordOsmdMusicXmlNormalizer.chordOsmdBeatToTargetTimeSec(
            measureNumber: 1,
            beatStartInMeasure: 1.5,
            bpm: 120,
            beatsPerMeasure: 4,
            isSwing: true
        )
        let notated = EarTrainingChordOsmdMusicXmlNormalizer.swungTimelineToNotatedTimelineSec(
            phraseTimeSec: swing,
            measureDurationSec: 2,
            beatsPerMeasure: 4
        )
        XCTAssertEqual(notated, even, accuracy: 0.00001)
    }
}
