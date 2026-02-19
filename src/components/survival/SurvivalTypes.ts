/**
 * サバイバルモード 型定義
 */

import { ChordDefinition } from '../fantasy/FantasyGameEngine';

// ===== 難易度 =====
export type SurvivalDifficulty = 'veryeasy' | 'easy' | 'normal' | 'hard' | 'extreme';

// ===== 方向 =====
export type Direction = 'up' | 'down' | 'left' | 'right' | 
  'up-left' | 'up-right' | 'down-left' | 'down-right';

// ===== ステータス異常 =====
export type StatusEffect = 
  | 'fire'      // 炎（やけど）
  | 'ice'       // 氷（凍結）
  | 'buffer'    // バフ
  | 'debuffer'  // デバフ
  | 'a_atk_up'  // A ATK UP
  | 'b_atk_up'  // B ATK UP
  | 'c_atk_up'  // C ATK UP
  | 'hint'      // ヒント
  | 'speed_up'  // 天使の靴
  | 'def_up'    // 防弾チョッキ
  | 'haisui'    // 背水の陣（HP15%以下で発動）
  | 'zekkouchou'; // 絶好調（HP満タンで発動）

export interface ActiveStatusEffect {
  type: StatusEffect;
  duration: number;      // 残り時間（秒）
  startTime: number;     // 開始時刻
  level?: number;        // レベル（バフ/デバフの強度）
}

// ===== 魔法 =====
export type MagicType = 
  | 'thunder'   // 雷
  | 'ice'       // 氷
  | 'fire'      // 炎
  | 'heal'      // 回復
  | 'buffer'    // バフ
  | 'debuffer'  // デバフ
  | 'hint';     // ヒント

export interface MagicDefinition {
  type: MagicType;
  level: number;         // 1-3
  baseDuration: number;  // 基本効果時間（秒）
  basePower: number;     // 基本威力
  cooldown: number;      // クールダウン（秒）
}

// ===== プレイヤーステータス =====
export interface PlayerStats {
  aAtk: number;          // 遠距離弾の威力
  bAtk: number;          // 近接攻撃の威力
  cAtk: number;          // 魔法の威力
  speed: number;         // 移動速度
  reloadMagic: number;   // 魔法の再発動短縮（0.5秒/ポイント、max 20ポイント）
  hp: number;            // 現在HP
  maxHp: number;         // 最大HP
  def: number;           // 防御力
  time: number;          // 効果時間延長（2秒/ポイント）
  aBulletCount: number;  // A列の弾数
  luck: number;          // 運（1ポイント=1%、上限40=50%）
}

// ===== 特殊スキル =====
export interface SpecialSkills {
  // A列スキル
  aPenetration: boolean;      // 貫通
  // 注: aBackBullet, aRightBullet, aLeftBulletは廃止
  // 代わりにaBulletCountが時計方向に弾を追加する
  
  // B列スキル
  bKnockbackBonus: number;    // ノックバック距離増加
  bRangeBonus: number;        // 攻撃範囲拡大
  bDeflect: boolean;          // 拳でかきけす（敵弾消去）
  
  // 共通スキル
  multiHitLevel: number;      // 多段攻撃レベル（0-3）
  expBonusLevel: number;      // 獲得経験値+1（レベル0-10）
  haisuiNoJin: boolean;       // 背水の陣（HP15%以下で強化）
  zekkouchou: boolean;        // 絶好調（HP満タンで強化）
  alwaysHaisuiNoJin: boolean; // 常時背水の陣（HP条件無視）
  alwaysZekkouchou: boolean;  // 常時絶好調（HP条件無視）
  autoSelect: boolean;        // オート選択（レベルアップボーナスを自動選択）
}

// ===== 取得済み魔法 =====
export interface AcquiredMagics {
  thunder: number;   // 0=未取得, 1-3=レベル
  ice: number;
  fire: number;
  heal: number;
  buffer: number;
  debuffer: number;
  hint: number;
}

// ===== プレイヤー状態 =====
export interface PlayerState {
  x: number;
  y: number;
  direction: Direction;
  stats: PlayerStats;
  skills: SpecialSkills;
  magics: AcquiredMagics;
  statusEffects: ActiveStatusEffect[];
  level: number;
  exp: number;
  expToNextLevel: number;
}

// ===== 敵ステータス =====
export interface EnemyStats {
  atk: number;
  def: number;
  hp: number;
  maxHp: number;
  speed: number;
}

// ===== 敵の種類 =====
export type EnemyType = 
  | 'slime'
  | 'goblin'
  | 'skeleton'
  | 'zombie'
  | 'bat'
  | 'ghost'
  | 'orc'
  | 'demon'
  | 'dragon'
  | 'boss';

