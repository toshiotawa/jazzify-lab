import XCTest
@testable import Jazzify

final class EarTrainingChordOsmdMusicXmlNormalizerTests: XCTestCase {
    func testStripOsmdCountInMeasuresFromMusicXml_carriesAttributesToNewFirstMeasure() {
        let xml = """
        <?xml version="1.0" encoding="UTF-8"?>
        <score-partwise version="3.1"><part id="P1">
        <measure number="1"><attributes>
        <divisions>2</divisions>
        <key><fifths>0</fifths><mode>major</mode></key>
        <time symbol="common"><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
        </attributes><note><rest measure="yes"/><duration>8</duration></note></measure>
        <measure number="2"><note><pitch><step>E</step><octave>4</octave></pitch><duration>8</duration></note></measure>
        </part></score-partwise>
        """

        let stripped = EarTrainingChordOsmdMusicXmlNormalizer.stripOsmdCountInMeasuresFromMusicXml(xml)

        XCTAssertEqual(stripped.components(separatedBy: "<measure").count - 1, 1)
        XCTAssertTrue(stripped.contains("<divisions>2</divisions>"))
        XCTAssertTrue(stripped.contains("<fifths>0</fifths>"))
        XCTAssertTrue(stripped.contains("symbol=\"common\""))
        XCTAssertTrue(stripped.contains("<sign>G</sign>"))
    }

    func testStripOsmdCountInMeasuresFromMusicXml_mergesMissingAttributeChildrenOnly() {
        let xml = """
        <?xml version="1.0" encoding="UTF-8"?>
        <score-partwise version="3.1"><part id="P1">
        <measure number="1"><attributes><divisions>2</divisions><key><fifths>-1</fifths></key></attributes><note><rest/><duration>8</duration></note></measure>
        <measure number="2"><attributes><divisions>4</divisions></attributes><note><pitch><step>C</step><octave>4</octave></pitch><duration>16</duration></note></measure>
        </part></score-partwise>
        """

        let stripped = EarTrainingChordOsmdMusicXmlNormalizer.stripOsmdCountInMeasuresFromMusicXml(xml)

        XCTAssertTrue(stripped.contains("<divisions>4</divisions>"))
        XCTAssertTrue(stripped.contains("<fifths>-1</fifths>"))
        XCTAssertFalse(stripped.contains("<fifths>0</fifths>"))
    }
}
