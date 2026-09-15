export interface TrainingSceneHud {
  readonly phase: 'countdown' | 'playing';
  readonly countdownSec: number;
  readonly remainSec: number;
  readonly score: number;
  readonly endless: boolean;
}

export type MutableTrainingSceneHud = {
  -readonly [K in keyof TrainingSceneHud]: TrainingSceneHud[K];
};
