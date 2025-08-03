/* HTMLAudio ベースの簡易 BGM ルーパー */

export type BeatCallback = (bar: number, beat: number, absMs: number) => void;

class BGMManager {
  private audio: HTMLAudioElement | null = null
  private loopBegin = 0
  private loopEnd = 0
  private timeUpdateHandler: (() => void) | null = null
  private beatCallback: BeatCallback | null = null
  private prevBeat = -1
  private bpm = 120
  private timeSig = 4
  private countIn = 0
  private measureCount = 0

  setBeatCallback(callback: BeatCallback | null) {
    this.beatCallback = callback
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
    
    this.audio = new Audio(url)
    this.audio.volume = volume
    this.bpm = bpm
    this.timeSig = timeSig
    this.countIn = countIn
    this.measureCount = measureCount
    
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
      
      // ビートコールバック処理
      if (this.beatCallback) {
        const currentTime = this.audio.currentTime
        const msPerBeat = (60 / this.bpm) * 1000
        const currentBeatTotal = Math.floor((currentTime * 1000) / msPerBeat)
        
        if (currentBeatTotal !== this.prevBeat) {
          this.prevBeat = currentBeatTotal
          const bar = Math.floor(currentBeatTotal / this.timeSig) + 1
          const beat = (currentBeatTotal % this.timeSig) + 1
          const absMs = currentTime * 1000
          this.beatCallback(bar, beat, absMs)
        }
      }
      
      // ループ処理
      if (this.audio.currentTime >= this.loopEnd) {
        // ループ時はカウントイン後から再生
        this.audio.currentTime = this.loopBegin
      }
    }
    
    this.audio.addEventListener('timeupdate', this.timeUpdateHandler)
    
    this.audio.play().catch((error) => {
      console.warn('BGM playback failed:', error)
    })
  }

  setVolume(v: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, v))
    }
  }

  stop() {
    if (this.audio) {
      if (this.timeUpdateHandler) {
        this.audio.removeEventListener('timeupdate', this.timeUpdateHandler)
        this.timeUpdateHandler = null
      }
      this.audio.pause()
      this.audio.src = ''
      this.audio = null
    }
    this.beatCallback = null
    this.prevBeat = -1
  }
}

export const bgmManager = new BGMManager()