import { unifiedFrameController } from './performanceOptimizer';

export interface FrameContext {
  timestamp: number;
  delta: number;
}

export type FrameCallback = (context: FrameContext) => void;

const getNow = (): number => {
  if (typeof performance !== 'undefined') {
    return performance.now();
  }
  return Date.now();
};

export const FRAME_PRIORITIES = {
  gameEngine: 10,
  pixiUpdates: 20,
  pixiRender: 30
} as const;

interface FrameSubscriber {
  id: number;
  callback: FrameCallback;
  priority: number;
}

class UnifiedFrameLoop {
  private subscribers: FrameSubscriber[] = [];
  private rafId: number | null = null;
  private lastTimestamp = 0;
  private idCounter = 0;

  subscribe(callback: FrameCallback, priority = 0): () => void {
    if (typeof window === 'undefined') {
      return () => undefined;
    }

    const subscriber: FrameSubscriber = {
      id: this.idCounter++,
      callback,
      priority
    };

    this.subscribers.push(subscriber);
    this.subscribers.sort((a, b) => a.priority - b.priority);
    this.start();

    return () => {
      this.subscribers = this.subscribers.filter((item) => item.id !== subscriber.id);
      if (this.subscribers.length === 0) {
        this.stop();
      }
    };
  }

  private start(): void {
    if (this.rafId !== null || typeof window === 'undefined') {
      return;
    }

    this.lastTimestamp = getNow();

    const tick = (timestamp: number) => {
      if (this.subscribers.length === 0) {
        this.stop();
        return;
      }

      const rawDelta = timestamp - this.lastTimestamp;
      const delta = Number.isFinite(rawDelta) && rawDelta > 0 ? rawDelta : 16.67;
      const shouldSkip = unifiedFrameController.shouldSkipFrame(timestamp);

      if (!shouldSkip) {
        const context: FrameContext = {
          timestamp,
          delta
        };
        const snapshot = this.subscribers.slice();
        for (const subscriber of snapshot) {
          subscriber.callback(context);
        }
        this.lastTimestamp = timestamp;
      }

      this.rafId = window.requestAnimationFrame(tick);
    };

    this.rafId = window.requestAnimationFrame(tick);
  }

  private stop(): void {
    if (this.rafId !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.rafId);
    }
    this.rafId = null;
    this.lastTimestamp = getNow();
  }
}

export const unifiedFrameLoop = new UnifiedFrameLoop();
