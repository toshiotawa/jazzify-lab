import Foundation
import CoreGraphics

/// 通常ステージ用のゲームロジック。Web 版 `src/components/survival/SurvivalGameEngine.ts` のうち
/// ステージモード (非ボス) で使う機能を移植。
/// - プレイヤー移動 (アナログ + 8 方向離散化)
/// - A 列 遠距離弾 (時計方向マルチ弾 + 貫通)
/// - B 列 近接衝撃波 (ノックバック + 半径内ダメージ / `bRangeBonus` / `bKnockbackBonus` 反映)
/// - 敵スポーン / AI (10 種) / 敵弾システム (`SurvivalEnemyProjectile`)
/// - ダメージ計算 (multiHit / haisuiNoJin / 定数 / `enemyStatMultiplier`)
enum SurvivalGameEngine {
    // MARK: - ダメージ計算 (Web 版 `calculate*Damage` を抜粋移植)

    private static let initialAAtk = 10
    private static let aAtkDamageMultiplier = 7
    private static let aBaseDamage = 14

    private static let initialBAtk = 15
    private static let bAtkDamageMultiplier = 14
    private static let bBaseDamage = 20

    static func calculateAProjectileDamage(aAtk: Int) -> Int {
        aBaseDamage + (aAtk - initialAAtk) * aAtkDamageMultiplier
    }

    static func calculateBMeleeDamage(bAtk: Int) -> Int {
        bBaseDamage + (bAtk - initialBAtk) * bAtkDamageMultiplier
    }

    /// Web 版 `calculateDamage` の基本ケースのみ移植 (buff/debuff/luck は未使用)
    static func calculateAttackDamage(baseDamage: Int, attackerAtk: Int, defenderDef: Int) -> Int {
        let raw = Double(baseDamage + attackerAtk * 2) - Double(defenderDef) * 0.5
        return max(1, Int(raw))
    }

    // MARK: - 初期値ファクトリ (ステージモード専用)

    /// キャラクタープロフィールからステージ初期プレイヤーを構築する。
    /// - Parameter profile: Supabase `survival_characters` の取得結果 (nil 時はデフォルト ファイ)
    /// - Parameter hintMode: ヒントモード中は HP 回復等を無効化しない
    /// - Parameter isBossStage: ボスステージは HP を `bossPlayerMaxHp` に拡張
    static func createStageInitialPlayer(
        profile: SurvivalCharacterProfile?,
        hintMode: Bool,
        isBossStage: Bool
    ) -> SurvivalPlayerState {
        let p = profile ?? SurvivalCharacterProfile.defaultFai
        let stats = p.initialStats
        let skills = SurvivalPlayerSkills.fromJson(p.initialSkillsRaw)
        let baseHp = isBossStage ? SurvivalConstants.bossPlayerMaxHp : 300
        return SurvivalPlayerState(
            x: SurvivalMap.width / 2,
            y: SurvivalMap.height / 2,
            direction: .down,
            hp: baseHp,
            maxHp: baseHp,
            stats: stats,
            skills: skills,
            hintMode: hintMode
        )
    }

    /// allowedChords からコードスロットを 4 個生成。
    /// - 通常ステージ: A/B/C を有効化 (WEB 版 `SurvivalCodeSlots` の表示 3 列に合わせる)
    /// - ボスステージ: A/B のみ有効 (ビュー側では 2 列のみ表示)
    /// - D 列はステージモードでは常に無効
    static func createStageInitialSlots(allowedChords: [String], isBossStage: Bool = false) -> [SurvivalCodeSlot] {
        let resolved = allowedChords.compactMap { SurvivalChordResolver.resolve(id: $0) }
        let random: () -> SurvivalResolvedChord? = {
            resolved.randomElement()
        }
        return SurvivalSlotIndex.allCases.map { idx in
            let enabled: Bool
            switch idx {
            case .A, .B: enabled = true
            case .C: enabled = !isBossStage
            case .D: enabled = false
            }
            return SurvivalCodeSlot(
                label: idx.label,
                chord: enabled ? random() : nil,
                nextChord: enabled ? random() : nil,
                timer: SurvivalConstants.slotTimeoutSec,
                isEnabled: enabled
            )
        }
    }

