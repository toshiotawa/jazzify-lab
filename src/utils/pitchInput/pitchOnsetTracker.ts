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
  /** 同音待ち再アタック: 追加ガード (ms)。0 は retriggerGuardFrames のみ。 */
  repeatRetriggerGuardMs: number;
  /** 生 RMS がピークからこの dB 以上落ちたら release 候補。 */
  releaseRawDropDb: number;
  /** 同音リアタック: 直近 N フレームとの dB 差で立ち上がり判定 */
  retriggerLookbackFrames: number;
  /** Require energy growth in the held note band for unassisted repeats. */
  retriggerRequiresPitchBandRise?: boolean;
  /** 同音待ち: ピークからこの dB 以上下がったら谷候補 */
  repeatDipDb: number;
  /** 同音待ち: 谷からこの dB 以上上がったら再発音 */
  repeatRiseDb: number;
  /** 同音待ち: 速い立ち上がり判定の窓 (ms) */
  repeatAttackWindowMs: number;
  /** 同音待ち: 再発音は直前 attack ピークからこの dB 以内まで回復していること */
  repeatPeakRecoveryMaxDropDb: number;
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
  repeatRetriggerGuardMs: 0,
  releaseRawDropDb: 30,
  retriggerLookbackFrames: 4,
  repeatDipDb: 3,
  repeatRiseDb: 6,
  repeatAttackWindowMs: 40,
  repeatPeakRecoveryMaxDropDb: 6,
  centsTolerance: 40,
  onsetImmediateConfidence: 0.85,
  fastLegatoConfidence: 0.8,
  expectedAssistConfidence: 0.38,
  fastResponse: false,
  frameDurationMs: 5,
  allowImmediateFirstFrame: true,
};

