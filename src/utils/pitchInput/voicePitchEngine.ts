import type { PitchEngine } from '@/utils/pitchInput/pitchInputTypes';

export type PolyphonicVoiceEngine = 'pitchplease-fast' | 'pitchplease-piano' | 'effetune';

export type VoicePitchEngine = PitchEngine | PolyphonicVoiceEngine;
