import Foundation
import CoreGraphics
import QuartzCore

/// 魔法発動ロジック。
/// - `castMagic(kind:)` で魔法を発動し、敵への即時ダメージ / 状態異常付与 / プレイヤー回復などを返す
/// - ファイ (ステージモード) は `noMagic=true` の想定なので基本的に Controller 側から呼ばれない
///   が、C/D 列コードスロットが有効化されたケースや今後の拡張のために用意する
enum SurvivalMagicEngine {
    struct MagicOutcome {
        var enemyDamage: [(UUID, Int)] = []
        var enemyStatusEffects: [(UUID, SurvivalStatusEffect)] = []
        var playerHealAmount: Int = 0
        var playerStatusEffects: [SurvivalStatusEffect] = []
        var visualEffect: SurvivalMagicEffect?
    }

    /// 魔法を発動する (C 列 → thunder/fire/ice/heal、D 列 → buffer/hint が典型)
    static func castMagic(
        kind: SurvivalMagicKind,
        player: SurvivalPlayerState,
        enemies: [SurvivalEnemy],
        cAtk: Int,
        now: TimeInterval
    ) -> MagicOutcome {
        var outcome = MagicOutcome()
        let damage = 40 + cAtk * 3
        let origin = CGPoint(x: player.x, y: player.y)

        switch kind {
        case .thunder:
            // 3 体までランダムに雷撃
            let targets = enemies.shuffled().prefix(3)
            for enemy in targets {
                outcome.enemyDamage.append((enemy.id, damage))
            }
            outcome.visualEffect = SurvivalMagicEffect(
                kind: .thunder,
                x: player.x, y: player.y,
                createdAt: now, lifetime: 0.5
            )
        case .fire:
            // 半径 240 内の敵に damage + fire DOT
            let radius: CGFloat = 240
            let sq = radius * radius
            for enemy in enemies {
                let dx = enemy.x - origin.x
                let dy = enemy.y - origin.y
                if dx * dx + dy * dy <= sq {
                    outcome.enemyDamage.append((enemy.id, damage))
                    outcome.enemyStatusEffects.append(
                        (enemy.id, SurvivalStatusEffect(
                            kind: .fire, level: 1,
                            expireAt: now + 5, appliedAt: now
                        ))
                    )
                }
            }
            outcome.visualEffect = SurvivalMagicEffect(
                kind: .fire,
                x: player.x, y: player.y,
                createdAt: now, lifetime: 0.6
            )
        case .ice:
            // 半径 280 内の敵を ice で減速
            let radius: CGFloat = 280
            let sq = radius * radius
            for enemy in enemies {
                let dx = enemy.x - origin.x
                let dy = enemy.y - origin.y
                if dx * dx + dy * dy <= sq {
                    outcome.enemyDamage.append((enemy.id, damage / 2))
                    outcome.enemyStatusEffects.append(
                        (enemy.id, SurvivalStatusEffect(
                            kind: .ice, level: 1,
                            expireAt: now + 4, appliedAt: now
                        ))
                    )
                }
            }
            outcome.visualEffect = SurvivalMagicEffect(
                kind: .ice,
                x: player.x, y: player.y,
                createdAt: now, lifetime: 0.6
            )
        case .heal:
            let heal = max(20, Int(Double(player.maxHp) * 0.30))
            outcome.playerHealAmount = heal
            outcome.visualEffect = SurvivalMagicEffect(
                kind: .heal,
                x: player.x, y: player.y,
                createdAt: now, lifetime: 0.5
            )
        case .buffer:
            outcome.playerStatusEffects.append(
                SurvivalStatusEffect(
                    kind: .buffer, level: 1,
                    expireAt: now + 15, appliedAt: now
                )
            )
            outcome.visualEffect = SurvivalMagicEffect(
                kind: .buffer,
                x: player.x, y: player.y,
                createdAt: now, lifetime: 0.5
            )
        case .hint:
            outcome.playerStatusEffects.append(
                SurvivalStatusEffect(
                    kind: .hint, level: 1,
                    expireAt: now + 20, appliedAt: now
                )
            )
            outcome.visualEffect = SurvivalMagicEffect(
                kind: .hint,
                x: player.x, y: player.y,
                createdAt: now, lifetime: 0.4
            )
        }
        return outcome
    }
}
