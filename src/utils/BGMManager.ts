/* HTMLAudio ベースの簡易 BGM ルーパー */

import { EventEmitter } from 'events';

export interface TimePos {
  bar: number;
  beat: number;
  tick: number;
}

export class BGMManager extends EventEmitter {
  private audio: HTMLAudioElement | null = null
  private loopBegin = 0
  private loopEnd = 0
  private timeUpdateHandler: (() => void) | null = null
  private startTime = 0  // BGM開始時刻（performance.now()）
  private bpm = 120
  private beatsPerBar = 4
  private measureCount = 8
  private countInBars = 0
  private isPlaying = false
  private loopScheduled = false
  private nextLoopTime = 0
  private loopTimeoutId: number | null = null // タイムアウトIDを保持
  private readonly ticksPerBeat = 480;

  constructor() {
    super();
  }

  private barDur(): number {
    return 60 / this.bpm * this.beatsPerBar;
  }

  private beatDur(): number {
    return 60 / this.bpm;
  }

  getTimePos(): TimePos {
    if (!this.audio) {
      return { bar: 0, beat: 0, tick: 0 };
    }
    
    const t = this.audio.currentTime - this.barDur() * this.countInBars;
    if (t < 0) {
      return { bar: 0, beat: 0, tick: 0 };
    }
    
    const bar = Math.floor(t / this.barDur()) + 1;
    const beatT = t % this.barDur();
    const beat = Math.floor(beatT / this.beatDur()) + 1;
    const tick = Math.round((beatT % this.beatDur()) / this.beatDur() * this.ticksPerBeat);
    
    return { bar, beat, tick };
  }

  get bar(): number {
    return this.getTimePos().bar;
  }

  get beat(): number {
    return this.getTimePos().beat;
  }

  update(dt: number): void {
    if (!this.audio || !this.isPlaying) return;
    
    // ループチェック（updateメソッドでも確認）
    if (this.audio.currentTime >= this.loopEnd) {
      this.audio.currentTime = this.loopBegin;
      this.emit('loop');
      console.log(`🔄 BGM Loop (update): → ${this.loopBegin.toFixed(2)}s`);
    }
  }

