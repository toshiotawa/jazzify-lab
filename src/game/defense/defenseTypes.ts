/**
 * Defense mode domain types.
 */
import type { ProductionHintMode } from '@/types';

export type DefenseStaffLayout = 'treble' | 'grand';

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
  | 'goblin'
  | 'skeleton'
  | 'zombie'
  | 'bat'
  | 'ghost'
  | 'orc'
  | 'demon'
  | 'dragon';

export interface DefenseEnemy {
  readonly id: string;
  active: boolean;
  type: DefenseEnemyType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  knockbackVx: number;
  knockbackVy: number;
  lastAttackAt: number;
}

export interface DefenseFireball {
  readonly id: string;
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetEnemyId: string | null;
}

export type DefenseGameResult = 'playing' | 'clear' | 'gameover';

export interface DefenseRuntime {
  elapsedSec: number;
  playerHp: number;
  playerMaxHp: number;
  surviveSeconds: number;
  result: DefenseGameResult;
  enemiesDefeated: number;
  spawnTimerSec: number;
  nextEnemyIndex: number;
  enemies: DefenseEnemy[];
  activeEnemyCount: number;
  fireballs: DefenseFireball[];
  activeFireballCount: number;
  playerX: number;
  playerY: number;
}

export const DEFENSE_MAP_WIDTH = 800;
export const DEFENSE_MAP_HEIGHT = 600;
export const DEFENSE_PLAYER_X = 80;
export const DEFENSE_PLAYER_Y = DEFENSE_MAP_HEIGHT / 2;
export const DEFENSE_SPAWN_X = DEFENSE_MAP_WIDTH - 40;
export const DEFENSE_FIREBALL_SPEED = 420;

export const createDefenseRuntime = (
  playerMaxHp: number,
  surviveSeconds: number,
  maxEnemies: number,
): DefenseRuntime => ({
  elapsedSec: 0,
  playerHp: playerMaxHp,
  playerMaxHp,
  surviveSeconds,
  result: 'playing',
  enemiesDefeated: 0,
  spawnTimerSec: 0,
  nextEnemyIndex: 0,
  enemies: Array.from({ length: maxEnemies }, (_, index) => ({
    id: `enemy-slot-${index}`,
    active: false,
    type: 'slime',
    x: DEFENSE_SPAWN_X,
    y: DEFENSE_PLAYER_Y,
    hp: 1,
    maxHp: 1,
    knockbackVx: 0,
    knockbackVy: 0,
    lastAttackAt: 0,
  })),
  activeEnemyCount: 0,
  fireballs: Array.from({ length: 16 }, (_, index) => ({
    id: `fireball-slot-${index}`,
    active: false,
    x: DEFENSE_PLAYER_X,
    y: DEFENSE_PLAYER_Y,
    vx: 0,
    vy: 0,
    targetEnemyId: null,
  })),
  activeFireballCount: 0,
  playerX: DEFENSE_PLAYER_X,
  playerY: DEFENSE_PLAYER_Y,
});
