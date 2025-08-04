/* HTMLAudio ベースの簡易 BGM ルーパー */

// ループイベントのコールバック型
type LoopCallback = (loopCount: number, loopStartTime: number) => void;

class BGMManager {
  private audio: HTMLAudioElement | null = null
  private loopBegin = 0
  private loopEnd = 0
  private timeUpdateHandler: (() => void) | null = null
  private startTime = 0  // BGM開始時刻（performance.now()）
  private bpm = 120
  private timeSignature = 4
  private measureCount = 8
  private countInMeasures = 0
  private isPlaying = false
  private loopScheduled = false
  private nextLoopTime = 0
  private loopTimeoutId: number | null = null // タイムアウトIDを保持
  private loopCount = 0 // ループ回数
  private loopCallbacks: LoopCallback[] = [] // ループ時のコールバック
  private lastLoopTime = 0 // 前回のループ時刻
  
  // ループイベントリスナーの登録
  onLoop(callback: LoopCallback): () => void {
    this.loopCallbacks.push(callback);
    // 登録解除用の関数を返す
    return () => {
      const index = this.loopCallbacks.indexOf(callback);
      if (index > -1) {
        this.loopCallbacks.splice(index, 1);
      }
    };
  }
  
  // ループイベントの発火
  private triggerLoopEvent(loopStartTime: number) {
    this.loopCallbacks.forEach(callback => {
      try {
        callback(this.loopCount, loopStartTime);
      } catch (error) {
        console.error('Loop callback error:', error);
      }
    });
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
    
    // パラメータを保存
    this.bpm = bpm
    this.timeSignature = timeSig
    this.measureCount = measureCount
    this.countInMeasures = countIn
    this.loopCount = 0 // ループ回数リセット
    
    this.audio = new Audio(url)
    this.audio.preload = 'auto'
    this.audio.volume = Math.max(0, Math.min(1, volume))
    
    /* 計算: 1 拍=60/BPM 秒・1 小節=timeSig 拍 */
    const secPerBeat = 60 / bpm
    const secPerMeas = secPerBeat * timeSig
    this.loopBegin = countIn * secPerMeas
    this.loopEnd = (countIn + measureCount) * secPerMeas

    // 初回再生は最初から（カウントインを含む）
    this.audio.currentTime = 0
    
    // エラーハンドリング
    this.audio.addEventListener('error', this.handleError)
    this.audio.addEventListener('ended', this.handleEnded)
    
    // timeupdate イベントハンドラを保存（より精密なループ処理）
    this.timeUpdateHandler = () => {
      if (!this.audio || !this.isPlaying) return
      
      const currentTime = this.audio.currentTime
      const timeToEnd = this.loopEnd - currentTime
      
      // ループの事前スケジューリング（100ms前に準備）
      if (timeToEnd < 0.1 && timeToEnd > 0 && !this.loopScheduled) {
        this.loopScheduled = true
        this.nextLoopTime = this.loopBegin
        
        // タイムアウトIDを保持
        this.loopTimeoutId = window.setTimeout(() => {
          if (this.audio && this.isPlaying) {
            const loopStartTime = performance.now();
            this.audio.currentTime = this.nextLoopTime
            this.loopCount++
            this.lastLoopTime = loopStartTime
            console.log(`🔄 BGM Loop #${this.loopCount} @ ${this.nextLoopTime.toFixed(2)}s`)
            
            // ループイベントを発火
            this.triggerLoopEvent(loopStartTime);
          }
          this.loopScheduled = false
          this.loopTimeoutId = null
        }, Math.max(0, timeToEnd * 1000 - 50)) // 50ms早めに実行
      }
    }
    
    this.audio.addEventListener('timeupdate', this.timeUpdateHandler)
    
    // 再生開始時刻を記録
    this.startTime = performance.now()
    this.isPlaying = true
    
    // 再生開始
    const playPromise = this.audio.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('🎵 BGM再生開始:', { url, bpm, loopBegin: this.loopBegin, loopEnd: this.loopEnd })
        })
        .catch((error) => {
          console.warn('BGM playback failed:', error)
          this.isPlaying = false
        })
    }
  }

  setVolume(v: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, v))
    }
  }

  stop() {
    console.log('🔇 BGMManager.stop() 呼び出し')
    this.isPlaying = false
    this.loopScheduled = false // ループスケジュールをリセット
    this.loopCount = 0
    this.loopCallbacks = [] // リスナーをクリア
    
    if (this.loopTimeoutId !== null) {
      clearTimeout(this.loopTimeoutId)
      this.loopTimeoutId = null
    }
    
    if (this.audio) {
      // イベントリスナーの削除
      if (this.timeUpdateHandler) {
        this.audio.removeEventListener('timeupdate', this.timeUpdateHandler)
        this.timeUpdateHandler = null
      }
      
      // その他のイベントリスナーも削除
      this.audio.removeEventListener('ended', this.handleEnded)
      this.audio.removeEventListener('error', this.handleError)
      
      // オーディオの停止と解放
      try {
        this.audio.pause()
        this.audio.currentTime = 0
        this.audio.src = '' // srcをクリアしてメモリを解放
        this.audio.load() // 明示的にリソースを解放
      } catch (e) {
        console.warn('Audio cleanup error:', e)
      }
      
      this.audio = null
    }
    
    console.log('🔇 BGM停止・クリーンアップ完了')
  }
  
  // エラーハンドリング
  private handleError = (e: Event) => {
    console.error('BGM playback error:', e)
    this.isPlaying = false
  }
  
  // 終了ハンドリング
  private handleEnded = () => {
    if (this.loopEnd > 0) {
      this.audio!.currentTime = this.loopBegin
      this.audio!.play().catch(console.error)
    }
  }
  
  // タイミング管理用の新しいメソッド
  
  /**
   * 現在の音楽的時間を取得（秒単位）
   * カウントイン終了時を0秒とする
   * ループを考慮した連続的な時間を返す
   */
  getCurrentMusicTime(): number {
    if (!this.isPlaying || !this.audio) return 0
    
    const audioTime = this.audio.currentTime
    const countInDuration = this.countInMeasures * (60 / this.bpm) * this.timeSignature
    
    // ループ回数を考慮した連続的な時間
    const loopDuration = this.measureCount * (60 / this.bpm) * this.timeSignature
    const continuousTime = audioTime - countInDuration + (this.loopCount * loopDuration)
    
    return continuousTime
  }
  
  /**
   * ループを考慮した現在の音楽時間を取得（ループ内での相対時間）
   */
  getRelativeMusicTime(): number {
    if (!this.isPlaying || !this.audio) return 0
    
    const audioTime = this.audio.currentTime
    const countInDuration = this.countInMeasures * (60 / this.bpm) * this.timeSignature
    
    // カウントイン後の時間を返す（カウントイン中は負の値）
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
    const measure = Math.floor(musicTime / secPerMeasure) + 1
    
    // ループを考慮
    return ((measure - 1) % this.measureCount) + 1
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
   * 次のループまでの時間を取得（ミリ秒）
   */
  getTimeToLoop(): number {
    if (!this.isPlaying || !this.audio) return Infinity
    
    const currentTime = this.audio.currentTime
    const timeToEnd = this.loopEnd - currentTime
    
    return timeToEnd > 0 ? timeToEnd * 1000 : 0
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
   * 総小節数を取得
   */
  getMeasureCount(): number {
    return this.measureCount
  }
  
  /**
   * カウントイン小節数を取得
   */
  getCountInMeasures(): number {
    return this.countInMeasures
  }
  
  /**
   * 現在のループ回数を取得
   */
  getLoopCount(): number {
    return this.loopCount
  }
  
  /**
   * ループの総時間を取得（秒）
   */
  getLoopDuration(): number {
    return this.measureCount * (60 / this.bpm) * this.timeSignature
  }
}

export const bgmManager = new BGMManager()