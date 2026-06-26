import XCTest
@testable import Jazzify

final class SurvivalStaffOverlayLayoutTests: XCTestCase {
    private let iPhoneKey = "survival.staff.spacingScale.iphone"
    private let iPadKey = "survival.staff.spacingScale.ipad"

    override func tearDown() {
        UserDefaults.standard.removeObject(forKey: iPhoneKey)
        UserDefaults.standard.removeObject(forKey: iPadKey)
        super.tearDown()
    }

    func testDefaultStaffSpacingScale() {
        XCTAssertEqual(SurvivalStaffSizePreferences.loadScale(isPad: true), 1.4)
        XCTAssertEqual(SurvivalStaffSizePreferences.loadScale(isPad: false), 1.3)
        XCTAssertEqual(SurvivalStaffOverlayLayout.staffSpacingScale(isPad: true), 1.4)
        XCTAssertEqual(SurvivalStaffOverlayLayout.staffSpacingScale(isPad: false), 1.3)
    }

    func testIPhoneScaleRangeAndPersistence() {
        SurvivalStaffSizePreferences.saveScale(1.0, isPad: false)
        XCTAssertEqual(SurvivalStaffSizePreferences.loadScale(isPad: false), 1.0)
        XCTAssertEqual(SurvivalStaffSizePreferences.displayPercent(from: 1.0, isPad: false), 77)

        SurvivalStaffSizePreferences.saveScale(1.5, isPad: false)
        XCTAssertEqual(SurvivalStaffSizePreferences.loadScale(isPad: false), 1.3)

        XCTAssertEqual(SurvivalStaffSizePreferences.sliderValue(from: 1.3, isPad: false), 1.0, accuracy: 0.001)
        XCTAssertEqual(SurvivalStaffSizePreferences.sliderValue(from: 1.0, isPad: false), 0.0, accuracy: 0.001)
    }

    func testIPadScaleRangeAndPersistence() {
        SurvivalStaffSizePreferences.saveScale(1.82, isPad: true)
        XCTAssertEqual(SurvivalStaffSizePreferences.loadScale(isPad: true), 1.82)
        XCTAssertEqual(SurvivalStaffSizePreferences.displayPercent(from: 1.82, isPad: true), 130)

        SurvivalStaffSizePreferences.saveScale(1.0, isPad: true)
        XCTAssertEqual(SurvivalStaffSizePreferences.loadScale(isPad: true), 1.4)

        XCTAssertEqual(SurvivalStaffSizePreferences.sliderValue(from: 1.4, isPad: true), 0.0, accuracy: 0.001)
    }

    func testCenterStaffMaxHeightIPhoneSingleStaff() {
        XCTAssertEqual(
            SurvivalStaffOverlayLayout.centerStaffMaxHeight(isPad: false, grandStaff: false),
            208
        )
    }

    func testCenterStaffMaxHeightIPhoneGrandStaff() {
        XCTAssertEqual(
            SurvivalStaffOverlayLayout.centerStaffMaxHeight(isPad: false, grandStaff: true),
            338
        )
    }

    func testCenterStaffMaxHeightScalesWithUserPreferenceOnIPhone() {
        SurvivalStaffSizePreferences.saveScale(1.0, isPad: false)
        XCTAssertEqual(
            SurvivalStaffOverlayLayout.centerStaffMaxHeight(isPad: false, grandStaff: false),
            160
        )
    }

    func testScenarioStaffMaxHeightIPhoneSingleStaff() {
        XCTAssertEqual(
            SurvivalStaffOverlayLayout.scenarioStaffMaxHeight(isPad: false, grandStaff: false),
            286
        )
    }

    func testScenarioStaffMaxHeightIPhoneGrandStaff() {
        XCTAssertEqual(
            SurvivalStaffOverlayLayout.scenarioStaffMaxHeight(isPad: false, grandStaff: true),
            338
        )
    }

    func testCenterStaffMaxHeightIPadUnchangedAtDefaultScale() {
        XCTAssertEqual(
            SurvivalStaffOverlayLayout.centerStaffMaxHeight(isPad: true, grandStaff: false),
            224
        )
        XCTAssertEqual(
            SurvivalStaffOverlayLayout.centerStaffMaxHeight(isPad: true, grandStaff: true),
            300
        )
    }

    func testCenterStaffMaxHeightIPadScalesUpWithUserPreference() {
        SurvivalStaffSizePreferences.saveScale(1.82, isPad: true)
        XCTAssertEqual(
            SurvivalStaffOverlayLayout.centerStaffMaxHeight(isPad: true, grandStaff: false),
            291
        )
    }

    func testScenarioStaffMaxHeightIPadUnchangedAtDefaultScale() {
        XCTAssertEqual(
            SurvivalStaffOverlayLayout.scenarioStaffMaxHeight(isPad: true, grandStaff: false),
            308
        )
        XCTAssertEqual(
            SurvivalStaffOverlayLayout.scenarioStaffMaxHeight(isPad: true, grandStaff: true),
            364
        )
    }

    func testBattleStaffOverlayAlignment() {
        XCTAssertEqual(SurvivalStaffOverlayLayout.battleStaffOverlayAlignment(grandStaff: false), .center)
        XCTAssertEqual(SurvivalStaffOverlayLayout.battleStaffOverlayAlignment(grandStaff: true), .top)
    }

    func testCenterStaffMaxWidthUnchanged() {
        XCTAssertEqual(SurvivalStaffOverlayLayout.centerStaffMaxWidth(isPad: false), 560)
        XCTAssertEqual(SurvivalStaffOverlayLayout.centerStaffMaxWidth(isPad: true), 784)
    }
}
