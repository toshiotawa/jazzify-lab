import Foundation
import CoreGraphics

// MARK: - Map / Constants

/// Web 版 `MAP_CONFIG` と同じ広さ (3200 x 2400)。SpriteKit 側では y を反転して表示する。
enum SurvivalMap {
    static let width: CGFloat = 3200
    static let height: CGFloat = 2400
}

enum SurvivalConstants {
    static let playerSize: CGFloat = 36
    static let enemySize: CGFloat = 40
    static let projectileSize: CGFloat = 14
    /// プレイヤーのベース移動速度 (px/sec)
    static let playerSpeed: CGFloat = 260
    /// 敵のベース移動速度 (Web 版 `BASE_ENEMY_SPEED`)
    static let baseEnemySpeed: CGFloat = 55
    /// 敵の最高速度 (Web 版 `MAX_ENEMY_SPEED`)
    static let maxEnemySpeed: CGFloat = 250
    /// A 弾速度 (px/sec)
    static let projectileSpeed: CGFloat = 500
    /// A 弾最大射程 (px)
    static let projectileMaxRange: CGFloat = 900
    /// ステージ制限時間 (秒)
    static let stageTimeLimitSec: TimeInterval = 90
    /// ステージクリアに必要な撃破数 (WEB 版 `STAGE_KILL_QUOTA` = 150)
    static let stageEnemyQuota: Int = 150
    /// 第一ブロック通常ステージの撃破数 (WEB 版 `STAGE_FIRST_BLOCK_KILL_QUOTA` = 10)
    static let stageFirstBlockEnemyQuota: Int = 10
    /// 第一ブロックボス戦 HP (WEB 版 `STAGE_FIRST_BLOCK_BOSS_MAX_HP` = 7000)
    static let firstBlockBossMaxHp: Int = 7000
    /// コードスロット切替タイマー (秒)
    static let slotTimeoutSec: TimeInterval = 10
    /// 近接衝撃波のベース半径 (B 攻撃、Web 版 baseRange = 80 と一致)
    static let meleeShockwaveBaseRadius: CGFloat = 80
    /// B 攻撃の前方オフセット (Web 版準拠: プレイヤー位置 + 向きベクトル * 40)
    static let meleeAttackForwardOffset: CGFloat = 40
    /// B 攻撃の衝撃波寿命 (秒) (Web 版 SHOCKWAVE_DURATION = 350ms と一致)
    static let meleeShockwaveLifetime: TimeInterval = 0.35
    /// B 攻撃の多段ヒット間隔 (Web 版と同じ 200ms)
    static let meleeMultiHitIntervalSec: TimeInterval = 0.20
    /// B 攻撃のベース ノックバック量 (Web 版: `150 + bKnockbackBonus * 50` の定数項)
    static let meleeKnockbackBase: CGFloat = 150
    /// B 攻撃の ノックバック ボーナス 1 レベルあたりの加算量
    static let meleeKnockbackPerLevel: CGFloat = 50
    /// ボスステージのプレイヤー HP
    static let bossPlayerMaxHp: Int = 1000
    /// Phrases ボス戦のプレイヤー HP
    static let phrasesBossPlayerMaxHp: Int = 5000
    /// 通常ステージ（非 Phrases・非ボス）のプレイヤー初期 HP
    static let stagePlayerMaxHp: Int = 800
    /// ボス HP 上限
    static let bossMaxHp: Int = 15000
    /// Phrases ボス戦 HP 倍率
    static let phrasesBossHpMultiplier: Int = 5
    /// ボス判定円半径
    static let bossHitboxRadius: CGFloat = 72
    /// ボスミニオン半径
    static let bossMinionRadius: CGFloat = 28
    /// 接触 i-frame (秒)
    static let iFrameContact: TimeInterval = 0.6
    /// ハザード i-frame (秒)
    static let iFrameHazard: TimeInterval = 0.8
    /// ノックバック持続
    static let knockbackDuration: TimeInterval = 0.25
    /// ノックバック速度
    static let knockbackSpeed: CGFloat = 420
    /// アイテムサイズ
    static let itemSize: CGFloat = 28
    /// コインサイズ
    static let coinSize: CGFloat = 22
    /// 敵弾サイズ
    static let enemyProjectileSize: CGFloat = 14
    /// 被弾フラッシュ持続秒
    static let playerDamageFlashSec: TimeInterval = 0.18
    /// A/B 正解ごとに 1 本溜まるコンボゲージの最大（次の正解で必殺技発動）
    static let comboGaugeMax: Int = 5
    /// 正解が無いときコンボ／ゲージをリセットするまでの秒数
    static let comboResetIntervalSec: TimeInterval = 5
    /// 必殺技の衝撃波半径倍率（通常 maxRadius に乗算）
    static let specialAttackRadiusMultiplier: CGFloat = 1.5
    /// 必殺技発動時のカメラ揺れ振幅／時間
    static let specialCameraShakeIntensity: CGFloat = 4
    static let specialCameraShakeDuration: TimeInterval = 0.22
}

