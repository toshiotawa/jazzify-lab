import type { ActiveNote, TransposingInstrument } from '@/types';

export type LegendNoteNameStyle = 'off' | 'abc' | 'solfege';

export interface LegendRendererSettings {
  noteNameStyle: LegendNoteNameStyle;
  simpleDisplayMode: boolean;
  pianoHeight: number;
  transpose: number;
  transposingInstrument: TransposingInstrument;
  practiceGuide: 'off' | 'key' | 'key_auto';
  viewportHeight?: number;
  notesSpeed?: number;
  showHitLine?: boolean;
}

export interface LegendRendererInstance {
  updateNotes(notes: ActiveNote[], currentTime: number): void;
  updateSettings(settings: Partial<LegendRendererSettings>): void;
  setKeyCallbacks(onKeyPress: (note: number) => void, onKeyRelease: (note: number) => void): void;
  highlightKey(midiNote: number, active: boolean): void;
  setGuideHighlightsByMidiNotes?(midiNotes: number[]): void;
  setGuideHighlightsByPitchClasses?(pitchClasses: number[]): void;
  clearActiveHighlights?(): void;
  clearAllHighlights?(): void;
  resize(width: number, height: number): void;
  destroy(): void;
  readonly view: HTMLCanvasElement;
}
