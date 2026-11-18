/**
 * polyPitchWorker.ts — PitchPlease piano inference + poly onset tracking (off the audio thread).
 */

import {
  DEFAULT_POLY_ONSET_CONFIG,
  PITCH_PLEASE_PIANO_THRESHOLDS,
  createPolyOnsetTracker,
  fillLevelsFromPitchPleaseProbs,
  resetPolyOnsetTracker,
  snapshotPolyLevelsForDiagnostics,
  stepPolyOnsetTracker,
} from '@/utils/pitchInput/polyPitchActiveSet';
import {
  initPolyPitchWorkerEngine,
  type PolyPitchWorkerEngine,
} from '@/utils/pitchInput/polyPitchPleaseWorkerEngine';
import { PitchChunkQueue } from '@/utils/pitchInput/pitchChunkQueue';
import {
  POLY_PITCH_QUEUE_LIMIT_MS,
  PESTO_TARGET_SAMPLE_RATE,
  type CapturedChunk,
} from '@/utils/pitchInput/pitchInputTypes';

interface WorkerAudioMessage {
  type: 'audioChunk';
  generationId: number;
  sequence: number;
  sourceStartSample: number;
  sourceEndSample: number;
  sourceEndTimeSec: number;
  samples: Float32Array;
  recoveryCache?: Float32Array;
  captureQueueAgeMs?: number;
  rawRmsDbfs: number;
  rawPeak: number;
  clipCount: number;
}

interface WorkerInitMessage {
  type: 'init';
  generationId: number;
  diagnosticsEnabled?: boolean;
  expectedPitchClassMask?: number;
}

interface WorkerSetMaskMessage {
  type: 'setExpectedPitchClassMask';
  mask: number;
}

interface WorkerSetDiagnosticsMessage {
  type: 'setDiagnostics';
  enabled: boolean;
}

interface WorkerConnectPortMessage {
  type: 'connectPort';
}

type WorkerInbound =
  | WorkerInitMessage
  | WorkerSetMaskMessage
  | WorkerSetDiagnosticsMessage
  | WorkerConnectPortMessage;

interface NoteEventMessage {
  type: 'noteOn' | 'noteOff';
  note: number;
  audioContextTime?: number;
  level?: number;
}

interface WorkerReadyMessage {
  type: 'ready';
  kernel: string | null;
  sampleRate: number;
}

interface WorkerErrorMessage {
  type: 'error';
  message: string;
}

interface PolyDiagFrameMessage {
  type: 'polyDiagFrame';
  levels: number[][];
  inputDb: number | null;
}

type WorkerOutbound =
  | NoteEventMessage
  | WorkerReadyMessage
  | WorkerErrorMessage
  | PolyDiagFrameMessage;

let audioPort: MessagePort | null = null;
let engine: PolyPitchWorkerEngine | null = null;
let generationId = 0;
let expectedPitchClassMask = 0;
let diagnosticsEnabled = false;
let lastSourceEndSample = 0;

const tracker = createPolyOnsetTracker();
const levels = new Float32Array(128);
const chunkQueue = new PitchChunkQueue(POLY_PITCH_QUEUE_LIMIT_MS);

const post = (message: WorkerOutbound): void => {
  self.postMessage(message);
};

const recycle = (samples: Float32Array, type: 'recycle' | 'recycleHistory' = 'recycle'): void => {
  const port = audioPort;
  const buffer = samples.buffer;
  if (!port || !(buffer instanceof ArrayBuffer) || buffer.byteLength === 0) return;
  port.postMessage({ type, buffer }, [buffer]);
};

const recycleChunk = (chunk: Pick<CapturedChunk, 'samples' | 'recoveryCache'>): void => {
  if (chunk.recoveryCache) recycle(chunk.recoveryCache, 'recycleHistory');
  recycle(chunk.samples);
};

const resetChunkQueue = (nextSequence = 0): void => {
  while (chunkQueue.peekOldest()) {
    const dropped = chunkQueue.dequeue();
    if (dropped) recycleChunk(dropped);
  }
  chunkQueue.reset(generationId, nextSequence);
};