// MARK: - Directions

public enum SurvivalDirection8: String, CaseIterable, Sendable {
    case up, down, left, right
    case upLeft = "up-left"
    case upRight = "up-right"
    case downLeft = "down-left"
    case downRight = "down-right"

    var vector: CGVector {
        switch self {
        case .up: return CGVector(dx: 0, dy: -1)
        case .down: return CGVector(dx: 0, dy: 1)
        case .left: return CGVector(dx: -1, dy: 0)
        case .right: return CGVector(dx: 1, dy: 0)
        case .upLeft: return CGVector(dx: -0.707, dy: -0.707)
        case .upRight: return CGVector(dx: 0.707, dy: -0.707)
        case .downLeft: return CGVector(dx: -0.707, dy: 0.707)
        case .downRight: return CGVector(dx: 0.707, dy: 0.707)
        }
    }

    /// Web 版 `getDirectionAngle` (Y 軸は 0,0=左上の画面座標系基準)
    var angle: CGFloat {
        switch self {
        case .up: return -.pi / 2
        case .down: return .pi / 2
        case .left: return .pi
        case .right: return 0
        case .upLeft: return -.pi * 3 / 4
        case .upRight: return -.pi / 4
        case .downLeft: return .pi * 3 / 4
        case .downRight: return .pi / 4
        }
    }

    static func fromVector(dx: CGFloat, dy: CGFloat) -> SurvivalDirection8? {
        fromVector(dx: dx, dy: dy, previous: nil)
    }

    /// 8 方向を決定。`previous` があるとき `|dx|` が中間帯なら前フレームの向きを維持しジッターを抑える。
    static func fromVector(dx: CGFloat, dy: CGFloat, previous: SurvivalDirection8?) -> SurvivalDirection8? {
        if abs(dx) < 0.001 && abs(dy) < 0.001 { return nil }
        let absDx = abs(dx)
        if let prev = previous, absDx >= 0.45 && absDx <= 0.55 {
            return prev
        }
        if dx > 0.5 {
            if dy < -0.5 { return .upRight }
            if dy > 0.5 { return .downRight }
            return .right
        }
        if dx < -0.5 {
            if dy < -0.5 { return .upLeft }
            if dy > 0.5 { return .downLeft }
            return .left
        }
        return dy < 0 ? .up : .down
    }
}

// MARK: - Player

/// WEB 版 `PlayerStats` 相当 (スキル外の攻撃/速度/防御など基礎ステータス)
public struct SurvivalPlayerStats: Sendable, Equatable {
    public var aAtk: Int
    public var bAtk: Int
    public var cAtk: Int
    public var reloadMagic: Int
    public var time: Int
    public var luck: Int
    public var def: Int

    public static let defaultStage: SurvivalPlayerStats = SurvivalPlayerStats(
        aAtk: 51, bAtk: 49, cAtk: 20, reloadMagic: 5, time: 10, luck: 5, def: 10
    )

