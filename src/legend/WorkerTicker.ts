import type { FrameTicker } from '@/utils/gameEngine';

export class WorkerTicker implements FrameTicker {
  private readonly listeners = new Set<(delta: number) => void>();

  add(callback: (delta: number) => void): void {
    this.listeners.add(callback);
  }

  remove(callback: (delta: number) => void): void {
    this.listeners.delete(callback);
  }

  tick(delta: number = 1): void {
    for (const listener of this.listeners) {
      listener(delta);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
