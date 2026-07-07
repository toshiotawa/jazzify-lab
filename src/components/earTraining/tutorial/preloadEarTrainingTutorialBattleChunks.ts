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

/**
 * dialogue_only 中にバトル用の重い chunk・画像・音源を先読みして、次シーンで Suspense が出にくくする。
 * キャラ・ハンマー等のクリティカル画像のみ先読みし、エフェクト類はバトル canvas 側で遅延読込する。
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

  const isEnglishCopy = options.isEnglishCopy ?? false;
  void preloadEarTrainingBattleCriticalImages(
    resolveTutorialBattleAvatarUrls(options.script, isEnglishCopy),
  );

  preloadEarTrainingPianoOverlay();
  preloadBattleCountInClick();

  const script = options.script;
  if (!script) {
    return;
  }

  const stage = resolveFirstBattleStage(script, isEnglishCopy);
  if (stage) {
    prefetchEarTrainingLobbyAssetsFromStage(stage);
  }
};