    static func fromJson(_ json: [String: JsonValue]) -> SurvivalPlayerStats {
        func intVal(_ key: String, default defaultValue: Int) -> Int {
            json[key]?.asInt ?? defaultValue
        }
        return SurvivalPlayerStats(
            aAtk: intVal("aAtk", default: 51),
            bAtk: intVal("bAtk", default: 49),
            cAtk: intVal("cAtk", default: 20),
            reloadMagic: intVal("reloadMagic", default: 5),
            time: intVal("time", default: 10),
            luck: intVal("luck", default: 5),
            def: intVal("def", default: 10)
        )
    }
}

public struct SurvivalPlayerSkills: Sendable, Equatable {
    public var aBulletCount: Int
    public var aPenetration: Bool
    public var bDeflect: Bool
    public var multiHitLevel: Int
    public var bKnockbackBonusLevel: Int
    public var bRangeBonusLevel: Int
    public var haisuiNoJin: Bool
    public var zekkouchou: Bool
    public var alwaysHaisuiNoJin: Bool
    public var alwaysZekkouchou: Bool

    /// WEB 版 `SurvivalGameEngine.ts` の `createStageInitialPlayerState().skills` と同じステージ用初期値。
    /// ボス戦を含むステージモードはこの値からスタートする (ファイのキャラ定義で上書き可能)。
    /// - `multiHitLevel = 2`: 1 回の Punch で初撃 + 200ms 間隔で 2 発の追加衝撃波 = 計 3 ヒット。
    ///   以前はボス戦のデデュープバグで実質 20 ヒット超えていたため暫定的に 0 に下げていたが、
    ///   `SurvivalGameLoop.tickBoss` の `hitEnemyIds` デデュープ修正完了に伴い Web 版同値へ復帰。
    public static let defaultStage: SurvivalPlayerSkills = SurvivalPlayerSkills(
        aBulletCount: 5,
        aPenetration: true,
        bDeflect: true,
        multiHitLevel: 2,
        bKnockbackBonusLevel: 5,
        bRangeBonusLevel: 5,
        haisuiNoJin: true,
        zekkouchou: false,
        alwaysHaisuiNoJin: false,
        alwaysZekkouchou: false
    )

    static func fromJson(_ json: [String: JsonValue]) -> SurvivalPlayerSkills {
        func intVal(_ key: String, default defaultValue: Int) -> Int {
            json[key]?.asInt ?? defaultValue
        }
        func boolVal(_ key: String, default defaultValue: Bool) -> Bool {
            json[key]?.asBool ?? defaultValue
        }
        let base = SurvivalPlayerSkills.defaultStage
        return SurvivalPlayerSkills(
            aBulletCount: intVal("aBulletCount", default: base.aBulletCount),
            aPenetration: boolVal("aPenetration", default: base.aPenetration),
            bDeflect: boolVal("bDeflect", default: base.bDeflect),
            multiHitLevel: intVal("multiHitLevel", default: base.multiHitLevel),
            bKnockbackBonusLevel: intVal("bKnockbackBonus", default: base.bKnockbackBonusLevel),
            bRangeBonusLevel: intVal("bRangeBonus", default: base.bRangeBonusLevel),
            haisuiNoJin: boolVal("haisuiNoJin", default: base.haisuiNoJin),
            zekkouchou: boolVal("zekkouchou", default: base.zekkouchou),
            alwaysHaisuiNoJin: boolVal("alwaysHaisuiNoJin", default: base.alwaysHaisuiNoJin),
            alwaysZekkouchou: boolVal("alwaysZekkouchou", default: base.alwaysZekkouchou)
        )
    }
}

struct SurvivalPlayerState: Sendable {
    public var x: CGFloat
    public var y: CGFloat
    public var direction: SurvivalDirection8 = .down
    public var hp: Int
    public var maxHp: Int
    public var stats: SurvivalPlayerStats
    public var skills: SurvivalPlayerSkills
    /// 無敵が切れる時刻 (CACurrentMediaTime)
    public var iFramesUntil: TimeInterval = 0
    /// ボス戦用ノックバック
    public var knockbackVx: CGFloat = 0
    public var knockbackVy: CGFloat = 0
    public var knockbackUntil: TimeInterval = 0
    public var hintMode: Bool = false
    /// 被弾フラッシュが切れる時刻 (描画側で利用)
    public var damageFlashUntil: TimeInterval = 0
}

