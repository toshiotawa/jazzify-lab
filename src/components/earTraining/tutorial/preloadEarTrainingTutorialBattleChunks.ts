import type { EarTrainingMode } from '@/types';
import { preloadEarTrainingBattleCriticalImages } from '@/game/earTraining/canvas/earTrainingBattleImagePreload';
import { prefetchEarTrainingLobbyAssetsFromStage } from '@/utils/prefetchEarTrainingLobbyAssets';
import { preloadBattleCountInClick } from '@/utils/ensureBattlePianoAudio';
import { preloadEarTrainingPianoOverlay } from '@/utils/preloadEarTrainingPianoOverlay';
import {
  buildEarTrainingEnemyBattleSourceKey,
  EAR_TRAINING_PLAYER_AVATAR_URL,
  resolveEarTrainingBattleEnemy,
  resolveEarTrainingEnemyAvatarFromBattleSourceKey,
} from '@/utils/earTrainingBattleAvatar';

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

const resolveTutorialBattleAvatarUrls = (
  script: EarTrainingTutorialScriptPayload | undefined,
  isEnglishCopy: boolean,
): string[] => {
  const urls = [EAR_TRAINING_PLAYER_AVATAR_URL];
  if (!script) {
    return urls;
  }
  const stage = resolveFirstBattleStage(script, isEnglishCopy);
  if (!stage) {
    return urls;
  }
  const enemy = resolveEarTrainingBattleEnemy(stage, isEnglishCopy);
  const battleSourceKey = buildEarTrainingEnemyBattleSourceKey(stage.id, enemy);
  urls.push(resolveEarTrainingEnemyAvatarFromBattleSourceKey(battleSourceKey).url);
  return urls;
};

const importBattleScreenForMode = (mode: EarTrainingMode): Promise<unknown> => {
  switch (mode) {
    case 'chord_osmd':
      return import('@/components/earTraining/EarTrainingChordOSMDScreen');
    case 'chord_precision':
      return import('@/components/earTraining/EarTrainingPrecisionScreen');
    case 'chord_quiz':
      return import('@/components/earTraining/EarTrainingChordQuizScreen');
    case 'chord_voicing':
      return import('@/components/earTraining/EarTrainingChordVoicingScreen');
    case 'adlib':
      return import('@/components/earTraining/EarTrainingAdlibScreen');
    case 'phrase_pair_adlib':
      return import('@/components/earTraining/EarTrainingPhrasePairAdlibScreen');
    case 'phrase':
      return import('@/components/earTraining/EarTrainingGameScreen');
    default: {
      const exhaustive: never = mode;
      return exhaustive;
    }
  }
};

/**
 * dialogue_only 中にバトル用の重い chunk・画像・音源を先読みして、次シーンで Suspense が出にくくする。
 * 次バトルのモードに必要な Screen chunk のみ読み、クリティカル画像もモード別に絞る。
 */
export const preloadEarTrainingTutorialBattleChunks = async (
  options: PreloadEarTrainingTutorialBattleChunksOptions = {},
): Promise<void> => {
  const isEnglishCopy = options.isEnglishCopy ?? false;
  const script = options.script;
  const stage = script ? resolveFirstBattleStage(script, isEnglishCopy) : null;
  const battleMode = stage?.mode;

  if (battleMode) {
    await importBattleScreenForMode(battleMode);
  } else {
    await import('@/components/earTraining/EarTrainingChordOSMDScreen');
  }

  void preloadEarTrainingBattleCriticalImages(
    resolveTutorialBattleAvatarUrls(script, isEnglishCopy),
    battleMode,
  );

  preloadEarTrainingPianoOverlay();
  preloadBattleCountInClick();

  if (stage) {
    prefetchEarTrainingLobbyAssetsFromStage(stage);
  }
};
