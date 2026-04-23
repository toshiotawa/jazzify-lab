import Foundation
import CoreGraphics

// MARK: - Boss Types

/// Web 版 `src/components/survival/boss/SurvivalBossTypes.ts` 相当。
enum SurvivalBossType: String, Sendable {
    case A, B, C

    var displayName: String {
        switch self {
        case .A: return "断頭の獣"
        case .B: return "腐敗の母核"
        case .C: return "虚輪の監視者"
        }
    }
}

enum SurvivalBossSkillId: String, Sendable {
    case sweep
    case charge
    case bloodPool
    case spores
    case acidShot
    case shockRing
    case crossBlast
    case pull
}

enum SurvivalBossActionKind: Sendable {
    case idle
    case windup(skill: SurvivalBossSkillId, startAt: TimeInterval, durationMs: Double)
    case active(skill: SurvivalBossSkillId, startAt: TimeInterval, durationMs: Double)
    case recovery(skill: SurvivalBossSkillId, startAt: TimeInterval, durationMs: Double)
    case charging(angle: CGFloat, startAt: TimeInterval, durationMs: Double, origin: CGPoint)
}

enum SurvivalBossPhase: Int, Sendable { case one = 1, two = 2, three = 3 }

struct SurvivalBossHazard: Identifiable, Sendable {
    enum Kind: Sendable {
        case fanTelegraph(angle: CGFloat, spread: CGFloat, radius: CGFloat)
        case fanActive(angle: CGFloat, spread: CGFloat, radius: CGFloat, damage: Int)
        case lineTelegraph(angle: CGFloat, length: CGFloat, thickness: CGFloat)
        case lineActive(angle: CGFloat, length: CGFloat, thickness: CGFloat, damage: Int)
        case bloodPool(radius: CGFloat, dps: Int)
        case eggTelegraph(radius: CGFloat)
        case ringTelegraph(innerRadius: CGFloat, outerRadius: CGFloat)
        case ringActive(innerRadius: CGFloat, outerRadius: CGFloat, damage: Int)
        case crossTelegraph(length: CGFloat, thickness: CGFloat)
        case crossActive(length: CGFloat, thickness: CGFloat, damage: Int)
        case pullTelegraph(range: CGFloat)
        case pullField(range: CGFloat, damage: Int)
        case acidPool(radius: CGFloat, dps: Int)
    }

    let id: UUID = UUID()
    var kind: Kind
    var x: CGFloat
    var y: CGFloat
    var startAt: TimeInterval
    var endAt: TimeInterval
    /// プレイヤーに対する 1 回のヒットクールダウン (重複ダメ防止用)
    var playerLastHitAt: TimeInterval = 0
}

struct SurvivalBossMinion: Identifiable, Sendable {
    let id: UUID = UUID()
    var x: CGFloat
    var y: CGFloat
    var hp: Int
    var armUntil: TimeInterval
    var triggerRange: CGFloat
    var explosionRadius: CGFloat
    var explosionDamage: Int
    var isExploding: Bool = false
    var spawnedAt: TimeInterval
}

struct SurvivalBossProjectile: Identifiable, Sendable {
    let id: UUID = UUID()
    var x: CGFloat
    var y: CGFloat
    var vx: CGFloat
    var vy: CGFloat
    var damage: Int
    var spawnsPoolOnLand: Bool
    var poolRadius: CGFloat
    var poolDurationMs: Double
    var expireAt: TimeInterval
}

struct SurvivalBoss: Sendable {
    /// 衝撃波・弾の多段ヒット抑制 (`SurvivalShockwave.hitEnemyIds` / `SurvivalProjectile.hitEnemyIds`) 用の安定 ID。
    /// ボス戦ライフサイクルを跨いで同一ボスを識別するため、生成時に一度だけ UUID を割り当てる。
    let id: UUID = UUID()
    var bossType: SurvivalBossType
    var x: CGFloat
    var y: CGFloat
    var hp: Int
    var maxHp: Int
    var phase: SurvivalBossPhase = .one
    var action: SurvivalBossActionKind = .idle
    /// skill → 次に発動可能な時刻
    var nextSkillAt: [SurvivalBossSkillId: TimeInterval] = [:]
    /// 予告時に計算された突進角度。アクティブ遷移でも同じ値を使い、予告線と実突進をズラさない。
    /// (WEB 版 `boss.action.data.angle` 相当)
    var pendingChargeAngle: CGFloat? = nil
    /// acidShot も予告時のプレイヤー位置で角度を固定する (WEB 版 data.angle)。
    var pendingAcidAngle: CGFloat? = nil
}

enum SurvivalBossResult: Sendable { case ongoing, win, lose }

