import CoreGraphics
import Foundation

enum DefenseGameLoop {
    private static let spawnX: CGFloat = 760
    private static let attackHitPhase = DefenseEnemyConfig.attackLungeSec * 0.5
    private static let knockbackStopVx: CGFloat = 0.5

    static func tick(
        runtime: inout DefenseRuntimeState,
        difficulty: DefenseDifficultyDefinition,
        deltaTime: TimeInterval
    ) {
        guard runtime.result == .playing else { return }
        runtime.elapsedSec += deltaTime
        if !runtime.practiceMode && runtime.elapsedSec >= runtime.surviveSeconds {
            runtime.result = .clear
            return
        }

        spawnIfDue(runtime: &runtime, difficulty: difficulty, deltaTime: deltaTime)
        updateEnemies(runtime: &runtime, deltaTime: deltaTime)
    }

    static func performSlash(runtime: inout DefenseRuntimeState, guardPoseSec: TimeInterval = 0) -> Bool {
        guard runtime.result == .playing else { return false }
        guard let targetIndex = frontmostEnemyIndex(runtime: runtime) else { return false }

        var target = runtime.enemies[targetIndex]
        target.attackHitPending = false
        target.hp -= 1
        let kbDx = target.x - runtime.playerX
        target.knockbackVx = (kbDx >= 0 ? 1 : -1)
            * DefenseEnemyConfig.knockbackImpulse
            * CGFloat(target.knockbackMult)
        if target.hp <= 0 {
            target.isActive = false
            runtime.enemiesDefeated += 1
        }
        runtime.enemies[targetIndex] = target

        runtime.slashAt = runtime.elapsedSec
        runtime.slashFromX = runtime.playerX
        runtime.slashToX = target.x
        runtime.slashY = target.y
        if guardPoseSec > 0 {
            runtime.guardPoseUntilSec = runtime.elapsedSec + guardPoseSec
        }
        return true
    }

    private static func syncWaveState(
        runtime: inout DefenseRuntimeState,
        spawnIntervalSec: Double
    ) {
        guard !runtime.practiceMode else { return }
        let nextWaveIndex = DefenseEnemyConfig.waveIndex(
            elapsedSec: runtime.elapsedSec,
            surviveSeconds: runtime.surviveSeconds
        )
        guard nextWaveIndex != runtime.waveIndex else { return }
        runtime.waveIndex = nextWaveIndex
        runtime.waveSpawnCount = 0
        runtime.waveStartedAt = runtime.elapsedSec
        runtime.spawnTimerSec = spawnIntervalSec
    }

    private static func applyResolvedStats(
        enemy: inout DefenseEnemyState,
        type: DefenseEnemyType,
        difficulty: DefenseDifficultyDefinition
    ) {
        let resolved = DefenseEnemyConfig.resolveEnemyStats(type: type, difficulty: difficulty)
        enemy.type = type
        enemy.hp = resolved.hp
        enemy.maxHp = resolved.hp
        enemy.speedPxPerSec = resolved.speedPxPerSec
        enemy.damage = resolved.damage
        enemy.attackIntervalSec = resolved.attackIntervalSec
        enemy.attackRangePx = resolved.attackRangePx
        enemy.knockbackMult = resolved.knockbackMult
    }

    private static func spawnIfDue(
        runtime: inout DefenseRuntimeState,
        difficulty: DefenseDifficultyDefinition,
        deltaTime: TimeInterval
    ) {
        syncWaveState(runtime: &runtime, spawnIntervalSec: difficulty.spawnIntervalSec)

        let activeCount = runtime.enemies.filter(\.isActive).count
        guard activeCount < difficulty.maxEnemies else { return }

        runtime.spawnTimerSec += deltaTime
        guard runtime.spawnTimerSec >= difficulty.spawnIntervalSec else { return }
        runtime.spawnTimerSec = 0
        guard let index = runtime.enemies.firstIndex(where: { !$0.isActive }) else { return }

        let enemyType: DefenseEnemyType
        if runtime.practiceMode {
            let types = DefenseEnemyType.allCases
            enemyType = types[runtime.nextEnemyIndex % types.count]
        } else {
            enemyType = DefenseEnemyConfig.pickWaveEnemyType(
                waveIndex: runtime.waveIndex,
                spawnCount: runtime.waveSpawnCount
            )
        }

        runtime.enemies[index].isActive = true
        runtime.enemies[index].x = spawnX
        runtime.enemies[index].y = DefenseEnemyConfig.centerY(for: enemyType)
        runtime.enemies[index].knockbackVx = 0
        runtime.enemies[index].lastAttackAt = 0
        runtime.enemies[index].isMoving = false
        runtime.enemies[index].attackHitPending = false
        applyResolvedStats(
            enemy: &runtime.enemies[index],
            type: enemyType,
            difficulty: difficulty
        )

        runtime.nextEnemyIndex += 1
        if !runtime.practiceMode {
            runtime.waveSpawnCount += 1
        }
    }

    private static func updateEnemies(
        runtime: inout DefenseRuntimeState,
        deltaTime: TimeInterval
    ) {
        let dt = CGFloat(deltaTime)
        for index in runtime.enemies.indices where runtime.enemies[index].isActive {
            var enemy = runtime.enemies[index]
            let absDx = abs(runtime.playerX - enemy.x)
            let inRange = absDx <= CGFloat(enemy.attackRangePx)
            let attackElapsed = runtime.elapsedSec - enemy.lastAttackAt

            if enemy.attackHitPending && attackElapsed >= attackHitPhase {
                runtime.impactAt = runtime.elapsedSec
                runtime.impactX = runtime.playerX
                runtime.impactY = runtime.playerY
                enemy.attackHitPending = false
                if !runtime.practiceMode {
                    runtime.playerHp = max(0, runtime.playerHp - enemy.damage)
                    if runtime.playerHp <= 0 {
                        runtime.result = .gameOver
                    }
                }
            }

            let isLunging = enemy.attackHitPending
                || (enemy.lastAttackAt > 0 && attackElapsed < DefenseEnemyConfig.attackLungeSec)

            if !isLunging && !inRange {
                let speed = CGFloat(enemy.speedPxPerSec) * dt
                if enemy.x > runtime.playerX {
                    enemy.x -= speed
                } else if enemy.x < runtime.playerX {
                    enemy.x += speed
                }
                enemy.isMoving = true
            } else if inRange
                && !enemy.attackHitPending
                && !isLunging
                && runtime.elapsedSec - enemy.lastAttackAt >= enemy.attackIntervalSec {
                enemy.lastAttackAt = runtime.elapsedSec
                enemy.attackHitPending = true
                enemy.isMoving = false
            } else {
                enemy.isMoving = false
            }

            if enemy.knockbackVx != 0 {
                enemy.x += enemy.knockbackVx * dt
                enemy.x = min(spawnX, enemy.x)
                enemy.knockbackVx *= CGFloat(exp(-deltaTime / DefenseEnemyConfig.knockbackDecayTauSec))
                if abs(enemy.knockbackVx) < knockbackStopVx { enemy.knockbackVx = 0 }
            }
            runtime.enemies[index] = enemy
        }
    }

    private static func frontmostEnemyIndex(runtime: DefenseRuntimeState) -> Int? {
        var bestIndex: Int?
        var minX = CGFloat.greatestFiniteMagnitude
        for index in runtime.enemies.indices where runtime.enemies[index].isActive {
            let x = runtime.enemies[index].x
            if x < minX {
                minX = x
                bestIndex = index
            }
        }
        return bestIndex
    }
}
