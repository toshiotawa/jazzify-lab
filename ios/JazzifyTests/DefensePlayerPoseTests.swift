import XCTest
@testable import Jazzify

final class DefensePlayerPoseTests: XCTestCase {
    func testPrefersSkillPoseOverSlashAndGuard() {
        var runtime = DefenseRuntimeState(playerHp: 5, surviveSeconds: 120, maxEnemies: 3)
        runtime.elapsedSec = 1
        runtime.skillPoseStartSec = 0.8
        runtime.slashAt = 0.9
        runtime.guardPoseUntilSec = 2
        XCTAssertEqual(DefensePlayerPose.assetName(runtime: runtime), "Frame3")
    }

    func testShowsSlashPoseDuringSlashWindow() {
        var runtime = DefenseRuntimeState(playerHp: 5, surviveSeconds: 120, maxEnemies: 3)
        runtime.elapsedSec = 0.1
        runtime.slashAt = 0
        runtime.guardPoseUntilSec = 1
        XCTAssertEqual(DefensePlayerPose.assetName(runtime: runtime), DefensePlayerPose.slashAssetName)
    }

    func testShowsGuardPoseAfterSlashWindow() {
        var runtime = DefenseRuntimeState(playerHp: 5, surviveSeconds: 120, maxEnemies: 3)
        runtime.elapsedSec = DefenseEnemyConfig.slashSec + 0.05
        runtime.slashAt = 0
        runtime.guardPoseUntilSec = 1
        XCTAssertEqual(DefensePlayerPose.assetName(runtime: runtime), DefensePlayerPose.guardAssetName)
    }

    func testIdlePingPongOrder() {
        var runtime = DefenseRuntimeState(playerHp: 5, surviveSeconds: 120, maxEnemies: 3)
        runtime.elapsedSec = 0
        XCTAssertEqual(DefensePlayerPose.assetName(runtime: runtime), "defense_player_idle_1")
        runtime.elapsedSec = 0.28
        XCTAssertEqual(DefensePlayerPose.assetName(runtime: runtime), "defense_player_idle_2")
        runtime.elapsedSec = 0.56
        XCTAssertEqual(DefensePlayerPose.assetName(runtime: runtime), "defense_player_idle_3")
        runtime.elapsedSec = 0.84
        XCTAssertEqual(DefensePlayerPose.assetName(runtime: runtime), "defense_player_idle_2")
    }

    func testTrainingShowsSlashPoseDuringSlashWindow() {
        let assetName = DefensePlayerPose.trainingAssetName(
            elapsedSec: 1.5,
            slashUntilSec: 1.74,
            guardPoseUntilSec: 2.5
        )
        XCTAssertEqual(assetName, DefensePlayerPose.slashAssetName)
    }

    func testTrainingShowsGuardPoseAfterSlashWindow() {
        let assetName = DefensePlayerPose.trainingAssetName(
            elapsedSec: DefenseEnemyConfig.slashSec + 0.05,
            slashUntilSec: 0,
            guardPoseUntilSec: 1
        )
        XCTAssertEqual(assetName, DefensePlayerPose.guardAssetName)
    }

    func testTrainingIdlePingPongOrder() {
        XCTAssertEqual(
            DefensePlayerPose.trainingAssetName(elapsedSec: 0, slashUntilSec: 0, guardPoseUntilSec: 0),
            "defense_player_idle_1"
        )
        XCTAssertEqual(
            DefensePlayerPose.trainingAssetName(elapsedSec: 0.28, slashUntilSec: 0, guardPoseUntilSec: 0),
            "defense_player_idle_2"
        )
        XCTAssertEqual(
            DefensePlayerPose.trainingAssetName(elapsedSec: 0.56, slashUntilSec: 0, guardPoseUntilSec: 0),
            "defense_player_idle_3"
        )
        XCTAssertEqual(
            DefensePlayerPose.trainingAssetName(elapsedSec: 0.84, slashUntilSec: 0, guardPoseUntilSec: 0),
            "defense_player_idle_2"
        )
    }
}
