export class AudioManager {
  private audio: HTMLAudioElement | null = null
  private loopStartTime: number = 0 // seconds
  private loopEndTime: number = 0   // seconds
  private onTimeUpdate?: (time: number) => void
  private onLoop?: () => void

  constructor(onTimeUpdate?: (time: number) => void, onLoop?: () => void) {
    this.onTimeUpdate = onTimeUpdate
    this.onLoop = onLoop
  }

  /**
   * Load audio file
   */
  async load(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.audio = new Audio(url)
      this.audio.preload = 'auto'
      
      this.audio.addEventListener('loadedmetadata', () => {
        this.setupEventListeners()
        resolve()
      })
      
      this.audio.addEventListener('error', (e) => {
        console.error('Audio load error:', e)
        reject(e)
      })
    })
  }

  /**
   * Setup loop parameters
   */
  setupLoop(startMeasure: number, endMeasure: number, bpm: number, timeSignature: number): void {
    const measureDuration = (60 * timeSignature) / bpm // seconds per measure
    this.loopStartTime = (startMeasure - 1) * measureDuration
    this.loopEndTime = (endMeasure - 1) * measureDuration
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.audio) return

    this.audio.addEventListener('timeupdate', () => {
      if (!this.audio) return
      
      const currentTime = this.audio.currentTime * 1000 // Convert to milliseconds
      
      // Handle loop
      if (this.audio.currentTime >= this.loopEndTime) {
        this.audio.currentTime = this.loopStartTime
        this.onLoop?.()
      }
      
      // Update time
      this.onTimeUpdate?.(currentTime)
    })

    this.audio.addEventListener('ended', () => {
      // Handle end of audio (fallback)
      if (this.loopStartTime > 0) {
        this.audio!.currentTime = this.loopStartTime
        this.onLoop?.()
      }
    })

    this.audio.addEventListener('error', (e) => {
      console.error('Audio playback error:', e)
    })
  }

  /**
   * Play audio
   */
  async play(): Promise<void> {
    if (!this.audio) {
      throw new Error('Audio not loaded')
    }

    try {
      await this.audio.play()
    } catch (error) {
      console.error('Play failed:', error)
      throw error
    }
  }

  /**
   * Pause audio
   */
  pause(): void {
    if (this.audio) {
      this.audio.pause()
    }
  }

  /**
   * Stop audio and reset position
   */
  stop(): void {
    if (this.audio) {
      this.audio.pause()
      this.audio.currentTime = this.loopStartTime
    }
  }

  /**
   * Get current time in milliseconds
   */
  getCurrentTime(): number {
    return this.audio ? this.audio.currentTime * 1000 : 0
  }

  /**
   * Get duration in milliseconds
   */
  getDuration(): number {
    return this.audio ? this.audio.duration * 1000 : 0
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume))
    }
  }

  /**
   * Check if audio is loaded
   */
  isLoaded(): boolean {
    return this.audio !== null && this.audio.readyState >= 2 // HAVE_CURRENT_DATA
  }

  /**
   * Check if audio is playing
   */
  isPlaying(): boolean {
    return this.audio ? !this.audio.paused : false
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.audio) {
      this.audio.pause()
      this.audio.src = ''
      this.audio = null
    }
  }

  /**
   * Seek to specific time (in seconds)
   */
  seekTo(time: number): void {
    if (this.audio) {
      this.audio.currentTime = time
    }
  }

  /**
   * Get loop information
   */
  getLoopInfo(): { startTime: number; endTime: number } {
    return {
      startTime: this.loopStartTime,
      endTime: this.loopEndTime
    }
  }
}