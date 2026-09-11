/** Low-frequency HUD snapshot passed to the defense canvas draw call. */
export interface DefenseSceneHud {
  readonly playerHp: number;
  readonly playerMaxHp: number;
  readonly remainSec: number;
  readonly enemiesDefeated: number;
  readonly practiceMode: boolean;
  readonly chordNames: readonly string[];
  readonly chordIndex: number;
}

export type MutableDefenseSceneHud = {
  -readonly [K in keyof DefenseSceneHud]: DefenseSceneHud[K];
};
