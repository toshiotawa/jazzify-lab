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
  },
  skills: {
    aPenetration: false,
    aBackBullet: 0,
    aRightBullet: 0,
    aLeftBullet: 0,
    bKnockbackBonus: 0,
    bRangeBonus: 0,
    multiHitLevel: 0,
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

const createEmptyCodeSlot = (type: 'A' | 'B' | 'C', chord: ChordDefinition | null = null): CodeSlot => ({
  type,
  chord,
  correctNotes: [],
  timer: SLOT_TIMEOUT,
  isCompleted: false,
  isEnabled: type !== 'C',  // C列は魔法取得まで無効
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
    ],
    next: [
      createEmptyCodeSlot('A'),
      createEmptyCodeSlot('B'),
      createEmptyCodeSlot('C'),
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
  const current: [CodeSlot, CodeSlot, CodeSlot] = [
    { ...createEmptyCodeSlot('A'), chord: selectRandomChord(allowedChords) },
    { ...createEmptyCodeSlot('B'), chord: selectRandomChord(allowedChords) },
    { ...createEmptyCodeSlot('C'), chord: hasMagic ? selectRandomChord(allowedChords) : null, isEnabled: hasMagic },
  ];
  
  const next: [CodeSlot, CodeSlot, CodeSlot] = [
    { ...createEmptyCodeSlot('A'), chord: selectRandomChord(allowedChords, current[0].chord?.id) },
    { ...createEmptyCodeSlot('B'), chord: selectRandomChord(allowedChords, current[1].chord?.id) },
    { ...createEmptyCodeSlot('C'), chord: hasMagic ? selectRandomChord(allowedChords, current[2].chord?.id) : null, isEnabled: hasMagic },
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
  const speed = BASE_PLAYER_SPEED * (1 + player.stats.speed * 0.1) * speedMultiplier;
  
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
  penetrating: player.skills.aPenetration,
  hitEnemies: new Set(),
});

export const updateProjectiles = (
  projectiles: Projectile[],
  deltaTime: number
): Projectile[] => {
  const PROJECTILE_SPEED = 500;
  
  return projectiles
    .map(proj => {
      const vec = getDirectionVector(proj.direction);
      return {
        ...proj,
        x: proj.x + vec.x * PROJECTILE_SPEED * deltaTime,
        y: proj.y + vec.y * PROJECTILE_SPEED * deltaTime,
      };
    })
    .filter(proj => 
      proj.x > 0 && proj.x < MAP_CONFIG.width &&
      proj.y > 0 && proj.y < MAP_CONFIG.height
    );
};

// ===== ダメージ計算 =====
export const calculateDamage = (
  baseDamage: number,
  attackerAtk: number,
  defenderDef: number,
  isBuffed: boolean = false,
  isDebuffed: boolean = false
): number => {
  const atkMultiplier = isBuffed ? 1.5 : 1;
  const defMultiplier = isDebuffed ? 0.7 : 1;
  
  const damage = Math.max(1, Math.floor(
    (baseDamage + attackerAtk * atkMultiplier) - (defenderDef * defMultiplier * 0.5)
  ));
  
  return damage;
};

// ===== レベルアップボーナス生成 =====
const ALL_BONUSES: Array<{ type: BonusType; displayName: string; description: string; icon: string; maxLevel?: number }> = [
  // ステータス系
  { type: 'a_atk', displayName: 'A ATK +1', description: '遠距離攻撃力アップ', icon: '🔫' },
  { type: 'b_atk', displayName: 'B ATK +1', description: '近接攻撃力アップ', icon: '👊' },
  { type: 'c_atk', displayName: 'C ATK +1', description: '魔法攻撃力アップ', icon: '🪄' },
  { type: 'speed', displayName: 'SPEED +1', description: '移動速度アップ', icon: '👟' },
  { type: 'reload_magic', displayName: 'RELOAD +1', description: '魔法リロード短縮', icon: '⏱️', maxLevel: 20 },
  { type: 'max_hp', displayName: 'HP +10%', description: '最大HPアップ', icon: '❤️' },
  { type: 'def', displayName: 'DEF +1', description: '防御力アップ', icon: '🛡️' },
  { type: 'time', displayName: 'TIME +1', description: '効果時間延長', icon: '⏰' },
  { type: 'a_bullet', displayName: 'A弾数 +1', description: '同時発射数アップ', icon: '💫' },
  // 特殊系
  { type: 'a_penetration', displayName: '貫通', description: '弾が敵を貫通', icon: '➡️', maxLevel: 1 },
  { type: 'a_back_bullet', displayName: '後方弾', description: '後方にも発射', icon: '⬅️', maxLevel: 3 },
  { type: 'a_right_bullet', displayName: '右側弾', description: '右側にも発射', icon: '↗️', maxLevel: 3 },
  { type: 'a_left_bullet', displayName: '左側弾', description: '左側にも発射', icon: '↖️', maxLevel: 3 },
  { type: 'b_knockback', displayName: 'ノックバック+', description: 'ノックバック距離増加', icon: '💨' },
  { type: 'b_range', displayName: '攻撃範囲+', description: '近接攻撃範囲拡大', icon: '📐' },
  { type: 'multi_hit', displayName: '多段攻撃', description: '攻撃回数増加', icon: '✨', maxLevel: 3 },
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
        case 'a_back_bullet':
          return player.skills.aBackBullet < bonus.maxLevel;
        case 'a_right_bullet':
          return player.skills.aRightBullet < bonus.maxLevel;
        case 'a_left_bullet':
          return player.skills.aLeftBullet < bonus.maxLevel;
        case 'multi_hit':
          return player.skills.multiHitLevel < bonus.maxLevel;
        case 'reload_magic':
          return player.stats.reloadMagic < bonus.maxLevel;
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
      case 'a_back_bullet': return player.skills.aBackBullet;
      case 'a_right_bullet': return player.skills.aRightBullet;
      case 'a_left_bullet': return player.skills.aLeftBullet;
      case 'b_knockback': return player.skills.bKnockbackBonus;
      case 'b_range': return player.skills.bRangeBonus;
      case 'multi_hit': return player.skills.multiHitLevel;
      case 'reload_magic': return player.stats.reloadMagic;
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
      newPlayer.stats.reloadMagic = Math.min(20, newPlayer.stats.reloadMagic + 1);
      break;
    case 'max_hp':
      newPlayer.stats.maxHp = Math.floor(newPlayer.stats.maxHp * 1.1);
      newPlayer.stats.hp = Math.min(newPlayer.stats.hp + Math.floor(newPlayer.stats.maxHp * 0.1), newPlayer.stats.maxHp);
      break;
    case 'def':
      newPlayer.stats.def += 1;
      break;
    case 'time':
      newPlayer.stats.time += 1;
      break;
    case 'a_bullet':
      newPlayer.stats.aBulletCount += 1;
      break;
    case 'a_penetration':
      newPlayer.skills.aPenetration = true;
      break;
    case 'a_back_bullet':
      newPlayer.skills.aBackBullet += 1;
      break;
    case 'a_right_bullet':
      newPlayer.skills.aRightBullet += 1;
      break;
    case 'a_left_bullet':
      newPlayer.skills.aLeftBullet += 1;
      break;
    case 'b_knockback':
      newPlayer.skills.bKnockbackBonus += 1;
      break;
    case 'b_range':
      newPlayer.skills.bRangeBonus += 1;
      break;
    case 'multi_hit':
      newPlayer.skills.multiHitLevel = Math.min(3, newPlayer.skills.multiHitLevel + 1);
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
export const calculateExpToNextLevel = (level: number): number => {
  return Math.floor(EXP_BASE * Math.pow(EXP_LEVEL_FACTOR, level - 1));
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
export const createDamageText = (x: number, y: number, damage: number, isCritical: boolean = false): DamageText => ({
  id: `dmg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  x: x + (Math.random() - 0.5) * 20,
  y: y - 20,
  damage,
  color: isCritical ? '#ff0' : '#fff',
  startTime: Date.now(),
  duration: 1000,
});

// ===== マジッククールダウン計算 =====
export const getMagicCooldown = (reloadMagic: number): number => {
  return Math.max(MAGIC_MIN_COOLDOWN, MAGIC_BASE_COOLDOWN - reloadMagic * 0.5);
};

// ===== 魔法発動 =====
export const castMagic = (
  magicType: MagicType,
  level: number,
  player: PlayerState,
  enemies: EnemyState[]
): { enemies: EnemyState[]; player: PlayerState; damageTexts: DamageText[] } => {
  const damageTexts: DamageText[] = [];
  let updatedPlayer = { ...player };
  let updatedEnemies = [...enemies];
  
  const baseDuration = 5 + (level - 1) * 5;  // 5/10/15秒
  const timeBonus = player.stats.time * 0.5;
  const totalDuration = baseDuration + timeBonus;
  
  switch (magicType) {
    case 'thunder':
      // 画面上の敵にランダムダメージ
      updatedEnemies = enemies.map(enemy => {
        const damage = calculateDamage(20 * level, player.stats.cAtk, enemy.stats.def);
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
      
    case 'fire':
      // 自分の周りに炎の渦（プレイヤーにバフとして付与）
      updatedPlayer = {
        ...player,
        statusEffects: [
          ...player.statusEffects.filter(e => e.type !== 'fire'),
          { type: 'fire' as const, duration: totalDuration, startTime: Date.now(), level },
        ],
      };
      break;
      
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
  
  return { enemies: updatedEnemies, player: updatedPlayer, damageTexts };
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
  
  coins.forEach(coin => {
    const dx = coin.x - player.x;
    const dy = coin.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < COIN_PICKUP_RADIUS) {
      totalExp += coin.exp;
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
