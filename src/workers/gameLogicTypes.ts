import type { GameScore, GameSettings, JudgmentResult, MusicalTiming, NoteData } from '@/types';
import type { SharedNoteViews } from './sharedNoteBuffer';

export interface ClockSyncPayload {
  logicalTime: number;
  performanceNow: number;
  latencyOffset: number;
  playbackSpeed: number;
}

export interface WorkerInitMessage {
  type: 'INIT';
  settings: GameSettings;
  notes: NoteData[];
  sharedBuffer: SharedNoteViews['buffer'];
  maxNotes?: number;
}

export interface WorkerLoadSongMessage {
  type: 'LOAD_SONG';
  notes: NoteData[];
}

export interface WorkerStartMessage {
  type: 'START';
  clock: ClockSyncPayload;
}

export interface WorkerResumeMessage {
  type: 'RESUME';
  clock: ClockSyncPayload;
}

export interface WorkerSeekMessage {
  type: 'SEEK';
  time: number;
  clock: ClockSyncPayload;
}

export interface WorkerSimpleMessage {
  type: 'PAUSE' | 'STOP' | 'DESTROY';
}

export interface WorkerInputMessage {
  type: 'HANDLE_INPUT';
  note: number;
}

export interface WorkerSettingsMessage {
  type: 'UPDATE_SETTINGS';
  settings: GameSettings;
}

export type GameLogicWorkerCommand =
  | WorkerInitMessage
  | WorkerLoadSongMessage
  | WorkerStartMessage
  | WorkerResumeMessage
  | WorkerSeekMessage
  | WorkerSimpleMessage
  | WorkerInputMessage
  | WorkerSettingsMessage;

export interface WorkerUpdateEvent {
  type: 'UPDATE';
  currentTime: number;
  timing: MusicalTiming;
  score: GameScore;
}

export interface WorkerJudgmentEvent {
  type: 'JUDGMENT';
  judgment: JudgmentResult;
}

export interface WorkerKeyHighlightEvent {
  type: 'KEY_HIGHLIGHT';
  payload: { pitch: number; timestamp: number };
}

export interface WorkerReadyEvent {
  type: 'READY';
}

export interface WorkerErrorEvent {
  type: 'ERROR';
  message: string;
}

export type GameLogicWorkerEvent =
  | WorkerUpdateEvent
  | WorkerJudgmentEvent
  | WorkerKeyHighlightEvent
  | WorkerReadyEvent
  | WorkerErrorEvent;