    // MARK: - プレイヤー移動

    /// Web 版 `updatePlayerPosition` のうちステージモードで必要な部分 (アナログ + 8 方向)
    static func updatePlayerPosition(
        player: SurvivalPlayerState,
        analog: CGVector,
        deltaTime: TimeInterval,
        now: TimeInterval,
        speedMultiplier: CGFloat
    ) -> SurvivalPlayerState {
        var updated = player

        // ノックバック処理 (ボス戦でも使用)
        if now < updated.knockbackUntil {
            let kbDt = CGFloat(deltaTime)
            updated.x = clamp(updated.x + updated.knockbackVx * kbDt, min: 0, max: SurvivalMap.width)
            updated.y = clamp(updated.y + updated.knockbackVy * kbDt, min: 0, max: SurvivalMap.height)
        }

        let mag = hypot(analog.dx, analog.dy)
        guard mag > 0.004 else {
            return updated
        }
        let nx = analog.dx / mag
        let ny = analog.dy / mag
        let strength = min(CGFloat(1), mag)
        let move = SurvivalConstants.playerSpeed * speedMultiplier * CGFloat(deltaTime) * strength

        let newX = clamp(updated.x + nx * move, min: 0, max: SurvivalMap.width)
        let newY = clamp(updated.y + ny * move, min: 0, max: SurvivalMap.height)
        updated.x = newX
        updated.y = newY
        if let dir = SurvivalDirection8.fromVector(dx: nx, dy: ny) {
            updated.direction = dir
        }
        return updated
    }

    // MARK: - 敵生成 (ステージモード) - 10 種

    static func stageSpawnConfig(
        elapsed: TimeInterval,
        config: SurvivalStageConfig
    ) -> (rate: Double, count: Int) {
        // 60 秒以降は高難度
        let baseRate: Double
        let baseCount: Int
        if elapsed >= 60 {
            baseRate = 0.5
            baseCount = max(1, config.enemySpawnCount + 3)
        } else {
            baseRate = 1.0
            baseCount = max(1, config.enemySpawnCount)
        }
        // spawnRate はより速く (値が大きいほど rate 小さく)
        let rate = max(0.25, baseRate * (3.0 / max(1.0, config.enemySpawnRate)))
        return (rate, baseCount)
    }

    /// 10 種の敵。WEB 版 `ENEMY_TYPES` と同じ。
    static let stageEnemyTypes: [SurvivalEnemyType] = [
        .slime, .goblin, .skeleton, .zombie, .bat, .ghost, .orc, .demon, .dragon, .boss
    ]

    /// 敵タイプ毎のベースステータス。`elapsed` と `statMultiplier` を適用する。
    private static func stageEnemyBaseStats(
        type: SurvivalEnemyType,
        elapsed: TimeInterval,
        statMultiplier: Double
    ) -> SurvivalEnemyStats {
        let speedBoost: CGFloat = elapsed >= 60 ? 1.5 : 1.0
        let base: (atk: Int, def: Int, hp: Int, speed: CGFloat, exp: Int)
        switch type {
        case .slime:    base = (8, 2, 80, 1.2 * speedBoost, 8)
        case .goblin:   base = (10, 3, 100, 1.4 * speedBoost, 12)
        case .skeleton: base = (12, 4, 110, 1.3 * speedBoost, 14)
        case .zombie:   base = (14, 6, 150, 1.0 * speedBoost, 18)
        case .bat:      base = (6, 1, 70, 2.5 * speedBoost, 10)
        case .ghost:    base = (14, 2, 90, 1.6 * speedBoost, 16)
        case .orc:      base = (16, 8, 160, 1.1 * speedBoost, 22)
        case .demon:    base = (18, 5, 130, 1.7 * speedBoost, 26)
        case .dragon:   base = (22, 10, 220, 1.3 * speedBoost, 34)
        case .boss:     base = (26, 12, 320, 1.1 * speedBoost, 60)
        }
        return SurvivalEnemyStats(
            atk: max(1, Int(Double(base.atk) * statMultiplier)),
            def: max(0, Int(Double(base.def) * statMultiplier)),
            hp: max(1, Int(Double(base.hp) * statMultiplier)),
            maxHp: max(1, Int(Double(base.hp) * statMultiplier)),
            speed: base.speed,
            exp: base.exp
        )
    }

