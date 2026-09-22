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

  it('rejects generation mismatch', () => {
    const queue = new PitchChunkQueue();
    queue.reset(1, 0);
    expect(queue.enqueue(makeChunk(0, 0, 240, 2)).ok).toBe(false);
  });
});
