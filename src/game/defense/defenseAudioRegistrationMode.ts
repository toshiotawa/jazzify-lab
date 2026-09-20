import type { DefenseAudioRegistrationMode, DefenseStage } from '@/game/defense/defenseTypes';
import {
  validatePhraseLoopMeasures,
  validateSeparateTracksStageNumbers,
} from '@/game/defense/defenseSeparateTracksTransport';

const AUDIO_REGISTRATION_MODES: readonly DefenseAudioRegistrationMode[] = [
  'per_phrase',
  'single_source',
  'shared_progression',
  'shared_progression_separate_tracks',
];

export const isDefenseAudioRegistrationMode = (
  value: string,
): value is DefenseAudioRegistrationMode => (
  AUDIO_REGISTRATION_MODES.includes(value as DefenseAudioRegistrationMode)
);

export const parseDefenseAudioRegistrationMode = (
  value: string,
): DefenseAudioRegistrationMode | null => (
  isDefenseAudioRegistrationMode(value) ? value : null
);

export const isDefenseSingleSourceStage = (
  stage: Pick<DefenseStage, 'audioRegistrationMode'>,
): boolean => stage.audioRegistrationMode === 'single_source';

export const isDefenseSharedProgressionStage = (
  stage: Pick<DefenseStage, 'audioRegistrationMode'>,
): boolean => stage.audioRegistrationMode === 'shared_progression';

export const isDefenseSharedProgressionSeparateTracksStage = (
  stage: Pick<DefenseStage, 'audioRegistrationMode'>,
): boolean => stage.audioRegistrationMode === 'shared_progression_separate_tracks';

export const validateDefenseSharedProgressionStage = (
  stage: Pick<DefenseStage, 'audioRegistrationMode' | 'progressionBars' | 'phraseBars'>,
): string | null => {
  if (!isDefenseSharedProgressionStage(stage)) {
    return null;
  }
  if (stage.progressionBars === null || stage.progressionBars <= 0) {
    return 'shared_progression requires progressionBars';
  }
  if (![1, 2, 4].includes(stage.phraseBars)) {
    return 'shared_progression requires phraseBars in (1, 2, 4)';
  }
  if (stage.progressionBars % stage.phraseBars !== 0) {
    return 'progressionBars must be divisible by phraseBars';
  }
  return null;
};

export const validateDefenseSeparateTracksStage = (
  stage: Pick<
    DefenseStage,
    'audioRegistrationMode' | 'progressionBars' | 'phraseBars' | 'audioUrl' | 'melodyAudioUrl' | 'phrases'
  >,
): string | null => {
  if (!isDefenseSharedProgressionSeparateTracksStage(stage)) {
    return null;
  }

  const numbersError = validateSeparateTracksStageNumbers({
    progressionBars: stage.progressionBars,
    phraseBars: stage.phraseBars,
  });
  if (numbersError !== null) {
    return numbersError;
  }

  if (!stage.audioUrl || stage.audioUrl.trim().length === 0) {
    return 'shared_progression_separate_tracks requires stage audioUrl (BGM)';
  }
  if (!stage.melodyAudioUrl || stage.melodyAudioUrl.trim().length === 0) {
    return 'shared_progression_separate_tracks requires melodyAudioUrl';
  }

  const sortedPhrases = [...stage.phrases].sort((a, b) => a.orderIndex - b.orderIndex);
  const loopError = validatePhraseLoopMeasures(
    sortedPhrases.map((phrase) => ({
      loopStartMeasure: phrase.loopStartMeasure,
      loopEndMeasure: phrase.loopEndMeasure,
    })),
    stage.phraseBars as 1 | 2 | 4,
  );
  if (loopError !== null) {
    return loopError;
  }

  for (const phrase of sortedPhrases) {
    if (phrase.audioUrl.length > 0) {
      return 'shared_progression_separate_tracks requires null per-phrase audioUrl';
    }
  }

  return null;
};
