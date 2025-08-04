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
  private loopCount = 0  // ループ回数を追跡
  private onLoopCallback: (() => void) | null = null  // ループ時のコールバック
  private lastLoopTime = 0  // 最後のループ処理時刻

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
    this.loopCount = 0
    
    this.audio = new Audio(url)
    this.audio.volume = volume
    
    /* 計算: 1 拍=60/BPM 秒・1 小節=timeSig 拍 */
    const secPerBeat = 60 / bpm
    const secPerMeas = secPerBeat * timeSig
    this.loopBegin = countIn * secPerMeas
    this.loopEnd = (countIn + measureCount) * secPerMeas

    // 初回再生は最初から（カウントインを含む）
    this.audio.currentTime = 0
    
    // timeupdate イベントハンドラを保存（より高精度な処理）
    this.timeUpdateHandler = () => {
      if (!this.audio) return
      
      // ループエンドに近づいたら、より頻繁にチェック
      const timeToEnd = this.loopEnd - this.audio.currentTime
      
      if (timeToEnd <= 0.05 && timeToEnd > 0) {
        // ループエンドまで50ms以内なら高頻度でチェック
        requestAnimationFrame(() => {
          if (!this.audio) return
          if (this.audio.currentTime >= this.loopEnd) {
            this.handleLoop()
          }
        })
      } else if (this.audio.currentTime >= this.loopEnd) {
        this.handleLoop()
      }
    }
    
    this.audio.addEventListener('timeupdate', this.timeUpdateHandler)
    
    // 再生開始時刻を記録
    this.startTime = performance.now()
    this.isPlaying = true
    
    this.audio.play().catch((error) => {
      console.warn('BGM playback failed:', error)
      this.isPlaying = false
    })
  }
  
  /**
   * ループ処理を実行
   */
  private handleLoop() {
    if (!this.audio) return
    
    // 二重ループ防止のため、最後のループ処理から一定時間経過していることを確認
    const now = performance.now()
    if (now - this.lastLoopTime < 100) return
    
    this.lastLoopTime = now
    this.loopCount++
    
    // ループ時はカウントイン後から再生
    this.audio.currentTime = this.loopBegin
    
    // ループコールバックを実行
    if (this.onLoopCallback) {
      this.onLoopCallback()
    }
  }
  
  /**
   * ループ時のコールバックを設定
   */
  setOnLoopCallback(callback: (() => void) | null) {
    this.onLoopCallback = callback
  }

  setVolume(v: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, v))
    }
  }

  stop() {
    this.isPlaying = false
    if (this.audio) {
      if (this.timeUpdateHandler) {
        this.audio.removeEventListener('timeupdate', this.timeUpdateHandler)
        this.timeUpdateHandler = null
      }
      this.audio.pause()
      this.audio.src = ''
      this.audio = null
    }
    this.onLoopCallback = null
    this.loopCount = 0
  }
  
  // タイミング管理用の新しいメソッド
  
  /**
   * 現在の音楽的時間を取得（秒単位）
   * カウントイン終了時を0秒とする
   * ループを考慮した連続的な時間を返す
   */
  getCurrentMusicTime(): number {
    if (!this.isPlaying || !this.audio) return 0
    
    const audioTime = this.audio.currentTime
    const countInDuration = this.countInMeasures * (60 / this.bpm) * this.timeSignature
    const loopDuration = this.measureCount * (60 / this.bpm) * this.timeSignature
    
    // カウントイン中は負の値を返す
    if (audioTime < countInDuration) {
      return audioTime - countInDuration
    }
    
    // ループを考慮した連続的な時間
    return (audioTime - countInDuration) + (this.loopCount * loopDuration)
  }
  
  /**
   * 現在の小節番号を取得（1始まり）
   * カウントイン中は0を返す
   * ループを考慮した連続的な小節番号を返す
   */
  getCurrentMeasure(): number {
    const musicTime = this.getCurrentMusicTime()
    if (musicTime < 0) return 0 // カウントイン中
    
    const secPerMeasure = (60 / this.bpm) * this.timeSignature
    return Math.floor(musicTime / secPerMeasure) + 1
  }
  
  /**
   * 現在の表示用小節番号を取得（1始まり、ループを考慮）
   * カウントイン中は0を返す
   */
  getCurrentDisplayMeasure(): number {
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
   * @param ignoreLoop ループを無視するかどうか
   */
  getMusicTimeAt(measure: number, beat: number, ignoreLoop = false): number {
    const secPerBeat = 60 / this.bpm
    const secPerMeasure = secPerBeat * this.timeSignature
    const countInDuration = this.countInMeasures * secPerMeasure
    
    // カウントイン + 指定小節までの時間 + 拍の時間
    let time = countInDuration + (measure - 1) * secPerMeasure + (beat - 1) * secPerBeat
    
    // ループを考慮しない場合、実際のオーディオタイムに変換
    if (!ignoreLoop && time >= this.loopEnd) {
      const loopDuration = this.loopEnd - this.loopBegin
      const loops = Math.floor((time - this.loopBegin) / loopDuration)
      time = this.loopBegin + ((time - this.loopBegin) % loopDuration)
    }
    
    return time
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
   * ループ回数を取得
   */
  getLoopCount(): number {
    return this.loopCount
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
    return this.countInMeasures
  }
}

export const bgmManager = new BGMManager()