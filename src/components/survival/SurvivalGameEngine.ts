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
  SurvivalCharacter,
  CharacterLevel10Bonus,
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
export const MAX_ENEMIES = Infinity;     // 敵の最大数（制限なし）
export const MAX_PROJECTILES = 200;      // 弾丸の最大数
export const MAX_COINS = 300;            // コインの最大数

// HP上限値
const MAX_HP_CAP = 1000;

// ===== 初期状態 =====
const createInitialPlayerState = (): PlayerState => ({
  x: MAP_CONFIG.width / 2,
  y: MAP_CONFIG.height / 2,
  direction: 'right',
  stats: {
    aAtk: 10,
    bAtk: 15,
    cAtk: 20,
    speed: 0,  // 初期移動速度を遅く（以前は1）
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
    autoSelect: false,  // オート選択
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

// ===== キャラクター能力を初期状態に適用 =====
export const applyCharacterToPlayerState = (
  player: PlayerState,
  character: SurvivalCharacter
): PlayerState => {
  const p = { ...player };
  p.stats = { ...player.stats };
  p.skills = { ...player.skills };
  p.magics = { ...player.magics };

  // 初期ステータス上書き
  const stats = character.initialStats;
  if (stats.aAtk !== undefined) p.stats.aAtk = stats.aAtk;
  if (stats.bAtk !== undefined) p.stats.bAtk = stats.bAtk;
  if (stats.cAtk !== undefined) p.stats.cAtk = stats.cAtk;
  if (stats.speed !== undefined) p.stats.speed = stats.speed;
  if (stats.reloadMagic !== undefined) p.stats.reloadMagic = stats.reloadMagic;
  if (stats.hp !== undefined) p.stats.hp = stats.hp;
  if (stats.maxHp !== undefined) p.stats.maxHp = stats.maxHp;
  if (stats.def !== undefined) p.stats.def = stats.def;
  if (stats.time !== undefined) p.stats.time = stats.time;
  if (stats.aBulletCount !== undefined) p.stats.aBulletCount = stats.aBulletCount;
  if (stats.luck !== undefined) p.stats.luck = stats.luck;

  // 初期スキル適用
  const skills = character.initialSkills;
  if (skills.aPenetration !== undefined) p.skills.aPenetration = skills.aPenetration;
  if (skills.bKnockbackBonus !== undefined) p.skills.bKnockbackBonus = skills.bKnockbackBonus;
  if (skills.bRangeBonus !== undefined) p.skills.bRangeBonus = skills.bRangeBonus;
  if (skills.bDeflect !== undefined) p.skills.bDeflect = skills.bDeflect;
  if (skills.multiHitLevel !== undefined) p.skills.multiHitLevel = skills.multiHitLevel;
  if (skills.expBonusLevel !== undefined) p.skills.expBonusLevel = skills.expBonusLevel;
  if (skills.haisuiNoJin !== undefined) p.skills.haisuiNoJin = skills.haisuiNoJin;
  if (skills.zekkouchou !== undefined) p.skills.zekkouchou = skills.zekkouchou;
  if (skills.autoSelect !== undefined) p.skills.autoSelect = skills.autoSelect;

  // 初期魔法適用
  const magics = character.initialMagics;
  if (magics.thunder !== undefined) p.magics.thunder = magics.thunder;
  if (magics.ice !== undefined) p.magics.ice = magics.ice;
  if (magics.fire !== undefined) p.magics.fire = magics.fire;
  if (magics.heal !== undefined) p.magics.heal = magics.heal;
  if (magics.buffer !== undefined) p.magics.buffer = magics.buffer;
  if (magics.debuffer !== undefined) p.magics.debuffer = magics.debuffer;
  if (magics.hint !== undefined) p.magics.hint = magics.hint;

  return p;
};

// ===== レベル10ボーナスを適用 =====
export const applyLevel10Bonuses = (
  player: PlayerState,
  bonuses: CharacterLevel10Bonus[]
): { player: PlayerState; messages: string[] } => {
  let p = { ...player };
  p.stats = { ...player.stats };
  p.skills = { ...player.skills };
  p.magics = { ...player.magics };
  const messages: string[] = [];

  for (const bonus of bonuses) {
    switch (bonus.type) {
      case 'max_hp_flat': {
        const prevMaxHp = p.stats.maxHp;
        p.stats.maxHp = Math.min(MAX_HP_CAP, p.stats.maxHp + bonus.value);
        const actualIncrease = p.stats.maxHp - prevMaxHp;
        if (actualIncrease > 0) {
          p.stats.hp += actualIncrease;
          messages.push(`HP +${actualIncrease}`);
        }
        break;
      }
      case 'exp_bonus': {
        const maxVal = bonus.max ?? 10;
        if (p.skills.expBonusLevel < maxVal) {
          p.skills.expBonusLevel = Math.min(maxVal, p.skills.expBonusLevel + bonus.value);
          messages.push(`EXP Bonus +${bonus.value}`);
        }
        break;
      }
      case 'a_atk':
        p.stats.aAtk += bonus.value;
        messages.push(`A ATK +${bonus.value}`);
        break;
      case 'b_atk':
        p.stats.bAtk += bonus.value;
        messages.push(`B ATK +${bonus.value}`);
        break;
      case 'c_atk':
        p.stats.cAtk += bonus.value;
        messages.push(`Magic ATK +${bonus.value}`);
        break;
      case 'speed':
        p.stats.speed += bonus.value;
        messages.push(`SPEED +${bonus.value}`);
        break;
      case 'reload_magic':
        p.stats.reloadMagic = Math.min(20, p.stats.reloadMagic + bonus.value);
        messages.push(`RELOAD +${bonus.value}`);
        break;
      case 'time':
        p.stats.time += bonus.value;
        messages.push(`TIME +${bonus.value}`);
        break;
      case 'a_bullet':
        p.stats.aBulletCount += bonus.value;
        messages.push(`Bullets +${bonus.value}`);
        break;
      case 'b_knockback':
        p.skills.bKnockbackBonus += bonus.value;
        messages.push(`Knockback +${bonus.value}`);
        break;
      case 'b_range':
        p.skills.bRangeBonus += bonus.value;
        messages.push(`Range +${bonus.value}`);
        break;
      case 'luck_pendant':
        p.stats.luck = Math.min(40, p.stats.luck + bonus.value);
        messages.push(`LUCK +${bonus.value}`);
        break;
      default:
        break;
    }
  }

  return { player: p, messages };
};

const createEmptyCodeSlot = (type: 'A' | 'B' | 'C' | 'D', chord: ChordDefinition | null = null): CodeSlot => ({
  type,
  chord,
  correctNotes: [],
  timer: SLOT_TIMEOUT,
  isCompleted: false,
  isEnabled: type !== 'C' && type !== 'D',  // C列・D列は魔法取得まで無効
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
  aSlotCooldown: 0,
  bSlotCooldown: 0,
  cSlotCooldown: 0,
  dSlotCooldown: 0,
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

const getEnemyBaseStats = (type: EnemyType, elapsedTime: number, multiplier: number, waveNumber: number = 1) => {
  // 時間経過による強化（30秒ごとに15%強化、10分以降はさらに加速）
  const baseTimeBonus = Math.floor(elapsedTime / 30) * 0.15;
  // 10分（600秒）以降は追加で強化
  const lateGameBonus = elapsedTime >= 600 ? (elapsedTime - 600) / 60 * 0.3 : 0;  // 1分ごとに30%追加
  const timeBonus = baseTimeBonus + lateGameBonus;
  
  // 敵のデフォルトHPは2倍に設定
  const baseStats: Record<EnemyType, { atk: number; def: number; hp: number; speed: number }> = {
    slime: { atk: 5, def: 2, hp: 60, speed: 0.8 },
    goblin: { atk: 8, def: 3, hp: 80, speed: 1.0 },
    skeleton: { atk: 10, def: 5, hp: 100, speed: 0.9 },
    zombie: { atk: 12, def: 4, hp: 120, speed: 0.6 },
    bat: { atk: 6, def: 2, hp: 50, speed: 1.4 },
    ghost: { atk: 15, def: 1, hp: 70, speed: 1.1 },
    orc: { atk: 18, def: 8, hp: 160, speed: 0.7 },
    demon: { atk: 25, def: 10, hp: 200, speed: 0.9 },
    dragon: { atk: 35, def: 15, hp: 300, speed: 0.8 },
    boss: { atk: 50, def: 20, hp: 600, speed: 0.6 },
  };
  
  const base = baseStats[type];
  const totalMultiplier = multiplier * (1 + timeBonus);
  
  // WAVEごとの敵HP加算（+50/WAVE、5の倍数WAVEでは+500）
  let waveHpBonus = 0;
  for (let w = 2; w <= waveNumber; w++) {
    waveHpBonus += (w % 5 === 0) ? 500 : 50;
  }
  
  const baseHp = Math.floor(base.hp * totalMultiplier) + waveHpBonus;
  
  return {
    atk: Math.floor(base.atk * totalMultiplier),
    def: Math.floor(base.def * totalMultiplier),
    hp: baseHp,
    maxHp: baseHp,
    speed: base.speed,
  };
};

export const spawnEnemy = (
  playerX: number,
  playerY: number,
  elapsedTime: number,
  config: DifficultyConfig,
  waveNumber: number = 1
): EnemyState => {
  // プレイヤーから一定距離離れた位置にスポーン
  const spawnDistance = 400 + Math.random() * 200;
  const angle = Math.random() * Math.PI * 2;
  
  let x = playerX + Math.cos(angle) * spawnDistance;
  let y = playerY + Math.sin(angle) * spawnDistance;
  
  // マップ範囲内に収める
  x = Math.max(ENEMY_SIZE, Math.min(MAP_CONFIG.width - ENEMY_SIZE, x));
  y = Math.max(ENEMY_SIZE, Math.min(MAP_CONFIG.height - ENEMY_SIZE, y));
  
  // 経過時間に応じて敵タイプの上限を上げる（1分ごとに1タイプ解禁）
  const maxTypeIndex = Math.min(
    Math.floor(elapsedTime / 60) + 2,  // 最初は0,1,2(slime,goblin,skeleton)から
    ENEMY_TYPES.length - 1
  );
  
  // 10分（600秒）以降は強い敵の出現確率が上がる
  const isLateGame = elapsedTime >= 600;
  
  // 重み付きランダム
  // 通常: 弱い敵ほど出現確率が高い（0.6の指数減衰）
  // 10分以降: 強い敵の出現確率が上がる（0.8の指数減衰 + 最小インデックスを上げる）
  let typeIndex = 0;
  const rand = Math.random();
  let cumulative = 0;
  
  // 10分以降は最低でもgoblin(1)から、15分以降はskeleton(2)から
  const minTypeIndex = isLateGame 
    ? Math.min(Math.floor((elapsedTime - 600) / 300) + 1, maxTypeIndex - 2)  // 5分ごとに最低ラインが上がる
    : 0;
  
  // 減衰係数：10分以降は0.75（強い敵が出やすい）
  const decayFactor = isLateGame ? 0.75 : 0.6;
  
  for (let i = minTypeIndex; i <= maxTypeIndex; i++) {
    // 各敵タイプの重み（指数減衰）
    const adjustedIndex = i - minTypeIndex;  // minTypeIndexを基準に調整
    const weight = Math.pow(decayFactor, adjustedIndex);
    const totalWeight = (1 - Math.pow(decayFactor, maxTypeIndex - minTypeIndex + 1)) / (1 - decayFactor);
    const normalizedWeight = weight / totalWeight;
    cumulative += normalizedWeight;
    if (rand < cumulative) {
      typeIndex = i;
      break;
    }
    typeIndex = i;  // フォールバック
  }
  
  const type = ENEMY_TYPES[typeIndex];
  
  // ボス出現確率：1分以降5%、10分以降10%
  const bossChance = isLateGame ? 0.10 : 0.05;
  const isBoss = Math.random() < bossChance && elapsedTime > 60;
  
  return {
    id: `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    x,
    y,
    stats: getEnemyBaseStats(type, elapsedTime, isBoss ? config.enemyStatMultiplier * 2 : config.enemyStatMultiplier, waveNumber),
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

// ===== 時計方向の弾の角度計算 =====
// 弾数に応じて時計方向に弾を配置
// 1個目: 12時（前方）
// 2個目以降: 2時間間隔（30度）で交互に追加
// 12等分完了後: 1分（0.5度）ずつ追加
export const getClockwiseBulletAngles = (bulletCount: number, baseAngle: number): number[] => {
  const angles: number[] = [];
  
  if (bulletCount <= 0) return angles;
  
  // 30度 = 2時間分の角度
  const hourAngle = Math.PI / 6; // 30度
  const minuteAngle = Math.PI / 360; // 0.5度
  
  // 12時方向（基準方向）から開始
  angles.push(baseAngle);
  
  let addedCount = 1;
  let hourOffset = 0;
  let minuteOffset = 0;
  
  while (addedCount < bulletCount) {
    hourOffset++;
    
    // 12時間（360度）を超えたら分で調整
    if (hourOffset > 6) {
      minuteOffset++;
      hourOffset = 1;
    }
    
    const angleOffset = hourOffset * hourAngle + minuteOffset * minuteAngle;
    
    // 右回り（時計回り）に追加: 2時、4時、6時...
    if (addedCount < bulletCount) {
      angles.push(baseAngle + angleOffset);
      addedCount++;
    }
    
    // 左回り（反時計回り）に追加: 10時、8時、6時...
    if (addedCount < bulletCount && hourOffset <= 6) {
      angles.push(baseAngle - angleOffset);
      addedCount++;
    }
  }
  
  return angles;
};

// 方向からラジアン角度を取得
export const getDirectionAngle = (direction: Direction): number => {
  const angles: Record<Direction, number> = {
    'up': -Math.PI / 2,      // -90度（上向き）
    'down': Math.PI / 2,     // 90度（下向き）
    'left': Math.PI,         // 180度（左向き）
    'right': 0,              // 0度（右向き）
    'up-left': -Math.PI * 3 / 4,   // -135度
    'up-right': -Math.PI / 4,      // -45度
    'down-left': Math.PI * 3 / 4,  // 135度
    'down-right': Math.PI / 4,     // 45度
  };
  return angles[direction];
};

// 角度からベクトルを取得
export const getVectorFromAngle = (angle: number): { x: number; y: number } => {
  return {
    x: Math.cos(angle),
    y: Math.sin(angle),
  };
};

// ===== 攻撃処理 =====
// A列（遠距離）弾丸のダメージ計算（A ATK +1 で約5ダメージ増加）
const INITIAL_A_ATK = 10;  // 初期A ATK値
const A_ATK_DAMAGE_MULTIPLIER = 5;  // A ATK +1あたりのダメージ増加量
const A_BASE_DAMAGE = 14;  // 基本ダメージ（初期A ATKでのダメージ）
const A_PROJECTILE_MAX_RANGE = 900; // A弾の最大射程（px）

export const calculateAProjectileDamage = (aAtk: number): number => {
  // 初期状態（aAtk=10）でA_BASE_DAMAGE、+1ごとにA_ATK_DAMAGE_MULTIPLIER増加
  return A_BASE_DAMAGE + (aAtk - INITIAL_A_ATK) * A_ATK_DAMAGE_MULTIPLIER;
};

// B列（近接）攻撃のダメージ計算（B ATK +1 で10ダメージ増加）
const INITIAL_B_ATK = 15;  // 初期B ATK値
const B_ATK_DAMAGE_MULTIPLIER = 10;  // B ATK +1あたりのダメージ増加量
const B_BASE_DAMAGE = 20;  // 基本ダメージ（初期B ATKでのダメージ）

export const calculateBMeleeDamage = (bAtk: number): number => {
  // 初期状態（bAtk=15）でB_BASE_DAMAGE、+1ごとにB_ATK_DAMAGE_MULTIPLIER増加
  return B_BASE_DAMAGE + (bAtk - INITIAL_B_ATK) * B_ATK_DAMAGE_MULTIPLIER;
};

// C列（魔法）攻撃のダメージ計算（C ATK +1 で10ダメージ増加）
const INITIAL_C_ATK = 20;  // 初期C ATK値
const C_ATK_DAMAGE_MULTIPLIER = 10;  // C ATK +1あたりのダメージ増加量

export const calculateCMagicDamage = (cAtk: number, baseSpellDamage: number): number => {
  // 基本呪文ダメージ + (C ATK - 初期値) × 10
  return baseSpellDamage + (cAtk - INITIAL_C_ATK) * C_ATK_DAMAGE_MULTIPLIER;
};

export const createProjectile = (
  player: PlayerState,
  direction: Direction,
  damage: number
): Projectile => ({
  id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  x: player.x,
  y: player.y,
  direction,
  damage,
  remainingRange: A_PROJECTILE_MAX_RANGE,
  penetrating: player.skills.aPenetration,
  hitEnemies: new Set(),
});

// 角度ベースで弾丸を作成（時計方向システム用）
export const createProjectileFromAngle = (
  player: PlayerState,
  angle: number,
  damage: number
): Projectile & { angle: number } => ({
  id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  x: player.x,
  y: player.y,
  direction: 'right', // 互換性のため（実際の移動はangleで計算）
  damage,
  remainingRange: A_PROJECTILE_MAX_RANGE,
  penetrating: player.skills.aPenetration,
  hitEnemies: new Set(),
  angle, // 弾丸の移動方向（ラジアン）
});

export const updateProjectiles = (
  projectiles: Projectile[],
  deltaTime: number
): Projectile[] => {
  const PROJECTILE_SPEED = 500;
  const travelDistance = PROJECTILE_SPEED * deltaTime;
  
  return projectiles
    .map(proj => {
      // angle が設定されている場合は角度ベースで移動、それ以外は direction ベース
      let vec: { x: number; y: number };
      if (proj.angle !== undefined) {
        vec = getVectorFromAngle(proj.angle);
      } else {
        vec = getDirectionVector(proj.direction);
      }
      return {
        ...proj,
        x: proj.x + vec.x * PROJECTILE_SPEED * deltaTime,
        y: proj.y + vec.y * PROJECTILE_SPEED * deltaTime,
        remainingRange: proj.remainingRange - travelDistance,
      };
    })
    .filter(proj => 
      proj.remainingRange > 0 &&
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
type BonusDefinition = {
  type: BonusType;
  displayName: string;
  description: string;
  icon: string;
  maxLevel?: number;
};

const ALL_BONUSES: BonusDefinition[] = [
  // ステータス系
  { type: 'a_atk', displayName: '遠距離 ATK +1', description: '遠距離攻撃力アップ（+10ダメージ）', icon: '🔫' },
  { type: 'b_atk', displayName: '近接 ATK +1', description: '近接攻撃力アップ（+10ダメージ）', icon: '👊' },
  { type: 'c_atk', displayName: '魔法 ATK +1', description: '魔法攻撃力アップ（+10ダメージ）', icon: '🪄' },
  { type: 'speed', displayName: 'SPEED +1', description: '移動速度アップ', icon: '👟' },
  { type: 'reload_magic', displayName: 'RELOAD +1', description: '魔法リロード短縮', icon: '⏱️', maxLevel: 20 },
  { type: 'max_hp', displayName: 'HP +20%', description: '最大HPアップ', icon: '❤️' },
  { type: 'def', displayName: 'DEF +1', description: '防御力アップ', icon: '🛡️' },
  { type: 'time', displayName: 'TIME +1', description: '効果時間+2秒', icon: '⏰' },
  { type: 'a_bullet', displayName: '遠距離弾数 +2', description: '時計方向に弾を追加', icon: '💫' },
  { type: 'luck_pendant', displayName: '幸運のペンダント', description: '運+1%（ダメージ2倍等の確率UP）', icon: '🍀', maxLevel: 40 },
  // 特殊系
  { type: 'a_penetration', displayName: '貫通', description: '遠距離弾が敵を貫通', icon: '➡️', maxLevel: 1 },
  { type: 'b_knockback', displayName: 'ノックバック+', description: '近接攻撃のノックバック距離増加', icon: '💨' },
  { type: 'b_range', displayName: '攻撃範囲+', description: '近接攻撃範囲拡大', icon: '📐' },
  { type: 'b_deflect', displayName: '拳でかきけす', description: '近接攻撃で敵弾消去', icon: '✊', maxLevel: 1 },
  { type: 'multi_hit', displayName: '近距離多段ヒット', description: '近距離攻撃の攻撃回数増加', icon: '✨', maxLevel: 3 },
  { type: 'exp_bonus', displayName: '経験値+1', description: 'コイン獲得経験値+1', icon: '💰', maxLevel: 10 },
  { type: 'haisui_no_jin', displayName: '背水の陣', description: 'HP15%以下で大幅強化', icon: '🩸', maxLevel: 1 },
  { type: 'zekkouchou', displayName: '絶好調', description: 'HP満タンで攻撃強化', icon: '😊', maxLevel: 1 },
  { type: 'auto_select', displayName: 'オート選択', description: 'レベルアップボーナスを自動選択', icon: '🤖', maxLevel: 1 },
  // 魔法系
  { type: 'magic_thunder', displayName: 'THUNDER', description: '雷魔法', icon: '⚡', maxLevel: 3 },
  { type: 'magic_ice', displayName: 'ICE', description: '氷魔法', icon: '❄️', maxLevel: 3 },
  { type: 'magic_fire', displayName: 'FIRE', description: '炎魔法', icon: '🔥', maxLevel: 3 },
  { type: 'magic_heal', displayName: 'HEAL', description: '回復魔法', icon: '💚', maxLevel: 3 },
  { type: 'magic_buffer', displayName: 'BUFFER', description: 'バフ魔法', icon: '⬆️', maxLevel: 3 },
  { type: 'magic_debuffer', displayName: 'DEBUFFER', description: 'デバフ魔法', icon: '⬇️', maxLevel: 3 },
  { type: 'magic_hint', displayName: 'HINT', description: 'ヒント魔法', icon: '💡', maxLevel: 3 },
];

const getCurrentBonusLevel = (player: PlayerState, type: BonusType): number => {
  switch (type) {
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

const getAvailableBonuses = (
  player: PlayerState,
  excludedBonuses?: string[],
  noMagic?: boolean
): BonusDefinition[] => {
  return ALL_BONUSES.filter((bonus) => {
    if (excludedBonuses && excludedBonuses.includes(bonus.type)) return false;
    if (
      noMagic &&
      (bonus.type.startsWith('magic_') ||
        bonus.type === 'c_atk' ||
        bonus.type === 'reload_magic')
    ) {
      return false;
    }
    // HP上限チェック: maxHpがMAX_HP_CAP以上なら最大HPボーナスを除外
    if (bonus.type === 'max_hp' && player.stats.maxHp >= MAX_HP_CAP) {
      return false;
    }
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
        case 'auto_select':
          return !player.skills.autoSelect;
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
        default:
          break;
      }
    }
    return true;
  });
};

export const generateAutoSelectBonus = (
  player: PlayerState,
  allowedChords: string[],
  excludedBonuses?: string[],
  noMagic?: boolean
): LevelUpBonus | null => {
  const available = getAvailableBonuses(player, excludedBonuses, noMagic);
  if (available.length === 0) {
    return null;
  }
  const selectedBonus = available[Math.floor(Math.random() * available.length)];
  const chord = selectRandomChord(allowedChords);
  if (!chord) {
    return null;
  }
  return {
    ...selectedBonus,
    chord,
    currentLevel: getCurrentBonusLevel(player, selectedBonus.type),
  };
};

export const generateLevelUpOptions = (
  player: PlayerState,
  allowedChords: string[],
  excludedBonuses?: string[],
  noMagic?: boolean,
  choiceCount: number = 3
): LevelUpBonus[] => {
  const available = getAvailableBonuses(player, excludedBonuses, noMagic);
  
  // ランダムにchoiceCount個選択
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, choiceCount);
  
  // コードを割り当て（重複しないように）
  const usedChordIds: string[] = [];
  const result: LevelUpBonus[] = [];
  
  for (const bonus of selected) {
    const chord = selectRandomChord(allowedChords, usedChordIds);
    if (chord) {
      usedChordIds.push(chord.id);
      result.push({
        ...bonus,
        chord,
        currentLevel: getCurrentBonusLevel(player, bonus.type),
      });
    }
  }
  
  // 有効なオプションがchoiceCount未満の場合、重複を許可して再試行
  while (result.length < choiceCount && result.length < selected.length) {
    const remainingBonuses = selected.filter(b => !result.some(r => r.type === b.type));
    if (remainingBonuses.length === 0) break;
    
    const bonus = remainingBonuses[0];
    const chord = selectRandomChord(allowedChords);
    if (chord) {
      result.push({
        ...bonus,
        chord,
        currentLevel: getCurrentBonusLevel(player, bonus.type),
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
      newPlayer.stats.reloadMagic = Math.min(20, newPlayer.stats.reloadMagic + 1);
      break;
    case 'max_hp':
      newPlayer.stats.maxHp = Math.min(MAX_HP_CAP, Math.floor(newPlayer.stats.maxHp * 1.2));
      newPlayer.stats.hp = Math.min(newPlayer.stats.hp + Math.floor(newPlayer.stats.maxHp * 0.2), newPlayer.stats.maxHp);
      break;
    case 'def':
      newPlayer.stats.def += 1;
      break;
    case 'time':
      newPlayer.stats.time += 1;
      break;
    case 'a_bullet':
      // 弾数を2個追加（時計方向に弾が増える）
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
    case 'auto_select':
      newPlayer.skills.autoSelect = true;
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
// 20レベルで必要経験値を頭打ちにする（サクサクレベルアップ）
// レベル50以降は必要経験値が5倍になる
const EXP_CAP_LEVEL = 20;
const EXP_HIGH_LEVEL_THRESHOLD = 50;
const EXP_HIGH_LEVEL_MULTIPLIER = 2;
export const calculateExpToNextLevel = (level: number): number => {
  const effectiveLevel = Math.min(level, EXP_CAP_LEVEL);
  const baseExp = Math.floor(EXP_BASE * Math.pow(EXP_LEVEL_FACTOR, effectiveLevel - 1));
  return level >= EXP_HIGH_LEVEL_THRESHOLD ? baseExp * EXP_HIGH_LEVEL_MULTIPLIER : baseExp;
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
  // RELOAD +1で1秒短縮（0.5秒→1秒に変更）
  return Math.max(MAGIC_MIN_COOLDOWN, MAGIC_BASE_COOLDOWN - reloadMagic * 1.0);
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
      // 画面上の敵にランダムダメージ（C ATK +1で10ダメージ増加）
      updatedEnemies = enemies.map(enemy => {
        const debufferEffect = enemy.statusEffects.find(e => e.type === 'debuffer');
        const debufferLevel = debufferEffect?.level ?? 0;
        const isDebuffed = debufferLevel > 0;
        
        // 基本呪文ダメージ（レベル1: 30, レベル2: 50, レベル3: 70）にC ATKボーナスを加算
        const baseThunderDamage = 30 + (level - 1) * 20;
        const cMagicDamage = calculateCMagicDamage(player.stats.cAtk, baseThunderDamage);
        
        const damage = calculateDamage(
          Math.floor(cMagicDamage * condMultipliers.atkMultiplier), 0, enemy.stats.def,
          isBuffed, isDebuffed, bufferLevel, debufferLevel, player.stats.cAtk, luck.doubleDamage
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
      // 基本炎ダメージ（レベル1: 25, レベル2: 40, レベル3: 55）にC ATKボーナスを加算
      const baseFireDamage = 25 + (level - 1) * 15;
      const fireDamage = Math.floor(calculateCMagicDamage(player.stats.cAtk, baseFireDamage) * condMultipliers.atkMultiplier);
      
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
            fireDamage, 0, enemy.stats.def,
            isBuffed, isDebuffed, bufferLevel, debufferLevel, player.stats.cAtk, luck.doubleDamage
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