// MARK: - Enemies (10 種 : WEB 版準拠)

public enum SurvivalEnemyType: String, Sendable, CaseIterable {
    case slime, goblin, skeleton, zombie, bat, ghost, orc, demon, dragon, boss

    /// 描画用絵文字 (WEB 版 `SurvivalCanvas.tsx` と同じフォールバック絵文字)
    public var emoji: String {
        switch self {
        case .slime: return "🫠"
        case .goblin: return "👺"
        case .skeleton: return "💀"
        case .zombie: return "🧟"
        case .bat: return "🦇"
        case .ghost: return "👻"
        case .orc: return "👹"
        case .demon: return "😈"
        case .dragon: return "🐲"
        case .boss: return "👑"
        }
    }
}

public struct SurvivalEnemyStats: Sendable {
    public var atk: Int
    public var def: Int
    public var hp: Int
    public var maxHp: Int
    /// WEB 版同様 speedFactor (baseEnemySpeed に乗算)
    public var speed: CGFloat
    /// 獲得経験値 / 撃破報酬
    public var exp: Int
}

public struct SurvivalEnemy: Identifiable, Sendable {
    public let id: UUID = UUID()
    public var type: SurvivalEnemyType
    public var x: CGFloat
    public var y: CGFloat
    public var stats: SurvivalEnemyStats
    /// オンボーディング用: AI 移動を行わない（ノックバック減衰のみ）。
    public var isScenarioStationary: Bool = false
    public var knockbackVx: CGFloat = 0
    public var knockbackVy: CGFloat = 0
    public var lastContactTime: TimeInterval = 0
    /// 最後に弾を撃った時刻 (射撃する敵のみ)
    public var lastShotAt: TimeInterval = 0
}

// MARK: - Projectiles / Effects

public struct SurvivalProjectile: Identifiable, Sendable {
    public let id: UUID = UUID()
    public var x: CGFloat
    public var y: CGFloat
    /// ラジアン
    public var angle: CGFloat
    public var damage: Int
    public var remainingRange: CGFloat
    public var penetrating: Bool
    public var hitEnemyIds: Set<UUID> = []
    /// ボス戦 A 列: 同一発射で複数弾が当たっても 1 ヒットにする
    public var attackInstanceId: UUID?
}

/// 敵からの弾 (WEB 版 `EnemyProjectile`)
public struct SurvivalEnemyProjectile: Identifiable, Sendable {
    public let id: UUID = UUID()
    public var x: CGFloat
    public var y: CGFloat
    public var vx: CGFloat
    public var vy: CGFloat
    public var damage: Int
    public var expireAt: TimeInterval
}

public struct SurvivalShockwave: Identifiable, Sendable {
    public let id: UUID = UUID()
    public var x: CGFloat
    public var y: CGFloat
    public var radius: CGFloat
    public var maxRadius: CGFloat
    /// Web 版 `baseRange` (= 80)。距離計算・拡大演出用。ヒット可否は正面 180° (`dot > 0`) で決まる。
    public var baseRadius: CGFloat
    /// 衝撃波を発射した時点でのプレイヤー向き (正面半平面判定用)
    public var direction: SurvivalDirection8
    public var createdAt: TimeInterval
    public var lifetime: TimeInterval
    public var damage: Int
    public var hitEnemyIds: Set<UUID> = []
    /// 色バリエーション (多段ヒット時に変化)
    public var colorLevel: Int = 0
    /// コンボ必殺技の衝撃波（360°・単発・見た目・敵弾消去を特別扱い）
    public var isSpecial: Bool = false
}

/// 多段ヒット用に遅延発火される衝撃波のプラン。
/// 発射時点でのプレイヤー座標/向き/ダメージを保持し、
/// 指定時刻 (`fireAt`) に実際の衝撃波として生成される。
public struct SurvivalPendingShockwave: Sendable {
    public var fireAt: TimeInterval
    public var damage: Int
    public var colorLevel: Int
}

