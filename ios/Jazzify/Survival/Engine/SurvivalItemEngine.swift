import Foundation
import CoreGraphics
import QuartzCore

/// アイテムのドロップ / 拾得 / 期限管理を担当する純ロジック。
/// WEB 版 `updateSurvivalItems` / `applyDroppedItemEffect` 相当。
enum SurvivalItemEngine {
    /// ドロップ有効期間 (秒)
    private static let itemLifetimeSec: TimeInterval = 12

    /// ハート取得時の回復量 (WEB 版 `HEALING_AMOUNT` = 40 と同値)。
    /// プレイヤー最大 HP 1000 を基準に約 4% 回復。
    static let heartHealAmount: Int = 40

    /// ボスミニオンを倒した際にハート (❤️) を確定ドロップする用のヘルパー。
    /// - Note: 通常敵のドロップは廃止しており、プレイヤーが拾えるアイテムは
    ///   このミニオン ハートのみ (固定 `heartHealAmount` HP 回復)。
    static func makeHeartDrop(at pos: CGPoint, now: TimeInterval) -> SurvivalDroppedItem {
        SurvivalDroppedItem(
            kind: .heart,
            x: pos.x,
            y: pos.y,
            expireAt: now + itemLifetimeSec
        )
    }

    /// プレイヤーとの距離を判定してピックアップ処理を行う。
    /// - Parameter autoCollectExp: `true` ならコインは距離に関係なく収集 (ファイの特典)
    /// - Returns: 収集済み `itemIds / coinIds` と獲得 exp と status effect 適用リスト
    struct PickupResult {
        var pickedItemIds: Set<UUID> = []
        var pickedCoinIds: Set<UUID> = []
        var gainedExp: Int = 0
        var healAmount: Int = 0
        var newStatusEffects: [SurvivalStatusEffect] = []
    }

    static func applyPickups(
        player: SurvivalPlayerState,
        items: [SurvivalDroppedItem],
        coins: [SurvivalCoin],
        autoCollectExp: Bool,
        now: TimeInterval
    ) -> PickupResult {
        var result = PickupResult()
        let pickupRadius: CGFloat = SurvivalConstants.playerSize / 2 + SurvivalConstants.itemSize / 2
        let sq = pickupRadius * pickupRadius

        for item in items {
            let dx = item.x - player.x
            let dy = item.y - player.y
            if dx * dx + dy * dy <= sq {
                result.pickedItemIds.insert(item.id)
                Self.applyItemEffect(item: item, player: player, now: now, out: &result)
            }
        }

        for coin in coins {
            if autoCollectExp {
                result.pickedCoinIds.insert(coin.id)
                result.gainedExp += coin.exp
            } else {
                let dx = coin.x - player.x
                let dy = coin.y - player.y
                let coinRadius: CGFloat = SurvivalConstants.playerSize / 2 + SurvivalConstants.coinSize / 2
                if dx * dx + dy * dy <= coinRadius * coinRadius {
                    result.pickedCoinIds.insert(coin.id)
                    result.gainedExp += coin.exp
                }
            }
        }
        return result
    }

    private static func applyItemEffect(
        item: SurvivalDroppedItem,
        player: SurvivalPlayerState,
        now: TimeInterval,
        out: inout PickupResult
    ) {
        switch item.kind {
        case .heart:
            out.healAmount += Self.heartHealAmount
        case .angelShoes:
            out.newStatusEffects.append(
                SurvivalStatusEffect(
                    kind: .speedUp,
                    level: 1,
                    expireAt: now + 20,
                    appliedAt: now
                )
            )
        case .vest:
            out.newStatusEffects.append(
                SurvivalStatusEffect(
                    kind: .defUp,
                    level: 1,
                    expireAt: now + 20,
                    appliedAt: now
                )
            )
        case .aAtkBoost:
            out.newStatusEffects.append(
                SurvivalStatusEffect(
                    kind: .aAtkUp,
                    level: 1,
                    expireAt: now + 15,
                    appliedAt: now
                )
            )
        case .bAtkBoost:
            out.newStatusEffects.append(
                SurvivalStatusEffect(
                    kind: .bAtkUp,
                    level: 1,
                    expireAt: now + 15,
                    appliedAt: now
                )
            )
        case .cAtkBoost:
            out.newStatusEffects.append(
                SurvivalStatusEffect(
                    kind: .cAtkUp,
                    level: 1,
                    expireAt: now + 15,
                    appliedAt: now
                )
            )
        }
    }

    /// 期限切れアイテム / コインを除去して残った配列を返す
    static func pruneExpired(
        items: [SurvivalDroppedItem],
        coins: [SurvivalCoin],
        now: TimeInterval
    ) -> (items: [SurvivalDroppedItem], coins: [SurvivalCoin]) {
        let filteredItems = items.filter { $0.expireAt > now }
        let filteredCoins = coins.filter { $0.expireAt > now }
        return (filteredItems, filteredCoins)
    }
}
