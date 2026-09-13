/**
 * Defense mode domain types.
 */
import type { ProductionHintMode } from '@/types';

export type DefenseStaffLayout = 'treble' | 'grand';

/** When player slash fires: each correct pitch (`note`) or chord/measure complete (`measure`). */
export type DefenseAttackTrigger = 'note' | 'measure';

export interface DefensePhraseChordNote {
  readonly orderIndex: number;
  readonly pitchMidi: number;
  readonly pitchClass: number;
  readonly noteName: string;
  readonly staff: 1 | 2;
  readonly stepIndex?: number;
}

export interface DefensePhraseChord {
  readonly id: string;
  readonly orderIndex: number;
  readonly chordName: string;
  readonly measureNumber: number;
  readonly notes: readonly DefensePhraseChordNote[];
}

export interface DefensePhrase {
  readonly id: string;
  readonly orderIndex: number;
  readonly title: string;
  readonly audioUrl: string;
  readonly keyFifths: number | null;
  readonly requiredCompletionCount: number | null;
  readonly chords: readonly DefensePhraseChord[];
}

export interface DefenseStage {
  readonly id: string;
  readonly slug: string;
  readonly stageNumber: number;
  readonly title: string;
  readonly titleEn: string;
  readonly bpm: number;
  readonly beatsPerBar: number;
  readonly phraseBars: number;
  readonly staffLayout: DefenseStaffLayout;
  readonly attackTrigger: DefenseAttackTrigger;
  readonly keyFifths: number;
  readonly requiredCompletionCount: number;
  readonly difficultyLevel: number;
  readonly surviveSeconds: number;
  readonly playerHp: number;
  readonly productionStaffHintMode: ProductionHintMode;
  readonly productionKeyboardHintMode: ProductionHintMode;
  readonly phrases: readonly DefensePhrase[];
}

export interface DefenseDifficulty {
  readonly level: number;
  readonly enemyHp: number;
  readonly spawnIntervalSec: number;
  readonly maxEnemies: number;
  readonly enemySpeedPxPerSec: number;
  readonly enemyDamage: number;
  readonly attackIntervalSec: number;
  readonly attackRangePx: number;
}

export type DefenseEnemyType =
  | 'slime'
  | 'bat'
  | 'goblin'
  | 'skeleton'
  | 'ghost'
  | 'mushroom'
  | 'wolf'
  | 'golem'
  | 'mimic'
  | 'dragon';

export interface DefenseEnemy {
  readonly id: string;
  /** Stable pool index (used for animation phase offsets). */
  readonly slotIndex: number;
  active: boolean;
  type: DefenseEnemyType;
  x: number;
  /** Sprite center Y (fixed per type: ground-aligned or hovering). */
  y: number;
  hp: number;
  maxHp: number;
  speedPxPerSec: number;
  damage: number;
  attackIntervalSec: number;
  attackRangePx: number;
  knockbackMult: number;
  knockbackVx: number;
  /** Attack cycle start time (seconds); 0 = never attacked. */
  lastAttackAt: number;
  moving: boolean;
  attackHitPending: boolean;
  /** Elapsed seconds when hit flash started; -1 when inactive. */
  hitFlashAt: number;
}

export interface DefenseDamagePopup {
  active: boolean;
  x: number;
  y: number;
  value: number;
  spawnedAt: number;
}

export interface DefenseFireball {
  active: boolean;
  x: number;
  y: number;
  damage: number;
  /** Bit mask of enemy slot indices already hit by this fireball. */
  hitSlotMask: number;
}

export type DefenseGameResult = 'playing' | 'clear' | 'gameover';

