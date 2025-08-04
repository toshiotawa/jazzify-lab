export default class BGMManager {
  private static instance: BGMManager | null = null
  private audioContext: AudioContext | null = null
  private source: AudioBufferSourceNode | null = null
  private gainNode: GainNode | null = null
  private buffer: AudioBuffer | null = null
  private startTime = 0
  private pauseTime = 0
  private bpm = 120
  private timeSignature = 4
  private measureCount = 8
  private loopBegin = 0
  private loopEnd = 0
  private isPlaying = false

  private constructor() {}

  static getInstance(): BGMManager {
    if (!BGMManager.instance) {
      BGMManager.instance = new BGMManager()
    }
    return BGMManager.instance
  }

  async play(
    url: string,
    bpm: number,
    timeSignature: number,
    measureCount: number,
    volume: number = 0.5
  ): Promise<void> {
    if (this.isPlaying) {
      this.stop()
    }

    this.bpm = bpm
    this.timeSignature = timeSignature
    this.measureCount = measureCount

    // ループ設定を計算
    const secPerMeas = (60 / bpm) * timeSignature
    this.loopBegin = 0
    this.loopEnd = measureCount * secPerMeas

    // 初回再生は最初から
    this.startTime = 0
    this.pauseTime = 0

    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext()
      }

      // URLが既存のbufferと同じで、かつbufferが存在する場合は再利用
      if (!this.buffer || this.buffer.length === 0) {
        const response = await fetch(url)
        const arrayBuffer = await response.arrayBuffer()
        this.buffer = await this.audioContext.decodeAudioData(arrayBuffer)
      }

      this.source = this.audioContext.createBufferSource()
      this.source.buffer = this.buffer

      this.gainNode = this.audioContext.createGain()
      this.gainNode.gain.value = volume

      this.source.connect(this.gainNode)
      this.gainNode.connect(this.audioContext.destination)

      // ループ設定
      this.source.loop = true
      this.source.loopStart = this.loopBegin
      this.source.loopEnd = this.loopEnd

      // 再生開始
      const contextTime = this.audioContext.currentTime
      this.source.start(contextTime, this.pauseTime)
      this.startTime = contextTime - this.pauseTime
      this.isPlaying = true
    } catch (error) {
      console.error('BGM再生エラー:', error)
      throw error
    }
  }

  pause(): void {
    if (!this.isPlaying || !this.source || !this.audioContext) return

    this.pauseTime = this.audioContext.currentTime - this.startTime
    this.source.stop()
    this.source.disconnect()
    this.source = null
    this.isPlaying = false
  }

  resume(): void {
    if (this.isPlaying || !this.buffer || !this.audioContext || !this.gainNode) return

    this.source = this.audioContext.createBufferSource()
    this.source.buffer = this.buffer
    this.source.connect(this.gainNode)

    // ループ設定
    this.source.loop = true
    this.source.loopStart = this.loopBegin
    this.source.loopEnd = this.loopEnd

    const contextTime = this.audioContext.currentTime
    this.source.start(contextTime, this.pauseTime)
    this.startTime = contextTime - this.pauseTime
    this.isPlaying = true
  }

  stop(): void {
    if (this.source) {
      try {
        this.source.stop()
        this.source.disconnect()
      } catch (e) {
        // 既に停止している場合は無視
      }
      this.source = null
    }

    if (this.gainNode) {
      this.gainNode.disconnect()
      this.gainNode = null
    }

    this.startTime = 0
    this.pauseTime = 0
    this.isPlaying = false
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume))
    }
  }

  /**
   * 現在の音源時間を取得（秒）
   */
  getCurrentTime(): number {
    if (!this.isPlaying || !this.audioContext) return 0
    return this.audioContext.currentTime - this.startTime
  }

  /**
   * 音楽時間を取得（曲の頭を0秒とする）
   */
  getMusicTime(): number {
    if (!this.isPlaying || !this.audioContext) return 0
    const audioTime = this.audioContext.currentTime - this.startTime
    return audioTime
  }

  /**
   * ループを考慮した現在の小節数を取得
   */
  getCurrentMeasure(): number {
    const musicTime = this.getMusicTime()
    if (musicTime < 0) return 0
    
    const secPerMeasure = (60 / this.bpm) * this.timeSignature
    const totalMeasures = Math.floor(musicTime / secPerMeasure)
    return (totalMeasures % this.measureCount) + 1
  }

  /**
   * ループを考慮した現在の拍を取得
   */
  getCurrentBeat(): number {
    const musicTime = this.getMusicTime()
    if (musicTime < 0) return 0
    
    const secPerBeat = 60 / this.bpm
    const totalBeats = Math.floor(musicTime / secPerBeat)
    return (totalBeats % this.timeSignature) + 1
  }

  /**
   * 指定された小節・拍の時間を取得
   * @param measure 小節番号 (1〜)
   * @param beat 拍番号 (1〜)
   * @returns 秒数
   */
  getMeasureBeatTime(measure: number, beat: number): number {
    const secPerBeat = 60 / this.bpm
    const secPerMeasure = secPerBeat * this.timeSignature
    
    // 指定小節までの時間 + 拍の時間
    return (measure - 1) * secPerMeasure + (beat - 1) * secPerBeat
  }

  /**
   * 再生中かどうか
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
   * 小節数を取得
   */
  getMeasureCount(): number {
    return this.measureCount
  }

  /**
   * 現在の進行状況を取得（0.0 〜 1.0）
   */
  getProgress(): number {
    const musicTime = this.getMusicTime()
    if (musicTime < 0 || this.loopEnd === 0) return 0
    
    const loopTime = musicTime % this.loopEnd
    return loopTime / this.loopEnd
  }

  dispose(): void {
    this.stop()
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.buffer = null
  }
}