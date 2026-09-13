import CoreGraphics
import Foundation

enum DefenseGameLoop {
    private static let spawnX: CGFloat = 760
    private static let fireballDespawnX: CGFloat = 840
    private static let fireballSpawnOffsetX: CGFloat = 40
    private static let fireballSpawnOffsetY: CGFloat = 40
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
        updateFireballs(runtime: &runtime, deltaTime: deltaTime)
        updatePopups(runtime: &runtime)
    }

    static func performSlash(runtime: inout DefenseRuntimeState, guardPoseSec: TimeInterval = 0) -> Bool {
        guard runtime.result == .playing else { return false }
        guard let targetIndex = frontmostEnemyIndex(runtime: runtime) else { return false }

        let scaling = isWaveScaling(runtime)
        let damage = DefenseEnemyConfig.slashDamage(waveIndex: runtime.waveIndex, scaling: scaling)
        applyEnemyDamage(
            runtime: &runtime,
            enemyIndex: targetIndex,
            damage: damage,
            knockbackImpulse: DefenseEnemyConfig.knockbackImpulse,
            showPopup: isPhraseMode(runtime)
        )

        let target = runtime.enemies[targetIndex]
        runtime.slashAt = runtime.elapsedSec
        runtime.slashFromX = runtime.playerX
        runtime.slashToX = target.x
        runtime.slashY = target.y
        if guardPoseSec > 0 {
            runtime.guardPoseUntilSec = runtime.elapsedSec + guardPoseSec
        }
        return true
    }

    static func chargeSp(runtime: inout DefenseRuntimeState) -> Bool {
        guard isPhraseMode(runtime) else { return false }
        runtime.spGauge += 1
        guard runtime.spGauge >= DefenseEnemyConfig.spMax else { return false }
        runtime.spGauge = 0
        spawnFireball(runtime: &runtime)
        return true
    }

    private static func isWaveScaling(_ runtime: DefenseRuntimeState) -> Bool {
        runtime.attackTrigger == .note && !runtime.practiceMode
    }

    private static func isPhraseMode(_ runtime: DefenseRuntimeState) -> Bool {
        runtime.attackTrigger == .note
    }

    private static func spawnIntervalSec(
        runtime: DefenseRuntimeState,
        difficulty: DefenseDifficultyDefinition
    ) -> Double {
        guard isWaveScaling(runtime) else { return difficulty.spawnIntervalSec }
        return difficulty.spawnIntervalSec * DefenseEnemyConfig.waveSpawnIntervalMult(for: runtime.waveIndex)
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
        difficulty: DefenseDifficultyDefinition,
        runtime: DefenseRuntimeState
    ) {
        let hpMult = isWaveScaling(runtime) ? DefenseEnemyConfig.waveHpMult(for: runtime.waveIndex) : 1
        let resolved = DefenseEnemyConfig.resolveEnemyStats(type: type, difficulty: difficulty, hpMult: hpMult)
        enemy.type = type
        enemy.hp = resolved.hp
        enemy.maxHp = resolved.hp
        enemy.speedPxPerSec = resolved.speedPxPerSec
        enemy.damage = resolved.damage
        enemy.attackIntervalSec = resolved.attackIntervalSec
        enemy.attackRangePx = resolved.attackRangePx
        enemy.knockbackMult = resolved.knockbackMult
    }

    private static func pushDamagePopup(
        runtime: inout DefenseRuntimeState,
        x: CGFloat,
        y: CGFloat,
        value: Int
    ) {
        guard runtime.damagePopups.indices.contains(runtime.nextPopupIndex) else { return }
        runtime.damagePopups[runtime.nextPopupIndex] = DefenseDamagePopupState(
            isActive: true,
            x: x,
            y: y,
            value: value,
            spawnedAt: runtime.elapsedSec
        )
        runtime.nextPopupIndex = (runtime.nextPopupIndex + 1) % runtime.damagePopups.count
    }

    private static func applyEnemyDamage(
        runtime: inout DefenseRuntimeState,
        enemyIndex: Int,
        damage: Int,
        knockbackImpulse: CGFloat,
        showPopup: Bool
    ) {
        var target = runtime.enemies[enemyIndex]
        target.attackHitPending = false
        target.hp -= damage
        target.hitFlashAt = runtime.elapsedSec

        if showPopup {
            pushDamagePopup(runtime: &runtime, x: target.x, y: target.y, value: damage)
        }

        let kbDx = target.x - runtime.playerX
        target.knockbackVx = (kbDx >= 0 ? 1 : -1) * knockbackImpulse * CGFloat(target.knockbackMult)

        if target.hp <= 0 {
            target.isActive = false
            runtime.enemiesDefeated += 1
        }
        runtime.enemies[enemyIndex] = target
    }

    private static func spawnFireball(runtime: inout DefenseRuntimeState) {
        let scaling = isWaveScaling(runtime)
        let slashDamage = DefenseEnemyConfig.slashDamage(waveIndex: runtime.waveIndex, scaling: scaling)
        let damage = slashDamage * DefenseEnemyConfig.fireballDamageMult

        for index in runtime.fireballs.indices where !runtime.fireballs[index].isActive {
            runtime.fireballs[index] = DefenseFireballState(
                isActive: true,
                x: runtime.playerX + fireballSpawnOffsetX,
                y: DefenseEnemyConfig.groundY - fireballSpawnOffsetY,
                damage: damage,
                hitSlotMask: 0
            )
            return
        }
    }

    private static func updateFireballs(runtime: inout DefenseRuntimeState, deltaTime: TimeInterval) {
        let showPopup = isPhraseMode(runtime)
        let dt = CGFloat(deltaTime)

        for fbIndex in runtime.fireballs.indices {
            guard runtime.fireballs[fbIndex].isActive else { continue }
            runtime.fireballs[fbIndex].x += DefenseEnemyConfig.fireballSpeedPx * dt

            for enemyIndex in runtime.enemies.indices where runtime.enemies[enemyIndex].isActive {
                let slotBit = 1 << runtime.enemies[enemyIndex].slotIndex
                if runtime.fireballs[fbIndex].hitSlotMask & slotBit != 0 { continue }
                let enemy = runtime.enemies[enemyIndex]
                if abs(enemy.x - runtime.fireballs[fbIndex].x) > DefenseEnemyConfig.fireballHitRadius { continue }

                runtime.fireballs[fbIndex].hitSlotMask |= slotBit
                applyEnemyDamage(
                    runtime: &runtime,
                    enemyIndex: enemyIndex,
                    damage: runtime.fireballs[fbIndex].damage,
                    knockbackImpulse: DefenseEnemyConfig.knockbackImpulse * 0.5,
                    showPopup: showPopup
                )
            }

            if runtime.fireballs[fbIndex].x > fireballDespawnX {
                runtime.fireballs[fbIndex].isActive = false
            }
        }
    }

    private static func updatePopups(runtime: inout DefenseRuntimeState) {
        for index in runtime.damagePopups.indices where runtime.damagePopups[index].isActive {
            if runtime.elapsedSec - runtime.damagePopups[index].spawnedAt > DefenseEnemyConfig.damagePopupSec {
                runtime.damagePopups[index].isActive = false
            }
        }
    }

    private static func spawnIfDue(
        runtime: inout DefenseRuntimeState,
        difficulty: DefenseDifficultyDefinition,
        deltaTime: TimeInterval
    ) {
        let interval = spawnIntervalSec(runtime: runtime, difficulty: difficulty)
        syncWaveState(runtime: &runtime, spawnIntervalSec: interval)

        let activeCount = runtime.enemies.filter(\.isActive).count
        guard activeCount < difficulty.maxEnemies else { return }

        runtime.spawnTimerSec += deltaTime
        guard runtime.spawnTimerSec >= interval else { return }
        runtime.spawnTimerSec = 0
        guard let index = runtime.enemies.firstIndex(where: { !$0.isActive }) else { return }

        let enemyType: DefenseEnemyType
        if runtime.practiceMode {
            let types = DefenseEnemyType.allCases
            enemyType = types[runtime.nextEnemyIndex % types.count]
        } else {
            enemyType = DefenseEnemyConfig.pickWaveEnemyType(
                waveIndex: runtime.waveIndex,
                spawnCount: runtime.waveSpawnCount,
                cumulative: isWaveScaling(runtime)
            )
        }

        runtime.enemies[index].isActive = true
        runtime.enemies[index].x = spawnX
        runtime.enemies[index].y = DefenseEnemyConfig.centerY(for: enemyType)
        runtime.enemies[index].knockbackVx = 0
        runtime.enemies[index].lastAttackAt = 0
        runtime.enemies[index].isMoving = false
        runtime.enemies[index].attackHitPending = false
        runtime.enemies[index].hitFlashAt = DefenseEnemyConfig.noHitFlash
        applyResolvedStats(
            enemy: &runtime.enemies[index],
            type: enemyType,
            difficulty: difficulty,
            runtime: runtime
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
