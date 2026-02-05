/**
 * サバイバルモード ゲームエンジン
 * ゲームロジックとステート管理
 */

import { 
  SurvivalGameState, 
  PlayerState, 
  EnemyState, 
  CodeSlot,
  Direction,
  SurvivalDifficulty,
  DifficultyConfig,
  LevelUpBonus,
  BonusType,
  Projectile,
  EnemyProjectile,
  DroppedItem,
  DamageText,
  Coin,
  WaveState,
  EnemyType,
  MagicType,
  ActiveStatusEffect,
  SLOT_TIMEOUT,
  MAGIC_BASE_COOLDOWN,
  MAGIC_MIN_COOLDOWN,
  MAP_CONFIG,
  WAVE_BASE_QUOTA,
  WAVE_DURATION,
  WAVE_QUOTA_INCREMENT,
} from './SurvivalTypes';
import { ChordDefinition } from '../fantasy/FantasyGameEngine';
import { resolveChord } from '@/utils/chord-utils';
import { note as parseNote } from 'tonal';

// ===== 定数 =====
const PLAYER_SIZE = 32;
const ENEMY_SIZE = 28;
const PROJECTILE_SIZE = 8;
const ITEM_SIZE = 24;

const BASE_PLAYER_SPEED = 150;  // px/秒
const BASE_ENEMY_SPEED = 80;   // px/秒（元60から増加）

const EXP_BASE = 10;           // 敵1体あたりの基本経験値
const EXP_LEVEL_FACTOR = 1.2;  // レベルアップに必要な経験値の増加率（ゆるやかに）

// パフォーマンス向上用の上限値
export const MAX_ENEMIES = 80;           // 敵の最大数
export const MAX_PROJECTILES = 100;      // 弾丸の最大数
export const MAX_COINS = 150;            // コインの最大数

// ===== 初期状態 =====
const createInitialPlayerState = (): PlayerState => ({
  x: MAP_CONFIG.width / 2,
  y: MAP_CONFIG.height / 2,
  direction: 'right',
  stats: {
    aAtk: 10,
    bAtk: 15,
    cAtk: 20,
    speed: 1,
    reloadMagic: 0,
    hp: 100,
    maxHp: 100,
    def: 5,
    time: 0,
    aBulletCount: 1,
    luck: 0,  // 運（1=1%、上限40=50%）
  },
  skills: {
    aPenetration: false,
    bKnockbackBonus: 0,
    bRangeBonus: 0,
    bDeflect: false,
    multiHitLevel: 0,
    expBonusLevel: 0,
    haisuiNoJin: false,
    zekkouchou: false,
  },
  magics: {
    thunder: 0,
    ice: 0,
    fire: 0,
    heal: 0,
    buffer: 0,
    debuffer: 0,
    hint: 0,
  },
  statusEffects: [],
  level: 1,
  exp: 0,
  expToNextLevel: EXP_BASE,
});

const createEmptyCodeSlot = (type: 'A' | 'B' | 'C' | 'D', chord: ChordDefinition | null = null): CodeSlot => ({
  type,
  chord,
  correctNotes: [],
  timer: SLOT_TIMEOUT,
  isCompleted: false,
  isEnabled: type === 'A' || type === 'B',  // C/D列は魔法取得まで無効
});

// ===== 初期WAVE状態 =====
const createInitialWaveState = (): WaveState => ({
  currentWave: 1,
  waveStartTime: 0,
  waveKills: 0,
  waveQuota: WAVE_BASE_QUOTA,
  waveDuration: WAVE_DURATION,
  waveCompleted: false,
});

export const createInitialGameState = (
  difficulty: SurvivalDifficulty,
  _config: DifficultyConfig
): SurvivalGameState => ({
  isPlaying: false,
  isPaused: false,
  isGameOver: false,
  isLevelingUp: false,
  wave: createInitialWaveState(),
  elapsedTime: 0,
  player: createInitialPlayerState(),
  enemies: [],
  projectiles: [],
  enemyProjectiles: [],
  codeSlots: {
    current: [
      createEmptyCodeSlot('A'),
      createEmptyCodeSlot('B'),
      createEmptyCodeSlot('C'),
      createEmptyCodeSlot('D'),
    ],
    next: [
      createEmptyCodeSlot('A'),
      createEmptyCodeSlot('B'),
      createEmptyCodeSlot('C'),
      createEmptyCodeSlot('D'),
    ],
  },
  magicCooldown: 0,
  levelUpOptions: [],
  pendingLevelUps: 0,
  items: [],
  coins: [],
  damageTexts: [],
  enemiesDefeated: 0,
  difficulty,
});

// ===== WAVEヘルパー関数 =====
export const calculateWaveQuota = (waveNumber: number): number => {
  return WAVE_BASE_QUOTA + (waveNumber - 1) * WAVE_QUOTA_INCREMENT;
};

export const getWaveSpeedMultiplier = (waveNumber: number): number => {
  // WAVEが進むごとに敵が20%ずつ速くなる（より高速化）
  return 1 + (waveNumber - 1) * 0.2;
};

// ===== コード生成 =====
export const getChordDefinition = (chordId: string): ChordDefinition | null => {
  const resolved = resolveChord(chordId, 4);
  if (!resolved) return null;
  
  return {
    id: chordId,
    displayName: resolved.displayName,
    notes: resolved.notes.map((n, i) => {
      // tonalでMIDIノート番号を取得
      const parsed = parseNote(n + '4');
      return parsed?.midi ?? (60 + i);
    }),
    noteNames: resolved.notes,
    quality: resolved.quality,
    root: resolved.root,
  };
};

export const selectRandomChord = (allowedChords: string[], excludeIds?: string | string[]): ChordDefinition | null => {
  if (!allowedChords || allowedChords.length === 0) {
    return null;
  }
  
  // excludeIdsを配列に正規化
  const excludeArray = excludeIds 
    ? (Array.isArray(excludeIds) ? excludeIds : [excludeIds])
    : [];
  
  const available = allowedChords.filter(c => !excludeArray.includes(c));
  
  // 利用可能なコードからランダムに選択（複数回試行）
  const chordsToTry = available.length > 0 ? available : allowedChords;
  
  for (let attempt = 0; attempt < chordsToTry.length; attempt++) {
    const chordId = chordsToTry[Math.floor(Math.random() * chordsToTry.length)];
    const chord = getChordDefinition(chordId);
    if (chord) {
      return chord;
    }
  }
  
  // 全て失敗した場合、すべてのコードを順番に試す
  for (const chordId of allowedChords) {
    const chord = getChordDefinition(chordId);
    if (chord) {
      return chord;
    }
  }
  
  return null;
};