    static func spawnStageEnemy(
        playerX: CGFloat,
        playerY: CGFloat,
        elapsed: TimeInterval,
        isFirstSpawn: Bool,
        config: SurvivalStageConfig
    ) -> SurvivalEnemy {
        let margin = SurvivalConstants.enemySize * 0.8
        let x: CGFloat
        let y: CGFloat

        if isFirstSpawn {
            let dist: CGFloat = 300 + CGFloat.random(in: 0...200)
            let angle: CGFloat = CGFloat.random(in: 0...(2 * .pi))
            x = clamp(playerX + cos(angle) * dist, min: 0, max: SurvivalMap.width)
            y = clamp(playerY + sin(angle) * dist, min: 0, max: SurvivalMap.height)
        } else {
            let side = Int.random(in: 0...3)
            switch side {
            case 0:
                x = CGFloat.random(in: 0...SurvivalMap.width)
                y = -margin
            case 1:
                x = CGFloat.random(in: 0...SurvivalMap.width)
                y = SurvivalMap.height + margin
            case 2:
                x = -margin
                y = CGFloat.random(in: 0...SurvivalMap.height)
            default:
                x = SurvivalMap.width + margin
                y = CGFloat.random(in: 0...SurvivalMap.height)
            }
        }

        // elapsed が進むほど強い敵が出やすくなる簡易重み付け
        let candidates = enemyTypeCandidates(elapsed: elapsed)
        let type = candidates.randomElement() ?? .slime
        return SurvivalEnemy(
            type: type,
            x: x,
            y: y,
            stats: stageEnemyBaseStats(type: type, elapsed: elapsed, statMultiplier: config.enemyStatMultiplier)
        )
    }

    private static func enemyTypeCandidates(elapsed: TimeInterval) -> [SurvivalEnemyType] {
        if elapsed < 20 {
            return [.slime, .goblin, .bat, .slime]
        } else if elapsed < 45 {
            return [.slime, .goblin, .skeleton, .bat, .ghost, .zombie]
        } else if elapsed < 75 {
            return [.goblin, .skeleton, .zombie, .bat, .ghost, .orc, .demon]
        } else {
            return [.skeleton, .zombie, .ghost, .orc, .demon, .dragon, .boss]
        }
    }

    // MARK: - 敵移動 (プレイヤーを追跡 + 発射)

    static func updateEnemies(
        enemies: [SurvivalEnemy],
        playerX: CGFloat,
        playerY: CGFloat,
        deltaTime: TimeInterval,
        iceMultiplier: CGFloat = 1.0
    ) -> [SurvivalEnemy] {
        let dt = CGFloat(deltaTime)
        return enemies.map { enemy in
            var updated = enemy
            let dx = playerX - updated.x
            let dy = playerY - updated.y
            let distance = hypot(dx, dy)
            if distance >= 1 {
                let speed = min(SurvivalConstants.maxEnemySpeed,
                                SurvivalConstants.baseEnemySpeed * updated.stats.speed * iceMultiplier)
                let moveX = (dx / distance) * speed * dt
                let moveY = (dy / distance) * speed * dt
                var newX = updated.x + moveX + updated.knockbackVx * dt
                var newY = updated.y + moveY + updated.knockbackVy * dt
                let enemyMargin = SurvivalConstants.enemySize * 2
                newX = clamp(newX, min: -enemyMargin, max: SurvivalMap.width + enemyMargin)
                newY = clamp(newY, min: -enemyMargin, max: SurvivalMap.height + enemyMargin)
                updated.x = newX
                updated.y = newY
            }
            // ノックバック減衰
            updated.knockbackVx *= 0.9
            updated.knockbackVy *= 0.9
            if abs(updated.knockbackVx) < 0.5 { updated.knockbackVx = 0 }
            if abs(updated.knockbackVy) < 0.5 { updated.knockbackVy = 0 }
            return updated
        }
    }

