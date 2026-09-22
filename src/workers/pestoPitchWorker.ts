/**
 * pestoPitchWorker.ts - PESTO ONNX 推論 + オンセット検出 Worker
 */

import * as ort from 'onnxruntime-web';
import { PitchDecimationBuffer } from '@/utils/pitchInput/pitchDecimationBuffer';
import { PitchChunkQueue } from '@/utils/pitchInput/pitchChunkQueue';
import { PitchInputDiagnostics } from '@/utils/pitchInput/pitchInputDiagnostics';
import {
  createPestoDecimatorState,
  feedPestoDecimator,
  resetPestoDecimator,
} from '@/utils/pitchInput/pestoDecimator';
import {
  PitchOnsetTracker,
  scaleOnsetConfigForSensitivity,
  type PitchOnsetTrackerConfig,
} from '@/utils/pitchInput/pitchOnsetTracker';
import { restoreConcertMidi } from '@/utils/pitchInput/pitchShiftRestore';
import {
  PESTO_BASE_FRAME_SEC,
  PESTO_CHUNK_SIZE,
  PESTO_MODEL_ID,
  PESTO_WARMUP_FRAMES,
  decimationFactorForShift,
  frameDurationMsForShift,
  type CapturedChunk,
  type PestoShiftSemitones,
  type TrackerRejectReason,
} from '@/utils/pitchInput/pitchInputTypes';

const MODEL_URL = `/models/pesto/${PESTO_MODEL_ID}.onnx`;

ort.env.wasm.numThreads = 1;
ort.env.wasm.simd = true;
ort.env.wasm.wasmPaths = '/ort/';

interface WorkerInitMessage {
  type: 'init';
  sensitivity: number;
  generationId: number;
  shiftSemitones: PestoShiftSemitones;
  config?: Partial<PitchOnsetTrackerConfig>;
  expectedPitchMask?: number;
  diagnostics?: {
    deviceLabel: string | null;
    sampleRate: number | null;
    requestedEchoCancellation: boolean;
    actualEchoCancellation: boolean | null;
  };
}

interface WorkerAudioMessage {
  type: 'audioChunk';
  generationId: number;
  sequence: number;
  sourceStartSample: number;
  sourceEndSample: number;
  sourceEndTimeSec: number;
  samples: Float32Array;
  rawRmsDbfs: number;
  rawPeak: number;
  clipCount: number;
}

interface WorkerControlMessage {
  type: 'setSensitivity';
  sensitivity: number;
}

interface WorkerSetOnsetConfigMessage {
  type: 'setOnsetConfig';
  config: Partial<PitchOnsetTrackerConfig>;
}

interface WorkerSetExpectedPitchMaskMessage {
  type: 'setExpectedPitchMask';
  mask: number;
}

interface WorkerSetShiftMessage {
  type: 'setShiftSemitones';
  shiftSemitones: PestoShiftSemitones;
  generationId: number;
}

interface WorkerConnectPortMessage {
  type: 'connectPort';
}

type WorkerInbound =
  | WorkerInitMessage
  | WorkerControlMessage
  | WorkerSetOnsetConfigMessage
  | WorkerSetExpectedPitchMaskMessage
  | WorkerSetShiftMessage
  | WorkerConnectPortMessage;

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
  diagnostics?: ReturnType<PitchInputDiagnostics['snapshot']>;
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
let sensitivityLevel = 5;
let pitchStableFramesOverride = 4;
let fastResponseEnabled = false;
let expectedPitchMask = 0;
let generationId = 0;
let shiftSemitones: PestoShiftSemitones = 0;
let frameDurationSec = PESTO_BASE_FRAME_SEC;
let warmupFramesRemaining = 0;
let suppressTracker = false;
let cacheEpoch = 0;

const chunkQueue = new PitchChunkQueue();
const decimationBuffer = new PitchDecimationBuffer(1);
let decimatorState = createPestoDecimatorState(1);
let diagnostics: PitchInputDiagnostics | null = null;

