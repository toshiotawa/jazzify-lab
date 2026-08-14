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

    private let guideVoiceXML = """
    <?xml version="1.0" encoding="UTF-8"?>
    <score-partwise>
      <part>
        <measure number="1">
          <attributes>
            <divisions>1</divisions>
            <time><beats>4</beats><beat-type>4</beat-type></time>
            <key><fifths>0</fifths></key>
          </attributes>
          <note>
            <pitch><step>C</step><octave>4</octave></pitch>
            <duration>1</duration><voice>1</voice><type>quarter</type>
          </note>
          <backup><duration>1</duration></backup>
          <note>
            <pitch><step>E</step><octave>4</octave></pitch>
            <duration>1</duration><voice>4</voice><type size="cue">quarter</type>
          </note>
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

    func testApplyGuideNoteColorsHidesVoiceOneRestsUnderGuidePitches() {
        let xml = """
        <?xml version="1.0" encoding="UTF-8"?>
        <score-partwise>
          <part>
            <measure number="1">
              <attributes><divisions>1</divisions></attributes>
              <note><rest/><duration>4</duration><voice>1</voice></note>
              <backup><duration>4</duration></backup>
              <note>
                <pitch><step>C</step><octave>4</octave></pitch>
                <duration>1</duration><voice>4</voice>
              </note>
            </measure>
            <measure number="2">
              <note>
                <pitch><step>C</step><octave>4</octave></pitch>
                <duration>1</duration><voice>1</voice>
              </note>
              <note><rest/><duration>3</duration><voice>1</voice></note>
              <backup><duration>4</duration></backup>
              <note print-object="no"><rest/><duration>4</duration><voice>4</voice></note>
            </measure>
          </part>
        </score-partwise>
        """
        let display = EarTrainingChordOsmdMusicXmlNormalizer.applyGuideNoteColors(xml)
        guard let root = ChordOsmdXmlParser.parse(display) else {
            XCTFail("display XML did not parse")
            return
        }
        func collect(_ el: ChordOsmdXmlElement, name: String) -> [ChordOsmdXmlElement] {
            var out: [ChordOsmdXmlElement] = []
            if el.name == name {
                out.append(el)
            }
            for child in el.children {
                if case let .element(inner) = child {
                    out.append(contentsOf: collect(inner, name: name))
                }
            }
            return out
        }
        let measures = collect(root, name: "measure")
        XCTAssertEqual(measures.count, 2)

        func notes(in measure: ChordOsmdXmlElement) -> [ChordOsmdXmlElement] {
            measure.children.compactMap { child in
                if case let .element(el) = child, el.name == "note" { return el }
                return nil
            }
        }
        func attr(_ el: ChordOsmdXmlElement, _ name: String) -> String? {
            el.attributes.first(where: { $0.name == name })?.value
        }
        func hasChild(_ el: ChordOsmdXmlElement, _ name: String) -> Bool {
            el.children.contains { child in
                if case let .element(inner) = child { return inner.name == name }
                return false
            }
        }
        func voice(_ el: ChordOsmdXmlElement) -> String? {
            for child in el.children {
                guard case let .element(inner) = child, inner.name == "voice" else { continue }
                for nested in inner.children {
                    if case let .text(text) = nested { return text.trimmingCharacters(in: .whitespacesAndNewlines) }
                }
            }
            return nil
        }

        let listenNotes = notes(in: measures[0])
        XCTAssertEqual(voice(listenNotes[0]), "1")
        XCTAssertTrue(hasChild(listenNotes[0], "rest"))
        XCTAssertEqual(attr(listenNotes[0], "print-object"), "no")
        XCTAssertEqual(attr(listenNotes[1], "color"), EarTrainingChordOsmdMusicXmlNormalizer.guideNoteColor)

        let playNotes = notes(in: measures[1])
        XCTAssertNil(attr(playNotes[0], "print-object"))
        XCTAssertNil(attr(playNotes[1], "print-object"))
        XCTAssertEqual(attr(playNotes[2], "print-object"), "no")
    }

    func testBuildFromMusicXmlSwingsOffbeatEighths() {
        let xml = """
        <?xml version="1.0" encoding="UTF-8"?>
        <score-partwise>
          <part>
            <measure number="1">
              <attributes>
                <divisions>2</divisions>
                <time><beats>4</beats><beat-type>4</beat-type></time>
                <key><fifths>0</fifths></key>
              </attributes>
              <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><type>eighth</type></note>
              <note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><type>eighth</type></note>
            </measure>
          </part>
        </score-partwise>
        """
        let even = EarTrainingPrecisionNotes.buildFromMusicXml(
            musicXmlText: xml,
            bpm: 120,
            beatsPerMeasure: 4,
            isSwing: false
        )
        let swing = EarTrainingPrecisionNotes.buildFromMusicXml(
            musicXmlText: xml,
            bpm: 120,
            beatsPerMeasure: 4,
            isSwing: true
        )
        XCTAssertEqual(even.notes.count, 2)
        XCTAssertEqual(swing.notes.count, 2)
        XCTAssertEqual(swing.notes[0].startSec, even.notes[0].startSec, accuracy: 0.00001)
        XCTAssertGreaterThan(swing.notes[1].startSec, even.notes[1].startSec)
        XCTAssertEqual(swing.notes[1].startSec, (60.0 / 120.0) * (2.0 / 3.0), accuracy: 0.00001)
    }

    func testBuildFromMusicXmlExcludesVoiceFourGuideNotes() {
        let displayXML = EarTrainingChordOsmdMusicXmlNormalizer.normalizeChordOsmdMusicXml(guideVoiceXML)
        XCTAssertTrue(displayXML.contains("<voice>4</voice>"))
        let result = EarTrainingPrecisionNotes.buildFromMusicXml(
            musicXmlText: displayXML,
            bpm: 120,
            beatsPerMeasure: 4
        )
        XCTAssertEqual(result.notes.map(\.midi), [60])
    }

    func testKeyboardRangeUsesWhiteKeyPadding() {
        let range = EarTrainingPrecisionNotes.resolveKeyboardRange(noteMidis: [60, 67])
        XCTAssertEqual(range.minMidi, 59)
        XCTAssertEqual(range.maxMidi, 69)
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

    func testFindNoteForInputPicksNearestMatchingNote() {
        let notes = [
            sampleNote(id: "a", midi: 60, startSec: 1),
            sampleNote(id: "b", midi: 60, startSec: 1.2),
        ]
        let states = EarTrainingPrecisionJudge.createRuntimeStates(notes: notes)
        let matched = EarTrainingPrecisionJudge.findNoteForInput(
            notes: notes,
            states: states,
            midi: 60,
            phraseTimeSec: 1.18,
            windowSec: 0.25
        )
        XCTAssertEqual(matched?.id, "b")
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

    func testRankForGoodRateExactThresholds() {
        XCTAssertEqual(EarTrainingPrecisionJudge.rankForGoodRate(0.95), .s)
        XCTAssertEqual(EarTrainingPrecisionJudge.rankForGoodRate(0.949999), .a)
        XCTAssertEqual(EarTrainingPrecisionJudge.rankForGoodRate(0.9), .a)
        XCTAssertEqual(EarTrainingPrecisionJudge.rankForGoodRate(0.899999), .b)
        XCTAssertEqual(EarTrainingPrecisionJudge.rankForGoodRate(0.8), .b)
        XCTAssertEqual(EarTrainingPrecisionJudge.rankForGoodRate(0.799999), .c)
        XCTAssertEqual(EarTrainingPrecisionJudge.rankForGoodRate(0.7), .c)
        XCTAssertEqual(EarTrainingPrecisionJudge.rankForGoodRate(0.699999), .d)
    }

    func testFindNoteForInputIgnoresWrongMidi() {
        let notes = [sampleNote(id: "a", midi: 60, startSec: 1)]
        let states = EarTrainingPrecisionJudge.createRuntimeStates(notes: notes)
        let matched = EarTrainingPrecisionJudge.findNoteForInput(
            notes: notes,
            states: states,
            midi: 61,
            phraseTimeSec: 1,
            windowSec: 0.25
        )
        XCTAssertNil(matched)
        let counts = EarTrainingPrecisionJudge.countJudgments(notes: notes, states: states)
        XCTAssertEqual(counts.pending, 1)
        XCTAssertEqual(counts.good, 0)
        XCTAssertEqual(counts.miss, 0)
    }

    func testFindNoteForInputNearestNeighborStealsLaterNote() {
        let notes = [
            sampleNote(id: "a", midi: 60, startSec: 1),
            sampleNote(id: "b", midi: 60, startSec: 1.25),
        ]
        var states = EarTrainingPrecisionJudge.createRuntimeStates(notes: notes)
        let matched = EarTrainingPrecisionJudge.findNoteForInput(
            notes: notes,
            states: states,
            midi: 60,
            phraseTimeSec: 1.15,
            windowSec: 0.25
        )
        XCTAssertEqual(matched?.id, "b")
        states["b"]?.judgment = .good
        _ = EarTrainingPrecisionJudge.markExpiredNotesAsMiss(
            notes: notes,
            states: &states,
            phraseTimeSec: 1.3,
            windowSec: 0.25
        )
        XCTAssertEqual(states["a"]?.judgment, .miss)
        XCTAssertEqual(states["b"]?.judgment, .good)
    }

    func testShouldFinishPhraseOnAudioEnded() {
        XCTAssertFalse(EarTrainingPrecisionJudge.shouldFinishPhraseOnAudioEnded(
            phraseTimeSec: 57.6,
            phraseLoopEndSec: 60.08
        ))
        XCTAssertFalse(EarTrainingPrecisionJudge.shouldFinishPhraseOnAudioEnded(
            phraseTimeSec: nil,
            phraseLoopEndSec: 60.08
        ))
        XCTAssertTrue(EarTrainingPrecisionJudge.shouldFinishPhraseOnAudioEnded(
            phraseTimeSec: 60.08,
            phraseLoopEndSec: 60.08
        ))
        XCTAssertTrue(EarTrainingPrecisionJudge.shouldFinishPhraseOnAudioEnded(
            phraseTimeSec: 61,
            phraseLoopEndSec: 60.08
        ))
    }

    func testMarkExpiredAtPhraseLoopEndBeforeScoring() {
        let notes = [sampleNote(id: "a", midi: 60, startSec: 10)]
        var states = EarTrainingPrecisionJudge.createRuntimeStates(notes: notes)
        _ = EarTrainingPrecisionJudge.markExpiredNotesAsMiss(
            notes: notes,
            states: &states,
            phraseTimeSec: 10.5,
            windowSec: 0.25
        )
        XCTAssertEqual(states["a"]?.judgment, .miss)
        XCTAssertEqual(EarTrainingPrecisionJudge.goodRate(notes: notes, states: states), 0)
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