// ===== 敵状態 =====
export interface EnemyState {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  stats: EnemyStats;
  statusEffects: ActiveStatusEffect[];
  isBoss: boolean;
  knockbackVelocity?: { x: number; y: number };
}

// ===== 弾丸 =====
export interface Projectile {
  id: string;
  x: number;
  y: number;
  direction: Direction;
  angle?: number;            // 移動角度（ラジアン）- 時計方向システム用
  damage: number;
  remainingRange: number;    // 残り射程（px）
  penetrating: boolean;
  hitEnemies: Set<string>;   // 貫通時に既にヒットした敵のID
}

// ===== 敵の弾丸 =====
export interface EnemyProjectile {
  id: string;
  x: number;
  y: number;
  dx: number;               // 移動ベクトルX
  dy: number;               // 移動ベクトルY
  damage: number;
  speed: number;
}

// ===== コードスロット =====
export type SlotType = 'A' | 'B' | 'C' | 'D';

export interface CodeSlot {
  type: SlotType;
  chord: ChordDefinition | null;
  correctNotes: number[];    // 入力済みの正解音
  timer: number;             // 残り時間（秒）
  isCompleted: boolean;
  isEnabled: boolean;        // C列・D列は魔法取得まで無効
  completedTime?: number;    // 完了時刻（自動リセット用）
}

// ===== レベルアップボーナス =====
export type BonusType = 
  // ステータス系
  | 'a_atk'
  | 'b_atk'
  | 'c_atk'
  | 'speed'
  | 'reload_magic'
  | 'max_hp'
  | 'def'
  | 'time'
  | 'a_bullet'
  | 'luck_pendant'  // 幸運のペンダント（Luck +1）
  // 特殊系
  | 'a_penetration'
  | 'b_knockback'
  | 'b_range'
  | 'b_deflect'
  | 'multi_hit'
  | 'exp_bonus'
  | 'haisui_no_jin'
  | 'zekkouchou'
  | 'auto_select'   // オート選択
  // 魔法系
  | 'magic_thunder'
  | 'magic_ice'
  | 'magic_fire'
  | 'magic_heal'
  | 'magic_buffer'
  | 'magic_debuffer'
  | 'magic_hint';

export interface LevelUpBonus {
  type: BonusType;
  displayName: string;
  displayNameEn?: string;
  description: string;
  descriptionEn?: string;
  icon: string;
  chord: ChordDefinition;    // 選択用コード
  maxLevel?: number;         // 上限レベル（なければ無限）
  currentLevel?: number;     // 現在レベル
}

// ===== アイテム =====
export type ItemType = 
  | 'heart'          // HP半分回復
  | 'angel_shoes'    // SPEED 2倍
  | 'vest'           // DEF 2倍
  | 'a_atk_boost'    // A ATK 2倍
  | 'b_atk_boost'    // B ATK 2倍
  | 'c_atk_boost';   // C ATK 2倍

export interface DroppedItem {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  duration?: number;  // 効果時間（ブースト系）
}

// ===== ダメージテキスト =====
export interface DamageText {
  id: string;
  x: number;
  y: number;
  damage: number;
  text?: string;
  color: string;
  startTime: number;
  duration: number;
}

// ===== コイン =====
export interface Coin {
  id: string;
  x: number;
  y: number;
  exp: number;          // このコインが持つ経験値
  startTime: number;    // 生成時刻
  lifetime: number;     // 生存時間（ミリ秒）
}

// ===== 衝撃波エフェクト =====
export interface ShockwaveEffect {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  startTime: number;
  duration: number;
  direction?: Direction;  // 前方のみエフェクト表示用
}

// ===== 雷エフェクト =====
export interface LightningEffect {
  id: string;
  x: number;
  y: number;
  startTime: number;
  duration: number;
}

// ===== WAVE設定 =====
export interface WaveState {
  currentWave: number;        // 現在のWAVE番号（1から開始）
  waveStartTime: number;      // 現在のWAVE開始時刻（秒）
  waveKills: number;          // 現在のWAVE内での撃破数
  waveQuota: number;          // 現在のWAVEのノルマ
  waveDuration: number;       // WAVEの制限時間（秒）
  waveCompleted: boolean;     // 現在のWAVEが完了したか
  waveFailedReason?: string;  // 失敗理由
}

export const WAVE_BASE_QUOTA = 20;       // 基本ノルマ（固定）
export const WAVE_DURATION = 60;         // WAVE時間（秒 = 1分）
export const WAVE_QUOTA_INCREMENT = 0;   // WAVEごとのノルマ増加量（0 = 固定）

