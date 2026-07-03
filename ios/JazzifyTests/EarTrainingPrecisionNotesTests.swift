import XCTest
@testable import Jazzify

final class EarTrainingPrecisionNotesTests: XCTestCase {
    private let minimalXML = """
    <?xml version="1.0" encoding="UTF-8"?>
    <score-partwise>
      <part>
        <measure number="1">
          <attributes>
            <divisions>1</divisions>
            <time><beats>4</beats><beat-type>4</beat-type></time>
            <key><fifths>0</fifths></key>
          </attributes>
          <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
          <note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
          <note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
        </measure>
      </part>
    </score-partwise>
    """

    func testBuildFromMusicXmlCreatesOneNotePerPitch() {
        let result = EarTrainingPrecisionNotes.buildFromMusicXml(
            musicXmlText: minimalXML,
            bpm: 120,
            beatsPerMeasure: 4
        )
        XCTAssertEqual(result.notes.count, 3)
        XCTAssertEqual(result.notes[0].midi, 60)
        XCTAssertEqual(result.notes[1].midi, 64)
        XCTAssertEqual(result.notes[2].midi, 67)
    }

    func testKeyboardRangeExpandsToTwoOctavesWhenNotesAreNarrow() {
        let range = EarTrainingPrecisionNotes.resolveKeyboardRange(noteMidis: [60, 67])
        XCTAssertGreaterThanOrEqual(range.maxMidi - range.minMidi + 1, 24)
        XCTAssertLessThanOrEqual(range.minMidi, 60)
        XCTAssertGreaterThanOrEqual(range.maxMidi, 67)
    }

    func testQuarterNotesAreNotShortNotes() {
        let result = EarTrainingPrecisionNotes.buildFromMusicXml(
            musicXmlText: minimalXML,
            bpm: 120,
            beatsPerMeasure: 4
        )
        XCTAssertTrue(result.notes.allSatisfy { !$0.isShortNote })
    }

    func testShortNoteDurationBoundary() {
        let maxSec = EarTrainingPrecisionNotes.shortNoteMaxDurationSec(bpm: 120)
        XCTAssertTrue(EarTrainingPrecisionNotes.isShortNoteDuration(durationSec: maxSec, bpm: 120))
        XCTAssertFalse(EarTrainingPrecisionNotes.isShortNoteDuration(durationSec: maxSec + 0.01, bpm: 120))
    }
}

final class EarTrainingPrecisionJudgeTests: XCTestCase {
    private func sampleNote(id: String, midi: Int, startSec: Double) -> EarTrainingPrecisionNote {
        EarTrainingPrecisionNote(
            id: id,
            midi: midi,
            startSec: startSec,
            durationSec: 0.5,
            isBlackKey: false,
            measureNumber: 1,
            isShortNote: false
        )
    }

    func testFindNoteForInputPicksEarliestMatchingNote() {
        let notes = [
            sampleNote(id: "a", midi: 60, startSec: 1),
            sampleNote(id: "b", midi: 60, startSec: 1.2),
        ]
        var states = EarTrainingPrecisionJudge.createRuntimeStates(notes: notes)
        let matched = EarTrainingPrecisionJudge.findNoteForInput(
            notes: notes,
            states: states,
            midi: 60,
            phraseTimeSec: 1.05,
            windowSec: 0.25
        )
        XCTAssertEqual(matched?.id, "a")
        _ = states
    }

    func testMarkExpiredNotesAsMiss() {
        let notes = [sampleNote(id: "a", midi: 60, startSec: 1)]
        var states = EarTrainingPrecisionJudge.createRuntimeStates(notes: notes)
        let missed = EarTrainingPrecisionJudge.markExpiredNotesAsMiss(
            notes: notes,
            states: &states,
            phraseTimeSec: 1.3,
            windowSec: 0.25
        )
        XCTAssertEqual(missed, 1)
        XCTAssertEqual(states["a"]?.judgment, .miss)
    }

    func testRankForGoodRateBoundaries() {
        XCTAssertEqual(EarTrainingPrecisionJudge.rankForGoodRate(0.96), .s)
        XCTAssertEqual(EarTrainingPrecisionJudge.rankForGoodRate(0.91), .a)
        XCTAssertEqual(EarTrainingPrecisionJudge.rankForGoodRate(0.81), .b)
        XCTAssertEqual(EarTrainingPrecisionJudge.rankForGoodRate(0.71), .c)
        XCTAssertEqual(EarTrainingPrecisionJudge.rankForGoodRate(0.69), .d)
        XCTAssertTrue(EarTrainingPrecisionJudge.isClearRank(.c))
        XCTAssertFalse(EarTrainingPrecisionJudge.isClearRank(.d))
    }

    func testResetRuntimeStatesFromTime() {
        let notes = [sampleNote(id: "a", midi: 60, startSec: 2)]
        var states = EarTrainingPrecisionJudge.createRuntimeStates(notes: notes)
        states["a"]?.judgment = .miss
        EarTrainingPrecisionJudge.resetRuntimeStatesFromTime(
            notes: notes,
            states: &states,
            phraseTimeSec: 1.5,
            windowSec: 0.25
        )
        XCTAssertEqual(states["a"]?.judgment, .pending)
    }

    func testResetRuntimeStatesFromTimeRevivesGoodNoteAfterSeekBack() {
        let notes = [sampleNote(id: "a", midi: 60, startSec: 5)]
        var states = EarTrainingPrecisionJudge.createRuntimeStates(notes: notes)
        states["a"]?.judgment = .good
        states["a"]?.hiddenFromLane = true
        EarTrainingPrecisionJudge.resetRuntimeStatesFromTime(
            notes: notes,
            states: &states,
            phraseTimeSec: 3,
            windowSec: 0.25
        )
        XCTAssertEqual(states["a"]?.judgment, .pending)
        XCTAssertNil(states["a"]?.hiddenFromLane)
    }

    func testResetRuntimeStatesFromTimeKeepsGoodNoteBeforeSeekPoint() {
        let notes = [sampleNote(id: "a", midi: 60, startSec: 2)]
        var states = EarTrainingPrecisionJudge.createRuntimeStates(notes: notes)
        states["a"]?.judgment = .good
        states["a"]?.hiddenFromLane = true
        EarTrainingPrecisionJudge.resetRuntimeStatesFromTime(
            notes: notes,
            states: &states,
            phraseTimeSec: 5,
            windowSec: 0.25
        )
        XCTAssertEqual(states["a"]?.judgment, .good)
        XCTAssertEqual(states["a"]?.hiddenFromLane, true)
    }
}
