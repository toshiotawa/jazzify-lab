import {
  PESTO_QUEUE_LIMIT_MS,
  PESTO_TARGET_SAMPLE_RATE,
  type CapturedChunk,
} from '@/utils/pitchInput/pitchInputTypes';

export type EnqueueResult =
  | { ok: true }
  | { ok: false; reason: 'sequenceGap' | 'queueOverflow' | 'generationMismatch' };

export class PitchChunkQueue {
  private queue: CapturedChunk[] = [];
  private expectedSequence = 0;
  private activeGenerationId = 0;

  reset(generationId: number, nextSequence = 0): void {
    this.queue = [];
    this.expectedSequence = nextSequence;
    this.activeGenerationId = generationId;
  }

  enqueue(chunk: CapturedChunk): EnqueueResult {
    if (chunk.generationId !== this.activeGenerationId) {
      return { ok: false, reason: 'generationMismatch' };
    }
    if (chunk.sequence !== this.expectedSequence) {
      return { ok: false, reason: 'sequenceGap' };
    }
    this.expectedSequence += 1;

    if (this.queue.length > 0) {
      const oldest = this.queue[0];
      const depthMs =
        ((chunk.sourceEndSample - oldest.sourceStartSample) / PESTO_TARGET_SAMPLE_RATE) * 1000;
      if (depthMs > PESTO_QUEUE_LIMIT_MS) {
        return { ok: false, reason: 'queueOverflow' };
      }
    }

    this.queue.push(chunk);
    return { ok: true };
  }

  dequeue(): CapturedChunk | null {
    return this.queue.shift() ?? null;
  }

  peekOldest(): CapturedChunk | null {
    return this.queue[0] ?? null;
  }

  depthMs(): number {
    if (this.queue.length < 2) return 0;
    const oldest = this.queue[0];
    const newest = this.queue[this.queue.length - 1];
    if (!oldest || !newest) return 0;
    return ((newest.sourceEndSample - oldest.sourceStartSample) / PESTO_TARGET_SAMPLE_RATE) * 1000;
  }

  size(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
  }
}