    /// 敵が弾を撃つか判定し、新規弾を返す。
    /// - ghost / demon / dragon のみ射撃する。
    /// - 射撃クールダウンは敵種別に応じて 2.0 ~ 3.5 秒。
    static func shootEnemyProjectiles(
        enemies: inout [SurvivalEnemy],
        playerX: CGFloat,
        playerY: CGFloat,
        now: TimeInterval
    ) -> [SurvivalEnemyProjectile] {
        var projectiles: [SurvivalEnemyProjectile] = []
        let shootingRange: CGFloat = 520
        for idx in enemies.indices {
            var enemy = enemies[idx]
            guard Self.canShoot(type: enemy.type) else { continue }
            let cooldown: TimeInterval = Self.shootCooldown(for: enemy.type)
            guard now - enemy.lastShotAt >= cooldown else { continue }
            let dx = playerX - enemy.x
            let dy = playerY - enemy.y
            let distance = hypot(dx, dy)
            guard distance <= shootingRange, distance > 0.1 else { continue }
            let speed: CGFloat = 260
            let vx = (dx / distance) * speed
            let vy = (dy / distance) * speed
            projectiles.append(
                SurvivalEnemyProjectile(
                    x: enemy.x,
                    y: enemy.y,
                    vx: vx,
                    vy: vy,
                    damage: max(5, enemy.stats.atk),
                    expireAt: now + 2.5
                )
            )
            enemy.lastShotAt = now
            enemies[idx] = enemy
        }
        return projectiles
    }

    private static func canShoot(type: SurvivalEnemyType) -> Bool {
        switch type {
        case .ghost, .demon, .dragon: return true
        default: return false
        }
    }

    private static func shootCooldown(for type: SurvivalEnemyType) -> TimeInterval {
        switch type {
        case .ghost: return 2.2
        case .demon: return 3.0
        case .dragon: return 2.6
        default: return 3.5
        }
    }

    /// 敵弾を移動させて、期限切れ or 画面外のものを除去する
    static func updateEnemyProjectiles(
        projectiles: [SurvivalEnemyProjectile],
        deltaTime: TimeInterval,
        now: TimeInterval
    ) -> [SurvivalEnemyProjectile] {
        let dt = CGFloat(deltaTime)
        return projectiles.compactMap { proj in
            guard proj.expireAt > now else { return nil }
            var updated = proj
            updated.x += proj.vx * dt
            updated.y += proj.vy * dt
            guard updated.x > -80, updated.x < SurvivalMap.width + 80,
                  updated.y > -80, updated.y < SurvivalMap.height + 80 else {
                return nil
            }
            return updated
        }
    }

    /// 敵弾 × プレイヤー衝突判定 (WEB 版準拠: 無敵時間 / ノックバック無し)
    static func resolveEnemyProjectileHits(
        player: inout SurvivalPlayerState,
        projectiles: inout [SurvivalEnemyProjectile],
        defenderDef: Int,
        now: TimeInterval
    ) -> Int {
        let hitRadius = SurvivalConstants.playerSize / 2 + SurvivalConstants.enemyProjectileSize / 2
        let sq = hitRadius * hitRadius
        var totalDmg = 0
        var removeIds: Set<UUID> = []
        for proj in projectiles {
            let dx = proj.x - player.x
            let dy = proj.y - player.y
            if dx * dx + dy * dy <= sq {
                // WEB 版 `proj.damage - projEffectiveDef * 0.3` と同式
                let dmg = max(1, proj.damage - Int(Double(defenderDef) * 0.3))
                player.hp = max(0, player.hp - dmg)
                player.damageFlashUntil = now + SurvivalConstants.playerDamageFlashSec
                totalDmg += dmg
                removeIds.insert(proj.id)
            }
        }
        if !removeIds.isEmpty {
            projectiles.removeAll { removeIds.contains($0.id) }
        }
        return totalDmg
    }

