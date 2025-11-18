/// <reference lib="webworker" />

import type { GameSettings, NoteData } from '@/types';
import { GameEngine } from '@/utils/gameEngine';
import {
  LegendSharedNotesWriter,
  DEFAULT_MAX_SHARED_NOTES
} from '@/legend/LegendSharedNotesBuffer';
import { WorkerTicker } from '@/legend/WorkerTicker';
import { SharedAudioClockProxy } from '@/legend/LegendAudioClock';

interface InitCommand {
  type: 'init';
  settings: GameSettings;
  notesBuffer: SharedArrayBuffer;
  clockBuffer: SharedArrayBuffer;
  maxNotes: number;
  notesMeta: NoteData[];
  noteIds: string[];
}

interface StartCommand {
  type: 'start';
  latencies: { baseLatency?: number; outputLatency?: number };
}

interface PauseCommand {
  type: 'pause';
}

interface StopCommand {
  type: 'stop';
}

interface SeekCommand {
  type: 'seek';
  time: number;
}

interface UpdateSettingsCommand {
  type: 'update-settings';
  settings: GameSettings;
}

interface HandleInputCommand {
  type: 'handle-input';
  note: number;
}

interface LoadSongCommand {
  type: 'load-song';
  notes: NoteData[];
  noteIds: string[];
}

interface DisposeCommand {
  type: 'dispose';
}

type LegendWorkerCommand =
  | InitCommand
  | StartCommand
  | PauseCommand
  | StopCommand
  | SeekCommand
  | UpdateSettingsCommand
  | HandleInputCommand
  | LoadSongCommand
  | DisposeCommand;

let engine: GameEngine | null = null;
let ticker: WorkerTicker | null = null;
let writer: LegendSharedNotesWriter | null = null;
let clockBuffer: SharedArrayBuffer | null = null;
let clockMeta: Int32Array | null = null;
let running = false;
let loopActive = false;
let noteIndexMap: Map<string, number> = new Map();
let stateThrottleTime = 0;

const ctx: DedicatedWorkerGlobalScope = self as DedicatedWorkerGlobalScope;

const buildNoteIndexMap = (noteIds: string[]): Map<string, number> => {
  const map = new Map<string, number>();
  noteIds.forEach((id, index) => {
    map.set(id, index);
  });
  return map;
};

const ensureInitialized = (): engine is GameEngine => {
  return engine !== null && ticker !== null && writer !== null && clockBuffer !== null;
};

const emitState = (): void => {
  if (!engine) {
    return;
  }
  const now = performance.now();
  if (now - stateThrottleTime < 33) {
    return;
  }
  stateThrottleTime = now;
  const state = engine.getState();
  ctx.postMessage({
    type: 'state',
    payload: {
      currentTime: state.currentTime,
      score: state.score,
      timing: state.timing
    }
  });
};

const processFrame = (): void => {
  if (!engine || !writer) {
    return;
  }
  const state = engine.getState();
  writer.write(state.activeNotes, state.currentTime);
  emitState();
};

const runLoop = (): void => {
  if (!clockMeta || loopActive) {
    return;
  }
  loopActive = true;
  (async () => {
    let lastFrame = Atomics.load(clockMeta!, 0);
    while (running) {
      Atomics.wait(clockMeta!, 0, lastFrame);
      const frame = Atomics.load(clockMeta!, 0);
      if (!running) {
        break;
      }
      if (frame === lastFrame) {
        continue;
      }
      lastFrame = frame;
      ticker?.tick(1);
      processFrame();
    }
    loopActive = false;
  })().catch((error) => {
    console.error('[LegendWorker] loop error', error);
    loopActive = false;
  });
};

const handleInit = (command: InitCommand): void => {
  ticker = new WorkerTicker();
  engine = new GameEngine(command.settings, ticker);
  noteIndexMap = buildNoteIndexMap(command.noteIds);
  writer = new LegendSharedNotesWriter(
    command.notesBuffer,
    command.maxNotes ?? DEFAULT_MAX_SHARED_NOTES,
    (noteId: string) => noteIndexMap.get(noteId) ?? -1
  );
  clockBuffer = command.clockBuffer;
  clockMeta = new Int32Array(clockBuffer, 0, 2);

  engine.setJudgmentCallback((judgment) => {
    ctx.postMessage({ type: 'judgment', payload: judgment });
  });
  engine.setKeyHighlightCallback((pitch, timestamp) => {
    ctx.postMessage({ type: 'key-highlight', payload: { pitch, timestamp } });
  });

  ctx.postMessage({ type: 'ready' });
};

const handleStart = (command: StartCommand): void => {
  if (!ensureInitialized() || !clockBuffer) {
    return;
  }
  const clock = new SharedAudioClockProxy(clockBuffer, command.latencies);
  engine.start(clock);
  running = true;
  runLoop();
};

const handlePause = (): void => {
  if (!engine) return;
  running = false;
  engine.pause();
  if (clockMeta) {
    Atomics.notify(clockMeta, 0);
  }
};

const handleStop = (): void => {
  if (!engine) return;
  running = false;
  engine.stop();
  if (clockMeta) {
    Atomics.notify(clockMeta, 0);
  }
};

const handleSeek = (command: SeekCommand): void => {
  engine?.seek(command.time);
};

const handleUpdateSettings = (command: UpdateSettingsCommand): void => {
  engine?.updateSettings(command.settings);
};

const handleHandleInput = (command: HandleInputCommand): void => {
  if (!engine) return;
  const hit = engine.handleInput(command.note);
  if (hit) {
    const judgment = engine.processHit(hit);
    ctx.postMessage({ type: 'judgment', payload: judgment });
  }
};

const handleLoadSong = (command: LoadSongCommand): void => {
  noteIndexMap = buildNoteIndexMap(command.noteIds);
  engine?.loadSong(command.notes);
};

const handleDispose = (): void => {
  running = false;
  if (clockMeta) {
    Atomics.notify(clockMeta, 0);
  }
  engine?.destroy();
  ticker?.clear();
  engine = null;
  ticker = null;
  writer = null;
};

ctx.onmessage = (event: MessageEvent<LegendWorkerCommand>) => {
  const command = event.data;
  switch (command.type) {
    case 'init':
      handleInit(command);
      break;
    case 'start':
      handleStart(command);
      break;
    case 'pause':
      handlePause();
      break;
    case 'stop':
      handleStop();
      break;
    case 'seek':
      handleSeek(command);
      break;
    case 'update-settings':
      handleUpdateSettings(command);
      break;
    case 'handle-input':
      handleHandleInput(command);
      break;
    case 'load-song':
      handleLoadSong(command);
      break;
    case 'dispose':
      handleDispose();
      break;
    default:
      break;
  }
};
