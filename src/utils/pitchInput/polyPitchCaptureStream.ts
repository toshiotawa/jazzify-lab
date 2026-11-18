export const capturedVoiceInputChannelCount = (stream: MediaStream): number | null => {
  const track = stream.getAudioTracks()[0];
  if (!track || typeof track.getSettings !== 'function') return null;
  const count = track.getSettings().channelCount;
  return typeof count === 'number' ? count : null;
};

export const VOICE_INPUT_CHANNEL_UNAVAILABLE = '入力2を選択できません。ブラウザから2チャンネルの音声を取得できていません。入力1または別の入力デバイスを選択してください。';