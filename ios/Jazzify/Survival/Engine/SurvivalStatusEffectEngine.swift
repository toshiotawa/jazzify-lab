import Foundation
import CoreGraphics

/// 状態異常/バフ/デバフの期限管理とスタッツ補正を担当。
/// WEB 版 `applyStatusEffect` / `getEffectiveStats` 相当。
enum SurvivalStatusEffectEngine {
    /// 期限切れエフェクトを除去した配列を返す
    static func prune(effects: [SurvivalStatusEffect], now: TimeInterval) -> [SurvivalStatusEffect] {
        effects.filter { $0.expireAt > now }
    }

    /// 同種エフェクトは「先に掛かっていた分 + 新規分」ではなく、
    /// 期限のより遅い方で上書き、レベルは最大値を保持。
    static func merge(existing: [SurvivalStatusEffect], with new: [SurvivalStatusEffect]) -> [SurvivalStatusEffect] {
        var map: [SurvivalStatusEffectKind: SurvivalStatusEffect] = [:]
        for e in existing { map[e.kind] = e }
        for n in new {
            if var current = map[n.kind] {
                current.expireAt = max(current.expireAt, n.expireAt)
                current.level = max(current.level, n.level)
                map[n.kind] = current
            } else {
                map[n.kind] = n
            }
        }
        return Array(map.values)
    }

    /// 現在のプレイヤースタッツに状態効果を反映した「実効値」を返す
    static func effectiveStats(
        base: SurvivalPlayerStats,
        effects: [SurvivalStatusEffect]
    ) -> SurvivalPlayerStats {
        var stats = base
        for effect in effects {
            switch effect.kind {
            case .aAtkUp:
                stats.aAtk += 10 * effect.level
            case .bAtkUp:
                stats.bAtk += 10 * effect.level
            case .cAtkUp:
                stats.cAtk += 10 * effect.level
            case .defUp:
                stats.def += 8 * effect.level
            case .buffer:
                stats.aAtk += 5 * effect.level
                stats.bAtk += 5 * effect.level
                stats.cAtk += 5 * effect.level
            case .debuffer:
                stats.aAtk = max(1, stats.aAtk - 5 * effect.level)
                stats.bAtk = max(1, stats.bAtk - 5 * effect.level)
                stats.cAtk = max(1, stats.cAtk - 5 * effect.level)
            case .fire, .ice, .hint, .speedUp, .haisui, .zekkouchou:
                break
            }
        }
        return stats
    }

    /// 速度倍率 (speed_up → 1.5x / ice → 0.5x など)
    static func effectiveSpeedMultiplier(effects: [SurvivalStatusEffect]) -> CGFloat {
        var multiplier: CGFloat = 1.0
        for e in effects {
            switch e.kind {
            case .speedUp: multiplier *= (1.0 + 0.3 * CGFloat(e.level))
            case .ice: multiplier *= 0.5
            default: break
            }
        }
        return multiplier
    }

    /// 特定の効果が有効か
    static func contains(_ effects: [SurvivalStatusEffect], kind: SurvivalStatusEffectKind) -> Bool {
        effects.contains { $0.kind == kind }
    }

    /// `fire` 状態異常による DOT (毎秒のダメージ) を計算する
    static func fireDotPerSecond(effects: [SurvivalStatusEffect], maxHp: Int) -> Int {
        guard let fire = effects.first(where: { $0.kind == .fire }) else { return 0 }
        // maxHp の 2% / sec × level
        return max(1, Int(Double(maxHp) * 0.02 * Double(fire.level)))
    }
}
