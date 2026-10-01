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
import { PitchAttackEnvelope } from '@/utils/pitchInput/pitchAttackEnvelope';
import {
  ensurePitchFrameTraceBuffer,
  resetPitchFrameTraceBuffer,
} from '@/utils/pitchInput/pitchFrameTrace';
import { isPitchDiagnosticsEnabled } from '@/utils/pitchInput/pitchInputDevFlags';
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
  expectedPitchMidis?: number[];
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
  captureQueueAgeMs?: number;
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

interface WorkerSetExpectedPitchCandidatesMessage {
  type: 'setExpectedPitchCandidates';
  mask: number;
  midis: number[];
  repeatPitchClassMask?: number;
}

interface WorkerSetShiftMessage {
  type: 'setShiftSemitones';
  shiftSemitones: PestoShiftSemitones;
  generationId: number;
}

interface WorkerDumpTraceMessage {
  type: 'dumpFrameTrace';
}

interface WorkerConnectPortMessage {
  type: 'connectPort';
}

type WorkerInbound =
  | WorkerInitMessage
  | WorkerControlMessage
  | WorkerSetOnsetConfigMessage
  | WorkerSetExpectedPitchMaskMessage
  | WorkerSetExpectedPitchCandidatesMessage
  | WorkerSetShiftMessage
  | WorkerDumpTraceMessage
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
  inputLevelDb: number | null;
  diagnostics?: ReturnType<PitchInputDiagnostics['snapshot']>;
}

interface WorkerFrameTraceMessage {
  type: 'frameTrace';
  entries: ReturnType<ReturnType<typeof ensurePitchFrameTraceBuffer>['snapshot']>;
}

type WorkerOutbound =
  | NoteEventMessage
  | WorkerReadyMessage
  | WorkerErrorMessage
  | WorkerMonitorMessage
  | WorkerFrameTraceMessage;

let session: ort.InferenceSession | null = null;
let cacheTensor: ort.Tensor | null = null;
let audioTensor: ort.Tensor | null = null;
let cacheData: Float32Array | null = null;
let audioData: Float32Array | null = null;
let tracker: PitchOnsetTracker | null = null;
let frameIndex = 0;
let audioPort: MessagePort | null = null;
let isInferring = false;
let resetBeforeNextInference = false;
let lastProcessedSourceEndSample: number | null = null;
let lastChunkTime = 0;
let lastSourceEndSample = 0;
let latestInputLevelDb: number | null = null;
let emaCaptureIntervalMs = 0;
let emaInferenceMs = 0;
let monitorFrameCounter = 0;
let sensitivityLevel = 5;
let pitchStableFramesOverride = 4;
let fastResponseEnabled = false;
let expectedPitchMask = 0;
let expectedPitchMidis: number[] = [];
let repeatPitchClassMask = 0;
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
const attackEnvelope = new PitchAttackEnvelope();
let frameTraceEnabled = isPitchDiagnosticsEnabled();

const LATENCY_EMA_ALPHA = 0.1;
const MONITOR_POST_INTERVAL = 60;
const CACHE_SIZE = 3976;
// activations は判定に使わない。iOSと同じ4出力だけを取得する。
const INFERENCE_OUTPUTS = ['prediction', 'confidence', 'volume', 'cache_out'];

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
    inputLevelDb: latestInputLevelDb,
    diagnostics: diagnostics?.snapshot(chunkQueue.depthMs()),
  });
};

