import type { ActiveNote, GameSettings, NoteData } from '@/types';
import { GameEngine, type EngineClockConfig } from './gameEngineCore';
import {
  attachSharedNoteBuffer,
  type SharedNoteViews,
  writeSharedNotes,
  SharedNoteState
} from './sharedNoteBuffer';
import type { GameLogicWorkerCommand, GameLogicWorkerEvent } from './gameLogicTypes';

declare const self: DedicatedWorkerGlobalScope;

let engine: GameEngine | null = null;
let sharedViews: SharedNoteViews | null = null;
let notesMetadata: NoteData[] = [];
const noteIndexMap = new Map<string, number>();

const send = (message: GameLogicWorkerEvent): void => {
  self.postMessage(message);
};

const mapStateToShared = (state: ActiveNote['state']): SharedNoteState => {
  switch (state) {
    case 'hit':
      return SharedNoteState.Hit;
    case 'missed':
      return SharedNoteState.Missed;
    case 'completed':
      return SharedNoteState.Completed;
    case 'visible':
    default:
      return SharedNoteState.Visible;
  }
};

const updateSharedBuffer = (activeNotes: ActiveNote[]): void => {
  if (!sharedViews) return;
  const payload = activeNotes
    .map(note => {
      const index = noteIndexMap.get(note.id ?? '');
      if (index === undefined) return null;
      return {
        noteIndex: index,
        pitch: note.pitch,
        time: note.time,
        y: note.y ?? 0,
        previousY: note.previousY ?? note.y ?? 0,
        velocity: note.velocity ?? 0,
        state: mapStateToShared(note.state)
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  writeSharedNotes(sharedViews, payload);
};

const handleEngineUpdate = (update: Parameters<NonNullable<GameEngine['setUpdateCallback']>>[0]): void => {
  updateSharedBuffer(update.activeNotes);
  send({
    type: 'UPDATE',
    currentTime: update.currentTime,
    timing: update.timing,
    score: update.score
  });
};

const handleJudgment = (judgment: Parameters<NonNullable<GameEngine['setJudgmentCallback']>>[0]): void => {
  send({
    type: 'JUDGMENT',
    judgment
  });
};

const handleKeyHighlight = (pitch: number, timestamp: number): void => {
  send({
    type: 'KEY_HIGHLIGHT',
    payload: { pitch, timestamp }
  });
};

const ensureEngine = (settings: GameSettings): GameEngine => {
  if (engine) {
    return engine;
  }
  const instance = new GameEngine({ ...settings });
  instance.setUpdateCallback(handleEngineUpdate);
  instance.setJudgmentCallback(handleJudgment);
  instance.setKeyHighlightCallback(handleKeyHighlight);
  engine = instance;
  return instance;
};

const updateNoteIndexMap = (notes: NoteData[]): void => {
  notesMetadata = notes;
  noteIndexMap.clear();
  notesMetadata.forEach((note, index) => {
    noteIndexMap.set(note.id ?? `note-${index}`, index);
  });
};

self.onmessage = (event: MessageEvent<GameLogicWorkerCommand>) => {
  const message = event.data;
  switch (message.type) {
  case 'INIT': {
    sharedViews = attachSharedNoteBuffer(
      message.sharedBuffer,
      message.maxNotes ?? 512,
      message.sharedBufferType === 'shared'
    );
      const inst = ensureEngine(message.settings);
      updateNoteIndexMap(message.notes);
      inst.loadSong(message.notes);
      send({ type: 'READY' });
      break;
    }
    case 'LOAD_SONG': {
      if (!engine) break;
      updateNoteIndexMap(message.notes);
      engine.loadSong(message.notes);
      break;
    }
    case 'START': {
      engine?.start(message.clock as EngineClockConfig);
      break;
    }
    case 'RESUME': {
      engine?.resume(message.clock as EngineClockConfig);
      break;
    }
    case 'PAUSE': {
      engine?.pause();
      break;
    }
    case 'STOP': {
      engine?.stop();
      break;
    }
    case 'SEEK': {
      engine?.seek(message.time, message.clock as EngineClockConfig);
      break;
    }
    case 'HANDLE_INPUT': {
      const hit = engine?.handleInput(message.note);
      if (hit && engine) {
        const judgment = engine.processHit(hit);
        handleJudgment(judgment);
      }
      break;
    }
    case 'UPDATE_SETTINGS': {
      engine?.updateSettings({ ...message.settings });
      break;
    }
    case 'DESTROY': {
      engine?.stop();
      engine = null;
      sharedViews = null;
      break;
    }
    default:
      break;
  }
};

export {};