    // MARK: - 弾丸

    /// 時計方向マルチ弾の角度計算 (Web 版 `getClockwiseBulletAngles`)
    static func clockwiseBulletAngles(count: Int, baseAngle: CGFloat) -> [CGFloat] {
        guard count > 0 else { return [] }
        let hourAngle: CGFloat = .pi / 6
        let minuteAngle: CGFloat = .pi / 12
        var angles: [CGFloat] = [baseAngle]
        var added = 1
        var hourOffset = 0
        var minuteOffset = 0
        while added < count {
            hourOffset += 1
            if hourOffset > 6 {
                minuteOffset += 1
                hourOffset = 1
            }
            let offset = CGFloat(hourOffset) * hourAngle + CGFloat(minuteOffset) * minuteAngle
            if added < count {
                angles.append(baseAngle + offset)
                added += 1
            }
            if added < count && hourOffset <= 6 {
                angles.append(baseAngle - offset)
                added += 1
            }
        }
        return angles
    }

    static func createAProjectiles(
        from player: SurvivalPlayerState,
        effectiveAAtk: Int
    ) -> [SurvivalProjectile] {
        let base = player.direction.angle
        let count = max(1, min(14, player.skills.aBulletCount))
        let damage = calculateAProjectileDamage(aAtk: effectiveAAtk)
        let angles = clockwiseBulletAngles(count: count, baseAngle: base)
        return angles.map { angle in
            SurvivalProjectile(
                x: player.x,
                y: player.y,
                angle: angle,
                damage: damage,
                remainingRange: SurvivalConstants.projectileMaxRange,
                penetrating: player.skills.aPenetration
            )
        }
    }

    static func updateProjectiles(
        projectiles: [SurvivalProjectile],
        deltaTime: TimeInterval
    ) -> [SurvivalProjectile] {
        let dt = CGFloat(deltaTime)
        let travel = SurvivalConstants.projectileSpeed * dt
        return projectiles.compactMap { proj in
            var updated = proj
            let vx = cos(updated.angle)
            let vy = sin(updated.angle)
            updated.x += vx * SurvivalConstants.projectileSpeed * dt
            updated.y += vy * SurvivalConstants.projectileSpeed * dt
            updated.remainingRange -= travel
            guard updated.remainingRange > 0,
                  updated.x > 0, updated.x < SurvivalMap.width,
                  updated.y > 0, updated.y < SurvivalMap.height else {
                return nil
            }
            return updated
        }
    }

    // MARK: - 衝撃波 (B 攻撃) - Web 版 SurvivalGameScreen.tsx の `newShockwave` と同等仕様

    /// Web 版と同様に衝撃波を生成する。
    /// - プレイヤー位置から向きベクトル方向へ `meleeAttackForwardOffset` (= 40px) だけオフセットした
    ///   位置を中心として、ベース半径 `meleeShockwaveBaseRadius` (= 80px)、
    ///   +20/レベルの射程ボーナスを持つ円形衝撃波を作る。
    /// - ダメージは発射時のプレイヤー座標を基準に適用したいので、
    ///   `colorLevel` で 0 (初撃) / 1..3 (多段) を区別しておく。
    static func createShockwave(
        from player: SurvivalPlayerState,
        effectiveBAtk: Int,
        now: TimeInterval,
        colorLevel: Int = 0
    ) -> SurvivalShockwave {
        let damage = calculateBMeleeDamage(bAtk: effectiveBAtk)
        let baseRadius = SurvivalConstants.meleeShockwaveBaseRadius
        let rangeBonus = CGFloat(player.skills.bRangeBonusLevel) * 20
        let maxRadius = baseRadius + rangeBonus
        let offset = SurvivalConstants.meleeAttackForwardOffset
        let dirVec = player.direction.vector
        let centerX = player.x + dirVec.dx * offset
        let centerY = player.y + dirVec.dy * offset
        return SurvivalShockwave(
            x: centerX,
            y: centerY,
            radius: 20,
            maxRadius: maxRadius,
            baseRadius: baseRadius,
            direction: player.direction,
            createdAt: now,
            lifetime: SurvivalConstants.meleeShockwaveLifetime,
            damage: damage,
            colorLevel: colorLevel
        )
    }

