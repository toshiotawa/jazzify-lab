/* HTMLAudio ベースの簡易 BGM ルーパー */

export class BGMManager {
  private audio: HTMLAudioElement | null = null
  private isPlaying = false
  private startTime = 0
  private pauseTime = 0
  private timeUpdateHandler: (() => void) | null = null
  private animationFrameId: number | null = null // 追加
  
  private bpm = 120
  private timeSignature = 4
  private countInMeasures = 0
  private measureCount = 8
  private loopBegin = 0
  private loopEnd = 0

  init(
    audioSrc: string,
    bpm: number,
    timeSignature: number,
    measureCount: number,
    countIn: number,
    volume = 0.5
  ): void {
    this.cleanup()
    
    this.audio = new Audio(audioSrc)
    this.audio.volume = volume
    this.audio.preload = 'auto'
    
    this.bpm = bpm
    this.timeSignature = timeSignature
    this.measureCount = measureCount
    this.countInMeasures = countIn
    
    const secPerMeas = (60 / bpm) * timeSignature
    this.loopBegin = countIn * secPerMeas
    this.loopEnd = (countIn + measureCount) * secPerMeas

    // 初回再生は最初から（カウントインを含む）
    this.audio.currentTime = 0
    
    // requestAnimationFrameによる精密なループ処理
    const checkLoop = () => {
      if (!this.audio || !this.isPlaying) return
      
      const currentTime = this.audio.currentTime
      const remaining = this.loopEnd - currentTime
      
      // ループポイントに近づいたら（50ms以内）
      if (remaining < 0.05 && remaining > 0) {
        // 次フレームでループ処理
        setTimeout(() => {
          if (this.audio && this.isPlaying) {
            this.audio.currentTime = this.loopBegin + (currentTime - this.loopEnd)
          }
        }, remaining * 1000)
      } else if (currentTime >= this.loopEnd) {
        // 既に超えている場合は即座にループ
        this.audio.currentTime = this.loopBegin + (currentTime - this.loopEnd)
      }
      
      this.animationFrameId = requestAnimationFrame(checkLoop)
    }
    
    // 再生開始時刻を記録
    this.startTime = performance.now()
    this.isPlaying = true
    
    // ループチェック開始
    this.animationFrameId = requestAnimationFrame(checkLoop)
    
    // オーディオを再生
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

  cleanup(): void {
    if (this.audio) {
      if (this.timeUpdateHandler) {
        this.audio.removeEventListener('timeupdate', this.timeUpdateHandler)
        this.timeUpdateHandler = null
      }
      this.audio.pause()
      this.audio.src = ''
      this.audio = null
    }
    
    // アニメーションフレームもクリーンアップ
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    
    this.isPlaying = false
    this.startTime = 0
    this.pauseTime = 0
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
}

export const bgmManager = new BGMManager()