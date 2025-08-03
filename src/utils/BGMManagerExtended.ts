/**
 * Extended BGM Manager for Fantasy Progression Mode
 * Provides precise beat timing and synchronization
 */

interface TimingInfo {
  currentBeat: number; // 現在のビート（小数点含む）
  currentMeasure: number; // 現在の小節
  beatInMeasure: number; // 小節内のビート位置（小数点含む）
  isCountIn: boolean;
  nextChordBeat: number | null; // 次のコード出題タイミング（累計ビート）
  judgmentDeadlineBeat: number | null; // 判定締切タイミング（累計ビート）
}

interface ChordTiming {
  bar: number;
  beat: number;
  chord: string;
}

export class BGMManagerExtended {
  private audio: HTMLAudioElement | null = null;
  private loopBegin = 0;
  private loopEnd = 0;
  private timeUpdateHandler: (() => void) | null = null;
  private bpm = 120;
  private timeSignature = 4;
  private measureCount = 8;
  private countInMeasures = 0;
  private startTime = 0;
  private chordProgressionData: ChordTiming[] | null = null;
  private onTimingUpdate: ((timing: TimingInfo) => void) | null = null;
  private animationFrameId: number | null = null;

  /**
   * BGMを再生開始
   */
  play(
    url: string,
    bpm: number,
    timeSig: number,
    measureCount: number,
    countIn: number,
    volume = 0.7,
    chordProgressionData?: ChordTiming[],
    onTimingUpdate?: (timing: TimingInfo) => void
  ) {
    if (!url) return;
    
    // 既存のオーディオをクリーンアップ
    this.stop();
    
    this.bpm = bpm;
    this.timeSignature = timeSig;
    this.measureCount = measureCount;
    this.countInMeasures = countIn;
    this.chordProgressionData = chordProgressionData || null;
    this.onTimingUpdate = onTimingUpdate || null;
    
    this.audio = new Audio(url);
    this.audio.volume = volume;
    
    /* 計算: 1 拍=60/BPM 秒・1 小節=timeSig 拍 */
    const secPerBeat = 60 / bpm;
    const secPerMeas = secPerBeat * timeSig;
    this.loopBegin = countIn * secPerMeas;
    this.loopEnd = (countIn + measureCount) * secPerMeas;

    // 初回再生は最初から（カウントインを含む）
    this.audio.currentTime = 0;
    this.startTime = performance.now();
    
    // timeupdate イベントハンドラ
    this.timeUpdateHandler = () => {
      if (!this.audio) return;
      if (this.audio.currentTime >= this.loopEnd) {
        // ループ時はカウントイン後から再生
        this.audio.currentTime = this.loopBegin;
        // ループ時の開始時間を調整
        this.startTime = performance.now() - (this.loopBegin * 1000);
      }
    };
    
    this.audio.addEventListener('timeupdate', this.timeUpdateHandler);
    
    // 高精度タイミング更新を開始
    if (this.onTimingUpdate) {
      this.startTimingLoop();
    }
    
    this.audio.play().catch((error) => {
      console.warn('BGM playback failed:', error);
    });
  }

  /**
   * 高精度タイミングループ
   */
  private startTimingLoop() {
    const update = () => {
      const timing = this.getCurrentTiming();
      if (timing && this.onTimingUpdate) {
        this.onTimingUpdate(timing);
      }
      this.animationFrameId = requestAnimationFrame(update);
    };
    update();
  }

