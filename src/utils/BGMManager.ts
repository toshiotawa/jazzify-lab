/* HTMLAudio ベースの簡易 BGM ルーパー */

class BGMManager {
  private audio: HTMLAudioElement | null = null
  private loopBegin = 0
  private loopEnd = 0
  private timeUpdateHandler: (() => void) | null = null

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
    
    /* 計算: 1 拍=60/BPM 秒・1 小節=timeSig 拍 */
    const secPerBeat = 60 / bpm
    const secPerMeas = secPerBeat * timeSig
    this.loopBegin = countIn * secPerMeas
    this.loopEnd = (countIn + measureCount) * secPerMeas

    this.audio.currentTime = this.loopBegin
    
    // timeupdate イベントハンドラを保存
    this.timeUpdateHandler = () => {
      if (!this.audio) return
      if (this.audio.currentTime >= this.loopEnd) {
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
  }
}

export const bgmManager = new BGMManager()