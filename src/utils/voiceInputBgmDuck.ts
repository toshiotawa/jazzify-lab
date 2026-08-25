/** voice 入力中の BGM 減衰係数（iOS SurvivalGameAudio と同一）。 */
export const VOICE_INPUT_BGM_DUCK = 0.5;

/** voice 入力時のみ BGM 音量を減衰する。ピアノ / SFX / フレーズ MP3 には適用しない。 */
export const duckBgmForVoiceInput = (
  volume: number,
  inputMethod: string,
): number =>
  inputMethod === 'voice' ? volume * VOICE_INPUT_BGM_DUCK : volume;
