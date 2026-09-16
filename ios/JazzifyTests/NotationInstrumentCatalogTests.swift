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
}
