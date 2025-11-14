import { unifiedFrameController } from './performanceOptimizer';

interface FramePayload {
  timestamp: number;
  deltaMs: number;
}

type FrameCallback = (payload: FramePayload) => void;

class SharedAnimationLoop {
  private callbacks = new Set<FrameCallback>();
  private rafId: number | null = null;
  private lastTimestamp = 0;
  private running = false;

  add(callback: FrameCallback): () => void {
    this.callbacks.add(callback);
    this.start();
    return () => {
      this.callbacks.delete(callback);
      if (this.callbacks.size === 0) {
        this.stop();
      }
    };
  }

  private start(): void {
    if (this.running) return;
    if (typeof window === 'undefined') return;
    this.running = true;
    this.lastTimestamp = 0;
    this.rafId = window.requestAnimationFrame(this.handleFrame);
  }

  private stop(): void {
    if (!this.running) return;
    this.running = false;
    if (typeof window !== 'undefined' && this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
    }
    this.rafId = null;
    this.lastTimestamp = 0;
  }

  private handleFrame = (timestamp: number): void => {
    if (!this.running) return;

    if (unifiedFrameController.shouldSkipFrame(timestamp)) {
      this.queueNextFrame();
      return;
    }

    const deltaMs = this.lastTimestamp === 0 ? 0 : timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    for (const callback of this.callbacks) {
      callback({ timestamp, deltaMs });
    }

    unifiedFrameController.markEffectUpdate(timestamp);
    this.queueNextFrame();
  };

  private queueNextFrame(): void {
    if (typeof window === 'undefined') {
      this.stop();
      return;
    }
    this.rafId = window.requestAnimationFrame(this.handleFrame);
  }
}

export const sharedAnimationLoop = new SharedAnimationLoop();
