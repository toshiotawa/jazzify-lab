/**
 * PitchOnsetTracker - PESTO フレーム列から MIDI 相当の note on/off を生成する状態機械。
 * Web / iOS で同一ロジック・同一パラメータを共有する。
 */

export interface PitchOnsetTrackerConfig {
  /** note on しきい値 (dB) */
  onsetLevelDb: number;
  /** note off しきい値 (dB) — ヒステリシス */
  releaseLevelDb: number;
  /** 最小 confidence [0,1] */
  minConfidence: number;
  /** ピッチ安定フレーム数 (5ms/frame) */
  pitchStableFrames: number;
  /** release 連続フレーム数 */
  releaseFrames: number;
  /** 最小発音フレーム数 (短すぎる off を抑制) */
  minNoteFrames: number;
  /** 同音リアタック: 立ち上がり dB */
  attackRiseDb: number;
  /** 同音リアタック: ガードフレーム数 */
  retriggerGuardFrames: number;
  /** 同音リアタック: 直近 N フレームとの dB 差で立ち上がり判定 */
  retriggerLookbackFrames: number;
  /** グリッサンド抑制: cents 許容 */
  centsTolerance: number;
  /** 1 フレーム目でも confidence がこの値以上なら即 noteOn */
  onsetImmediateConfidence: number;
}

export const DEFAULT_ONSET_CONFIG: PitchOnsetTrackerConfig = {
  onsetLevelDb: -35,
  releaseLevelDb: -45,
  minConfidence: 0.5,
  pitchStableFrames: 4,
  releaseFrames: 4,
  minNoteFrames: 6,
  attackRiseDb: 6,
  retriggerGuardFrames: 6,
  retriggerLookbackFrames: 4,
  centsTolerance: 40,
  onsetImmediateConfidence: 0.85,
};

/** 感度 1-10 から dB しきい値をスケール */
export const scaleOnsetConfigForSensitivity = (
  sensitivity: number,
  base: PitchOnsetTrackerConfig = DEFAULT_ONSET_CONFIG,
): PitchOnsetTrackerConfig => {
  const level = Math.max(1, Math.min(10, Math.round(sensitivity)));
  const scale = Math.pow(10, (5 - level) * 0.17);
  return {
    ...base,
    onsetLevelDb: base.onsetLevelDb + 10 * Math.log10(scale),
    releaseLevelDb: base.releaseLevelDb + 10 * Math.log10(scale),
  };
};

export interface PitchFrame {
  /** セミトーン (MIDI 番号の実数) */
  prediction: number;
  confidence: number;
  /** 線形エネルギー */
  volume: number;
}

export type PitchInputEvent =
  | { type: 'noteOn'; note: number; frameIndex: number; onsetFrameIndex: number }
  | { type: 'noteOff'; note: number; frameIndex: number };

const volumeToDb = (volume: number): number =>
  10 * Math.log10(Math.max(volume, 1e-12));

const quantizeMidi = (semitone: number): number => Math.round(semitone);

const pitchMatch = (a: number, b: number, centsTolerance: number): boolean => {
  const diffCents = Math.abs(a - b) * 100;
  return diffCents <= centsTolerance;
};

export class PitchOnsetTracker {
  private config: PitchOnsetTrackerConfig;
  private currentNote = -1;
  private noteOnFrame = -1;
  private lastNoteOnFrame = -1;
  private pitchStableCount = 0;
  private lastStableNote = -1;
  private releaseCount = 0;
  private recentMinDb = Infinity;
  private recentMinDbFrame = -1;
  private recentLevelDbRing: number[] = [];
  private pendingOff = false;
  private pendingOffFrame = -1;

  constructor(config: PitchOnsetTrackerConfig = DEFAULT_ONSET_CONFIG) {
    this.config = config;
  }

  setConfig(config: PitchOnsetTrackerConfig): void {
    this.config = config;
  }

  reset(): void {
    this.currentNote = -1;
    this.noteOnFrame = -1;
    this.lastNoteOnFrame = -1;
    this.pitchStableCount = 0;
    this.lastStableNote = -1;
    this.releaseCount = 0;
    this.recentMinDb = Infinity;
    this.recentMinDbFrame = -1;
    this.recentLevelDbRing = [];
    this.pendingOff = false;
    this.pendingOffFrame = -1;
  }

  /** 1 フレーム処理。発生したイベントのみ返す（割当最小化）。 */
  processFrame(frame: PitchFrame, frameIndex: number): PitchInputEvent[] {
    const events: PitchInputEvent[] = [];
    const levelDb = volumeToDb(frame.volume);
    const voiced =
      levelDb > this.config.onsetLevelDb &&
      frame.confidence >= this.config.minConfidence &&
      frame.prediction > 0;

    if (voiced) {
      const quantized = quantizeMidi(frame.prediction);
      if (this.lastStableNote === quantized) {
        this.pitchStableCount += 1;
      } else {
        this.pitchStableCount = 1;
        this.lastStableNote = quantized;
      }

      this.releaseCount = 0;
      this.pendingOff = false;

      if (this.currentNote < 0) {
        if (this.shouldEmitNoteOn(frame.confidence, true)) {
          this.emitNoteOn(
            events,
            quantized,
            frameIndex,
            frameIndex - this.pitchStableCount + 1,
          );
        }
      } else if (
        !pitchMatch(frame.prediction, this.currentNote, this.config.centsTolerance)
      ) {
        if (this.isLikelyOctaveJump(quantized, levelDb)) {
          // 倍音由来の ±12/±24 セミトーン飛びは PC 判定に影響しないため無視。
        } else if (this.shouldEmitNoteOn(frame.confidence, false)) {
          this.emitNoteOff(events, this.currentNote, frameIndex);
          this.emitNoteOn(
            events,
            quantized,
            frameIndex,
            frameIndex - this.pitchStableCount + 1,
          );
        }
      } else {
        this.tryRetrigger(events, levelDb, frameIndex);
      }
    } else {
      this.pitchStableCount = 0;
      this.lastStableNote = -1;

      if (this.currentNote >= 0) {
        const belowRelease =
          levelDb < this.config.releaseLevelDb ||
          frame.confidence < this.config.minConfidence;
        if (belowRelease) {
          this.releaseCount += 1;
          if (this.releaseCount >= this.config.releaseFrames) {
            this.scheduleNoteOff(events, this.currentNote, frameIndex);
          }
        } else {
          this.releaseCount = 0;
        }
      }
    }

    this.flushPendingOff(events, frameIndex);
    return events;
  }

