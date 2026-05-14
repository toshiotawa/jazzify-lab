/**
 * コードヴォイシング耳コピ：フレーズ MP3 を AudioBuffer で再生し、
 * カウントインクリックと同一 AudioContext タイムラインでフレーズ頭を予約する（iOS の schedulePreparedPhraseWithCountIn に相当）。
 */

const clampCountInBeats = (beats: number): number => Math.max(0, Math.min(32, Math.trunc(beats)));

const halfBeatSecForBpm = (bpm: number): number => {
  const safe = Math.max(20, Math.min(400, bpm));
  return 30 / safe;
};

/** 短いクリック1発を `output` へ `when` にスケジュールする（woodblock 風の減衰） */
const scheduleClickOsc = (ctx: BaseAudioContext, when: number, peakGain: number, output: AudioNode): void => {
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
  gain.connect(output);
  osc.start(when);
  osc.stop(when + 0.085);
};

interface PreparedChordVoicingPhrase {
  readonly url: string;
  readonly buffer: AudioBuffer;
}

interface ScheduleChordVoicingCountInParams {
  prepared: PreparedChordVoicingPhrase;
  countInBeats: number;
  bpm: number;
  /** クリックのピークゲイン係数（0..1、マスター×ミュージック相当を掛けた値を渡す） */
  beatGain: number;
  /** フレーズ MP3 のみ（0=無音。クリックは beatGain のまま） */
  phraseGain?: number;
  onBeat?: (beatsRemaining: number) => void;
  /** フレーズ頭の半拍前（beats>0 のときのみ） */
  onInputWindowStart?: () => void;
  onPhraseStarted?: () => void;
  onEnded?: () => void;
}

interface PlayPreparedChordVoicingPhraseParams {
  prepared: PreparedChordVoicingPhrase;
  /** フレーズ MP3 のゲイン係数（0..1、既定 1） */
  phraseGain?: number;
  onPhraseStarted?: () => void;
  onEnded?: () => void;
}

const LEAD_IN_SEC = 0.02;

type EarTrainingChordVoicingPhrasePlayerOptions = {
  createAudioContext?: () => AudioContext;
};

const defaultAudioContextFactory = (): AudioContext => {
  const Ctor = window.AudioContext
    ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) {
    throw new Error('AudioContext is not available');
  }
  return new Ctor();
};

export class EarTrainingChordVoicingPhrasePlayer {
  private readonly options: EarTrainingChordVoicingPhrasePlayerOptions;
  private ctx: AudioContext | null = null;
  /** クリック用。destination へは phraseGain → masterGain の順 */
  private masterGain: GainNode | null = null;
  /** フレーズバッファのみ。クリックは masterGain 直入力のまま */
  private phraseGain: GainNode | null = null;
  private volume = 1;
  private readonly decodeByUrl = new Map<string, Promise<AudioBuffer>>();
  private generation = 0;
  private phraseStartCtxTime: number | null = null;
  private phraseBufferDurationSec = 0;
  private phraseEnded = false;
  private activePhraseSource: AudioBufferSourceNode | null = null;
  private pendingTimeouts: number[] = [];

  constructor(options: EarTrainingChordVoicingPhrasePlayerOptions = {}) {
    this.options = options;
  }

  private createCtx(): AudioContext {
    if (this.ctx && this.masterGain) {
      return this.ctx;
    }
    const factory = this.options.createAudioContext ?? defaultAudioContextFactory;
    const ctx = factory();
    const phraseGainNode = ctx.createGain();
    phraseGainNode.gain.value = 1;
    const masterGain = ctx.createGain();
    masterGain.gain.value = this.volume;
    phraseGainNode.connect(masterGain);
    masterGain.connect(ctx.destination);
    this.ctx = ctx;
    this.phraseGain = phraseGainNode;
    this.masterGain = masterGain;
    return ctx;
  }

  setVolume(value: number): void {
    const safe = Math.max(0, Math.min(1, value));
    this.volume = safe;
    if (this.masterGain) {
      this.masterGain.gain.value = safe;
    }
  }

