import React, { useEffect, useRef } from 'react';
import type { ActiveNote } from '@/types';
import { midiToDisplayName } from '@/utils/display-note';
import { unifiedFrameController } from '@/utils/performanceOptimizer';
import { log } from '@/utils/logger';
import { cn } from '@/utils/cn';
import type { LegendRendererInstance, LegendRendererSettings } from './LegendRenderer.types';

interface CanvasNotesRendererProps {
  width: number;
  height: number;
  onReady?: (renderer: LegendRendererInstance | null) => void;
  className?: string;
}

type RenderableNoteState = ActiveNote['state'];

interface RenderableNote {
  id: string;
  pitch: number;
  state: RenderableNoteState;
  y?: number;
  noteName?: string;
}

interface KeyLayout {
  midi: number;
  x: number;
  width: number;
  isBlack: boolean;
}

const MIN_MIDI = 21;
const MAX_MIDI = 108;
const TOTAL_WHITE_KEYS = 52;
const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);
const MAX_RENDERED_NOTES = 256;
const NOTE_HEIGHT = 10;
const BLACK_KEY_HEIGHT_RATIO = 0.64;

const DEFAULT_SETTINGS: LegendRendererSettings = {
  noteNameStyle: 'off',
  simpleDisplayMode: false,
  pianoHeight: 80,
  transpose: 0,
  transposingInstrument: 'concert_pitch',
  practiceGuide: 'off',
  viewportHeight: 600,
  notesSpeed: 1,
  showHitLine: true
};

const clamp = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
};

const isRenderableState = (state: RenderableNoteState): boolean => {
  return state !== 'completed';
};