struct SurvivalBossBattleState: Sendable {
    var boss: SurvivalBoss
    var minions: [SurvivalBossMinion] = []
    var hazards: [SurvivalBossHazard] = []
    var projectiles: [SurvivalBossProjectile] = []
    var result: SurvivalBossResult = .ongoing
    var startedAt: TimeInterval
}

// MARK: - Boss Engine

/// ボス戦ロジック (Web 版 `SurvivalBossEngine.ts` のステートマシン + スキル発動を移植)。
/// 各スキルのタイミング・ダメージ値は `BOSS_A_PARAMS` / `BOSS_B_PARAMS` / `BOSS_C_PARAMS` 準拠。
enum SurvivalBossEngine {
    // MARK: - パラメータ (Web 準拠)

    struct BossAParams {
        static let speedFactor: CGFloat = 0.52
        static let chargeSpeedFactor: CGFloat = 2.0
        static let sweepCdMs: Double = 4500
        static let sweepWindupMs: Double = 900
        static let sweepActiveMs: Double = 200
        static let sweepRecoveryMs: Double = 300
        static let sweepRadius: CGFloat = SurvivalConstants.bossHitboxRadius * 2.5
        static let sweepSpread: CGFloat = .pi / 2
        static let sweepDamage: Int = 80
        static let chargeCdMs: Double = 7000
        static let chargeWindupMs: Double = 1100
        static let chargeTravelMs: Double = 450
        static let chargeRecoveryMs: Double = 800
        static let chargeDistance: CGFloat = 520
        static let chargeThickness: CGFloat = SurvivalConstants.bossHitboxRadius
        static let chargeDamage: Int = 110
        static let bloodPoolMs: Double = 3000
        static let bloodPoolRadius: CGFloat = 70
        static let bloodPoolDps: Int = 480 // 8 per frame @60fps → ~480 dps
    }

    struct BossBParams {
        static let speedFactor: CGFloat = 0.44
        static let sporesCdMs: Double = 6000
        static let sporesWindupMs: Double = 800
        static let acidShotCdMs: Double = 5000
        static let acidShotWindupMs: Double = 700
        static let acidSpeed: CGFloat = 260
        static let acidDamage: Int = 60
        static let acidSpread: CGFloat = 0.25
        static let acidCount: Int = 3
        static let poolMs: Double = 2500
        static let poolRadius: CGFloat = 60
        static let poolDps: Int = 300
        static let minionHp: Int = 35
        static let minionFuseMs: Double = 900
        static let minionTriggerRange: CGFloat = 72
        static let minionExplosionRadius: CGFloat = 120
        static let explosionDamage: Int = 120
    }

    struct BossCParams {
        static let speedFactor: CGFloat = 0.48
        static let ringCdMs: Double = 6500
        static let ringWindupMs: Double = 1000
        static let ringActiveMs: Double = 220
        static let ringInnerRadius: CGFloat = 140
        static let ringOuterRadius: CGFloat = 280
        static let ringDamage: Int = 100
        static let crossCdMs: Double = 8000
        static let crossWindupMs: Double = 1200
        static let crossActiveMs: Double = 250
        static let crossLength: CGFloat = 900
        static let crossThickness: CGFloat = 46
        static let crossDamage: Int = 140
        static let pullCdMs: Double = 10000
        static let pullWindupMs: Double = 800
        static let pullActiveMs: Double = 260
        static let pullRange: CGFloat = 560
        static let pullDamage: Int = 40
    }

    /// 開幕グレース (ms) - ボスはこの間動かない。
    static let openingGraceMs: Double = 2000
    /// プレイヤーが扇/直線/リング/十字に当たった時のノックバック速度
    static let hazardKnockbackSpeed: CGFloat = 520

    // MARK: - ブロックキー → ボスタイプ

    static func bossType(for blockKey: SurvivalBlockKey) -> SurvivalBossType {
        switch blockKey {
        case .major, .M7, .mM7, .M7_9, .seven_b9_13:
            return .A
        case .minor, .m7, .dim7, .m7_9, .seven_sharp9_b13:
            return .B
        case .seven, .m7b5, .aug7, .six, .m6, .seven_9_13, .seven_b9_b13, .six_9, .m6_9, .m7b5_11, .dimM7:
            return .C
        }
    }

    /// ブロック末尾 (= Mixed を含む最後のステージ番号) かどうか
    static func isBlockLastStage(stageNumber: Int) -> Bool {
        guard let block = SurvivalStageCatalog.block(forStage: stageNumber) else { return false }
        return block.lastStage == stageNumber
    }

    // MARK: - 初期化

