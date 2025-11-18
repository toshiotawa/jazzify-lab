import React, { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import type { ActiveNote, TransposingInstrument } from '@/types';
import { log } from '@/utils/logger';
import type { DisplayOpts } from '@/utils/display-note';
import { midiToDisplayName, toDisplayName } from '@/utils/display-note';

const MIDI_RANGE_START = 21;
const MIDI_RANGE_END = 108;
const WHITE_KEY_STEPS = new Set([0, 2, 4, 5, 7, 9, 11]);

const WHITE_KEY_ORDER: number[] = [];
const BLACK_KEY_ORDER: number[] = [];
for (let midi = MIDI_RANGE_START; midi <= MIDI_RANGE_END; midi += 1) {
  if (WHITE_KEY_STEPS.has(midi % 12)) {
    WHITE_KEY_ORDER.push(midi);
  } else {
    BLACK_KEY_ORDER.push(midi);
  }
}
const TOTAL_WHITE_KEYS = WHITE_KEY_ORDER.length;

type PracticeGuideMode = 'off' | 'key' | 'key_auto';

interface LegendRendererSettings {
  pianoHeight: number;
  noteNameStyle: 'off' | 'abc' | 'solfege';
  simpleDisplayMode: boolean;
  transpose: number;
  transposingInstrument: TransposingInstrument;
  practiceGuide: PracticeGuideMode;
  notesSpeed: number;
  viewportHeight: number;
}

interface KeyMetrics {
  midi: number;
  x: number;
  width: number;
  isBlack: boolean;
}

const NOTE_COLORS: Record<ActiveNote['state'], string> = {
  waiting: '#1f2937',
  visible: '#3b82f6',
  hit: '#10b981',
  good: '#22c55e',
  perfect: '#facc15',
  missed: '#f87171',
  completed: '#6b7280'
};

const clamp = (value: number, min: number, max: number): number => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

const isWhiteKey = (midi: number): boolean => WHITE_KEY_STEPS.has(((midi % 12) + 12) % 12);

const BLACK_CENTER_OFFSET: Record<number, number> = {
  1: 0.58,
  3: 0.58,
  6: 0.58,
  8: 0.58,
  10: 0.58
};

const createTextMetrics = (label: string, opts: DisplayOpts): string => {
  if (!label) {
    return '';
  }
  return toDisplayName(label, opts);
};

export class LegendCanvasRendererInstance {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private settings: LegendRendererSettings;
  private activeNotes: ActiveNote[] = [];
  private currentTime = 0;
  private keyMetrics: Map<number, KeyMetrics> = new Map();
  private whiteKeyWidth = 0;
  private highlightedKeys: Set<number> = new Set();
  private guideHighlightedKeys: Set<number> = new Set();
  private onKeyPress?: (note: number) => void;
  private onKeyRelease?: (note: number) => void;
  private pointerActive: Map<number, number> = new Map();
  private pendingFrame = false;
  private rafId: number | null = null;
  private destroyed = false;

  private readonly handlePointerDown = (event: PointerEvent): void => {
    const position = this.translatePointer(event);
    if (!position) return;
    const midi = this.pickMidiFromPosition(position.x, position.y);
    if (midi === null) return;
    this.pointerActive.set(event.pointerId, midi);
    this.canvas.setPointerCapture?.(event.pointerId);
    this.highlightKey(midi, true);
    this.onKeyPress?.(midi);
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    const midi = this.pointerActive.get(event.pointerId);
    if (midi === undefined) return;
    this.pointerActive.delete(event.pointerId);
    this.highlightKey(midi, false);
    this.onKeyRelease?.(midi);
  };

  private readonly handlePointerCancel = (event: PointerEvent): void => {
    const midi = this.pointerActive.get(event.pointerId);
    if (midi === undefined) return;
    this.pointerActive.delete(event.pointerId);
    this.highlightKey(midi, false);
    this.onKeyRelease?.(midi);
  };

  constructor(width: number, height: number) {
    this.canvas = document.createElement('canvas');
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context not available');
    }
    this.ctx = context;
    this.width = width;
    this.height = height;
    this.settings = {
      pianoHeight: 80,
      noteNameStyle: 'off',
      simpleDisplayMode: false,
      transpose: 0,
      transposingInstrument: 'concert_pitch',
      practiceGuide: 'off',
      notesSpeed: 1.0,
      viewportHeight: height
    };

    this.configureCanvasElement();
    this.resizeCanvas(width, height);
    this.attachPointerHandlers();
    this.requestRender();
    log.info('🎨 LegendCanvasRendererInstance initialized', { width, height });
  }

  get view(): HTMLCanvasElement {
    return this.canvas;
  }

  updateNotes(notes: ActiveNote[], currentTime: number): void {
    this.activeNotes = notes.slice();
    this.currentTime = currentTime;
    this.requestRender();
  }

  updateSettings(newSettings: Partial<LegendRendererSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    if (typeof newSettings.viewportHeight === 'number') {
      this.height = Math.max(newSettings.viewportHeight, this.settings.pianoHeight + 40);
      this.resizeCanvas(this.width, this.height);
    }
    this.requestRender();
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.resizeCanvas(width, height);
    this.requestRender();
  }

  setKeyCallbacks(onPress: (note: number) => void, onRelease: (note: number) => void): void {
    this.onKeyPress = onPress;
    this.onKeyRelease = onRelease;
  }

  highlightKey(midiNote: number, active: boolean): void {
    if (active) {
      this.highlightedKeys.add(midiNote);
    } else {
      this.highlightedKeys.delete(midiNote);
    }
    this.requestRender();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.detachPointerHandlers();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pointerActive.clear();
    this.activeNotes = [];
  }

  private configureCanvasElement(): void {
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.touchAction = 'pan-x';
    this.canvas.style.userSelect = 'none';
  }

  private resizeCanvas(width: number, height: number): void {
    const ratio = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(width * ratio);
    this.canvas.height = Math.floor(height * ratio);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(ratio, ratio);
    this.computeKeyMetrics();
  }

  private attachPointerHandlers(): void {
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerCancel);
    this.canvas.addEventListener('pointerleave', this.handlePointerCancel);
  }

  private detachPointerHandlers(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerCancel);
    this.canvas.removeEventListener('pointerleave', this.handlePointerCancel);
  }

  private translatePointer(event: PointerEvent): { x: number; y: number } | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (Number.isNaN(x) || Number.isNaN(y)) {
      return null;
    }
    return { x, y };
  }

  private pickMidiFromPosition(x: number, y: number): number | null {
    const keyboardTop = this.height - this.settings.pianoHeight;
    if (y < keyboardTop || y > this.height) {
      return null;
    }

    const blackKeyRegion = keyboardTop + this.settings.pianoHeight * 0.6;
    if (y < blackKeyRegion) {
      for (const midi of BLACK_KEY_ORDER) {
        const metrics = this.keyMetrics.get(midi);
        if (!metrics) continue;
        if (x >= metrics.x && x <= metrics.x + metrics.width) {
          return midi;
        }
      }
    }

    const rawIndex = Math.floor(x / this.whiteKeyWidth);
    const clamped = clamp(rawIndex, 0, WHITE_KEY_ORDER.length - 1);
    return WHITE_KEY_ORDER[clamped] ?? null;
  }

  private requestRender(): void {
    if (this.destroyed) return;
    if (this.pendingFrame) return;
    this.pendingFrame = true;
    this.rafId = requestAnimationFrame(() => {
      this.pendingFrame = false;
      this.draw();
    });
  }

  private draw(): void {
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawBackground();
    this.drawNotes();
    this.drawHitLine();
    this.drawKeyboard();
    this.ctx.restore();
  }

  private drawBackground(): void {
    const keyboardTop = this.height - this.settings.pianoHeight;
    this.ctx.fillStyle = '#05070f';
    this.ctx.fillRect(0, 0, this.width, keyboardTop);
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, keyboardTop, this.width, this.settings.pianoHeight);
  }

  private drawNotes(): void {
    if (!this.activeNotes.length) return;
    const laneHeight = this.height - this.settings.pianoHeight;
    const speed = Math.max(0.25, this.settings.notesSpeed);
    const lookaheadSeconds = 4 / speed;
    const pixelPerSecond = laneHeight / lookaheadSeconds;
    const noteHeight = Math.max(8, pixelPerSecond * 0.15);
    const tailSeconds = 0.6;

    const labelOpts: DisplayOpts = {
      lang: this.settings.noteNameStyle === 'solfege' ? 'solfege' : 'en',
      simple: this.settings.simpleDisplayMode
    };

    for (const note of this.activeNotes) {
      const timeDiff = note.time - this.currentTime;
      if (timeDiff < -tailSeconds) {
        continue;
      }
      const y = laneHeight - timeDiff * pixelPerSecond;
      if (y + noteHeight < 0 || y > this.height) {
        continue;
      }

      const metrics = this.getKeyMetrics(note.pitch);
      if (!metrics) {
        continue;
      }

      const color = NOTE_COLORS[note.state] ?? NOTE_COLORS.visible;
      this.ctx.fillStyle = color;
      const width = metrics.isBlack ? metrics.width * 0.9 : metrics.width * 0.85;
      const x = metrics.x + (metrics.width - width) / 2;
      this.ctx.globalAlpha = metrics.isBlack ? 0.9 : 0.8;
      this.ctx.fillRect(x, y - noteHeight, width, noteHeight);
      this.ctx.globalAlpha = 1;

      if (this.settings.noteNameStyle !== 'off') {
        const label = this.resolveNoteLabel(note, labelOpts);
        if (label) {
          this.ctx.fillStyle = '#f8fafc';
          this.ctx.font = '12px "Inter", "Noto Sans JP", sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(label, x + width / 2, y - noteHeight + 14);
        }
      }
    }
  }

  private drawHitLine(): void {
    const y = this.height - this.settings.pianoHeight;
    this.ctx.strokeStyle = '#fbbf24';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([6, 6]);
    this.ctx.beginPath();
    this.ctx.moveTo(0, y);
    this.ctx.lineTo(this.width, y);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  private drawKeyboard(): void {
    const keyboardTop = this.height - this.settings.pianoHeight;
    const blackHeight = this.settings.pianoHeight * 0.6;

    for (const midi of WHITE_KEY_ORDER) {
      const metrics = this.keyMetrics.get(midi);
      if (!metrics) continue;
      const fill = this.getKeyFill(midi, false);
      this.ctx.fillStyle = fill;
      this.ctx.fillRect(metrics.x, keyboardTop, metrics.width - 1, this.settings.pianoHeight);
    }

    for (const midi of BLACK_KEY_ORDER) {
      const metrics = this.keyMetrics.get(midi);
      if (!metrics) continue;
      const fill = this.getKeyFill(midi, true);
      this.ctx.fillStyle = fill;
      this.ctx.fillRect(metrics.x, keyboardTop, metrics.width, blackHeight);
    }
  }

  private getKeyFill(midi: number, isBlack: boolean): string {
    if (this.highlightedKeys.has(midi)) {
      return '#f97316';
    }
    if (this.settings.practiceGuide !== 'off' && this.guideHighlightedKeys.has(midi)) {
      return '#22c55e';
    }
    return isBlack ? '#0b1020' : '#f8fafc';
  }

  private computeKeyMetrics(): void {
    this.keyMetrics.clear();
    if (TOTAL_WHITE_KEYS === 0) {
      return;
    }
    this.whiteKeyWidth = this.width / TOTAL_WHITE_KEYS;
    let currentWhite = 0;

    for (const midi of WHITE_KEY_ORDER) {
      const x = currentWhite * this.whiteKeyWidth;
      this.keyMetrics.set(midi, {
        midi,
        x,
        width: this.whiteKeyWidth,
        isBlack: false
      });
      currentWhite += 1;
    }

    const blackWidth = this.whiteKeyWidth * 0.6;
    for (const midi of BLACK_KEY_ORDER) {
      const previousWhite = this.findPreviousWhiteKey(midi);
      const prevMetrics = previousWhite ? this.keyMetrics.get(previousWhite) : undefined;
      if (!prevMetrics) continue;
      const centerRatio = BLACK_CENTER_OFFSET[((midi % 12) + 12) % 12] ?? 0.55;
      const center = prevMetrics.x + this.whiteKeyWidth * centerRatio;
      this.keyMetrics.set(midi, {
        midi,
        x: center - blackWidth / 2,
        width: blackWidth,
        isBlack: true
      });
    }
  }

  private findPreviousWhiteKey(midi: number): number | null {
    for (let candidate = midi - 1; candidate >= MIDI_RANGE_START; candidate -= 1) {
      if (isWhiteKey(candidate)) {
        return candidate;
      }
    }
    return WHITE_KEY_ORDER[0] ?? null;
  }

  private getKeyMetrics(midi: number): KeyMetrics | null {
    if (this.keyMetrics.has(midi)) {
      return this.keyMetrics.get(midi)!;
    }
    if (midi < MIDI_RANGE_START) {
      return this.keyMetrics.get(MIDI_RANGE_START) ?? null;
    }
    if (midi > MIDI_RANGE_END) {
      return this.keyMetrics.get(MIDI_RANGE_END) ?? null;
    }
    return null;
  }

  private resolveNoteLabel(note: ActiveNote, opts: DisplayOpts): string | null {
    const { noteName } = note;
    if (noteName) {
      return createTextMetrics(noteName, opts);
    }
    return midiToDisplayName(note.pitch, opts);
  }
}

interface LegendCanvasRendererProps {
  width: number;
  height: number;
  onReady?: (renderer: LegendCanvasRendererInstance | null) => void;
  className?: string;
}

export const LegendCanvasRenderer: React.FC<LegendCanvasRendererProps> = ({
  width,
  height,
  onReady,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<LegendCanvasRendererInstance | null>(null);

  useEffect(() => {
    if (!containerRef.current || rendererRef.current) return;
    const renderer = new LegendCanvasRendererInstance(width, height);
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.view);
    onReady?.(renderer);

    return () => {
      renderer.destroy();
      rendererRef.current = null;
      onReady?.(null);
    };
  }, [height, width, onReady]);

  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.resize(width, height);
  }, [width, height]);

  useEffect(() => {
    if (rendererRef.current) {
      onReady?.(rendererRef.current);
    }
  }, [onReady]);

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden bg-gray-900', className)}
      style={{
        width,
        height,
        minWidth: width,
        minHeight: height
      }}
    />
  );
};