  private shouldEmitNoteOn(confidence: number, allowImmediate: boolean): boolean {
    if (this.pitchStableCount >= this.config.pitchStableFrames) return true;
    if (
      allowImmediate
      && this.pitchStableCount === 1
      && confidence >= this.config.onsetImmediateConfidence
    ) {
      return true;
    }
    return false;
  }

  private isLikelyOctaveJump(quantized: number, levelDb: number): boolean {
    if (this.currentNote < 0) return false;
    const diff = Math.abs(quantized - this.currentNote);
    if (diff !== 12 && diff !== 24) return false;
    const lookback = this.config.retriggerLookbackFrames;
    const start = Math.max(0, this.recentLevelDbRing.length - lookback);
    let minRecent = levelDb;
    for (let i = start; i < this.recentLevelDbRing.length; i += 1) {
      minRecent = Math.min(minRecent, this.recentLevelDbRing[i] ?? levelDb);
    }
    return levelDb - minRecent < this.config.attackRiseDb;
  }

  private emitNoteOn(
    events: PitchInputEvent[],
    note: number,
    frameIndex: number,
    onsetFrameIndex: number,
  ): void {
    this.currentNote = note;
    this.noteOnFrame = frameIndex;
    this.lastNoteOnFrame = frameIndex;
    this.recentMinDb = Infinity;
    this.recentMinDbFrame = -1;
    this.recentLevelDbRing = [];
    events.push({ type: 'noteOn', note, frameIndex, onsetFrameIndex });
  }

  private emitNoteOff(
    events: PitchInputEvent[],
    note: number,
    frameIndex: number,
  ): void {
    if (this.currentNote !== note) return;
    this.currentNote = -1;
    this.noteOnFrame = -1;
    this.releaseCount = 0;
    this.pendingOff = false;
    events.push({ type: 'noteOff', note, frameIndex });
  }

  private scheduleNoteOff(
    events: PitchInputEvent[],
    note: number,
    frameIndex: number,
  ): void {
    const noteDuration = frameIndex - this.noteOnFrame;
    if (noteDuration < this.config.minNoteFrames) {
      this.pendingOff = true;
      this.pendingOffFrame = frameIndex;
      return;
    }
    this.emitNoteOff(events, note, frameIndex);
  }

  private flushPendingOff(events: PitchInputEvent[], frameIndex: number): void {
    if (!this.pendingOff || this.currentNote < 0) return;
    const noteDuration = frameIndex - this.noteOnFrame;
    if (noteDuration >= this.config.minNoteFrames) {
      this.emitNoteOff(events, this.currentNote, frameIndex);
    }
  }

  private trackRecentMinDb(levelDb: number, frameIndex: number): void {
    this.recentLevelDbRing.push(levelDb);
    const maxRing = Math.max(this.config.retriggerLookbackFrames, this.config.retriggerGuardFrames);
    if (this.recentLevelDbRing.length > maxRing) {
      this.recentLevelDbRing.shift();
    }
    if (levelDb < this.recentMinDb) {
      this.recentMinDb = levelDb;
      this.recentMinDbFrame = frameIndex;
    }
  }

  private recentLevelRise(levelDb: number): number {
    const lookback = this.config.retriggerLookbackFrames;
    const start = Math.max(0, this.recentLevelDbRing.length - lookback);
    let minRecent = levelDb;
    for (let i = start; i < this.recentLevelDbRing.length; i += 1) {
      minRecent = Math.min(minRecent, this.recentLevelDbRing[i] ?? levelDb);
    }
    return levelDb - minRecent;
  }

  private tryRetrigger(
    events: PitchInputEvent[],
    levelDb: number,
    frameIndex: number,
  ): void {
    if (this.currentNote < 0) return;
    if (frameIndex - this.lastNoteOnFrame < this.config.retriggerGuardFrames) {
      this.trackRecentMinDb(levelDb, frameIndex);
      return;
    }

    this.trackRecentMinDb(levelDb, frameIndex);
    const rise = this.recentLevelRise(levelDb);
    if (rise >= this.config.attackRiseDb) {
      const note = this.currentNote;
      const onsetFrameIndex = Math.max(
        this.lastNoteOnFrame + 1,
        this.recentMinDbFrame + 1,
      );
      this.emitNoteOff(events, note, frameIndex);
      this.emitNoteOn(events, note, frameIndex, onsetFrameIndex);
    }
  }

  getCurrentNote(): number {
    return this.currentNote;
  }
}
