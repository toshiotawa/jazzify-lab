import { CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL } from '@/utils/earTrainingChordVoicingDrumLoop';

export { CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL as SURVIVAL_PHRASE_DEFAULT_DRUM_LOOP_URL };

/**
 * Survival Phrases mode BGM: seamless Web Audio loop (same pattern as ear-training self-paced).
 */
export class SurvivalPhraseDrumLoop {
  private ctx: AudioContext | null = null;
  private url = '';
  private buffer: AudioBuffer | null = null;
  private gain: GainNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private volume = 1;

  async prepare(url: string, audioContext: AudioContext): Promise<void> {
    if (url === '' || !audioContext) {
      return;
    }
    const sameBuffer = url === this.url && audioContext === this.ctx && this.buffer !== null;
    if (sameBuffer) {
      return;
    }
    this.stopInternal();
    this.ctx = audioContext;
    this.url = url;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch phrase drum loop: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const copy = arrayBuffer.slice(0);
    this.buffer = await audioContext.decodeAudioData(copy);
  }

  start(): void {
    const audioContext = this.ctx;
    const buf = this.buffer;
    if (!audioContext || !buf) {
      return;
    }
    if (this.source !== null) {
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
    this.source = src;
    this.gain = g;
  }

  isPlaying(): boolean {
    return this.source !== null;
  }

  setVolume(value: number): void {
    const safe = Math.max(0, Math.min(1, value));
    this.volume = safe;
    const audioContext = this.ctx;
    if (this.gain && audioContext) {
      this.gain.gain.setValueAtTime(safe, audioContext.currentTime);
    }
  }

  stop(): void {
    this.stopInternal();
  }

  dispose(): void {
    this.stopInternal();
    this.buffer = null;
    this.ctx = null;
    this.url = '';
  }

  private stopInternal(): void {
    const src = this.source;
    const g = this.gain;
    this.source = null;
    this.gain = null;
    if (!src) {
      return;
    }
    try {
      src.stop();
    } catch {
      // already stopped
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
}
