import XCTest
@testable import Jazzify

final class EarTrainingOsmdCameraEffectPreferencesTests: XCTestCase {
    private let storageKey = EarTrainingOsmdCameraEffectPreferences.storageKey

    override func tearDown() {
        UserDefaults.standard.removeObject(forKey: storageKey)
        super.tearDown()
    }

    func testLoadDefaultsToFalseWhenUnset() {
        UserDefaults.standard.removeObject(forKey: storageKey)
        XCTAssertFalse(EarTrainingOsmdCameraEffectPreferences.loadSuppressTargetSuccessCameraZoom())
    }

    func testSaveAndLoadTrue() {
        EarTrainingOsmdCameraEffectPreferences.saveSuppressTargetSuccessCameraZoom(true)
        XCTAssertTrue(EarTrainingOsmdCameraEffectPreferences.loadSuppressTargetSuccessCameraZoom())
    }

    func testSaveAndLoadFalse() {
        EarTrainingOsmdCameraEffectPreferences.saveSuppressTargetSuccessCameraZoom(true)
        EarTrainingOsmdCameraEffectPreferences.saveSuppressTargetSuccessCameraZoom(false)
        XCTAssertFalse(EarTrainingOsmdCameraEffectPreferences.loadSuppressTargetSuccessCameraZoom())
    }
}