class CanvasNotesRendererInstance implements LegendRendererInstance {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private destroyed = false;
  private settings: LegendRendererSettings = { ...DEFAULT_SETTINGS };
  private readonly renderableNotes: RenderableNote[] = [];
  private highlightedKeys: Set<number> = new Set();
  private guideHighlightedKeys: Set<number> = new Set();
  private pointerNotes: Map<number, number> = new Map();
  private onKeyPress?: (note: number) => void;
  private onKeyRelease?: (note: number) => void;
  private keyLayouts: KeyLayout[] = [];
  private logicalWidth: number;
  private logicalHeight: number;
  private noteAreaHeight: number;
  private readonly pointerDownHandler: (event: PointerEvent) => void;
  private readonly pointerMoveHandler: (event: PointerEvent) => void;
  private readonly pointerUpHandler: (event: PointerEvent) => void;

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context is not available');
    }

    this.canvas = canvas;
    this.ctx = context;
    this.logicalWidth = width;
    this.logicalHeight = height;
    this.noteAreaHeight = Math.max(0, height - this.settings.pianoHeight);

    this.canvas.style.backgroundColor = '#05070f';
    this.canvas.style.touchAction = 'none';

    this.pointerDownHandler = (event: PointerEvent) => {
      this.handlePointerDown(event);
    };
    this.pointerMoveHandler = (event: PointerEvent) => {
      this.handlePointerMove(event);
    };
    this.pointerUpHandler = (event: PointerEvent) => {
      this.handlePointerUp(event);
    };

    this.attachPointerHandlers();
    this.resize(width, height);
    this.startRenderLoop();

    log.info('🖌️ CanvasNotesRenderer initialized');
  }

  updateNotes(notes: ActiveNote[], _currentTime: number): void {
    if (this.destroyed) return;
    this.snapshotNotes(notes);
  }

  updateSettings(partial: Partial<LegendRendererSettings>): void {
    if (this.destroyed) return;
    this.settings = { ...this.settings, ...partial };
    this.noteAreaHeight = Math.max(0, this.logicalHeight - this.settings.pianoHeight);
  }

  setKeyCallbacks(onKeyPress: (note: number) => void, onKeyRelease: (note: number) => void): void {
    this.onKeyPress = onKeyPress;
    this.onKeyRelease = onKeyRelease;
  }

  highlightKey(midiNote: number, active: boolean): void {
    const clampedMidi = clamp(Math.round(midiNote), MIN_MIDI, MAX_MIDI);
    if (active) {
      this.highlightedKeys.add(clampedMidi);
    } else {
      this.highlightedKeys.delete(clampedMidi);
    }
  }

  setGuideHighlightsByMidiNotes(midiNotes: number[]): void {
    this.guideHighlightedKeys = new Set(
      midiNotes
        .map((note) => clamp(Math.round(note), MIN_MIDI, MAX_MIDI))
        .filter((note) => note >= MIN_MIDI && note <= MAX_MIDI)
    );
  }

  setGuideHighlightsByPitchClasses(pitchClasses: number[]): void {
    const normalized = new Set(
      pitchClasses.map((pc) => {
        const normalizedPc = pc % 12;
        return normalizedPc < 0 ? normalizedPc + 12 : normalizedPc;
      })
    );
    const midiSet: number[] = [];
    for (let midi = MIN_MIDI; midi <= MAX_MIDI; midi += 1) {
      if (normalized.has(midi % 12)) {
        midiSet.push(midi);
      }
    }
    this.setGuideHighlightsByMidiNotes(midiSet);
  }

  clearActiveHighlights(): void {
    this.highlightedKeys.clear();
  }

  clearAllHighlights(): void {
    this.highlightedKeys.clear();
    this.guideHighlightedKeys.clear();
  }

  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) {
      return;
    }

    this.logicalWidth = width;
    this.logicalHeight = height;
    this.noteAreaHeight = Math.max(0, this.logicalHeight - this.settings.pianoHeight);
    const devicePixelRatio = window.devicePixelRatio || 1;

    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.canvas.width = Math.round(width * devicePixelRatio);
    this.canvas.height = Math.round(height * devicePixelRatio);

    this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    this.recalculateKeyLayout();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.detachPointerHandlers();
    this.highlightedKeys.clear();
    this.guideHighlightedKeys.clear();
    this.pointerNotes.clear();
  }

  get view(): HTMLCanvasElement {
    return this.canvas;
  }

  private attachPointerHandlers(): void {
    this.canvas.addEventListener('pointerdown', this.pointerDownHandler);
    this.canvas.addEventListener('pointermove', this.pointerMoveHandler);
    this.canvas.addEventListener('pointerup', this.pointerUpHandler);
    this.canvas.addEventListener('pointercancel', this.pointerUpHandler);
    this.canvas.addEventListener('pointerleave', this.pointerUpHandler);
  }

  private detachPointerHandlers(): void {
    this.canvas.removeEventListener('pointerdown', this.pointerDownHandler);
    this.canvas.removeEventListener('pointermove', this.pointerMoveHandler);
    this.canvas.removeEventListener('pointerup', this.pointerUpHandler);
    this.canvas.removeEventListener('pointercancel', this.pointerUpHandler);
    this.canvas.removeEventListener('pointerleave', this.pointerUpHandler);
  }

  private startRenderLoop(): void {
    const render = () => {
      if (this.destroyed) {
        return;
      }

      const now = performance.now();
      if (!unifiedFrameController.shouldSkipFrame(now, 'render')) {
        this.drawFrame();
      }

      this.animationFrameId = requestAnimationFrame(render);
    };

    this.animationFrameId = requestAnimationFrame(render);
  }

  private drawFrame(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);
    this.drawBackground(ctx);
    this.drawNotes(ctx);
    this.drawHitLine(ctx);
    this.drawPiano(ctx);
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const gradient = ctx.createLinearGradient(0, 0, 0, this.noteAreaHeight);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#030712');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.logicalWidth, this.noteAreaHeight);
    ctx.restore();
  }

  private drawNotes(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, this.logicalWidth, this.noteAreaHeight);
    ctx.clip();

    for (let i = 0; i < this.renderableNotes.length; i += 1) {
      const note = this.renderableNotes[i];
      if (!isRenderableState(note.state)) {
        continue;
      }

      const effectivePitch = this.applyTranspose(note.pitch);
      const layout = this.getKeyLayout(effectivePitch);
      if (!layout) {
        continue;
      }

      const noteColor = this.resolveNoteColor(note.state, layout.isBlack);
      const noteWidth = layout.width * (layout.isBlack ? 0.7 : 0.8);
      const x = layout.x + (layout.width - noteWidth) / 2;
      const yCenter = this.deriveNoteY(note);
      const yTop = yCenter - NOTE_HEIGHT;
      ctx.fillStyle = noteColor;
      ctx.globalAlpha = note.state === 'missed' ? 0.6 : 1;
      ctx.fillRect(x, yTop, noteWidth, NOTE_HEIGHT * 2);

      const label = this.getNoteLabel(note, effectivePitch);
      if (label) {
        ctx.fillStyle = '#0f172a';
        ctx.font = `${Math.max(10, Math.min(16, layout.width * 0.35))}px 'Inter', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + noteWidth / 2, yCenter);
      }
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  private drawHitLine(ctx: CanvasRenderingContext2D): void {
    if (!this.settings.showHitLine) {
      return;
    }
    const hitLineY = this.noteAreaHeight;
    ctx.save();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(0, hitLineY);
    ctx.lineTo(this.logicalWidth, hitLineY);
    ctx.stroke();
    ctx.restore();
  }

  private drawPiano(ctx: CanvasRenderingContext2D): void {
    const pianoTop = this.logicalHeight - this.settings.pianoHeight;
    if (pianoTop < 0) {
      return;
    }

    ctx.save();
    ctx.translate(0, pianoTop);

    for (const layout of this.keyLayouts) {
      if (layout.isBlack) continue;
      const color = this.resolveKeyColor(layout.midi, false);
      ctx.fillStyle = color;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.fillRect(layout.x, 0, layout.width, this.settings.pianoHeight);
      ctx.strokeRect(layout.x, 0, layout.width, this.settings.pianoHeight);
    }

    for (const layout of this.keyLayouts) {
      if (!layout.isBlack) continue;
      const color = this.resolveKeyColor(layout.midi, true);
      const keyHeight = this.settings.pianoHeight * BLACK_KEY_HEIGHT_RATIO;
      ctx.fillStyle = color;
      ctx.fillRect(layout.x, 0, layout.width, keyHeight);
    }

    ctx.restore();
  }

  private snapshotNotes(notes: ActiveNote[]): void {
    const length = Math.min(notes.length, MAX_RENDERED_NOTES);
    if (this.renderableNotes.length > length) {
      this.renderableNotes.length = length;
    }

    for (let i = 0; i < length; i += 1) {
      const source = notes[i];
      const existing = this.renderableNotes[i];
      const target: RenderableNote = existing ?? {
        id: source.id,
        pitch: source.pitch,
        state: source.state,
        y: source.y,
        noteName: source.noteName
      };
      target.id = source.id;
      target.pitch = source.pitch;
      target.state = source.state;
      target.y = source.y;
      target.noteName = source.noteName;
      this.renderableNotes[i] = target;
    }
  }

  private recalculateKeyLayout(): void {
    const whiteKeyWidth = this.logicalWidth / TOTAL_WHITE_KEYS;
    const blackKeyWidth = whiteKeyWidth * 0.6;
    const layouts: KeyLayout[] = [];
    let currentWhiteIndex = 0;

    for (let midi = MIN_MIDI; midi <= MAX_MIDI; midi += 1) {
      const isBlack = BLACK_PITCH_CLASSES.has(midi % 12);
      if (isBlack) {
        const prevWhiteIndex = Math.max(0, currentWhiteIndex - 1);
        const nextWhiteIndex = prevWhiteIndex + 1;
        const prevX = prevWhiteIndex * whiteKeyWidth;
        const nextX = nextWhiteIndex * whiteKeyWidth;
        const centerX = prevX + (nextX - prevX) / 2;
        layouts.push({
          midi,
          x: centerX - blackKeyWidth / 2,
          width: blackKeyWidth,
          isBlack: true
        });
      } else {
        layouts.push({
          midi,
          x: currentWhiteIndex * whiteKeyWidth,
          width: whiteKeyWidth,
          isBlack: false
        });
        currentWhiteIndex += 1;
      }
    }

    this.keyLayouts = layouts;
  }

  private getKeyLayout(midi: number): KeyLayout | undefined {
    for (let i = 0; i < this.keyLayouts.length; i += 1) {
      const layout = this.keyLayouts[i];
      if (layout.midi === midi) {
        return layout;
      }
    }
    return undefined;
  }

  private resolveNoteColor(state: RenderableNoteState, isBlack: boolean): string {
    switch (state) {
      case 'hit':
      case 'good':
      case 'perfect':
        return '#34d399';
      case 'missed':
        return '#f87171';
      default:
        return isBlack ? '#1d4ed8' : '#60a5fa';
    }
  }

  private resolveKeyColor(midi: number, isBlack: boolean): string {
    if (this.highlightedKeys.has(midi)) {
      return '#fb923c';
    }
    if (this.guideHighlightedKeys.has(midi)) {
      return '#22c55e';
    }
    return isBlack ? '#0f172a' : '#f8fafc';
  }

  private deriveNoteY(note: RenderableNote): number {
    if (typeof note.y === 'number') {
      return note.y;
    }
    return this.noteAreaHeight;
  }

  private getNoteLabel(note: RenderableNote, midi: number): string | null {
    if (this.settings.noteNameStyle === 'off') {
      return null;
    }
    const lang = this.settings.noteNameStyle === 'solfege' ? 'solfege' : 'en';
    if (note.noteName) {
      return midiToDisplayName(midi, {
        lang,
        simple: this.settings.simpleDisplayMode
      });
    }
    return midiToDisplayName(midi, {
      lang,
      simple: this.settings.simpleDisplayMode
    });
  }

  private applyTranspose(pitch: number): number {
    const result = pitch + (this.settings.transpose ?? 0);
    return clamp(Math.round(result), MIN_MIDI, MAX_MIDI);
  }

  private handlePointerDown(event: PointerEvent): void {
    const midi = this.getMidiFromPointerEvent(event);
    if (midi === null) {
      return;
    }
    this.pointerNotes.set(event.pointerId, midi);
    this.canvas.setPointerCapture(event.pointerId);
    this.highlightKey(midi, true);
    this.onKeyPress?.(midi);
  }

  private handlePointerMove(event: PointerEvent): void {
    if (!this.pointerNotes.has(event.pointerId)) {
      return;
    }
    const midi = this.getMidiFromPointerEvent(event);
    if (midi === null) {
      return;
    }
    const previousMidi = this.pointerNotes.get(event.pointerId);
    if (previousMidi === midi) {
      return;
    }
    if (typeof previousMidi === 'number') {
      this.highlightKey(previousMidi, false);
      this.onKeyRelease?.(previousMidi);
    }
    this.pointerNotes.set(event.pointerId, midi);
    this.highlightKey(midi, true);
    this.onKeyPress?.(midi);
  }

  private handlePointerUp(event: PointerEvent): void {
    const midi = this.pointerNotes.get(event.pointerId);
    if (typeof midi === 'number') {
      this.highlightKey(midi, false);
      this.onKeyRelease?.(midi);
      this.pointerNotes.delete(event.pointerId);
    }
    try {
      this.canvas.releasePointerCapture(event.pointerId);
    } catch {
      // ignore capture errors
    }
  }

  private getMidiFromPointerEvent(event: PointerEvent): number | null {
    const rect = this.canvas.getBoundingClientRect();
    const xRatio = (event.clientX - rect.left) / rect.width;
    const yRatio = (event.clientY - rect.top) / rect.height;
    if (xRatio < 0 || xRatio > 1 || yRatio < 0 || yRatio > 1) {
      return null;
    }
    const x = xRatio * this.logicalWidth;
    const y = yRatio * this.logicalHeight;
    const pianoTop = this.logicalHeight - this.settings.pianoHeight;
    if (y < pianoTop) {
      return null;
    }
    const relativeY = y - pianoTop;

    // Check black keys first for proper overlap handling
    for (const layout of this.keyLayouts) {
      if (!layout.isBlack) continue;
      const keyHeight = this.settings.pianoHeight * BLACK_KEY_HEIGHT_RATIO;
      if (
        x >= layout.x &&
        x <= layout.x + layout.width &&
        relativeY >= 0 &&
        relativeY <= keyHeight
      ) {
        return layout.midi;
      }
    }

    for (const layout of this.keyLayouts) {
      if (layout.isBlack) continue;
      if (
        x >= layout.x &&
        x <= layout.x + layout.width &&
        relativeY >= 0 &&
        relativeY <= this.settings.pianoHeight
      ) {
        return layout.midi;
      }
    }

    return null;
  }
}

export const CanvasNotesRenderer: React.FC<CanvasNotesRendererProps> = ({
  width,
  height,
  onReady,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasNotesRendererInstance | null>(null);
  const initialSizeRef = useRef<{ width: number; height: number }>({ width, height });

  useEffect(() => {
    if (!canvasRef.current || rendererRef.current) {
      return;
    }
    const initialSize = initialSizeRef.current;
    const renderer = new CanvasNotesRendererInstance(
      canvasRef.current,
      initialSize.width,
      initialSize.height
    );
    rendererRef.current = renderer;
    onReady?.(renderer);

    return () => {
      onReady?.(null);
      renderer.destroy();
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      onReady?.(rendererRef.current);
    }
  }, [onReady]);

  useEffect(() => {
    rendererRef.current?.resize(width, height);
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('block touch-none select-none', className)}
    />
  );
};

export default CanvasNotesRenderer;
