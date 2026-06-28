/**
 * コードヴォイシング耳コピ：フレーズ MP3 を AudioBuffer で再生し、
 * カウントインクリックと同一 AudioContext タイムラインでフレーズ頭を予約する（iOS の schedulePreparedPhraseWithCountIn に相当）。
 */

import { fetchCachedFullAudioBuffer } from '@/utils/audioFetchCache';
import {
  buildPhrasePrepareCacheKey,
  processOfflinePhraseBuffer,
} from '@/utils/earTrainingPhrasePitchShift';
import { clampPracticeSpeedPercent } from '@/utils/earTrainingPracticeSpeed';

const clampCountInBeats = (beats: number): number => Math.max(0, Math.min(32, Math.trunc(beats)));

const halfBeatSecForBpm = (bpm: number): number => {
  const safe = Math.max(20, Math.min(400, bpm));
  return 30 / safe;
};

const COUNT_IN_CLICK_URL = '/drumstick-count.mp3';

/** ドラムスティック1打を `when` にスケジュールする */
const scheduleClickBuffer = (
  ctx: BaseAudioContext,
  buffer: AudioBuffer,
  when: number,
  peakGain: number,
  output: AudioNode,
): void => {
  const gMin = 0.001;
  const safePeak = Math.max(gMin, Math.min(1, peakGain));
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(safePeak, when);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(gain);
  gain.connect(output);
  source.start(when);
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
  /** フレーズ頭の指定秒前（既定は半拍前、beats>0 のときのみ） */
  inputWindowLeadSec?: number;
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

export const CHORD_VOICING_PHRASE_PLAYER_LEAD_IN_SEC = 0.28;
const COUNT_IN_CLICK_GAIN = 0.82;
const COUNT_IN_FIRST_CLICK_GAIN = 1;

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
  private readonly rawBufferByUrl = new Map<string, Promise<AudioBuffer>>();
  private readonly preparedByCacheKey = new Map<string, Promise<AudioBuffer>>();
  private countInClickBuffer: AudioBuffer | null = null;
  private generation = 0;
  private phraseStartCtxTime: number | null = null;
  private phraseBufferDurationSec = 0;
  private phraseEnded = false;
  private activePhraseSource: AudioBufferSourceNode | null = null;
  private pitchShiftSemitones = 0;
  private playbackSpeedPercent = 100;
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

  setPitchShiftSemitones(semitones: number): void {
    this.pitchShiftSemitones = Math.max(-12, Math.min(12, Math.trunc(semitones)));
  }

  setPlaybackSpeedPercent(percent: number): void {
    this.playbackSpeedPercent = clampPracticeSpeedPercent(percent);
  }

  /** @deprecated オフライン移調のため no-op。API 互換のため残す。 */
  async ensurePitchShiftReady(): Promise<void> {
    return undefined;
  }

  /** @deprecated オフライン移調のため常に 0。API 互換のため残す。 */
  getPitchShiftLatencySec(): number {
    return 0;
  }

  /** `prepare`/`playPrepared` が内部で用意したコンテキスト。ドラムループ等と共有する。 */
  getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  /** フレーズ音源を再生しない複合モード等で、ドラム BGM 用にコンテキストを確保する。 */
  ensureAudioContext(): AudioContext {
    return this.createCtx();
  }

  private async decodeRawBuffer(ctx: AudioContext, url: string): Promise<AudioBuffer> {
    let promise = this.rawBufferByUrl.get(url);
    if (!promise) {
      promise = (async () => {
        const arrayBuffer = await fetchCachedFullAudioBuffer(url);
        return await ctx.decodeAudioData(arrayBuffer.slice(0));
      })();
      this.rawBufferByUrl.set(url, promise);
    }
    return promise;
  }

  private async ensureCountInClickBuffer(ctx: AudioContext): Promise<AudioBuffer> {
    if (this.countInClickBuffer) {
      return this.countInClickBuffer;
    }
    const buffer = await this.decodeRawBuffer(ctx, COUNT_IN_CLICK_URL);
    this.countInClickBuffer = buffer;
    return buffer;
  }

  async prepare(url: string): Promise<PreparedChordVoicingPhrase> {
    const ctx = this.createCtx();
    const semitones = this.pitchShiftSemitones;
    const speedPercent = this.playbackSpeedPercent;
    const cacheKey = buildPhrasePrepareCacheKey(url, semitones, speedPercent);

    let promise = this.preparedByCacheKey.get(cacheKey);
    if (!promise) {
      promise = (async () => {
        const raw = await this.decodeRawBuffer(ctx, url);
        return processOfflinePhraseBuffer(raw, { semitones, speedPercent });
      })();
      this.preparedByCacheKey.set(cacheKey, promise);
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
    this.rawBufferByUrl.clear();
    this.preparedByCacheKey.clear();
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

  /**
   * ノートオン判定用。`getCurrentTime()` とは異なりフレーズ開始前は負の秒を返す。
   * `AudioContext.currentTime` とスケジュールしたフレーズ頭の差（秒）。
   */
  getPhraseTimelineSec(): number | null {
    if (this.phraseStartCtxTime === null || !this.ctx) {
      return null;
    }
    const delta = this.ctx.currentTime - this.phraseStartCtxTime;
    return Number.isFinite(delta) ? delta : null;
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
      const when = ctx.currentTime + CHORD_VOICING_PHRASE_PLAYER_LEAD_IN_SEC;
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

    void ctx.resume().then(async () => {
      if (gen !== this.generation) {
        return;
      }
      phraseOut.gain.value = phraseGainLinear;

      let clickBuffer: AudioBuffer;
      try {
        clickBuffer = await this.ensureCountInClickBuffer(ctx);
      } catch {
        return;
      }
      if (gen !== this.generation) {
        return;
      }

      const bpm = Math.max(20, Math.min(400, params.bpm));
      const safeGain = Math.max(0, Math.min(1, params.beatGain));
      const spb = 60 / bpm;
      const firstClick = ctx.currentTime + CHORD_VOICING_PHRASE_PLAYER_LEAD_IN_SEC;
      const phraseStart = firstClick + beats * spb;

      for (let i = 0; i < beats; i += 1) {
        const clickGain = i === 0 ? COUNT_IN_FIRST_CLICK_GAIN : COUNT_IN_CLICK_GAIN;
        scheduleClickBuffer(ctx, clickBuffer, firstClick + i * spb, safeGain * clickGain, master);
      }

      if (params.onBeat) {
        for (let i = 0; i < beats; i += 1) {
          const when = firstClick + i * spb;
          const displayBeat = Math.max(1, beats - i);
          const delayMs = Math.max(0, Math.ceil((when - ctx.currentTime) * 1000));
          const timer = window.setTimeout(() => {
            if (gen !== this.generation) {
              return;
            }
            params.onBeat?.(displayBeat);
          }, delayMs);
          this.pendingTimeouts.push(timer);
        }
      }

      if (params.onInputWindowStart) {
        const inputLeadSec = params.inputWindowLeadSec ?? halfBeatSecForBpm(bpm);
        const inputAt = phraseStart - Math.max(0, inputLeadSec);
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