// ===== コードスロット管理 =====
export const initializeCodeSlots = (
  allowedChords: string[],
  hasMagic: boolean
): SurvivalGameState['codeSlots'] => {
  const current: [CodeSlot, CodeSlot, CodeSlot, CodeSlot] = [
    { ...createEmptyCodeSlot('A'), chord: selectRandomChord(allowedChords) },
    { ...createEmptyCodeSlot('B'), chord: selectRandomChord(allowedChords) },
    { ...createEmptyCodeSlot('C'), chord: hasMagic ? selectRandomChord(allowedChords) : null, isEnabled: hasMagic },
    { ...createEmptyCodeSlot('D'), chord: hasMagic ? selectRandomChord(allowedChords) : null, isEnabled: hasMagic },
  ];
  
  const next: [CodeSlot, CodeSlot, CodeSlot, CodeSlot] = [
    { ...createEmptyCodeSlot('A'), chord: selectRandomChord(allowedChords, current[0].chord?.id) },
    { ...createEmptyCodeSlot('B'), chord: selectRandomChord(allowedChords, current[1].chord?.id) },
    { ...createEmptyCodeSlot('C'), chord: hasMagic ? selectRandomChord(allowedChords, current[2].chord?.id) : null, isEnabled: hasMagic },
    { ...createEmptyCodeSlot('D'), chord: hasMagic ? selectRandomChord(allowedChords, current[3].chord?.id) : null, isEnabled: hasMagic },
  ];
  
  return { current, next };
};

// ===== 敵生成 =====
const ENEMY_TYPES: EnemyType[] = ['slime', 'goblin', 'skeleton', 'zombie', 'bat', 'ghost', 'orc', 'demon', 'dragon'];

const getEnemyBaseStats = (type: EnemyType, elapsedTime: number, multiplier: number) => {
  const timeBonus = Math.floor(elapsedTime / 30) * 0.1;  // 30秒ごとに10%強化
  const baseStats: Record<EnemyType, { atk: number; def: number; hp: number; speed: number }> = {
    slime: { atk: 5, def: 2, hp: 30, speed: 0.8 },
    goblin: { atk: 8, def: 3, hp: 40, speed: 1.0 },
    skeleton: { atk: 10, def: 5, hp: 50, speed: 0.9 },
    zombie: { atk: 12, def: 4, hp: 60, speed: 0.6 },
    bat: { atk: 6, def: 2, hp: 25, speed: 1.4 },
    ghost: { atk: 15, def: 1, hp: 35, speed: 1.1 },
    orc: { atk: 18, def: 8, hp: 80, speed: 0.7 },
    demon: { atk: 25, def: 10, hp: 100, speed: 0.9 },
    dragon: { atk: 35, def: 15, hp: 150, speed: 0.8 },
    boss: { atk: 50, def: 20, hp: 300, speed: 0.6 },
  };
  
  const base = baseStats[type];
  const totalMultiplier = multiplier * (1 + timeBonus);
  
  return {
    atk: Math.floor(base.atk * totalMultiplier),
    def: Math.floor(base.def * totalMultiplier),
    hp: Math.floor(base.hp * totalMultiplier),
    maxHp: Math.floor(base.hp * totalMultiplier),
    speed: base.speed,
  };
};

