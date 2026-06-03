import XCTest
@testable import Jazzify

final class EarTrainingPianoLayoutTests: XCTestCase {
    func testShrunkAndEnlargedVisibleWhiteKeysStepWithinBounds() {
        XCTAssertEqual(EarTrainingPianoLayout.shrunkVisibleWhiteKeys(after: 21), 25)
        XCTAssertEqual(EarTrainingPianoLayout.shrunkVisibleWhiteKeys(after: 25), 29)
        XCTAssertEqual(EarTrainingPianoLayout.shrunkVisibleWhiteKeys(after: 29), 35)
        XCTAssertEqual(EarTrainingPianoLayout.shrunkVisibleWhiteKeys(after: 35), 35)

        XCTAssertEqual(EarTrainingPianoLayout.enlargedVisibleWhiteKeys(after: 35), 29)
        XCTAssertEqual(EarTrainingPianoLayout.enlargedVisibleWhiteKeys(after: 29), 25)
        XCTAssertEqual(EarTrainingPianoLayout.enlargedVisibleWhiteKeys(after: 25), 21)
        XCTAssertEqual(EarTrainingPianoLayout.enlargedVisibleWhiteKeys(after: 21), 21)
    }

    func testClampedVisibleWhiteKeysRejectsInvalidValues() {
        XCTAssertEqual(EarTrainingPianoLayout.clampedVisibleWhiteKeys(99), 21)
        XCTAssertEqual(EarTrainingPianoLayout.clampedVisibleWhiteKeys(0), 21)
        XCTAssertEqual(EarTrainingPianoLayout.clampedVisibleWhiteKeys(29), 29)
    }

    func testWhiteKeyWidthScrollModeUsesViewportDivision() {
        let width: CGFloat = 390
        let atMax = EarTrainingPianoLayout.whiteKeyWidth(
            viewportWidth: width,
            visibleWhiteKeys: 21,
            fitsFullKeyboard: false,
            whiteKeyCount: EarTrainingPianoLayout.fullWhiteKeyCount
        )
        let atMin = EarTrainingPianoLayout.whiteKeyWidth(
            viewportWidth: width,
            visibleWhiteKeys: 35,
            fitsFullKeyboard: false,
            whiteKeyCount: EarTrainingPianoLayout.fullWhiteKeyCount
        )
        XCTAssertEqual(atMax, 390 / 21, accuracy: 0.001)
        XCTAssertEqual(atMin, 390 / 35, accuracy: 0.001)
        XCTAssertLessThan(atMin, atMax)
    }

    func testCanEnlargeAndShrinkKeysAtBounds() {
        XCTAssertFalse(EarTrainingPianoLayout.canEnlargeKeys(after: 21))
        XCTAssertTrue(EarTrainingPianoLayout.canEnlargeKeys(after: 29))
        XCTAssertTrue(EarTrainingPianoLayout.canShrinkKeys(after: 21))
        XCTAssertFalse(EarTrainingPianoLayout.canShrinkKeys(after: 35))
    }

    func testPreferencesClampInvalidStoredValue() {
        let defaults = UserDefaults.standard
        let key = "earTraining.piano.visibleWhiteKeys"
        let prior = defaults.integer(forKey: key)
        defer { defaults.set(prior, forKey: key) }

        defaults.set(99, forKey: key)
        XCTAssertEqual(EarTrainingPianoPreferences.loadVisibleWhiteKeys(), 21)

        EarTrainingPianoPreferences.saveVisibleWhiteKeys(35)
        XCTAssertEqual(defaults.integer(forKey: key), 35)
        XCTAssertEqual(EarTrainingPianoPreferences.loadVisibleWhiteKeys(), 35)
    }
}
