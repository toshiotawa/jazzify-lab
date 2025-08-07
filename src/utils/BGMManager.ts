/* HTMLAudio ベースの簡易 BGM ルーパー */

class BGMManager {
  private audio: HTMLAudioElement | null = null
  private loopBegin = 0
  private loopEnd = 0
  private timeUpdateHandler: (() => void) | null = null
  private startTime = 0  // BGM開始時刻（performance.now）
  private bpm = 120
  private timeSignature = 4
  private measureCount = 8
  private countInMeasures = 0
  private isPlaying = false
  private loopScheduled = false
  private nextLoopTime = 0
  private loopTimeoutId: number | null = null // タイムアウトID
  private loopCheckIntervalId: number | null = null // ループ監視Interval

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
    this.countInMeasures = Math.max(0, Math.floor(countIn || 0))
    
    this.audio = new Audio(url)
    this.audio.preload = 'auto'
    this.audio.volume = Math.max(0, Math.min(1, volume))
    
    /* 計算: 1 拍=60/BPM 秒・1 小節=timeSig 拍 */
    const secPerBeat = 60 / bpm
    const secPerMeas = secPerBeat * timeSig
    this.loopBegin = this.countInMeasures * secPerMeas
    this.loopEnd = (this.countInMeasures + measureCount) * secPerMeas

    // 初回再生は0秒から（カウントインを含む）
    this.audio.currentTime = 0
    
    // エラーハンドリング
    this.audio.addEventListener('error', this.handleError)
    this.audio.addEventListener('ended', this.handleEnded)
    
    // timeupdate による事前スケジュール（補助）
    this.timeUpdateHandler = () => {
      if (!this.audio || !this.isPlaying) return
      const currentTime = this.audio.currentTime
      const timeToEnd = this.loopEnd - currentTime
      if (timeToEnd < 0.08 && timeToEnd > 0 && !this.loopScheduled) {
        this.loopScheduled = true
        this.nextLoopTime = this.loopBegin
        this.loopTimeoutId = window.setTimeout(() => {
          if (this.audio && this.isPlaying) {
            this.audio.currentTime = this.nextLoopTime
          }
          this.loopScheduled = false
          this.loopTimeoutId = null
        }, Math.max(0, timeToEnd * 1000 - 30))
      }
    }
    this.audio.addEventListener('timeupdate', this.timeUpdateHandler)

    // ループ監視Interval（最終防衛ライン）
    this.loopCheckIntervalId = window.setInterval(() => {
      if (!this.audio || !this.isPlaying) return
      const now = this.audio.currentTime
      // 少し早めに巻き戻す（デコーダの遅延考慮）
      const epsilon = 0.02
      if (now >= this.loopEnd - epsilon) {
        try {
          this.audio.currentTime = this.loopBegin
          // 再生が止まっていたら再開
          if (this.audio.paused) {
            void this.audio.play().catch(() => {})
          }
        } catch (e) {
          // noop
        }
      }
    }, 25)
    
    // 再生開始
    this.startTime = performance.now()
    this.isPlaying = true
    const playPromise = this.audio.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('🎵 BGM再生開始:', { url, bpm, loopBegin: this.loopBegin, loopEnd: this.loopEnd, countIn: this.countInMeasures })
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
    
    if (this.loopTimeoutId !== null) {
      clearTimeout(this.loopTimeoutId)
      this.loopTimeoutId = null
    }
    if (this.loopCheckIntervalId !== null) {
      clearInterval(this.loopCheckIntervalId)
      this.loopCheckIntervalId = null
    }
    
    if (this.audio) {
      if (this.timeUpdateHandler) {
        this.audio.removeEventListener('timeupdate', this.timeUpdateHandler)
        this.timeUpdateHandler = null
      }
      this.audio.removeEventListener('ended', this.handleEnded)
      this.audio.removeEventListener('error', this.handleError)
      try {
        this.audio.pause()
        this.audio.currentTime = 0
        this.audio.src = ''
        this.audio.load()
      } catch (e) {
        console.warn('Audio cleanup error:', e)
      }
      this.audio = null
    }
    