public struct SurvivalFloatingText: Identifiable, Sendable {
    public let id: UUID = UUID()
    public var text: String
    public var x: CGFloat
    public var y: CGFloat
    public var createdAt: TimeInterval
    public var lifetime: TimeInterval = 0.8
    public var color: SurvivalFloatingTextColor
}

public enum SurvivalFloatingTextColor: Sendable {
    case damage
    case heal
    case warn
    case exp
    /// スロット発動時の完成コード名表示用 (プレイヤー頭上)
    case chord
}

// MARK: - Items / Coins (WEB 版 `SurvivalTypes.ts` の DroppedItem)

public enum SurvivalDroppedItemKind: String, Sendable, CaseIterable {
    case heart          // ❤️ HP 回復
    case angelShoes     // 👟 スピードアップ
    case vest           // 🦺 DEF アップ
    case aAtkBoost      // 🔫 A 列火力強化
    case bAtkBoost      // 👊 B 列火力強化
    case cAtkBoost      // 🪄 C 列火力強化

    public var emoji: String {
        switch self {
        case .heart: return "❤️"
        case .angelShoes: return "👟"
        case .vest: return "🦺"
        case .aAtkBoost: return "🔫"
        case .bAtkBoost: return "👊"
        case .cAtkBoost: return "🪄"
        }
    }
}

public struct SurvivalDroppedItem: Identifiable, Sendable {
    public let id: UUID = UUID()
    public var kind: SurvivalDroppedItemKind
    public var x: CGFloat
    public var y: CGFloat
    public var expireAt: TimeInterval
}

public struct SurvivalCoin: Identifiable, Sendable {
    public let id: UUID = UUID()
    public var x: CGFloat
    public var y: CGFloat
    public var exp: Int
    public var expireAt: TimeInterval
}

// MARK: - Status Effects (WEB 版 `StatusEffect`)

public enum SurvivalStatusEffectKind: String, Sendable, Hashable {
    case fire
    case ice
    case buffer
    case debuffer
    case aAtkUp = "a_atk_up"
    case bAtkUp = "b_atk_up"
    case cAtkUp = "c_atk_up"
    case hint
    case speedUp = "speed_up"
    case defUp = "def_up"
    case haisui
    case zekkouchou

    public var systemIcon: String {
        switch self {
        case .fire: return "flame.fill"
        case .ice: return "snowflake"
        case .buffer: return "arrow.up.circle.fill"
        case .debuffer: return "arrow.down.circle.fill"
        case .aAtkUp: return "a.circle.fill"
        case .bAtkUp: return "b.circle.fill"
        case .cAtkUp: return "c.circle.fill"
        case .hint: return "lightbulb.fill"
        case .speedUp: return "hare.fill"
        case .defUp: return "shield.fill"
        case .haisui: return "heart.slash.fill"
        case .zekkouchou: return "sparkles"
        }
    }
}

public struct SurvivalStatusEffect: Identifiable, Sendable {
    public let id: UUID = UUID()
    public var kind: SurvivalStatusEffectKind
    public var level: Int
    public var expireAt: TimeInterval
    public var appliedAt: TimeInterval
}

// MARK: - Magic

public enum SurvivalMagicKind: String, Sendable, CaseIterable {
    case thunder
    case ice
    case fire
    case heal
    case buffer
    case hint
}

public struct SurvivalMagicEffect: Identifiable, Sendable {
    public let id: UUID = UUID()
    public var kind: SurvivalMagicKind
    public var x: CGFloat
    public var y: CGFloat
    public var createdAt: TimeInterval
    public var lifetime: TimeInterval
}

// MARK: - Code Slot

public enum SurvivalSlotIndex: Int, CaseIterable, Sendable {
    case A = 0, B = 1, C = 2, D = 3
    public var label: String {
        switch self {
        case .A: return "A"
        case .B: return "B"
        case .C: return "C"
        case .D: return "D"
        }
    }
}

