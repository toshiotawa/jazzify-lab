import type { EarTrainingTutorialBindings } from './earTrainingTutorialBindings';
import type {
  EarTrainingTutorialAdlibScene,
  EarTrainingTutorialChordQuizScene,
  EarTrainingTutorialCompositeScene,
  EarTrainingTutorialOsmdScene,
  EarTrainingTutorialPhrasePairAdlibScene,
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

export interface EarTrainingTutorialAdlibConfig {
  scene: EarTrainingTutorialAdlibScene;
  bindings: EarTrainingTutorialBindings;
}

export interface EarTrainingTutorialPhrasePairAdlibConfig {
  scene: EarTrainingTutorialPhrasePairAdlibScene;
  bindings: EarTrainingTutorialBindings;
}

export interface EarTrainingTutorialCompositeConfig {
  scene: EarTrainingTutorialCompositeScene;
  bindings: EarTrainingTutorialBindings;
}
