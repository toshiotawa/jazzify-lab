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
  private playbackRate = 1.0 // 再生速度（1.0 = 100%, 0.75 = 75%, 0.5 = 50%）
  private pitchSemitones = 0 // ピッチシフト量（半音単位、正=上、負=下）

  // Web Audio
  private waContext: AudioContext | null = null
  private waGain: GainNode | null = null
  private waBuffer: AudioBuffer | null = null
  private waSource: AudioBufferSourceNode | null = null
  private waStartAt: number = 0

  play(
    url: string,
    bpm: number,
    timeSig: number,
    measureCount: number,
    countIn: number,
    volume = 0.7,
    playbackRate = 1.0,
    pitchSemitones = 0
  ) {
    if (!url) return
    
    // 既存のオーディオをクリーンアップ
    this.stop()
    
    // パラメータを保存
    this.bpm = bpm
    this.timeSignature = timeSig
    this.measureCount = measureCount
    this.countInMeasures = Math.max(0, Math.floor(countIn || 0))
    this.playbackRate = Math.max(0.25, Math.min(2.0, playbackRate)) // 再生速度を0.25〜2.0に制限
    this.pitchSemitones = pitchSemitones // ピッチシフト量を保存
    
    /* 計算: 1 拍=60/BPM 秒・1 小節=timeSig 拍 */
    const secPerBeat = 60 / bpm
    const secPerMeas = secPerBeat * timeSig
    this.loopBegin = this.countInMeasures * secPerMeas
    this.loopEnd = (this.countInMeasures + measureCount) * secPerMeas

    // Web Audio 経路でシームレスループを試みる
    this._playWebAudio(url, volume).catch(err => {
      console.warn('WebAudio BGM failed, fallback to HTMLAudio:', err)
      this._playHtmlAudio(url, volume)
    })
  }

  setVolume(v: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, v))
    }
    if (this.waGain && this.waContext) {
      this.waGain.gain.setValueAtTime(Math.max(0, Math.min(1, v)), this.waContext.currentTime)
    }
  }

  stop() {
    this.isPlaying = false
    this.loopScheduled = false

    try {
      if (this.loopTimeoutId !== null) {
        clearTimeout(this.loopTimeoutId)
        this.loopTimeoutId = null
      }
      if (this.loopCheckIntervalId !== null) {
        clearInterval(this.loopCheckIntervalId)
        this.loopCheckIntervalId = null
      }

      if (this.audio) {
        try {
          if (this.timeUpdateHandler) {
            this.audio.removeEventListener('timeupdate', this.timeUpdateHandler)
          }
          this.audio.removeEventListener?.('ended', this.handleEnded)
          this.audio.removeEventListener?.('error', this.handleError)
        } catch {}
        try { this.audio.pause?.() } catch {}
        try { this.audio.currentTime = 0 } catch {}
        try { (this.audio as any).src = '' } catch {}
        try { (this.audio as any).load?.() } catch {}
      }

      // Web Audio cleanup
      try { this.waSource?.stop?.() } catch {}
      try { this.waSource?.disconnect?.() } catch {}
      this.waSource = null
      this.waBuffer = null
      try { this.waGain?.disconnect?.() } catch {}
      this.waGain = null
    } catch (e) {
      console.warn('BGMManager.stop safe stop failed:', e)
    } finally {
      this.timeUpdateHandler = null
      this.audio = null
      console.log('🔇 BGM停止・クリーンアップ完了')
    }
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
   * 再生速度に関わらず、音楽的な位置（小節・拍）が正しく返される
   */
  getCurrentMusicTime(): number {
    if (this.isPlaying) {
      if (this.waContext && this.waBuffer) {
        // Web Audio 再生時間を計算
        // playbackRateを考慮した音楽的な時間を計算
        const elapsedRealTime = this.waContext.currentTime - this.waStartAt
        const musicTime = elapsedRealTime * this.playbackRate
        return musicTime - this.loopBegin
      }
      // HTMLAudioの場合、currentTimeは既に再生速度を考慮した音楽的な時間
      if (this.audio) return this.audio.currentTime - this.loopBegin
    }
    return 0
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
    const secPerBeat = 60 / this.bpm
    if (this.isPlaying) {
      if (this.waContext && this.waBuffer) {
        const elapsedRealTime = this.waContext.currentTime - this.waStartAt
        const musicTime = elapsedRealTime * this.playbackRate
        const totalBeats = Math.floor(musicTime / secPerBeat)
        return (totalBeats % this.timeSignature) + 1
      }
      if (this.audio) {
        const totalBeats = Math.floor(this.audio.currentTime / secPerBeat)
        return (totalBeats % this.timeSignature) + 1
      }
    }
    return 1
  }
  
  /** 小節内の拍位置（0..timeSignature） */
  getCurrentBeatPosition(): number {
    const secPerBeat = 60 / this.bpm
    if (this.isPlaying) {
      if (this.waContext && this.waBuffer) {
        const elapsedRealTime = this.waContext.currentTime - this.waStartAt
        const musicTime = elapsedRealTime * this.playbackRate
        return (musicTime / secPerBeat) % this.timeSignature
      }
      if (this.audio) {
        return (this.audio.currentTime / secPerBeat) % this.timeSignature
      }
    }
    return 0
  }
  
  /** 指定小節・拍の実時間（秒）。M1開始を基準 */
  getMusicTimeAt(measure: number, beat: number): number {
    const secPerBeat = 60 / this.bpm
    const secPerMeasure = secPerBeat * this.timeSignature
    return this.loopBegin + (measure - 1) * secPerMeasure + (beat - 1) * secPerBeat
  }
  
  /** 次の拍までの残り時間（ms）- 実時間での残り */
  getTimeToNextBeat(): number {
    const secPerBeat = 60 / this.bpm
    if (this.isPlaying) {
      let musicTime = 0
      if (this.waContext && this.waBuffer) {
        const elapsedRealTime = this.waContext.currentTime - this.waStartAt
        musicTime = elapsedRealTime * this.playbackRate
      } else if (this.audio) {
        musicTime = this.audio.currentTime
      }
      const nextBeatTime = Math.ceil(musicTime / secPerBeat) * secPerBeat
      const musicTimeDiff = nextBeatTime - musicTime
      // 音楽時間の差を実時間に変換
      return (musicTimeDiff / this.playbackRate) * 1000
    }
    return 0
  }
  
  /** 次のループまでの残り時間（ms）- 実時間での残り */
  getTimeToLoop(): number {
    if (!this.isPlaying) return Infinity
    let musicTime = 0
    if (this.waContext && this.waBuffer) {
      const elapsedRealTime = this.waContext.currentTime - this.waStartAt
      musicTime = elapsedRealTime * this.playbackRate
    } else if (this.audio) {
      musicTime = this.audio.currentTime
    }
    const musicTimeToEnd = this.loopEnd - musicTime
    // 音楽時間の差を実時間に変換
    return musicTimeToEnd > 0 ? (musicTimeToEnd / this.playbackRate) * 1000 : 0
  }
  
  getIsPlaying(): boolean { return this.isPlaying }
  getBPM(): number { return this.bpm }
  getTimeSignature(): number { return this.timeSignature }
  getMeasureCount(): number { return this.measureCount }
  getCountInMeasures(): number { return this.countInMeasures }
  getPlaybackRate(): number { return this.playbackRate }
  getPitchSemitones(): number { return this.pitchSemitones }
  
  /**
   * ピッチを変更する（再生中でも変更可能）
   * @param semitones 半音数（正=上、負=下、例: 2 = 全音上げ）
   */
  setPitch(semitones: number) {
    this.pitchSemitones = semitones
    
    // Web Audioの場合、再生中にdetuneを変更
    if (this.waSource) {
      try {
        this.waSource.detune.value = semitones * 100
        console.log(`🎵 BGMピッチ変更: ${semitones}半音 (${semitones * 100}セント)`)
      } catch (e) {
        console.warn('BGM detune change failed:', e)
      }
    }
    
    // HTMLAudioの場合はピッチ変更はサポートされない（preservesPitchが効いているため）
    // 次回のplay()呼び出しで反映される
  }
  
  getIsCountIn(): boolean {
    if (this.waContext && this.waBuffer) {
      const elapsedRealTime = this.waContext.currentTime - this.waStartAt
      const musicTime = elapsedRealTime * this.playbackRate
      return musicTime < this.loopBegin
    }
    return !!this.audio && this.audio.currentTime < this.loopBegin
  }

  /** Measure 1 の開始へリセット */
  resetToStart() {
    if (!this.isPlaying) return
    try {
      if (this.waContext && this.waBuffer && this.waSource) {
        // 再生成して正確に先頭へ
        this.waSource.stop()
        this._startWaSourceAt(this.loopBegin)
        console.log('🔄 BGMをMeasure 1の開始へリセット')
        return
      }
      if (this.audio) {
        this.audio.currentTime = this.loopBegin
        if (this.audio.paused) {
          void this.audio.play().catch(() => {})
        }
        console.log('🔄 BGMをMeasure 1の開始へリセット')
      }
    } catch (error) {
      console.warn('BGMリセットエラー:', error)
    }
  }

  // ─────────────────────────────────────────────
  // Web Audio 実装
  private async _playWebAudio(url: string, volume: number): Promise<void> {
    // 再生速度が1.0でない場合はHTMLAudioを使用（ピッチ保持のため）
    // AudioBufferSourceNodeにはpreservesPitchがないため
    if (this.playbackRate !== 1.0) {
      this._playHtmlAudio(url, volume)
      return
    }

    if (!this.waContext) {
      this.waContext = new (window.AudioContext || (window as any).webkitAudioContext)({ latencyHint: 'interactive' })
    }
    if (!this.waGain) {
      this.waGain = this.waContext.createGain()
      this.waGain.connect(this.waContext.destination)
    }
    this.waGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.waContext.currentTime)

    const resp = await fetch(url)
    const arr = await resp.arrayBuffer()
    const buf = await this.waContext.decodeAudioData(arr.slice(0))
    this.waBuffer = buf

    // ループポイントを設定（サンプル精度）
    this._startWaSourceAt(0)
    this.isPlaying = true
    this.startTime = performance.now()
    console.log('🎵 BGM再生開始 (WebAudio):', { url, bpm: this.bpm, loopBegin: this.loopBegin, loopEnd: this.loopEnd, countIn: this.countInMeasures })
  }

  private _startWaSourceAt(offsetSec: number) {
    if (!this.waContext || !this.waBuffer) return
    // 既存ソース破棄
    if (this.waSource) {
      try { this.waSource.stop() } catch {}
      try { this.waSource.disconnect() } catch {}
    }
    const src = this.waContext.createBufferSource()
    src.buffer = this.waBuffer
    src.loop = true
    src.loopStart = this.loopBegin
    src.loopEnd = this.loopEnd
    src.playbackRate.value = this.playbackRate // 再生速度を設定
    
    // ピッチシフト（detune）を設定（半音 = 100セント）
    // detuneは再生速度を変えずにピッチのみを変更できる
    if (this.pitchSemitones !== 0) {
      src.detune.value = this.pitchSemitones * 100
    }
    
    src.connect(this.waGain!)

    // 再生
    const when = 0
    const offset = offsetSec
    src.start(when, offset)
    // offsetSec（音楽的な時間）をrealtime（実時間）に変換
    // 音楽時間 = 実時間 * playbackRate → 実時間 = 音楽時間 / playbackRate
    this.waStartAt = this.waContext.currentTime - offset / this.playbackRate

    // 参照保持
    this.waSource = src
  }

  // ─────────────────────────────────────────────
  // HTMLAudio フォールバック
  private _playHtmlAudio(url: string, volume: number) {
    this.audio = new Audio(url)
    this.audio.preload = 'auto'
    this.audio.volume = Math.max(0, Math.min(1, volume))
    this.audio.playbackRate = this.playbackRate // 再生速度を設定
    this.audio.preservesPitch = true // 速度変更時にピッチを保持

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
          console.log('🎵 BGM再生開始:', { url, bpm: this.bpm, loopBegin: this.loopBegin, loopEnd: this.loopEnd, countIn: this.countInMeasures })
        })
        .catch((error) => {
          console.warn('BGM playback failed:', error)
          this.isPlaying = false
        })
    }
  }
}

export const bgmManager = new BGMManager()