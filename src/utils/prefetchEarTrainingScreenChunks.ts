import type { EarTrainingStage } from '@/types';
import { preloadEarTrainingStageDetails } from '@/platform/earTrainingStageDetailCache';
import { runWhenIdle } from '@/utils/idlePrefetch';

const prefetchEarTrainingScreenChunk = (mode: EarTrainingStage['mode'] | undefined): void => {
  switch (mode) {
    case 'chord_voicing':
      runWhenIdle('chunk:ear-training-chord-voicing', () => {
        void import('@/components/earTraining/EarTrainingChordVoicingScreen').catch(() => undefined);
      });
      return;
    case 'chord_quiz':
      runWhenIdle('chunk:ear-training-chord-quiz', () => {
        void import('@/components/earTraining/EarTrainingChordQuizScreen').catch(() => undefined);
      });
      return;
    case 'chord_osmd':
      runWhenIdle('chunk:ear-training-chord-osmd', () => {
        void import('@/components/earTraining/EarTrainingChordOSMDScreen').catch(() => undefined);
      });
      return;
    case 'adlib':
      runWhenIdle('chunk:ear-training-adlib', () => {
        void import('@/components/earTraining/EarTrainingAdlibScreen').catch(() => undefined);
      });
      return;
    case 'phrase_pair_adlib':
      runWhenIdle('chunk:ear-training-phrase-pair-adlib', () => {
        void import('@/components/earTraining/EarTrainingPhrasePairAdlibScreen').catch(() => undefined);
      });
      return;
    case 'phrase':
    default:
      runWhenIdle('chunk:ear-training-phrase', () => {
        void import('@/components/earTraining/EarTrainingGameScreen').catch(() => undefined);
      });
  }
};

export const prefetchEarTrainingResourcesForLesson = (
  entries: ReadonlyArray<{
    stageId: string | null | undefined;
    mode?: EarTrainingStage['mode'] | null;
  }>,
): void => {
  const stageIds: string[] = [];
  const modes = new Set<EarTrainingStage['mode']>();

  entries.forEach((entry) => {
    const stageId = entry.stageId?.trim() ?? '';
    if (stageId.length > 0) {
      stageIds.push(stageId);
    }
    modes.add(entry.mode ?? 'phrase');
  });

  if (stageIds.length > 0) {
    preloadEarTrainingStageDetails(stageIds);
  }

  modes.forEach((mode) => {
    prefetchEarTrainingScreenChunk(mode);
  });
};
