import XCTest
@testable import Jazzify

final class EarTrainingMusicXmlEnharmonicSimplifierTests: XCTestCase {
    override func setUp() {
        super.setUp()
        EnharmonicDisplayPreferences.save(true)
    }

    override func tearDown() {
        EnharmonicDisplayPreferences.save(true)
        super.tearDown()
    }

    func testSimplifySpelledPitchEsharpToF() {
        let simplified = EarTrainingMusicXmlEnharmonicSimplifier.simplifySpelledPitch(step: "E", alter: 1, octave: 4)
        XCTAssertEqual(simplified?.step, "F")
        XCTAssertEqual(simplified?.alter, 0)
        XCTAssertEqual(simplified?.octave, 4)
    }

    func testSimplifyMusicXmlNote() {
        let xml = """
        <?xml version="1.0" encoding="UTF-8"?>
        <score-partwise>
          <part>
            <measure>
              <attributes><key><fifths>0</fifths></key></attributes>
              <note><pitch><step>E</step><alter>1</alter><octave>4</octave></pitch></note>
            </measure>
          </part>
        </score-partwise>
        """
        let result = EarTrainingMusicXmlEnharmonicSimplifier.simplifyMusicXml(xml)
        XCTAssertTrue(result.contains("<step>F</step>"))
        XCTAssertFalse(result.contains("<alter>1</alter>"))
    }

    func testSimplifyMusicXmlReturnsOriginalWhenDisabled() {
        EnharmonicDisplayPreferences.save(false)
        let xml = """
        <?xml version="1.0" encoding="UTF-8"?>
        <score-partwise>
          <part>
            <measure>
              <note><pitch><step>E</step><alter>1</alter><octave>4</octave></pitch></note>
            </measure>
          </part>
        </score-partwise>
        """
        XCTAssertEqual(
            EarTrainingMusicXmlEnharmonicSimplifier.simplifyMusicXml(xml),
            xml
        )
    }
}
