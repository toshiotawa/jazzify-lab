const FFT_SIZE = 512;
const SILENCE_LINEAR = 1e-8;

export interface PolyInputLevelMeter {
  sampleInputDb(): number | null;
  dispose(): void;
}

const rmsToDb = (rms: number): number => 20 * Math.log10(Math.max(rms, SILENCE_LINEAR));

/** 診断用: マイク入力の広帯域 RMS (dB)。ゲームプレイには影響しない。 */
export const createPolyInputLevelMeter = (stream: MediaStream): PolyInputLevelMeter | null => {
  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) return null;

  let context: AudioContext | null = null;
  try {
    context = new AudioContext({ latencyHint: 'interactive' });
  } catch {
    return null;
  }

  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  analyser.fftSize = FFT_SIZE;
  analyser.smoothingTimeConstant = 0;
  const silentSink = context.createGain();
  silentSink.gain.value = 0;
  source.connect(analyser);
  analyser.connect(silentSink);
  silentSink.connect(context.destination);

  const timeDomain = new Float32Array(analyser.fftSize);

  return {
    sampleInputDb: (): number | null => {
      if (!context || context.state === 'closed') return null;
      analyser.getFloatTimeDomainData(timeDomain);
      let sumSquares = 0;
      for (let index = 0; index < timeDomain.length; index += 1) {
        const sample = timeDomain[index] ?? 0;
        sumSquares += sample * sample;
      }
      const rms = Math.sqrt(sumSquares / timeDomain.length);
      return Math.round(rmsToDb(rms));
    },
    dispose: (): void => {
      source.disconnect();
      analyser.disconnect();
      silentSink.disconnect();
      void context?.close().catch(() => undefined);
      context = null;
    },
  };
};