    console.log('🔇 BGM停止・クリーンアップ完了')
  }
  
  private handleError = (e: Event) => {
    console.error('BGM playback error:', e)
    this.isPlaying = false
  }
  
  private handleEnded = () => {
    if (this.loopEnd > 0) {
      this.audio!.currentTime = this.loopBegin
      this.audio!.play().catch(() => {})
    }
  }
  
  /**
   * 現在の音楽的時間（秒）。M1開始=0、カウントイン中は負。
   */
  getCurrentMusicTime(): number {
    if (!this.isPlaying || !this.audio) return 0
    return this.audio.currentTime - this.loopBegin
  }
  
  /** 小節番号（1始まり）。カウントイン中は0 */
  getCurrentMeasure(): number {
    const musicTime = this.getCurrentMusicTime()
    const secPerMeasure = (60 / this.bpm) * this.timeSignature
    if (musicTime < 0) return 0
    const measure = Math.floor(musicTime / secPerMeasure) + 1
    return ((measure - 1) % this.measureCount) + 1
  }
  
  /** 現在の拍（1始まり） */
  getCurrentBeat(): number {
    if (!this.isPlaying || !this.audio) return 1
    const audioTime = this.audio.currentTime
    const secPerBeat = 60 / this.bpm
    const totalBeats = Math.floor(audioTime / secPerBeat)
    return (totalBeats % this.timeSignature) + 1
  }
  
  /** 小節内の拍位置（0..timeSignature） */
  getCurrentBeatPosition(): number {
    if (!this.isPlaying || !this.audio) return 0
    const audioTime = this.audio.currentTime
    const secPerBeat = 60 / this.bpm
    return (audioTime / secPerBeat) % this.timeSignature
  }
  
  /** 指定小節・拍の実時間（秒）。M1開始を基準 */
  getMusicTimeAt(measure: number, beat: number): number {
    const secPerBeat = 60 / this.bpm
    const secPerMeasure = secPerBeat * this.timeSignature
    return this.loopBegin + (measure - 1) * secPerMeasure + (beat - 1) * secPerBeat
  }
  
  /** 次の拍までの残り時間（ms） */
  getTimeToNextBeat(): number {
    if (!this.isPlaying || !this.audio) return 0
    const audioTime = this.audio.currentTime
    const secPerBeat = 60 / this.bpm
    const nextBeatTime = Math.ceil(audioTime / secPerBeat) * secPerBeat
    return (nextBeatTime - audioTime) * 1000
  }
  
  /** 次のループまでの残り時間（ms） */
  getTimeToLoop(): number {
    if (!this.isPlaying || !this.audio) return Infinity
    const currentTime = this.audio.currentTime
    const timeToEnd = this.loopEnd - currentTime
    return timeToEnd > 0 ? timeToEnd * 1000 : 0
  }
  
  getIsPlaying(): boolean { return this.isPlaying }
  getBPM(): number { return this.bpm }
  getTimeSignature(): number { return this.timeSignature }
  getMeasureCount(): number { return this.measureCount }
  getCountInMeasures(): number { return this.countInMeasures }
  getIsCountIn(): boolean { return !!this.audio && this.audio.currentTime < this.loopBegin }

  /** Measure 1 の開始へリセット */
  resetToStart() {
    if (!this.audio || !this.isPlaying) return
    try {
      this.audio.currentTime = this.loopBegin
      if (this.audio.paused) {
        void this.audio.play().catch(() => {})
      }
      console.log('🔄 BGMをMeasure 1の開始へリセット')
    } catch (error) {
      console.warn('BGMリセットエラー:', error)
    }
  }
}

export const bgmManager = new BGMManager()