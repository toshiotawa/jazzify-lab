import type { GameScore, GameSettings, JudgmentResult, NoteData } from '@/types';
import type { LegendSharedMemoryBuffers } from './sharedMemory';

export interface LegendEngineStatePayload {
  currentTime: number;
  score: GameScore;
  combo: number;
}

export interface LegendGuideHighlightPayload {
  pitch: number;
  timestamp: number;
}

export type LegendWorkerRequest =
  | {
      type: 'INIT';
      payload: {
        settings: GameSettings;
        shared: LegendSharedMemoryBuffers;
      };
    }
  | {
      type: 'LOAD_SONG';
      payload: {
        notes: NoteData[];
      };
    }
  | {
      type: 'SET_SETTINGS';
      payload: {
        settings: GameSettings;
      };
    }
  | {
      type: 'START';
      payload: {
        audioTime: number;
        startAt: number;
      };
    }
  | {
      type: 'PAUSE';
      payload: {
        audioTime: number;
      };
    }
  | {
      type: 'STOP';
    }
  | {
      type: 'SEEK';
      payload: {
        time: number;
        audioTime: number;
      };
    }
  | {
      type: 'NOTE_ON';
      payload: {
        note: number;
        velocity?: number;
        audioTime: number;
      };
    }
  | {
      type: 'NOTE_OFF';
      payload: {
        note: number;
        audioTime: number;
      };
    }
  | {
      type: 'REQUEST_STATE_SNAPSHOT';
    };

export type LegendWorkerResponse =
  | {
      type: 'READY';
    }
  | {
      type: 'STATE';
      payload: LegendEngineStatePayload;
    }
  | {
      type: 'JUDGMENT';
      payload: JudgmentResult;
    }
  | {
      type: 'GUIDE_HIGHLIGHT';
      payload: LegendGuideHighlightPayload;
    }
  | {
      type: 'ERROR';
      payload: {
        message: string;
        context?: string;
      };
    };
