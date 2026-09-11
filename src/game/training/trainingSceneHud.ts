export interface TrainingSceneHud {
  readonly phase: 'countdown' | 'playing';
  readonly countdownSec: number;
  readonly remainSec: number;
  readonly score: number;
  readonly enemyHp: number;
  readonly enemyMaxHp: number;
}

export type MutableTrainingSceneHud = {
  -readonly [K in keyof TrainingSceneHud]: TrainingSceneHud[K];
};
