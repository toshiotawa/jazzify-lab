import XCTest
@testable import Jazzify

final class ScreenRotationPreferencesTests: XCTestCase {
    private let storageKey = ScreenRotationPreferences.storageKey

    override func tearDown() {
        UserDefaults.standard.removeObject(forKey: storageKey)
        super.tearDown()
    }

    func testLoadDefaultsToFalseWhenUnset() {
        UserDefaults.standard.removeObject(forKey: storageKey)
        XCTAssertFalse(ScreenRotationPreferences.load())
    }

    func testSaveAndLoadTrue() {
        ScreenRotationPreferences.save(true)
        XCTAssertTrue(ScreenRotationPreferences.load())
    }

    func testSaveAndLoadFalse() {
        ScreenRotationPreferences.save(true)
        ScreenRotationPreferences.save(false)
        XCTAssertFalse(ScreenRotationPreferences.load())
    }
}
