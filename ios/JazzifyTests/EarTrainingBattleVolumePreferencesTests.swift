import XCTest
@testable import Jazzify

final class EarTrainingBattleVolumePreferencesTests: XCTestCase {
    private let defaults = UserDefaults.standard

    override func tearDown() {
        defaults.removeObject(forKey: EarTrainingBattleVolumePreferences.masterKey)
        defaults.removeObject(forKey: EarTrainingBattleVolumePreferences.musicKey)
        super.tearDown()
    }

    func testPhraseVolumeMultipliesMasterAndMusic() {
        XCTAssertEqual(
            EarTrainingBattleVolumePreferences.phraseVolume(master: 1.0, music: 0.7),
            0.7,
            accuracy: 0.0001
        )
        XCTAssertEqual(
            EarTrainingBattleVolumePreferences.phraseVolume(master: 0.5, music: 0.8),
            0.4,
            accuracy: 0.0001
        )
    }

    func testPhraseVolumeClampsOutOfRangeInputs() {
        XCTAssertEqual(
            EarTrainingBattleVolumePreferences.phraseVolume(master: -1.0, music: 2.0),
            0.0,
            accuracy: 0.0001
        )
        XCTAssertEqual(
            EarTrainingBattleVolumePreferences.phraseVolume(master: 1.5, music: 0.6),
            0.6,
            accuracy: 0.0001
        )
    }

    func testSavePersistsMasterAndMusic() {
        EarTrainingBattleVolumePreferences.save(master: 0.6, music: 0.45)
        XCTAssertEqual(
            EarTrainingBattleVolumePreferences.loadDouble(
                key: EarTrainingBattleVolumePreferences.masterKey,
                fallback: 0
            ),
            0.6,
            accuracy: 0.0001
        )
        XCTAssertEqual(
            EarTrainingBattleVolumePreferences.loadDouble(
                key: EarTrainingBattleVolumePreferences.musicKey,
                fallback: 0
            ),
            0.45,
            accuracy: 0.0001
        )
        XCTAssertEqual(
            EarTrainingBattleVolumePreferences.loadPhraseVolume(),
            0.27,
            accuracy: 0.0001
        )
    }
}