const LATENCY_EMA_ALPHA = 0.1;
const MONITOR_POST_INTERVAL = 60;
const CACHE_SIZE = 3976;

const post = (message: WorkerOutbound): void => {
  self.postMessage(message);
};

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
  if (emaCaptureIntervalMs <= 0 && emaInferenceMs <= 0 && !diagnostics) return;
  post({
    type: 'monitor',
    captureIntervalMs: emaCaptureIntervalMs,
    inferenceMs: emaInferenceMs,
    diagnostics: diagnostics?.snapshot(chunkQueue.depthMs()),
  });
};

const resetLatencyStats = (): void => {
  lastChunkTime = 0;
  emaCaptureIntervalMs = 0;
  emaInferenceMs = 0;
  monitorFrameCounter = 0;
};

const applyShiftMode = (shift: PestoShiftSemitones): void => {
  shiftSemitones = shift;
  const factor = decimationFactorForShift(shift);
  decimationBuffer.reset();
  decimatorState = createPestoDecimatorState(factor);
  frameDurationSec = frameDurationMsForShift(shift) / 1000;
  applyTrackerConfig();
};

const buildTrackerConfig = (): PitchOnsetTrackerConfig => {
  const base = scaleOnsetConfigForSensitivity(sensitivityLevel);
  const factor = decimationFactorForShift(shiftSemitones);
  return {
    ...base,
    pitchStableFrames: pitchStableFramesOverride,
    fastResponse: fastResponseEnabled,
    frameDurationMs: frameDurationMsForShift(shiftSemitones),
    allowImmediateFirstFrame: factor <= 1,
  };
};

const applyTrackerConfig = (): void => {
  tracker?.setConfig(buildTrackerConfig());
};

const resetInferenceState = (): void => {
  cacheEpoch += 1;
  cacheData?.fill(0);
  frameIndex = 0;
  warmupFramesRemaining = PESTO_WARMUP_FRAMES;
  suppressTracker = warmupFramesRemaining > 0;
  diagnostics?.setWarmupFrames(warmupFramesRemaining);
  decimationBuffer.reset();
  resetPestoDecimator(decimatorState);
};

const flushActiveNote = (audioContextTime: number): void => {
  if (!tracker) return;
  const events = tracker.flushActiveNote(frameIndex);
  for (const event of events) {
    if (event.type === 'noteOff') {
      post({ type: 'noteOff', note: event.note, audioContextTime });
    }
  }
};

const handleDiscontinuity = (chunk: CapturedChunk, reason: string): void => {
  diagnostics?.recordDiscontinuity();
  diagnostics?.recordDrop(chunk.sourceEndSample - chunk.sourceStartSample);
  flushActiveNote(chunk.sourceEndTimeSec);
  tracker?.reset();
  resetInferenceState();
  chunkQueue.reset(generationId, chunk.sequence);
  const enqueued = chunkQueue.enqueue(chunk);
  if (!enqueued.ok) {
    recycle(chunk.samples);
    return;
  }
  void drainQueue(reason);
};

const initSession = async (): Promise<void> => {
  session = await ort.InferenceSession.create(MODEL_URL, {
    executionProviders: ['wasm'],
  });

  cacheData = new Float32Array(CACHE_SIZE);
  cacheTensor = new ort.Tensor('float32', cacheData, [1, CACHE_SIZE]);
  audioData = new Float32Array(PESTO_CHUNK_SIZE);
  audioTensor = new ort.Tensor('float32', audioData, [1, PESTO_CHUNK_SIZE]);
};

const resolveRejectReason = (
  modelMidi: number | null,
  concertMidi: number | null,
  confidence: number,
  volume: number,
  config: PitchOnsetTrackerConfig,
): TrackerRejectReason => {
  if (suppressTracker) return 'warmup';
  const levelDb = 10 * Math.log10(Math.max(volume, 1e-12));
  if (levelDb <= config.onsetLevelDb) return 'volume';
  if (confidence < config.minConfidence) return 'confidence';
  if (modelMidi === null || concertMidi === null) return 'invalidPitch';
  return 'voiced';
};

