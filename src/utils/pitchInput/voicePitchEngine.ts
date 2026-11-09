import type { PitchEngine } from '@/utils/pitchInput/pitchInputTypes';

export type PolyphonicVoiceEngine = 'pitchplease-fast' | 'pitchplease-piano' | 'effetune';

export type VoicePitchEngine = PitchEngine | PolyphonicVoiceEngine;

export const isPolyphonicVoiceEngine = (
  engine: string | undefined,
): engine is PolyphonicVoiceEngine =>
  engine === 'pitchplease-fast' || engine === 'pitchplease-piano' || engine === 'effetune';

export const parseVoicePitchEngine = (value: string): VoicePitchEngine => {
  if (
    value === 'pitchy'
    || value === 'pitchplease-fast'
    || value === 'pitchplease-piano'
    || value === 'effetune'
  ) {
    return value;
  }
  return 'pesto';
};

/** 多声非対応の画面では保存値を単音エンジンへ落とす。設定自体は変えない。 */
export const monoPitchEngineForSession = (engine: string | undefined): PitchEngine => {
  if (engine === 'pitchy') return 'pitchy';
  return 'pesto';
};
