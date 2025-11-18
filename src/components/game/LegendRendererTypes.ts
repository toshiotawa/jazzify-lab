import type { ActiveNote, TransposingInstrument } from '@/types';

export interface LegendRendererSettings {
  noteNameStyle: 'off' | 'abc' | 'solfege';
  simpleDisplayMode: boolean;
  pianoHeight: number;
  transpose: number;
  transposingInstrument: TransposingInstrument;
  practiceGuide: 'off' | 'key' | 'key_auto';
}

export interface LegendRendererInstance {
  readonly view: HTMLCanvasElement;
  updateNotes(activeNotes: ActiveNote[], currentTime?: number): void;
  updateSettings(settings: Partial<LegendRendererSettings>): void;
  setKeyCallbacks(onKeyPress: (note: number) => void, onKeyRelease: (note: number) => void): void;
  highlightKey(midiNote: number, active: boolean): void;
  resize(width: number, height: number): void;
  destroy(): void;
}
