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

    private func applyGoblinStats(_ enemy: inout DefenseEnemyState) {
        let resolved = DefenseEnemyConfig.resolveEnemyStats(type: .goblin, difficulty: difficulty)
        enemy.speedPxPerSec = resolved.speedPxPerSec
        enemy.damage = resolved.damage
        enemy.attackIntervalSec = resolved.attackIntervalSec
        enemy.attackRangePx = resolved.attackRangePx
        enemy.knockbackMult = resolved.knockbackMult
    }

    func testClearAfterSurviveSeconds() {
        var runtime = DefenseRuntimeState(playerHp: 5, surviveSeconds: 2, maxEnemies: 3)
        DefenseGameLoop.tick(runtime: &runtime, difficulty: difficulty, deltaTime: 2.1)
        XCTAssertEqual(runtime.result, .clear)
    }

    func testPracticeModeDoesNotClearAfterSurviveSeconds() {
        var runtime = DefenseRuntimeState(playerHp: 5, surviveSeconds: 2, maxEnemies: 3, practiceMode: true)
        DefenseGameLoop.tick(runtime: &runtime, difficulty: difficulty, deltaTime: 2.1)
        XCTAssertEqual(runtime.result, .playing)
        XCTAssertGreaterThanOrEqual(runtime.elapsedSec, 2)
    }

    func testPracticeModeRecordsImpactWithoutReducingPlayerHp() {
        var runtime = DefenseRuntimeState(playerHp: 5, surviveSeconds: 120, maxEnemies: 3, practiceMode: true)
        runtime.enemies[0].isActive = true
        runtime.enemies[0].type = .goblin
        runtime.enemies[0].x = runtime.playerX + 40
        runtime.enemies[0].y = DefenseEnemyConfig.centerY(for: .goblin)
        applyGoblinStats(&runtime.enemies[0])
        runtime.enemies[0].lastAttackAt = 1.0
        runtime.enemies[0].attackHitPending = true
        runtime.elapsedSec = 1.1

        DefenseGameLoop.tick(runtime: &runtime, difficulty: difficulty, deltaTime: 0.0)
        XCTAssertEqual(runtime.playerHp, 5)
        XCTAssertEqual(runtime.impactAt, DefenseEnemyConfig.noImpact)

        DefenseGameLoop.tick(runtime: &runtime, difficulty: difficulty, deltaTime: 0.1)
        XCTAssertEqual(runtime.playerHp, 5)
        XCTAssertEqual(runtime.impactAt, 1.2, accuracy: 0.001)
        XCTAssertFalse(runtime.enemies[0].attackHitPending)
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

    func testPracticeModeSpawnsAllTypesWithoutWaveChanges() {
        var runtime = DefenseRuntimeState(playerHp: 5, surviveSeconds: 120, maxEnemies: 12, practiceMode: true)
        let quickSpawn = DefenseDifficultyDefinition(
            level: 1, enemyHp: 1, spawnIntervalSec: 0.5, maxEnemies: 12,
            enemySpeedPxPerSec: 40, enemyDamage: 1, attackIntervalSec: 3, attackRangePx: 48
        )
        DefenseGameLoop.tick(runtime: &runtime, difficulty: quickSpawn, deltaTime: 0.6)
        DefenseGameLoop.tick(runtime: &runtime, difficulty: quickSpawn, deltaTime: 0.6)
        DefenseGameLoop.tick(runtime: &runtime, difficulty: quickSpawn, deltaTime: 0.6)
        XCTAssertEqual(runtime.enemies[0].type, .slime)
        XCTAssertEqual(runtime.enemies[1].type, .bat)
        XCTAssertEqual(runtime.enemies[2].type, .goblin)
        XCTAssertEqual(runtime.waveIndex, 0)
        XCTAssertEqual(runtime.waveSpawnCount, 0)
    }

    func testDamageAppliesAtLungePeakAndRecordsImpact() {
        var runtime = DefenseRuntimeState(playerHp: 5, surviveSeconds: 120, maxEnemies: 3)
        runtime.enemies[0].isActive = true
        runtime.enemies[0].type = .goblin
        runtime.enemies[0].x = runtime.playerX + 40
        runtime.enemies[0].y = DefenseEnemyConfig.centerY(for: .goblin)
        applyGoblinStats(&runtime.enemies[0])
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

    func testSlashInstantlyDamagesFarEnemyAndAppliesKnockback() {
        var runtime = DefenseRuntimeState(playerHp: 5, surviveSeconds: 120, maxEnemies: 3)
        runtime.enemies[0].isActive = true
        runtime.enemies[0].type = .goblin
        runtime.enemies[0].x = 760
        runtime.enemies[0].y = DefenseEnemyConfig.centerY(for: .goblin)
        runtime.enemies[0].hp = 2
        applyGoblinStats(&runtime.enemies[0])

        let slashed = DefenseGameLoop.performSlash(runtime: &runtime, guardPoseSec: 0.5)
        XCTAssertTrue(slashed)
        XCTAssertEqual(runtime.enemies[0].hp, 1)
        XCTAssertEqual(runtime.enemies[0].knockbackVx, DefenseEnemyConfig.knockbackImpulse, accuracy: 0.001)
        XCTAssertEqual(runtime.slashAt, 0, accuracy: 0.001)
        XCTAssertEqual(runtime.slashToX, 760, accuracy: 0.001)
        XCTAssertEqual(runtime.guardPoseUntilSec, 0.5, accuracy: 0.001)
    }

    func testSlashHitsFrontmostEnemyByMinX() {
        var runtime = DefenseRuntimeState(playerHp: 5, surviveSeconds: 120, maxEnemies: 3)
        runtime.enemies[0].isActive = true
        runtime.enemies[0].type = .goblin
        runtime.enemies[0].x = runtime.playerX + 80
        runtime.enemies[0].y = DefenseEnemyConfig.centerY(for: .goblin)
        runtime.enemies[0].hp = 2
        applyGoblinStats(&runtime.enemies[0])

        runtime.enemies[1].isActive = true
        runtime.enemies[1].type = .bat
        runtime.enemies[1].x = runtime.playerX + 200
        runtime.enemies[1].y = DefenseEnemyConfig.centerY(for: .bat)
        runtime.enemies[1].hp = 2
        let batStats = DefenseEnemyConfig.resolveEnemyStats(type: .bat, difficulty: difficulty)
        runtime.enemies[1].speedPxPerSec = batStats.speedPxPerSec
        runtime.enemies[1].damage = batStats.damage
        runtime.enemies[1].attackIntervalSec = batStats.attackIntervalSec
        runtime.enemies[1].attackRangePx = batStats.attackRangePx
        runtime.enemies[1].knockbackMult = batStats.knockbackMult

        _ = DefenseGameLoop.performSlash(runtime: &runtime)

        XCTAssertEqual(runtime.enemies[0].hp, 1)
        XCTAssertEqual(runtime.enemies[1].hp, 2)
        XCTAssertEqual(runtime.slashToX, runtime.enemies[0].x, accuracy: 0.001)
    }

    func testSlashDefeatsEnemyWithOneHpImmediately() {
        var runtime = DefenseRuntimeState(playerHp: 5, surviveSeconds: 120, maxEnemies: 3)
        runtime.enemies[0].isActive = true
        runtime.enemies[0].type = .goblin
        runtime.enemies[0].x = runtime.playerX + 100
        runtime.enemies[0].hp = 1
        applyGoblinStats(&runtime.enemies[0])

        _ = DefenseGameLoop.performSlash(runtime: &runtime)

        XCTAssertFalse(runtime.enemies[0].isActive)
        XCTAssertEqual(runtime.enemiesDefeated, 1)
    }

    func testSlashReturnsFalseWhenNoEnemies() {
        var runtime = DefenseRuntimeState(playerHp: 5, surviveSeconds: 120, maxEnemies: 3)
        let slashed = DefenseGameLoop.performSlash(runtime: &runtime)
        XCTAssertFalse(slashed)
        XCTAssertEqual(runtime.slashAt, DefenseEnemyConfig.noSlash)
    }

    func testSlashCancelsPendingEnemyAttackBeforePeak() {
        var runtime = DefenseRuntimeState(playerHp: 5, surviveSeconds: 120, maxEnemies: 3)
        runtime.enemies[0].isActive = true
        runtime.enemies[0].type = .goblin
        runtime.enemies[0].x = runtime.playerX + 40
        applyGoblinStats(&runtime.enemies[0])
        runtime.enemies[0].lastAttackAt = 1.0
        runtime.enemies[0].attackHitPending = true
        runtime.elapsedSec = 1.1

        _ = DefenseGameLoop.performSlash(runtime: &runtime)
        XCTAssertFalse(runtime.enemies[0].attackHitPending)

        DefenseGameLoop.tick(runtime: &runtime, difficulty: difficulty, deltaTime: 0.1)
        XCTAssertEqual(runtime.playerHp, 5)
        XCTAssertEqual(runtime.impactAt, DefenseEnemyConfig.noImpact)
    }

    func testWaveAdvancesAndSpawnsImmediatelyOnChange() {
        var runtime = DefenseRuntimeState(playerHp: 5, surviveSeconds: 120, maxEnemies: 8)
        runtime.elapsedSec = 30
        runtime.spawnTimerSec = 0
        let quickSpawn = DefenseDifficultyDefinition(
            level: 1, enemyHp: 1, spawnIntervalSec: 0.5, maxEnemies: 8,
            enemySpeedPxPerSec: 40, enemyDamage: 1, attackIntervalSec: 3, attackRangePx: 48
        )
        DefenseGameLoop.tick(runtime: &runtime, difficulty: quickSpawn, deltaTime: 0)
        XCTAssertEqual(runtime.waveIndex, 1)
        XCTAssertEqual(runtime.waveSpawnCount, 1)
        XCTAssertTrue(runtime.enemies.contains(where: \.isActive))
    }

    func testPhraseModeWaveTwoDealsTwoSlashDamage() {
        var runtime = DefenseRuntimeState(
            playerHp: 5, surviveSeconds: 120, maxEnemies: 3,
            practiceMode: false, attackTrigger: .note
        )
        runtime.waveIndex = 1
        runtime.enemies[0].isActive = true
        runtime.enemies[0].type = .goblin
        runtime.enemies[0].x = 760
        runtime.enemies[0].hp = 3
        applyGoblinStats(&runtime.enemies[0])

        _ = DefenseGameLoop.performSlash(runtime: &runtime)
        XCTAssertEqual(runtime.enemies[0].hp, 1)
    }

    func testMeasureModeAlwaysDealsOneSlashDamage() {
        var runtime = DefenseRuntimeState(
            playerHp: 5, surviveSeconds: 120, maxEnemies: 3,
            practiceMode: false, attackTrigger: .measure
        )
        runtime.waveIndex = 2
        runtime.enemies[0].isActive = true
        runtime.enemies[0].type = .goblin
        runtime.enemies[0].x = 760
        runtime.enemies[0].hp = 3
        applyGoblinStats(&runtime.enemies[0])

        _ = DefenseGameLoop.performSlash(runtime: &runtime)
        XCTAssertEqual(runtime.enemies[0].hp, 2)
    }

    func testRecordsHitFlashAndDamagePopupOnPhraseSlash() {
        var runtime = DefenseRuntimeState(
            playerHp: 5, surviveSeconds: 120, maxEnemies: 3,
            practiceMode: false, attackTrigger: .note
        )
        runtime.enemies[0].isActive = true
        runtime.enemies[0].type = .goblin
        runtime.enemies[0].x = 760
        runtime.enemies[0].hp = 2
        applyGoblinStats(&runtime.enemies[0])

        _ = DefenseGameLoop.performSlash(runtime: &runtime)
        XCTAssertEqual(runtime.enemies[0].hitFlashAt, 0, accuracy: 0.001)
        XCTAssertTrue(runtime.damagePopups.contains(where: { $0.isActive && $0.value == 1 }))
    }

    func testChargesSpAndSpawnsFireballAfterFiveMeasures() {
        var runtime = DefenseRuntimeState(
            playerHp: 5, surviveSeconds: 120, maxEnemies: 3,
            practiceMode: false, attackTrigger: .note
        )
        for i in 1...4 {
            XCTAssertFalse(DefenseGameLoop.chargeSp(runtime: &runtime))
            XCTAssertEqual(runtime.spGauge, i)
        }
        XCTAssertTrue(DefenseGameLoop.chargeSp(runtime: &runtime))
        XCTAssertEqual(runtime.spGauge, 0)
        XCTAssertTrue(runtime.fireballs.contains(where: \.isActive))
    }
}