    static func createBossBattleState(bossType: SurvivalBossType, now: TimeInterval) -> SurvivalBossBattleState {
        let boss = SurvivalBoss(
            bossType: bossType,
            x: SurvivalMap.width / 2,
            y: SurvivalMap.height / 2 - 240,
            hp: SurvivalConstants.bossMaxHp,
            maxHp: SurvivalConstants.bossMaxHp,
            nextSkillAt: initialNextSkillAt(now: now)
        )
        return SurvivalBossBattleState(boss: boss, startedAt: now)
    }

    private static func initialNextSkillAt(now: TimeInterval) -> [SurvivalBossSkillId: TimeInterval] {
        let far = now + 99_999
        return [
            .sweep: now + 1.8,
            .charge: now + 3.5,
            .bloodPool: far,
            .spores: now + 1.5,
            .acidShot: far,
            .shockRing: now + 2.0,
            .crossBlast: far,
            .pull: far,
        ]
    }

    // MARK: - フェーズ計算

    private static func computePhase(hp: Int, maxHp: Int) -> SurvivalBossPhase {
        let ratio = Double(hp) / Double(max(1, maxHp))
        if ratio > 0.7 { return .one }
        if ratio > 0.35 { return .two }
        return .three
    }

    // MARK: - メインアップデート

    /// ボス戦 1 フレームの進行。戻り値はプレイヤーのダメージや即時 HP 更新などを返す。
    struct BossTickResult {
        var playerDamage: Int = 0
        var playerKnockback: CGVector = .zero
    }

    static func tick(
        state: inout SurvivalBossBattleState,
        player: inout SurvivalPlayerState,
        deltaTime: TimeInterval,
        now: TimeInterval
    ) -> BossTickResult {
        var result = BossTickResult()
        guard state.result == .ongoing else { return result }

        // フェーズ更新
        state.boss.phase = computePhase(hp: state.boss.hp, maxHp: state.boss.maxHp)

        // 開幕グレース
        let sinceStart = (now - state.startedAt) * 1000.0
        if sinceStart < openingGraceMs {
            updateProjectiles(state: &state, now: now, deltaTime: deltaTime, player: &player, result: &result)
            updateMinions(state: &state, player: &player, now: now, deltaTime: deltaTime, result: &result)
            updateHazards(state: &state, player: &player, now: now, result: &result)
            return result
        }

        // ボス行動
        advanceBossAction(state: &state, player: player, now: now, deltaTime: deltaTime)
        tryStartSkill(state: &state, player: player, now: now)
        moveBoss(state: &state, player: player, now: now, deltaTime: deltaTime)

        // ミニオン・ハザード・弾処理
        updateMinions(state: &state, player: &player, now: now, deltaTime: deltaTime, result: &result)
        updateHazards(state: &state, player: &player, now: now, result: &result)
        updateProjectiles(state: &state, now: now, deltaTime: deltaTime, player: &player, result: &result)

        // ボス本体との接触ダメージは無効化 (WEB 版と仕様を揃える)。
        // 弾・ハザードは従来どおり判定するので、プレイヤーはボスに重なっても
        // 直接のダメージを受けない。

        // 勝敗
        if state.boss.hp <= 0 {
            state.result = .win
        } else if player.hp <= 0 {
            state.result = .lose
        }
        return result
    }

    // MARK: - ボス行動遷移

    private static func advanceBossAction(
        state: inout SurvivalBossBattleState,
        player: SurvivalPlayerState,
        now: TimeInterval,
        deltaTime: TimeInterval
    ) {
        let action = state.boss.action
        switch action {
        case .idle:
            break
        case .windup(let skill, let startAt, let durationMs):
            if now - startAt >= durationMs / 1000.0 {
                state.boss.action = .active(skill: skill, startAt: now, durationMs: activeDuration(for: skill))
                onSkillActivate(state: &state, skill: skill, player: player, now: now)
            }
        case .active(let skill, let startAt, let durationMs):
            if now - startAt >= durationMs / 1000.0 {
                state.boss.action = .recovery(skill: skill, startAt: now, durationMs: recoveryDuration(for: skill))
                onSkillRecover(state: &state, skill: skill, player: player, now: now)
            }
        case .recovery(_, let startAt, let durationMs):
            if now - startAt >= durationMs / 1000.0 {
                state.boss.action = .idle
            }
        case .charging(let angle, let startAt, let durationMs, let origin):
            let t = (now - startAt) / (durationMs / 1000.0)
            if t >= 1 {
                state.boss.action = .recovery(skill: .charge, startAt: now, durationMs: BossAParams.chargeRecoveryMs)
            } else {
                let distance = BossAParams.chargeDistance * CGFloat(t)
                state.boss.x = clampX(origin.x + cos(angle) * distance)
                state.boss.y = clampY(origin.y + sin(angle) * distance)
            }
        }
    }

