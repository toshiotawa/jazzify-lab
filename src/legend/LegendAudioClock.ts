import type { AudioClock } from '@/utils/gameEngine';

export const AUDIO_CLOCK_META_INTS = 2;
export const AUDIO_CLOCK_TIME_OFFSET = AUDIO_CLOCK_META_INTS * 4;
export const AUDIO_CLOCK_BUFFER_BYTES = AUDIO_CLOCK_TIME_OFFSET + 8;
const FRAME_INDEX = 0;

export interface ClockLatencies {
  baseLatency?: number;
  outputLatency?: number;
}

export const createAudioClockBuffer = (): SharedArrayBuffer => {
  return new SharedArrayBuffer(AUDIO_CLOCK_BUFFER_BYTES);
};

export class LegendAudioClock {
  private intervalId: number | null = null;
  private readonly headerView: Int32Array;
  private readonly dataView: DataView;
  private frameId = 0;
  private boundContext: AudioContext | null = null;

  constructor(
    private readonly buffer: SharedArrayBuffer,
    private readonly intervalMs: number = 8
  ) {
    this.headerView = new Int32Array(buffer, 0, AUDIO_CLOCK_META_INTS);
    this.dataView = new DataView(buffer);
  }

  start(audioContext: AudioContext): void {
    this.boundContext = audioContext;
    if (this.intervalId !== null) {
      return;
    }

    const tick = () => {
      if (!this.boundContext) {
        return;
      }
      const currentTime = this.boundContext.currentTime;
      this.dataView.setFloat64(AUDIO_CLOCK_TIME_OFFSET, currentTime, true);
      this.frameId = (this.frameId + 1) | 0;
      Atomics.store(this.headerView, FRAME_INDEX, this.frameId);
      Atomics.notify(this.headerView, FRAME_INDEX);
    };

    tick();
    this.intervalId = window.setInterval(tick, this.intervalMs);
  }

  stop(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  dispose(): void {
    this.stop();
    this.boundContext = null;
  }

  getBuffer(): SharedArrayBuffer {
    return this.buffer;
  }
}

export class SharedAudioClockProxy implements AudioClock {
  private readonly headerView: Int32Array;
  private readonly dataView: DataView;

  constructor(
    private readonly buffer: SharedArrayBuffer,
    private readonly latencies: ClockLatencies = {}
  ) {
    this.headerView = new Int32Array(buffer, 0, AUDIO_CLOCK_META_INTS);
    this.dataView = new DataView(buffer);
  }

  get currentTime(): number {
    return this.dataView.getFloat64(AUDIO_CLOCK_TIME_OFFSET, true);
  }

  get baseLatency(): number {
    return this.latencies.baseLatency ?? 0;
  }

  get outputLatency(): number {
    return this.latencies.outputLatency ?? 0;
  }
}
