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
}
