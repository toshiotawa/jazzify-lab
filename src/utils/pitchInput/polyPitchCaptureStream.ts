export interface IsolatedVoiceStream {
  readonly stream: MediaStream;
  readonly context: AudioContext | null;
  readonly capturedChannels: number | null;
}

const capturedChannelCount = (stream: MediaStream): number | null => {
  const track = stream.getAudioTracks()[0];
  if (!track || typeof track.getSettings !== 'function') return null;
  const count = track.getSettings().channelCount;
  return typeof count === 'number' ? count : null;
};

/** 入力2のときだけ右チャンネルを単一ストリームにする。入力1は元のストリームを使う。 */
export const isolateVoiceInputChannel = async (
  stream: MediaStream,
  inputChannel: 1 | 2,
): Promise<IsolatedVoiceStream> => {
  const capturedChannels = capturedChannelCount(stream);
  if (inputChannel === 1) {
    return { stream, context: null, capturedChannels };
  }
  if (capturedChannels !== null && capturedChannels < 2) {
    throw new Error('voice-input-channel-unavailable');
  }
  const context = new AudioContext({ sampleRate: 48_000, latencyHint: 'interactive' });
  if (context.state === 'suspended') await context.resume();
  const source = context.createMediaStreamSource(stream);
  const width = Math.max(source.channelCount, 2);
  const splitter = context.createChannelSplitter(width);
  const destination = context.createMediaStreamDestination();
  source.connect(splitter);
  splitter.connect(destination, 1, 0);
  return { stream: destination.stream, context, capturedChannels };
};

export const VOICE_INPUT_CHANNEL_UNAVAILABLE = '入力2を選択できません。ブラウザから2チャンネルの音声を取得できていません。入力1または別の入力デバイスを選択してください。';
