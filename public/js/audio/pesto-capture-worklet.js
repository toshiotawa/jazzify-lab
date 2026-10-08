/**
 * pesto-capture-worklet.js
 * 状態保持リサンプル + 連番/サンプル位置付き 240 サンプルチャンクを Worker へ転送。
 */

const TARGET_CHUNK = 240;
const TARGET_RATE = 48000;
// iOS同様、取り込み側で原音40msに制限する。Workerの同期WASM推論中も
// MessagePortへ無制限に積まない。2転送の窓で返却配送の待ちを吸収する。
const POOL_SIZE = 16;
const QUEUE_LIMIT_SAMPLES = TARGET_RATE * 0.04;
const MAX_IN_FLIGHT = 2;
const RESAMPLE_SCRATCH = 4096;
// このモデルのcacheは直前3976個のPCMそのもの。欠落時だけ実音声で復元する。
// 40msの待機分も含めて参照できる固定長リングと、転送窓分の復元用プール。
const CACHE_SIZE = 3976;
const HISTORY_SIZE = 8192;

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
  constructor(options) {
    super();
    this.inputChannel = options?.processorOptions?.inputChannel === 1 ? 1 : 0;
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
    this.pendingChunks = [];
    this.inFlight = 0;
    this.history = new Float32Array(HISTORY_SIZE);
    this.historyWriteIndex = 0;
    this.historyPool = [];
    this.lastSentSourceEndSample = 0;
    for (let i = 0; i < MAX_IN_FLIGHT; i += 1) {
      this.historyPool.push(new Float32Array(CACHE_SIZE));
    }
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
            this.inFlight = Math.max(0, this.inFlight - 1);
            this.sendPendingChunks();
          }
          if (payload?.type === 'recycleHistory' && payload.buffer instanceof ArrayBuffer
              && payload.buffer.byteLength === CACHE_SIZE * 4) {
            this.historyPool.push(new Float32Array(payload.buffer));
            this.sendPendingChunks();
          }
          if (payload?.type === 'resetCapture' && typeof payload.generationId === 'number') {
            this.resetCapture(payload.generationId);
          }
        };
      }
      if (data?.type === 'resetCapture' && typeof data.generationId === 'number') {
        this.resetCapture(data.generationId);
      }
    };
  }

  clearPendingChunks() {
    for (const chunk of this.pendingChunks) this.pool.push(chunk.samples);
    this.pendingChunks.length = 0;
  }

  resetCapture(generationId) {
    this.clearPendingChunks();
    this.generationId = generationId;
    this.sequence = 0;
    this.totalSourceSamples = 0;
    this.streamStartTimeSec = null;
    this.resamplePhase = 0;
    this.accumulatedLength = 0;
    this.historyWriteIndex = 0;
    this.lastSentSourceEndSample = 0;
    // 旧世代の転送も返却されるまで数える。世代切替で転送窓を増やさない。
  }

  sendPendingChunks() {
    while (this.workerPort && this.inFlight < MAX_IN_FLIGHT && this.pendingChunks.length > 0) {
      const next = this.pendingChunks[0];
      const hasGap = next.sourceStartSample !== this.lastSentSourceEndSample;
      // 復元用バッファも返却まで再利用しない。取り込み側の待機上限は維持する。
      if (hasGap && this.historyPool.length === 0) return;
      const chunk = this.pendingChunks.shift();
      chunk.captureQueueAgeMs = (this.totalSourceSamples - chunk.sourceEndSample) / TARGET_RATE * 1000;
      this.inFlight += 1;
      this.lastSentSourceEndSample = chunk.sourceEndSample;
      if (hasGap) {
        const history = this.historyPool.pop();
        const start = chunk.sourceStartSample - CACHE_SIZE;
        for (let i = 0; i < CACHE_SIZE; i += 1) {
          const sample = start + i;
          history[i] = sample < 0 ? 0 : this.history[sample & (HISTORY_SIZE - 1)];
        }
        chunk.recoveryCache = history;
        this.workerPort.postMessage(chunk, [chunk.samples.buffer, history.buffer]);
      } else {
        this.workerPort.postMessage(chunk, [chunk.samples.buffer]);
      }
    }
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

    // iOSのenqueueCaptureChunkと同じく、上限超過時は古い待機音声を全て回収する。
    // 転送窓のうち実行中の1個以外も待機音声として40ms枠に含める。
    const oldest = this.pendingChunks[0];
    const pendingLimitSamples = QUEUE_LIMIT_SAMPLES - Math.max(0, this.inFlight - 1) * TARGET_CHUNK;
    if (oldest && sourceEndSample - oldest.sourceStartSample > pendingLimitSamples) {
      this.clearPendingChunks();
    }
    this.pendingChunks.push(
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
    );
    this.sequence += 1;
    this.sendPendingChunks();
  }

  process(inputs) {
    const input = inputs[0]?.[this.inputChannel];
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
          // 欠落した原音時間を維持し、次チャンクの連番で Worker に不連続を伝える。
          for (let i = offset; i < length; i += 1) {
            this.history[this.historyWriteIndex] = source[i];
            this.historyWriteIndex = (this.historyWriteIndex + 1) & (HISTORY_SIZE - 1);
          }
          this.totalSourceSamples += length - offset;
          this.sequence += 1;
          this.accumulatedLength = 0;
          return true;
        }
      }

      const toCopy = Math.min(TARGET_CHUNK - this.accumulatedLength, length - offset);
      const base = this.accumulatedLength;
      for (let i = 0; i < toCopy; i += 1) {
        this.active[base + i] = source[offset + i];
        this.history[this.historyWriteIndex] = source[offset + i];
        this.historyWriteIndex = (this.historyWriteIndex + 1) & (HISTORY_SIZE - 1);
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
