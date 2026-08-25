/**
 * pestoPitchWorker.ts - PESTO ONNX 推論 + オンセット検出 Worker
 */

import * as ort from 'onnxruntime-web';
import {
  PitchOnsetTracker,
  scaleOnsetConfigForSensitivity,
  type PitchOnsetTrackerConfig,
} from '@/utils/pitchInput/pitchOnsetTracker';

const MODEL_URL = '/models/pesto/pesto-mir1k-g7-48000-480.onnx';
const CHUNK_SIZE = 480;

ort.env.wasm.numThreads = 1;
ort.env.wasm.simd = true;
ort.env.wasm.wasmPaths = '/ort/';

interface WorkerInitMessage {
  type: 'init';
  sensitivity: number;
  config?: Partial<PitchOnsetTrackerConfig>;
}

interface WorkerAudioMessage {
  type: 'audioChunk';
  samples: Float32Array;
  audioContextTime: number;
}

interface WorkerControlMessage {
  type: 'setSensitivity';
  sensitivity: number;
}

interface WorkerConnectPortMessage {
  type: 'connectPort';
}

type WorkerInbound = WorkerInitMessage | WorkerControlMessage | WorkerConnectPortMessage;

interface NoteEventMessage {
  type: 'noteOn' | 'noteOff';
  note: number;
  audioContextTime: number;
}

interface WorkerReadyMessage {
  type: 'ready';
}

interface WorkerErrorMessage {
  type: 'error';
  message: string;
}

interface WorkerMonitorMessage {
  type: 'monitor';
  captureIntervalMs: number;
  inferenceMs: number;
}

type WorkerOutbound =
  | NoteEventMessage
  | WorkerReadyMessage
  | WorkerErrorMessage
  | WorkerMonitorMessage;

let session: ort.InferenceSession | null = null;
let cacheTensor: ort.Tensor | null = null;
let audioTensor: ort.Tensor | null = null;
let cacheData: Float32Array | null = null;
let audioData: Float32Array | null = null;
let tracker: PitchOnsetTracker | null = null;
let frameIndex = 0;
let audioPort: MessagePort | null = null;
let isInferring = false;
let lastChunkTime = 0;
let emaCaptureIntervalMs = 0;
let emaInferenceMs = 0;
let monitorFrameCounter = 0;

const LATENCY_EMA_ALPHA = 0.1;
const MONITOR_POST_INTERVAL = 30;

const post = (message: WorkerOutbound): void => {
  self.postMessage(message);
};

const CACHE_SIZE = 3856;

/** Worklet から transfer されたバッファを返却して割当を発生させない。 */
const recycle = (samples: Float32Array): void => {
  const port = audioPort;
  const buffer = samples.buffer;
  if (!port || !(buffer instanceof ArrayBuffer) || buffer.byteLength === 0) return;
  port.postMessage({ type: 'recycle', buffer }, [buffer]);
};

const updateEma = (current: number, sample: number): number =>
  current <= 0 ? sample : current * (1 - LATENCY_EMA_ALPHA) + sample * LATENCY_EMA_ALPHA;

const recordCaptureInterval = (): void => {
  const now = performance.now();
  if (lastChunkTime > 0) {
    emaCaptureIntervalMs = updateEma(emaCaptureIntervalMs, now - lastChunkTime);
  }
  lastChunkTime = now;
};

const maybePostMonitor = (): void => {
  monitorFrameCounter += 1;
  if (monitorFrameCounter < MONITOR_POST_INTERVAL) return;
  monitorFrameCounter = 0;
  if (emaCaptureIntervalMs <= 0 && emaInferenceMs <= 0) return;
  post({
    type: 'monitor',
    captureIntervalMs: emaCaptureIntervalMs,
    inferenceMs: emaInferenceMs,
  });
};

const resetLatencyStats = (): void => {
  lastChunkTime = 0;
  emaCaptureIntervalMs = 0;
  emaInferenceMs = 0;
  monitorFrameCounter = 0;
};

const initSession = async (): Promise<void> => {
  session = await ort.InferenceSession.create(MODEL_URL, {
    executionProviders: ['wasm'],
  });

  cacheData = new Float32Array(CACHE_SIZE);
  cacheTensor = new ort.Tensor('float32', cacheData, [1, CACHE_SIZE]);
  audioData = new Float32Array(CHUNK_SIZE);
  audioTensor = new ort.Tensor('float32', audioData, [1, CHUNK_SIZE]);
};

const processChunk = async (
  samples: Float32Array,
  audioContextTime: number,
): Promise<void> => {
  // cacheTensor は逐次更新される再帰状態なので同時実行させない。
  // 推論が 10ms に間に合わないときはフレームを捨てて遅延の蓄積を防ぐ。
  if (
    isInferring ||
    !session ||
    !cacheTensor ||
    !audioTensor ||
    !cacheData ||
    !audioData ||
    !tracker
  ) {
    recycle(samples);
    return;
  }

  isInferring = true;
  const inferenceStart = performance.now();
  try {
    audioData.set(samples);

    const outputs = await session.run({
      audio: audioTensor,
      cache: cacheTensor,
    });

    emaInferenceMs = updateEma(emaInferenceMs, performance.now() - inferenceStart);

    const predictionArr = outputs.prediction.data as Float32Array;
    const confidenceArr = outputs.confidence.data as Float32Array;
    const volumeArr = outputs.volume.data as Float32Array;
    const cacheOut = outputs.cache_out.data as Float32Array;
    cacheData.set(cacheOut);

    const frame = {
      prediction: predictionArr[0] ?? 0,
      confidence: confidenceArr[0] ?? 0,
      volume: volumeArr[0] ?? 0,
    };

    const events = tracker.processFrame(frame, frameIndex);
    frameIndex += 1;
    maybePostMonitor();

    for (const event of events) {
      if (event.type === 'noteOn') {
        post({ type: 'noteOn', note: event.note, audioContextTime });
      } else {
        post({ type: 'noteOff', note: event.note, audioContextTime });
      }
    }
  } finally {
    isInferring = false;
    recycle(samples);
  }
};

self.onmessage = async (event: MessageEvent<WorkerInbound>) => {
  const data = event.data;
  try {
    if (data.type === 'connectPort') {
      const port = event.ports[0];
      if (!port) return;
      audioPort = port;
      audioPort.onmessage = (portEvent: MessageEvent<WorkerAudioMessage>) => {
        if (portEvent.data?.type === 'audioChunk') {
          recordCaptureInterval();
          void processChunk(portEvent.data.samples, portEvent.data.audioContextTime);
        }
      };
      return;
    }

    if (data.type === 'init') {
      if (!session) {
        await initSession();
      }
      const config = scaleOnsetConfigForSensitivity(data.sensitivity);
      tracker = new PitchOnsetTracker({ ...config, ...data.config });
      frameIndex = 0;
      isInferring = false;
      resetLatencyStats();
      // 再接続時に前セッションの再帰状態を持ち越さない
      cacheData?.fill(0);
      post({ type: 'ready' });
      return;
    }

    if (data.type === 'setSensitivity') {
      if (tracker) {
        tracker.setConfig(scaleOnsetConfigForSensitivity(data.sensitivity));
      }
      return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    post({ type: 'error', message });
  }
};

export {};
