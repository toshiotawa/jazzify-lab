/* HTMLAudio ベースの簡易 BGM ルーパー */

class BGMManager {
  private audio: HTMLAudioElement | null = null
  private loopBegin = 0
  private loopEnd = 0
  private timeUpdateHandler: (() => void) | null = null
  private startTime = 0  // BGM開始時刻（performance.now()）
  private bpm = 120
  private timeSignature = 4
  private measureCount = 8
  private countInMeasures = 0
  private isPlaying = false
  private loopScheduled = false
  private nextLoopTime = 0
  private loopTimeoutId: number | null = null

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
    this.timeSignature = timeSig
    this.measureCount = measureCount
    this.countInMeasures = countIn
    
    this.audio = new Audio(url)
    this.audio.volume = volume
    
    /* 計算: 1 拍=60/BPM 秒・1 小節=timeSig 拍 */
    const secPerBeat = 60 / bpm
    const secPerMeas = secPerBeat * timeSig
    this.loopBegin = countIn * secPerMeas
    this.loopEnd = (countIn + measureCount) * secPerMeas

    // 初回再生は最初から（カウントインを含む）
    this.audio.currentTime = 0
    
    // timeupdate イベントハンドラを保存
    this.timeUpdateHandler = () => {
      if (!this.audio) return
      if (this.audio.currentTime >= this.loopEnd) {
        // ループ時はカウントイン後から再生
        this.audio.currentTime = this.loopBegin
      }
    }
    
    this.audio.addEventListener('timeupdate', this.timeUpdateHandler)
    
    // ループ終了時の処理
    this.audio.addEventListener('timeupdate', () => {
      if (!this.audio) return
      
      const currentTime = this.audio.currentTime
      const timeToEnd = this.loopEnd - currentTime
      
      // ループの事前スケジューリング（100ms前に準備）
      if (timeToEnd < 0.1 && timeToEnd > 0 && !this.loopScheduled) {
        this.loopScheduled = true
        this.nextLoopTime = this.loopBegin
        
        // Web Audio APIを使用した精密なタイミング制御
        this.loopTimeoutId = window.setTimeout(() => {
          if (this.audio && this.isPlaying) {
            this.audio.currentTime = this.nextLoopTime
            this.loopScheduled = false
            // devLog.debug(`🔄 BGM Loop (scheduled): → ${this.nextLoopTime.toFixed(2)}s`) // devLog is not defined
          }
          this.loopTimeoutId = null
        }, Math.max(0, timeToEnd * 1000 - 50)) // 50ms早めに実行
      }
    })
    
    this.startTime = performance.now()
    this.isPlaying = true
    
    this.audio.play().catch((error) => {
      console.warn('BGM playback failed:', error)
      this.isPlaying = false
    })
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
      this.audio.pause()
      this.audio.currentTime = 0
      
      if (this.timeUpdateHandler) {
        this.audio.removeEventListener('timeupdate', this.timeUpdateHandler)
        this.timeUpdateHandler = null
      }
      
      this.audio = null
    }
    console.log('🔇 BGM停止')
  }
  
  /**
   * 現在の音楽的時間を取得（秒単位）
   * カウントイン終了時を0秒とする
   */
  getCurrentMusicTime(): number {
    if (!this.isPlaying || !this.audio) return 0
    
    const audioTime = this.audio.currentTime
    const countInDuration = this.countInMeasures * (60 / this.bpm) * this.timeSignature
    
    // カウントイン中は負の値を返す
    return audioTime - countInDuration
  }
  
  /**
   * 現在の小節番号を取得（1始まり）
   * カウントイン中は0を返す
   */
  getCurrentMeasure(): number {
    const musicTime = this.getCurrentMusicTime()
    if (musicTime < 0) return 0 // カウントイン中
    
    const secPerMeasure = (60 / this.bpm) * this.timeSignature
    const measure = Math.floor(musicTime / secPerMeasure) % this.measureCount + 1
    return measure
  }
  
  /**
   * 現在の拍番号を取得（1始まり）
   */
  getCurrentBeat(): number {
    if (!this.isPlaying) return 1
    
    const audioTime = this.audio?.currentTime || 0
    const secPerBeat = 60 / this.bpm
    const totalBeats = Math.floor(audioTime / secPerBeat)
    const beatInMeasure = (totalBeats % this.timeSignature) + 1
    return beatInMeasure
  }
  
  /**
   * 現在の小節内での拍位置を取得（0.0〜timeSignature）
   * 例: 4/4拍子で2拍目の真ん中なら2.5
   */
  getCurrentBeatPosition(): number {
    if (!this.isPlaying || !this.audio) return 0
    
    const audioTime = this.audio.currentTime
    const secPerBeat = 60 / this.bpm
    const beatPosition = (audioTime / secPerBeat) % this.timeSignature
    return beatPosition
  }
  
  /**
   * 指定した小節・拍の時刻を取得（秒単位）
   * @param measure 小節番号（1始まり）
   * @param beat 拍番号（1始まり、小数可）
   */
  getMusicTimeAt(measure: number, beat: number): number {
    const secPerBeat = 60 / this.bpm
    const secPerMeasure = secPerBeat * this.timeSignature
    const countInDuration = this.countInMeasures * secPerMeasure
    
    // カウントイン + 指定小節までの時間 + 拍の時間
    return countInDuration + (measure - 1) * secPerMeasure + (beat - 1) * secPerBeat
  }
  
  /**
   * 次の拍タイミングまでの時間を取得（ミリ秒）
   */
  getTimeToNextBeat(): number {
    if (!this.isPlaying || !this.audio) return 0
    
    const audioTime = this.audio.currentTime
    const secPerBeat = 60 / this.bpm
    const nextBeatTime = Math.ceil(audioTime / secPerBeat) * secPerBeat
    return (nextBeatTime - audioTime) * 1000
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
    return this.timeSignature
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
}

export const bgmManager = new BGMManager()