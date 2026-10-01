import { PitchChunkQueue } from '@/utils/pitchInput/pitchChunkQueue';
import type { CapturedChunk } from '@/utils/pitchInput/pitchInputTypes';

const makeChunk = (
  sequence: number,
  start: number,
  end: number,
  generationId = 1,
): CapturedChunk => ({
  generationId,
  sequence,
  sourceStartSample: start,
  sourceEndSample: end,
  sourceEndTimeSec: end / 48_000,
  samples: new Float32Array(240),
  rawRmsDbfs: -30,
  rawPeak: 0.1,
  clipCount: 0,
});

describe('PitchChunkQueue', () => {
  it('accepts sequential chunks', () => {
    const queue = new PitchChunkQueue();
    queue.reset(1, 0);
    expect(queue.enqueue(makeChunk(0, 0, 240)).ok).toBe(true);
    expect(queue.enqueue(makeChunk(1, 240, 480)).ok).toBe(true);
    expect(queue.dequeue()?.sequence).toBe(0);
  });

  it('can resume after a gap while keeping earlier valid chunks queued', () => {
    const queue = new PitchChunkQueue();
    queue.reset(1);
    const first = makeChunk(0, 0, 240);
    const next = makeChunk(2, 368, 608);
    expect(queue.enqueue(first).ok).toBe(true);
    expect(queue.enqueue(next)).toEqual({ ok: false, reason: 'sequenceGap' });
    expect(queue.enqueue(next, true).ok).toBe(true);
    expect(queue.enqueue(makeChunk(3, 608, 848)).ok).toBe(true);
    expect(queue.dequeue()).toBe(first);
    expect(queue.dequeue()).toBe(next);
  });

  it('still enforces generation and 40ms limits when resuming after a gap', () => {
    const queue = new PitchChunkQueue();
    queue.reset(1);
    expect(queue.enqueue(makeChunk(0, 0, 240)).ok).toBe(true);
    expect(queue.enqueue(makeChunk(3, 720, 960, 2), true)).toEqual({ ok: false, reason: 'generationMismatch' });
    expect(queue.enqueue(makeChunk(10, 2400, 2640), true)).toEqual({ ok: false, reason: 'queueOverflow' });
    expect(queue.size()).toBe(1);
  });

  it('rejects sequence gaps', () => {
    const queue = new PitchChunkQueue();
    queue.reset(1, 0);
    expect(queue.enqueue(makeChunk(0, 0, 240)).ok).toBe(true);
    expect(queue.enqueue(makeChunk(2, 480, 720)).ok).toBe(false);
  });

  it('rejects queue overflow beyond 40ms source time', () => {
    const queue = new PitchChunkQueue();
    queue.reset(1, 0);
    for (let i = 0; i < 9; i += 1) {
      const start = i * 240;
      const result = queue.enqueue(makeChunk(i, start, start + 240));
      if (i < 8) {
        expect(result.ok).toBe(true);
      } else {
        expect(result.ok).toBe(false);
      }
    }
  });

  it('rejects missing source samples even when the sequence is continuous', () => {
    const queue = new PitchChunkQueue();
    queue.reset(1);
    expect(queue.enqueue(makeChunk(0, 0, 240)).ok).toBe(true);
    queue.dequeue();
    expect(queue.enqueue(makeChunk(1, 368, 608))).toEqual({ ok: false, reason: 'sampleGap' });
    queue.reset(1, 1);
    expect(queue.enqueue(makeChunk(1, 368, 608)).ok).toBe(true);
  });

  it('rejects generation mismatch', () => {
    const queue = new PitchChunkQueue();
    queue.reset(1, 0);
    expect(queue.enqueue(makeChunk(0, 0, 240, 2)).ok).toBe(false);
  });
});
