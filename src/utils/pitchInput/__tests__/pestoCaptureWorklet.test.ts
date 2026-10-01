import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { resolve } from 'node:path';
import { isArrayBuffer } from 'node:util/types';
import type { CapturedChunk } from '@/utils/pitchInput/pitchInputTypes';

type ControlHandler = (event: { data: unknown }) => void;
interface CapturePort {
  onmessage?: ControlHandler;
  postMessage: (chunk: CapturedChunk, transfer: ArrayBuffer[]) => void;
}
interface CaptureProcessor {
  port: { onmessage: ControlHandler };
  pool: Float32Array[];
  active: Float32Array | null;
  pendingChunks: CapturedChunk[];
  inFlight: number;
  process: (inputs: Float32Array[][]) => boolean;
}

const createCapture = () => {
  const context = {
    Float32Array,
    ArrayBuffer: structuredClone(new ArrayBuffer(0)).constructor,
    sampleRate: 48_000,
    currentTime: 0,
    AudioWorkletProcessor: class { port = {}; },
    registerProcessor: () => undefined,
  };
  const source = readFileSync(resolve(process.cwd(), 'public/js/audio/pesto-capture-worklet.js'), 'utf8');
  const Processor: new () => CaptureProcessor = runInNewContext(`${source}\nPestoCaptureProcessor;`, context);
  const processor = new Processor();
  const chunks: CapturedChunk[] = [];
  let onChunk: ((chunk: CapturedChunk) => void) | undefined;
  const port: CapturePort = { postMessage: (message, transfer) => {
    // 実際のMessagePortと同様に送り手のArrayBufferをdetachする。
    const chunk = structuredClone(message, { transfer });
    chunks.push(chunk);
    onChunk?.(chunk);
  } };
  processor.port.onmessage({ data: { type: 'connectWorker', port } });
  const feed = (samples = 128) => {
    processor.process([[new Float32Array(samples).fill(0.1)]]);
    context.currentTime += samples / 48_000;
  };
  const recycle = (chunk: CapturedChunk) => {
    const buffer = chunk.samples.buffer;
    if (!isArrayBuffer(buffer)) throw new Error('unexpected buffer');
    port.onmessage?.({ data: structuredClone({ type: 'recycle', buffer }, { transfer: [buffer] }) });
  };
  return { processor, chunks, feed, context, recycle, setOnChunk: (handler: typeof onChunk) => { onChunk = handler; } };
};

describe('PESTO capture with the iOS queue limit', () => {
  it('preserves continuous PCM and all buffers when inference keeps up', () => {
    const { processor, chunks, feed, recycle } = createCapture();
    let consumed = 0;
    for (let render = 0; render < 4500; render += 1) {
      feed();
      while (consumed < chunks.length) recycle(chunks[consumed++]);
    }
    expect(chunks).toHaveLength(2400);
    for (let index = 0; index < chunks.length; index += 1) {
      expect(chunks[index].sequence).toBe(index);
      expect(chunks[index].sourceStartSample).toBe(index * 240);
    }
    expect(processor.pool.length + (processor.active ? 1 : 0)).toBe(16);
    expect(processor.inFlight).toBe(0);
    expect(processor.pendingChunks).toHaveLength(0);
  });

  it('bounds transport before the blocked Worker receives messages and discards old pending audio at 40ms', () => {
    const { processor, chunks, feed, recycle } = createCapture();
    for (let render = 0; render < 24; render += 1) {
      feed();
      expect(processor.pendingChunks.length).toBeLessThanOrEqual(8);
      expect(processor.pool.length).toBeGreaterThanOrEqual(5);
    }
    expect(chunks).toHaveLength(2);
    expect(processor.inFlight).toBe(2);
    recycle(chunks[0]);
    expect(chunks).toHaveLength(3);
    expect(chunks[2].sequence).toBe(9);
    expect(chunks[2].sourceStartSample).toBe(2160);
    expect(chunks[2].captureQueueAgeMs).toBeLessThanOrEqual(40);
    // 欠落は240サンプル単位。128量子の末尾だけが消える現象を避ける。
    expect(chunks[2].sourceStartSample - chunks[1].sourceEndSample).toBe(7 * 240);
  });

  it('keeps bounded latency under two minutes of 5.3ms inference and recovers after stalls', () => {
    const { processor, feed, context, recycle, setOnChunk, chunks } = createCapture();
    const transport: CapturedChunk[] = [];
    let clockMs = 0;
    let completed = 0;
    let active: { chunk: CapturedChunk; doneAt: number } | null = null;
    const startNext = () => {
      if (active) return;
      const chunk = transport.shift();
      if (chunk) {
        // 10秒おきに60ms止まる。取り込み側はその間も進み続ける。
        const stall = completed > 0 && completed % 1800 === 0 ? 60 : 0;
        active = { chunk, doneAt: clockMs + 5.3 + stall };
      }
    };
    const completeBefore = (deadline: number) => {
      while (active && active.doneAt <= deadline) {
        const finished = active;
        clockMs = finished.doneAt;
        active = null;
        completed += 1;
        recycle(finished.chunk);
        startNext();
      }
    };
    setOnChunk((chunk) => { transport.push(chunk); });
    for (let render = 0; render < 45000; render += 1) {
      const captureMs = context.currentTime * 1000;
      completeBefore(captureMs);
      clockMs = captureMs;
      feed();
      startNext();
      expect(processor.pendingChunks.length).toBeLessThanOrEqual(8);
      expect(processor.inFlight).toBeLessThanOrEqual(2);
      expect(processor.pool.length).toBeGreaterThanOrEqual(5);
    }
    // 最後に処理が速くなれば、古い2分間の音声を処理し続けず即追いつく。
    completeBefore(clockMs + 150);
    expect(processor.pendingChunks).toHaveLength(0);
    expect(processor.inFlight).toBe(0);
    expect(completed).toBeGreaterThan(22000);
    expect(processor.pool.length + (processor.active ? 1 : 0)).toBe(16);
    let gaps = 0;
    for (let index = 1; index < chunks.length; index += 1) {
      const gap = chunks[index].sourceStartSample - chunks[index - 1].sourceEndSample;
      if (gap > 0) gaps += 1;
      expect(gap % 240).toBe(0);
      expect(chunks[index].captureQueueAgeMs).toBeLessThanOrEqual(40);
    }
    expect(gaps).toBeGreaterThan(0);
  });

  it('recycles pending old-generation buffers and preserves the transfer limit through reset', () => {
    const { processor, feed, chunks, recycle } = createCapture();
    for (let render = 0; render < 12; render += 1) feed();
    expect(processor.pendingChunks.length).toBeGreaterThan(0);
    processor.port.onmessage({ data: { type: 'resetCapture', generationId: 2 } });
    expect(processor.pendingChunks).toHaveLength(0);
    expect(processor.inFlight).toBe(2);
    feed(240);
    expect(chunks).toHaveLength(2);
    recycle(chunks[0]);
    expect(chunks[2].generationId).toBe(2);
    expect(chunks[2].sequence).toBe(0);
    expect(chunks[2].sourceStartSample).toBe(0);
    expect(processor.inFlight).toBe(2);
    recycle(chunks[1]);
    recycle(chunks[2]);
    expect(processor.pool.length + (processor.active ? 1 : 0)).toBe(16);
  });
});