    private static func activeDuration(for skill: SurvivalBossSkillId) -> Double {
        switch skill {
        case .sweep: return BossAParams.sweepActiveMs
        case .charge: return BossAParams.chargeTravelMs
        case .spores: return 150
        case .acidShot: return 100
        case .shockRing: return BossCParams.ringActiveMs
        case .crossBlast: return BossCParams.crossActiveMs
        case .pull: return BossCParams.pullActiveMs
        case .bloodPool: return 100
        }
    }

    private static func recoveryDuration(for skill: SurvivalBossSkillId) -> Double {
        switch skill {
        case .sweep: return BossAParams.sweepRecoveryMs
        case .charge: return BossAParams.chargeRecoveryMs
        case .spores: return 600
        case .acidShot: return 500
        case .shockRing: return 600
        case .crossBlast: return 800
        case .pull: return 900
        case .bloodPool: return 200
        }
    }

    // MARK: - スキル開始

    private static func tryStartSkill(
        state: inout SurvivalBossBattleState,
        player: SurvivalPlayerState,
        now: TimeInterval
    ) {
        guard case .idle = state.boss.action else { return }

        let candidates: [SurvivalBossSkillId]
        switch state.boss.bossType {
        case .A: candidates = [.sweep, .charge]
        case .B: candidates = [.spores, .acidShot]
        case .C: candidates = [.shockRing, .crossBlast, .pull]
        }

        for skill in candidates {
            guard let when = state.boss.nextSkillAt[skill], now >= when else { continue }
            if startSkill(state: &state, skill: skill, player: player, now: now) {
                return
            }
        }
    }

    private static func startSkill(
        state: inout SurvivalBossBattleState,
        skill: SurvivalBossSkillId,
        player: SurvivalPlayerState,
        now: TimeInterval
    ) -> Bool {
        let boss = state.boss
        switch skill {
        case .sweep:
            let angle = atan2(player.y - boss.y, player.x - boss.x)
            state.boss.action = .windup(skill: .sweep, startAt: now, durationMs: BossAParams.sweepWindupMs)
            state.hazards.append(SurvivalBossHazard(
                kind: .fanTelegraph(angle: angle, spread: BossAParams.sweepSpread, radius: BossAParams.sweepRadius),
                x: boss.x, y: boss.y,
                startAt: now,
                endAt: now + BossAParams.sweepWindupMs / 1000.0
            ))
            state.boss.nextSkillAt[.sweep] = now + BossAParams.sweepCdMs / 1000.0
            return true
        case .charge:
            let angle = atan2(player.y - boss.y, player.x - boss.x)
            state.boss.action = .windup(skill: .charge, startAt: now, durationMs: BossAParams.chargeWindupMs)
            state.boss.pendingChargeAngle = angle
            state.hazards.append(SurvivalBossHazard(
                kind: .lineTelegraph(angle: angle, length: BossAParams.chargeDistance, thickness: BossAParams.chargeThickness),
                x: boss.x, y: boss.y,
                startAt: now,
                endAt: now + BossAParams.chargeWindupMs / 1000.0
            ))
            state.boss.nextSkillAt[.charge] = now + BossAParams.chargeCdMs / 1000.0
            return true
        case .spores:
            state.boss.action = .windup(skill: .spores, startAt: now, durationMs: BossBParams.sporesWindupMs)
            state.boss.nextSkillAt[.spores] = now + BossBParams.sporesCdMs / 1000.0
            return true
        case .acidShot:
            // 予告時にプレイヤー方向を固定 (アクティブでプレイヤーが動いても元の角度を維持)
            let angle = atan2(player.y - boss.y, player.x - boss.x)
            state.boss.pendingAcidAngle = angle
            state.boss.action = .windup(skill: .acidShot, startAt: now, durationMs: BossBParams.acidShotWindupMs)
            state.boss.nextSkillAt[.acidShot] = now + BossBParams.acidShotCdMs / 1000.0
            return true
        case .shockRing:
            state.boss.action = .windup(skill: .shockRing, startAt: now, durationMs: BossCParams.ringWindupMs)
            state.hazards.append(SurvivalBossHazard(
                kind: .ringTelegraph(innerRadius: BossCParams.ringInnerRadius, outerRadius: BossCParams.ringOuterRadius),
                x: boss.x, y: boss.y,
                startAt: now,
                endAt: now + BossCParams.ringWindupMs / 1000.0
            ))
            state.boss.nextSkillAt[.shockRing] = now + BossCParams.ringCdMs / 1000.0
            return true
        case .crossBlast:
            state.boss.action = .windup(skill: .crossBlast, startAt: now, durationMs: BossCParams.crossWindupMs)
            state.hazards.append(SurvivalBossHazard(
                kind: .crossTelegraph(length: BossCParams.crossLength, thickness: BossCParams.crossThickness),
                x: boss.x, y: boss.y,
                startAt: now,
                endAt: now + BossCParams.crossWindupMs / 1000.0
            ))
            state.boss.nextSkillAt[.crossBlast] = now + BossCParams.crossCdMs / 1000.0
            return true
        case .pull:
            state.boss.action = .windup(skill: .pull, startAt: now, durationMs: BossCParams.pullWindupMs)
            state.hazards.append(SurvivalBossHazard(
                kind: .pullTelegraph(range: BossCParams.pullRange),
                x: boss.x, y: boss.y,
                startAt: now,
                endAt: now + BossCParams.pullWindupMs / 1000.0
            ))
            state.boss.nextSkillAt[.pull] = now + BossCParams.pullCdMs / 1000.0
            return true
        case .bloodPool:
            return false
        }
    }

