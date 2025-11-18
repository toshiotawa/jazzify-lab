/// <reference lib="webworker" />

import type { GameSettings } from '@/types';
import type { LegendWorkerRequest, LegendWorkerResponse } from './protocol';
import { LegendEngineCore, type LegendFrameSnapshot } from './core';
import {
  ClockIndex,
  ControlIndex,
  LegendSharedMemoryViews,
  SharedNoteField,
  LegendSharedMemoryBuffers,
  createLegendSharedMemoryViews,
  readClockValue,
  writeClockValue,
} from './sharedMemory';

const ctx: DedicatedWorkerGlobalScope = self as DedicatedWorkerGlobalScope;

let engine: LegendEngineCore | null = null;
let shared: LegendSharedMemoryViews | null = null;
let updateHandle: number | null = null;
let lastStateEmit = 0;
const STATE_EMIT_INTERVAL_MS = 1000 / 30;

const ensureUpdateLoop = () => {
  if (updateHandle !== null) {
    return;
  }
  updateHandle = ctx.setInterval(() => {
    if (!engine || !shared) {
      return;
    }
    const audioTime = readClockValue(shared.clock, ClockIndex.AudioTimeNs);
    const snapshot = engine.sync(audioTime);
    writeSharedState(shared, snapshot);
    sendJudgments(snapshot.judgments);
    sendHighlights(snapshot.highlights);
    if (shouldEmitState()) {
      postMessage({
        type: 'STATE',
        payload: {
          currentTime: snapshot.currentTime,
          score: snapshot.score,
          combo: snapshot.score.combo,
        },
      } satisfies LegendWorkerResponse);
    }
  }, 4);
};

const shouldEmitState = (): boolean => {
  const now = Date.now();
  if (now - lastStateEmit >= STATE_EMIT_INTERVAL_MS) {
    lastStateEmit = now;
    return true;
  }
  return false;
};

const writeSharedState = (
  views: LegendSharedMemoryViews,
  snapshot: LegendFrameSnapshot
): void => {
  const { notes, control, noteStride, maxNotes, clock } = views;
  const activeCount = Math.min(snapshot.activeNotes.length, maxNotes);
  const stride = noteStride;
  for (let i = 0; i < activeCount; i++) {
    const active = snapshot.activeNotes[i];
    const base = i * stride;
    notes[base + SharedNoteField.Id] = active.note.numericId;
    notes[base + SharedNoteField.Pitch] = active.note.pitch;
    notes[base + SharedNoteField.StartTime] = active.note.time;
    notes[base + SharedNoteField.TargetTime] = active.displayTime;
    notes[base + SharedNoteField.Y] = active.y ?? -999;
    notes[base + SharedNoteField.State] = active.state;
    notes[base + SharedNoteField.Velocity] = active.timingError ?? 0;
    notes[base + SharedNoteField.Spare] = active.previousY ?? active.y ?? -999;
  }
  Atomics.store(control, ControlIndex.ActiveCount, activeCount);
  Atomics.store(control, ControlIndex.FrameId, snapshot.frameId);
  writeClockValue(clock, ClockIndex.LogicalTimeNs, snapshot.currentTime);
};

const sendJudgments = (judgments: LegendFrameSnapshot['judgments']): void => {
  if (!judgments.length) return;
  for (const judgment of judgments) {
    postMessage({ type: 'JUDGMENT', payload: judgment } satisfies LegendWorkerResponse);
  }
};

const sendHighlights = (highlights: LegendFrameSnapshot['highlights']): void => {
  if (!highlights.length) return;
  for (const highlight of highlights) {
    postMessage({ type: 'GUIDE_HIGHLIGHT', payload: highlight } satisfies LegendWorkerResponse);
  }
};

const initialize = (payload: { settings: GameSettings; shared: LegendSharedMemoryBuffers }) => {
  engine = new LegendEngineCore(payload.settings);
  shared = createLegendSharedMemoryViews(payload.shared);
  ensureUpdateLoop();
  postMessage({ type: 'READY' } satisfies LegendWorkerResponse);
};

const handleMessage = (event: MessageEvent<LegendWorkerRequest>) => {
  const message = event.data;
  switch (message.type) {
    case 'INIT':
      initialize(message.payload);
      return;
    case 'LOAD_SONG':
      engine?.loadSong(message.payload.notes);
      return;
    case 'SET_SETTINGS':
      engine?.updateSettings(message.payload.settings);
      return;
    case 'START':
      engine?.start(message.payload.audioTime, message.payload.startAt);
      return;
    case 'PAUSE':
      engine?.pause(message.payload.audioTime);
      return;
    case 'STOP':
      engine?.stop();
      return;
    case 'SEEK':
      engine?.seek(message.payload.time, message.payload.audioTime);
      return;
    case 'NOTE_ON':
      engine?.noteOn(message.payload.note, message.payload.audioTime, message.payload.velocity);
      return;
    case 'NOTE_OFF':
      return;
    case 'REQUEST_STATE_SNAPSHOT':
      if (engine && shared) {
        const audioTime = readClockValue(shared.clock, ClockIndex.AudioTimeNs);
        const snapshot = engine.sync(audioTime);
        writeSharedState(shared, snapshot);
        postMessage({
          type: 'STATE',
          payload: {
            currentTime: snapshot.currentTime,
            score: snapshot.score,
            combo: snapshot.score.combo,
          },
        } satisfies LegendWorkerResponse);
      }
      return;
    default:
      return;
  }
};

ctx.onmessage = handleMessage;
