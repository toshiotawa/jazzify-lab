/** Low-frequency HUD snapshot passed to the defense canvas draw call. */
export interface DefenseSceneHud {
  readonly playerHp: number;
  readonly playerMaxHp: number;
  readonly remainSec: number;
  readonly enemiesDefeated: number;
  /** 1-based wave number; 0 hides wave UI (practice mode). */
  readonly wave: number;
  readonly practiceMode: boolean;
}

export type MutableDefenseSceneHud = {
  -readonly [K in keyof DefenseSceneHud]: DefenseSceneHud[K];
};
