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
  private loopTimeoutId: number | null = null // タイムアウトIDを保持

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
    // ループ区間は「カウントイン直後（=Measure 1 の開始）」〜「Measure Count 演奏後」
    this.loopBegin = this.countInMeasures * secPerMeas
    this.loopEnd = (this.countInMeasures + measureCount) * secPerMeas

    // 初回再生は0秒から（カウントインを含む）
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
   * カウントイン終了時（Measure 1 開始）を0秒とする。
   * カウントイン中は負の値を返す。
   */
  getCurrentMusicTime(): number {
    if (!this.isPlaying || !this.audio) return 0
    
    const t = this.audio.currentTime - this.loopBegin
    return t
  }
  
  /**
   * 現在の小節番号を取得（1始まり）
   * カウントイン中は0を返す（UI側で"/"表記）
   */
  getCurrentMeasure(): number {
    const musicTime = this.getCurrentMusicTime()
    
    const secPerMeasure = (60 / this.bpm) * this.timeSignature
    if (musicTime < 0) return 0

    const measure = Math.floor(musicTime / secPerMeasure) + 1
    
    // ループを考慮（Measure 1..measureCount）
    return ((measure - 1) % this.measureCount) + 1
  }
  
  /**
   * 現在の拍番号を取得（1始まり）
   */
  getCurrentBeat(): number {
    if (!this.isPlaying || !this.audio) return 1
    
    const audioTime = this.audio.currentTime
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
   * 指定した小節・拍の実時間（秒）を取得。
   * Measure 1 の開始を this.loopBegin として、そこからのオフセットを返す。
   * @param measure 小節番号（1始まり）
   * @param beat 拍番号（1始まり、小数可）
   */
  getMusicTimeAt(measure: number, beat: number): number {
    const secPerBeat = 60 / this.bpm
    const secPerMeasure = secPerBeat * this.timeSignature
    
    // 指定小節までの時間 + 拍の時間（M1基準）にループ開始位置を加算
    return this.loopBegin + (measure - 1) * secPerMeasure + (beat - 1) * secPerBeat
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
   * カウントイン中かどうか
   */
  getIsCountIn(): boolean {
    if (!this.audio) return false
    return this.audio.currentTime < this.loopBegin
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
   * 総小節数（カウントイン除く）を取得
   */
  getMeasureCount(): number {
    return this.measureCount
  }
  
  /**
   * カウントイン小節数を取得
   */
  getCountInMeasures(): number {
    return this.countInMeasures
  }
  
  /**
   * BGMをMeasure 1の開始位置（ループ先頭）にリセット
   * ゲームの小節ループと同期するために使用
   */
  resetToStart() {
    if (!this.audio || !this.isPlaying) return
    
    try {
      this.audio.currentTime = this.loopBegin
      console.log('🔄 BGMをMeasure 1の開始へリセット')
    } catch (error) {
      console.warn('BGMリセットエラー:', error)
    }
  }
}

export const bgmManager = new BGMManager()