const emitTrackerEvents = (
  frame: { prediction: number; confidence: number; volume: number },
  chunk: CapturedChunk,
  inferenceMs: number,
  queueAgeMs: number,
  modelMidi: number,
  concertMidi: number | null,
): void => {
  if (!tracker) return;

  const config = buildTrackerConfig();
  const rejectReason = resolveRejectReason(
    modelMidi,
    concertMidi,
    frame.confidence,
    frame.volume,
    config,
  );

  diagnostics?.recordObservation({
    generationId: chunk.generationId,
    sourceStartSample: chunk.sourceStartSample,
    sourceEndSample: chunk.sourceEndSample,
    sourceEndTimeSec: chunk.sourceEndTimeSec,
    shiftSemitones,
    modelMidi,
    concertMidi,
    confidence: frame.confidence,
    modelVolume: frame.volume,
    rawRmsDbfs: chunk.rawRmsDbfs,
    inferenceMs,
    queueAgeMs,
    discontinuity: false,
    rejectReason,
  });

  if (suppressTracker) {
    if (warmupFramesRemaining > 0) {
      warmupFramesRemaining -= 1;
      diagnostics?.tickWarmup();
      if (warmupFramesRemaining <= 0) {
        suppressTracker = false;
      }
    }
    frameIndex += 1;
    maybePostMonitor();
    return;
  }

  const trackerFrame = concertMidi !== null
    ? { prediction: concertMidi, confidence: frame.confidence, volume: frame.volume }
    : frame;

  const events = tracker.processFrame(trackerFrame, frameIndex);
  frameIndex += 1;
  maybePostMonitor();

  for (const event of events) {
    if (event.type === 'noteOn') {
      const backdatedFrames = event.frameIndex - event.onsetFrameIndex;
      const onsetAudioContextTime = chunk.sourceEndTimeSec - backdatedFrames * frameDurationSec;
      post({ type: 'noteOn', note: event.note, audioContextTime: onsetAudioContextTime });
    } else {
      post({ type: 'noteOff', note: event.note, audioContextTime: chunk.sourceEndTimeSec });
    }
  }
};

const runInference = async (chunk: CapturedChunk): Promise<void> => {
  if (!session || !cacheTensor || !audioTensor || !cacheData || !audioData || !tracker) {
    recycle(chunk.samples);
    return;
  }

  const queueAgeMs = performance.now() - lastChunkTime;
  const accumulated = decimationBuffer.push(chunk.samples);
  if (!accumulated) {
    recycle(chunk.samples);
    return;
  }

  const preprocessStart = performance.now();
  const modelInput = feedPestoDecimator(accumulated, decimatorState);
  if (!modelInput) {
    recycle(chunk.samples);
    return;
  }
  const preprocessMs = performance.now() - preprocessStart;

  const inferenceStart = performance.now();
  const epochAtStart = cacheEpoch;
  const generationAtStart = generationId;
  audioData.set(modelInput);

  const outputs = await session.run({
    audio: audioTensor,
    cache: cacheTensor,
  });

  if (epochAtStart !== cacheEpoch || generationAtStart !== generationId || chunk.generationId !== generationId) {
    recycle(chunk.samples);
    return;
  }

  const inferenceMs = performance.now() - inferenceStart;
  emaInferenceMs = updateEma(emaInferenceMs, inferenceMs);

  const predictionArr = outputs.prediction.data as Float32Array;
  const confidenceArr = outputs.confidence.data as Float32Array;
  const volumeArr = outputs.volume.data as Float32Array;
  const cacheOut = outputs.cache_out.data as Float32Array;
  cacheData.set(cacheOut);

  const rawPrediction = predictionArr[0] ?? 0;
  const modelMidi = Number.isFinite(rawPrediction) && rawPrediction > 0 ? rawPrediction : 0;
  const concertMidi = restoreConcertMidi(modelMidi, shiftSemitones);

  emitTrackerEvents(
    {
      prediction: rawPrediction,
      confidence: confidenceArr[0] ?? 0,
      volume: volumeArr[0] ?? 0,
    },
    chunk,
    inferenceMs + preprocessMs,
    queueAgeMs,
    modelMidi,
    concertMidi,
  );

  recycle(chunk.samples);
};