    private static func onSkillActivate(
        state: inout SurvivalBossBattleState,
        skill: SurvivalBossSkillId,
        player: SurvivalPlayerState,
        now: TimeInterval
    ) {
        let boss = state.boss
        switch skill {
        case .sweep:
            let angle = atan2(player.y - boss.y, player.x - boss.x)
            let active = SurvivalBossHazard(
                kind: .fanActive(angle: angle, spread: BossAParams.sweepSpread, radius: BossAParams.sweepRadius, damage: BossAParams.sweepDamage),
                x: boss.x, y: boss.y,
                startAt: now,
                endAt: now + BossAParams.sweepActiveMs / 1000.0
            )
            state.hazards.append(active)
        case .charge:
            // 予告時に計算した角度を流用。存在しない場合のみフォールバックでプレイヤー方向を再計算する。
            let angle = state.boss.pendingChargeAngle ?? atan2(player.y - boss.y, player.x - boss.x)
            state.boss.pendingChargeAngle = nil
            state.boss.action = .charging(angle: angle, startAt: now, durationMs: BossAParams.chargeTravelMs, origin: CGPoint(x: boss.x, y: boss.y))
            let line = SurvivalBossHazard(
                kind: .lineActive(angle: angle, length: BossAParams.chargeDistance, thickness: BossAParams.chargeThickness, damage: BossAParams.chargeDamage),
                x: boss.x, y: boss.y,
                startAt: now,
                endAt: now + BossAParams.chargeTravelMs / 1000.0
            )
            state.hazards.append(line)
        case .spores:
            // 3 体の自爆ミニオン召喚
            for _ in 0..<3 {
                let offsetX = CGFloat.random(in: -160...160)
                let offsetY = CGFloat.random(in: -160...160)
                let spawnX = clampX(boss.x + offsetX)
                let spawnY = clampY(boss.y + offsetY)
                let minion = SurvivalBossMinion(
                    x: spawnX,
                    y: spawnY,
                    hp: BossBParams.minionHp,
                    armUntil: now + BossBParams.minionFuseMs / 1000.0 + 4.0,
                    triggerRange: BossBParams.minionTriggerRange,
                    explosionRadius: BossBParams.minionExplosionRadius,
                    explosionDamage: BossBParams.explosionDamage,
                    spawnedAt: now
                )
                state.minions.append(minion)
            }
        case .acidShot:
            let baseAngle = state.boss.pendingAcidAngle ?? atan2(player.y - boss.y, player.x - boss.x)
            state.boss.pendingAcidAngle = nil
            let spread = BossBParams.acidSpread
            for i in 0..<BossBParams.acidCount {
                let offset = spread * (CGFloat(i) - CGFloat(BossBParams.acidCount - 1) / 2)
                let angle = baseAngle + offset
                let proj = SurvivalBossProjectile(
                    x: boss.x, y: boss.y,
                    vx: cos(angle) * BossBParams.acidSpeed,
                    vy: sin(angle) * BossBParams.acidSpeed,
                    damage: BossBParams.acidDamage,
                    spawnsPoolOnLand: true,
                    poolRadius: BossBParams.poolRadius,
                    poolDurationMs: BossBParams.poolMs,
                    expireAt: now + 1.2
                )
                state.projectiles.append(proj)
            }
        case .shockRing:
            let active = SurvivalBossHazard(
                kind: .ringActive(innerRadius: BossCParams.ringInnerRadius, outerRadius: BossCParams.ringOuterRadius, damage: BossCParams.ringDamage),
                x: boss.x, y: boss.y,
                startAt: now,
                endAt: now + BossCParams.ringActiveMs / 1000.0
            )
            state.hazards.append(active)
        case .crossBlast:
            let active = SurvivalBossHazard(
                kind: .crossActive(length: BossCParams.crossLength, thickness: BossCParams.crossThickness, damage: BossCParams.crossDamage),
                x: boss.x, y: boss.y,
                startAt: now,
                endAt: now + BossCParams.crossActiveMs / 1000.0
            )
            state.hazards.append(active)
        case .pull:
            let active = SurvivalBossHazard(
                kind: .pullField(range: BossCParams.pullRange, damage: BossCParams.pullDamage),
                x: boss.x, y: boss.y,
                startAt: now,
                endAt: now + BossCParams.pullActiveMs / 1000.0
            )
            state.hazards.append(active)
        case .bloodPool:
            break
        }
    }

