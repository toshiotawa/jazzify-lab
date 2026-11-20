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

    func testPracticeModeSpawnsWaveOneRosterWithoutWaveChanges() {
        var runtime = DefenseRuntimeState(playerHp: 5, surviveSeconds: 120, maxEnemies: 12, practiceMode: true)
        let quickSpawn = DefenseDifficultyDefinition(
            level: 1, enemyHp: 1, spawnIntervalSec: 0.5, maxEnemies: 12,
            enemySpeedPxPerSec: 40, enemyDamage: 1, attackIntervalSec: 3, attackRangePx: 48
        )
        let wave1 = DefenseEnemyConfig.waveRosters[0]
        DefenseGameLoop.tick(runtime: &runtime, difficulty: quickSpawn, deltaTime: 0.6)
        DefenseGameLoop.tick(runtime: &runtime, difficulty: quickSpawn, deltaTime: 0.6)
        DefenseGameLoop.tick(runtime: &runtime, difficulty: quickSpawn, deltaTime: 0.6)
        XCTAssertEqual(runtime.enemies[0].type, wave1[0])
        XCTAssertEqual(runtime.enemies[1].type, wave1[1])
        XCTAssertEqual(runtime.enemies[2].type, wave1[2])
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
        runtime.enemies[0].hp = 2 * DefenseEnemyConfig.damageUnit
        applyGoblinStats(&runtime.enemies[0])

        let slashed = DefenseGameLoop.performSlash(runtime: &runtime, guardPoseSec: 0.5)
        XCTAssertTrue(slashed)
        XCTAssertEqual(runtime.enemies[0].hp, DefenseEnemyConfig.damageUnit)
        XCTAssertEqual(runtime.enemies[0].knockbackVx, DefenseEnemyConfig.knockbackImpulse, accuracy: 0.001)
        XCTAssertEqual(runtime.slashAt, 0, accuracy: 0.001)
        XCTAssertEqual(runtime.slashToX, 760, accuracy: 0.001)
        XCTAssertEqual(runtime.slashTargetType, .goblin)
        XCTAssertEqual(runtime.damagePopups[0].targetType, .goblin)
        XCTAssertEqual(runtime.guardPoseUntilSec, 0.5, accuracy: 0.001)
    }

    func testDefenseArtworkPreservesFrontContactAndGround() throws {
        for type in [DefenseEnemyType.goblin, .skeleton, .wolf, .golem, .dragon] {
            let layout = try XCTUnwrap(DefenseSceneLayout.enemyLayouts[type])
            let oldHeight = DefenseEnemyConfig.displaySpriteHeight(for: type)
            let oldWidth = DefenseEnemyConfig.displaySpriteWidth(for: type)
            XCTAssertEqual(layout.centerDx - 0.44 * layout.size.width, -0.44 * oldWidth, accuracy: 0.001)
            XCTAssertEqual(layout.footDy + layout.size.height / 28, oldHeight / 28, accuracy: 0.001)
            XCTAssertEqual(oldHeight / 2 + layout.centerDy, layout.footDy + layout.size.height / 2, accuracy: 0.001)
        }
    }

    func testSlashHitsFrontmostEnemyByMinX() {
        var runtime = DefenseRuntimeState(playerHp: 5, surviveSeconds: 120, maxEnemies: 3)
        runtime.enemies[0].isActive = true
        runtime.enemies[0].type = .goblin
        runtime.enemies[0].x = runtime.playerX + 80
        runtime.enemies[0].y = DefenseEnemyConfig.centerY(for: .goblin)
        runtime.enemies[0].hp = 2 * DefenseEnemyConfig.damageUnit
        applyGoblinStats(&runtime.enemies[0])

        runtime.enemies[1].isActive = true
        runtime.enemies[1].type = .bat
        runtime.enemies[1].x = runtime.playerX + 200
        runtime.enemies[1].y = DefenseEnemyConfig.centerY(for: .bat)
        runtime.enemies[1].hp = 2 * DefenseEnemyConfig.damageUnit
        let batStats = DefenseEnemyConfig.resolveEnemyStats(type: .bat, difficulty: difficulty)
        runtime.enemies[1].speedPxPerSec = batStats.speedPxPerSec
        runtime.enemies[1].damage = batStats.damage
        runtime.enemies[1].attackIntervalSec = batStats.attackIntervalSec
        runtime.enemies[1].attackRangePx = batStats.attackRangePx
        runtime.enemies[1].knockbackMult = batStats.knockbackMult

        _ = DefenseGameLoop.performSlash(runtime: &runtime)

        XCTAssertEqual(runtime.enemies[0].hp, DefenseEnemyConfig.damageUnit)
        XCTAssertEqual(runtime.enemies[1].hp, 2 * DefenseEnemyConfig.damageUnit)
        XCTAssertEqual(runtime.slashToX, runtime.enemies[0].x, accuracy: 0.001)
    }

    func testSlashDefeatsEnemyWithOneHpImmediately() {
        var runtime = DefenseRuntimeState(playerHp: 5, surviveSeconds: 120, maxEnemies: 3)
        runtime.enemies[0].isActive = true
        runtime.enemies[0].type = .goblin
        runtime.enemies[0].x = runtime.playerX + 100
        runtime.enemies[0].hp = DefenseEnemyConfig.damageUnit
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

    func testPhraseModeWaveTwoDealsOneHundredSlashDamage() {
        var runtime = DefenseRuntimeState(
            playerHp: 5, surviveSeconds: 120, maxEnemies: 3,
            practiceMode: false, attackTrigger: .note
        )
        runtime.waveIndex = 1
        runtime.enemies[0].isActive = true
        runtime.enemies[0].type = .goblin
        runtime.enemies[0].x = 760
        runtime.enemies[0].hp = 3 * DefenseEnemyConfig.damageUnit
        applyGoblinStats(&runtime.enemies[0])

        _ = DefenseGameLoop.performSlash(runtime: &runtime)
        XCTAssertEqual(runtime.enemies[0].hp, DefenseEnemyConfig.damageUnit)
    }

    func testMeasureModeAlwaysDealsBaseSlashDamage() {
        var runtime = DefenseRuntimeState(
            playerHp: 5, surviveSeconds: 120, maxEnemies: 3,
            practiceMode: false, attackTrigger: .measure
        )
        runtime.waveIndex = 2
        runtime.enemies[0].isActive = true
        runtime.enemies[0].type = .goblin
        runtime.enemies[0].x = 760
        runtime.enemies[0].hp = 3 * DefenseEnemyConfig.damageUnit
        applyGoblinStats(&runtime.enemies[0])

        _ = DefenseGameLoop.performSlash(runtime: &runtime)
        XCTAssertEqual(runtime.enemies[0].hp, 2 * DefenseEnemyConfig.damageUnit)
    }

    func testRecordsHitFlashAndDamagePopupOnPhraseSlash() {
        var runtime = DefenseRuntimeState(
            playerHp: 5, surviveSeconds: 120, maxEnemies: 3,
            practiceMode: false, attackTrigger: .note
        )
        runtime.enemies[0].isActive = true
        runtime.enemies[0].type = .goblin
        runtime.enemies[0].x = 760
        runtime.enemies[0].hp = 2 * DefenseEnemyConfig.damageUnit
        applyGoblinStats(&runtime.enemies[0])

        _ = DefenseGameLoop.performSlash(runtime: &runtime)
        XCTAssertEqual(runtime.enemies[0].hitFlashAt, 0, accuracy: 0.001)
        XCTAssertTrue(runtime.damagePopups.contains(where: {
            $0.isActive && $0.value == DefenseEnemyConfig.damageUnit
        }))
    }

    func testFireballHitsContactPointBetweenFrames() {
        var runtime = DefenseRuntimeState(playerHp: 5, surviveSeconds: 120, maxEnemies: 1)
        runtime.enemies[0].type = .wolf
        runtime.enemies[0].isActive = true
        runtime.enemies[0].x = runtime.playerX + 95
        runtime.enemies[0].hp = 100
        runtime.enemies[0].speedPxPerSec = 0
        runtime.fireballs[0].isActive = true
        runtime.fireballs[0].x = runtime.playerX + 40

        DefenseGameLoop.tick(runtime: &runtime, difficulty: difficulty, deltaTime: 0.25)
        XCTAssertFalse(runtime.enemies[0].isActive)
        XCTAssertEqual(runtime.damagePopups[0].targetType, .wolf)
    }

    func testFireballPiercesWithWaveScaledDamageAndLeavesHighHpEnemyAlive() {
        var runtime = DefenseRuntimeState(
            playerHp: 5, surviveSeconds: 120, maxEnemies: 3,
            practiceMode: false, attackTrigger: .note
        )
        runtime.elapsedSec = 90
        runtime.waveIndex = 3
        runtime.enemies[0].isActive = true
        runtime.enemies[0].type = .goblin
        runtime.enemies[0].x = runtime.playerX + 100
        runtime.enemies[0].hp = DefenseEnemyConfig.damageUnit
        applyGoblinStats(&runtime.enemies[0])

        runtime.enemies[1].isActive = true
        runtime.enemies[1].type = .golem
        runtime.enemies[1].x = runtime.playerX + 200
        runtime.enemies[1].hp = 14 * DefenseEnemyConfig.damageUnit
        let golemStats = DefenseEnemyConfig.resolveEnemyStats(type: .golem, difficulty: difficulty)
        runtime.enemies[1].knockbackMult = golemStats.knockbackMult

        runtime.fireballs[0].isActive = true
        runtime.fireballs[0].x = runtime.playerX + 100
        let fireballDamage = DefenseEnemyConfig.fireballDamage(waveIndex: runtime.waveIndex, scaling: true)

        DefenseGameLoop.tick(runtime: &runtime, difficulty: difficulty, deltaTime: 0)
        XCTAssertFalse(runtime.enemies[0].isActive)
        XCTAssertTrue(runtime.enemies[1].isActive)
        XCTAssertEqual(runtime.enemies[1].hp, 14 * DefenseEnemyConfig.damageUnit)

        runtime.fireballs[0].x = runtime.playerX + 200
        DefenseGameLoop.tick(runtime: &runtime, difficulty: difficulty, deltaTime: 0)
        XCTAssertTrue(runtime.enemies[1].isActive)
        XCTAssertEqual(runtime.enemies[1].hp, 14 * DefenseEnemyConfig.damageUnit - fireballDamage)
        XCTAssertNotEqual(runtime.enemies[1].knockbackVx, 0, accuracy: 0.001)
    }

    func testWaveSpawnIntervalMultIsRelaxedForPhraseMode() {
        XCTAssertEqual(DefenseEnemyConfig.waveSpawnIntervalMult(for: 1), 0.85, accuracy: 0.001)
        XCTAssertEqual(DefenseEnemyConfig.waveSpawnIntervalMult(for: 3), 0.6, accuracy: 0.001)
    }

    func testFireballDamageIsTripleSlashInPhraseMode() {
        XCTAssertEqual(
            DefenseEnemyConfig.fireballDamage(waveIndex: 0, scaling: true),
            3 * DefenseEnemyConfig.damageUnit
        )
        XCTAssertEqual(
            DefenseEnemyConfig.fireballDamage(waveIndex: 3, scaling: true),
            4 * 3 * DefenseEnemyConfig.damageUnit
        )
    }

    func testChargesSpStartsSkillPoseAndDelaysFireball() {
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
        XCTAssertEqual(runtime.skillPoseStartSec, 0, accuracy: 0.001)
        XCTAssertEqual(runtime.fireballSpawnAtSec, DefenseEnemyConfig.fireballSpawnDelaySec, accuracy: 0.001)
        XCTAssertFalse(runtime.fireballs.contains(where: \.isActive))

        DefenseGameLoop.tick(
            runtime: &runtime,
            difficulty: difficulty,
            deltaTime: DefenseEnemyConfig.fireballSpawnDelaySec
        )
        XCTAssertTrue(runtime.fireballs.contains(where: \.isActive))
        XCTAssertEqual(runtime.fireballSpawnAtSec, DefenseEnemyConfig.noPendingFireball, accuracy: 0.001)
    }

    func testStartCountdownDisplaySecCapsAtTwo() {
        XCTAssertEqual(DefenseStartCountdown.displaySec(remaining: 2.1), 2)
        XCTAssertEqual(DefenseStartCountdown.displaySec(remaining: 1.01), 2)
        XCTAssertEqual(DefenseStartCountdown.displaySec(remaining: 1.0), 1)
        XCTAssertEqual(DefenseStartCountdown.displaySec(remaining: 0.5), 1)
        XCTAssertEqual(DefenseStartCountdown.displaySec(remaining: 0), 0)
    }

    func testStartCountdownStepDurationsSumToTotal() {
        XCTAssertEqual(
            DefenseStartCountdown.firstStepSec + DefenseStartCountdown.secondStepSec,
            DefenseStartCountdown.durationSec,
            accuracy: 0.0001
        )
    }
}
