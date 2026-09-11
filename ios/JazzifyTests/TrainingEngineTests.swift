import XCTest
@testable import Jazzify

final class TrainingEngineTests: XCTestCase {
    func testPerformDefeatActivatesDyingSlotAndSpawnsNextEnemy() {
        var runtime = TrainingEngine.createInitialRuntime()
        TrainingEngine.performDefeat(runtime: &runtime, nowSec: 1.5, guardPoseSec: 1)

        XCTAssertTrue(runtime.dyingEnemy.active)
        XCTAssertEqual(runtime.dyingEnemy.typeIndex, 0)
        XCTAssertEqual(runtime.dyingEnemy.alpha, 1)
        XCTAssertEqual(runtime.dyingEnemy.offsetX, 0)
        XCTAssertGreaterThan(runtime.dyingEnemy.slashUntilSec, 1.5)
        XCTAssertEqual(runtime.enemy.slashUntilSec, 0)
        XCTAssertEqual(runtime.enemy.typeIndex, 1)
        XCTAssertEqual(runtime.enemy.fadeAlpha, 1)
        XCTAssertEqual(runtime.guardPoseUntilSec, 2.5, accuracy: 0.001)
    }

    func testTickEnemyFadesDyingSlot() {
        var runtime = TrainingEngine.createInitialRuntime()
        TrainingEngine.performDefeat(runtime: &runtime, nowSec: 1.5, guardPoseSec: 0)

        TrainingEngine.tickEnemy(runtime: &runtime, nowSec: 1.6, dt: 0.5)
        XCTAssertLessThan(runtime.dyingEnemy.alpha, 1)
        XCTAssertGreaterThan(runtime.dyingEnemy.offsetX, 0)

        TrainingEngine.tickEnemy(runtime: &runtime, nowSec: 2.0, dt: 0.5)
        XCTAssertFalse(runtime.dyingEnemy.active)
    }
}
