import React, { useEffect, useRef } from 'react';
import type { ActiveNote, TransposingInstrument } from '@/types';
import { cn } from '@/utils/cn';
import { log } from '@/utils/logger';
import platform from '@/platform';
import { unifiedFrameController } from '@/utils/performanceOptimizer';

const MIDI_MIN = 21;
const MIDI_MAX = 108;
const NOTE_LOOKAHEAD_SECONDS = 5;
const NOTE_MIN_WIDTH = 8;
const NOTE_MIN_HEIGHT = 4;

type NoteNameStyle = 'off' | 'abc' | 'solfege';

interface RendererSettings {
  noteWidth: number;
  noteHeight: number;
  pianoHeight: number;
  noteSpeed: number;
  noteNameStyle: NoteNameStyle;
  simpleDisplayMode: boolean;
  transpose: number;
  transposingInstrument: TransposingInstrument;
  practiceGuide?: 'off' | 'key' | 'key_auto';
  viewportHeight: number;
  showHitLine: boolean;
  timingAdjustment: number;
  colors: {
    visible: string;
    visibleBlack: string;
    hit: string;
    missed: string;
    whiteKey: string;
    blackKey: string;
    activeKey: string;
    guideKey: string;
    grid: string;
    hitLine: string;
  };
}

interface PIXINotesRendererProps {
  width: number;
  height: number;
  onReady?: (renderer: PIXINotesRendererInstance | null) => void;
  className?: string;
}

interface KeyLayout {
  midi: number;
  x: number;
  width: number;
  isBlack: boolean;
}

interface CanvasNoteEntry {
  id: string;
  source: ActiveNote;
  frameId: number;
}

interface LabelGlyph {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

const INSTRUMENT_TRANSPOSITION: Record<TransposingInstrument, number> = {
  concert_pitch: 0,
  bb_major_2nd: 2,
  bb_major_9th: 14,
  eb_major_6th: 9,
  eb_major_13th: 21
};

const DEFAULT_COLORS = {
  visible: '#3B82F6',
  visibleBlack: '#1E40AF',
  hit: '#10B981',
  missed: '#EF4444',
  whiteKey: '#F8FAFC',
  blackKey: '#111827',
  activeKey: '#F97316',
  guideKey: '#22C55E',
  grid: '#1F2937',
  hitLine: '#FDE68A'
};

const HIT_STATES: ActiveNote['state'][] = ['hit', 'good', 'perfect'];

const isBlackKey = (midi: number): boolean => {
  const noteInOctave = midi % 12;
  return noteInOctave === 1 || noteInOctave === 3 || noteInOctave === 6 || noteInOctave === 8 || noteInOctave === 10;
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const stripOctave = (noteName: string): string => noteName.replace(/\d+$/, '');

const complexToSimpleMap: Record<string, string> = {
  'B#': 'C',
  'E#': 'F',
  Cb: 'B',
  Fb: 'E',
  Ax: 'B',
  Bx: 'C#',
  Cx: 'D',
  Dx: 'Eb',
  Ex: 'F#',
  Fx: 'G',
  Gx: 'A',
  Abb: 'G',
  Bbb: 'A',
  Cbb: 'Bb',
  Dbb: 'C',
  Ebb: 'D',
  Fbb: 'Eb',
  Gbb: 'F'
};

const englishToSolfegeMap: Record<string, string> = {
  C: 'ド',
  'C#': 'ド#',
  Db: 'レ♭',
  D: 'レ',
  'D#': 'レ#',
  Eb: 'ミ♭',
  E: 'ミ',
  F: 'ファ',
  'F#': 'ファ#',
  Gb: 'ソ♭',
  G: 'ソ',
  'G#': 'ソ#',
  Ab: 'ラ♭',
  A: 'ラ',
  'A#': 'ラ#',
  Bb: 'シ♭',
  B: 'シ'
};

class CanvasNotesRendererInstance {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private dpr: number;
  private settings: RendererSettings;
  private hitLineY: number;
  private backgroundGradient: CanvasGradient | null = null;
  private rafId: number | null = null;
  private isDestroyed = false;
  private needsRender = true;
  private lastEngineTime = 0;
  private frameMarker = 0;
  private readonly noteEntries = new Map<string, CanvasNoteEntry>();
  private readonly noteScratch: CanvasNoteEntry[] = [];
  private readonly labelCache = new Map<string, LabelGlyph>();
  private readonly keyLayouts: KeyLayout[] = [];
  private readonly pointerKeyMap = new Map<number, number>();
  private readonly userHighlights = new Set<number>();
  private readonly externalHighlights = new Set<number>();
  private readonly guideHighlights = new Set<number>();
  private onKeyPress?: (note: number) => void;
  private onKeyRelease?: (note: number) => void;

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.canvas = canvas;
    this.canvas.style.touchAction = 'none';
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context is not available');
    }
    this.ctx = context;
    this.settings = this.createDefaultSettings(height);
    this.dpr = platform.getWindow().devicePixelRatio || 1;
    this.width = width;
    this.height = height;
    this.hitLineY = this.height - this.settings.pianoHeight;
    this.resizeSurface(width, height);
    this.rebuildKeyLayouts();
    this.attachPointerEvents();
    this.startLoop();
  }

