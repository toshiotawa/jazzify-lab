import type { JudgmentResult } from '@/types';

export type EffectEventType = 'hit' | 'miss';

export interface EffectEvent {
  noteId: string;
  type: EffectEventType;
}

export class EffectManager {
  private queue: EffectEvent[] = [];

  enqueue(event: EffectEvent): void {
    this.queue.push(event);
  }

  drain(handler: (event: EffectEvent) => void): void {
    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (event) {
        handler(event);
      }
    }
  }

  fromJudgment(judgment: JudgmentResult): void {
    this.enqueue({
      noteId: judgment.noteId,
      type: judgment.type === 'good' ? 'hit' : 'miss'
    });
  }
}
