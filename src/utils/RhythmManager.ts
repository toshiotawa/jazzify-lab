/* eslint-disable no-magic-numbers */
export interface RhythmPosition {
  measure: number;      // 1,2,3…
  beat: number;         // 1.0,1.5,2 …
  absoluteBeat: number; // 開始からの累計拍
}

export interface JudgmentWindow {
  start: number;  // ms (Audio currentTime*1000)
  end: number;    // ms
  perfect: boolean;
}

type CB<T> = (arg: T) => void;

export class RhythmManager {
  /** immutable config */
  private readonly bpm: number;
  private readonly tsig: number;
  private readonly loopMeasures: number;

  /** runtime */
  private audio: HTMLAudioElement;
  private lastBeat = -1;
  private lastMeasure = -1;
  private loopCb?: CB<void>;
  private beatCb?: CB<RhythmPosition>;
  private measureCb?: CB<number>;
  private raf = 0;
  private loopCount = 0;

  constructor(cfg: {
    audioUrl: string;
    bpm: number;
    timeSignature: number;
    loopMeasures: number;
    volume?: number;
  }) {
    this.bpm = cfg.bpm;
    this.tsig = cfg.timeSignature;
    this.loopMeasures = cfg.loopMeasures;
    this.audio = new Audio(cfg.audioUrl);
    this.audio.loop = false; // 手動ループ
    this.audio.volume = cfg.volume ?? 0.7;
  }

  /* ───────── public ───────── */
  start(startOffset = 0) {
    this.audio.currentTime = startOffset;
    // Safari 対策: play() promise 無視
    void this.audio.play();
    const tick = () => {
      this.process();
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    cancelAnimationFrame(this.raf);
    this.audio.pause();
  }

  onBeat(cb: CB<RhythmPosition>) { 
    this.beatCb = cb; 
  }

  onMeasure(cb: CB<number>) { 
    this.measureCb = cb; 
  }

  onLoop(cb: CB<void>) { 
    this.loopCb = cb; 
  }

  getCurrentPosition(): RhythmPosition {
    const beatDur = 60 / this.bpm;
    const absBeat = this.audio.currentTime / beatDur;
    const measure = Math.floor(absBeat / this.tsig) + 1;
    const beat = (absBeat % this.tsig) + 1;
    return { 
      measure, 
      beat: +beat.toFixed(3), 
      absoluteBeat: absBeat 
    };
  }

  getJudgmentWindow(measure: number, beat: number): JudgmentWindow {
    const beatDurMs = 60000 / this.bpm;
    const tgtBeatIdx = (measure - 1) * this.tsig + (beat - 1);
    const tgtTimeMs = tgtBeatIdx * beatDurMs;
    const nowMs = this.audio.currentTime * 1000;
    return {
      start: tgtTimeMs - 200,
      end: tgtTimeMs + 200,
      perfect: Math.abs(nowMs - tgtTimeMs) < 50
    };
  }

  // 指定した時刻がタイミングウィンドウ内かチェック
  isInJudgmentWindow(measure: number, beat: number, currentTimeMs: number): boolean {
    const beatDurMs = 60000 / this.bpm;
    const tgtBeatIdx = (measure - 1) * this.tsig + (beat - 1);
    const tgtTimeMs = tgtBeatIdx * beatDurMs;
    const audioTimeMs = this.audio.currentTime * 1000;
    const diff = currentTimeMs - audioTimeMs;
    const adjustedTargetTime = tgtTimeMs + diff;
    return Math.abs(adjustedTargetTime - currentTimeMs) <= 200;
  }

  getTimeToNextBeat(): number {
    const beatDuration = 60 / this.bpm;
    const currentBeatProgress = (this.audio.currentTime % beatDuration) / beatDuration;
    return beatDuration * (1 - currentBeatProgress);
  }

  getLoopCount(): number {
    return this.loopCount;
  }

  /* ───────── internal ───────── */
  private process() {
    const pos = this.getCurrentPosition();

    // ループ判定
    const loopDur = (60 / this.bpm) * this.tsig * this.loopMeasures;
    if (this.audio.currentTime >= loopDur - 0.03) {
      this.audio.currentTime = 0;               // hard-seek
      this.loopCount++;
      this.loopCb?.();                          // notify
      this.lastBeat = -1; 
      this.lastMeasure = -1;
      return;                                   // 今フレームは beat 判定しない
    }

    // beat change
    const intBeat = Math.floor(pos.absoluteBeat);
    if (intBeat !== this.lastBeat) {
      this.lastBeat = intBeat;
      this.beatCb?.(pos);
    }

    // measure change
    const currentMeasure = Math.floor(pos.measure);
    if (currentMeasure !== this.lastMeasure) {
      this.lastMeasure = currentMeasure;
      this.measureCb?.(currentMeasure);
    }
  }
}