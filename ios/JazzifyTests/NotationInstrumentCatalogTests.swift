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

    func testClefStaffNumberAndFixedActiveStaves() {
        XCTAssertEqual(NotationInstrumentClef.treble.singleStaffNumber, 1)
        XCTAssertEqual(NotationInstrumentClef.bass.singleStaffNumber, 2)
        XCTAssertNil(NotationInstrumentClef.grand.singleStaffNumber)
        XCTAssertEqual(
            NotationInstrumentClef.resolveFixedActiveStaves(clefOverride: .bass, fallback: [1]),
            [2]
        )
        XCTAssertEqual(
            NotationInstrumentClef.resolveFixedActiveStaves(clefOverride: .treble, fallback: [1, 2]),
            [1]
        )
        XCTAssertEqual(
            NotationInstrumentClef.resolveFixedActiveStaves(clefOverride: .grand, fallback: [1]),
            [1]
        )
        XCTAssertEqual(
            NotationInstrumentClef.resolveFixedActiveStaves(clefOverride: nil, fallback: [1, 2]),
            [1, 2]
        )
        XCTAssertNil(NotationInstrumentClef.resolveFixedActiveStaves(clefOverride: nil, fallback: nil))
    }

    func testDefenseDisplayStavesFollowInstrumentClef() {
        XCTAssertEqual(DefenseStaffLayout.treble.displayStaves(for: .bass), [2])
        XCTAssertEqual(DefenseStaffLayout.grand.displayStaves(for: .bass), [2])
        XCTAssertEqual(DefenseStaffLayout.treble.displayStaves(for: .treble), [1])
        XCTAssertEqual(DefenseStaffLayout.grand.displayStaves(for: .grand), [1, 2])
        XCTAssertEqual(DefenseStaffLayout.treble.displayStaves(for: .grand), [1])
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