    private static func onSkillRecover(
        state: inout SurvivalBossBattleState,
        skill: SurvivalBossSkillId,
        player: SurvivalPlayerState,
        now: TimeInterval
    ) {
        // ボス A の sweep 後に確率でブラッドプール
        if skill == .sweep && state.boss.bossType == .A && state.boss.phase.rawValue >= 2 {
            let pool = SurvivalBossHazard(
                kind: .bloodPool(radius: BossAParams.bloodPoolRadius, dps: BossAParams.bloodPoolDps),
                x: player.x, y: player.y,
                startAt: now,
                endAt: now + BossAParams.bloodPoolMs / 1000.0
            )
            state.hazards.append(pool)
        }
    }

    // MARK: - ボス移動

    private static func moveBoss(
        state: inout SurvivalBossBattleState,
        player: SurvivalPlayerState,
        now: TimeInterval,
        deltaTime: TimeInterval
    ) {
        let boss = state.boss
        switch boss.action {
        case .windup, .active, .recovery, .charging:
            return
        case .idle:
            break
        }

        let factor: CGFloat
        switch boss.bossType {
        case .A: factor = BossAParams.speedFactor
        case .B: factor = BossBParams.speedFactor
        case .C: factor = BossCParams.speedFactor
        }
        let speed = 220 * factor
        let dx = player.x - boss.x
        let dy = player.y - boss.y
        let dist = hypot(dx, dy)
        guard dist > 120 else { return }
        let nx = dx / dist
        let ny = dy / dist
        state.boss.x = clampX(boss.x + nx * speed * CGFloat(deltaTime))
        state.boss.y = clampY(boss.y + ny * speed * CGFloat(deltaTime))
    }

    // MARK: - ハザード更新

    private static func updateHazards(
        state: inout SurvivalBossBattleState,
        player: inout SurvivalPlayerState,
        now: TimeInterval,
        result: inout BossTickResult
    ) {
        state.hazards.removeAll { $0.endAt <= now }

        for idx in state.hazards.indices {
            var hazard = state.hazards[idx]
            switch hazard.kind {
            case .fanActive(let angle, let spread, let radius, let damage):
                if isInsideFan(player.x, player.y, hazard.x, hazard.y, centerAngle: angle, spread: spread, radius: radius) {
                    applyPlayerDamage(&player, damage: damage, now: now, iFrame: SurvivalConstants.iFrameHazard, result: &result)
                    applyKnockbackAway(player: &player, from: CGPoint(x: hazard.x, y: hazard.y), now: now)
                }
            case .lineActive(let angle, let length, let thickness, let damage):
                if isInsideLine(player.x, player.y, originX: hazard.x, originY: hazard.y, angle: angle, length: length, thickness: thickness) {
                    applyPlayerDamage(&player, damage: damage, now: now, iFrame: SurvivalConstants.iFrameHazard, result: &result)
                    applyKnockbackAway(player: &player, from: CGPoint(x: hazard.x, y: hazard.y), now: now)
                }
            case .ringActive(let innerRadius, let outerRadius, let damage):
                let d = hypot(player.x - hazard.x, player.y - hazard.y)
                if d >= innerRadius && d <= outerRadius {
                    applyPlayerDamage(&player, damage: damage, now: now, iFrame: SurvivalConstants.iFrameHazard, result: &result)
                    applyKnockbackAway(player: &player, from: CGPoint(x: hazard.x, y: hazard.y), now: now)
                }
            case .crossActive(let length, let thickness, let damage):
                if isInsideCross(player.x, player.y, cx: hazard.x, cy: hazard.y, length: length, thickness: thickness) {
                    applyPlayerDamage(&player, damage: damage, now: now, iFrame: SurvivalConstants.iFrameHazard, result: &result)
                }
            case .pullField(let range, let damage):
                let d = hypot(player.x - hazard.x, player.y - hazard.y)
                if d < range {
                    let pullStrength: CGFloat = 240
                    let nx = (hazard.x - player.x) / max(1, d)
                    let ny = (hazard.y - player.y) / max(1, d)
                    player.x = clampX(player.x + nx * pullStrength * (1.0 / 60.0))
                    player.y = clampY(player.y + ny * pullStrength * (1.0 / 60.0))
                    if now - hazard.playerLastHitAt > 0.4 {
                        applyPlayerDamage(&player, damage: damage, now: now, iFrame: 0.2, result: &result)
                        hazard.playerLastHitAt = now
                    }
                }
            case .bloodPool(let radius, let dps), .acidPool(let radius, let dps):
                let d = hypot(player.x - hazard.x, player.y - hazard.y)
                if d < radius {
                    if now - hazard.playerLastHitAt > 0.25 {
                        let dmg = Int(Double(dps) * 0.25)
                        applyPlayerDamage(&player, damage: dmg, now: now, iFrame: 0.05, result: &result)
                        hazard.playerLastHitAt = now
                    }
                }
            case .fanTelegraph, .lineTelegraph, .ringTelegraph, .crossTelegraph, .eggTelegraph, .pullTelegraph:
                break
            }
            state.hazards[idx] = hazard
        }
    }

