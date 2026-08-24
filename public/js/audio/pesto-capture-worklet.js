/**
 * pesto-capture-worklet.js
 * 128 サンプル入力を 480 サンプル（48kHz / 10ms）に整形し Worker へ直接転送する。
 * process() はオーディオレンダースレッドで動くため新規割当を行わない。
 * チャンク用バッファは Worker と貸し借り（transfer + recycle）して再利用する。
 */

const TARGET_CHUNK = 480;
const TARGET_RATE = 48000;
const POOL_SIZE = 8;
const RESAMPLE_SCRATCH = 4096;

class PestoCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.workerPort = null;
    this.accumulatedLength = 0;
    this.resampleRatio = sampleRate / TARGET_RATE;
    this.resampleScratch = new Float32Array(RESAMPLE_SCRATCH);
    this.pool = [];
    for (let i = 0; i < POOL_SIZE; i += 1) {
      this.pool.push(new Float32Array(TARGET_CHUNK));
    }
    this.active = this.pool.pop();

    this.port.onmessage = (event) => {
      const data = event.data;
      if (data?.type === 'connectWorker' && data.port) {
        this.workerPort = data.port;
        this.workerPort.onmessage = (workerEvent) => {
          const buffer = workerEvent.data?.buffer;
          if (buffer instanceof ArrayBuffer && buffer.byteLength === TARGET_CHUNK * 4) {
            this.pool.push(new Float32Array(buffer));
          }
        };
      }
    };
  }

  /** 48kHz へ線形補間。リサンプル不要なら -1、必要なら resampleScratch に書いた長さを返す。 */
  resampleTo48k(input) {
    if (Math.abs(this.resampleRatio - 1) < 0.001) {
      return -1;
    }
    const outputLength = Math.min(
      Math.floor(input.length / this.resampleRatio),
      this.resampleScratch.length,
    );
    for (let i = 0; i < outputLength; i += 1) {
      const srcIndex = i * this.resampleRatio;
      const idx = Math.floor(srcIndex);
      const frac = srcIndex - idx;
      const s0 = input[idx] ?? 0;
      const s1 = input[idx + 1] ?? s0;
      this.resampleScratch[i] = s0 + (s1 - s0) * frac;
    }
    return outputLength;
  }

  sendChunk(audioContextTime) {
    const chunk = this.active;
    this.active = null;
    this.accumulatedLength = 0;
    if (!chunk) return;
    if (!this.workerPort) {
      this.pool.push(chunk);
      return;
    }
    this.workerPort.postMessage(
      { type: 'audioChunk', samples: chunk, audioContextTime },
      [chunk.buffer],
    );
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input || input.length === 0) {
      return true;
    }

    const resampledLength = this.resampleTo48k(input);
    const source = resampledLength < 0 ? input : this.resampleScratch;
    const length = resampledLength < 0 ? input.length : resampledLength;

    let offset = 0;
    while (offset < length) {
      if (!this.active) {
        this.active = this.pool.pop() ?? null;
        if (!this.active) {
          // プール枯渇（推論が追いつかない）。残りは破棄してレンダースレッドを塞がない。
          this.accumulatedLength = 0;
          return true;
        }
      }

      const toCopy = Math.min(TARGET_CHUNK - this.accumulatedLength, length - offset);
      const base = this.accumulatedLength;
      for (let i = 0; i < toCopy; i += 1) {
        this.active[base + i] = source[offset + i];
      }
      this.accumulatedLength += toCopy;
      offset += toCopy;

      if (this.accumulatedLength >= TARGET_CHUNK) {
        this.sendChunk(currentTime);
      }
    }

    return true;
  }
}

registerProcessor('pesto-capture-processor', PestoCaptureProcessor);
