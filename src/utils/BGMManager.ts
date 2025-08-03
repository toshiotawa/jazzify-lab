/* HTMLAudio ベースの簡易 BGM ルーパー */

class BGMManager {
  private audio: HTMLAudioElement | null = null
  private loopBegin = 0
  private loopEnd = 0
  private timeUpdateHandler: (() => void) | null = null
  
  // ===== ビートタイミング拡張 =====
  private beatCallbacks: ((beat: number) => void)[] = []
  private bpm = 120
  private timeSignature = 4
  private beatInterval = 0.5 // 60/120 = 0.5秒
  private startTime = 0
  private lastBeatFraction = 0
  private animationFrameId: number | null = null

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
    
    // ビート計算用のパラメータを保存
    this.bpm = bpm
    this.timeSignature = timeSig
    this.beatInterval = 60 / bpm // ビート間隔（秒）
    
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
    
    this.audio.play().then(() => {
      // 再生開始時刻を記録（高精度タイミング用）
      this.startTime = performance.now() / 1000 - this.audio!.currentTime
      this.lastBeatFraction = 0
      
      // ビートトラッキングを開始
      this.startBeatTracking()
    }).catch((error) => {
      console.warn('BGM playback failed:', error)
    })
  }

  setVolume(v: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, v))
    }
  }

  stop() {
    // ビートトラッキングを停止
    this.stopBeatTracking()
    
    if (this.audio) {
      if (this.timeUpdateHandler) {
        this.audio.removeEventListener('timeupdate', this.timeUpdateHandler)
        this.timeUpdateHandler = null
      }
      this.audio.pause()
      this.audio.src = ''
      this.audio = null
    }
  }
  
  // ===== ビートタイミング機能 =====
  
  /**
   * ビートコールバックを登録
   */
  addBeatCallback(callback: (beat: number) => void) {
    this.beatCallbacks.push(callback)
  }
  
  /**
   * ビートコールバックを削除
   */
  removeBeatCallback(callback: (beat: number) => void) {
    this.beatCallbacks = this.beatCallbacks.filter(cb => cb !== callback)
  }
  
  /**
   * 現在のビート位置を取得（小数点付き）
   * 例: 4.5 = 4拍目のウラ
   */
  getCurrentBeatFraction(): number {
    if (!this.audio) return 0
    
    const currentTime = this.audio.currentTime - this.loopBegin
    if (currentTime < 0) return 0 // カウントイン中
    
    const totalBeats = currentTime / this.beatInterval
    const measureBeats = totalBeats % this.timeSignature
    const currentMeasure = Math.floor(totalBeats / this.timeSignature) + 1
    
    // 小節内のビート位置（1.0〜timeSignature.999...）
    return measureBeats + 1
  }
  
  /**
   * 現在の小節番号を取得
   */
  getCurrentMeasure(): number {
    if (!this.audio) return 1
    
    const currentTime = this.audio.currentTime - this.loopBegin
    if (currentTime < 0) return 0 // カウントイン中
    
    const totalBeats = currentTime / this.beatInterval
    return Math.floor(totalBeats / this.timeSignature) + 1
  }
  
  /**
   * ビートトラッキングを開始（requestAnimationFrameベース）
   */
  private startBeatTracking() {
    const track = () => {
      if (!this.audio) return
      
      const beatFraction = this.getCurrentBeatFraction()
      
      // ビート境界を超えたかチェック（0.01の許容誤差）
      if (Math.floor(beatFraction) !== Math.floor(this.lastBeatFraction)) {
        // ビートコールバックを発火
        this.beatCallbacks.forEach(cb => cb(beatFraction))
      }
      
      this.lastBeatFraction = beatFraction
      this.animationFrameId = requestAnimationFrame(track)
    }
    
    track()
  }
  
  /**
   * ビートトラッキングを停止
   */
  private stopBeatTracking() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    this.beatCallbacks = []
  }
  
  /**
   * 特定のビートタイミングまでの時間を取得（ミリ秒）
   */
  getTimeUntilBeat(targetBeat: number, targetMeasure?: number): number {
    if (!this.audio) return 0
    
    const currentBeat = this.getCurrentBeatFraction()
    const currentMeasure = this.getCurrentMeasure()
    
    let beatsUntilTarget: number
    
    if (targetMeasure !== undefined) {
      // 特定の小節のビートまで
      const measuresUntil = targetMeasure - currentMeasure
      beatsUntilTarget = measuresUntil * this.timeSignature + (targetBeat - currentBeat)
    } else {
      // 次の該当ビートまで
      beatsUntilTarget = targetBeat - currentBeat
      if (beatsUntilTarget <= 0) {
        beatsUntilTarget += this.timeSignature // 次の小節
      }
    }
    
    return beatsUntilTarget * this.beatInterval * 1000 // ミリ秒に変換
  }
}

export const bgmManager = new BGMManager()