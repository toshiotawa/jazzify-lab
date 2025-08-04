/* HTMLAudio ベースの簡易 BGM ルーパー */

class BGMManager {
  private audio: HTMLAudioElement | null = null
  private audioContext: AudioContext | null = null
  private source: MediaElementAudioSourceNode | null = null
  private loopBegin = 0
  private loopEnd = 0
  private timeUpdateHandler: (() => void) | null = null
  private startTime = 0  // BGM開始時刻（performance.now()）
  private audioStartTime = 0  // AudioContext開始時刻
  private bpm = 120
  private timeSignature = 4
  private measureCount = 8
  private countInMeasures = 0
  private isPlaying = false

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
    
    // AudioContextを初期化（より正確なタイミングのため）
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    
    this.audio = new Audio(url)
    this.audio.volume = volume
    
    // MediaElementSourceNodeを作成してAudioContextに接続
    if (this.audioContext && !this.source) {
      this.source = this.audioContext.createMediaElementSource(this.audio)
      this.source.connect(this.audioContext.destination)
    }
    
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
    
    // 再生開始時刻を記録
    this.startTime = performance.now()
    this.audioStartTime = this.audioContext ? this.audioContext.currentTime : 0
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
    if (this.audio) {
      if (this.timeUpdateHandler) {
        this.audio.removeEventListener('timeupdate', this.timeUpdateHandler)
        this.timeUpdateHandler = null
      }
      this.audio.pause()
      this.audio.src = ''
      this.audio = null
    }
    if (this.source) {
      this.source.disconnect()
      this.source = null
    }
    // AudioContextは再利用のため破棄しない
  }
  
  // タイミング管理用の新しいメソッド
  
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
    
    // ループを考慮した小節番号に変換
    const measureInLoop = (measure - 1) % this.measureCount
    
    // カウントイン + 指定小節までの時間 + 拍の時間
    return countInDuration + measureInLoop * secPerMeasure + (beat - 1) * secPerBeat
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
   * 高精度な現在の音楽的時間を取得（秒単位）
   * AudioContextを使用して正確なタイミングを計算
   */
  getPreciseMusicTime(): number {
    if (!this.isPlaying || !this.audio) return 0
    
    // AudioContextが利用可能な場合は高精度タイミングを使用
    if (this.audioContext && this.audioStartTime > 0) {
      const elapsed = this.audioContext.currentTime - this.audioStartTime
      const countInDuration = this.countInMeasures * (60 / this.bpm) * this.timeSignature
      
      // ループを考慮
      const loopDuration = this.loopEnd - this.loopBegin
      if (elapsed > this.loopEnd) {
        const loopedTime = this.loopBegin + ((elapsed - this.loopEnd) % loopDuration)
        return loopedTime - countInDuration
      }
      
      return elapsed - countInDuration
    }
    
    // フォールバック: HTMLAudioElementの時間を使用
    return this.getCurrentMusicTime()
  }
}

export const bgmManager = new BGMManager()