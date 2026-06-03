import XCTest
@testable import Jazzify

final class SurvivalChordPadLayoutTests: XCTestCase {
    func testShrunkAndEnlargedVisibleWhiteKeysStepWithinBounds() {
        XCTAssertEqual(SurvivalChordPadLayout.shrunkVisibleWhiteKeys(after: 14), 18)
        XCTAssertEqual(SurvivalChordPadLayout.shrunkVisibleWhiteKeys(after: 18), 22)
        XCTAssertEqual(SurvivalChordPadLayout.shrunkVisibleWhiteKeys(after: 22), 28)
        XCTAssertEqual(SurvivalChordPadLayout.shrunkVisibleWhiteKeys(after: 28), 28)

        XCTAssertEqual(SurvivalChordPadLayout.enlargedVisibleWhiteKeys(after: 28), 22)
        XCTAssertEqual(SurvivalChordPadLayout.enlargedVisibleWhiteKeys(after: 22), 18)
        XCTAssertEqual(SurvivalChordPadLayout.enlargedVisibleWhiteKeys(after: 18), 14)
        XCTAssertEqual(SurvivalChordPadLayout.enlargedVisibleWhiteKeys(after: 14), 14)
    }

    func testClampedVisibleWhiteKeysRejectsInvalidValues() {
        XCTAssertEqual(SurvivalChordPadLayout.clampedVisibleWhiteKeys(99), 14)
        XCTAssertEqual(SurvivalChordPadLayout.clampedVisibleWhiteKeys(0), 14)
        XCTAssertEqual(SurvivalChordPadLayout.clampedVisibleWhiteKeys(22), 22)
    }

    func testWhiteKeyWidthScrollModeUsesViewportDivision() {
        let width: CGFloat = 390
        let atMax = SurvivalChordPadLayout.whiteKeyWidth(
            viewportWidth: width,
            visibleWhiteKeys: 14,
            fitsFullKeyboard: false,
            whiteKeyCount: 52
        )
        let atMin = SurvivalChordPadLayout.whiteKeyWidth(
            viewportWidth: width,
            visibleWhiteKeys: 28,
            fitsFullKeyboard: false,
            whiteKeyCount: 52
        )
        XCTAssertEqual(atMax, 390 / 14, accuracy: 0.001)
        XCTAssertEqual(atMin, 390 / 28, accuracy: 0.001)
        XCTAssertLessThan(atMin, atMax)
    }

    func testCanEnlargeAndShrinkKeysAtBounds() {
        XCTAssertFalse(SurvivalChordPadLayout.canEnlargeKeys(after: 14))
        XCTAssertTrue(SurvivalChordPadLayout.canEnlargeKeys(after: 22))
        XCTAssertTrue(SurvivalChordPadLayout.canShrinkKeys(after: 14))
        XCTAssertFalse(SurvivalChordPadLayout.canShrinkKeys(after: 28))
    }

    func testPreferencesClampInvalidStoredValue() {
        let defaults = UserDefaults.standard
        let key = "survival.chordPad.visibleWhiteKeys"
        let prior = defaults.integer(forKey: key)
        defer { defaults.set(prior, forKey: key) }

        defaults.set(99, forKey: key)
        XCTAssertEqual(SurvivalChordPadPreferences.loadVisibleWhiteKeys(), 14)

        SurvivalChordPadPreferences.saveVisibleWhiteKeys(28)
        XCTAssertEqual(defaults.integer(forKey: key), 28)
        XCTAssertEqual(SurvivalChordPadPreferences.loadVisibleWhiteKeys(), 28)
    }
}