struct SurvivalCodeSlot: Sendable {
    public let label: String
    public var chord: SurvivalResolvedChord?
    /// WEB 版 `nextSlots` 相当。スロット完成時 / タイマー切れ時に `chord` が `nextChord` に置換され、
    /// 新しい `nextChord` が抽選される。
    public var nextChord: SurvivalResolvedChord?
    public var timer: TimeInterval
    public var isEnabled: Bool
    /// 入力中のピッチクラス (重複除去済み)
    public var inputPitchClasses: [Int] = []
    /// 正解発動カウンタ。`triggerSlot` 呼び出しごとに +1 され、View が増加を検知して
    /// 正解時のハイライト (枠ライトアップ) アニメーションをキックする。
    public var triggerPulse: Int = 0

    /// 現在コード構成音のうち、入力済みに含まれる数 (重複除去済み)
    var correctCount: Int {
        guard let chord else { return 0 }
        return SurvivalChordResolver.correctNotes(
            inputPitchClasses: inputPitchClasses,
            target: chord
        ).count
    }

    /// 現在コードの構成音数 (0 のときは未設定)
    var totalNotes: Int {
        chord?.pitchClasses.count ?? 0
    }

    /// 進捗 (0.0 - 1.0)。構成音未設定時は 0
    var progressRatio: Double {
        guard totalNotes > 0 else { return 0 }
        return Double(correctCount) / Double(totalNotes)
    }
}

// MARK: - Stage mode state

public enum SurvivalStagePhase: Sendable, Equatable {
    case playing
    case cleared
    case gameOver
}

/// シナリオ／オンボーディング用ランタイムフラグ。`isActive == false` で無効（比較コスト最小化）。
public struct SurvivalScenarioRuntimeState: Sendable, Equatable {
    public var isActive: Bool = false

    public var hideHud: Bool = false
    public var hideStageTitle: Bool = false
    public var hideHintBadge: Bool = false
    public var hidePauseButton: Bool = false
    public var hideKillCounter: Bool = false
    public var hideTimerDisplay: Bool = false
    public var hideStatusStrip: Bool = false
    public var hidePlayerHpBar: Bool = false

    public var hideStaff: Bool = false
    public var hideChordSlots: Bool = false
    public var hideChordPad: Bool = false
    public var hideComboBadge: Bool = false
    public var scenarioStaffClef: Int = 2
    public var hideStaffOnBSlotCompletion: Bool = false
    public var useChordMidiNotesForHintHighlights: Bool = false

    public var disableJoystick: Bool = false

    public var disableTimeLimitClear: Bool = false
    public var disableKillQuotaClear: Bool = false
    public var disableResultScreen: Bool = false

    public var playerInvincible: Bool = false
    public var freezeAllEnemyAi: Bool = false
    public var disableEnemyAttacks: Bool = false

    public var blockChordPadInput: Bool = false
    public var blockMidiGameInput: Bool = false
    public var blockSlotEvaluation: Bool = false

    public var disableSurvivalBgm: Bool = false
    public var suppressAutoSpawn: Bool = false

    public var bChordCompletionAttackOverride: SurvivalSlotIndex? = nil
    public var bChordCompletionUseSpecial: Bool = false

    public static let inactive = SurvivalScenarioRuntimeState()

    @inline(__always)
    public var requiresScenarioTickBranch: Bool {
        isActive
    }
}

