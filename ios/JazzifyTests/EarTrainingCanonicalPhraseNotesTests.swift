import XCTest
@testable import Jazzify

final class EarTrainingCanonicalPhraseNotesTests: XCTestCase {
    private func miniXml(_ body: String) -> String {
        """
        <?xml version="1.0" encoding="UTF-8"?>
        <score-partwise>
          <part>
            <measure number="1">
              \(body)
            </measure>
          </part>
        </score-partwise>
        """
    }

    func testMergedMissingMidiNoteKeepsXmlTimingForRightHand() {
        let xml = miniXml("""
        <attributes><divisions>1</divisions><staves>2</staves></attributes>
        <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><staff>1</staff></note>
        <backup><duration>1</duration></backup>
        <note><pitch><step>E</step><octave>3</octave></pitch><duration>1</duration><staff>2</staff></note>
        """)
        let built = EarTrainingCanonicalPhraseNotes.build(
            EarTrainingCanonicalPhraseNotes.BuildParams(
                musicXmlText: xml,
                midiData: nil,
                midiNotes: [(midi: 52, startSec: 0.05, durationSec: nil)],
                bpm: 120,
                beatsPerMeasure: 4,
                isSwing: false,
                transposeOffset: 0,
                audioAnchorMs: nil
            )
        )
        XCTAssertEqual(built.timingSource, .midiMergedXml)
        XCTAssertEqual(built.notes.map(\.midi).sorted(), [52, 60])
        let lh = built.notes.first { $0.midi == 52 }
        let rh = built.notes.first { $0.midi == 60 }
        XCTAssertEqual(lh?.startSec ?? 0, 0.05, accuracy: 0.001)
        XCTAssertEqual(rh?.startSec ?? 0, 0, accuracy: 0.001)
    }

    func testOsmdAndPrecisionShareStartSecWithinOneMs() {
        let xml = miniXml("""
        <attributes><divisions>1</divisions><staves>2</staves></attributes>
        <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><staff>1</staff></note>
        <backup><duration>1</duration></backup>
        <note><pitch><step>E</step><octave>3</octave></pitch><duration>1</duration><staff>2</staff></note>
        """)
        let canonical = EarTrainingCanonicalPhraseNotes.build(
            EarTrainingCanonicalPhraseNotes.BuildParams(
                musicXmlText: xml,
                midiData: nil,
                midiNotes: [(midi: 52, startSec: 0.05, durationSec: nil)],
                bpm: 120,
                beatsPerMeasure: 4,
                isSwing: false,
                transposeOffset: 0,
                audioAnchorMs: nil
            )
        )
        let osmd = EarTrainingCanonicalPhraseNotes.toOsmdRhythmTargets(
            notes: canonical.notes,
            chords: [],
            attacks: canonical.attacks
        )
        let precision = EarTrainingCanonicalPhraseNotes.toPrecisionNotes(canonical.notes, bpm: 120)
        for pNote in precision {
            let target = osmd.first { draft in draft.midiCounts[pNote.midi, default: 0] > 0 }
            XCTAssertNotNil(target)
            XCTAssertLessThan(abs((target?.targetTimeSec ?? 0) - pNote.startSec), 0.001)
        }
    }

    func testAudioAnchorMsShiftsStartSec() {
        let xml = miniXml("""
        <attributes><divisions>1</divisions></attributes>
        <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration></note>
        """)
        let built = EarTrainingCanonicalPhraseNotes.build(
            EarTrainingCanonicalPhraseNotes.BuildParams(
                musicXmlText: xml,
                midiData: nil,
                midiNotes: nil,
                bpm: 120,
                beatsPerMeasure: 4,
                isSwing: false,
                transposeOffset: 0,
                audioAnchorMs: 25
            )
        )
        XCTAssertEqual(built.notes.first?.startSec ?? 0, 0.025, accuracy: 0.0001)
    }
}
