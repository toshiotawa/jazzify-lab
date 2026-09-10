import CoreGraphics
import Foundation

enum DefenseGameLoop {
    private static let knockbackDecay: CGFloat = 0.9
    private static let knockbackImpulse: CGFloat = 180
    private static let spawnX: CGFloat = 760
    private static let attackHitPhase = DefenseEnemyConfig.attackLungeSec * 0.5

    static func tick(
        runtime: inout DefenseRuntimeState,
        difficulty: DefenseDifficultyDefinition,
        deltaTime: TimeInterval
    ) {
        guard runtime.result == .playing else { return }
        runtime.elapsedSec += deltaTime
        if runtime.elapsedSec >= runtime.surviveSeconds {
            runtime.result = .clear
            return
        }

        spawnIfDue(runtime: &runtime, difficulty: difficulty, deltaTime: deltaTime)
        updateEnemies(runtime: &runtime, difficulty: difficulty, deltaTime: deltaTime)
    }

    static func performSlash(runtime: inout DefenseRuntimeState) -> Bool {
        guard runtime.result == .playing else { return false }
        guard let targetIndex = frontmostEnemyIndex(runtime: runtime) else { return false }

        var target = runtime.enemies[targetIndex]
        // Interrupt any in-progress lunge so its peak damage never lands.
        target.attackHitPending = false
        target.hp -= 1
        let kbDx = target.x - runtime.playerX
        target.knockbackVx = (kbDx >= 0 ? 1 : -1) * knockbackImpulse
        if target.hp <= 0 {
            target.isActive = false
            runtime.enemiesDefeated += 1
        }
        runtime.enemies[targetIndex] = target

        runtime.slashAt = runtime.elapsedSec
        runtime.slashFromX = runtime.playerX
        runtime.slashToX = target.x
        runtime.slashY = target.y
        return true
    }

    private static func spawnIfDue(
        runtime: inout DefenseRuntimeState,
        difficulty: DefenseDifficultyDefinition,
        deltaTime: TimeInterval
    ) {
        let activeCount = runtime.enemies.filter(\.isActive).count
        guard activeCount < difficulty.maxEnemies else { return }
        runtime.spawnTimerSec += deltaTime
        guard runtime.spawnTimerSec >= difficulty.spawnIntervalSec else { return }
        runtime.spawnTimerSec = 0
        guard let index = runtime.enemies.firstIndex(where: { !$0.isActive }) else { return }

        let types = DefenseEnemyType.allCases
        let enemyType = types[runtime.nextEnemyIndex % types.count]
        runtime.enemies[index].isActive = true
        runtime.enemies[index].type = enemyType
        runtime.enemies[index].x = spawnX
        runtime.enemies[index].y = DefenseEnemyConfig.centerY(for: enemyType)
        runtime.enemies[index].hp = difficulty.enemyHp
        runtime.enemies[index].maxHp = difficulty.enemyHp
        runtime.enemies[index].knockbackVx = 0
        runtime.enemies[index].lastAttackAt = 0
        runtime.enemies[index].isMoving = false
        runtime.enemies[index].attackHitPending = false
        runtime.nextEnemyIndex += 1
    }

    private static func updateEnemies(
        runtime: inout DefenseRuntimeState,
        difficulty: DefenseDifficultyDefinition,
        deltaTime: TimeInterval
    ) {
        let dt = CGFloat(deltaTime)
        for index in runtime.enemies.indices where runtime.enemies[index].isActive {
            var enemy = runtime.enemies[index]
            let absDx = abs(runtime.playerX - enemy.x)
            let inRange = absDx <= CGFloat(difficulty.attackRangePx)
            let attackElapsed = runtime.elapsedSec - enemy.lastAttackAt

            if enemy.attackHitPending && attackElapsed >= attackHitPhase {
                runtime.playerHp = max(0, runtime.playerHp - difficulty.enemyDamage)
                runtime.impactAt = runtime.elapsedSec
                runtime.impactX = runtime.playerX
                runtime.impactY = runtime.playerY
                enemy.attackHitPending = false
                if runtime.playerHp <= 0 {
                    runtime.result = .gameOver
                }
            }

            let isLunging = enemy.attackHitPending
                || (enemy.lastAttackAt > 0 && attackElapsed < DefenseEnemyConfig.attackLungeSec)

            if !isLunging && !inRange {
                let speed = CGFloat(difficulty.enemySpeedPxPerSec) * dt
                if enemy.x > runtime.playerX {
                    enemy.x -= speed
                } else if enemy.x < runtime.playerX {
                    enemy.x += speed
                }
                enemy.isMoving = true
            } else if inRange
                && !enemy.attackHitPending
                && !isLunging
                && runtime.elapsedSec - enemy.lastAttackAt >= difficulty.attackIntervalSec {
                enemy.lastAttackAt = runtime.elapsedSec
                enemy.attackHitPending = true
                enemy.isMoving = false
            } else {
                enemy.isMoving = false
            }

            if enemy.knockbackVx != 0 {
                enemy.x += enemy.knockbackVx * dt
                enemy.knockbackVx *= knockbackDecay
                if abs(enemy.knockbackVx) < 0.5 { enemy.knockbackVx = 0 }
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
