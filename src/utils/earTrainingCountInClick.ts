/**
 * 耳コピコードヴォイシングバトル用：拍子の1小節分、BPM 同期のクリックを Web Audio API で再生する。
 * フレーズ MP3 のループ中には呼ばない（ループ境界ではカウントを挟まない）。
 */

const clampBeats = (beats: number): number => Math.max(1, Math.min(32, Math.trunc(beats)));

/** 短いクリック1発を `when` にスケジュールする（woodblock 風の減衰） */
const scheduleClick = (ctx: AudioContext, when: number, peakGain: number): void => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, when);
  const gMin = 0.001;
  const safePeak = Math.max(gMin, Math.min(0.5, peakGain));
  gain.gain.setValueAtTime(gMin, when);
  gain.gain.linearRampToValueAtTime(safePeak, when + 0.004);
  gain.gain.exponentialRampToValueAtTime(gMin, when + 0.07);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(when);
  osc.stop(when + 0.085);
};

export interface PlayEarTrainingCountInMeasureParams {
  bpm: number;
  /** `ear_training_stages.beats_per_measure` */
  beatsPerMeasure: number;
  /** 0..1（マスター×ミュージック相当） */
  gain: number;
  /** 各クリックの直後に残り拍（終了時は0）を通知。任意。 */
  onBeat?: (beatsRemaining: number) => void;
}

/**
 * 1小節分のカウントインを再生し、終了まで await する。
 */
export const playEarTrainingCountInMeasure = async (
  params: PlayEarTrainingCountInMeasureParams,
): Promise<void> => {
  if (typeof window === 'undefined') {
    return;
  }
  const AudioContextClass =
    window.AudioContext
    ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  const bpm = Math.max(20, Math.min(400, params.bpm));
  const beats = clampBeats(params.beatsPerMeasure);
  const gain = Math.max(0, Math.min(1, params.gain));

  const ctx = new AudioContextClass();
  try {
    await ctx.resume();
    const spb = 60 / bpm;
    const start = ctx.currentTime + 0.02;
    const beatTimers: number[] = [];
    for (let i = 0; i < beats; i += 1) {
      const when = start + i * spb;
      scheduleClick(ctx, when, gain * 0.55);
      if (params.onBeat) {
        const remaining = Math.max(0, beats - i - 1);
        const delayMs = Math.max(0, Math.ceil((when - ctx.currentTime) * 1000));
        beatTimers.push(window.setTimeout(() => params.onBeat?.(remaining), delayMs));
      }
    }
    await new Promise<void>(resolve => {
      const completionDelayMs = Math.max(0, Math.ceil((start + beats * spb - ctx.currentTime) * 1000));
      window.setTimeout(resolve, completionDelayMs);
    });
    for (const timer of beatTimers) {
      window.clearTimeout(timer);
    }
  } finally {
    void ctx.close();
  }
};
