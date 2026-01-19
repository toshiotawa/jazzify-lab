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
  
  // ループ回数追跡（Tone.js用）- ループ発生時に更新
  private toneLoopCount = 0
  // Tone.jsループ監視Interval
  private toneLoopCheckIntervalId: number | null = null
  // 前回の正規化時間（ループ検出用）
  private lastToneNormalizedTime = -1

  play(
    url: string,
    bpm: number,
    timeSig: number,
    measureCount: number,
    countIn: number,
    volume = 0.7,
    playbackRate = 1.0,
    pitchShift = 0 // 半音単位のピッチシフト（-12 ~ +12）
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
    this.pitchShift = Math.max(-12, Math.min(12, pitchShift)) // ピッチシフトを-12〜+12に制限
    
    /* 計算: 1 拍=60/BPM 秒・1 小節=timeSig 拍 */
    const secPerBeat = 60 / bpm
    const secPerMeas = secPerBeat * timeSig
    this.loopBegin = this.countInMeasures * secPerMeas
    this.loopEnd = (this.countInMeasures + measureCount) * secPerMeas
    this.toneLoopStart = this.loopBegin
    this.toneLoopEnd = this.loopEnd
    
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
    this.useTonePitchShift = false

    try {
      if (this.loopTimeoutId !== null) {
        clearTimeout(this.loopTimeoutId)
        this.loopTimeoutId = null
      }
      if (this.loopCheckIntervalId !== null) {
        clearInterval(this.loopCheckIntervalId)
        this.loopCheckIntervalId = null
      }
      if (this.toneLoopCheckIntervalId !== null) {
        clearInterval(this.toneLoopCheckIntervalId)
        this.toneLoopCheckIntervalId = null
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
      try { 
        if (this.tonePlayer) {
          this.tonePlayer.stop()
          this.tonePlayer.dispose()
          this.tonePlayer = null
        }
      } catch {}
      try {
        if (this.tonePitchShift) {
          this.tonePitchShift.dispose()
          this.tonePitchShift = null
        }
      } catch {}
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
   * 
   * 重要: AudioContext.currentTimeを使用して正確な同期を実現
   * - BGMは0秒（カウントイン開始）から再生開始
   * - loopBegin = countInMeasures * 1小節の長さ
   * - M1開始を0秒として返す（カウントイン中は負の値）
   * 
   * ループ後の計算（重要）:
   * - ループ後はオーディオが loopBegin に戻る（カウントインをスキップ）
   * - 戻り値は常に 0 〜 loopDuration の範囲（M1開始=0）
   */
  getCurrentMusicTime(): number {
    if (this.isPlaying) {
      // Tone.js PitchShift使用時
      if (this.useTonePitchShift && this.tonePlayer) {
        try {
          const Tone = (window as any).Tone
          if (Tone && typeof Tone.now === 'function') {
            // Tone.now()を使用して経過時間を計算
            const elapsedRealTime = Tone.now() - this.waStartAt
            // playbackRateを考慮した音楽的な時間（BGMファイル内の位置）
            const rawMusicTime = elapsedRealTime * this.playbackRate
            const loopDuration = this.loopEnd - this.loopBegin
            
            // 最初のループ前（カウントイン中）
            if (rawMusicTime < this.loopEnd) {
              // M1開始を0秒として返す（カウントイン中は負の値）
              return rawMusicTime - this.loopBegin
            }
            
            // ループ後: loopBegin〜loopEndの範囲で正規化
            // Tone.js Playerはオーディオを loopBegin に戻すので、
            // 経過時間からループ回数を計算してオーディオ位置を算出
            if (loopDuration > 0) {
              // loopEnd到達後の経過時間
              const timeSinceFirstLoopEnd = rawMusicTime - this.loopEnd
              // その時間でループ範囲内の位置を計算
              // ※オーディオはloopBeginに戻ってloopDuration分進む
              const posInLoop = timeSinceFirstLoopEnd % loopDuration
              // M1開始=0として返す（0 〜 loopDuration の範囲）
              return posInLoop
            }
            
            return rawMusicTime - this.loopBegin
          }
        } catch {}
      }
      
      if (this.waContext && this.waBuffer) {
        // Web Audio 再生時間を計算
        // AudioContext.currentTimeを使用して正確な経過時間を取得
        const elapsedRealTime = this.waContext.currentTime - this.waStartAt
        // playbackRateを考慮した音楽的な時間
        const rawMusicTime = elapsedRealTime * this.playbackRate
        const loopDuration = this.loopEnd - this.loopBegin
        
        // 最初のループ前（カウントイン中）
        if (rawMusicTime < this.loopEnd) {
          return rawMusicTime - this.loopBegin
        }
        
        // ループ後: loopBegin〜loopEndの範囲で正規化
        if (loopDuration > 0) {
          const timeSinceFirstLoopEnd = rawMusicTime - this.loopEnd
          const posInLoop = timeSinceFirstLoopEnd % loopDuration
          return posInLoop
        }
        
        return rawMusicTime - this.loopBegin
      }
      // HTMLAudioの場合、currentTimeは実際のオーディオ位置
      if (this.audio) {
        const loopDuration = this.loopEnd - this.loopBegin
        const audioTime = this.audio.currentTime
        
        // 最初のループ前（カウントイン中）
        if (audioTime < this.loopEnd) {
          return audioTime - this.loopBegin
        }
        
        // ループ後: HTMLAudioのループ処理により loopBegin に戻されている場合
        // currentTime が loopBegin 〜 loopEnd の範囲内であれば正規化
        if (loopDuration > 0 && audioTime >= this.loopBegin && audioTime < this.loopEnd) {
          return audioTime - this.loopBegin
        }
        
        // その他の場合（通常は到達しない）
        if (loopDuration > 0) {
          const timeSinceFirstLoopEnd = audioTime - this.loopEnd
          const posInLoop = timeSinceFirstLoopEnd % loopDuration
          return posInLoop
        }
        
        return audioTime - this.loopBegin
      }
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

  // ─────────────────────────────────────────────
  // Tone.js PitchShift 実装（iOS対応）
  // 
  // 重要: Tone.js Playerのビルトインloop機能はPitchShiftと組み合わせると
  // 正しく動作しない場合があるため、手動でループを管理する
  private async _playTonePitchShift(url: string, volume: number): Promise<void> {
    // Tone.jsを動的インポート
    const Tone = await import('tone')
    
    // AudioContextを起動
    await Tone.start()
    
    // PitchShiftの設定
    // windowSize: FFT窓サイズ（秒）- 音質に影響
    // delayTime: 処理遅延（秒）- これがオーディオ出力の遅延になる
    const pitchShiftWindowSize = 0.1  // 100ms
    const pitchShiftDelayTime = 0.05  // 50ms
    
    // PitchShiftの総遅延を計算（delayTime + windowSize/2 程度の処理遅延）
    // 実測値に基づいて調整可能
    this.pitchShiftLatency = pitchShiftDelayTime + (pitchShiftWindowSize * 0.5)
    
    // PitchShiftノードを作成
    this.tonePitchShift = new Tone.PitchShift({
      pitch: this.pitchShift,
      windowSize: pitchShiftWindowSize,
      delayTime: pitchShiftDelayTime
    }).toDestination()
    
    // ボリューム調整（PitchShiftの前に挿入）
    const toneGainNode = new Tone.Gain(volume).connect(this.tonePitchShift)
    
    // ループカウントをリセット
    this.toneLoopCount = 0
    this.lastToneNormalizedTime = -1
    
    // Gainノードへの参照を保存（ループ時の再接続用）
    ;(this as any)._toneGainNode = toneGainNode
    
    // Playerを作成
    // 重要: ビルトインloopはPitchShiftと組み合わせると正しく動作しないため、
    // loop: falseで作成し、手動でループを管理する
    this.tonePlayer = new Tone.Player({
      url: url,
      loop: false, // 手動ループを使用するため無効化
      playbackRate: this.playbackRate,
      onload: () => {
        console.log('🎵 BGM loaded (Tone.js PitchShift)')
        
        // 再生開始時刻を先に記録（start()呼び出し前に）
        const startTime = Tone.now()
        // 再生開始（0から開始してカウントインを含める）
        this.tonePlayer.start(startTime, 0)
        this.isPlaying = true
        this.startTime = performance.now()
        // waStartAtにPitchShiftの遅延を加算して補正
        // オーディオが遅れて出力されるため、開始時刻を遅らせることで時間計算を補正
        this.waStartAt = startTime + this.pitchShiftLatency
        
        // 手動ループ監視を開始
        this._startToneLoopMonitor(Tone)
        
        console.log('🎵 BGM再生開始 (Tone.js PitchShift + 手動ループ):', { 
          url, 
          bpm: this.bpm, 
          pitchShift: this.pitchShift,
          loopBegin: this.loopBegin, 
          loopEnd: this.loopEnd,
          pitchShiftLatency: this.pitchShiftLatency.toFixed(3),
          note: `手動ループ: loopEnd到達時にloopBeginへシーク`,
          loopDuration: (this.loopEnd - this.loopBegin).toFixed(3)
        })
      }
    }).connect(toneGainNode)
  }
  
  /**
   * Tone.js Player用の手動ループ監視
   * loopEndに到達したらloopBeginにシークする
   */
  private _startToneLoopMonitor(Tone: typeof import('tone')): void {
    // 既存の監視を停止
    if (this.toneLoopCheckIntervalId !== null) {
      clearInterval(this.toneLoopCheckIntervalId)
      this.toneLoopCheckIntervalId = null
    }
    
    const loopDuration = this.loopEnd - this.loopBegin
    if (loopDuration <= 0) return
    
    // 25ms間隔でループポイントをチェック
    this.toneLoopCheckIntervalId = window.setInterval(() => {
      if (!this.isPlaying || !this.tonePlayer) {
        return
      }
      
      try {
        // 現在の再生位置を計算
        const elapsedRealTime = Tone.now() - this.waStartAt
        const musicTime = elapsedRealTime * this.playbackRate
        
        // loopEndに近づいたら（50ms手前で）ループ処理を実行
        const loopThreshold = 0.05 // 50ms
        if (musicTime >= this.loopEnd - loopThreshold) {
          this._performToneLoop(Tone)
        }
      } catch (e) {
        // エラーは無視（再生停止時など）
      }
    }, 25)
  }
  
  /**
   * Tone.js Playerのループを実行
   * 現在のPlayerを停止し、loopBeginから新しいPlayerを開始
   */
  private _performToneLoop(Tone: typeof import('tone')): void {
    if (!this.tonePlayer || !this.isPlaying) return
    
    try {
      // 現在のPlayerを停止
      this.tonePlayer.stop()
      
      const now = Tone.now()
      
      // loopBeginから再生開始
      this.tonePlayer.start(now, this.loopBegin)
      
      // waStartAtを調整して、getCurrentMusicTime()が正しくloopBegin相当の値を返すようにする
      // 計算: rawMusicTime = (now - waStartAt) * playbackRate = loopBegin
      // よって: waStartAt = now - (loopBegin / playbackRate)
      // 
      // 注意: pitchShiftLatencyは最初の再生開始時のみ適用
      // ループ時はオーディオパイプラインが既に温まっているため不要
      this.waStartAt = now - (this.loopBegin / this.playbackRate)
      
      this.toneLoopCount++
      console.log(`🔄 Tone.js 手動ループ実行 (${this.toneLoopCount}回目): loopBegin=${this.loopBegin.toFixed(2)}秒から再開`)
    } catch (e) {
      console.warn('Tone.js ループ処理エラー:', e)
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