export const spawnEnemy = (
  playerX: number,
  playerY: number,
  elapsedTime: number,
  config: DifficultyConfig
): EnemyState => {
  // プレイヤーから一定距離離れた位置にスポーン
  const spawnDistance = 400 + Math.random() * 200;
  const angle = Math.random() * Math.PI * 2;
  
  let x = playerX + Math.cos(angle) * spawnDistance;
  let y = playerY + Math.sin(angle) * spawnDistance;
  
  // マップ範囲内に収める
  x = Math.max(ENEMY_SIZE, Math.min(MAP_CONFIG.width - ENEMY_SIZE, x));
  y = Math.max(ENEMY_SIZE, Math.min(MAP_CONFIG.height - ENEMY_SIZE, y));
  
  // 経過時間に応じて強い敵が出現
  const typeIndex = Math.min(
    Math.floor(elapsedTime / 60) + Math.floor(Math.random() * 3),
    ENEMY_TYPES.length - 1
  );
  const type = ENEMY_TYPES[typeIndex];
  
  const isBoss = Math.random() < 0.05 && elapsedTime > 120;  // 2分以降、5%の確率でボス
  
  return {
    id: `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    x,
    y,
    stats: getEnemyBaseStats(type, elapsedTime, isBoss ? config.enemyStatMultiplier * 2 : config.enemyStatMultiplier),
    statusEffects: [],
    isBoss,
  };
};

// ===== 移動計算 =====
export const getDirectionVector = (direction: Direction): { x: number; y: number } => {
  const vectors: Record<Direction, { x: number; y: number }> = {
    'up': { x: 0, y: -1 },
    'down': { x: 0, y: 1 },
    'left': { x: -1, y: 0 },
    'right': { x: 1, y: 0 },
    'up-left': { x: -0.707, y: -0.707 },
    'up-right': { x: 0.707, y: -0.707 },
    'down-left': { x: -0.707, y: 0.707 },
    'down-right': { x: 0.707, y: 0.707 },
  };
  return vectors[direction];
};

export const updatePlayerPosition = (
  player: PlayerState,
  keys: Set<string>,
  deltaTime: number
): PlayerState => {
  let dx = 0;
  let dy = 0;
  
  if (keys.has('w') || keys.has('arrowup')) dy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) dy += 1;
  if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
  if (keys.has('d') || keys.has('arrowright')) dx += 1;
  
  if (dx === 0 && dy === 0) return player;
  
  // 正規化
  const length = Math.sqrt(dx * dx + dy * dy);
  dx /= length;
  dy /= length;
  
  // 速度計算（バフ込み）
  const speedMultiplier = player.statusEffects.some(e => e.type === 'speed_up') ? 2 : 1;
  // 背水の陣のSPEEDボーナス
  const conditionalMultipliers = getConditionalSkillMultipliers(player);
  const totalSpeed = player.stats.speed + conditionalMultipliers.speedBonus;
  const speed = BASE_PLAYER_SPEED * (1 + totalSpeed * 0.1) * speedMultiplier;
  
  // 新しい位置
  let newX = player.x + dx * speed * deltaTime;
  let newY = player.y + dy * speed * deltaTime;
  
  // マップ範囲内に制限
  newX = Math.max(PLAYER_SIZE / 2, Math.min(MAP_CONFIG.width - PLAYER_SIZE / 2, newX));
  newY = Math.max(PLAYER_SIZE / 2, Math.min(MAP_CONFIG.height - PLAYER_SIZE / 2, newY));
  
  // 方向を決定
  let direction: Direction = player.direction;
  if (dx !== 0 || dy !== 0) {
    if (dx > 0.5) direction = dy < -0.5 ? 'up-right' : dy > 0.5 ? 'down-right' : 'right';
    else if (dx < -0.5) direction = dy < -0.5 ? 'up-left' : dy > 0.5 ? 'down-left' : 'left';
    else direction = dy < 0 ? 'up' : 'down';
  }
  
  return { ...player, x: newX, y: newY, direction };
};

// ===== 敵の移動 =====
export const updateEnemyPositions = (
  enemies: EnemyState[],
  playerX: number,
  playerY: number,
  deltaTime: number,
  waveSpeedMultiplier: number = 1
): EnemyState[] => {
  return enemies.map(enemy => {
    // 凍結状態なら移動しない
    if (enemy.statusEffects.some(e => e.type === 'ice')) {
      return enemy;
    }
    
    // やけど状態なら速度半減
    const burnedMultiplier = enemy.statusEffects.some(e => e.type === 'fire') ? 0.5 : 1;
    // デバフ状態
    const debuffMultiplier = enemy.statusEffects.some(e => e.type === 'debuffer') ? 0.7 : 1;
    
    // プレイヤーに向かって移動
    const dx = playerX - enemy.x;
    const dy = playerY - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 1) return enemy;
    
    // WAVE倍率を適用
    const speed = BASE_ENEMY_SPEED * enemy.stats.speed * burnedMultiplier * debuffMultiplier * waveSpeedMultiplier;
    const moveX = (dx / distance) * speed * deltaTime;
    const moveY = (dy / distance) * speed * deltaTime;
    
    // ノックバック処理
    let newX = enemy.x + moveX;
    let newY = enemy.y + moveY;
    
    if (enemy.knockbackVelocity) {
      newX += enemy.knockbackVelocity.x * deltaTime;
      newY += enemy.knockbackVelocity.y * deltaTime;
    }
    
    // マップ範囲内に制限
    newX = Math.max(ENEMY_SIZE / 2, Math.min(MAP_CONFIG.width - ENEMY_SIZE / 2, newX));
    newY = Math.max(ENEMY_SIZE / 2, Math.min(MAP_CONFIG.height - ENEMY_SIZE / 2, newY));
    
    return {
      ...enemy,
      x: newX,
      y: newY,
      knockbackVelocity: enemy.knockbackVelocity 
        ? { 
            x: enemy.knockbackVelocity.x * 0.9, 
            y: enemy.knockbackVelocity.y * 0.9 
          }
        : undefined,
    };
  });
};

// ===== コード判定 =====
export const checkChordMatch = (inputNotes: number[], targetChord: ChordDefinition): boolean => {
  if (inputNotes.length === 0 || !targetChord) return false;
  
  const inputMod12 = [...new Set(inputNotes.map(n => n % 12))];
  const targetMod12 = [...new Set(targetChord.notes.map(n => n % 12))];
  
  return targetMod12.every(t => inputMod12.includes(t));
};

export const getCorrectNotes = (inputNotes: number[], targetChord: ChordDefinition): number[] => {
  if (!targetChord) return [];
  
  const inputMod12 = inputNotes.map(n => n % 12);
  const targetMod12 = [...new Set(targetChord.notes.map(n => n % 12))];
  
  // 重複を除去して正解音のみを返す
  const correctMod12 = inputMod12.filter(n => targetMod12.includes(n));
  return [...new Set(correctMod12)];
};

// ===== 攻撃処理 =====
// A列弾丸のダメージ計算（A ATK +1 で約10ダメージ増加、初期状態で10-14維持）
const INITIAL_A_ATK = 10;  // 初期A ATK値
const A_ATK_DAMAGE_MULTIPLIER = 10;  // A ATK +1あたりのダメージ増加量
const A_BASE_DAMAGE = 14;  // 基本ダメージ（初期A ATKでのダメージ）

export const calculateAProjectileDamage = (aAtk: number): number => {
  // 初期状態（aAtk=10）でA_BASE_DAMAGE、+1ごとにA_ATK_DAMAGE_MULTIPLIER増加
  return A_BASE_DAMAGE + (aAtk - INITIAL_A_ATK) * A_ATK_DAMAGE_MULTIPLIER;
};

// プレイヤーの向きから角度（ラジアン）を取得（12時方向が0）
export const getDirectionAngle = (direction: Direction): number => {
  const angles: Record<Direction, number> = {
    'up': 0,
    'up-right': Math.PI / 4,
    'right': Math.PI / 2,
    'down-right': Math.PI * 3 / 4,
    'down': Math.PI,
    'down-left': -Math.PI * 3 / 4,
    'left': -Math.PI / 2,
    'up-left': -Math.PI / 4,
  };
  return angles[direction];
};

// 弾数に応じた発射角度リストを生成（時計回り）
export const generateBulletAngles = (bulletCount: number, baseAngle: number): number[] => {
  const angles: number[] = [];
  
  if (bulletCount <= 0) return angles;
  
  // 1周目（12方向まで）: 均等配置
  // 2周目以降: 1分（0.5度）ずつオフセット
  const fullRotations = Math.floor((bulletCount - 1) / 12);
  const offsetPerRotation = (Math.PI / 360);  // 0.5度
  
  for (let i = 0; i < bulletCount; i++) {
    const rotationIndex = Math.floor(i / 12);
    const positionInRotation = i % 12;
    
    // 時計回りに均等配置
    // 最初は12時方向、次は1時方向...と配置
    const angleStep = (Math.PI * 2) / Math.max(bulletCount, 12);
    const angle = baseAngle + (i * angleStep) + (rotationIndex * offsetPerRotation);
    
    angles.push(angle);
  }
  
  return angles;
};

export const createProjectile = (
  player: PlayerState,
  angle: number,
  damage: number
): Projectile => ({
  id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  x: player.x,
  y: player.y,
  angle,
  damage,
  penetrating: player.skills.aPenetration,
  hitEnemies: new Set(),
});

// 弾丸をまとめて発射（時計回りで配置）
export const createProjectiles = (
  player: PlayerState,
  damage: number
): Projectile[] => {
  const baseAngle = getDirectionAngle(player.direction);
  const angles = generateBulletAngles(player.stats.aBulletCount, baseAngle);
  
  return angles.map((angle, index) => ({
    id: `proj_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
    x: player.x,
    y: player.y,
    angle,
    damage,
    penetrating: player.skills.aPenetration,
    hitEnemies: new Set<string>(),
  }));
};

