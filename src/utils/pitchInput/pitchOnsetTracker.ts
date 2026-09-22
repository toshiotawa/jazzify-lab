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
  /** ピッチ安定フレーム数 */
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
  /** 高速反応 ON のとき、この confidence 以上ならレガートを 1 フレームで切る */
  fastLegatoConfidence: number;
  /** Phrase Defense の期待音を 1 フレームで採用する confidence */
  expectedAssistConfidence: number;
  /** 高速反応。ON のときだけ fastLegatoConfidence の 1 フレーム遷移を許す。 */
  fastResponse: boolean;
  /** 1 観測あたりの原音時間 (ms)。q=1 は 5、q=2 は 10。 */
  frameDurationMs: number;
  /** false のとき 1 観測だけでは即 noteOn しない（+12 実験用）。 */
  allowImmediateFirstFrame: boolean;
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
  fastLegatoConfidence: 0.8,
  expectedAssistConfidence: 0.38,
  fastResponse: false,
  frameDurationMs: 5,
  allowImmediateFirstFrame: true,
};

/** 感度 1-10 の minConfidence。9 は 0.30、10 は 0.35。 */
const minConfidenceForSensitivity = (level: number): number => {
  if (level >= 10) return 0.35;
  if (level === 9) return 0.30;
  if (level >= 5) return 0.5 - (level - 5) * 0.03;
  return 0.5 + (5 - level) * 0.0375;
};

/** 感度 1-10 から dB / confidence しきい値をスケール */
export const scaleOnsetConfigForSensitivity = (
  sensitivity: number,
  base: PitchOnsetTrackerConfig = DEFAULT_ONSET_CONFIG,
): PitchOnsetTrackerConfig => {
  const level = Math.max(1, Math.min(10, Math.round(sensitivity)));
  const scale = Math.pow(10, (5 - level) * 0.17);
  const minConfidence = minConfidenceForSensitivity(level);
  return {
    ...base,
    onsetLevelDb: base.onsetLevelDb + 10 * Math.log10(scale),
    releaseLevelDb: base.releaseLevelDb + 10 * Math.log10(scale),
    minConfidence,
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
  /** 直近 3 フレームの量子化 MIDI。未使用は -1。 */
  private legatoHitNotes: number[] = [-1, -1, -1];
  private legatoHitIndex = 0;
  /** pitch class のビットマスク。0 は補助なし。 */
  private expectedPitchMask = 0;

  constructor(config: Partial<PitchOnsetTrackerConfig> = DEFAULT_ONSET_CONFIG) {
    this.config = { ...DEFAULT_ONSET_CONFIG, ...config };
  }

  setConfig(config: Partial<PitchOnsetTrackerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /** Phrase Defense 以外は 0。通常の自由演奏には使わない。 */
  setExpectedPitchMask(mask: number): void {
    this.expectedPitchMask = mask & 0xfff;
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
    this.legatoHitNotes[0] = -1;
    this.legatoHitNotes[1] = -1;
    this.legatoHitNotes[2] = -1;
    this.legatoHitIndex = 0;
  }

  /** 低音シフト切替などで推論状態を捨てる前に noteOff を返す。 */
  flushActiveNote(frameIndex: number): PitchInputEvent[] {
    if (this.currentNote < 0) {
      this.reset();
      return [];
    }
    const events: PitchInputEvent[] = [
      { type: 'noteOff', note: this.currentNote, frameIndex },
    ];
    this.reset();
    return events;
  }

  /** 1 フレーム処理。発生したイベントのみ返す（割当最小化）。 */
  processFrame(frame: PitchFrame, frameIndex: number): PitchInputEvent[] {
    const events: PitchInputEvent[] = [];
    const levelDb = volumeToDb(frame.volume);
    const quantized = frame.prediction > 0 ? quantizeMidi(frame.prediction) : -1;
    const expectedAssist = this.isExpectedAssist(quantized, frame.confidence, levelDb);
    const voiced = expectedAssist || (
      levelDb > this.config.onsetLevelDb
      && frame.confidence >= this.config.minConfidence
      && quantized >= 0
    );
    this.pushLegatoHit(voiced ? quantized : -1);

    if (voiced) {
      if (this.lastStableNote === quantized) {
        this.pitchStableCount += 1;
      } else {
        this.pitchStableCount = 1;
        this.lastStableNote = quantized;
      }

      this.releaseCount = 0;
      this.pendingOff = false;

      if (this.currentNote < 0) {
        if (expectedAssist || this.shouldEmitNoteOn(frame.confidence, true)) {
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
        } else if (expectedAssist || this.shouldEmitLegatoSwitch(quantized, frame.confidence)) {
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
      && this.config.allowImmediateFirstFrame
      && this.pitchStableCount === 1
      && confidence >= this.config.onsetImmediateConfidence
    ) {
      return true;
    }
    return false;
  }

  /**
   * 高速反応かつ超高確信は 1 フレーム。それ以外は直近 3 フレーム中 2 ヒット。
   * 無音からの noteOn には使わない。
   */
  private shouldEmitLegatoSwitch(quantized: number, confidence: number): boolean {
    if (
      this.config.fastResponse
      && confidence >= this.config.fastLegatoConfidence
    ) {
      return true;
    }
    return this.legatoHitCount(quantized) >= 2;
  }

  private isExpectedAssist(quantized: number, confidence: number, levelDb: number): boolean {
    if (this.expectedPitchMask === 0 || quantized < 0) return false;
    if (levelDb <= this.config.onsetLevelDb) return false;
    if (confidence < this.config.expectedAssistConfidence) return false;
    const pitchClass = ((quantized % 12) + 12) % 12;
    return (this.expectedPitchMask & (1 << pitchClass)) !== 0;
  }

  private pushLegatoHit(note: number): void {
    this.legatoHitNotes[this.legatoHitIndex] = note;
    this.legatoHitIndex = (this.legatoHitIndex + 1) % 3;
  }

  private legatoHitCount(note: number): number {
    let count = 0;
    if (this.legatoHitNotes[0] === note) count += 1;
    if (this.legatoHitNotes[1] === note) count += 1;
    if (this.legatoHitNotes[2] === note) count += 1;
    return count;
  }

  /** 設定上の安定待ち時間 (ms)。 */
  getPitchStableDurationMs(): number {
    return this.config.pitchStableFrames * this.config.frameDurationMs;
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