/// 通常ステージ全体の状態。ボス戦は別で管理 (SurvivalBossBattleState) するが、
/// プレイヤー座標や入力は Controller 側で共通管理する。
struct SurvivalStageRuntime: Sendable {
    public var stage: SurvivalStageDefinition
    public var hintMode: Bool
    public var player: SurvivalPlayerState
    public var enemies: [SurvivalEnemy] = []
    public var projectiles: [SurvivalProjectile] = []
    public var enemyProjectiles: [SurvivalEnemyProjectile] = []
    public var shockwaves: [SurvivalShockwave] = []
    /// 多段ヒット用 遅延発火キュー
    public var pendingShockwaves: [SurvivalPendingShockwave] = []
    public var magicEffects: [SurvivalMagicEffect] = []
    public var floatingTexts: [SurvivalFloatingText] = []
    public var droppedItems: [SurvivalDroppedItem] = []
    public var coins: [SurvivalCoin] = []
    public var statusEffects: [SurvivalStatusEffect] = []
    public var slots: [SurvivalCodeSlot]
    public var elapsedSeconds: TimeInterval = 0
    public var remainingSeconds: TimeInterval = SurvivalConstants.stageTimeLimitSec
    public var enemiesDefeated: Int = 0
    /// 互換目的で残しているが iOS ステージモードでは EXP を獲得しないため常に 0。
    /// Web 版のサバイバルが参照するフィールドと対応している。
    public var totalExp: Int = 0
    public var phase: SurvivalStagePhase = .playing
    /// 敵スポーンアキュムレータ
    public var spawnAccumulator: TimeInterval = 0
    /// プレイヤーがまだ一度も敵と出会っていない (最初のスポーンを特別にする) 用フラグ
    public var hasSpawnedAny: Bool = false
    /// A/B 正解の連続回数。`comboResetIntervalSec` 経過で 0。
    public var comboCount: Int = 0
    /// 0...`comboGaugeMax`。MAX の次の A/B 正解で必殺技。
    public var comboGauge: Int = 0
    public var comboReady: Bool = false
    public var lastComboHitAt: TimeInterval = 0
    
    /// オンボーディング等。通常プレイでは `.inactive` のまま。
    public var scenario: SurvivalScenarioRuntimeState = .inactive
}

extension SurvivalCodeSlot: Equatable {
    /// UI 差分検知用。`timer` のサブ秒変化では再描画しない（毎フレームの SwiftUI 負荷を避ける）。
    static func == (lhs: SurvivalCodeSlot, rhs: SurvivalCodeSlot) -> Bool {
        lhs.label == rhs.label &&
            lhs.chord == rhs.chord &&
            lhs.nextChord == rhs.nextChord &&
            lhs.isEnabled == rhs.isEnabled &&
            lhs.inputPitchClasses == rhs.inputPitchClasses &&
            lhs.triggerPulse == rhs.triggerPulse
    }
}

// MARK: - Boss HUD snapshot (SwiftUI / 低頻度 publish)

/// ボス戦 HUD が参照する値のみ。@Published で毎フレーム流さないために `bossBattle` 本体から縮約する。
struct SurvivalBossHUDSnapshot: Equatable, Sendable {
    let hp: Int
    let maxHp: Int
    let phase: SurvivalBossPhase
    let result: SurvivalBossResult
    /// 撃破フェード演出中か（ボス状態の defeatedAt と同期）
    let isDefeating: Bool

    var hpRatio: CGFloat {
        CGFloat(hp) / CGFloat(max(1, maxHp))
    }
}

// MARK: - SwiftUI snapshot (HUD / スロット用)

/// ステージ画面中央楽譜のフェーズ。
enum SurvivalStaffPhase: Equatable, Sendable {
    /// 全構成音・記号を表示する（練習・ヒント魔法・または本番開始から約30秒）。
    case fullHint
    /// 正しく弾いた構成音のみ（緑）を表示する。本番で経過時間が一定を超えた後。
    case pressedOnly
}

enum SurvivalStaffHintOpacity {
    /// HINT OFF 本番: 未正解音符 opacity（25秒までは1.0、26〜29秒で0.8→0.2、30秒以降0.0）。
    static func computeUnpressedNoteOpacity(
        elapsed: TimeInterval,
        hintMode: Bool,
        hintBuffActive: Bool,
        beginnerAssistActive: Bool,
        phase: SurvivalStagePhase
    ) -> CGFloat {
        if hintMode || hintBuffActive || beginnerAssistActive || phase != .playing {
            return 1
        }
        let t = Int(floor(elapsed))
        if t < 25 { return 1 }
        if t >= 30 { return 0 }
        switch t {
        case 26: return 0.8
        case 27: return 0.6
        case 28: return 0.4
        case 29: return 0.2
        default: return 1
        }
    }
}