export const updateProjectiles = (
  projectiles: Projectile[],
  deltaTime: number
): Projectile[] => {
  const PROJECTILE_SPEED = 500;
  
  return projectiles
    .map(proj => {
      // 角度から移動ベクトルを計算（0が上向き）
      const dx = Math.sin(proj.angle) * PROJECTILE_SPEED * deltaTime;
      const dy = -Math.cos(proj.angle) * PROJECTILE_SPEED * deltaTime;
      return {
        ...proj,
        x: proj.x + dx,
        y: proj.y + dy,
      };
    })
    .filter(proj => 
      proj.x > 0 && proj.x < MAP_CONFIG.width &&
      proj.y > 0 && proj.y < MAP_CONFIG.height
    );
};

// ===== ダメージ計算 =====
// bufferLevel: バフ魔法のレベル (0-3)、cAtk: プレイヤーのC列攻撃力
// debufferLevel: デバフ魔法のレベル (0-3)
// isLucky: 運発動フラグ（ダメージ2倍）
export const calculateDamage = (
  baseDamage: number,
  attackerAtk: number,
  defenderDef: number,
  isBuffed: boolean = false,
  isDebuffed: boolean = false,
  bufferLevel: number = 0,
  debufferLevel: number = 0,
  cAtk: number = 0,
  isLucky: boolean = false
): number => {
  // バッファー効果: レベルとC ATKで大幅強化
  // レベル0(無効): 1.0倍、レベル1: 1.5倍、レベル2: 2.0倍、レベル3: 2.5倍
  // さらにC ATK×0.03を加算（C ATK 20で+0.6倍）
  let atkMultiplier = 1;
  if (isBuffed && bufferLevel > 0) {
    atkMultiplier = 1 + bufferLevel * 0.5 + cAtk * 0.03;
  } else if (isBuffed) {
    atkMultiplier = 1.5;  // レベル情報がない場合のデフォルト
  }
  
  // デバッファー効果: バフと同様にダメージの通りをよくする
  // 敵の防御力を大幅に無効化 + ダメージ倍率を追加
  // レベル1: DEF50%、ダメージ1.3倍、レベル2: DEF30%、ダメージ1.6倍、レベル3: DEF10%、ダメージ1.9倍
  let defMultiplier = 1;
  let debuffDamageMultiplier = 1;
  if (isDebuffed && debufferLevel > 0) {
    defMultiplier = Math.max(0.1, 0.7 - debufferLevel * 0.2 - cAtk * 0.01);  // DEF 70%→50%→30%→10%
    debuffDamageMultiplier = 1 + debufferLevel * 0.3 + cAtk * 0.02;  // ダメージ1.3〜1.9倍+C ATKボーナス
  } else if (isDebuffed) {
    defMultiplier = 0.5;  // レベル情報がない場合のデフォルト
    debuffDamageMultiplier = 1.3;
  }
  
  // 運発動時はダメージ2倍
  const luckyMultiplier = isLucky ? 2 : 1;
  
  // ダメージ計算: バフ倍率、デバフ倍率、運倍率を適用
  const damage = Math.max(1, Math.floor(
    (baseDamage + attackerAtk * 2) * atkMultiplier * debuffDamageMultiplier * luckyMultiplier - (defenderDef * defMultiplier * 0.5)
  ));
  
  return damage;
};

// ===== 運の判定 =====
// 基本運率 = 10% + Luck * 1%（上限40 = 50%）
const BASE_LUCK_CHANCE = 0.10;  // 基本10%
const LUCK_PER_POINT = 0.01;    // Luck 1ポイントあたり1%
const MAX_LUCK_STAT = 40;       // Luck上限（40 = 50%）

export interface LuckResult {
  isLucky: boolean;           // 運発動したか
  doubleDamage: boolean;      // ダメージ2倍
  noDamageTaken: boolean;     // 敵からのダメージ0
  reloadReduction: boolean;   // 魔法リロード時間1/3
  doubleTime: boolean;        // 魔法発動時TIME2倍
}

export const checkLuck = (luck: number): LuckResult => {
  const effectiveLuck = Math.min(luck, MAX_LUCK_STAT);
  const luckChance = BASE_LUCK_CHANCE + effectiveLuck * LUCK_PER_POINT;
  const isLucky = Math.random() < luckChance;
  
  // 運が発動したら全ての効果が発動
  return {
    isLucky,
    doubleDamage: isLucky,
    noDamageTaken: isLucky,
    reloadReduction: isLucky,
    doubleTime: isLucky,
  };
};

// 運発動確率を取得（UI表示用）
export const getLuckChance = (luck: number): number => {
  const effectiveLuck = Math.min(luck, MAX_LUCK_STAT);
  return BASE_LUCK_CHANCE + effectiveLuck * LUCK_PER_POINT;
};

