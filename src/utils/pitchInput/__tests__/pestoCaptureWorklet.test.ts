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
  return { processor, chunks, feed, context };
};

describe('PESTO capture under backpressure', () => {
  it('keeps elapsed audio time and exposes a sequence gap after pool exhaustion', () => {
    const { processor, chunks, feed, context } = createCapture();
    const queue = new PitchChunkQueue();
    queue.reset(0);
    for (let i = 0; i < 8; i += 1) {
      feed();
      expect(queue.enqueue(chunks[i]).ok).toBe(true);
      queue.dequeue();
    }
    for (let i = 0; i < 10; i += 1) feed();
    expect(chunks).toHaveLength(8);
    processor.pool.push(new Float32Array(240));
    feed();
    const resumed = chunks[8];
    expect(resumed.sourceStartSample).toBe(4320);
    expect(resumed.sourceEndTimeSec).toBeCloseTo(context.currentTime, 10);
    expect(queue.enqueue(resumed)).toEqual({ ok: false, reason: 'sequenceGap' });
    queue.reset(0, resumed.sequence);
    expect(queue.enqueue(resumed).ok).toBe(true);
  });

  it('accounts for dropped tails inside a 128-sample render quantum', () => {
    const { processor, chunks, feed, context } = createCapture();
    for (let i = 0; i < 20; i += 1) feed(128);
    expect(chunks).toHaveLength(8);
    processor.pool.push(new Float32Array(240));
    feed(128);
    feed(128);
    expect(chunks[8].sourceStartSample).toBe(2560);
    expect(chunks[8].sourceEndTimeSec).toBeCloseTo((2816 - 16) / 48_000, 10);
    expect(chunks[8].sourceEndTimeSec).toBeLessThan(context.currentTime);
  });
});