extension SurvivalUISnapshot {
    /// 練習・ヒントバフがあるときは常に `fullHint`。本番は経過時間で切り替え。
    fileprivate static func deriveStaffPhase(from runtime: SurvivalStageRuntime) -> SurvivalStaffPhase {
        let hintMagicBuffActive = runtime.statusEffects.contains { $0.kind == .hint }
        let opacity = SurvivalStaffHintOpacity.computeUnpressedNoteOpacity(
            elapsed: runtime.elapsedSeconds,
            hintMode: runtime.hintMode,
            hintBuffActive: hintMagicBuffActive,
            beginnerAssistActive: runtime.stage.hasBeginnerStageAssist,
            phase: runtime.phase
        )
        return opacity == 0 ? .pressedOnly : .fullHint
    }

    fileprivate static func deriveUnpressedNoteOpacity(from runtime: SurvivalStageRuntime) -> CGFloat {
        let hintMagicBuffActive = runtime.statusEffects.contains { $0.kind == .hint }
        return SurvivalStaffHintOpacity.computeUnpressedNoteOpacity(
            elapsed: runtime.elapsedSeconds,
            hintMode: runtime.hintMode,
            hintBuffActive: hintMagicBuffActive,
            beginnerAssistActive: runtime.stage.hasBeginnerStageAssist,
            phase: runtime.phase
        )
    }
}

/// `SurvivalStageRuntime` 全体を `@Published` しないため、表示に必要なフィールドだけを束ねる。
/// SKScene は引き続き `runtime` を直接参照する。
struct SurvivalUISnapshot: Equatable {
    struct StatusStripItem: Equatable, Identifiable {
        let id: UUID
        let icon: String
        let level: Int
    }

    var phase: SurvivalStagePhase
    var hintMode: Bool
    var stageType: SurvivalStageType
    var hp: Int
    var maxHp: Int
    var remainingSecondsCoarse: Int
    var enemiesDefeated: Int
    var elapsedSecondsRounded: Int
    var statusEffectStrip: [StatusStripItem]
    var slots: [SurvivalCodeSlot]
    /// HINT 対象のコードスロット index（A=0, B=1）。練習(HINTモード)の鍵盤ハイライト用。nil のとき非表示。
    var hintSlotIndex: Int?
    /// ゲーム画面上部コードスロット廃止後の中央楽譜表示モード。
    var staffPhase: SurvivalStaffPhase
    /// 現在小節の未正解符頭 opacity（0〜1）。秒境界でのみ変化。
    var unpressedNoteOpacity: CGFloat
    /// A/B 正解ベースのコンボ表示用（必殺発動後も加算し続けるが 5 秒途切れで 0）
    var comboCount: Int
    /// オンボーディング等の UI 抑制フラグ（毎フレーム同一なら Equatable で弾ける）
    var scenario: SurvivalScenarioRuntimeState

    static func make(from runtime: SurvivalStageRuntime, hintSlotIndex: Int?) -> SurvivalUISnapshot {
        let remaining = max(0, runtime.remainingSeconds)
        let strip = runtime.statusEffects.map {
            StatusStripItem(id: $0.id, icon: $0.kind.systemIcon, level: $0.level)
        }
        return SurvivalUISnapshot(
            phase: runtime.phase,
            hintMode: runtime.hintMode,
            stageType: runtime.stage.stageType,
            hp: runtime.player.hp,
            maxHp: runtime.player.maxHp,
            remainingSecondsCoarse: Int(remaining.rounded()),
            enemiesDefeated: runtime.enemiesDefeated,
            elapsedSecondsRounded: Int(runtime.elapsedSeconds.rounded()),
            statusEffectStrip: strip,
            slots: runtime.slots,
            hintSlotIndex: hintSlotIndex,
            staffPhase: Self.deriveStaffPhase(from: runtime),
            unpressedNoteOpacity: Self.deriveUnpressedNoteOpacity(from: runtime),
            comboCount: runtime.comboCount,
            scenario: runtime.scenario
        )
    }
}
