import type { EarTrainingTutorialBindings } from './earTrainingTutorialBindings';
import type {
  EarTrainingTutorialChordQuizScene,
  EarTrainingTutorialOsmdScene,
  EarTrainingTutorialSelfPacedScene,
} from './earTrainingTutorialScriptTypes';

export interface EarTrainingTutorialQuizConfig {
  scene: EarTrainingTutorialChordQuizScene;
  bindings: EarTrainingTutorialBindings;
}

export interface EarTrainingTutorialSelfPacedConfig {
  scene: EarTrainingTutorialSelfPacedScene;
  bindings: EarTrainingTutorialBindings;
}

export interface EarTrainingTutorialOsmdConfig {
  scene: EarTrainingTutorialOsmdScene;
  bindings: EarTrainingTutorialBindings;
}