// ===== 背水の陣と絶好調の効果計算 =====
export const getConditionalSkillMultipliers = (player: PlayerState): {
  atkMultiplier: number;      // 攻撃力倍率
  timeMultiplier: number;     // TIME倍率
  reloadMultiplier: number;   // RELOAD倍率（小さいほど早い）
  speedBonus: number;         // SPEED加算
  defOverride: number | null; // DEFの上書き（nullなら上書きなし）
} => {
  const hpPercent = player.stats.hp / player.stats.maxHp;
  const hasHaisui = player.skills.haisuiNoJin && hpPercent <= 0.15;
  const hasZekkouchou = player.skills.zekkouchou && player.stats.hp >= player.stats.maxHp;
  
  let atkMultiplier = 1;
  let timeMultiplier = 1;
  let reloadMultiplier = 1;
  let speedBonus = 0;
  let defOverride: number | null = null;
  
  // 背水の陣（HP15%以下）: ABC攻撃力2倍、SPEED+10、RELOAD半分、TIME2倍、DEF=0
  if (hasHaisui) {
    atkMultiplier *= 2;
    timeMultiplier *= 2;
    reloadMultiplier *= 0.5;
    speedBonus += 10;
    defOverride = 0;
  }
  
  // 絶好調（HP満タン）: ABC攻撃力1.3倍、TIME2倍、RELOAD半分
  if (hasZekkouchou) {
    atkMultiplier *= 1.3;
    timeMultiplier *= 2;
    reloadMultiplier *= 0.5;
  }
  
  return { atkMultiplier, timeMultiplier, reloadMultiplier, speedBonus, defOverride };
};

// ===== レベルアップボーナス生成 =====
const ALL_BONUSES: Array<{ type: BonusType; displayName: string; description: string; icon: string; maxLevel?: number }> = [
  // ステータス系
  { type: 'a_atk', displayName: 'A ATK +1', description: '+10ダメージ', icon: '🔫' },
  { type: 'b_atk', displayName: 'B ATK +1', description: '近接攻撃力UP', icon: '👊' },
  { type: 'c_atk', displayName: 'C ATK +1', description: '魔法攻撃力UP', icon: '🪄' },
  { type: 'speed', displayName: 'SPEED +1', description: '移動速度UP', icon: '👟' },
  { type: 'reload_magic', displayName: 'RELOAD +1', description: '-1秒', icon: '⏱️', maxLevel: 7 },
  { type: 'max_hp', displayName: 'HP +20%', description: '最大HP UP', icon: '❤️' },
  { type: 'def', displayName: 'DEF +1', description: '防御力UP', icon: '🛡️' },
  { type: 'time', displayName: 'TIME +1', description: '+2秒', icon: '⏰' },
  { type: 'a_bullet', displayName: '弾数 +2', description: '時計回りで増加', icon: '💫' },
  { type: 'luck_pendant', displayName: '幸運のペンダント', description: '運+1%', icon: '🍀', maxLevel: 40 },
  // 特殊系
  { type: 'a_penetration', displayName: '貫通', description: '弾が敵を貫通', icon: '➡️', maxLevel: 1 },
  { type: 'b_knockback', displayName: 'ノックバック+', description: '距離増加', icon: '💨' },
  { type: 'b_range', displayName: '攻撃範囲+', description: '範囲拡大', icon: '📐' },
  { type: 'b_deflect', displayName: '拳でかきけす', description: '敵弾消去', icon: '✊', maxLevel: 1 },
  { type: 'multi_hit', displayName: '多段攻撃', description: '攻撃回数増加', icon: '✨', maxLevel: 3 },
  { type: 'exp_bonus', displayName: '経験値+1', description: 'コイン+1', icon: '💰', maxLevel: 10 },
  { type: 'haisui_no_jin', displayName: '背水の陣', description: 'HP15%以下で強化', icon: '🩸', maxLevel: 1 },
  { type: 'zekkouchou', displayName: '絶好調', description: 'HP満タンで強化', icon: '😊', maxLevel: 1 },
  // 魔法系
  { type: 'magic_thunder', displayName: 'THUNDER', description: '雷魔法', icon: '⚡', maxLevel: 3 },
  { type: 'magic_ice', displayName: 'ICE', description: '氷魔法', icon: '❄️', maxLevel: 3 },
  { type: 'magic_fire', displayName: 'FIRE', description: '炎魔法', icon: '🔥', maxLevel: 3 },
  { type: 'magic_heal', displayName: 'HEAL', description: '回復魔法', icon: '💚', maxLevel: 3 },
  { type: 'magic_buffer', displayName: 'BUFFER', description: 'バフ魔法', icon: '⬆️', maxLevel: 3 },
  { type: 'magic_debuffer', displayName: 'DEBUFFER', description: 'デバフ魔法', icon: '⬇️', maxLevel: 3 },
  { type: 'magic_hint', displayName: 'HINT', description: 'ヒント魔法', icon: '💡', maxLevel: 3 },
];