    static func updateShockwaves(
        shockwaves: [SurvivalShockwave],
        now: TimeInterval
    ) -> [SurvivalShockwave] {
        shockwaves.compactMap { wave in
            let age = now - wave.createdAt
            guard age < wave.lifetime else { return nil }
            var updated = wave
            let progress = CGFloat(age / wave.lifetime)
            updated.radius = 20 + (wave.maxRadius - 20) * progress
            return updated
        }
    }

    // MARK: - 衝突判定

    struct ProjectileHit {
        let projectileId: UUID
        let enemyId: UUID
        let damage: Int
        let shouldRemoveProjectile: Bool
    }

    struct ShockwaveHit {
        let shockwaveId: UUID
        let enemyId: UUID
        let damage: Int
        let knockbackVx: CGFloat
        let knockbackVy: CGFloat
    }

    /// プレイヤー弾 ↔ 敵 の衝突判定。
    static func resolveProjectileHits(
        projectiles: inout [SurvivalProjectile],
        enemies: [SurvivalEnemy],
        haisuiMultiplier: Double
    ) -> [ProjectileHit] {
        var hits: [ProjectileHit] = []
        let hitRadius: CGFloat = SurvivalConstants.enemySize / 2 + SurvivalConstants.projectileSize / 2

        for idx in projectiles.indices {
            var proj = projectiles[idx]
            for enemy in enemies {
                if proj.hitEnemyIds.contains(enemy.id) { continue }
                let dx = proj.x - enemy.x
                let dy = proj.y - enemy.y
                if dx * dx + dy * dy <= hitRadius * hitRadius {
                    proj.hitEnemyIds.insert(enemy.id)
                    let scaled = Int(Double(proj.damage) * haisuiMultiplier)
                    let dmg = calculateAttackDamage(baseDamage: scaled, attackerAtk: 0, defenderDef: enemy.stats.def)
                    let remove = !proj.penetrating
                    hits.append(ProjectileHit(projectileId: proj.id, enemyId: enemy.id, damage: dmg, shouldRemoveProjectile: remove))
                    if remove { break }
                }
            }
            projectiles[idx] = proj
        }
        return hits
    }

    /// 衝撃波 × 敵のヒット判定。Web 版 `newShockwave` 生成直後のループと同じ仕様:
    /// - 中心座標から敵までの距離と、プレイヤー向きとの内積で `isInFront` を判定
    /// - 正面は `maxRadius` (= baseRadius + 20 * bRangeBonus)、背後は `baseRadius` を使用
    /// - ダメージは Web 版と同じく 1 衝撃波につき 1 敵 1 回 (`hitEnemyIds` でデデュープ)
    /// - ノックバック速度は `150 + bKnockbackBonusLevel * 50`
    /// - 1 発の衝撃波でダメージ計算が完結するため、多段ヒットは呼び出し側で
    ///   `SurvivalPendingShockwave` を積んで時差発火する。
    static func resolveShockwaveHits(
        shockwaves: inout [SurvivalShockwave],
        enemies: [SurvivalEnemy],
        player: SurvivalPlayerState,
        knockbackBonusLevel: Int,
        haisuiMultiplier: Double
    ) -> [ShockwaveHit] {
        var hits: [ShockwaveHit] = []
        let knockbackForce = SurvivalConstants.meleeKnockbackBase
            + CGFloat(knockbackBonusLevel) * SurvivalConstants.meleeKnockbackPerLevel

        for idx in shockwaves.indices {
            var wave = shockwaves[idx]
            let dirVec = wave.direction.vector
            for enemy in enemies {
                if wave.hitEnemyIds.contains(enemy.id) { continue }
                let dx = enemy.x - wave.x
                let dy = enemy.y - wave.y
                let distSq = dx * dx + dy * dy

                // isInFront 判定: プレイヤー中心 → 敵 のベクトルと向きの内積
                let toEnemyX = enemy.x - player.x
                let toEnemyY = enemy.y - player.y
                let dot = toEnemyX * dirVec.dx + toEnemyY * dirVec.dy
                let isInFront = dot > 0
                let effectiveRange = isInFront ? wave.maxRadius : wave.baseRadius

                if distSq <= effectiveRange * effectiveRange {
                    wave.hitEnemyIds.insert(enemy.id)
                    let scaled = Int(Double(wave.damage) * haisuiMultiplier)
                    let dmg = calculateAttackDamage(baseDamage: scaled, attackerAtk: 0, defenderDef: enemy.stats.def)
                    let distance = max(1, hypot(dx, dy))
                    hits.append(ShockwaveHit(
                        shockwaveId: wave.id,
                        enemyId: enemy.id,
                        damage: dmg,
                        knockbackVx: dx / distance * knockbackForce,
                        knockbackVy: dy / distance * knockbackForce
                    ))
                }
            }
            shockwaves[idx] = wave
        }
        return hits
    }

