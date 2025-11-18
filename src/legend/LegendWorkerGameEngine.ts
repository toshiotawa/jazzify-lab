import type {
  GameSettings,
  NoteData,
  JudgmentResult,
  GameScore,
  MusicalTiming
} from '@/types';
import type {
  GameEngineState,
  GameEngineUpdate
} from '@/utils/gameEngine';
import {
  DEFAULT_MAX_SHARED_NOTES,
  LegendSharedNotesReader,
  createSharedNotesBuffer,
  type NoteMetadataProvider
} from './LegendSharedNotesBuffer';
import {
  LegendAudioClock,
  createAudioClockBuffer,
  type ClockLatencies
} from './LegendAudioClock';

interface LegendWorkerStatePayload {
  currentTime: number;
  score: GameScore;
  timing: MusicalTiming;
}

interface LegendWorkerMessageReady {
  type: 'ready';
}

interface LegendWorkerMessageState {
  type: 'state';
  payload: LegendWorkerStatePayload;
}

interface LegendWorkerMessageJudgment {
  type: 'judgment';
  payload: JudgmentResult;
}

interface LegendWorkerMessageKeyHighlight {
  type: 'key-highlight';
  payload: { pitch: number; timestamp: number };
}

interface LegendWorkerMessageError {
  type: 'error';
  message: string;
}

type LegendWorkerMessage =
  | LegendWorkerMessageReady
  | LegendWorkerMessageState
  | LegendWorkerMessageJudgment
  | LegendWorkerMessageKeyHighlight
  | LegendWorkerMessageError;

interface InitCommand {
  type: 'init';
  settings: GameSettings;
  notesBuffer: SharedArrayBuffer;
  clockBuffer: SharedArrayBuffer;
  maxNotes: number;
  noteIds: string[];
  notesMeta: NoteData[];
}

interface StartCommand {
  type: 'start';
  latencies: ClockLatencies;
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

interface LegendWorkerOptions {
  maxNotes?: number;
}

const createDefaultState = (): GameEngineState => ({
  currentTime: 0,
  activeNotes: [],
  score: {
    totalNotes: 0,
    goodCount: 0,
    missCount: 0,
    combo: 0,
    maxCombo: 0,
    accuracy: 0,
    score: 0,
    rank: 'D'
  },
  timing: {
    currentTime: 0,
    audioTime: 0,
    latencyOffset: 0
  },
  abRepeat: {
    start: null,
    end: null,
    enabled: false
  }
});

class MutableMetadataProvider implements NoteMetadataProvider {
  constructor(
    private readonly getNotesRef: () => NoteData[],
    private readonly getIdsRef: () => string[]
  ) {}

  getNotes(): NoteData[] {
    return this.getNotesRef();
  }

  getNoteIds(): string[] {
    return this.getIdsRef();
  }
}

export class LegendWorkerGameEngine {
  private readonly worker: Worker;
  private readonly notesBuffer: SharedArrayBuffer;
  private readonly clockBuffer: SharedArrayBuffer;
  private readonly audioClock: LegendAudioClock;
  private readonly sharedReader: LegendSharedNotesReader;
  private readonly metadataProvider: MutableMetadataProvider;

  private readonly pendingCommands: LegendWorkerCommand[] = [];
  private readonly updateListeners = new Set<(data: GameEngineUpdate) => void>();
  private updateCallback?: (data: GameEngineUpdate) => void;
  private state: GameEngineState = createDefaultState();
  private readonly readyPromise: Promise<void>;
  private resolveReady: (() => void) | null = null;
  private isReady = false;
  private noteMetadata: NoteData[] = [];
  private noteIds: string[] = [];

  private judgmentCallback?: (judgment: JudgmentResult) => void;
  private keyHighlightCallback?: (pitch: number, timestamp: number) => void;

  constructor(
    initialSettings: GameSettings,
    options: LegendWorkerOptions = {}
  ) {
    const maxNotes = options.maxNotes ?? DEFAULT_MAX_SHARED_NOTES;
    this.notesBuffer = createSharedNotesBuffer(maxNotes);
    this.clockBuffer = createAudioClockBuffer();
    this.audioClock = new LegendAudioClock(this.clockBuffer);
    this.metadataProvider = new MutableMetadataProvider(
      () => this.noteMetadata,
      () => this.noteIds
    );
    this.sharedReader = new LegendSharedNotesReader(
      this.notesBuffer,
      this.metadataProvider
    );

    this.readyPromise = new Promise((resolve) => {
      this.resolveReady = resolve;
    });

    this.worker = new Worker(
      new URL('../workers/legendEngine.worker.ts', import.meta.url),
      { type: 'module' }
    );
    this.worker.onmessage = this.handleWorkerMessage;

    this.enqueueCommand({
      type: 'init',
      settings: initialSettings,
      notesBuffer: this.notesBuffer,
      clockBuffer: this.clockBuffer,
      maxNotes,
      notesMeta: this.noteMetadata,
      noteIds: this.noteIds
    });
  }