// ===== ゲーム状態 =====
export interface SurvivalGameState {
  // 基本状態
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  isLevelingUp: boolean;
  
  // WAVE
  wave: WaveState;
  
  // 時間
  elapsedTime: number;       // 経過時間（秒）
  
  // プレイヤー
  player: PlayerState;
  
  // 敵
  enemies: EnemyState[];
  
  // 弾丸
  projectiles: Projectile[];
  
  // 敵の弾丸
  enemyProjectiles: EnemyProjectile[];
  
  // コードスロット
  codeSlots: {
    current: [CodeSlot, CodeSlot, CodeSlot, CodeSlot];   // A, B, C, D
    next: [CodeSlot, CodeSlot, CodeSlot, CodeSlot];
  };
  
  // 魔法クールダウン（A/B/C/Dで独立）
  aSlotCooldown: number;     // A列の残りクールダウン（秒）
  bSlotCooldown: number;     // B列の残りクールダウン（秒）
  cSlotCooldown: number;     // C列の残りクールダウン（秒）
  dSlotCooldown: number;     // D列の残りクールダウン（秒）
  
  // レベルアップ
  levelUpOptions: LevelUpBonus[];
  pendingLevelUps: number;   // 未処理のレベルアップ数
  
  // アイテム
  items: DroppedItem[];
  
  // コイン
  coins: Coin[];
  
  // ダメージテキスト
  damageTexts: DamageText[];
  
  // 統計
  enemiesDefeated: number;
  
  // 難易度
  difficulty: SurvivalDifficulty;
}

// ===== 難易度設定 =====
export interface DifficultyConfig {
  difficulty: SurvivalDifficulty;
  displayName: string;
  description: string;
  descriptionEn?: string;
  allowedChords: string[];   // 出題コード
  enemySpawnRate: number;    // 敵出現間隔（秒）
  enemySpawnCount: number;   // 1回の出現数
  enemyStatMultiplier: number; // 敵ステータス倍率
  expMultiplier: number;     // 経験値倍率
  itemDropRate: number;      // アイテムドロップ率
  bgmOddWaveUrl: string | null;  // 奇数WAVEのBGM URL
  bgmEvenWaveUrl: string | null; // 偶数WAVEのBGM URL
}

// ===== マップ設定 =====
export interface MapConfig {
  width: number;
  height: number;
  tileSize: number;
}

// ===== ゲーム結果 =====
export interface SurvivalGameResult {
  survivalTime: number;      // 生存時間（秒）
  finalLevel: number;        // 最終レベル
  enemiesDefeated: number;   // 倒した敵の数
  playerStats: PlayerStats;  // 最終ステータス
  skills: SpecialSkills;     // 取得スキル
  magics: AcquiredMagics;    // 取得魔法
  earnedXp: number;          // 獲得経験値
}

// ===== キャラクターレベル10ボーナス定義 =====
export interface CharacterLevel10Bonus {
  type: string;    // BonusType相当（'max_hp_flat' | 'exp_bonus' | 'a_atk' など）
  value: number;   // 増加量
  max?: number;    // 上限（あれば）
}

// ===== キャラクター永続効果 =====
export interface CharacterPermanentEffect {
  type: string;    // StatusEffect相当（'hint' | 'buffer' など）
  level: number;   // レベル
}

// ===== サバイバルキャラクター =====
export interface SurvivalCharacter {
  id: string;
  name: string;
  nameEn: string | null;
  avatarUrl: string;
  sortOrder: number;
  initialStats: Partial<PlayerStats>;
  initialSkills: Partial<SpecialSkills>;
  initialMagics: Partial<AcquiredMagics>;
  level10Bonuses: CharacterLevel10Bonus[];
  excludedBonuses: string[];          // BonusType[] に相当
  permanentEffects: CharacterPermanentEffect[];
  noMagic: boolean;
  abColumnMagic: boolean;       // AB列を魔法スロット化
  bonusChoiceCount: number;     // レベルアップ時の選択肢数（デフォルト3）
  hpRegenPerSecond: number;
  autoCollectExp: boolean;      // 敵撃破時に経験値を自動取得（コイン不要）
  description: string | null;
  descriptionEn: string | null;
}

// ===== 定数 =====
export const SLOT_TIMEOUT = 10;  // コードスロットのタイムアウト（秒）
export const MAGIC_BASE_COOLDOWN = 10;  // 魔法の基本クールダウン（秒）
export const MAGIC_MIN_COOLDOWN = 5;    // 魔法の最小クールダウン（秒）
export const EXP_PER_MINUTE = 100;      // 1分生存ごとの経験値

export const MAP_CONFIG: MapConfig = {
  width: 1600,
  height: 1200,
  tileSize: 32,
};