const dropOldestUntilEnqueueable = (chunk: CapturedChunk): boolean => {
  for (let attempt = 0; attempt < 64; attempt += 1) {
    const enqueued = chunkQueue.enqueue(chunk);
    if (enqueued.ok) return true;
    if (enqueued.reason !== 'queueOverflow') return false;
    const dropped = chunkQueue.dequeue();
    if (!dropped) return false;
    recycleChunk(dropped);
  }
  return false;
};

const recordDiagFrame = (rawRmsDbfs: number): void => {
  if (!diagnosticsEnabled) return;
  post({
    type: 'polyDiagFrame',
    levels: snapshotPolyLevelsForDiagnostics(levels),
    inputDb: Number.isFinite(rawRmsDbfs) ? rawRmsDbfs : null,
  });
};

const emitPolyNotes = (audioContextTime: number): void => {
  stepPolyOnsetTracker(
    tracker,
    levels,
    PITCH_PLEASE_PIANO_THRESHOLDS,
    DEFAULT_POLY_ONSET_CONFIG,
    (midi) => {
      post({
        type: 'noteOn',
        note: midi,
        audioContextTime,
        level: Math.round(levels[midi] * 100),
      });
    },
    (midi) => {
      post({
        type: 'noteOff',
        note: midi,
        level: Math.round(levels[midi] * 100),
      });
    },
    expectedPitchClassMask,
  );
};

const processChunk = (chunk: CapturedChunk): void => {
  if (!engine) {
    recycleChunk(chunk);
    return;
  }
  const streamStartTimeSec = chunk.sourceEndTimeSec
    - chunk.sourceEndSample / PESTO_TARGET_SAMPLE_RATE;
  try {
    const frames = engine.detector.push(chunk.samples);
    for (const frame of frames) {
      fillLevelsFromPitchPleaseProbs(levels, frame.probs);
      recordDiagFrame(chunk.rawRmsDbfs);
      const frameTimeSec = typeof frame.t === 'number' && Number.isFinite(frame.t)
        ? streamStartTimeSec + frame.t
        : chunk.sourceEndTimeSec;
      emitPolyNotes(frameTimeSec);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    post({ type: 'error', message });
    recycleChunk(chunk);
    return;
  }
  recycleChunk(chunk);
};

const drainQueue = (): void => {
  for (;;) {
    const next = chunkQueue.dequeue();
    if (!next) break;
    processChunk(next);
  }
};

const handleDiscontinuity = (
  chunk: CapturedChunk,
  reason: string,
  sourceGapSamples: number,
): void => {
  void reason;
  void sourceGapSamples;
  resetChunkQueue(chunk.sequence);
  if (!dropOldestUntilEnqueueable(chunk)) {
    recycleChunk(chunk);
    return;
  }
  drainQueue();
};

const handleAudioChunk = (message: WorkerAudioMessage): void => {
  if (message.generationId !== generationId) {
    recycleChunk(message);
    return;
  }

  const sourceGapSamples = Math.max(0, message.sourceStartSample - lastSourceEndSample);
  lastSourceEndSample = message.sourceEndSample;

  const chunk: CapturedChunk = {
    generationId: message.generationId,
    sequence: message.sequence,
    sourceStartSample: message.sourceStartSample,
    sourceEndSample: message.sourceEndSample,
    sourceEndTimeSec: message.sourceEndTimeSec,
    samples: message.samples,
    recoveryCache: message.recoveryCache,
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
  drainQueue();
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
          handleAudioChunk(portEvent.data);
        }
      };
      return;
    }

    if (data.type === 'setDiagnostics') {
      diagnosticsEnabled = data.enabled;
      return;
    }

    if (data.type === 'setExpectedPitchClassMask') {
      expectedPitchClassMask = data.mask & 0xfff;
      return;
    }

    if (data.type === 'init') {
      generationId = data.generationId;
      expectedPitchClassMask = data.expectedPitchClassMask ?? 0;
      diagnosticsEnabled = data.diagnosticsEnabled ?? false;
      resetPolyOnsetTracker(tracker);
      levels.fill(0);
      lastSourceEndSample = 0;
      resetChunkQueue();
      if (!engine) {
        engine = await initPolyPitchWorkerEngine(PESTO_TARGET_SAMPLE_RATE);
      }
      audioPort?.postMessage({ type: 'resetCapture', generationId });
      post({
        type: 'ready',
        kernel: engine.kernelId,
        sampleRate: engine.inputRate,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    post({ type: 'error', message });
  }
};