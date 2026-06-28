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
}