const resetLatencyStats = (): void => {
  lastChunkTime = 0;
  latestInputLevelDb = null;
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
  diagnostics?.recordModelReset();
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

// reset() だけでは transfer 済みバッファを失い、Worklet のプールが枯渇する。
const resetChunkQueue = (nextSequence = 0): void => {
  let discarded = chunkQueue.dequeue();
  while (discarded) {
    diagnostics?.recordDrop(discarded.sourceEndSample - discarded.sourceStartSample);
    recycle(discarded.samples);
    discarded = chunkQueue.dequeue();
  }
  chunkQueue.reset(generationId, nextSequence);
};

const handleDiscontinuity = (chunk: CapturedChunk, reason: string, sourceGapSamples: number): void => {
  // iOSと同じく、欠番・上限超過後は待機音声を捨てて次の推論前に初期化する。
  // 実行中の正常な推論のcacheは書き換えない。
  diagnostics?.recordDiscontinuity(reason, sourceGapSamples);
  resetBeforeNextInference = true;
  resetChunkQueue(chunk.sequence);
  const enqueued = chunkQueue.enqueue(chunk);
  if (!enqueued.ok) {
    recycle(chunk.samples);
    return;
  }
  void drainQueue();
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

const formatTraceEvent = (
  events: ReturnType<PitchOnsetTracker['processFrame']>,
): string | null => {
  for (const event of events) {
    if (event.type === 'noteOn') {
      return `noteOn:${event.note}`;
    }
    if (event.type === 'noteOff') {
      return `noteOff:${event.note}`;
    }
  }
  return null;
};

const emitTrackerEvents = (
  frame: { prediction: number; confidence: number; volume: number },
  attackDb: number,
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
    ? {
      prediction: concertMidi,
      confidence: frame.confidence,
      volume: frame.volume,
      attackDb,
    }
    : { ...frame, attackDb };

  const events = tracker.processFrame(trackerFrame, frameIndex);
  if (frameTraceEnabled) {
    ensurePitchFrameTraceBuffer().record({
      frameIndex,
      prediction: trackerFrame.prediction,
      confidence: trackerFrame.confidence,
      volumeDb: 10 * Math.log10(Math.max(frame.volume, 1e-12)),
      attackDb,
      expectedMask: expectedPitchMask,
      repeatMask: repeatPitchClassMask,
      currentNote: tracker.getCurrentNote(),
      event: formatTraceEvent(events),
    });
  }
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
  let outputs: ort.InferenceSession.ReturnType | null = null;
  const processingStart = diagnostics ? performance.now() : 0;
  try {
    if (!session || !cacheTensor || !audioTensor || !cacheData || !audioData || !tracker) {
      return;
    }

    const queueAgeMs = (chunk.captureQueueAgeMs ?? 0) + (chunk.receivedTimeMs === undefined
      ? 0
      : Math.max(0, performance.now() - chunk.receivedTimeMs));
    const accumulated = decimationBuffer.push(chunk.samples);
    if (!accumulated) {
      return;
    }

    const preprocessStart = performance.now();
    const modelInput = feedPestoDecimator(accumulated, decimatorState);
    if (!modelInput) {
      return;
    }
    const preprocessMs = performance.now() - preprocessStart;

    const inferenceStart = performance.now();
    const epochAtStart = cacheEpoch;
    const generationAtStart = generationId;
    audioData.set(modelInput);

    outputs = await session.run({
      audio: audioTensor,
      cache: cacheTensor,
    }, INFERENCE_OUTPUTS);

    if (epochAtStart !== cacheEpoch || generationAtStart !== generationId || chunk.generationId !== generationId) {
      return;
    }

    const inferenceMs = performance.now() - inferenceStart;
    emaInferenceMs = updateEma(emaInferenceMs, inferenceMs);

    const predictionArr = outputs.prediction.data as Float32Array;
    const confidenceArr = outputs.confidence.data as Float32Array;
    const volumeArr = outputs.volume.data as Float32Array;
    const cacheOut = outputs.cache_out.data as Float32Array;
    // iOS同様、非有限値を再帰cacheへ持ち越さない。
    for (let i = 0; i < cacheOut.length; i += 1) {
      if (!Number.isFinite(cacheOut[i])) throw new Error('Invalid PESTO cache');
    }
    const rawPrediction = predictionArr[0] ?? 0;
    const confidence = confidenceArr[0] ?? 0;
    const volume = volumeArr[0] ?? 0;
    if (!Number.isFinite(rawPrediction) || !Number.isFinite(confidence)
        || !Number.isFinite(volume) || volume < 0) {
      throw new Error('Invalid PESTO output');
    }
    cacheData.set(cacheOut);
    const modelMidi = Number.isFinite(rawPrediction) && rawPrediction > 0 ? rawPrediction : 0;
    const concertMidi = restoreConcertMidi(modelMidi, shiftSemitones);
    attackEnvelope.pushSamples(chunk.samples);
    const attackDb = attackEnvelope.computeAttackDb({
      repeatPitchClassMask,
      expectedPitchMidis,
    });

    emitTrackerEvents(
      {
        prediction: rawPrediction,
        confidence,
        volume,
      },
      attackDb,
      chunk,
      inferenceMs + preprocessMs,
      queueAgeMs,
      modelMidi,
      concertMidi,
    );
  } finally {
    if (outputs) {
      for (const name in outputs) outputs[name].dispose();
    }
    recycle(chunk.samples);
    diagnostics?.recordProcessingDuration(performance.now() - processingStart);
  }
};

const drainQueue = async (): Promise<void> => {
  if (isInferring) return;
  isInferring = true;
  try {
    let next = chunkQueue.dequeue();
    while (next) {
      try {
        const gapSamples = lastProcessedSourceEndSample === null
          ? 0
          : next.sourceStartSample - lastProcessedSourceEndSample;
        if (gapSamples !== 0) diagnostics?.recordSourceGap(gapSamples);
        if (resetBeforeNextInference || gapSamples !== 0) {
          resetBeforeNextInference = false;
          flushActiveNote(next.sourceEndTimeSec);
          tracker?.reset();
          resetInferenceState();
          attackEnvelope.reset();
        }
        lastProcessedSourceEndSample = next.sourceEndSample;
        await runInference(next);
      } catch (error) {
        diagnostics?.recordDrop(next.sourceEndSample - next.sourceStartSample);
        diagnostics?.recordDiscontinuity('inferenceError');
        flushActiveNote(next.sourceEndTimeSec);
        tracker?.reset();
        resetInferenceState();
        attackEnvelope.reset();
        post({ type: 'error', message: error instanceof Error ? error.message : String(error) });
      }
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

  const sourceGapSamples = Math.max(0, message.sourceStartSample - lastSourceEndSample);
  diagnostics?.recordDrop(sourceGapSamples);
  lastSourceEndSample = message.sourceEndSample;
  latestInputLevelDb = Number.isFinite(message.rawRmsDbfs) ? message.rawRmsDbfs : null;

  const chunk: CapturedChunk = {
    generationId: message.generationId,
    sequence: message.sequence,
    sourceStartSample: message.sourceStartSample,
    sourceEndSample: message.sourceEndSample,
    sourceEndTimeSec: message.sourceEndTimeSec,
    samples: message.samples,
    receivedTimeMs: performance.now(),
    captureQueueAgeMs: message.captureQueueAgeMs,
    rawRmsDbfs: message.rawRmsDbfs,
    rawPeak: message.rawPeak,
    clipCount: message.clipCount,
  };

  const enqueued = chunkQueue.enqueue(chunk);
  if (!enqueued.ok) {
    handleDiscontinuity(chunk, enqueued.reason, sourceGapSamples);
    return;
  }

  void drainQueue();
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
      expectedPitchMidis = data.expectedPitchMidis ?? [];
      applyShiftMode(data.shiftSemitones ?? 0);
      tracker = new PitchOnsetTracker(buildTrackerConfig());
      tracker.setExpectedPitchCandidates(expectedPitchMask, expectedPitchMidis, repeatPitchClassMask);
      resetChunkQueue();
      lastSourceEndSample = 0;
      lastProcessedSourceEndSample = null;
      resetBeforeNextInference = false;
      isInferring = false;
      resetLatencyStats();
      resetInferenceState();
      attackEnvelope.reset();
      resetPitchFrameTraceBuffer();
      frameTraceEnabled = isPitchDiagnosticsEnabled();
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
      resetChunkQueue();
      lastSourceEndSample = 0;
      lastProcessedSourceEndSample = null;
      resetBeforeNextInference = false;
      applyShiftMode(data.shiftSemitones);
      resetInferenceState();
      attackEnvelope.reset();
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
      expectedPitchMidis = [];
      repeatPitchClassMask = 0;
      tracker?.setExpectedPitchCandidates(expectedPitchMask, expectedPitchMidis, repeatPitchClassMask);
      return;
    }

    if (data.type === 'setExpectedPitchCandidates') {
      expectedPitchMask = data.mask & 0xfff;
      expectedPitchMidis = data.midis.map((midi) => Math.round(midi));
      repeatPitchClassMask = data.repeatPitchClassMask ?? 0;
      tracker?.setExpectedPitchCandidates(
        expectedPitchMask,
        expectedPitchMidis,
        repeatPitchClassMask,
      );
      return;
    }

    if (data.type === 'dumpFrameTrace') {
      if (!frameTraceEnabled) {
        post({ type: 'frameTrace', entries: [] });
        return;
      }
      post({ type: 'frameTrace', entries: ensurePitchFrameTraceBuffer().snapshot() });
      return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    post({ type: 'error', message });
  }
};

export {};
