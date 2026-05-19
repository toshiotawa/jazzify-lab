import type { ChordDefinition } from '@/components/fantasy/FantasyGameEngine';
import type {
  SurvivalScenarioOverrides,
  SurvivalScenarioStaffMode,
} from './survivalScenarioTypes';

export interface SurvivalScenarioHandle {
  setOverrides: (overrides: SurvivalScenarioOverrides) => void;
  applyMutation: (mutate: (current: SurvivalScenarioOverrides) => void) => void;
  getOverrides: () => SurvivalScenarioOverrides;
  clearEnemies: () => void;
  spawnEnemyInFront: (distance: number) => void;
  spawnStationaryAt: (x: number, y: number) => void;
  spawnStationaryRing: (count: number, radius: number) => void;
  /** progression でも A が撃てるようにスロット制約を迂回（iOS `scenarioEmitAttackOnly` と同等） */
  emitAttackOnly: (slot: 'A' | 'B') => void;
  /** 進行方向の垂直方向に複数静止敵を配置（G7 など） */
  spawnTutorialPerpendicularOffsets: (
    distanceForwardPx: number,
    perpOffsetsPx: readonly number[],
  ) => void;
  emitAttackSlot: (slot: 'A' | 'B') => void;
  emitSpecialShockwave: () => void;
  setSlotBChord: (chord: ChordDefinition | null) => void;
  setSlotAEnabled: (enabled: boolean) => void;
  setSlotBEnabled: (enabled: boolean) => void;
  playChordAudio: (midis: readonly number[]) => void;
  getSlotBCompletionPulse: () => number;
  getUserInputPulse: () => number;
  setPhraseStaffChord: (chord: ChordDefinition | null) => void;
  setStaffMode: (mode: SurvivalScenarioStaffMode) => void;
}