export interface DefenseRuntime {
  elapsedSec: number;
  playerHp: number;
  playerMaxHp: number;
  surviveSeconds: number;
  practiceMode: boolean;
  attackTrigger: DefenseAttackTrigger;
  result: DefenseGameResult;
  enemiesDefeated: number;
  spawnTimerSec: number;
  nextEnemyIndex: number;
  /** 0-based wave index; fixed at 0 in practice mode. */
  waveIndex: number;
  waveSpawnCount: number;
  /** Elapsed seconds when the current wave started; -1 when inactive. */
  waveStartedAt: number;
  enemies: DefenseEnemy[];
  activeEnemyCount: number;
  playerX: number;
  playerY: number;
  /** -1 when no active impact effect. */
  impactAt: number;
  impactX: number;
  impactY: number;
  /** -1 when no active slash effect. */
  slashAt: number;
  slashFromX: number;
  slashToX: number;
  slashY: number;
  /** Elapsed seconds until which GuardD pose is shown; 0 = inactive. */
  guardPoseUntilSec: number;
  /** Elapsed seconds when skill pose sequence started; -1 when inactive. */
  skillPoseStartSec: number;
  /** Elapsed seconds when pending fireball should spawn; -1 when none. */
  fireballSpawnAtSec: number;
  /** 0..DEFENSE_SP_MAX; phrase mode only. */
  spGauge: number;
  damagePopups: DefenseDamagePopup[];
  nextPopupIndex: number;
  fireballs: DefenseFireball[];
}

export const DEFENSE_MAP_WIDTH = 800;
export const DEFENSE_MAP_HEIGHT = 600;
export const DEFENSE_PLAYER_X = 80;
export const DEFENSE_PLAYER_Y = DEFENSE_MAP_HEIGHT / 2;
export const DEFENSE_SPAWN_X = DEFENSE_MAP_WIDTH - 40;
export const DEFENSE_NO_IMPACT = -1;
export const DEFENSE_NO_SLASH = -1;
export const DEFENSE_NO_WAVE_START = -1;
export const DEFENSE_NO_HIT_FLASH = -1;
export const DEFENSE_NO_SKILL_POSE = -1;
export const DEFENSE_NO_PENDING_FIREBALL = -1;

export const DEFENSE_DAMAGE_POPUP_POOL_SIZE = 16;
export const DEFENSE_FIREBALL_POOL_SIZE = 3;

export const createDefenseRuntime = (
  playerMaxHp: number,
  surviveSeconds: number,
  maxEnemies: number,
  practiceMode = false,
  attackTrigger: DefenseAttackTrigger = 'note',
): DefenseRuntime => ({
  elapsedSec: 0,
  playerHp: playerMaxHp,
  playerMaxHp,
  surviveSeconds,
  practiceMode,
  attackTrigger,
  result: 'playing',
  enemiesDefeated: 0,
  spawnTimerSec: 0,
  nextEnemyIndex: 0,
  waveIndex: 0,
  waveSpawnCount: 0,
  waveStartedAt: practiceMode ? DEFENSE_NO_WAVE_START : 0,
  enemies: Array.from({ length: maxEnemies }, (_, index) => ({
    id: `enemy-slot-${index}`,
    slotIndex: index,
    active: false,
    type: 'slime',
    x: DEFENSE_SPAWN_X,
    y: DEFENSE_PLAYER_Y,
    hp: 1,
    maxHp: 1,
    speedPxPerSec: 40,
    damage: 1,
    attackIntervalSec: 3,
    attackRangePx: 48,
    knockbackMult: 1,
    knockbackVx: 0,
    lastAttackAt: 0,
    moving: false,
    attackHitPending: false,
    hitFlashAt: DEFENSE_NO_HIT_FLASH,
  })),
  activeEnemyCount: 0,
  playerX: DEFENSE_PLAYER_X,
  playerY: DEFENSE_PLAYER_Y,
  impactAt: DEFENSE_NO_IMPACT,
  impactX: DEFENSE_PLAYER_X,
  impactY: DEFENSE_PLAYER_Y,
  slashAt: DEFENSE_NO_SLASH,
  slashFromX: DEFENSE_PLAYER_X,
  slashToX: DEFENSE_PLAYER_X,
  slashY: DEFENSE_PLAYER_Y,
  guardPoseUntilSec: 0,
  skillPoseStartSec: DEFENSE_NO_SKILL_POSE,
  fireballSpawnAtSec: DEFENSE_NO_PENDING_FIREBALL,
  spGauge: 0,
  damagePopups: Array.from({ length: DEFENSE_DAMAGE_POPUP_POOL_SIZE }, () => ({
    active: false,
    x: 0,
    y: 0,
    value: 0,
    spawnedAt: 0,
  })),
  nextPopupIndex: 0,
  fireballs: Array.from({ length: DEFENSE_FIREBALL_POOL_SIZE }, () => ({
    active: false,
    x: 0,
    y: 0,
    damage: 0,
    hitSlotMask: 0,
  })),
});