export const generateLevelUpOptions = (
  player: PlayerState,
  allowedChords: string[]
): LevelUpBonus[] => {
  // 取得可能なボーナスをフィルタリング
  const available = ALL_BONUSES.filter(bonus => {
    // 上限チェック
    if (bonus.maxLevel) {
      switch (bonus.type) {
        case 'a_penetration':
          return !player.skills.aPenetration;
        case 'b_deflect':
          return !player.skills.bDeflect;
        case 'multi_hit':
          return player.skills.multiHitLevel < bonus.maxLevel;
        case 'exp_bonus':
          return player.skills.expBonusLevel < bonus.maxLevel;
        case 'haisui_no_jin':
          return !player.skills.haisuiNoJin;
        case 'zekkouchou':
          return !player.skills.zekkouchou;
        case 'reload_magic':
          return player.stats.reloadMagic < bonus.maxLevel;
        case 'luck_pendant':
          return player.stats.luck < bonus.maxLevel;
        case 'magic_thunder':
          return player.magics.thunder < bonus.maxLevel;
        case 'magic_ice':
          return player.magics.ice < bonus.maxLevel;
        case 'magic_fire':
          return player.magics.fire < bonus.maxLevel;
        case 'magic_heal':
          return player.magics.heal < bonus.maxLevel;
        case 'magic_buffer':
          return player.magics.buffer < bonus.maxLevel;
        case 'magic_debuffer':
          return player.magics.debuffer < bonus.maxLevel;
        case 'magic_hint':
          return player.magics.hint < bonus.maxLevel;
      }
    }
    return true;
  });
  
  // ランダムに3つ選択
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);
  
  // コードを割り当て（重複しないように）
  const usedChordIds: string[] = [];
  const result: LevelUpBonus[] = [];
  
  // 現在のスキルレベルを取得するヘルパー関数
  const getCurrentLevel = (type: string): number => {
    switch (type) {
      case 'a_bullet': return player.stats.aBulletCount;
      case 'b_knockback': return player.skills.bKnockbackBonus;
      case 'b_range': return player.skills.bRangeBonus;
      case 'multi_hit': return player.skills.multiHitLevel;
      case 'exp_bonus': return player.skills.expBonusLevel;
      case 'reload_magic': return player.stats.reloadMagic;
      case 'luck_pendant': return player.stats.luck;
      case 'magic_thunder': return player.magics.thunder;
      case 'magic_ice': return player.magics.ice;
      case 'magic_fire': return player.magics.fire;
      case 'magic_heal': return player.magics.heal;
      case 'magic_buffer': return player.magics.buffer;
      case 'magic_debuffer': return player.magics.debuffer;
      case 'magic_hint': return player.magics.hint;
      default: return 0;
    }
  };
  
  for (const bonus of selected) {
    const chord = selectRandomChord(allowedChords, usedChordIds);
    if (chord) {
      usedChordIds.push(chord.id);
      result.push({
        ...bonus,
        chord,
        currentLevel: getCurrentLevel(bonus.type),  // 現在のスキルレベルを追加
      });
    }
  }
  
  // 有効なオプションが3つ未満の場合、重複を許可して再試行
  while (result.length < 3 && result.length < selected.length) {
    const remainingBonuses = selected.filter(b => !result.some(r => r.type === b.type));
    if (remainingBonuses.length === 0) break;
    
    const bonus = remainingBonuses[0];
    const chord = selectRandomChord(allowedChords);
    if (chord) {
      result.push({
        ...bonus,
        chord,
      });
    } else {
      break;
    }
  }
  
  return result;
};

// ===== ボーナス適用 =====
export const applyLevelUpBonus = (player: PlayerState, bonus: LevelUpBonus): PlayerState => {
  const newPlayer = { ...player };
  newPlayer.stats = { ...player.stats };
  newPlayer.skills = { ...player.skills };
  newPlayer.magics = { ...player.magics };
  
  switch (bonus.type) {
    case 'a_atk':
      newPlayer.stats.aAtk += 1;
      break;
    case 'b_atk':
      newPlayer.stats.bAtk += 1;
      break;
    case 'c_atk':
      newPlayer.stats.cAtk += 1;
      break;
    case 'speed':
      newPlayer.stats.speed += 1;
      break;
    case 'reload_magic':
      // Reload +1 = 1秒短縮（上限7で最小3秒）
      newPlayer.stats.reloadMagic = Math.min(7, newPlayer.stats.reloadMagic + 1);
      break;
    case 'max_hp':
      // HP +20%
      newPlayer.stats.maxHp = Math.floor(newPlayer.stats.maxHp * 1.2);
      newPlayer.stats.hp = Math.min(newPlayer.stats.hp + Math.floor(newPlayer.stats.maxHp * 0.2), newPlayer.stats.maxHp);
      break;
    case 'def':
      newPlayer.stats.def += 1;
      break;
    case 'time':
      newPlayer.stats.time += 1;
      break;
    case 'a_bullet':
      // 弾数 +2（時計回りで増加）
      newPlayer.stats.aBulletCount += 2;
      break;
    case 'luck_pendant':
      // 幸運のペンダント: 運+1（上限40）
      newPlayer.stats.luck = Math.min(40, newPlayer.stats.luck + 1);
      break;
    case 'a_penetration':
      newPlayer.skills.aPenetration = true;
      break;
    case 'b_knockback':
      newPlayer.skills.bKnockbackBonus += 1;
      break;
    case 'b_range':
      newPlayer.skills.bRangeBonus += 1;
      break;
    case 'b_deflect':
      newPlayer.skills.bDeflect = true;
      break;
    case 'multi_hit':
      newPlayer.skills.multiHitLevel = Math.min(3, newPlayer.skills.multiHitLevel + 1);
      break;
    case 'exp_bonus':
      newPlayer.skills.expBonusLevel = Math.min(10, newPlayer.skills.expBonusLevel + 1);
      break;
    case 'haisui_no_jin':
      newPlayer.skills.haisuiNoJin = true;
      break;
    case 'zekkouchou':
      newPlayer.skills.zekkouchou = true;
      break;
    case 'magic_thunder':
      newPlayer.magics.thunder = Math.min(3, newPlayer.magics.thunder + 1);
      break;
    case 'magic_ice':
      newPlayer.magics.ice = Math.min(3, newPlayer.magics.ice + 1);
      break;
    case 'magic_fire':
      newPlayer.magics.fire = Math.min(3, newPlayer.magics.fire + 1);
      break;
    case 'magic_heal':
      newPlayer.magics.heal = Math.min(3, newPlayer.magics.heal + 1);
      break;
    case 'magic_buffer':
      newPlayer.magics.buffer = Math.min(3, newPlayer.magics.buffer + 1);
      break;
    case 'magic_debuffer':
      newPlayer.magics.debuffer = Math.min(3, newPlayer.magics.debuffer + 1);
      break;
    case 'magic_hint':
      newPlayer.magics.hint = Math.min(3, newPlayer.magics.hint + 1);
      break;
  }
  
  return newPlayer;
};

// ===== 経験値計算 =====
// 15レベルで必要経験値を頭打ちにする（サクサクレベルアップ）
const EXP_CAP_LEVEL = 15;
export const calculateExpToNextLevel = (level: number): number => {
  const effectiveLevel = Math.min(level, EXP_CAP_LEVEL);
  return Math.floor(EXP_BASE * Math.pow(EXP_LEVEL_FACTOR, effectiveLevel - 1));
};