const drainQueue = async (_reason: string): Promise<void> => {
  if (isInferring) return;
  isInferring = true;
  try {
    let next = chunkQueue.dequeue();
    while (next) {
      await runInference(next);
      next = chunkQueue.dequeue();
    }
  } finally {
    isInferring = false;
  }
};

const handleAudioChunk = (message: WorkerAudioMessage): void => {
  if (message.generationId !== generationId) {
    recycle(message.samples);
    return;
  }

  const chunk: CapturedChunk = {
    generationId: message.generationId,
    sequence: message.sequence,
    sourceStartSample: message.sourceStartSample,
    sourceEndSample: message.sourceEndSample,
    sourceEndTimeSec: message.sourceEndTimeSec,
    samples: message.samples,
    rawRmsDbfs: message.rawRmsDbfs,
    rawPeak: message.rawPeak,
    clipCount: message.clipCount,
  };

  const enqueued = chunkQueue.enqueue(chunk);
  if (!enqueued.ok) {
    handleDiscontinuity(chunk, enqueued.reason);
    return;
  }

  void drainQueue('enqueue');
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
          handleAudioChunk(portEvent.data);
        }
      };
      return;
    }

    if (data.type === 'init') {
      if (!session) {
        await initSession();
      }
      generationId = data.generationId;
      sensitivityLevel = data.sensitivity;
      pitchStableFramesOverride = data.config?.pitchStableFrames ?? 4;
      fastResponseEnabled = data.config?.fastResponse ?? pitchStableFramesOverride <= 2;
      expectedPitchMask = data.expectedPitchMask ?? 0;
      applyShiftMode(data.shiftSemitones ?? 0);
      tracker = new PitchOnsetTracker(buildTrackerConfig());
      tracker.setExpectedPitchMask(expectedPitchMask);
      chunkQueue.reset(generationId, 0);
      isInferring = false;
      resetLatencyStats();
      resetInferenceState();
      if (data.diagnostics) {
        diagnostics = new PitchInputDiagnostics({
          ...data.diagnostics,
          shiftSemitones,
          generationId,
        });
      } else {
        diagnostics = null;
      }
      audioPort?.postMessage({ type: 'resetCapture', generationId });
      post({ type: 'ready' });
      return;
    }

    if (data.type === 'setShiftSemitones') {
      generationId = data.generationId;
      flushActiveNote(performance.now() / 1000);
      tracker?.reset();
      chunkQueue.reset(generationId, 0);
      applyShiftMode(data.shiftSemitones);
      resetInferenceState();
      diagnostics?.updateConfig({ shiftSemitones, generationId });
      audioPort?.postMessage({ type: 'resetCapture', generationId });
      return;
    }

    if (data.type === 'setSensitivity') {
      sensitivityLevel = data.sensitivity;
      applyTrackerConfig();
      return;
    }

    if (data.type === 'setOnsetConfig') {
      if (typeof data.config.pitchStableFrames === 'number') {
        pitchStableFramesOverride = data.config.pitchStableFrames;
      }
      if (typeof data.config.fastResponse === 'boolean') {
        fastResponseEnabled = data.config.fastResponse;
      } else if (typeof data.config.pitchStableFrames === 'number') {
        fastResponseEnabled = pitchStableFramesOverride <= 2;
      }
      applyTrackerConfig();
      return;
    }

    if (data.type === 'setExpectedPitchMask') {
      expectedPitchMask = data.mask & 0xfff;
      tracker?.setExpectedPitchMask(expectedPitchMask);
      return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    post({ type: 'error', message });
  }
};

export {};