  play(
    url: string,
    bpm: number,
    timeSig: number,
    measureCount: number,
    countIn: number,
    volume = 0.7
  ) {
    if (!url) return
    
    // 既存のオーディオをクリーンアップ
    this.stop()
    
    // パラメータを保存
    this.bpm = bpm
    this.beatsPerBar = timeSig
    this.measureCount = measureCount
    this.countInBars = countIn
    
    this.audio = new Audio(url)
    this.audio.preload = 'auto'
    this.audio.volume = Math.max(0, Math.min(1, volume))
    
    /* 計算: 1 拍=60/BPM 秒・1 小節=timeSig 拍 */
    const secPerBeat = 60 / bpm
    const secPerMeas = secPerBeat * timeSig
    this.loopBegin = countIn * secPerMeas
    this.loopEnd = (countIn + measureCount) * secPerMeas

    // 初回再生は最初から（カウントインを含む）
    this.audio.currentTime = 0
    
    // エラーハンドリング
    this.audio.addEventListener('error', this.handleError)
    this.audio.addEventListener('ended', this.handleEnded)
    
    // timeupdate イベントハンドラを保存（より精密なループ処理）
    this.timeUpdateHandler = () => {
      if (!this.audio || !this.isPlaying) return
      
      const currentTime = this.audio.currentTime
      const timeToEnd = this.loopEnd - currentTime
      
      // ループの事前スケジューリング（100ms前に準備）
      if (timeToEnd < 0.1 && timeToEnd > 0 && !this.loopScheduled) {
        this.loopScheduled = true
        this.nextLoopTime = this.loopBegin
        
        // タイムアウトIDを保持
        this.loopTimeoutId = window.setTimeout(() => {
          if (this.audio && this.isPlaying) {
            this.audio.currentTime = this.nextLoopTime
            console.log(`🔄 BGM Loop (scheduled): → ${this.nextLoopTime.toFixed(2)}s`)
            this.emit('loop'); // ループイベントを発行
          }
          this.loopScheduled = false
          this.loopTimeoutId = null
        }, Math.max(0, timeToEnd * 1000 - 50)) // 50ms早めに実行
      }
    }
    
    this.audio.addEventListener('timeupdate', this.timeUpdateHandler)
    
    // 再生開始時刻を記録
    this.startTime = performance.now()
    this.isPlaying = true
    
    // 再生開始
    const playPromise = this.audio.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('🎵 BGM再生開始:', { url, bpm, loopBegin: this.loopBegin, loopEnd: this.loopEnd })
        })
        .catch((error) => {
          console.warn('BGM playback failed:', error)
          this.isPlaying = false
        })
    }
  }

  setVolume(v: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, v))
    }
  }

  stop() {
    this.isPlaying = false
    this.loopScheduled = false
    
    // タイムアウトのクリア
    if (this.loopTimeoutId !== null) {
      clearTimeout(this.loopTimeoutId)
      this.loopTimeoutId = null
    }
    
    if (this.audio) {
      // イベントリスナーの削除
      if (this.timeUpdateHandler) {
        this.audio.removeEventListener('timeupdate', this.timeUpdateHandler)
        this.timeUpdateHandler = null
      }
      
      // その他のイベントリスナーも削除
      this.audio.removeEventListener('ended', this.handleEnded)
      this.audio.removeEventListener('error', this.handleError)
      
      // オーディオの停止と解放
      try {
        this.audio.pause()
        this.audio.currentTime = 0
        this.audio.src = '' // srcをクリアしてメモリを解放
        this.audio.load() // 明示的にリソースを解放
      } catch (e) {
        console.warn('Audio cleanup error:', e)
      }
      
      this.audio = null
    }
    
    console.log('🔇 BGM停止・クリーンアップ完了')
  }
  
  // エラーハンドリング
  private handleError = (e: Event) => {
    console.error('BGM playback error:', e)
    this.isPlaying = false
  }
  
  // 終了ハンドリング
  private handleEnded = () => {
    if (this.loopEnd > 0) {
      this.audio!.currentTime = this.loopBegin
      this.audio!.play().catch(console.error)
    }
  }
  
  // タイミング管理用の新しいメソッド
  
  /**
   * 現在の音楽的時間を取得（秒単位）
   * カウントイン終了時を0秒とする
   */
  getCurrentMusicTime(): number {
    if (!this.isPlaying || !this.audio) return 0
    
    const audioTime = this.audio.currentTime
    const countInDuration = this.countInBars * this.barDur()
    
    // カウントイン後の時間を返す（カウントイン中は負の値）
    return audioTime - countInDuration
  }
  
  /**
   * 現在の小節番号を取得（1始まり）
   * カウントイン中は0を返す
   */
  getCurrentMeasure(): number {
    const musicTime = this.getCurrentMusicTime()
    if (musicTime < 0) return 0 // カウントイン中
    
    const secPerMeasure = this.barDur()
    const measure = Math.floor(musicTime / secPerMeasure) + 1
    
    // ループを考慮
    return ((measure - 1) % this.measureCount) + 1
  }
  
  /**
   * 現在の拍番号を取得（1始まり）
   */
  getCurrentBeat(): number {
    if (!this.isPlaying) return 1
    
    const audioTime = this.audio?.currentTime || 0
    const secPerBeat = this.beatDur()
    const totalBeats = Math.floor(audioTime / secPerBeat)
    const beatInMeasure = (totalBeats % this.beatsPerBar) + 1
    return beatInMeasure
  }
  
  /**
   * 現在の小節内での拍位置を取得（0.0〜timeSignature）
   * 例: 4/4拍子で2拍目の真ん中なら2.5
   */
  getCurrentBeatPosition(): number {
    if (!this.isPlaying || !this.audio) return 0
    
    const audioTime = this.audio.currentTime
    const secPerBeat = this.beatDur()
    const beatPosition = (audioTime / secPerBeat) % this.beatsPerBar
    return beatPosition
  }
  
  /**
   * 指定した小節・拍の時刻を取得（秒単位）
   * @param measure 小節番号（1始まり）
   * @param beat 拍番号（1始まり、小数可）
   */
  getMusicTimeAt(measure: number, beat: number): number {
    const secPerBeat = this.beatDur()
    const secPerMeasure = this.barDur()
    const countInDuration = this.countInBars * secPerMeasure
    
    // カウントイン + 指定小節までの時間 + 拍の時間
    return countInDuration + (measure - 1) * secPerMeasure + (beat - 1) * secPerBeat
  }
  
  /**
   * 次の拍タイミングまでの時間を取得（ミリ秒）
   */
  getTimeToNextBeat(): number {
    if (!this.isPlaying || !this.audio) return 0
    
    const audioTime = this.audio.currentTime
    const secPerBeat = this.beatDur()
    const nextBeatTime = Math.ceil(audioTime / secPerBeat) * secPerBeat
    return (nextBeatTime - audioTime) * 1000
  }
  
  /**
   * 次のループまでの時間を取得（ミリ秒）
   */
  getTimeToLoop(): number {
    if (!this.isPlaying || !this.audio) return Infinity
    
    const currentTime = this.audio.currentTime
    const timeToEnd = this.loopEnd - currentTime
    
    return timeToEnd > 0 ? timeToEnd * 1000 : 0
  }
  
  /**
   * 音楽再生中かどうか
   */
  getIsPlaying(): boolean {
    return this.isPlaying
  }
  
  /**
   * BPMを取得
   */
  getBPM(): number {
    return this.bpm
  }
  
  /**
   * 拍子を取得
   */
  getTimeSignature(): number {
    return this.beatsPerBar
  }
  
  /**
   * 総小節数を取得
   */
  getMeasureCount(): number {
    return this.measureCount
  }
  
  /**
   * カウントイン小節数を取得
   */
  getCountInMeasures(): number {
    return this.countInBars
  }
}

export const bgmManager = new BGMManager();
export default bgmManager;