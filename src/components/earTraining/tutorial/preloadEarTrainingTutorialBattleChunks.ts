import { EFFECT_IMAGE_URLS, preloadEarTrainingBattleImages } from '@/game/earTraining/canvas/drawEarTrainingBattle';
import { prefetchEarTrainingLobbyAssetsFromStage } from '@/utils/prefetchEarTrainingLobbyAssets';
import { preloadTutorialBattleAudio } from '@/components/survival/tutorial/tutorialAudioUnlock';

import { resolveTutorialContentStage } from './buildTutorialStageFromContent';
import type {
  EarTrainingTutorialScene,
  EarTrainingTutorialScriptPayload,
} from './earTrainingTutorialScriptTypes';

export interface PreloadEarTrainingTutorialBattleChunksOptions {
  readonly script?: EarTrainingTutorialScriptPayload;
  readonly isEnglishCopy?: boolean;
}

const isRunnableBattleScene = (scene: EarTrainingTutorialScene): boolean =>
  scene.type !== 'dialogue_only' && scene.type !== 'finish';

const resolveFirstBattleStage = (
  script: EarTrainingTutorialScriptPayload,
  isEnglishCopy: boolean,
): ReturnType<typeof resolveTutorialContentStage> | null => {
  const firstBattleScene = script.scenes.find(isRunnableBattleScene);
  if (!firstBattleScene || !('contentRef' in firstBattleScene)) {
    return null;
  }
  return resolveTutorialContentStage(
    script.content,
    firstBattleScene.contentRef,
    isEnglishCopy,
  );
};

/**
 * dialogue_only 中にバトル用の重い chunk・画像・音源を先読みして、次シーンで Suspense が出にくくする。
 */
export const preloadEarTrainingTutorialBattleChunks = async (
  options: PreloadEarTrainingTutorialBattleChunksOptions = {},
): Promise<void> => {
  const [voicing, quiz, osmd, adlib, pairAdlib] = await Promise.all([
    import('@/components/earTraining/EarTrainingChordVoicingScreen'),
    import('@/components/earTraining/EarTrainingChordQuizScreen'),
    import('@/components/earTraining/EarTrainingChordOSMDScreen'),
    import('@/components/earTraining/EarTrainingAdlibScreen'),
    import('@/components/earTraining/EarTrainingPhrasePairAdlibScreen'),
  ]);
  void voicing;
  void quiz;
  void osmd;
  void adlib;
  void pairAdlib;

  void preloadEarTrainingBattleImages(Object.values(EFFECT_IMAGE_URLS));

  void preloadTutorialBattleAudio();

  const script = options.script;
  if (!script) {
    return;
  }

  const stage = resolveFirstBattleStage(script, options.isEnglishCopy ?? false);
  if (stage) {
    prefetchEarTrainingLobbyAssetsFromStage(stage);
  }
};