    /// 衝撃波による敵弾消去 (`bDeflect=true` の場合のみ)
    static func resolveEnemyProjectileDeflect(
        shockwaves: [SurvivalShockwave],
        enemyProjectiles: inout [SurvivalEnemyProjectile],
        bDeflect: Bool
    ) {
        guard bDeflect, !shockwaves.isEmpty else { return }
        var removeIds: Set<UUID> = []
        for wave in shockwaves {
            let combined = wave.radius + SurvivalConstants.enemyProjectileSize / 2
            let sq = combined * combined
            for proj in enemyProjectiles {
                let dx = wave.x - proj.x
                let dy = wave.y - proj.y
                if dx * dx + dy * dy <= sq {
                    removeIds.insert(proj.id)
                }
            }
        }
        if !removeIds.isEmpty {
            enemyProjectiles.removeAll { removeIds.contains($0.id) }
        }
    }

    /// プレイヤー ↔ 敵接触ダメージ (WEB 版準拠: 無敵時間 / ノックバック無し、deltaTime 乗算の DOT 型)
    /// WEB: `damage = max(1, enemy.atk - def * 0.5) * deltaTime * 2` を全ての接触敵について加算
    /// 接触範囲は WEB 版と同じ `distSq < 900 (= 30^2)` 相当。
    static func enemyContactDamageDOT(
        player: SurvivalPlayerState,
        enemies: [SurvivalEnemy],
        defenderDef: Int,
        deltaTime: TimeInterval
    ) -> Int {
        let contactRadius: CGFloat = 30
        let sq = contactRadius * contactRadius
        var totalDamage: Double = 0
        for enemy in enemies {
            let dx = enemy.x - player.x
            let dy = enemy.y - player.y
            if dx * dx + dy * dy < sq {
                let per = max(1.0, Double(enemy.stats.atk) - Double(defenderDef) * 0.5)
                totalDamage += per * deltaTime * 2
            }
        }
        return Int(totalDamage)
    }

    // MARK: - haisuiNoJin / zekkouchou ダメージ倍率

    /// haisuiNoJin: HP < 25% でダメージ +50%、`alwaysHaisuiNoJin` なら常時適用
    /// zekkouchou: HP = max でダメージ +30%、`alwaysZekkouchou` なら常時適用
    static func offensiveMultiplier(player: SurvivalPlayerState) -> Double {
        var mult = 1.0
        let ratio = Double(player.hp) / Double(max(1, player.maxHp))
        if player.skills.haisuiNoJin {
            if player.skills.alwaysHaisuiNoJin || ratio < 0.25 {
                mult *= 1.5
            }
        }
        if player.skills.zekkouchou {
            if player.skills.alwaysZekkouchou || ratio >= 0.999 {
                mult *= 1.3
            }
        }
        return mult
    }

    // MARK: - utilities

    @inline(__always)
    static func clamp(_ v: CGFloat, min lo: CGFloat, max hi: CGFloat) -> CGFloat {
        Swift.min(hi, Swift.max(lo, v))
    }
}