  updateNotes(activeNotes: ActiveNote[], currentTime?: number): void {
    if (typeof currentTime === 'number') {
      this.lastEngineTime = currentTime;
    }
    this.frameMarker += 1;
    for (const note of activeNotes) {
      let entry = this.noteEntries.get(note.id);
      if (!entry) {
        entry = { id: note.id, source: note, frameId: this.frameMarker };
        this.noteEntries.set(note.id, entry);
      } else {
        entry.source = note;
        entry.frameId = this.frameMarker;
      }
    }

    const obsoleteIds: string[] = [];
    this.noteEntries.forEach((entry, id) => {
      if (entry.frameId !== this.frameMarker) {
        obsoleteIds.push(id);
      }
    });
    for (const id of obsoleteIds) {
      this.noteEntries.delete(id);
    }

    this.scheduleRender();
  }

  updateSettings(partial: Partial<RendererSettings>): void {
    const merged: RendererSettings = {
      ...this.settings,
      ...partial,
      colors: {
        ...this.settings.colors,
        ...(partial.colors ?? {})
      }
    };
    merged.pianoHeight = Math.max(40, merged.pianoHeight);
    merged.noteHeight = Math.max(NOTE_MIN_HEIGHT, merged.noteHeight);
    this.settings = merged;
    this.hitLineY = this.height - this.settings.pianoHeight;
    this.backgroundGradient = null;
    this.rebuildKeyLayouts();
    this.scheduleRender();
  }

  highlightKey(midi: number, active: boolean): void {
    const clampedMidi = clamp(Math.round(midi), MIDI_MIN, MIDI_MAX);
    if (active) {
      this.externalHighlights.add(clampedMidi);
    } else {
      this.externalHighlights.delete(clampedMidi);
    }
    this.scheduleRender();
  }

  setGuideHighlightsByMidiNotes(midiNotes: number[]): void {
    this.guideHighlights.clear();
    midiNotes.forEach((note) => {
      const clampedMidi = clamp(Math.round(note), MIDI_MIN, MIDI_MAX);
      this.guideHighlights.add(clampedMidi);
    });
    this.scheduleRender();
  }

  setKeyCallbacks(onPress?: (note: number) => void, onRelease?: (note: number) => void): void {
    this.onKeyPress = onPress;
    this.onKeyRelease = onRelease;
  }

  destroy(): void {
    this.isDestroyed = true;
    if (this.rafId !== null) {
      platform.getWindow().cancelAnimationFrame(this.rafId);
    }
    this.detachPointerEvents();
    this.noteEntries.clear();
    this.labelCache.clear();
  }

  private createDefaultSettings(height: number): RendererSettings {
    return {
      noteWidth: 24,
      noteHeight: 6,
      pianoHeight: clamp(Math.round(height * 0.15), 60, 140),
      noteSpeed: 1,
      noteNameStyle: 'off',
      simpleDisplayMode: false,
      transpose: 0,
      transposingInstrument: 'concert_pitch',
      practiceGuide: 'key',
      viewportHeight: height,
      showHitLine: true,
      timingAdjustment: 0,
      colors: { ...DEFAULT_COLORS }
    };
  }

