/* HTMLAudio ベースの簡易 BGM ルーパー（ピッチシフト対応） */

// Tone.jsの型（動的インポート用）
type ToneType = typeof import('tone');
type PitchShiftType = InstanceType<ToneType['PitchShift']>;

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
  private pitchShift = 0 // ピッチシフト（半音単位、-12 ~ +12）

  // Web Audio
  private waContext: AudioContext | null = null
  private waGain: GainNode | null = null
  private waBuffer: AudioBuffer | null = null
  private waSource: AudioBufferSourceNode | null = null
  private waStartAt: number = 0
  
  // Tone.js PitchShift（ピッチシフト用）
  private tonePitchShift: PitchShiftType | null = null
  private tonePlayer: any = null // Tone.Player
  private toneLoopStart: number = 0
  private toneLoopEnd: number = 0
  private useTonePitchShift = false // Tone.jsを使用するかどうか
  private pitchShiftLatency = 0 // PitchShiftの処理遅延（秒）
  
  // 非同期ロード中のフォールバック時間計算用
  private playInitiatedAt = 0 // play()が呼ばれたperformance.now()
  private isLoadingAudio = false // 非同期BGMロード中フラグ
  private audioStartOffset = 0 // カウントインスキップ時の再生開始オフセット（秒）
  private currentUrl = '' // 現在再生中のBGM URL

  // デコード済みバッファキャッシュ（セクション切り替え高速化用）
  private preloadedBuffers: Map<string, any> = new Map() // url -> ToneAudioBuffer
  private preloadedWaBuffers: Map<string, AudioBuffer> = new Map() // url -> decoded AudioBuffer

  // ─── 事前準備済みチェーン（次セクション即時切り替え用） ───
  private pendingTonePlayer: any = null
  private pendingToneGain: any = null
  private pendingTonePitchShift: PitchShiftType | null = null
  private pendingWaBuffer: AudioBuffer | null = null
  private pendingHtmlAudio: HTMLAudioElement | null = null
  private pendingUrl = ''
  private pendingReady = false
  private prepareGeneration = 0
  private pendingParams: {
    bpm: number; timeSignature: number; measureCount: number; countInMeasures: number;
    loopBegin: number; loopEnd: number; playbackRate: number; pitchShift: number;
    noLoop: boolean; volume: number; useTone: boolean; startOffset: number;
  } | null = null

  /**
   * 生の再生位置（BGM先頭基準）をゲーム内の音楽時間へ正規化する。
   * - M1開始を0秒として返す（カウントイン中は負値）
   * - ループ後は loopBegin〜loopEnd の範囲で正規化
   */
  private normalizeMusicTime(musicTime: number): number {
    if (this.noLoop) {
      // ループ無効時: M1=0として線形に返す（ループ正規化なし）
      return musicTime - this.loopBegin
    }
    const loopDuration = this.loopEnd - this.loopBegin
    if (loopDuration > 0 && musicTime >= this.loopEnd) {
      // ループ後: loopBegin〜loopEndの範囲で正規化し、M1=0として返す
      const timeSinceLoopStart = musicTime - this.loopBegin
      return timeSinceLoopStart % loopDuration
    }
    // 最初のループ前（カウントイン含む）: M1開始を0秒として返す
    return musicTime - this.loopBegin
  }

  // ループ無効フラグ（timing_combining用）
  private noLoop = false
  // セクション終了時コールバック（timing_combining用）
  private onSectionEnd: (() => void) | null = null
  // セクション終了チェックタイマー
  private sectionEndCheckId: number | null = null

  /**
   * timing_combining セクション終了コールバックを設定
   */
  setOnSectionEnd(cb: (() => void) | null) {
    this.onSectionEnd = cb
  }

  /**
   * 現在のセクションの再生残り時間（M1=0起点の音楽時間がmeasureCount分の長さを超えたか）
   */
  isSectionComplete(): boolean {
    if (!this.isPlaying || !this.noLoop) return false
    const musicTime = this.getCurrentMusicTime()
    const secPerMeasure = (60 / this.bpm) * this.timeSignature
    const sectionDuration = this.measureCount * secPerMeasure
    return musicTime >= sectionDuration - 0.01
  }

  /**
   * 同一BGM URLのセクションへギャップレスで再スタートする。
   * 既存のオーディオチェーン（Gain/PitchShift）を維持し、
   * ソースノードの再生位置だけを切り替えるため遷移ラグが極小。
   * 対応していない場合はfalseを返す（呼び出し側でplay()にフォールバック）。
   */
  restartSameSection(
    bpm: number,
    timeSig: number,
    measureCount: number,
    countIn: number,
    skipCountIn = false
  ): boolean {
    if (!this.isPlaying) return false

    const countInMeasures = Math.max(0, Math.floor(countIn || 0))
    const secPerBeat = 60 / bpm
    const secPerMeas = secPerBeat * timeSig
    const loopBegin = countInMeasures * secPerMeas
    const startOffset = skipCountIn ? loopBegin : 0

    this.bpm = bpm
    this.timeSignature = timeSig
    this.measureCount = measureCount
    this.countInMeasures = countInMeasures
    this.loopBegin = loopBegin
    this.loopEnd = (countInMeasures + measureCount) * secPerMeas
    this.toneLoopStart = this.loopBegin
    this.toneLoopEnd = this.loopEnd
    this.audioStartOffset = startOffset

    if (this.useTonePitchShift && this.tonePlayer) {
      try {
        const Tone = (window as any).Tone
        this.tonePlayer.stop()
        const now = Tone?.now?.() ?? 0
        this.tonePlayer.loopStart = this.loopBegin
        this.tonePlayer.loopEnd = Math.min(this.loopEnd, this.tonePlayer.buffer?.duration ?? Infinity)
        this.tonePlayer.start(now, startOffset)
        this.waStartAt = now + this.pitchShiftLatency - startOffset / this.playbackRate
        this.startTime = performance.now()
        this.playInitiatedAt = performance.now()
        return true
      } catch { return false }
    }

    if (this.waContext && this.waBuffer) {
      this._startWaSourceAt(startOffset)
      this.startTime = performance.now()
      this.playInitiatedAt = performance.now()
      return true
    }

    if (this.audio) {
      this.audio.currentTime = startOffset
      if (this.audio.paused) void this.audio.play().catch(() => {})
      this.startTime = performance.now()
      this.playInitiatedAt = performance.now()
      return true
    }

    return false
  }

  play(
    url: string,
    bpm: number,
    timeSig: number,
    measureCount: number,
    countIn: number,
    volume = 0.7,
    playbackRate = 1.0,
    pitchShift = 0, // 半音単位のピッチシフト（-12 ~ +12）
    noLoop = false, // timing_combining用: ループ無効
    skipCountIn = false // true: カウントイン音声をスキップしM1から再生開始
  ) {
    if (!url) return
    
    this.stopPlayer()
    this.currentUrl = url
    
    // パラメータを保存
    this.bpm = bpm
    this.timeSignature = timeSig
    this.measureCount = measureCount
    this.countInMeasures = Math.max(0, Math.floor(countIn || 0))
    this.playbackRate = Math.max(0.25, Math.min(2.0, playbackRate)) // 再生速度を0.25〜2.0に制限
    this.pitchShift = Math.max(-12, Math.min(12, pitchShift)) // ピッチシフトを-12〜+12に制限
    this.noLoop = noLoop
    
    /* 計算: 1 拍=60/BPM 秒・1 小節=timeSig 拍 */
    const secPerBeat = 60 / bpm
    const secPerMeas = secPerBeat * timeSig
    this.loopBegin = this.countInMeasures * secPerMeas
    this.loopEnd = (this.countInMeasures + measureCount) * secPerMeas
    this.toneLoopStart = this.loopBegin
    this.toneLoopEnd = this.loopEnd
    this.audioStartOffset = skipCountIn ? this.loopBegin : 0
    
    // 非同期ロード中のフォールバック: play()時点からの経過時間でカウントインを模擬
    this.playInitiatedAt = performance.now()
    this.isLoadingAudio = true
    
    // デバッグログ: BGM時間計算の詳細
    console.log('🎵 BGMManager.play() - 時間同期設定:', {
      bpm,
      timeSignature: timeSig,
      measureCount,
      countInMeasures: this.countInMeasures,
      secPerBeat: secPerBeat.toFixed(3),
      secPerMeasure: secPerMeas.toFixed(3),
      loopBegin: this.loopBegin.toFixed(3),
      loopEnd: this.loopEnd.toFixed(3),
      playbackRate: this.playbackRate,
      pitchShift: this.pitchShift,
      note: `BGM 0秒 = カウントイン開始, BGM ${this.loopBegin.toFixed(2)}秒 = M1 Beat1 (getCurrentMusicTime = 0)`
    })

    // ピッチシフトが必要な場合はTone.jsを使用
    if (this.pitchShift !== 0) {
      this.useTonePitchShift = true
      this._playTonePitchShift(url, volume).catch(err => {
        console.warn('Tone.js PitchShift failed, fallback to WebAudio:', err)
        this.useTonePitchShift = false
        this._playWebAudio(url, volume).catch(err2 => {
          console.warn('WebAudio BGM failed, fallback to HTMLAudio:', err2)
          this._playHtmlAudio(url, volume)
        })
      })
      return
    }

    this.useTonePitchShift = false
    // Web Audio 経路でシームレスループを試みる
    this._playWebAudio(url, volume).catch(err => {
      console.warn('WebAudio BGM failed, fallback to HTMLAudio:', err)
      this._playHtmlAudio(url, volume)
    })
  }
  
  /**
   * ピッチシフトを動的に変更（リピート時のキー変更用）
   * @param semitones 半音数（-12 ~ +12）
   */
  setPitchShift(semitones: number) {
    this.pitchShift = Math.max(-12, Math.min(12, semitones))
    
    if (this.tonePitchShift) {
      try {
        (this.tonePitchShift as any).pitch = this.pitchShift
        console.log(`🎹 BGMピッチシフト変更: ${this.pitchShift}半音`)
      } catch (e) {
        console.warn('Failed to update pitch shift:', e)
      }
    }
  }
  
  /**
   * 現在のピッチシフト値を取得
   */
  getPitchShift(): number {
    return this.pitchShift
  }

  /**
   * 次のセクションのBGMを事前にフェッチ+デコードしキャッシュに格納。
   * Tone.jsバッファとWebAudioバッファの両方をキャッシュする。
   */
  preloadAudio(url: string) {
    if (!url) return
    if (!this.preloadedBuffers.has(url)) {
      import('tone').then(Tone => {
        const buf = new Tone.ToneAudioBuffer(url, () => {
          this.preloadedBuffers.set(url, buf)
        })
      }).catch(() => {})
    }
    if (!this.preloadedWaBuffers.has(url)) {
      this._preloadWaBuffer(url)
    }
  }

  private async _preloadWaBuffer(url: string) {
    try {
      if (!this.waContext) {
        this.waContext = new (window.AudioContext || (window as any).webkitAudioContext)({ latencyHint: 'interactive' })
      }
      const resp = await fetch(url)
      const arr = await resp.arrayBuffer()
      const buf = await this.waContext.decodeAudioData(arr.slice(0))
      this.preloadedWaBuffers.set(url, buf)
    } catch {}
  }

  /**
   * 次セクション用のオーディオチェーンを完全に事前構築する。
   * switchToPreparedSection() で同期的に即時切り替え可能になる。
   */
  async prepareNextSection(
    url: string,
    bpm: number,
    timeSig: number,
    measureCount: number,
    countIn: number,
    volume = 0.7,
    playbackRate = 1.0,
    pitchShift = 0,
    noLoop = false,
    skipCountIn = false
  ): Promise<void> {
    if (!url) return

    this.disposePendingChain()
    const gen = ++this.prepareGeneration

    const countInMeasures = Math.max(0, Math.floor(countIn || 0))
    const rate = Math.max(0.25, Math.min(2.0, playbackRate))
    const shift = Math.max(-12, Math.min(12, pitchShift))
    const secPerBeat = 60 / bpm
    const secPerMeas = secPerBeat * timeSig
    const loopBegin = countInMeasures * secPerMeas
    const loopEnd = (countInMeasures + measureCount) * secPerMeas
    const useTone = shift !== 0
    const startOffset = skipCountIn ? loopBegin : 0

    this.pendingParams = {
      bpm, timeSignature: timeSig, measureCount, countInMeasures,
      loopBegin, loopEnd, playbackRate: rate, pitchShift: shift,
      noLoop, volume, useTone, startOffset
    }
    this.pendingUrl = url

    try {
      if (useTone) {
        const Tone = await import('tone')
        await Tone.start()
        const ctx = Tone.getContext()
        if (ctx.state !== 'running') await ctx.resume()
        if (gen !== this.prepareGeneration) return

        this.pendingTonePitchShift = new Tone.PitchShift({
          pitch: shift, windowSize: 0.1, delayTime: 0.05
        }).toDestination()
        this.pendingToneGain = new Tone.Gain(volume).connect(this.pendingTonePitchShift)

        const cachedBuffer = this.preloadedBuffers.get(url)
        if (cachedBuffer && cachedBuffer.loaded) {
          this.pendingTonePlayer = new Tone.Player({
            url: cachedBuffer, loop: !noLoop, playbackRate: rate,
          }).connect(this.pendingToneGain)
        } else {
          await new Promise<void>((resolve, reject) => {
            this.pendingTonePlayer = new Tone.Player({
              url, loop: !noLoop, playbackRate: rate,
              onload: () => resolve(),
              onerror: (err: Error) => reject(err),
            }).connect(this.pendingToneGain)
          })
        }

        if (gen !== this.prepareGeneration) { this.disposePendingChain(); return }

        const bufDur = this.pendingTonePlayer.buffer?.duration ?? Infinity
        this.pendingTonePlayer.loopStart = loopBegin
        this.pendingTonePlayer.loopEnd = Math.min(loopEnd, bufDur)
        if (!this.preloadedBuffers.has(url) && this.pendingTonePlayer.buffer) {
          this.preloadedBuffers.set(url, this.pendingTonePlayer.buffer)
        }
      } else if (rate === 1.0) {
        if (!this.preloadedWaBuffers.has(url)) {
          if (!this.waContext) {
            this.waContext = new (window.AudioContext || (window as any).webkitAudioContext)({ latencyHint: 'interactive' })
          }
          const resp = await fetch(url)
          const arr = await resp.arrayBuffer()
          const buf = await this.waContext.decodeAudioData(arr.slice(0))
          if (gen !== this.prepareGeneration) return
          this.preloadedWaBuffers.set(url, buf)
        }
        this.pendingWaBuffer = this.preloadedWaBuffers.get(url) || null
      } else {
        this.pendingHtmlAudio = new Audio(url)
        this.pendingHtmlAudio.preload = 'auto'
        this.pendingHtmlAudio.volume = Math.max(0, Math.min(1, volume))
        this.pendingHtmlAudio.playbackRate = rate
        this.pendingHtmlAudio.preservesPitch = true
        await new Promise<void>((resolve) => {
          const audio = this.pendingHtmlAudio!
          if (audio.readyState >= 3) { resolve(); return }
          const onReady = () => { audio.removeEventListener('canplaythrough', onReady); resolve() }
          audio.addEventListener('canplaythrough', onReady)
          setTimeout(resolve, 3000)
        })
      }

      if (gen !== this.prepareGeneration) { this.disposePendingChain(); return }
      this.pendingReady = true
    } catch (e) {
      console.warn('prepareNextSection failed:', e)
      this.disposePendingChain()
    }
  }

  /**
   * 事前準備済みのチェーンに同期的に切り替え。
   * 成功時true、未準備時falseを返す（falseの場合は通常のplay()を使用すること）。
   */
  switchToPreparedSection(): boolean {
    if (!this.pendingReady || !this.pendingParams) return false

    const p = this.pendingParams

    this.bpm = p.bpm
    this.timeSignature = p.timeSignature
    this.measureCount = p.measureCount
    this.countInMeasures = p.countInMeasures
    this.loopBegin = p.loopBegin
    this.loopEnd = p.loopEnd
    this.toneLoopStart = p.loopBegin
    this.toneLoopEnd = p.loopEnd
    this.playbackRate = p.playbackRate
    this.pitchShift = p.pitchShift
    this.noLoop = p.noLoop
    this.playGeneration++

    this.audioStartOffset = p.startOffset

    if (p.useTone && this.pendingTonePlayer) {
      const Tone = (window as any).Tone
      const startTime = Tone?.now?.() ?? 0
      try { this.pendingTonePlayer.start(startTime, p.startOffset) } catch (e) {
        console.warn('switchToPreparedSection: Tone start failed', e)
        this.disposePendingChain()
        return false
      }

      this.disposeToneChain()
      try { this.waSource?.stop?.() } catch {}
      try { this.waSource?.disconnect?.() } catch {}
      this.waSource = null; this.waBuffer = null
      if (this.audio) { try { this.audio.pause?.() } catch {}; this.audio = null }

      this.tonePlayer = this.pendingTonePlayer
      this.toneGain = this.pendingToneGain
      this.tonePitchShift = this.pendingTonePitchShift
      this.pendingTonePlayer = null
      this.pendingToneGain = null
      this.pendingTonePitchShift = null

      this.useTonePitchShift = true
      this.isPlaying = true
      this.isLoadingAudio = false
      this.startTime = performance.now()
      this.pitchShiftLatency = 0.05 + 0.1 * 0.5
      this.waStartAt = startTime + this.pitchShiftLatency - p.startOffset / this.playbackRate
    } else if (!p.useTone && p.playbackRate === 1.0 && this.pendingWaBuffer) {
      this.disposeToneChain()
      try { this.waSource?.stop?.() } catch {}
      try { this.waSource?.disconnect?.() } catch {}
      this.waSource = null
      if (this.audio) { try { this.audio.pause?.() } catch {}; this.audio = null }

      this.useTonePitchShift = false
      this.waBuffer = this.pendingWaBuffer
      this.pendingWaBuffer = null

      if (!this.waContext) {
        this.waContext = new (window.AudioContext || (window as any).webkitAudioContext)({ latencyHint: 'interactive' })
      }
      if (!this.waGain) {
        this.waGain = this.waContext.createGain()
        this.waGain.connect(this.waContext.destination)
      }
      this.waGain.gain.setValueAtTime(Math.max(0, Math.min(1, p.volume)), this.waContext.currentTime)

      this._startWaSourceAt(p.startOffset)
      this.isPlaying = true
      this.isLoadingAudio = false
      this.startTime = performance.now()
    } else if (this.pendingHtmlAudio) {
      this.disposeToneChain()
      try { this.waSource?.stop?.() } catch {}
      try { this.waSource?.disconnect?.() } catch {}
      this.waSource = null; this.waBuffer = null
      if (this.audio) { try { this.audio.pause?.() } catch {} }

      this.useTonePitchShift = false
      this.audio = this.pendingHtmlAudio
      this.pendingHtmlAudio = null
      this.audio.currentTime = p.startOffset
      this.isPlaying = true
      this.isLoadingAudio = false
      this.startTime = performance.now()
      this.audio.play().catch(() => {})
    } else {
      this.disposePendingChain()
      return false
    }

    this.currentUrl = this.pendingUrl
    this.pendingParams = null
    this.pendingUrl = ''
    this.pendingReady = false
    this.playInitiatedAt = performance.now()
    return true
  }

  getCurrentUrl(): string { return this.currentUrl }

  isPreparedSectionReady(): boolean { return this.pendingReady }

  private disposePendingChain() {
    if (this.pendingTonePlayer) {
      try { this.pendingTonePlayer.stop() } catch {}
      try { this.pendingTonePlayer.dispose() } catch {}
      this.pendingTonePlayer = null
    }
    if (this.pendingToneGain) {
      try { this.pendingToneGain.dispose() } catch {}
      this.pendingToneGain = null
    }
    if (this.pendingTonePitchShift) {
      try { this.pendingTonePitchShift.dispose() } catch {}
      this.pendingTonePitchShift = null
    }
    this.pendingWaBuffer = null
    if (this.pendingHtmlAudio) {
      try { this.pendingHtmlAudio.pause() } catch {}
      try { (this.pendingHtmlAudio as any).src = '' } catch {}
      this.pendingHtmlAudio = null
    }
    this.pendingReady = false
    this.pendingParams = null
    this.pendingUrl = ''
  }

  setVolume(v: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, v))
    }
    if (this.waGain && this.waContext) {
      this.waGain.gain.setValueAtTime(Math.max(0, Math.min(1, v)), this.waContext.currentTime)
    }
  }

  private stopPlayer() {
    this.isPlaying = false
    this.isLoadingAudio = false
    this.loopScheduled = false
    this.noLoop = false
    this.playGeneration++
    this.disposePendingChain()
    if (this.sectionEndCheckId !== null) {
      clearInterval(this.sectionEndCheckId)
      this.sectionEndCheckId = null
    }

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
      
      // Tone.js cleanup
      this.useTonePitchShift = false
      this.disposeToneChain()
    } catch (e) {
      console.warn('BGMManager.stop safe stop failed:', e)
    } finally {
      this.timeUpdateHandler = null
      this.audio = null
      console.log('🔇 BGM停止・クリーンアップ完了')
    }
  }

  stop() {
    this.stopPlayer()
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
   * 
   * 重要: AudioContext.currentTimeを使用して正確な同期を実現
   * - BGMは0秒（カウントイン開始）から再生開始
   * - loopBegin = countInMeasures * 1小節の長さ
   * - M1開始を0秒として返す（カウントイン中は負の値）
   */
  /**
   * AudioContext の出力レイテンシを取得する。
   * outputLatency + baseLatency を合算し、ユーザーが実際に音を聴くまでの
   * 遅延を返す（秒）。取得できない環境では 0 を返す。
   */
  private getOutputLatency(): number {
    if (this.waContext) {
      const ctx = this.waContext as AudioContext & { outputLatency?: number }
      const output = typeof ctx.outputLatency === 'number' ? ctx.outputLatency : 0
      const base = typeof ctx.baseLatency === 'number' ? ctx.baseLatency : 0
      return output + base
    }
    return 0
  }

  getCurrentMusicTime(): number {
    if (this.isPlaying) {
      // 出力レイテンシ補正: AudioContextの報告時間はスピーカー出力より先行するため、
      // レイテンシ分を差し引いてユーザーが実際に聴いている音楽位置に近づける
      const latencyCompensation = this.getOutputLatency()

      // Tone.js PitchShift使用時
      if (this.useTonePitchShift && this.tonePlayer) {
        try {
          const Tone = (window as any).Tone
          if (Tone && typeof Tone.now === 'function') {
            // Tone.now()を使用して経過時間を計算
            const elapsedRealTime = Tone.now() - this.waStartAt - latencyCompensation
            // playbackRateを考慮した音楽的な時間（BGM先頭=0）
            const musicTime = elapsedRealTime * this.playbackRate
            return this.normalizeMusicTime(musicTime)
          }
        } catch {}
      }
      
      if (this.waContext && this.waBuffer) {
        // Web Audio 再生時間を計算
        // AudioContext.currentTimeを使用して正確な経過時間を取得
        const elapsedRealTime = this.waContext.currentTime - this.waStartAt - latencyCompensation
        // playbackRateを考慮した音楽的な時間（BGM先頭=0）
        const musicTime = elapsedRealTime * this.playbackRate
        return this.normalizeMusicTime(musicTime)
      }
      // HTMLAudioの場合、currentTimeは既に再生速度を考慮した音楽的な時間
      if (this.audio) {
        const musicTime = this.audio.currentTime
        return this.normalizeMusicTime(musicTime)
      }
    }
    
    // 非同期BGMロード中: performance.now()ベースでカウントイン時間を模擬
    // これにより Tone.js/WebAudio のロード中もノーツ描画が進み、ゲームが固まらない
    if (this.isLoadingAudio && this.playInitiatedAt > 0) {
      const elapsedMs = performance.now() - this.playInitiatedAt
      const elapsedSec = (elapsedMs / 1000) * this.playbackRate + this.audioStartOffset
      return this.normalizeMusicTime(elapsedSec)
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
  getIsCountIn(): boolean {
    // getCurrentMusicTime()と一貫性を持たせる
    // M1開始が0秒なので、負の値 = カウントイン中
    return this.getCurrentMusicTime() < 0
  }
  
  /**
   * デバッグ用: 現在の時間同期情報を取得
   */
  getTimingDebugInfo(): {
    isPlaying: boolean;
    currentMusicTime: number;
    isCountIn: boolean;
    loopBegin: number;
    loopEnd: number;
    countInMeasures: number;
    bpm: number;
    measureCount: number;
    elapsedRealTime?: number;
    rawMusicTime?: number;
  } {
    let elapsedRealTime: number | undefined;
    let rawMusicTime: number | undefined;
    
    if (this.isPlaying) {
      if (this.useTonePitchShift && this.tonePlayer) {
        try {
          const Tone = (window as any).Tone;
          if (Tone && typeof Tone.now === 'function') {
            elapsedRealTime = Tone.now() - this.waStartAt;
            rawMusicTime = elapsedRealTime * this.playbackRate;
          }
        } catch {}
      } else if (this.waContext && this.waBuffer) {
        elapsedRealTime = this.waContext.currentTime - this.waStartAt;
        rawMusicTime = elapsedRealTime * this.playbackRate;
      } else if (this.audio) {
        rawMusicTime = this.audio.currentTime;
      }
    }
    
    return {
      isPlaying: this.isPlaying,
      currentMusicTime: this.getCurrentMusicTime(),
      isCountIn: this.getIsCountIn(),
      loopBegin: this.loopBegin,
      loopEnd: this.loopEnd,
      countInMeasures: this.countInMeasures,
      bpm: this.bpm,
      measureCount: this.measureCount,
      elapsedRealTime,
      rawMusicTime
    };
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

  private toneGain: any = null
  private playGeneration = 0

  // ─────────────────────────────────────────────
  // Tone.js PitchShift 実装（iOS対応）
  // 毎回新しいチェーンを作成、コンストラクタURL + onload Promise で確実にロード
  private async _playTonePitchShift(url: string, volume: number): Promise<void> {
    const gen = this.playGeneration
    const pitchValue = this.pitchShift
    const loopFlag = !this.noLoop
    const rate = this.playbackRate
    const loopBeginVal = this.loopBegin
    const loopEndVal = this.loopEnd

    const Tone = await import('tone')
    await Tone.start()

    const ctx = Tone.getContext()
    if (ctx.state !== 'running') {
      await ctx.resume()
    }

    if (gen !== this.playGeneration) return

    const pitchShiftWindowSize = 0.1
    const pitchShiftDelayTime = 0.05
    this.pitchShiftLatency = pitchShiftDelayTime + (pitchShiftWindowSize * 0.5)

    this.disposeToneChain()

    this.tonePitchShift = new Tone.PitchShift({
      pitch: pitchValue,
      windowSize: pitchShiftWindowSize,
      delayTime: pitchShiftDelayTime
    }).toDestination()
    this.toneGain = new Tone.Gain(volume).connect(this.tonePitchShift)

    const cachedBuffer = this.preloadedBuffers.get(url)
    if (cachedBuffer && cachedBuffer.loaded) {
      this.tonePlayer = new Tone.Player({
        url: cachedBuffer,
        loop: loopFlag,
        playbackRate: rate,
      }).connect(this.toneGain)
    } else {
      await new Promise<void>((resolve, reject) => {
        this.tonePlayer = new Tone.Player({
          url: url,
          loop: loopFlag,
          playbackRate: rate,
          onload: () => resolve(),
          onerror: (err: Error) => reject(err),
        }).connect(this.toneGain)
      })
    }

    if (gen !== this.playGeneration) {
      this.disposeToneChain()
      return
    }

    const bufferDuration = this.tonePlayer.buffer?.duration ?? Infinity
    const clampedLoopEnd = Math.min(loopEndVal, bufferDuration)

    this.tonePlayer.loopStart = loopBeginVal
    this.tonePlayer.loopEnd = clampedLoopEnd

    const startTime = Tone.now()
    this.tonePlayer.start(startTime, this.audioStartOffset)
    this.isPlaying = true
    this.isLoadingAudio = false
    this.startTime = performance.now()
    this.waStartAt = startTime + this.pitchShiftLatency - this.audioStartOffset / this.playbackRate
    console.log('🎵 BGM再生開始 (Tone.js PitchShift):', {
      url, bpm: this.bpm, pitchShift: pitchValue,
      loopBegin: loopBeginVal, loopEnd: loopEndVal,
      pitchShiftLatency: this.pitchShiftLatency.toFixed(3),
    })
  }

  private disposeToneChain() {
    if (this.tonePlayer) {
      try { this.tonePlayer.stop() } catch {}
      try { this.tonePlayer.dispose() } catch {}
      this.tonePlayer = null
    }
    if (this.toneGain) {
      try { this.toneGain.dispose() } catch {}
      this.toneGain = null
    }
    if (this.tonePitchShift) {
      try { this.tonePitchShift.dispose() } catch {}
      this.tonePitchShift = null
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

    const cachedWa = this.preloadedWaBuffers.get(url)
    if (cachedWa) {
      this.waBuffer = cachedWa
    } else {
      const resp = await fetch(url)
      const arr = await resp.arrayBuffer()
      const buf = await this.waContext.decodeAudioData(arr.slice(0))
      this.waBuffer = buf
      this.preloadedWaBuffers.set(url, buf)
    }

    // ループポイントを設定（サンプル精度）— skipCountIn時はloopBeginから再生開始
    this._startWaSourceAt(this.audioStartOffset)
    this.isPlaying = true
    this.isLoadingAudio = false
    this.startTime = performance.now()
    console.log('🎵 BGM再生開始 (WebAudio):', { url, bpm: this.bpm, loopBegin: this.loopBegin, loopEnd: this.loopEnd, countIn: this.countInMeasures, startOffset: this.audioStartOffset })
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
    if (this.noLoop) {
      src.loop = false
    } else {
      src.loop = true
      src.loopStart = this.loopBegin
      src.loopEnd = this.loopEnd
    }
    src.playbackRate.value = this.playbackRate // 再生速度を設定
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

    // skipCountIn時はloopBegin（M1）位置から、通常は0（カウントイン開始）から再生
    this.audio.currentTime = this.audioStartOffset
    
    // エラーハンドリング
    this.audio.addEventListener('error', this.handleError)
    this.audio.addEventListener('ended', this.handleEnded)
    
    if (!this.noLoop) {
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
        const epsilon = 0.02
        if (now >= this.loopEnd - epsilon) {
          try {
            this.audio.currentTime = this.loopBegin
            if (this.audio.paused) {
              void this.audio.play().catch(() => {})
            }
          } catch (e) {
            // noop
          }
        }
      }, 25)
    }
    
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