import XCTest
@testable import Jazzify

final class DefenseGameLoopTests: XCTestCase {
    private let difficulty = DefenseDifficultyDefinition(
        level: 1,
        enemyHp: 1,
        spawnIntervalSec: 10,
        maxEnemies: 3,
        enemySpeedPxPerSec: 40,
        enemyDamage: 1,
        attackIntervalSec: 3,
        attackRangePx: 48
    )

    func testClearAfterSurviveSeconds() {
        var runtime = DefenseRuntimeState(playerHp: 5, surviveSeconds: 2, maxEnemies: 3)
        DefenseGameLoop.tick(runtime: &runtime, difficulty: difficulty, deltaTime: 2.1)
        XCTAssertEqual(runtime.result, .clear)
    }

    func testSpawnPlacesGroundEnemyOnGroundLine() {
        var runtime = DefenseRuntimeState(playerHp: 5, surviveSeconds: 120, maxEnemies: 3)
        let quickSpawn = DefenseDifficultyDefinition(
            level: 1, enemyHp: 1, spawnIntervalSec: 0.5, maxEnemies: 3,
            enemySpeedPxPerSec: 40, enemyDamage: 1, attackIntervalSec: 3, attackRangePx: 48
        )
        DefenseGameLoop.tick(runtime: &runtime, difficulty: quickSpawn, deltaTime: 0.6)
        let enemy = runtime.enemies[0]
        XCTAssertTrue(enemy.isActive)
        XCTAssertEqual(enemy.type, .slime)
        XCTAssertEqual(enemy.y, DefenseEnemyConfig.groundY - enemy.type.spriteHeight / 2, accuracy: 0.001)
    }

    func testDamageAppliesAtLungePeakAndRecordsImpact() {
        var runtime = DefenseRuntimeState(playerHp: 5, surviveSeconds: 120, maxEnemies: 3)
        runtime.enemies[0].isActive = true
        runtime.enemies[0].type = .goblin
        runtime.enemies[0].x = runtime.playerX + 40
        runtime.enemies[0].y = DefenseEnemyConfig.centerY(for: .goblin)
        runtime.enemies[0].lastAttackAt = 1.0
        runtime.enemies[0].attackHitPending = true
        runtime.elapsedSec = 1.1

        DefenseGameLoop.tick(runtime: &runtime, difficulty: difficulty, deltaTime: 0.0)
        XCTAssertEqual(runtime.playerHp, 5)
        XCTAssertEqual(runtime.impactAt, DefenseEnemyConfig.noImpact)

        DefenseGameLoop.tick(runtime: &runtime, difficulty: difficulty, deltaTime: 0.1)
        XCTAssertEqual(runtime.playerHp, 4)
        XCTAssertEqual(runtime.impactAt, 1.2, accuracy: 0.001)
        XCTAssertFalse(runtime.enemies[0].attackHitPending)
    }

    func testAttackOffsetIsZeroOutsideLungeWindow() {
        XCTAssertEqual(DefenseEnemyConfig.attackOffset(attackElapsed: 0, flying: false), .zero)
        XCTAssertEqual(
            DefenseEnemyConfig.attackOffset(attackElapsed: DefenseEnemyConfig.attackLungeSec + 0.1, flying: false),
            .zero
        )
        let mid = DefenseEnemyConfig.attackOffset(attackElapsed: DefenseEnemyConfig.attackLungeSec * 0.5, flying: false)
        XCTAssertEqual(mid.x, -DefenseEnemyConfig.lungeDist, accuracy: 0.001)
    }
}
