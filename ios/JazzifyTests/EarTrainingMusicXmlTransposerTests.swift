import XCTest
@testable import Jazzify

final class EarTrainingMusicXmlTransposerTests: XCTestCase {
    private let sampleMusicXml = """
    <?xml version="1.0" encoding="UTF-8"?>
    <score-partwise>
      <part>
        <measure>
          <attributes>
            <key><fifths>-1</fifths></key>
          </attributes>
          <note><pitch><step>F</step><octave>4</octave></pitch></note>
        </measure>
      </part>
    </score-partwise>
    """

    func testReadKeyFifthsFromMusicXml() {
        XCTAssertEqual(EarTrainingMusicXmlTransposer.readKeyFifths(fromMusicXml: sampleMusicXml), -1)
    }

    func testPreferredKeyName() {
        XCTAssertEqual(EarTrainingMusicXmlTransposer.preferredKeyName(fifths: -1), "F")
        XCTAssertEqual(EarTrainingMusicXmlTransposer.preferredKeyName(fifths: 0), "C")
    }

    func testTargetKeyNamePlusTwoFromF() {
        XCTAssertEqual(
            EarTrainingMusicXmlTransposer.targetKeyName(originalFifths: -1, semitoneOffset: 2),
            "G"
        )
    }

    func testClampPracticeTransposeOffset() {
        XCTAssertEqual(EarTrainingMusicXmlTransposer.clampPracticeTransposeOffset(-10), -6)
        XCTAssertEqual(EarTrainingMusicXmlTransposer.clampPracticeTransposeOffset(10), -2)
        XCTAssertEqual(EarTrainingMusicXmlTransposer.clampPracticeTransposeOffset(6), 6)
    }

    func testTransposeMusicXmlDownTwoSemitonesFromF() {
        let transposed = EarTrainingMusicXmlTransposer.transposeMusicXml(sampleMusicXml, semitones: -2)
        XCTAssertEqual(EarTrainingMusicXmlTransposer.readKeyFifths(fromMusicXml: transposed), -3)
        XCTAssertTrue(transposed.contains("<step>E</step>") || transposed.contains("<step>D</step>"))
        XCTAssertFalse(transposed.contains("<step>F</step><octave>4</octave>"))
    }

    func testTransposeMusicXmlUpdatesFifths() {
        let transposed = EarTrainingMusicXmlTransposer.transposeMusicXml(sampleMusicXml, semitones: 2)
        XCTAssertNotEqual(transposed, sampleMusicXml)
        XCTAssertEqual(EarTrainingMusicXmlTransposer.readKeyFifths(fromMusicXml: transposed), 1)
    }

    func testApplyPracticeTransposeReturnsBaseWhenZero() {
        XCTAssertEqual(
            EarTrainingMusicXmlTransposer.applyPracticeTransposeToMusicXml(sampleMusicXml, offset: 0),
            sampleMusicXml
        )
    }

    func testTransposeChordLabel() {
        XCTAssertEqual(EarTrainingMusicXmlTransposer.transposeChordLabel("C7", semitones: 2), "D7")
        XCTAssertEqual(EarTrainingMusicXmlTransposer.transposeChordLabel("Cm7", semitones: 2), "Dm7")
        XCTAssertEqual(EarTrainingMusicXmlTransposer.transposeChordLabel("Bb7", semitones: 2), "C7")
        XCTAssertEqual(EarTrainingMusicXmlTransposer.transposeChordLabel("F#dim7", semitones: 2), "G#dim7")
        XCTAssertEqual(EarTrainingMusicXmlTransposer.transposeChordLabel("C/E", semitones: 2), "D/F#")
        XCTAssertEqual(EarTrainingMusicXmlTransposer.transposeChordLabel("Bb/D", semitones: 2), "C/E")
    }

    func testTransposeMusicXmlTransposesHarmonyBass() {
        let xml = """
        <?xml version="1.0" encoding="UTF-8"?>
        <score-partwise>
          <part>
            <measure>
              <attributes><key><fifths>0</fifths></key></attributes>
              <harmony>
                <root><root-step>C</root-step></root>
                <kind>major</kind>
                <bass><bass-step>E</bass-step></bass>
              </harmony>
              <note><pitch><step>C</step><octave>4</octave></pitch></note>
            </measure>
          </part>
        </score-partwise>
        """
        let transposed = EarTrainingMusicXmlTransposer.transposeMusicXml(xml, semitones: 2)
        XCTAssertTrue(transposed.contains("<root-step>D</root-step>"))
        XCTAssertTrue(transposed.contains("<bass-step>F</bass-step>"))
        XCTAssertTrue(transposed.contains("<bass-alter>1</bass-alter>"))
    }
}
