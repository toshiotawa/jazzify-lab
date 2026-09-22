/**
 * pesto-capture-worklet.js
 * 状態保持リサンプル + 連番/サンプル位置付き 240 サンプルチャンクを Worker へ転送。
 */

const TARGET_CHUNK = 240;
const TARGET_RATE = 48000;
const POOL_SIZE = 8;
const RESAMPLE_SCRATCH = 4096;

const computeChunkMetrics = (samples) => {
  let sumSq = 0;
  let peak = 0;
  let clipCount = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const v = samples[i];
    sumSq += v * v;
    const abs = Math.abs(v);
    if (abs > peak) peak = abs;
    if (abs >= 0.999) clipCount += 1;
  }
  const rms = Math.sqrt(sumSq / Math.max(1, samples.length));
  const rmsDbfs = 20 * Math.log10(Math.max(rms, 1e-12));
  return { rmsDbfs, peak, clipCount };
};

class PestoCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.workerPort = null;
    this.generationId = 0;
    this.sequence = 0;
    this.totalSourceSamples = 0;
    this.streamStartTimeSec = null;
    this.resampleRatio = sampleRate / TARGET_RATE;
    this.resamplePhase = 0;
    this.accumulatedLength = 0;
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
          const payload = workerEvent.data;
          if (payload?.type === 'recycle' && payload.buffer instanceof ArrayBuffer
              && payload.buffer.byteLength === TARGET_CHUNK * 4) {
            this.pool.push(new Float32Array(payload.buffer));
          }
          if (payload?.type === 'resetCapture' && typeof payload.generationId === 'number') {
            this.generationId = payload.generationId;
            this.sequence = 0;
            this.totalSourceSamples = 0;
            this.streamStartTimeSec = null;
            this.resamplePhase = 0;
            this.accumulatedLength = 0;
          }
        };
      }
      if (data?.type === 'resetCapture' && typeof data.generationId === 'number') {
        this.generationId = data.generationId;
        this.sequence = 0;
        this.totalSourceSamples = 0;
        this.streamStartTimeSec = null;
        this.resamplePhase = 0;
        this.accumulatedLength = 0;
      }
    };
  }

  resampleTo48k(input) {
    if (Math.abs(this.resampleRatio - 1) < 0.001) {
      return { source: input, length: input.length };
    }

    let outLen = 0;
    let phase = this.resamplePhase;
    while (phase < input.length && outLen < this.resampleScratch.length) {
      const idx = Math.floor(phase);
      const frac = phase - idx;
      const s0 = input[idx] ?? 0;
      const s1 = input[idx + 1] ?? s0;
      this.resampleScratch[outLen] = s0 + (s1 - s0) * frac;
      outLen += 1;
      phase += this.resampleRatio;
    }
    this.resamplePhase = phase - input.length;
    return { source: this.resampleScratch, length: outLen };
  }

  sendChunk() {
    const chunk = this.active;
    this.active = null;
    this.accumulatedLength = 0;
    if (!chunk || !this.workerPort) {
      if (chunk) this.pool.push(chunk);
      return;
    }

    const sourceEndSample = this.totalSourceSamples;
    const sourceStartSample = sourceEndSample - TARGET_CHUNK;
    const sourceEndTimeSec = this.streamStartTimeSec + sourceEndSample / TARGET_RATE;
    const metrics = computeChunkMetrics(chunk);

    this.workerPort.postMessage(
      {
        type: 'audioChunk',
        generationId: this.generationId,
        sequence: this.sequence,
        sourceStartSample,
        sourceEndSample,
        sourceEndTimeSec,
        samples: chunk,
        rawRmsDbfs: metrics.rmsDbfs,
        rawPeak: metrics.peak,
        clipCount: metrics.clipCount,
      },
      [chunk.buffer],
    );
    this.sequence += 1;
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input || input.length === 0) {
      return true;
    }

    if (this.streamStartTimeSec === null) {
      this.streamStartTimeSec = currentTime;
    }

    const resampled = this.resampleTo48k(input);
    const source = resampled.source;
    const length = resampled.length;

    let offset = 0;
    while (offset < length) {
      if (!this.active) {
        this.active = this.pool.pop() ?? null;
        if (!this.active) {
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
      this.totalSourceSamples += toCopy;

      if (this.accumulatedLength >= TARGET_CHUNK) {
        this.sendChunk();
      }
    }

    return true;
  }
}

registerProcessor('pesto-capture-processor', PestoCaptureProcessor);
