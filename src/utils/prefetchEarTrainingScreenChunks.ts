import type { EarTrainingStage } from '@/types';
import type { LessonRequirementProgress } from '@/platform/supabaseLessonRequirements';
import { preloadEarTrainingStageDetails } from '@/platform/earTrainingStageDetailCache';
import { preloadBattleGmPiano, preloadBattleCountInClick } from '@/utils/ensureBattlePianoAudio';
import { runWhenIdle } from '@/utils/idlePrefetch';

export interface EarTrainingPrefetchEntry {
  readonly lessonSongId?: string | null;
  readonly stageId: string | null | undefined;
  readonly mode?: EarTrainingStage['mode'] | null;
}

export interface EarTrainingPrefetchOptions {
  readonly progress?: readonly LessonRequirementProgress[];
}

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

export const pickEarTrainingPrefetchEntries = (
  entries: readonly EarTrainingPrefetchEntry[],
  progress: readonly LessonRequirementProgress[] = [],
): EarTrainingPrefetchEntry[] => {
  if (entries.length === 0) {
    return [];
  }

  for (const entry of entries) {
    const lessonSongId = entry.lessonSongId?.trim() ?? '';
    if (lessonSongId.length === 0) {
      continue;
    }
    const row = progress.find((item) => item.lesson_song_id === lessonSongId);
    if (row?.is_completed) {
      continue;
    }
    return [entry];
  }

  return [entries[0]];
};

export const prefetchEarTrainingResourcesForLesson = (
  entries: readonly EarTrainingPrefetchEntry[],
  options: EarTrainingPrefetchOptions = {},
): void => {
  const selectedEntries = pickEarTrainingPrefetchEntries(entries, options.progress ?? []);
  const stageIds: string[] = [];
  const modes = new Set<EarTrainingStage['mode']>();

  selectedEntries.forEach((entry) => {
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

  if (selectedEntries.length > 0) {
    preloadBattleGmPiano();
    preloadBattleCountInClick();
    runWhenIdle('chunk:ear-training-piano-pixi-prefetch', () => {
      void import('@/components/game/PIXINotesRenderer').catch(() => undefined);
    });
  }
};
