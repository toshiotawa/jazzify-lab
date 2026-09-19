import XCTest
@testable import Jazzify

final class NotationInstrumentCatalogTests: XCTestCase {
    override func tearDown() {
        UserDefaults.standard.removeObject(forKey: "display.notationInstrumentId")
        UserDefaults.standard.removeObject(forKey: "display.notationOctaveShift")
        super.tearDown()
    }

    func testWrittenSemitoneOffsetForTrumpet() {
        let preset = NotationInstrumentCatalog.preset(for: "trumpet_bb")
        XCTAssertEqual(
            NotationInstrumentCatalog.writtenSemitoneOffset(preset: preset, userOctaveShift: 0),
            2
        )
        XCTAssertEqual(
            NotationInstrumentCatalog.writtenSemitoneOffset(preset: preset, userOctaveShift: 3),
            38
        )
    }

    func testConcertQuestionOffsetIgnoresUserOctaveShift() {
        NotationInstrumentPreferences.saveInstrumentId("piano")
        NotationInstrumentPreferences.saveOctaveShift(3)
        XCTAssertEqual(
            NotationInstrumentPreferences.loadConcertQuestionOffset(ignoreNotationInstrument: false),
            0
        )
        XCTAssertEqual(
            NotationInstrumentPreferences.loadWrittenOffset(ignoreNotationInstrument: false),
            36
        )
    }

    func testClampOctaveShift() {
        XCTAssertEqual(NotationInstrumentCatalog.clampOctaveShift(-4), -3)
        XCTAssertEqual(NotationInstrumentCatalog.clampOctaveShift(4), 3)
    }

    func testTransposingInstrumentLabelsIncludeKey() {
        XCTAssertEqual(NotationInstrumentCatalog.preset(for: "soprano_sax").labelJa, "ソプラノサックス in B♭")
        XCTAssertEqual(NotationInstrumentCatalog.preset(for: "alto_sax").labelEn, "Alto Sax in E♭")
        XCTAssertEqual(NotationInstrumentCatalog.preset(for: "tenor_sax").labelJa, "テナーサックス in B♭")
        XCTAssertEqual(NotationInstrumentCatalog.preset(for: "baritone_sax").labelEn, "Baritone Sax in E♭")
        XCTAssertTrue(NotationInstrumentCatalog.preset(for: "trumpet_bb").labelJa.contains("in B♭"))
        XCTAssertTrue(NotationInstrumentCatalog.preset(for: "french_horn_f").labelJa.contains("in F"))
    }
}