    private static func updateMinions(
        state: inout SurvivalBossBattleState,
        player: inout SurvivalPlayerState,
        now: TimeInterval,
        deltaTime: TimeInterval,
        result: inout BossTickResult
    ) {
        var remaining: [SurvivalBossMinion] = []
        let dt = CGFloat(deltaTime)
        for var minion in state.minions {
            let dx = player.x - minion.x
            let dy = player.y - minion.y
            let dist = hypot(dx, dy)
            let speed: CGFloat = 120
            if dist > 1 {
                minion.x = clampX(minion.x + (dx / dist) * speed * dt)
                minion.y = clampY(minion.y + (dy / dist) * speed * dt)
            }
            if dist <= minion.triggerRange && !minion.isExploding {
                minion.isExploding = true
                // 近距離爆発：即時ダメージ
                let hitDist = hypot(player.x - minion.x, player.y - minion.y)
                if hitDist <= minion.explosionRadius {
                    applyPlayerDamage(&player, damage: minion.explosionDamage, now: now, iFrame: SurvivalConstants.iFrameHazard, result: &result)
                }
                continue // 削除
            }
            if minion.hp <= 0 { continue }
            if now > minion.armUntil { continue } // 時間切れで消失
            remaining.append(minion)
        }
        state.minions = remaining
    }

    private static func updateProjectiles(
        state: inout SurvivalBossBattleState,
        now: TimeInterval,
        deltaTime: TimeInterval,
        player: inout SurvivalPlayerState,
        result: inout BossTickResult
    ) {
        var kept: [SurvivalBossProjectile] = []
        let dt = CGFloat(deltaTime)
        for var proj in state.projectiles {
            proj.x += proj.vx * dt
            proj.y += proj.vy * dt

            let hit = hypot(proj.x - player.x, proj.y - player.y) <= (SurvivalConstants.playerSize / 2 + 12)
            let expired = now >= proj.expireAt || proj.x < 0 || proj.x > SurvivalMap.width || proj.y < 0 || proj.y > SurvivalMap.height
            if hit {
                applyPlayerDamage(&player, damage: proj.damage, now: now, iFrame: SurvivalConstants.iFrameContact, result: &result)
            }
            if hit || expired {
                if proj.spawnsPoolOnLand {
                    state.hazards.append(SurvivalBossHazard(
                        kind: .acidPool(radius: proj.poolRadius, dps: BossBParams.poolDps),
                        x: proj.x, y: proj.y,
                        startAt: now,
                        endAt: now + proj.poolDurationMs / 1000.0
                    ))
                }
                continue
            }
            kept.append(proj)
        }
        state.projectiles = kept
    }

    // MARK: - ボス本体との接触ダメージ

    // NOTE: 旧 `checkBossContactDamage` はボス本体との接触ダメージ仕様変更に伴い削除。
    // WEB 版 `SurvivalBossEngine.ts` と同様にボス体への接触では直接ダメージを与えない。

    // MARK: - プレイヤーへのダメージ適用

    private static func applyPlayerDamage(
        _ player: inout SurvivalPlayerState,
        damage: Int,
        now: TimeInterval,
        iFrame: TimeInterval,
        result: inout BossTickResult
    ) {
        guard now >= player.iFramesUntil else { return }
        player.hp = max(0, player.hp - damage)
        player.iFramesUntil = now + iFrame
        result.playerDamage += damage
    }

