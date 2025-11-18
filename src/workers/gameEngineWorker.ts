/// <reference lib="webworker" />

import type { ActiveNote, GameSettings, JudgmentResult, NoteData } from '@/types';
import { GameEngineCore } from '@/utils/gameEngineCore';

interface InitMessage {
  type: 'INIT';
  payload: { settings: GameSettings };
}

interface LoadSongMessage {
  type: 'LOAD_SONG';
  payload: { notes: NoteData[] };
}

interface UpdateSettingsMessage {
  type: 'UPDATE_SETTINGS';
  payload: { settings: GameSettings };
}

interface ControlMessage {
  type: 'START' | 'PAUSE' | 'STOP';
}

interface SeekMessage {
  type: 'SEEK';
  payload: { time: number };
}

interface HandleInputMessage {
  type: 'HANDLE_INPUT';
  payload: { note: number };
}

interface FrameTickMessage {
  type: 'FRAME_TICK';
  payload: { currentTime: number };
}

type WorkerMessage =
  | InitMessage
  | LoadSongMessage
  | UpdateSettingsMessage
  | ControlMessage
  | SeekMessage
  | HandleInputMessage
  | FrameTickMessage;

interface FrameUpdatePayload {
  currentTime: number;
  additions: ActiveNote[];
  updates: Array<{
    id: string;
    y?: number;
    previousY?: number;
    state?: ActiveNote['state'];
    pitch?: number;
    noteName?: string | undefined;
    crossingLogged?: boolean;
  }>;
  removals: string[];
  judgments: JudgmentResult[];
  highlights: Array<{ pitch: number; timestamp: number }>;
  score: ReturnType<GameEngineCore['advance']>['score'];
}

const ctx = self as DedicatedWorkerGlobalScope;

let engine: GameEngineCore | null = null;
let isPlaying = false;
let previousNotes: Map<string, ActiveNote> = new Map();

const post = (data: { type: string; payload?: unknown }): void => {
  ctx.postMessage(data);
};

ctx.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;
  switch (message.type) {
    case 'INIT': {
      engine = new GameEngineCore({ ...message.payload.settings });
      previousNotes = new Map();
      post({ type: 'READY' });
      break;
    }
    case 'LOAD_SONG': {
      engine?.loadSong(message.payload.notes);
      previousNotes = new Map();
      post({ type: 'LOADED' });
      break;
    }
    case 'UPDATE_SETTINGS': {
      engine?.updateSettings(message.payload.settings);
      previousNotes = new Map();
      break;
    }
    case 'START': {
      isPlaying = true;
      break;
    }
    case 'PAUSE': {
      isPlaying = false;
      break;
    }
    case 'STOP': {
      isPlaying = false;
      engine?.seek(0);
      previousNotes = new Map();
      break;
    }
    case 'SEEK': {
      engine?.seek(message.payload.time);
      previousNotes = new Map();
      break;
    }
    case 'HANDLE_INPUT': {
      engine?.handleInput(message.payload.note);
      break;
    }
    case 'FRAME_TICK': {
      if (!engine || !isPlaying) {
        break;
      }
      const update = engine.advance(message.payload.currentTime);
      const framePayload: FrameUpdatePayload = {
        currentTime: update.currentTime,
        ...buildDiff(update.activeNotes),
        judgments: update.events?.judgments ?? [],
        highlights: update.events?.highlights ?? [],
        score: update.score
      };
      post({ type: 'FRAME_UPDATE', payload: framePayload });
      break;
    }
    default:
      break;
  }
};

const buildDiff = (activeNotes: ActiveNote[]) => {
  const additions: ActiveNote[] = [];
  const updates: FrameUpdatePayload['updates'] = [];
  const removals: string[] = [];
  const currentMap = new Map<string, ActiveNote>();

  for (const note of activeNotes) {
    currentMap.set(note.id, note);
    const prev = previousNotes.get(note.id);
    if (!prev) {
      additions.push(note);
    } else if (
      prev.y !== note.y ||
      prev.state !== note.state ||
      prev.pitch !== note.pitch ||
      prev.noteName !== note.noteName ||
      prev.crossingLogged !== note.crossingLogged
    ) {
      updates.push({
        id: note.id,
        y: note.y,
        previousY: note.previousY,
        state: note.state,
        pitch: note.pitch,
        noteName: note.noteName,
        crossingLogged: note.crossingLogged
      });
    }
  }

  for (const noteId of previousNotes.keys()) {
    if (!currentMap.has(noteId)) {
      removals.push(noteId);
    }
  }

  previousNotes = currentMap;

  return { additions, updates, removals };
};

export {};
