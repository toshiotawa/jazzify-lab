/**
 * サバイバル ボス戦 専用型定義
 *
 * 通常の EnemyState / ゲームループとは独立させるため、ボス戦で必要になる
 * エンティティと状態を分離して保持する。
 */

import { DroppedItem } from '../SurvivalTypes';

// ===== ボスタイプ =====
/** A=圧迫+突進（断頭の獣） / B=召喚（腐敗の母核） / C=領域支配（虚輪の監視者） */
export type BossType = 'A' | 'B' | 'C';

/** HP 区分でフェーズ遷移（1=>70% / 2=70-35% / 3=<35%） */
export type BossPhase = 1 | 2 | 3;

// ===== ボス行動 =====
export type BossActionKind =
  | 'idle'
  | 'windup'
  | 'active'
  | 'recovery';

export type BossSkillId =
  | 'sweep'        // A: 前方扇形なぎ払い
  | 'charge'       // A: 直線突進
  | 'bloodPool'    // A: 血溜まり（sweep後）
  | 'spores'       // B: 胞子散布（卵）
  | 'acidShot'     // B: 3way 腐液弾
  | 'shockRing'    // C: 衝撃輪（中距離危険）
  | 'crossBlast'   // C: 十字爆破予告
  | 'heal';        // C: 自己回復 (最大HPの5%)

export interface BossActionState {
  kind: BossActionKind;
  skill: BossSkillId | null;
  startAt: number;       // performance.now 基準
  durationMs: number;
  /** 突進などの追加データ（向き・距離・予測座標など） */
  data?: Record<string, number>;
}

// ===== ボス本体 =====
export interface BossState {
  id: string;
  bossType: BossType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  facing: 'left' | 'right';
  phase: BossPhase;
  action: BossActionState;
  /** 各スキルの次回発動可能時刻（performance.now） */
  nextSkillAt: Record<BossSkillId, number>;
}

// ===== 召喚雑魚（自爆雑魚） =====
export interface BossMinion {
  id: string;
  kind: 'bomber';
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  /** 爆発開始時刻（プレイヤー接近で設定、explodeAt で爆散ハザード化） */
  fuseStartedAt: number | null;
  /** 爆発する絶対時刻 */
  explodeAt: number | null;
  spawnedAt: number;
}

// ===== ハザード（危険地帯） =====
export type BossHazardKind =
  | 'fanTelegraph'     // 扇形予兆（windup）
  | 'fanActive'        // 扇形発動
  | 'chargeTelegraph'  // 直線突進予兆
  | 'chargeActive'     // 突進中のライン（ダメージ帯）
  | 'bloodPool'        // 血溜まり（残留）
  | 'acidPool'         // 毒床（残留）
  | 'ringTelegraph'    // リング予兆
  | 'ringActive'       // リング発動（中距離危険）
  | 'crossTelegraph'   // 十字予兆
  | 'crossActive'      // 十字発動
  | 'healTelegraph'    // 自己回復 予兆
  | 'healActive'       // 自己回復 発動中
  | 'bombExplosion';   // 自爆雑魚の爆発

export interface BossHazard {
  id: string;
  kind: BossHazardKind;
  x: number;
  y: number;
  /** 扇形/リング/爆破の半径 */
  radius?: number;
  /** リング内側の安全半径（中距離のみ危険な場合に使用） */
  innerRadius?: number;
  /** 扇形の中心角（ラジアン） */
  angle?: number;
  /** 扇形の幅（ラジアン） */
  spread?: number;
  /** 直線系の長さ */
  length?: number;
  /** 直線系の太さ（両側判定の半幅） */
  thickness?: number;
  /** 絶対時刻（performance.now） */
  startAt: number;
  endAt: number;
  damage: number;
  /** 単発判定で1度だけ当てるため。ヒット済みフラグ */
  hitOnce?: boolean;
  hitDone?: boolean;
}

// ===== ボスの弾 =====
export interface BossProjectile {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  speed: number;
  damage: number;
  radius: number;
  /** 着弾時に acidPool を残すか */
  leavesAcidPool: boolean;
  spawnedAt: number;
  /** 射程切れ絶対時刻 */
  expiresAt: number;
}

// ===== ボス戦プレイヤー補助情報（通常プレイヤーHPと並行して管理） =====
export interface BossPlayerState {
  /** ボス戦専用 HP（1000 固定スタート） */
  hp: number;
  maxHp: number;
  /** 無敵解除時刻（performance.now） */
  iFramesUntil: number;
  /** ノックバック速度（px/s）、0.15s で減衰 */
  knockbackVx: number;
  knockbackVy: number;
  knockbackUntil: number;
}

// ===== ボス戦結果 =====
export type BossBattleResult = 'ongoing' | 'win' | 'lose';

// ===== ボス自身の回復イベント (C ボス heal スキル発動時に積まれ、UI 側で damageText に変換) =====
export interface BossHealEvent {
  x: number;
  y: number;
  amount: number;
}

// ===== ボス戦全体状態 =====
export interface BossBattleState {
  active: boolean;
  bossType: BossType;
  boss: BossState;
  minions: BossMinion[];
  hazards: BossHazard[];
  projectiles: BossProjectile[];
  player: BossPlayerState;
  /** 撃破されたボムが落とすポーション（gameState.items と統合） */
  pendingDrops: DroppedItem[];
  /** ボス自身の HP 回復イベント。エンジン側で積み、UI 側で drain → damageText 化する。 */
  pendingBossHealTexts: BossHealEvent[];
  result: BossBattleResult;
  /** ボスが出現した絶対時刻（ログ/統計用） */
  startedAt: number;
}

// ===== 定数 =====
export const BOSS_MAX_HP = 15000;
export const BOSS_PLAYER_MAX_HP = 1000;
export const BOSS_DISPLAY_SIZE = 140;          // スプライト描画サイズ（通常敵28pxの約5倍）
export const BOSS_HITBOX_RADIUS = 70;          // 当たり判定の半径
export const BOSS_MINION_RADIUS = 18;
export const BOSS_MINION_EXPLOSION_RADIUS = 70;

export const I_FRAME_CONTACT_MS = 600;
export const I_FRAME_PROJECTILE_MS = 300;
export const I_FRAME_HAZARD_MS = 350;

export const KNOCKBACK_DURATION_MS = 150;
export const KNOCKBACK_SPEED = 320; // px/s（接触時のみ適用）

export const HEALING_DROP_RATE = 0.5;
export const HEALING_AMOUNT = 40; // プレイヤー最大HPの4%

// ===== 画像パス（public 配下） =====
export const BOSS_SPRITE_PATH: Record<BossType, string> = {
  A: `${import.meta.env.BASE_URL}monster_icons/monster_45.png`, // ゴリラ（重量感）
  B: `${import.meta.env.BASE_URL}monster_icons/monster_50.png`, // オレンジ（召喚主）
  C: `${import.meta.env.BASE_URL}monster_icons/monster_63.png`, // 青ネコ（領域支配・神秘）
};

export const BOSS_DISPLAY_NAME: Record<BossType, { ja: string; en: string }> = {
  A: { ja: '断頭の獣', en: 'The Executioner' },
  B: { ja: '腐敗の母核', en: 'The Rotting Core' },
  C: { ja: '虚輪の監視者', en: 'The Hollow Watcher' },
};
