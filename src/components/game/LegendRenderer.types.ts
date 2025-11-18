import type { ActiveNote } from '@/types';

export type LegendNoteNameStyle = 'off' | 'abc' | 'solfege';
export type LegendPracticeGuideMode = 'off' | 'key' | 'key_auto';

export interface LegendRendererSettings {
  noteNameStyle: LegendNoteNameStyle;
  simpleDisplayMode: boolean;
  pianoHeight: number;
  transpose: number;
  transposingInstrument: string;
  practiceGuide: LegendPracticeGuideMode;
  noteSpeed?: number;
  noteWidth?: number;
  noteHeight?: number;
  showHitLine?: boolean;
  viewportHeight?: number;
  timingAdjustment?: number;
}

export interface LegendRendererInstance {
  updateNotes(activeNotes: ActiveNote[], currentTime?: number): void;
  updateSettings(newSettings: Partial<LegendRendererSettings>): void;
  setKeyCallbacks(onKeyPress: (note: number) => void, onKeyRelease: (note: number) => void): void;
  highlightKey(midiNote: number, active: boolean): void;
  resize(width: number, height: number): void;
  destroy(): void;
  readonly view: HTMLCanvasElement;
}

export type LegendRendererReadyCallback = (renderer: LegendRendererInstance | null) => void;