export const addExp = (player: PlayerState, exp: number): { player: PlayerState; leveledUp: boolean; levelUpCount: number } => {
  const newPlayer = { ...player };
  newPlayer.exp += exp;
  let levelUpCount = 0;
  
  while (newPlayer.exp >= newPlayer.expToNextLevel) {
    newPlayer.exp -= newPlayer.expToNextLevel;
    newPlayer.level += 1;
    newPlayer.expToNextLevel = calculateExpToNextLevel(newPlayer.level);
    levelUpCount += 1;
  }
  
  return { player: newPlayer, leveledUp: levelUpCount > 0, levelUpCount };
};

// ===== ダメージテキスト生成 =====
export const createDamageText = (x: number, y: number, damage: number, isCritical: boolean = false, customColor?: string): DamageText => ({
  id: `dmg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  x: x + (Math.random() - 0.5) * 20,
  y: y - 20,
  damage,
  color: customColor ?? (isCritical ? '#ff0' : '#fff'),
  startTime: Date.now(),
  duration: 1000,
});

// ===== マジッククールダウン計算 =====
export const getMagicCooldown = (reloadMagic: number): number => {
  // RELOAD +1 = 1秒短縮、基本10秒、最小3秒
  return Math.max(MAGIC_MIN_COOLDOWN, MAGIC_BASE_COOLDOWN - reloadMagic * 1);
};

// ===== 魔法発動 =====
export const castMagic = (
  magicType: MagicType,
  level: number,
  player: PlayerState,
  enemies: EnemyState[],
  luckResult?: LuckResult  // 運の結果（任意）
): { enemies: EnemyState[]; player: PlayerState; damageTexts: DamageText[]; luckResult?: LuckResult } => {
  const damageTexts: DamageText[] = [];
  let updatedPlayer = { ...player };
  let updatedEnemies = [...enemies];
  
  // 背水の陣・絶好調の効果を取得
  const condMultipliers = getConditionalSkillMultipliers(player);
  const effectiveCAtk = Math.floor(player.stats.cAtk * condMultipliers.atkMultiplier);
  
  // 運の判定（渡されていなければ新たに判定）
  const luck = luckResult ?? checkLuck(player.stats.luck);
  
  // TIME効果: 1ポイントにつき2秒延長
  // 運発動時はTIME2倍
  const baseDuration = 5 + (level - 1) * 5;  // 5/10/15秒
  const timeBonus = player.stats.time * 2 * condMultipliers.timeMultiplier;  // 2秒/ポイント
  const luckTimeMultiplier = luck.doubleTime ? 2 : 1;
  const totalDuration = (baseDuration + timeBonus) * luckTimeMultiplier;
  
  // バッファー/デバッファーのレベルを取得
  const bufferEffect = player.statusEffects.find(e => e.type === 'buffer');
  const bufferLevel = bufferEffect?.level ?? 0;
  const isBuffed = bufferLevel > 0;
  
  switch (magicType) {
    case 'thunder':
      // 画面上の敵にランダムダメージ
      updatedEnemies = enemies.map(enemy => {
        const debufferEffect = enemy.statusEffects.find(e => e.type === 'debuffer');
        const debufferLevel = debufferEffect?.level ?? 0;
        const isDebuffed = debufferLevel > 0;
        
        const damage = calculateDamage(
          20 * level, effectiveCAtk, enemy.stats.def,
          isBuffed, isDebuffed, bufferLevel, debufferLevel, player.stats.cAtk
        );
        damageTexts.push(createDamageText(enemy.x, enemy.y, damage));
        return {
          ...enemy,
          stats: {
            ...enemy.stats,
            hp: Math.max(0, enemy.stats.hp - damage),
          },
        };
      });
      break;
      
    case 'ice':
      // 敵を凍結
      updatedEnemies = enemies.map(enemy => ({
        ...enemy,
        statusEffects: [
          ...enemy.statusEffects.filter(e => e.type !== 'ice'),
          { type: 'ice' as const, duration: totalDuration, startTime: Date.now(), level },
        ],
      }));
      break;
      
    case 'fire': {
      // 自分の周りに炎の渦（プレイヤーにバフとして付与 + 周囲の敵にダメージ）
      const fireRange = 100 + level * 30; // 炎の範囲（レベルで拡大）
      const fireDamage = Math.floor(15 * level * (1 + effectiveCAtk * 0.05)); // 炎ダメージ
      
      // 範囲内の敵にダメージ
      updatedEnemies = enemies.map(enemy => {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= fireRange) {
          const debufferEffect = enemy.statusEffects.find(e => e.type === 'debuffer');
          const debufferLevel = debufferEffect?.level ?? 0;
          const isDebuffed = debufferLevel > 0;
          
          const damage = calculateDamage(
            fireDamage, effectiveCAtk, enemy.stats.def,
            isBuffed, isDebuffed, bufferLevel, debufferLevel, player.stats.cAtk
          );
          damageTexts.push(createDamageText(enemy.x, enemy.y, damage, false, '#ff6b35'));
          return {
            ...enemy,
            stats: {
              ...enemy.stats,
              hp: Math.max(0, enemy.stats.hp - damage),
            },
          };
        }
        return enemy;
      });
      
      // プレイヤーに炎バフを付与
      updatedPlayer = {
        ...player,
        statusEffects: [
          ...player.statusEffects.filter(e => e.type !== 'fire'),
          { type: 'fire' as const, duration: totalDuration, startTime: Date.now(), level },
        ],
      };
      break;
    }
      
    case 'heal': {
      // HP回復
      const healAmount = Math.floor(player.stats.maxHp * (0.2 + level * 0.1));
      updatedPlayer = {
        ...player,
        stats: {
          ...player.stats,
          hp: Math.min(player.stats.maxHp, player.stats.hp + healAmount),
        },
      };
      // 回復エフェクトを追加（緑色）
      damageTexts.push(createDamageText(player.x, player.y, healAmount, false, '#4ade80'));
      break;
    }
      
    case 'buffer':
      // バフ
      updatedPlayer = {
        ...player,
        statusEffects: [
          ...player.statusEffects.filter(e => e.type !== 'buffer'),
          { type: 'buffer' as const, duration: totalDuration, startTime: Date.now(), level },
        ],
      };
      break;
      
    case 'debuffer':
      // 敵にデバフ
      updatedEnemies = enemies.map(enemy => ({
        ...enemy,
        statusEffects: [
          ...enemy.statusEffects.filter(e => e.type !== 'debuffer'),
          { type: 'debuffer' as const, duration: totalDuration, startTime: Date.now(), level },
        ],
      }));
      break;
      
    case 'hint':
      // ヒント表示（プレイヤーにバフとして付与）
      updatedPlayer = {
        ...player,
        statusEffects: [
          ...player.statusEffects.filter(e => e.type !== 'hint'),
          { type: 'hint' as const, duration: totalDuration, startTime: Date.now(), level },
        ],
      };
      break;
  }
  
  return { enemies: updatedEnemies, player: updatedPlayer, damageTexts, luckResult: luck };
};

// ===== コイン生成 =====
const COIN_LIFETIME = Infinity;  // コインの生存時間（無限 - 消えない）

export const createCoinsFromEnemy = (enemy: EnemyState, expMultiplier: number): Coin[] => {
  const baseExp = enemy.isBoss ? 50 : 10;
  const totalExp = Math.floor(baseExp * expMultiplier);
  
  // 複数のコインに分割（より大きな敵は多くのコインを落とす）
  const coinCount = enemy.isBoss ? 5 : Math.floor(Math.random() * 2) + 1;
  const expPerCoin = Math.ceil(totalExp / coinCount);
  
  const coins: Coin[] = [];
  for (let i = 0; i < coinCount; i++) {
    // 敵の位置周辺にランダムに散らばる
    const offsetX = (Math.random() - 0.5) * 40;
    const offsetY = (Math.random() - 0.5) * 40;
    
    coins.push({
      id: `coin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x: enemy.x + offsetX,
      y: enemy.y + offsetY,
      exp: expPerCoin,
      startTime: Date.now(),
      lifetime: COIN_LIFETIME,
    });
  }
  
  return coins;
};