  private resizeSurface(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.hitLineY = this.height - this.settings.pianoHeight;
    this.backgroundGradient = null;
    this.dpr = platform.getWindow().devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.floor(width * this.dpr));
    this.canvas.height = Math.max(1, Math.floor(height * this.dpr));
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);
    this.scheduleRender();
  }

  private rebuildKeyLayouts(): void {
    this.keyLayouts.length = 0;
    const totalWhiteKeys = 52;
    const whiteWidth = this.width / totalWhiteKeys;
    const whitePositions = new Map<number, number>();
    let whiteIndex = 0;
    for (let midi = MIDI_MIN; midi <= MIDI_MAX; midi++) {
      if (!isBlackKey(midi)) {
        whitePositions.set(midi, whiteIndex);
        whiteIndex += 1;
      }
    }

    for (let midi = MIDI_MIN; midi <= MIDI_MAX; midi++) {
      if (isBlackKey(midi)) {
        const leftSlot = this.findNeighborWhiteSlot(midi, -1, whitePositions);
        const rightSlot = this.findNeighborWhiteSlot(midi, 1, whitePositions);
        const leftX = (leftSlot + 0.5) * whiteWidth;
        const rightX = (rightSlot + 0.5) * whiteWidth;
        const width = Math.max((rightX - leftX) * 0.6, whiteWidth * 0.55);
        this.keyLayouts.push({
          midi,
          x: (leftX + rightX) / 2,
          width,
          isBlack: true
        });
      } else {
        const slot = whitePositions.get(midi) ?? 0;
        this.keyLayouts.push({
          midi,
          x: (slot + 0.5) * whiteWidth,
          width: Math.max(whiteWidth - 2, NOTE_MIN_WIDTH),
          isBlack: false
        });
      }
    }

    this.settings.noteWidth = Math.max(whiteWidth * 0.75, NOTE_MIN_WIDTH);
    this.settings.noteHeight = Math.max(this.settings.noteHeight, NOTE_MIN_HEIGHT);
  }

  private findNeighborWhiteSlot(midi: number, direction: -1 | 1, whitePositions: Map<number, number>): number {
    let candidate = midi + direction;
    while (candidate >= MIDI_MIN && candidate <= MIDI_MAX) {
      const slot = whitePositions.get(candidate);
      if (typeof slot === 'number') {
        return slot;
      }
      candidate += direction;
    }
    return direction === -1 ? 0 : whitePositions.size - 1;
  }

  private startLoop(): void {
    const win = platform.getWindow();
    const step = (timestamp: number) => {
      if (this.isDestroyed) {
        return;
      }
      if (!unifiedFrameController.shouldSkipFrame(timestamp, 'render')) {
        unifiedFrameController.measurePhase('render', 'notesCanvas', () => {
          this.renderFrame();
        });
      }
      this.rafId = win.requestAnimationFrame(step);
    };
    this.rafId = win.requestAnimationFrame(step);
  }

  private renderFrame(): void {
    if (!this.needsRender) {
      return;
    }
    this.needsRender = false;

    this.drawBackground();
    this.drawNotes(false);
    this.drawNotes(true);
    this.drawHitLine();
    this.drawKeyboard();
  }

  private drawBackground(): void {
    if (!this.backgroundGradient) {
      this.backgroundGradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
      this.backgroundGradient.addColorStop(0, '#030712');
      this.backgroundGradient.addColorStop(1, '#0f172a');
    }
    this.ctx.fillStyle = this.backgroundGradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.strokeStyle = this.settings.colors.grid;
    this.ctx.lineWidth = 0.5;
    this.ctx.globalAlpha = 0.2;
    const gridCount = 4;
    const gridHeight = this.height - this.settings.pianoHeight;
    for (let i = 1; i < gridCount; i++) {
      const y = (gridHeight / gridCount) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
    this.ctx.globalAlpha = 1;
  }

  private drawNotes(blackPass: boolean): void {
    if (this.noteEntries.size === 0) {
      return;
    }
    this.noteScratch.length = 0;
    this.noteEntries.forEach((entry) => this.noteScratch.push(entry));

    for (const entry of this.noteScratch) {
      const note = entry.source;
      const effectivePitch = this.getEffectivePitch(note.pitch);
      const layout = this.getLayoutForPitch(effectivePitch);
      if (!layout || layout.isBlack !== blackPass) {
        continue;
      }
      if (HIT_STATES.includes(note.state)) {
        continue;
      }
      const y = this.computeNoteY(note);
      if (y < -this.settings.noteHeight || y > this.height + this.settings.noteHeight) {
        continue;
      }
      const width = layout.isBlack ? this.settings.noteWidth * 0.7 : this.settings.noteWidth;
      const x = layout.x - width / 2;
      this.ctx.fillStyle = this.resolveNoteColor(note, layout.isBlack);
      this.ctx.globalAlpha = note.state === 'missed' ? 0.85 : 1;
      this.ctx.fillRect(x, y - this.settings.noteHeight / 2, width, this.settings.noteHeight);
      this.ctx.globalAlpha = 1;

      const label = this.resolveLabelText(note, effectivePitch);
      if (label) {
        this.drawLabel(label, layout.x, y - this.settings.noteHeight);
      }
    }
  }

  private drawLabel(text: string, x: number, y: number): void {
    const key = `${this.settings.noteNameStyle}:${text}`;
    let glyph = this.labelCache.get(key);
    if (!glyph) {
      const fontSize = 12;
      const font = `600 ${fontSize}px 'Inter', 'Noto Sans JP', sans-serif`;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      ctx.font = font;
      const textWidth = ctx.measureText(text).width;
      const width = Math.ceil(textWidth) + 8;
      const height = fontSize + 6;
      canvas.width = width;
      canvas.height = height;
      const glyphCtx = canvas.getContext('2d');
      if (!glyphCtx) {
        return;
      }
      glyphCtx.font = font;
      glyphCtx.textBaseline = 'middle';
      glyphCtx.textAlign = 'center';
      glyphCtx.fillStyle = '#F8FAFC';
      glyphCtx.fillText(text, width / 2, height / 2);
      glyph = { canvas, width, height };
      this.labelCache.set(key, glyph);
    }
    this.ctx.drawImage(glyph.canvas, x - glyph.width / 2, y - glyph.height);
  }

  private drawHitLine(): void {
    if (!this.settings.showHitLine) {
      return;
    }
    this.ctx.strokeStyle = this.settings.colors.hitLine;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.hitLineY);
    this.ctx.lineTo(this.width, this.hitLineY);
    this.ctx.stroke();
  }

  private drawKeyboard(): void {
    const height = this.settings.pianoHeight;
    const whiteTop = this.hitLineY;
    this.keyLayouts
      .filter((layout) => !layout.isBlack)
      .forEach((layout) => {
        const color = this.resolveKeyColor(layout.midi, false);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(layout.x - layout.width / 2, whiteTop, layout.width, height);
        this.ctx.strokeStyle = '#0f172a';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(layout.x - layout.width / 2, whiteTop, layout.width, height);
      });

    const blackHeight = height * 0.6;
    this.keyLayouts
      .filter((layout) => layout.isBlack)
      .forEach((layout) => {
        const color = this.resolveKeyColor(layout.midi, true);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(layout.x - layout.width / 2, whiteTop, layout.width, blackHeight);
      });
  }

  private resolveNoteColor(note: ActiveNote, isBlack: boolean): string {
    if (note.state === 'missed') {
      return this.settings.colors.missed;
    }
    if (note.state === 'hit' || note.state === 'good' || note.state === 'perfect') {
      return this.settings.colors.hit;
    }
    return isBlack ? this.settings.colors.visibleBlack : this.settings.colors.visible;
  }

  private resolveKeyColor(midi: number, isBlack: boolean): string {
    if (this.userHighlights.has(midi) || this.externalHighlights.has(midi)) {
      return this.settings.colors.activeKey;
    }
    if (this.guideHighlights.has(midi) && this.settings.practiceGuide !== 'off') {
      return this.settings.colors.guideKey;
    }
    return isBlack ? this.settings.colors.blackKey : this.settings.colors.whiteKey;
  }

  private computeNoteY(note: ActiveNote): number {
    if (typeof note.y === 'number') {
      return note.y;
    }
    const displayTime = note.time + (this.settings.timingAdjustment || 0) / 1000;
    const currentTime = this.lastEngineTime;
    const timeToHit = displayTime - currentTime;
    const startY = -this.settings.noteHeight;
    const distance = this.hitLineY - startY;
    const pixelsPerSecond = distance / NOTE_LOOKAHEAD_SECONDS;
    const y = this.hitLineY - timeToHit * pixelsPerSecond;
    return clamp(y, startY - 50, this.height + 50);
  }

  private getEffectivePitch(pitch: number): number {
    return clamp(Math.round(pitch + this.settings.transpose), MIDI_MIN, MIDI_MAX);
  }

  private getLayoutForPitch(pitch: number): KeyLayout | undefined {
    return this.keyLayouts[pitch - MIDI_MIN];
  }

  private resolveLabelText(note: ActiveNote, effectivePitch: number): string | undefined {
    if (this.settings.noteNameStyle === 'off') {
      return undefined;
    }
    const rawName = note.noteName ? stripOctave(note.noteName) : this.getMidiNoteName(effectivePitch);
    if (!rawName) {
      return undefined;
    }
    if (this.settings.noteNameStyle === 'abc') {
      return this.settings.simpleDisplayMode ? this.simplifyEnglishName(rawName) : rawName;
    }
    const english = this.settings.simpleDisplayMode ? this.simplifyEnglishName(rawName) : rawName;
    return englishToSolfegeMap[english] ?? english;
  }

  private getMidiNoteName(pitch: number): string {
    const offset = INSTRUMENT_TRANSPOSITION[this.settings.transposingInstrument] || 0;
    const adjusted = pitch + offset;
    const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return names[((adjusted % 12) + 12) % 12];
  }

  private simplifyEnglishName(name: string): string {
    return complexToSimpleMap[name] ?? name;
  }

  private attachPointerEvents(): void {
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerUp);
    this.canvas.addEventListener('pointerleave', this.handlePointerUp);
  }

  private detachPointerEvents(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
    this.canvas.removeEventListener('pointerleave', this.handlePointerUp);
  }

  private handlePointerDown = (event: PointerEvent): void => {
    event.preventDefault();
    const note = this.getMidiFromPointer(event);
    if (note === null) {
      return;
    }
    try {
      (event.target as Element)?.setPointerCapture?.(event.pointerId);
    } catch {
      // ignore capture errors
    }
    this.pointerKeyMap.set(event.pointerId, note);
    this.userHighlights.add(note);
    this.onKeyPress?.(note);
    this.scheduleRender();
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (!this.pointerKeyMap.has(event.pointerId)) {
      return;
    }
    const nextNote = this.getMidiFromPointer(event);
    if (nextNote === null) {
      return;
    }
    const currentNote = this.pointerKeyMap.get(event.pointerId);
    if (currentNote === nextNote) {
      return;
    }
    if (typeof currentNote === 'number') {
      this.userHighlights.delete(currentNote);
      this.onKeyRelease?.(currentNote);
    }
    this.pointerKeyMap.set(event.pointerId, nextNote);
    this.userHighlights.add(nextNote);
    this.onKeyPress?.(nextNote);
    this.scheduleRender();
  };

  private handlePointerUp = (event: PointerEvent): void => {
    const note = this.pointerKeyMap.get(event.pointerId);
    if (typeof note === 'number') {
      this.pointerKeyMap.delete(event.pointerId);
      this.userHighlights.delete(note);
      this.onKeyRelease?.(note);
      this.scheduleRender();
    }
  };

  private getMidiFromPointer(event: PointerEvent): number | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (y < this.hitLineY) {
      return null;
    }
    const isBlackZone = y < this.hitLineY + this.settings.pianoHeight * 0.6;
    if (isBlackZone) {
      for (const layout of this.keyLayouts) {
        if (!layout.isBlack) continue;
        if (Math.abs(x - layout.x) <= layout.width / 2) {
          return layout.midi;
        }
      }
    }
    for (const layout of this.keyLayouts) {
      if (layout.isBlack) continue;
      if (Math.abs(x - layout.x) <= layout.width / 2) {
        return layout.midi;
      }
    }
    return null;
  }

  private scheduleRender(): void {
    this.needsRender = true;
  }
}

export const PIXINotesRenderer: React.FC<PIXINotesRendererProps> = ({ width, height, onReady, className }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    let instance: CanvasNotesRendererInstance | null = null;
    try {
      instance = new CanvasNotesRendererInstance(canvas, width, height);
      onReady?.(instance);
    } catch (error) {
      log.error('❌ Failed to initialize Canvas renderer:', error);
    }
    return () => {
      if (instance) {
        instance.destroy();
        if (onReady) {
          onReady(null);
        }
      }
    };
  }, [width, height, onReady]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Notes renderer"
      className={cn('block outline-none', className)}
    />
  );
};

export type PIXINotesRendererInstance = CanvasNotesRendererInstance;

export default PIXINotesRenderer;