  async prepare(url: string): Promise<PreparedChordVoicingPhrase> {
    const ctx = this.createCtx();
    let promise = this.decodeByUrl.get(url);
    if (!promise) {
      promise = (async () => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch phrase audio: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const copy = arrayBuffer.slice(0);
        return await ctx.decodeAudioData(copy);
      })();
      this.decodeByUrl.set(url, promise);
    }
    const buffer = await promise;
    return { url, buffer };
  }

  private clearPendingTimeouts(): void {
    for (const id of this.pendingTimeouts) {
      window.clearTimeout(id);
    }
    this.pendingTimeouts.length = 0;
  }

  private stopPhraseSourceOnly(): void {
    const src = this.activePhraseSource;
    this.activePhraseSource = null;
    if (!src) {
      return;
    }
    src.onended = null;
    try {
      src.stop(0);
    } catch {
      // 既に停止済み
    }
  }

  stop(): void {
    this.generation += 1;
    this.clearPendingTimeouts();
    this.stopPhraseSourceOnly();
    this.phraseStartCtxTime = null;
    this.phraseBufferDurationSec = 0;
    this.phraseEnded = false;
  }

  dispose(): void {
    this.stop();
    if (this.ctx) {
      void this.ctx.close();
    }
    this.ctx = null;
    this.masterGain = null;
    this.phraseGain = null;
    this.decodeByUrl.clear();
  }

  getCurrentTime(): number {
    if (this.phraseStartCtxTime === null || !this.ctx) {
      return 0;
    }
    if (this.ctx.currentTime < this.phraseStartCtxTime) {
      return 0;
    }
    if (this.phraseEnded) {
      return this.phraseBufferDurationSec;
    }
    const elapsed = this.ctx.currentTime - this.phraseStartCtxTime;
    return Math.min(Math.max(0, elapsed), this.phraseBufferDurationSec);
  }

  hasEnded(): boolean {
    return this.phraseEnded;
  }

  isPlayingPhraseClock(): boolean {
    if (!this.ctx || this.phraseStartCtxTime === null || this.phraseEnded) {
      return false;
    }
    return this.ctx.currentTime >= this.phraseStartCtxTime;
  }

  playPrepared(params: PlayPreparedChordVoicingPhraseParams): void {
    const ctx = this.createCtx();
    const phraseOut = this.phraseGain;
    if (!phraseOut) {
      return;
    }
    this.stop();
    const gen = this.generation;
    const phraseGainLinear = Math.max(0, Math.min(1, params.phraseGain ?? 1));
    void ctx.resume().then(() => {
      if (gen !== this.generation) {
        return;
      }
      phraseOut.gain.value = phraseGainLinear;
      const when = ctx.currentTime + LEAD_IN_SEC;
      this.startPhraseBufferAt(
        ctx,
        phraseOut,
        params.prepared.buffer,
        when,
        gen,
        params.onPhraseStarted,
        params.onEnded,
      );
    }).catch(() => undefined);
  }

  schedulePreparedPhraseWithCountIn(params: ScheduleChordVoicingCountInParams): void {
    const ctx = this.createCtx();
    const master = this.masterGain;
    if (!master) {
      return;
    }

    const beats = clampCountInBeats(params.countInBeats);
    if (beats <= 0) {
      this.playPrepared({
        prepared: params.prepared,
        phraseGain: params.phraseGain,
        onPhraseStarted: params.onPhraseStarted,
        onEnded: params.onEnded,
      });
      return;
    }

    this.stop();
    const gen = this.generation;
    const phraseGainLinear = Math.max(0, Math.min(1, params.phraseGain ?? 1));
    const phraseOut = this.phraseGain;
    if (!phraseOut) {
      return;
    }

    void ctx.resume().then(() => {
      if (gen !== this.generation) {
        return;
      }
      phraseOut.gain.value = phraseGainLinear;

      const bpm = Math.max(20, Math.min(400, params.bpm));
      const safeGain = Math.max(0, Math.min(1, params.beatGain));
      const spb = 60 / bpm;
      const firstClick = ctx.currentTime + LEAD_IN_SEC;
      const phraseStart = firstClick + beats * spb;

      for (let i = 0; i < beats; i += 1) {
        scheduleClickOsc(ctx, firstClick + i * spb, safeGain * 0.55, master);
      }

      if (params.onBeat) {
        for (let i = 0; i < beats; i += 1) {
          const when = firstClick + i * spb;
          const remaining = Math.max(0, beats - i - 1);
          const delayMs = Math.max(0, Math.ceil((when - ctx.currentTime) * 1000));
          const timer = window.setTimeout(() => {
            if (gen !== this.generation) {
              return;
            }
            params.onBeat?.(remaining);
          }, delayMs);
          this.pendingTimeouts.push(timer);
        }
      }

      if (params.onInputWindowStart) {
        const inputAt = phraseStart - halfBeatSecForBpm(bpm);
        const delayMs = Math.max(0, Math.ceil((inputAt - ctx.currentTime) * 1000));
        const timer = window.setTimeout(() => {
          if (gen !== this.generation) {
            return;
          }
          params.onInputWindowStart?.();
        }, delayMs);
        this.pendingTimeouts.push(timer);
      }

      if (params.onPhraseStarted) {
        const delayMs = Math.max(0, Math.ceil((phraseStart - ctx.currentTime) * 1000));
        const timer = window.setTimeout(() => {
          if (gen !== this.generation) {
            return;
          }
          params.onPhraseStarted?.();
        }, delayMs);
        this.pendingTimeouts.push(timer);
      }

      this.startPhraseBufferAt(
        ctx,
        phraseOut,
        params.prepared.buffer,
        phraseStart,
        gen,
        undefined,
        params.onEnded,
      );
    }).catch(() => undefined);
  }

  private startPhraseBufferAt(
    ctx: AudioContext,
    phraseOutput: GainNode,
    buffer: AudioBuffer,
    when: number,
    scheduleGen: number,
    onPhraseStarted: (() => void) | undefined,
    onEnded: (() => void) | undefined,
  ): void {
    if (scheduleGen !== this.generation) {
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(phraseOutput);

    this.phraseStartCtxTime = when;
    this.phraseBufferDurationSec = buffer.duration;
    this.phraseEnded = false;
    this.activePhraseSource = source;

    source.onended = () => {
      if (scheduleGen !== this.generation || this.activePhraseSource !== source) {
        return;
      }
      this.phraseEnded = true;
      this.activePhraseSource = null;
      onEnded?.();
    };

    if (onPhraseStarted) {
      const delayMs = Math.max(0, Math.ceil((when - ctx.currentTime) * 1000));
      const timer = window.setTimeout(() => {
        if (scheduleGen !== this.generation) {
          return;
        }
        onPhraseStarted();
      }, delayMs);
      this.pendingTimeouts.push(timer);
    }

    try {
      source.start(when);
    } catch {
      this.phraseEnded = true;
      this.activePhraseSource = null;
      onEnded?.();
    }
  }
}
