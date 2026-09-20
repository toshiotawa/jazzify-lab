import type { DefenseAudioRegistrationMode, DefenseStage } from '@/game/defense/defenseTypes';

const AUDIO_REGISTRATION_MODES: readonly DefenseAudioRegistrationMode[] = [
  'per_phrase',
  'single_source',
  'shared_progression',
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
