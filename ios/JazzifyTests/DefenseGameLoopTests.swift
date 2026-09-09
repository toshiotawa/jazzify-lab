import XCTest
@testable import Jazzify

final class DefenseGameLoopTests: XCTestCase {
    func testClearAfterSurviveSeconds() {
        var runtime = DefenseRuntimeState(playerHp: 5, surviveSeconds: 2, maxEnemies: 3)
        let difficulty = DefenseDifficultyDefinition(
            level: 1,
            enemyHp: 1,
            spawnIntervalSec: 10,
            maxEnemies: 3,
            enemySpeedPxPerSec: 40,
            enemyDamage: 1,
            attackIntervalSec: 3,
            attackRangePx: 48
        )
        DefenseGameLoop.tick(runtime: &runtime, difficulty: difficulty, deltaTime: 2.1)
        XCTAssertEqual(runtime.result, .clear)
    }
}