// ===== コイン拾得判定 =====
const COIN_PICKUP_RADIUS = 50;  // コイン拾得半径

export const collectCoins = (
  player: PlayerState,
  coins: Coin[]
): { player: PlayerState; remainingCoins: Coin[]; collectedExp: number; leveledUp: boolean; levelUpCount: number } => {
  let totalExp = 0;
  const remainingCoins: Coin[] = [];
  
  // 経験値ボーナス（コイン1枚あたり+1 × レベル）
  const expBonus = player.skills.expBonusLevel;
  
  coins.forEach(coin => {
    const dx = coin.x - player.x;
    const dy = coin.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < COIN_PICKUP_RADIUS) {
      totalExp += coin.exp + expBonus;
    } else {
      remainingCoins.push(coin);
    }
  });
  
  if (totalExp > 0) {
    const { player: newPlayer, leveledUp, levelUpCount } = addExp(player, totalExp);
    return { player: newPlayer, remainingCoins, collectedExp: totalExp, leveledUp, levelUpCount };
  }
  
  return { player, remainingCoins, collectedExp: 0, leveledUp: false, levelUpCount: 0 };
};

// ===== 期限切れコインのクリーンアップ =====
export const cleanupExpiredCoins = (coins: Coin[]): Coin[] => {
  const now = Date.now();
  return coins.filter(coin => now - coin.startTime < coin.lifetime);
};

// ===== 敵が弾を撃つタイプかどうか =====
const SHOOTING_ENEMY_TYPES: EnemyType[] = ['skeleton', 'ghost', 'demon', 'dragon'];
const ENEMY_PROJECTILE_SPEED = 200;  // 敵弾の速度（px/秒）
const ENEMY_SHOOT_COOLDOWN = 2;      // 敵の射撃クールダウン（秒）

export const canEnemyShoot = (enemyType: EnemyType): boolean => {
  return SHOOTING_ENEMY_TYPES.includes(enemyType);
};

// ===== 敵の弾丸生成 =====
export const createEnemyProjectile = (
  enemy: EnemyState,
  playerX: number,
  playerY: number
): EnemyProjectile => {
  const dx = playerX - enemy.x;
  const dy = playerY - enemy.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  return {
    id: `enemyproj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    x: enemy.x,
    y: enemy.y,
    dx: dist > 0 ? dx / dist : 0,
    dy: dist > 0 ? dy / dist : 0,
    damage: Math.floor(enemy.stats.atk * 0.5),  // 体当たりより弱いダメージ
    speed: ENEMY_PROJECTILE_SPEED,
  };
};

// ===== 敵の弾丸更新 =====
export const updateEnemyProjectiles = (
  projectiles: EnemyProjectile[],
  deltaTime: number
): EnemyProjectile[] => {
  return projectiles
    .map(proj => ({
      ...proj,
      x: proj.x + proj.dx * proj.speed * deltaTime,
      y: proj.y + proj.dy * proj.speed * deltaTime,
    }))
    .filter(proj => 
      proj.x > -50 && proj.x < MAP_CONFIG.width + 50 &&
      proj.y > -50 && proj.y < MAP_CONFIG.height + 50
    );
};

// ===== 敵の射撃判定（確率ベース） =====
export const shouldEnemyShoot = (
  enemy: EnemyState,
  playerX: number,
  playerY: number,
  elapsedTime: number
): boolean => {
  if (!canEnemyShoot(enemy.type)) return false;
  
  // 凍結・デバフ中は撃てない
  if (enemy.statusEffects.some(e => e.type === 'ice' || e.type === 'debuffer')) {
    return false;
  }
  
  // プレイヤーとの距離が近すぎると撃たない（150px以内）
  const dx = playerX - enemy.x;
  const dy = playerY - enemy.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 150) return false;
  
  // 距離が遠すぎても撃たない（500px以上）
  if (dist > 500) return false;
  
  // 確率で射撃（2秒に1回くらい）
  // フレームごとに呼ばれるので確率を低くする
  const shootProbability = 0.02;  // 約2%/フレーム（60FPSで約1.2秒に1回）
  return Math.random() < shootProbability;
};
