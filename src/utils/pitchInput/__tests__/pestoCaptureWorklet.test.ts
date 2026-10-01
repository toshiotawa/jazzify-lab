import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { resolve } from 'node:path';
import { PitchChunkQueue } from '@/utils/pitchInput/pitchChunkQueue';
import type { CapturedChunk } from '@/utils/pitchInput/pitchInputTypes';

interface CaptureProcessor {
  workerPort: { postMessage: (chunk: CapturedChunk) => void };
  pool: Float32Array[];
  process: (inputs: Float32Array[][]) => boolean;
}

const createCapture = () => {
  const context = {
    Float32Array,
    ArrayBuffer,
    sampleRate: 48_000,
    currentTime: 0,
    AudioWorkletProcessor: class { port = {}; },
    registerProcessor: () => undefined,
  };
  const source = readFileSync(resolve(process.cwd(), 'public/js/audio/pesto-capture-worklet.js'), 'utf8');
  const Processor: new () => CaptureProcessor = runInNewContext(`${source}\nPestoCaptureProcessor;`, context);
  const processor = new Processor();
  const chunks: CapturedChunk[] = [];
  processor.workerPort = { postMessage: (chunk) => chunks.push(chunk) };
  const feed = (samples = 240) => {
    processor.process([[new Float32Array(samples).fill(0.1)]]);
    context.currentTime += samples / 48_000;
  };
  return { processor, chunks, feed, context, capacity: processor.pool.length + 1 };
};

describe('PESTO capture under backpressure', () => {
  it('preserves continuous audio across periodic 60ms recycle-delivery delays', () => {
    const { processor, chunks, feed } = createCapture();
    const queue = new PitchChunkQueue();
    queue.reset(0);
    for (let burst = 0; burst < 300; burst += 1) {
      const first = chunks.length;
      // 推論後の返却メッセージが60msまとめて遅れても原音は保持する。
      for (let i = 0; i < 12; i += 1) feed();
      expect(chunks.length - first).toBe(12);
      for (let i = first; i < chunks.length; i += 1) {
        expect(queue.enqueue(chunks[i]).ok).toBe(true);
        const consumed = queue.dequeue();
        if (!consumed) throw new Error('missing chunk');
        processor.pool.push(consumed.samples);
      }
    }
  });

  it('keeps elapsed audio time and exposes a sequence gap after pool exhaustion', () => {
    const { processor, chunks, feed, context, capacity } = createCapture();
    const queue = new PitchChunkQueue();
    queue.reset(0);
    for (let i = 0; i < capacity; i += 1) {
      feed();
      expect(queue.enqueue(chunks[i]).ok).toBe(true);
      queue.dequeue();
    }
    for (let i = 0; i < 10; i += 1) feed();
    expect(chunks).toHaveLength(capacity);
    processor.pool.push(new Float32Array(240));
    feed();
    const resumed = chunks[capacity];
    expect(resumed.sourceStartSample).toBe((capacity + 10) * 240);
    expect(resumed.sourceEndTimeSec).toBeCloseTo(context.currentTime, 10);
    expect(queue.enqueue(resumed)).toEqual({ ok: false, reason: 'sequenceGap' });
    queue.reset(0, resumed.sequence);
    expect(queue.enqueue(resumed).ok).toBe(true);
  });

  it('accounts for dropped tails inside a 128-sample render quantum', () => {
    const { processor, chunks, feed, context } = createCapture();
    for (let i = 0; i < 50; i += 1) feed(128);
    expect(chunks).toHaveLength(24);
    processor.pool.push(new Float32Array(240));
    feed(128);
    feed(128);
    expect(chunks[24].sourceStartSample).toBe(6400);
    expect(chunks[24].sourceEndTimeSec).toBeCloseTo((6656 - 16) / 48_000, 10);
    expect(chunks[24].sourceEndTimeSec).toBeLessThan(context.currentTime);
  });
});
