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
  /** バッファ内の再生開始位置（秒） */
  startOffsetSec?: number;
  onPhraseStarted?: () => void;
  onEnded?: () => void;
}

export interface PrepareAllSemitonesProgress {
  completed: number;
  total: number;
  semitone: number;
}

export interface StartLoopSessionParams {
  buffersBySemitone: ReadonlyMap<number, AudioBuffer>;
  semitoneForCycle: (cycleIndex: number) => number;
  loopStartSec: number;
  loopDurationSec: number;
  loopPrimingOffsetSec?: number;
  phraseGain?: number;
  countInBeats: number;
  bpm: number;
  beatGain: number;
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

let sharedPhraseAudioContext: AudioContext | null = null;

const getSharedPhraseAudioContext = (): AudioContext => {
  if (sharedPhraseAudioContext && sharedPhraseAudioContext.state !== 'closed') {
    return sharedPhraseAudioContext;
  }
  sharedPhraseAudioContext = defaultAudioContextFactory();
  return sharedPhraseAudioContext;
};

const isSharedPhraseAudioContext = (ctx: AudioContext | null): boolean => (
  ctx !== null && ctx === sharedPhraseAudioContext
);

/**
 * ユーザージェスチャ内で呼び、フレーズ再生用 AudioContext を running にする。
 * 画面遷移後の自動 startBattle でも同じコンテキストを再利用する。
 */
export const unlockEarTrainingPhraseAudioContext = (): AudioContext | null => {
  try {
    const ctx = getSharedPhraseAudioContext();
    if (ctx.state !== 'running') {
      void ctx.resume();
    }
    return ctx;
  } catch {
    return null;
  }
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
  private pausedTimelineSec = 0;
  private isPaused = false;
  private loopSessionActive = false;
  private loopAnchorCtxTime: number | null = null;
  private loopDurationSec = 0;
  private loopStartSec = 0;
  private loopPrimingOffsetSec = 0;
  private loopBuffersBySemitone: Map<number, AudioBuffer> | null = null;
  private loopSemitoneForCycle: ((cycleIndex: number) => number) | null = null;
  private loopOnEnded: (() => void) | null = null;
  private loopScheduleGen = 0;
  private readonly scheduledLoopCycles = new Set<number>();
  private readonly loopSources = new Set<AudioBufferSourceNode>();

  constructor(options: EarTrainingChordVoicingPhrasePlayerOptions = {}) {
    this.options = options;
  }

  private createCtx(): AudioContext {
    if (this.ctx && this.masterGain) {
      return this.ctx;
    }
    const factory = this.options.createAudioContext ?? getSharedPhraseAudioContext;
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

  private stopLoopSourcesOnly(): void {
    for (const source of this.loopSources) {
      source.onended = null;
      try {
        source.stop(0);
      } catch {
        // 既に停止済み
      }
    }
    this.loopSources.clear();
    this.scheduledLoopCycles.clear();
  }

  private resetLoopSessionState(): void {
    this.loopSessionActive = false;
    this.loopAnchorCtxTime = null;
    this.loopDurationSec = 0;
    this.loopStartSec = 0;
    this.loopPrimingOffsetSec = 0;
    this.loopBuffersBySemitone = null;
    this.loopSemitoneForCycle = null;
    this.loopOnEnded = null;
    this.loopScheduleGen += 1;
    this.stopLoopSourcesOnly();
  }

  stop(): void {
    this.generation += 1;
    this.clearPendingTimeouts();
    this.stopPhraseSourceOnly();
    this.resetLoopSessionState();
    this.phraseStartCtxTime = null;
    this.phraseBufferDurationSec = 0;
    this.phraseEnded = false;
    this.isPaused = false;
    this.pausedTimelineSec = 0;
  }

  /** 再生位置を保持したまま一時停止する。戻り値は phrase タイムライン秒。 */
  pause(): number {
    const timeline = this.getPhraseTimelineSec();
    const sec = timeline != null && Number.isFinite(timeline)
      ? Math.max(0, timeline)
      : this.getCurrentTime();
    this.pausedTimelineSec = sec;
    this.isPaused = true;
    this.generation += 1;
    this.clearPendingTimeouts();
    this.stopPhraseSourceOnly();
    if (this.loopSessionActive) {
      this.stopLoopSourcesOnly();
      this.loopScheduleGen += 1;
    }
    return this.pausedTimelineSec;
  }

  isPausedPlayback(): boolean {
    return this.isPaused;
  }

  getPausedTimelineSec(): number {
    return this.pausedTimelineSec;
  }

  dispose(): void {
    this.stop();
    if (this.ctx && !isSharedPhraseAudioContext(this.ctx)) {
      void this.ctx.close();
    } else {
      try {
        this.phraseGain?.disconnect();
      } catch {
        /* ignore */
      }
      try {
        this.masterGain?.disconnect();
      } catch {
        /* ignore */
      }
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
    if (this.loopSessionActive) {
      return this.getLoopTimelineSec();
    }
    if (this.phraseStartCtxTime === null || !this.ctx) {
      return null;
    }
    const delta = this.ctx.currentTime - this.phraseStartCtxTime;
    return Number.isFinite(delta) ? delta : null;
  }

  /**
   * MIDI `timeStamp`（DOMHighResTimeStamp ms）からフレーズタイムライン秒を推定。
   * ハンドラ実行遅延よりパケット時刻を優先する。
   */
  getPhraseTimelineSecFromDomTimeStamp(domTimeStampMs: number): number | null {
    if (this.loopSessionActive) {
      return this.getLoopTimelineSec();
    }
    if (this.phraseStartCtxTime === null || !this.ctx) {
      return null;
    }
    const domDeltaSec = (domTimeStampMs - performance.now()) / 1000;
    const ctxAtInput = this.ctx.currentTime + domDeltaSec;
    const timeline = ctxAtInput - this.phraseStartCtxTime;
    return Number.isFinite(timeline) ? timeline : null;
  }

  isLoopSessionActive(): boolean {
    return this.loopSessionActive;
  }

  getLoopTimelineSec(): number | null {
    if (!this.loopSessionActive || this.loopAnchorCtxTime === null || !this.ctx) {
      return null;
    }
    const delta = this.ctx.currentTime - this.loopAnchorCtxTime;
    return Number.isFinite(delta) ? delta : null;
  }

  async prepareAllSemitones(
    url: string,
    semitones: readonly number[],
    options: {
      speedPercent?: number;
      onProgress?: (progress: PrepareAllSemitonesProgress) => void;
    } = {},
  ): Promise<Map<number, AudioBuffer>> {
    const ctx = this.createCtx();
    const speedPercent = clampPracticeSpeedPercent(options.speedPercent ?? this.playbackSpeedPercent);
    const raw = await this.decodeRawBuffer(ctx, url);
    const result = new Map<number, AudioBuffer>();
    const total = semitones.length;

    for (let index = 0; index < semitones.length; index += 1) {
      const semitone = semitones[index] ?? 0;
      const cacheKey = buildPhrasePrepareCacheKey(url, semitone, speedPercent);
      let promise = this.preparedByCacheKey.get(cacheKey);
      if (!promise) {
        promise = processOfflinePhraseBuffer(raw, { semitones: semitone, speedPercent });
        this.preparedByCacheKey.set(cacheKey, promise);
      }
      const buffer = await promise;
      result.set(semitone, buffer);
      options.onProgress?.({ completed: index + 1, total, semitone });
    }

    return result;
  }

  startLoopSession(params: StartLoopSessionParams): void {
    const ctx = this.createCtx();
    const master = this.masterGain;
    const phraseOut = this.phraseGain;
    if (!master || !phraseOut) {
      return;
    }

    this.stop();
    const scheduleGen = this.generation;
    const phraseGainLinear = Math.max(0, Math.min(1, params.phraseGain ?? 1));
    const loopDurationSec = Math.max(1e-6, params.loopDurationSec);
    const loopStartSec = Math.max(0, params.loopStartSec);
    const loopPrimingOffsetSec = Math.max(0, params.loopPrimingOffsetSec ?? 0);

    this.loopSessionActive = true;
    this.loopDurationSec = loopDurationSec;
    this.loopStartSec = loopStartSec;
    this.loopPrimingOffsetSec = loopPrimingOffsetSec;
    this.loopBuffersBySemitone = new Map(params.buffersBySemitone);
    this.loopSemitoneForCycle = params.semitoneForCycle;
    this.loopOnEnded = params.onEnded ?? null;
    this.loopScheduleGen = scheduleGen;
    this.phraseEnded = false;
    this.isPaused = false;

    void ctx.resume().then(async () => {
      if (scheduleGen !== this.generation) {
        return;
      }
      phraseOut.gain.value = phraseGainLinear;

      const beats = clampCountInBeats(params.countInBeats);
      let phraseStart = ctx.currentTime + CHORD_VOICING_PHRASE_PLAYER_LEAD_IN_SEC;

      if (beats > 0) {
        let clickBuffer: AudioBuffer;
        try {
          clickBuffer = await this.ensureCountInClickBuffer(ctx);
        } catch {
          this.resetLoopSessionState();
          return;
        }
        if (scheduleGen !== this.generation) {
          return;
        }

        const bpm = Math.max(20, Math.min(400, params.bpm));
        const safeGain = Math.max(0, Math.min(1, params.beatGain));
        const spb = 60 / bpm;
        const firstClick = ctx.currentTime + CHORD_VOICING_PHRASE_PLAYER_LEAD_IN_SEC;
        phraseStart = firstClick + beats * spb;

        for (let i = 0; i < beats; i += 1) {
          const clickGain = i === 0 ? COUNT_IN_FIRST_CLICK_GAIN : COUNT_IN_CLICK_GAIN;
          scheduleClickBuffer(ctx, clickBuffer, firstClick + i * spb, safeGain * clickGain, master);
        }

        if (params.onPhraseStarted) {
          const delayMs = Math.max(0, Math.ceil((phraseStart - ctx.currentTime) * 1000));
          const timer = window.setTimeout(() => {
            if (scheduleGen !== this.generation) {
              return;
            }
            params.onPhraseStarted?.();
          }, delayMs);
          this.pendingTimeouts.push(timer);
        }
      } else if (params.onPhraseStarted) {
        const delayMs = Math.max(0, Math.ceil((phraseStart - ctx.currentTime) * 1000));
        const timer = window.setTimeout(() => {
          if (scheduleGen !== this.generation) {
            return;
          }
          params.onPhraseStarted?.();
        }, delayMs);
        this.pendingTimeouts.push(timer);
      }

      this.loopAnchorCtxTime = phraseStart;
      this.phraseStartCtxTime = phraseStart;
      this.phraseBufferDurationSec = Number.POSITIVE_INFINITY;
      this.ensureLoopCyclesScheduled(0, 2);
    }).catch(() => {
      this.resetLoopSessionState();
    });
  }

  private ensureLoopCyclesScheduled(fromCycle: number, throughCycle: number): void {
    if (!this.loopSessionActive || !this.ctx || !this.phraseGain || !this.loopSemitoneForCycle) {
      return;
    }
    const scheduleGen = this.loopScheduleGen;
    const ctx = this.ctx;
    const phraseOut = this.phraseGain;
    const anchor = this.loopAnchorCtxTime;
    if (anchor === null) {
      return;
    }

    for (let cycleIndex = fromCycle; cycleIndex <= throughCycle; cycleIndex += 1) {
      if (this.scheduledLoopCycles.has(cycleIndex)) {
        continue;
      }
      const semitone = this.loopSemitoneForCycle(cycleIndex);
      const buffer = this.loopBuffersBySemitone?.get(semitone);
      if (!buffer) {
        continue;
      }

      const cycleStart = anchor + cycleIndex * this.loopDurationSec;
      // 途中再開・シーク時は周回の頭が過去になる。経過分だけバッファ内を進めて残りだけ鳴らす。
      const elapsedInCycleSec = Math.max(0, ctx.currentTime - cycleStart);
      if (elapsedInCycleSec >= this.loopDurationSec) {
        continue;
      }
      const when = Math.max(ctx.currentTime, cycleStart);
      const playDurationSec = this.loopDurationSec - elapsedInCycleSec;
      const bufferOffsetSec = Math.min(
        Math.max(0, this.loopStartSec + this.loopPrimingOffsetSec + elapsedInCycleSec),
        Math.max(0, buffer.duration - 1e-6),
      );
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(phraseOut);
      this.loopSources.add(source);
      this.scheduledLoopCycles.add(cycleIndex);

      source.onended = () => {
        if (scheduleGen !== this.loopScheduleGen) {
          return;
        }
        this.loopSources.delete(source);
        this.scheduledLoopCycles.delete(cycleIndex);
        this.ensureLoopCyclesScheduled(cycleIndex + 1, cycleIndex + 3);
      };

      try {
        source.start(when, bufferOffsetSec, playDurationSec);
      } catch {
        this.loopSources.delete(source);
        this.scheduledLoopCycles.delete(cycleIndex);
        if (cycleIndex === 0) {
          this.loopOnEnded?.();
        }
      }
    }
  }

  resumeLoopSessionFromTimelineSec(timelineSec: number): void {
    if (!this.loopSessionActive || !this.ctx || !this.phraseGain) {
      return;
    }
    const safeTimeline = Math.max(0, timelineSec);
    this.stopLoopSourcesOnly();
    this.loopScheduleGen += 1;
    this.loopAnchorCtxTime = this.ctx.currentTime - safeTimeline;
    this.phraseStartCtxTime = this.loopAnchorCtxTime;
    this.phraseEnded = false;
    this.isPaused = false;
    const startCycle = Math.floor(safeTimeline / this.loopDurationSec);
    this.ensureLoopCyclesScheduled(startCycle, startCycle + 2);
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
        Math.max(0, params.startOffsetSec ?? 0),
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
        0,
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
    bufferOffsetSec = 0,
  ): void {
    if (scheduleGen !== this.generation) {
      return;
    }

    const safeOffset = Math.max(0, Math.min(buffer.duration, bufferOffsetSec));
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(phraseOutput);

    this.phraseStartCtxTime = when - safeOffset;
    this.phraseBufferDurationSec = buffer.duration;
    this.phraseEnded = false;
    this.isPaused = false;
    this.pausedTimelineSec = safeOffset;
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
      const fireAt = safeOffset <= 0 ? when : when;
      const delayMs = Math.max(0, Math.ceil((fireAt - ctx.currentTime) * 1000));
      const timer = window.setTimeout(() => {
        if (scheduleGen !== this.generation) {
          return;
        }
        onPhraseStarted();
      }, delayMs);
      this.pendingTimeouts.push(timer);
    }

    try {
      source.start(when, safeOffset);
    } catch {
      this.phraseEnded = true;
      this.activePhraseSource = null;
      onEnded?.();
    }
  }
}