  /**
   * 現在のタイミング情報を取得
   */
  getCurrentTiming(): TimingInfo | null {
    if (!this.audio || this.audio.paused) return null;
    
    const elapsed = (performance.now() - this.startTime) / 1000; // 秒単位
    const secPerBeat = 60 / this.bpm;
    const totalBeats = elapsed / secPerBeat;
    
    // カウントイン中かどうかを判定
    const countInBeats = this.countInMeasures * this.timeSignature;
    const isCountIn = totalBeats < countInBeats;
    
    // 実際の演奏部分のビート（カウントイン後）
    const playBeats = Math.max(0, totalBeats - countInBeats);
    const loopBeats = playBeats % (this.measureCount * this.timeSignature);
    
    // 現在の小節とビート
    const currentMeasure = Math.floor(loopBeats / this.timeSignature) + 1;
    const beatInMeasure = (loopBeats % this.timeSignature) + 1;
    
    // 次のコードタイミングを計算
    let nextChordBeat: number | null = null;
    let judgmentDeadlineBeat: number | null = null;
    
    if (this.chordProgressionData && this.chordProgressionData.length > 0) {
      // chord_progression_dataから次のコードタイミングを探す
      for (const timing of this.chordProgressionData) {
        const chordBeat = (timing.bar - 1) * this.timeSignature + timing.beat;
        if (chordBeat > loopBeats) {
          nextChordBeat = chordBeat;
          // 判定締切は0.01ビート前（4.50 → 4.49）
          judgmentDeadlineBeat = chordBeat - 0.01;
          break;
        }
      }
      
      // ループの最初のコードも考慮
      if (nextChordBeat === null && this.chordProgressionData.length > 0) {
        const firstTiming = this.chordProgressionData[0];
        nextChordBeat = (firstTiming.bar - 1) * this.timeSignature + firstTiming.beat + 
                       (this.measureCount * this.timeSignature);
        judgmentDeadlineBeat = nextChordBeat - 0.01;
      }
    } else {
      // デフォルト: 各小節の4.5拍目に出題
      const currentMeasureBeats = (currentMeasure - 1) * this.timeSignature;
      const nextQuestionBeat = currentMeasureBeats + this.timeSignature - 0.5; // 4.5
      
      if (loopBeats < nextQuestionBeat) {
        nextChordBeat = nextQuestionBeat;
      } else {
        // 次の小節の4.5拍目
        nextChordBeat = currentMeasureBeats + this.timeSignature * 2 - 0.5;
      }
      judgmentDeadlineBeat = nextChordBeat - 0.01; // 4.49
    }
    
    return {
      currentBeat: totalBeats,
      currentMeasure: isCountIn ? -currentMeasure : currentMeasure,
      beatInMeasure,
      isCountIn,
      nextChordBeat: isCountIn ? null : nextChordBeat,
      judgmentDeadlineBeat: isCountIn ? null : judgmentDeadlineBeat
    };
  }

  /**
   * 累計ビートから次のコード情報を取得
   */
  getChordAtBeat(totalBeat: number): string | null {
    if (!this.chordProgressionData || this.chordProgressionData.length === 0) {
      return null;
    }
    
    const playBeats = totalBeat % (this.measureCount * this.timeSignature);
    
    // 現在のビートに対応するコードを探す
    for (let i = 0; i < this.chordProgressionData.length; i++) {
      const timing = this.chordProgressionData[i];
      const chordBeat = (timing.bar - 1) * this.timeSignature + timing.beat;
      
      // 次のコードのタイミングを取得
      let nextChordBeat: number;
      if (i < this.chordProgressionData.length - 1) {
        const nextTiming = this.chordProgressionData[i + 1];
        nextChordBeat = (nextTiming.bar - 1) * this.timeSignature + nextTiming.beat;
      } else {
        // 最後のコードの場合、ループ終端まで
        nextChordBeat = this.measureCount * this.timeSignature;
      }
      
      // 判定受付終了タイミングを考慮
      const judgmentEnd = nextChordBeat - 0.51; // 次のコードの0.5ビート前
      
      if (playBeats >= chordBeat && playBeats < judgmentEnd) {
        return timing.chord;
      }
    }
    
    return null; // NULL期間
  }

  setVolume(v: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, v));
    }
  }

  stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    if (this.audio) {
      if (this.timeUpdateHandler) {
        this.audio.removeEventListener('timeupdate', this.timeUpdateHandler);
        this.timeUpdateHandler = null;
      }
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
    
    this.onTimingUpdate = null;
    this.chordProgressionData = null;
  }
}

export const bgmManagerExtended = new BGMManagerExtended();