    private static func applyKnockbackAway(player: inout SurvivalPlayerState, from origin: CGPoint, now: TimeInterval) {
        let dx = player.x - origin.x
        let dy = player.y - origin.y
        let d = hypot(dx, dy)
        if d < 1 { return }
        let nx = dx / d
        let ny = dy / d
        player.knockbackVx = nx * hazardKnockbackSpeed
        player.knockbackVy = ny * hazardKnockbackSpeed
        // `updatePlayerPosition` は CACurrentMediaTime ベースの `now` で判定するため、
        // ここでも同じ時間軸(=引数の `now`)を使う。Date().timeIntervalSince1970 は
        // 時間軸が大きく異なり無限ノックバックの原因となるため使用禁止。
        player.knockbackUntil = now + SurvivalConstants.knockbackDuration
    }

    // MARK: - プレイヤー弾 vs ボス / ミニオン

    /// プレイヤー攻撃のボス戦ヒット結果。
    /// - `bossHitDamage`: ボス本体に当たった合計ダメージ (フローティングテキスト表示用)
    /// - `bossHitPoint`: ボスにヒットした位置 (表示座標)
    /// - `minionHits`: ミニオンごとの (id, dmg, hitPoint)
    struct PlayerAttackResolution {
        var bossHitDamage: Int = 0
        var bossHitPoint: CGPoint? = nil
        var minionHits: [(id: UUID, damage: Int, point: CGPoint)] = []
    }

    /// プレイヤー弾・衝撃波によるボスダメージ適用。呼び出し側で Controller から呼ぶ。
    /// - Parameter alreadyHitIds: 既に当該攻撃 (弾丸 or 衝撃波) がヒット済みのエンティティ ID 集合。
    ///   含まれているボス / ミニオンには今回はダメージを適用しない (Web 版 `applyPlayerProjectileToBoss` 準拠)。
    @discardableResult
    static func applyPlayerAttack(
        state: inout SurvivalBossBattleState,
        damage: Int,
        atPoint point: CGPoint,
        radius: CGFloat,
        alreadyHitIds: Set<UUID> = []
    ) -> PlayerAttackResolution {
        var result = PlayerAttackResolution()
        if !alreadyHitIds.contains(state.boss.id),
           hypot(point.x - state.boss.x, point.y - state.boss.y) <= (radius + SurvivalConstants.bossHitboxRadius) {
            state.boss.hp = max(0, state.boss.hp - damage)
            result.bossHitDamage = damage
            result.bossHitPoint = CGPoint(x: state.boss.x, y: state.boss.y)
        }
        for idx in state.minions.indices {
            var minion = state.minions[idx]
            if alreadyHitIds.contains(minion.id) {
                state.minions[idx] = minion
                continue
            }
            if hypot(point.x - minion.x, point.y - minion.y) <= (radius + SurvivalConstants.bossMinionRadius) {
                minion.hp -= damage
                result.minionHits.append((id: minion.id, damage: damage, point: CGPoint(x: minion.x, y: minion.y)))
            }
            state.minions[idx] = minion
        }
        state.minions.removeAll { $0.hp <= 0 && !$0.isExploding }
        return result
    }

    // MARK: - Geometry helpers

    private static func clampX(_ v: CGFloat) -> CGFloat { max(0, min(SurvivalMap.width, v)) }
    private static func clampY(_ v: CGFloat) -> CGFloat { max(0, min(SurvivalMap.height, v)) }

    private static func isInsideFan(_ tx: CGFloat, _ ty: CGFloat, _ cx: CGFloat, _ cy: CGFloat, centerAngle: CGFloat, spread: CGFloat, radius: CGFloat) -> Bool {
        let dx = tx - cx
        let dy = ty - cy
        let dist = hypot(dx, dy)
        if dist > radius { return false }
        let theta = atan2(dy, dx)
        var diff = theta - centerAngle
        while diff > .pi { diff -= 2 * .pi }
        while diff < -.pi { diff += 2 * .pi }
        return abs(diff) <= spread / 2
    }

    private static func isInsideLine(_ tx: CGFloat, _ ty: CGFloat, originX: CGFloat, originY: CGFloat, angle: CGFloat, length: CGFloat, thickness: CGFloat) -> Bool {
        let dx = tx - originX
        let dy = ty - originY
        let cos_a = cos(-angle)
        let sin_a = sin(-angle)
        let localX = dx * cos_a - dy * sin_a
        let localY = dx * sin_a + dy * cos_a
        return localX >= 0 && localX <= length && abs(localY) <= thickness
    }

    private static func isInsideCross(_ tx: CGFloat, _ ty: CGFloat, cx: CGFloat, cy: CGFloat, length: CGFloat, thickness: CGFloat) -> Bool {
        let dx = abs(tx - cx)
        let dy = abs(ty - cy)
        let halfLen = length / 2
        if dx <= halfLen && dy <= thickness { return true }
        if dy <= halfLen && dx <= thickness { return true }
        return false
    }
}
