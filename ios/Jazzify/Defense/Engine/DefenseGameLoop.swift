import CoreGraphics
import Foundation

enum DefenseGameLoop {
    private static let knockbackDecay: CGFloat = 0.9
    private static let knockbackImpulse: CGFloat = 180
    private static let fireballSpeed: CGFloat = 420
    private static let fireballHitRadius: CGFloat = 28
    private static let spawnX: CGFloat = 760

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
        updateFireballs(runtime: &runtime, deltaTime: deltaTime)
    }

    static func fireProjectile(runtime: inout DefenseRuntimeState) -> Bool {
        guard runtime.result == .playing else { return false }
        guard let target = nearestEnemy(runtime: runtime) else { return false }
        guard let slotIndex = runtime.fireballs.firstIndex(where: { !$0.isActive }) else { return false }

        let dx = target.x - runtime.playerX
        let dy = target.y - runtime.playerY
        let dist = max(1, sqrt(dx * dx + dy * dy))
        runtime.fireballs[slotIndex].isActive = true
        runtime.fireballs[slotIndex].x = runtime.playerX
        runtime.fireballs[slotIndex].y = runtime.playerY
        runtime.fireballs[slotIndex].vx = (dx / dist) * fireballSpeed
        runtime.fireballs[slotIndex].vy = (dy / dist) * fireballSpeed
        runtime.fireballs[slotIndex].targetEnemyId = target.id
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

        let jitter = CGFloat((runtime.nextEnemyIndex % 7) - 3) * 12
        let types = DefenseEnemyType.allCases
        runtime.enemies[index].isActive = true
        runtime.enemies[index].type = types[runtime.nextEnemyIndex % types.count]
        runtime.enemies[index].x = spawnX
        runtime.enemies[index].y = max(40, min(560, runtime.playerY + jitter))
        runtime.enemies[index].hp = difficulty.enemyHp
        runtime.enemies[index].maxHp = difficulty.enemyHp
        runtime.enemies[index].knockbackVx = 0
        runtime.enemies[index].knockbackVy = 0
        runtime.enemies[index].lastAttackAt = runtime.elapsedSec
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
            let dx = runtime.playerX - enemy.x
            let dy = runtime.playerY - enemy.y
            let dist = max(1, sqrt(dx * dx + dy * dy))

            if dist > CGFloat(difficulty.attackRangePx) {
                let speed = CGFloat(difficulty.enemySpeedPxPerSec) * dt
                enemy.x += (dx / dist) * speed
                enemy.y += (dy / dist) * speed
            } else if runtime.elapsedSec - enemy.lastAttackAt >= difficulty.attackIntervalSec {
                runtime.playerHp = max(0, runtime.playerHp - difficulty.enemyDamage)
                enemy.lastAttackAt = runtime.elapsedSec
                if runtime.playerHp <= 0 {
                    runtime.result = .gameOver
                }
            }

            if enemy.knockbackVx != 0 || enemy.knockbackVy != 0 {
                enemy.x += enemy.knockbackVx * dt
                enemy.y += enemy.knockbackVy * dt
                enemy.knockbackVx *= knockbackDecay
                enemy.knockbackVy *= knockbackDecay
                if abs(enemy.knockbackVx) < 0.5 { enemy.knockbackVx = 0 }
                if abs(enemy.knockbackVy) < 0.5 { enemy.knockbackVy = 0 }
            }
            runtime.enemies[index] = enemy
        }
    }

    private static func updateFireballs(runtime: inout DefenseRuntimeState, deltaTime: TimeInterval) {
        let dt = CGFloat(deltaTime)
        for ballIndex in runtime.fireballs.indices where runtime.fireballs[ballIndex].isActive {
            var ball = runtime.fireballs[ballIndex]
            ball.x += ball.vx * dt
            ball.y += ball.vy * dt

            if let hitIndex = runtime.enemies.firstIndex(where: { enemy in
                guard enemy.isActive else { return false }
                if let targetId = ball.targetEnemyId, enemy.id != targetId { return false }
                let dx = ball.x - enemy.x
                let dy = ball.y - enemy.y
                return (dx * dx + dy * dy) <= fireballHitRadius * fireballHitRadius
            }) {
                var enemy = runtime.enemies[hitIndex]
                enemy.hp -= 1
                let kbDx = enemy.x - runtime.playerX
                let kbDy = enemy.y - runtime.playerY
                let kbDist = max(1, sqrt(kbDx * kbDx + kbDy * kbDy))
                enemy.knockbackVx = (kbDx / kbDist) * knockbackImpulse
                enemy.knockbackVy = (kbDy / kbDist) * knockbackImpulse
                if enemy.hp <= 0 {
                    enemy.isActive = false
                    runtime.enemiesDefeated += 1
                }
                runtime.enemies[hitIndex] = enemy
                ball.isActive = false
            } else if ball.x < -40 || ball.x > 900 || ball.y < -40 || ball.y > 640 {
                ball.isActive = false
            }
            runtime.fireballs[ballIndex] = ball
        }
    }

    private static func nearestEnemy(runtime: DefenseRuntimeState) -> DefenseEnemyState? {
        runtime.enemies
            .filter(\.isActive)
            .min(by: { lhs, rhs in
                let dl = (lhs.x - runtime.playerX) * (lhs.x - runtime.playerX)
                    + (lhs.y - runtime.playerY) * (lhs.y - runtime.playerY)
                let dr = (rhs.x - runtime.playerX) * (rhs.x - runtime.playerX)
                    + (rhs.y - runtime.playerY) * (rhs.y - runtime.playerY)
                return dl < dr
            })
    }
}