  private enqueueCommand(command: LegendWorkerCommand): void {
    if (!this.isReady) {
      this.pendingCommands.push(command);
      return;
    }
    this.worker.postMessage(command);
  }

  private flushPendingCommands(): void {
    while (this.pendingCommands.length > 0) {
      const command = this.pendingCommands.shift();
      if (command) {
        this.worker.postMessage(command);
      }
    }
  }

  private handleWorkerMessage = (event: MessageEvent<LegendWorkerMessage>): void => {
    const message = event.data;
    switch (message.type) {
      case 'ready':
        this.isReady = true;
        this.flushPendingCommands();
        this.resolveReady?.();
        break;
      case 'state':
        this.applyState(message.payload);
        break;
      case 'judgment':
        this.judgmentCallback?.(message.payload);
        break;
      case 'key-highlight':
        this.keyHighlightCallback?.(message.payload.pitch, message.payload.timestamp);
        break;
      case 'error':
        console.error('[LegendWorker]', message.message);
        break;
      default:
        break;
    }
  };

  private applyState(payload: LegendWorkerStatePayload): void {
    this.state = {
      ...this.state,
      currentTime: payload.currentTime,
      score: payload.score,
      timing: payload.timing
    };

    const update: GameEngineUpdate = {
      currentTime: payload.currentTime,
      activeNotes: [],
      timing: payload.timing,
      score: payload.score,
      abRepeatState: {
        start: null,
        end: null,
        enabled: false
      }
    };

    this.updateCallback?.(update);
    this.updateListeners.forEach((listener) => listener(update));
  }

  async ready(): Promise<void> {
    return this.readyPromise;
  }

  getSharedNotesReader(): LegendSharedNotesReader {
    return this.sharedReader;
  }

  setUpdateCallback(callback: (data: GameEngineUpdate) => void): void {
    this.updateCallback = callback;
  }

  addUpdateListener(listener: (data: GameEngineUpdate) => void): () => void {
    this.updateListeners.add(listener);
    return () => this.updateListeners.delete(listener);
  }

  setJudgmentCallback(callback: (judgment: JudgmentResult) => void): void {
    this.judgmentCallback = callback;
  }

  setKeyHighlightCallback(callback: (pitch: number, timestamp: number) => void): void {
    this.keyHighlightCallback = callback;
  }

  getState(): GameEngineState {
    return this.state;
  }

  loadSong(notes: NoteData[]): void {
    this.noteMetadata = notes.map((note, index) => ({
      ...note,
      id: note.id ?? `note-${index}`
    }));
    this.noteIds = this.noteMetadata.map((note, index) => note.id ?? `note-${index}`);

    this.enqueueCommand({
      type: 'load-song',
      notes: this.noteMetadata,
      noteIds: this.noteIds
    });
  }

  updateSettings(settings: GameSettings): void {
    this.enqueueCommand({
      type: 'update-settings',
      settings
    });
  }

  handleInput(note: number): void {
    this.enqueueCommand({
      type: 'handle-input',
      note
    });
  }

  start(audioContext: AudioContext): void {
    this.audioClock.start(audioContext);
    this.enqueueCommand({
      type: 'start',
      latencies: {
        baseLatency: audioContext.baseLatency ?? 0,
        outputLatency: audioContext.outputLatency ?? 0
      }
    });
  }

  pause(): void {
    this.audioClock.stop();
    this.enqueueCommand({ type: 'pause' });
  }

  stop(): void {
    this.audioClock.stop();
    this.enqueueCommand({ type: 'stop' });
  }

  seek(time: number): void {
    this.enqueueCommand({
      type: 'seek',
      time
    });
  }

  destroy(): void {
    this.audioClock.dispose();
    this.enqueueCommand({ type: 'dispose' });
    this.worker.terminate();
    this.updateListeners.clear();
  }
}