/** 感度 1-10 の minConfidence。9 は 0.30、10 は 0.28。 */
const minConfidenceForSensitivity = (level: number): number => {
  if (level >= 10) return 0.28;
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
  /** Goertzel 包絡 dB。未指定時は volume 由来 dB にフォールバック。 */
  attackDb?: number;
  /** attackDb の測定音。帯域変更時は比較基準を作り直す。 */
  attackMidi?: number;
  /** Hann 窓の広帯域 RMS (dB)。未指定時は releaseRawDropDb を使わない。 */
  rawLevelDb?: number;
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
  private pitchStableStartFrame = -1;
  private lastStableNote = -1;
  private releaseCount = 0;
  private recentLevelDbRing: number[] = [];
  private pendingOff = false;
  private pendingOffFrame = -1;
  /** 直近 3 フレームの量子化 MIDI。未使用は -1。 */
  private legatoHitNotes: number[] = [-1, -1, -1];
  private legatoHitIndex = 0;
  /** pitch class のビットマスク。0 は補助なし。 */
  private expectedPitchMask = 0;
  /** オクターブ判定用の実音 MIDI 候補。 */
  private expectedPitchMidis: number[] = [];
  /** noteOff 後、立ち上がりなしで戻った同音を noteOn にしないための保留音。 */
  private suspendedNote = -1;
  /** suspendedNote を設定した noteOff の frameIndex。 */
  private suspendedNoteOffFrame = -1;
  /** 同音連打待ち pitch class マスク。0 で無効。 */
  private repeatPitchClassMask = 0;
  /** 持続中ノートのピーク dB（同音待ちモード用）。 */
  private notePeakDb = -Infinity;
  /** ピークから repeatDipDb 以上下がった。 */
  private dippedFromPeak = false;
  /** 谷候補以降の最小 dB。 */
  private noteTroughDb = Infinity;
  /** 谷候補を更新した frameIndex。 */
  private noteTroughFrame = -1;
  /** 同音待ち: attackDb ピーク（再発音検出用）。 */
  private notePeakAttackDb = -Infinity;
  /** attackDb 谷候補。 */
  private noteTroughAttackDb = Infinity;
  /** attackDb 谷候補 frameIndex。 */
  private noteTroughAttackFrame = -1;
  /** attackDb 直近リング。 */
  private recentAttackDbRing: number[] = [];
  private recentFrameRing: number[] = [];
  private attackMidi = -1;
  private processingFrameIndex = 0;
  /** ノート中の生 RMS ピーク (dB)。 */
  private noteRawPeakDb = -Infinity;

  constructor(config: Partial<PitchOnsetTrackerConfig> = DEFAULT_ONSET_CONFIG) {
    this.config = { ...DEFAULT_ONSET_CONFIG, ...config };
  }

  setConfig(config: Partial<PitchOnsetTrackerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /** Phrase Defense 以外は 0。通常の自由演奏には使わない。 */
  setExpectedPitchMask(mask: number): void {
    this.setExpectedPitchCandidates(mask, []);
  }

  setExpectedPitchCandidates(
    mask: number,
    midis: readonly number[],
    repeatPitchClassMask = 0,
  ): void {
    this.expectedPitchMask = mask & 0xfff;
    this.expectedPitchMidis = midis.map((midi) => Math.round(midi));
    this.repeatPitchClassMask = repeatPitchClassMask & 0xfff;
  }

  reset(): void {
    this.currentNote = -1;
    this.noteOnFrame = -1;
    this.lastNoteOnFrame = -1;
    this.pitchStableCount = 0;
    this.pitchStableStartFrame = -1;
    this.lastStableNote = -1;
    this.releaseCount = 0;
    this.recentLevelDbRing = [];
    this.pendingOff = false;
    this.pendingOffFrame = -1;
    this.legatoHitNotes[0] = -1;
    this.legatoHitNotes[1] = -1;
    this.legatoHitNotes[2] = -1;
    this.legatoHitIndex = 0;
    this.suspendedNote = -1;
    this.suspendedNoteOffFrame = -1;
    this.resetRepeatPeakState();
    this.recentFrameRing = [];
    this.attackMidi = -1;
    this.noteRawPeakDb = -Infinity;
  }

  private resetRepeatPeakState(): void {
    this.notePeakDb = -Infinity;
    this.dippedFromPeak = false;
    this.noteTroughDb = Infinity;
    this.noteTroughFrame = -1;
    this.notePeakAttackDb = -Infinity;
    this.noteTroughAttackDb = Infinity;
    this.noteTroughAttackFrame = -1;
    this.recentAttackDbRing = [];
  }

  private resolveAttackLevelDb(frame: PitchFrame, levelDb: number): number {
    if (frame.attackDb !== undefined && Number.isFinite(frame.attackDb)) {
      return frame.attackDb;
    }
    return levelDb;
  }

  /** 低音シフト切替などで推論状態を捨てる前に noteOff を返す。 */
  flushActiveNote(frameIndex: number, preserveRepeatGate = false): PitchInputEvent[] {
    const note = this.currentNote >= 0 ? this.currentNote : this.suspendedNote;
    const keepRepeatNote = preserveRepeatGate && this.isRepeatPitchClassActive(note);
    const events: PitchInputEvent[] = this.currentNote >= 0
      ? [{ type: 'noteOff', note: this.currentNote, frameIndex }]
      : [];
    this.reset();
    // 音声欠落は発音ではない。フレーム時計を捨てても同音待ちは残す。
    if (keepRepeatNote) this.suspendedNote = note;
    return events;
  }

  /** 1 フレーム処理。発生したイベントのみ返す（割当最小化）。 */
  processFrame(frame: PitchFrame, frameIndex: number): PitchInputEvent[] {
    this.processingFrameIndex = frameIndex;
    const events: PitchInputEvent[] = [];
    const levelDb = volumeToDb(frame.volume);
    const attackLevelDb = this.resolveAttackLevelDb(frame, levelDb);
    const belowRawRelease = this.isBelowRawRelease(frame.rawLevelDb);
    if (
      frame.rawLevelDb !== undefined
      && Number.isFinite(frame.rawLevelDb)
      && this.currentNote >= 0
      && frame.rawLevelDb > this.noteRawPeakDb
    ) {
      this.noteRawPeakDb = frame.rawLevelDb;
    }
    if (frame.attackMidi !== undefined && frame.attackMidi !== this.attackMidi) {
      // 異なる帯域の dB 差を鍵盤の再アタックとして扱わない。
      this.attackMidi = frame.attackMidi;
      this.resetRepeatPeakState();
      this.notePeakAttackDb = attackLevelDb;
      this.noteTroughAttackDb = attackLevelDb;
      this.recentLevelDbRing.length = 0;
      this.recentFrameRing.length = 0;
    }
    if (this.isRepeatPitchClassActive(this.suspendedNote) && !Number.isFinite(this.notePeakAttackDb)) {
      // 復帰後の最初の包絡は基準値にし、復帰そのものをアタックにしない。
      this.notePeakAttackDb = attackLevelDb;
      this.noteTroughAttackDb = attackLevelDb;
    }
    const quantized = frame.prediction > 0 ? quantizeMidi(frame.prediction) : -1;
    const expectedAssist = this.isExpectedAssist(quantized, frame.confidence, levelDb);
    const confidenceVoiced = (
      levelDb > this.config.onsetLevelDb
      && frame.confidence >= this.config.minConfidence
      && quantized >= 0
    );
    const sustainingSameNote = (
      this.currentNote >= 0
      && quantized >= 0
      && levelDb >= this.config.releaseLevelDb
      && !belowRawRelease
      && pitchMatch(frame.prediction, this.currentNote, this.config.centsTolerance)
    );
    const voiced = expectedAssist || confidenceVoiced || sustainingSameNote;
    this.pushLegatoHit(voiced ? quantized : -1);

    if (voiced) {
      if (this.lastStableNote === quantized) {
        this.pitchStableCount += 1;
      } else {
        this.pitchStableCount = 1;
        this.pitchStableStartFrame = frameIndex;
        this.lastStableNote = quantized;
      }

      this.releaseCount = 0;
      this.pendingOff = false;

      if (this.currentNote < 0) {
        const withinRetriggerGuard = (
          this.suspendedNoteOffFrame >= 0
          && frameIndex - this.suspendedNoteOffFrame < this.config.retriggerGuardFrames
        );
        if (
          this.isSamePitchClass(quantized, this.suspendedNote)
          && this.isRepeatPitchClassActive(this.suspendedNote)
        ) {
          const withinRepeatRetriggerGuard = (
            frameIndex - this.lastNoteOnFrame < this.repeatRetriggerGuardFrames()
          );
          if (
            !withinRepeatRetriggerGuard
            && this.hasRepeatModeAttack(
              attackLevelDb,
              quantized === this.suspendedNote,
            )
          ) {
            this.suspendedNote = -1;
            this.emitNoteOn(
              events,
              quantized,
              frameIndex,
              this.resolveRepeatModeOnsetFrameIndex(frameIndex),
              levelDb,
              attackLevelDb,
              false,
              frame.rawLevelDb,
            );
          } else {
            this.resumeSuspendedNote(this.suspendedNote, frameIndex);
          }
        } else if (
          quantized === this.suspendedNote
          && withinRetriggerGuard
          && this.recentLevelRise(levelDb) < this.config.attackRiseDb
        ) {
          this.resumeSuspendedNote(quantized, frameIndex);
        } else if (this.shouldStartNoteOn(expectedAssist, frame.confidence, quantized)) {
          this.suspendedNote = -1;
          this.emitNoteOn(
            events,
            quantized,
            frameIndex,
            this.pitchStableStartFrame,
            levelDb,
            attackLevelDb,
            false,
            frame.rawLevelDb,
          );
        }
      } else if (
        quantized !== this.currentNote
        && !pitchMatch(frame.prediction, this.currentNote, this.config.centsTolerance)
      ) {
        if (this.shouldTreatRepeatModePitchWobble(quantized)) {
          if (
            quantized === this.currentNote
            || this.isSamePitchClass(quantized, this.currentNote)
          ) {
            this.updateRepeatPeakAndDip(levelDb, attackLevelDb, frameIndex);
            this.recordLevels(levelDb, attackLevelDb, frameIndex);
            if (this.allowsRepeatRetrigger(confidenceVoiced, expectedAssist)) {
              this.tryRetrigger(events, levelDb, attackLevelDb, frameIndex);
            }
          } else {
            this.updateRepeatTroughOnly(levelDb, attackLevelDb, frameIndex);
            this.recordLevels(levelDb, attackLevelDb, frameIndex);
          }
        } else if (this.shouldHoldRepeatModeUnexpectedPitch(quantized)) {
          this.updateRepeatTroughOnly(levelDb, attackLevelDb, frameIndex);
          this.recordLevels(levelDb, attackLevelDb, frameIndex);
        } else {
          const octaveRelated = this.isOctaveRelatedJump(quantized);
          if (octaveRelated && this.isLikelyOctaveJump(quantized, levelDb, attackLevelDb, frame.confidence)) {
            // 倍音由来の ±12/±24 セミトーン飛びは PC 判定に影響しないため無視。
          } else if (this.shouldCommitPitchChange(
            quantized,
            levelDb,
            attackLevelDb,
            frame.confidence,
            octaveRelated,
          )) {
            this.suspendedNote = -1;
            this.emitNoteOff(events, this.currentNote, frameIndex);
            this.emitNoteOn(
              events,
              quantized,
              frameIndex,
              this.pitchStableStartFrame,
              levelDb,
              attackLevelDb,
              false,
              frame.rawLevelDb,
            );
          }
        }
      } else {
        if (this.isRepeatPitchClassActive(this.currentNote)) {
          this.updateRepeatPeakAndDip(levelDb, attackLevelDb, frameIndex);
          this.recordLevels(levelDb, attackLevelDb, frameIndex);
        }
        if (this.allowsRepeatRetrigger(confidenceVoiced, expectedAssist)) {
          this.tryRetrigger(events, levelDb, attackLevelDb, frameIndex);
        }
      }
    } else {
      this.pitchStableCount = 0;
      this.pitchStableStartFrame = -1;
      this.lastStableNote = -1;
      if (this.currentNote >= 0 || this.suspendedNote >= 0) {
        this.recordLevels(levelDb, attackLevelDb, frameIndex);
      }
      const repeatNote = this.currentNote >= 0 ? this.currentNote : this.suspendedNote;
      if (repeatNote >= 0 && this.isRepeatPitchClassActive(repeatNote)) {
        this.updateRepeatTroughOnly(levelDb, attackLevelDb, frameIndex);
      }

      if (this.currentNote >= 0) {
        const belowRelease = levelDb < this.config.releaseLevelDb || belowRawRelease;
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

  private shouldStartNoteOn(
    expectedAssist: boolean,
    confidence: number,
    quantized: number,
  ): boolean {
    if (expectedAssist) {
      return this.legatoHitCount(quantized) >= 2;
    }
    return this.shouldEmitNoteOn(confidence, true);
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
  private isOctaveRelatedJump(quantized: number): boolean {
    if (this.currentNote < 0) return false;
    const diff = Math.abs(quantized - this.currentNote);
    return diff === 12 || diff === 24;
  }

  private shouldCommitPitchChange(
    quantized: number,
    levelDb: number,
    attackLevelDb: number,
    confidence: number,
    octaveRelated: boolean,
  ): boolean {
    if (octaveRelated) {
      const samePitchClass = this.isSamePitchClass(quantized, this.currentNote);
      if (samePitchClass && this.isRepeatPitchClassActive(this.currentNote)) {
        if (
          this.processingFrameIndex - this.lastNoteOnFrame
          < this.repeatRetriggerGuardFrames()
        ) {
          return false;
        }
        return this.hasRepeatModeAttack(
          attackLevelDb,
          quantized === this.currentNote,
        );
      }
      if (this.expectedPitchMidis.includes(quantized)) {
        if (this.recentLevelRise(levelDb) >= this.config.attackRiseDb) return true;
        return this.legatoHitCount(quantized) >= 2;
      }
    }
    return this.shouldEmitLegatoSwitch(quantized, confidence);
  }

  private shouldEmitLegatoSwitch(quantized: number, confidence: number): boolean {
    if (
      !this.isOctaveRelatedJump(quantized)
      && this.config.fastResponse
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

  private isLikelyOctaveJump(
    quantized: number,
    levelDb: number,
    attackLevelDb: number,
    confidence: number,
  ): boolean {
    if (this.currentNote < 0) return false;
    const diff = Math.abs(quantized - this.currentNote);
    if (diff !== 12 && diff !== 24) return false;

    const rise = this.recentLevelRise(levelDb);
    if (this.isSamePitchClass(quantized, this.currentNote)
      && this.isRepeatPitchClassActive(this.currentNote)) {
      if (
        this.processingFrameIndex - this.lastNoteOnFrame
        < this.repeatRetriggerGuardFrames()
      ) {
        return true;
      }
      if (
        quantized > this.currentNote
        && !this.expectedPitchMidis.includes(quantized)
      ) {
        return true;
      }
      return !this.hasRepeatModeAttack(attackLevelDb, false);
    }

    if (this.expectedPitchMidis.includes(quantized)) {
      if (rise >= this.config.attackRiseDb) return false;
      if (this.shouldEmitLegatoSwitch(quantized, confidence)) return false;
      return true;
    }

    return rise < this.config.attackRiseDb;
  }

  private resumeSuspendedNote(note: number, frameIndex: number): void {
    this.currentNote = note;
    this.noteOnFrame = frameIndex;
    this.releaseCount = 0;
    this.pendingOff = false;
    this.suspendedNote = -1;
  }

  private allowsRepeatRetrigger(confidenceVoiced: boolean, expectedAssist: boolean): boolean {
    return confidenceVoiced || expectedAssist;
  }

  private emitNoteOn(
    events: PitchInputEvent[],
    note: number,
    frameIndex: number,
    onsetFrameIndex: number,
    levelDb?: number,
    attackLevelDb?: number,
    preserveAttackPeakReference = false,
    rawLevelDb?: number,
  ): void {
    const prevPeakAttackDb = this.notePeakAttackDb;
    this.currentNote = note;
    this.noteOnFrame = frameIndex;
    this.lastNoteOnFrame = frameIndex;
    this.recentLevelDbRing = [];
    this.recentFrameRing = [];
    this.suspendedNote = -1;
    this.suspendedNoteOffFrame = -1;
    this.resetRepeatPeakState();
    if (levelDb !== undefined && Number.isFinite(levelDb)) {
      this.notePeakDb = levelDb;
      this.noteTroughDb = levelDb;
    }
    if (attackLevelDb !== undefined && Number.isFinite(attackLevelDb)) {
      if (
        preserveAttackPeakReference
        && Number.isFinite(prevPeakAttackDb)
      ) {
        const floor = prevPeakAttackDb - this.config.repeatPeakRecoveryMaxDropDb;
        this.notePeakAttackDb = Math.max(attackLevelDb, floor);
      } else {
        this.notePeakAttackDb = attackLevelDb;
      }
      this.noteTroughAttackDb = attackLevelDb;
    }
    if (rawLevelDb !== undefined && Number.isFinite(rawLevelDb)) {
      this.noteRawPeakDb = rawLevelDb;
    } else {
      this.noteRawPeakDb = -Infinity;
    }
    events.push({ type: 'noteOn', note, frameIndex, onsetFrameIndex });
  }

  private isBelowRawRelease(rawLevelDb: number | undefined): boolean {
    if (rawLevelDb === undefined || !Number.isFinite(rawLevelDb)) return false;
    if (!Number.isFinite(this.noteRawPeakDb)) return false;
    return rawLevelDb < this.noteRawPeakDb - this.config.releaseRawDropDb;
  }

  private repeatRetriggerGuardFrames(): number {
    const frameMs = Math.max(1, this.config.frameDurationMs);
    return Math.max(
      this.config.retriggerGuardFrames,
      Math.round(this.config.repeatRetriggerGuardMs / frameMs),
    );
  }

  private isSamePitchClass(a: number, b: number): boolean {
    if (a < 0 || b < 0) return false;
    const pcA = ((a % 12) + 12) % 12;
    const pcB = ((b % 12) + 12) % 12;
    return pcA === pcB;
  }

  private isRepeatPitchClassActive(note: number): boolean {
    if (note < 0) return false;
    const pitchClass = ((note % 12) + 12) % 12;
    // 譜面の期待音も再アタックを要求する。正解後のマスク更新を待たない。
    const mask = this.repeatPitchClassMask
      | (this.expectedPitchMidis.length > 0 ? this.expectedPitchMask : 0);
    return (mask & (1 << pitchClass)) !== 0;
  }

  /** 同音待ち中に期待実音以外へ逸れた誤検出はレガート切替しない。 */
  private shouldHoldRepeatModeUnexpectedPitch(quantized: number): boolean {
    if (this.currentNote < 0 || !this.isRepeatPitchClassActive(this.currentNote)) {
      return false;
    }
    if (this.shouldTreatRepeatModePitchWobble(quantized)) {
      return false;
    }
    if (this.isOctaveRelatedJump(quantized)) {
      return false;
    }
    if (this.expectedPitchMidis.includes(quantized)) {
      return false;
    }
    if (this.expectedPitchMask !== 0) {
      const pitchClass = ((quantized % 12) + 12) % 12;
      if ((this.expectedPitchMask & (1 << pitchClass)) !== 0) {
        return false;
      }
    }
    return true;
  }

  /** 同音・オクターブ・期待されていない半音揺れは再発音にしない。 */
  private shouldTreatRepeatModePitchWobble(quantized: number): boolean {
    if (this.currentNote < 0 || !this.isRepeatPitchClassActive(this.currentNote)) {
      return false;
    }
    if (quantized === this.currentNote) {
      return true;
    }
    if (this.isSamePitchClass(quantized, this.currentNote)) {
      if (
        quantized !== this.currentNote
        && this.isOctaveRelatedJump(quantized)
        && quantized > this.currentNote
        && !this.expectedPitchMidis.includes(quantized)
      ) {
        return true;
      }
      if (quantized !== this.currentNote && this.isOctaveRelatedJump(quantized)) {
        return false;
      }
      return true;
    }
    // 楽譜が実際に半音進行を要求している場合はレガート遷移を許す。
    const nextPc = ((quantized % 12) + 12) % 12;
    if ((this.expectedPitchMask & (1 << nextPc)) !== 0) return false;
    return Math.abs(quantized - this.currentNote) === 1;
  }

  private updateRepeatPeakAndDip(
    levelDb: number,
    attackLevelDb: number,
    frameIndex: number,
  ): void {
    if (levelDb > this.notePeakDb) {
      this.notePeakDb = levelDb;
    }
    if (attackLevelDb > this.notePeakAttackDb) {
      this.notePeakAttackDb = attackLevelDb;
    }
    this.updateRepeatTroughOnly(levelDb, attackLevelDb, frameIndex);
  }

  private updateRepeatTroughOnly(
    levelDb: number,
    attackLevelDb: number,
    frameIndex: number,
  ): void {
    if (this.notePeakAttackDb - attackLevelDb >= this.config.repeatDipDb) {
      this.dippedFromPeak = true;
    }
    if (this.dippedFromPeak && attackLevelDb <= this.noteTroughAttackDb) {
      this.noteTroughAttackDb = attackLevelDb;
      this.noteTroughAttackFrame = frameIndex;
    }
  }

  private repeatAttackLookbackFrames(): number {
    const frameMs = Math.max(1, this.config.frameDurationMs);
    return Math.max(
      this.config.retriggerLookbackFrames,
      Math.round(this.config.repeatAttackWindowMs / frameMs),
    );
  }

  private recentLookbackStart(lookbackFrames: number): number {
    const latestFrame = this.processingFrameIndex;
    const earliestFrame = latestFrame - lookbackFrames + 1;
    let start = 0;
    while (start < this.recentFrameRing.length && this.recentFrameRing[start] < earliestFrame) {
      start += 1;
    }
    return start;
  }

  private hasRepeatModeAttack(
    attackLevelDb: number,
    requirePeakRecovery = false,
  ): boolean {
    if (!this.dippedFromPeak) return false;
    if (attackLevelDb - this.noteTroughAttackDb < this.config.repeatRiseDb) return false;
    if (
      requirePeakRecovery
      && Number.isFinite(this.notePeakAttackDb)
      && attackLevelDb < this.notePeakAttackDb - this.config.repeatPeakRecoveryMaxDropDb
    ) {
      return false;
    }
    return this.recentAttackRiseWithinLookback(
      attackLevelDb,
      this.repeatAttackLookbackFrames(),
    ) >= this.config.repeatRiseDb;
  }

  private recentAttackRiseWithinLookback(attackLevelDb: number, lookbackFrames: number): number {
    const start = this.recentLookbackStart(lookbackFrames);
    let minRecent = attackLevelDb;
    for (let i = start; i < this.recentAttackDbRing.length; i += 1) {
      minRecent = Math.min(minRecent, this.recentAttackDbRing[i] ?? attackLevelDb);
    }
    return attackLevelDb - minRecent;
  }

  private emitNoteOff(
    events: PitchInputEvent[],
    note: number,
    frameIndex: number,
  ): void {
    if (this.currentNote !== note) return;
    this.suspendedNote = note;
    this.suspendedNoteOffFrame = frameIndex;
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

  private recordLevels(
    levelDb: number,
    attackLevelDb: number,
    frameIndex: number,
  ): void {
    this.recentFrameRing.push(frameIndex);
    this.recentLevelDbRing.push(levelDb);
    this.recentAttackDbRing.push(attackLevelDb);
    const maxRing = Math.max(
      this.config.retriggerLookbackFrames,
      this.config.retriggerGuardFrames,
      this.repeatRetriggerGuardFrames(),
      this.repeatAttackLookbackFrames(),
    );
    if (this.recentFrameRing.length > maxRing) {
      this.recentFrameRing.shift();
    }
    if (this.recentLevelDbRing.length > maxRing) {
      this.recentLevelDbRing.shift();
    }
    if (this.recentAttackDbRing.length > maxRing) {
      this.recentAttackDbRing.shift();
    }
  }

  private recentTroughIndex(): number {
    const start = this.recentLookbackStart(this.config.retriggerLookbackFrames);
    let trough = -1;
    for (let i = start; i < this.recentLevelDbRing.length; i += 1) {
      if (trough < 0 || this.recentLevelDbRing[i] <= this.recentLevelDbRing[trough]) trough = i;
    }
    return trough;
  }

  private recentLevelRise(levelDb: number): number {
    const trough = this.recentTroughIndex();
    return trough < 0 ? 0 : Math.max(0, levelDb - this.recentLevelDbRing[trough]);
  }

  private resolveRepeatModeOnsetFrameIndex(frameIndex: number): number {
    const lookbackStart = frameIndex - this.repeatAttackLookbackFrames();
    let onsetFrameIndex = Math.max(this.lastNoteOnFrame + 1, lookbackStart);
    const troughFrame = this.noteTroughAttackFrame >= 0
      ? this.noteTroughAttackFrame
      : this.noteTroughFrame;
    if (troughFrame >= 0) {
      onsetFrameIndex = Math.max(onsetFrameIndex, troughFrame + 1);
    }
    return onsetFrameIndex;
  }

  private tryRetrigger(
    events: PitchInputEvent[],
    levelDb: number,
    attackLevelDb: number,
    frameIndex: number,
  ): void {
    if (this.currentNote < 0) return;
    if (frameIndex - this.lastNoteOnFrame < this.config.retriggerGuardFrames) {
      if (!this.isRepeatPitchClassActive(this.currentNote)) {
        this.recordLevels(levelDb, attackLevelDb, frameIndex);
      }
      return;
    }

    if (this.isRepeatPitchClassActive(this.currentNote)) {
      if (frameIndex - this.lastNoteOnFrame < this.repeatRetriggerGuardFrames()) {
        this.recordLevels(levelDb, attackLevelDb, frameIndex);
        return;
      }
      if (this.hasRepeatModeAttack(attackLevelDb, true)) {
        const note = this.currentNote;
        const onsetFrameIndex = this.resolveRepeatModeOnsetFrameIndex(frameIndex);
        this.emitNoteOff(events, note, frameIndex);
        this.emitNoteOn(
          events,
          note,
          frameIndex,
          onsetFrameIndex,
          levelDb,
          attackLevelDb,
          true,
        );
      }
      return;
    }

    this.recordLevels(levelDb, attackLevelDb, frameIndex);
    const trough = this.recentTroughIndex();
    if (trough >= 0 && levelDb - this.recentLevelDbRing[trough] >= this.config.attackRiseDb
      && (!this.config.retriggerRequiresPitchBandRise
        || this.recentAttackRiseWithinLookback(attackLevelDb, this.config.retriggerLookbackFrames)
          >= this.config.attackRiseDb)) {
      const note = this.currentNote;
      const onsetFrameIndex = Math.max(
        this.lastNoteOnFrame + 1,
        Math.min(frameIndex, this.recentFrameRing[trough] + 1),
      );
      this.emitNoteOff(events, note, frameIndex);
      this.emitNoteOn(events, note, frameIndex, onsetFrameIndex, levelDb, attackLevelDb);
    }
  }

  /** 正解待ちの音やオクターブ誤検出が変わっても測定帯域を保持する。 */
  getAttackReferenceNote(): number {
    return this.currentNote >= 0 ? this.currentNote : this.suspendedNote;
  }

  getCurrentNote(): number {
    return this.currentNote;
  }
}
