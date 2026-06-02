/** コードヴォイシング self-paced（無音フレーズ）用の共通ドラムループ BGM URL */
export const CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL =
  'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3';

/** `audio_url` 空のセルフペースは無音フレーズ用にドラム MP3 をクロックとして流用する（iOS / Web 共通方針）。 */
export const resolveChordVoicingSelfPacedPhraseClockUrl = (audioUrl: string | null | undefined): string => {
  if (audioUrl == null || audioUrl.trim() === '') {
    return CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL;
  }
  return audioUrl.trim();
};

/**
 * self-paced のみ。フレーズ切替とは独立して Web Audio でループ再生（単一コンテキスト内）。
 */
export class EarTrainingChordVoicingDrumLoop {
  private ctx: AudioContext | null = null;
  private url = '';

  /** デコード済みバッファ */
  private buffer: AudioBuffer | null = null;

  private gain: GainNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private volume = 1;
  private loopStartCtxTime: number | null = null;

  /**
   * 指定 URL を（必要なときだけ）フェッチしてデコードする。
   * @param audioContext フレーズプレイヤーと共有するコンテキスト
   */
  async prepare(url: string, audioContext: AudioContext): Promise<void> {
    if (url === '' || !audioContext) {
      return;
    }
    const sameBuffer = url === this.url && audioContext === this.ctx && this.buffer !== null;
    if (sameBuffer) {
      return;
    }

    this.ctx = audioContext;
    this.url = url;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch drum loop: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const copy = arrayBuffer.slice(0);
    this.buffer = await audioContext.decodeAudioData(copy);
  }

  /** 現在のバッファでループ再生を開始。既に鳴っている場合は一旦止めて張り替える。 */
  start(): void {
    const audioContext = this.ctx;
    const buf = this.buffer;
    if (!audioContext || !buf) {
      return;
    }
    void audioContext.resume().catch(() => undefined);
    this.stopInternal();
    const src = audioContext.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const g = audioContext.createGain();
    g.gain.value = this.volume;
    src.connect(g);
    g.connect(audioContext.destination);
    try {
      src.start();
    } catch {
      return;
    }
    this.loopStartCtxTime = audioContext.currentTime;
    this.source = src;
    this.gain = g;
  }

  /** ループ再生開始からの経過秒（未開始時は 0） */
  getPlaybackTimeSec(): number {
    const audioContext = this.ctx;
    const start = this.loopStartCtxTime;
    if (!audioContext || start === null) {
      return 0;
    }
    const elapsed = audioContext.currentTime - start;
    return Number.isFinite(elapsed) && elapsed >= 0 ? elapsed : 0;
  }

  setVolume(value: number): void {
    const safe = Math.max(0, Math.min(1, value));
    this.volume = safe;
    const audioContext = this.ctx;
    if (this.gain && audioContext) {
      this.gain.gain.setValueAtTime(safe, audioContext.currentTime);
    }
  }

  /** ソースノードのみ停止。バッファは保持して再利用可能。 */
  stop(): void {
    this.stopInternal();
  }

  private stopInternal(): void {
    const src = this.source;
    const g = this.gain;
    this.source = null;
    this.gain = null;
    this.loopStartCtxTime = null;
    if (!src) {
      return;
    }
    try {
      src.stop();
    } catch {
      // 停止済み
    }
    try {
      src.disconnect();
    } catch {
      // ignore
    }
    if (g) {
      try {
        g.disconnect();
      } catch {
        // ignore
      }
    }
  }

  dispose(): void {
    this.stopInternal();
    this.buffer = null;
    this.ctx = null;
    this.url = '';
  }
}
