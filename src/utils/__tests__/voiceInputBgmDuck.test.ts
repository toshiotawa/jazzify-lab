import { duckBgmForVoiceInput, VOICE_INPUT_BGM_DUCK } from '@/utils/voiceInputBgmDuck';

describe('voiceInputBgmDuck', () => {
  it('ducks BGM volume when voice input is selected', () => {
    expect(duckBgmForVoiceInput(0.8, 'voice')).toBeCloseTo(0.8 * VOICE_INPUT_BGM_DUCK);
  });

  it('leaves BGM volume unchanged for MIDI input', () => {
    expect(duckBgmForVoiceInput(0.8, 'midi')).toBe(0.8);
  });
});
