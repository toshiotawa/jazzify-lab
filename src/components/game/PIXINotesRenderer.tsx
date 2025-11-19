import React, { useEffect, useRef } from 'react';
import type { ActiveNote } from '@/types';
import { cn } from '@/utils/cn';

type NoteNameStyle = 'off' | 'abc' | 'solfege';

interface RendererSettings {
  noteWidth: number;
  noteHeight: number;
  hitLineY: number;
  pianoHeight: number;
  noteSpeed: number;
  transposingInstrument: string;
  colors: {
    visible: string | number;
    visibleBlack: string | number;
    hit: string | number;
    missed: string | number;
    whiteKey: string | number;
    blackKey: string | number;
    activeKey: string | number;
    guideKey: string | number;
    background: string | number;
  };
  noteNameStyle: NoteNameStyle;
  simpleDisplayMode: boolean;
  transpose: number;
  practiceGuide?: 'off' | 'key' | 'key_auto';
  showHitLine: boolean;
  viewportHeight: number;
  timingAdjustment: number;
}

interface PIXINotesRendererProps {
  width: number;
  height: number;
  onReady?: (renderer: PIXINotesRendererInstance | null) => void;
  className?: string;
}

interface KeyGeometry {
  midi: number;
  isBlack: boolean;
  x: number;
  width: number;
  height: number;
}

const MIN_MIDI = 21;
const MAX_MIDI = 108;
const TOTAL_WHITE_KEYS = 52;
const BLACK_KEY_OFFSETS = new Set([1, 3, 6, 8, 10]);
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const JAPANESE_NOTE_MAP: Record<string, string> = {
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

const JAPANESE_TO_ENGLISH_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(JAPANESE_NOTE_MAP).map(([english, japanese]) => [japanese, english])
);

const createDefaultSettings = (): RendererSettings => ({
  noteWidth: 28,
  noteHeight: 6,
  hitLineY: 0,
  pianoHeight: 80,
  noteSpeed: 400,
  transposingInstrument: 'concert_pitch',
  colors: {
    visible: '#4A90E2',
    visibleBlack: '#2C5282',
    hit: '#48BB78',
    missed: '#E53E3E',
    whiteKey: '#ffffff',
    blackKey: '#2D2D2D',
    activeKey: '#FF8C00',
    guideKey: '#22C55E',
    background: '#05060A'
  },
  noteNameStyle: 'off',
  simpleDisplayMode: false,
  transpose: 0,
  practiceGuide: 'off',
  showHitLine: true,
  viewportHeight: 600,
  timingAdjustment: 0
});

const toColor = (value: number | string): string => {
  if (typeof value === 'string') {
    return value;
  }
  return `#${value.toString(16).padStart(6, '0')}`;
};

export class PIXINotesRendererInstance {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private pixelRatio: number;
  private destroyed = false;
  private noteBuffer: ActiveNote[] = [];
  private renderHandle: number | ReturnType<typeof setTimeout> | null = null;
  private renderPending = false;
  private settings: RendererSettings = createDefaultSettings();
  private colors = this.normalizeColors(this.settings.colors);
  private keyGeometries = new Map<number, KeyGeometry>();
  private whiteKeyOrder: number[] = [];
  private blackKeyOrder: number[] = [];
  private highlightedKeys = new Set<number>();
  private guideHighlightedKeys = new Set<number>();
  private pointerMap = new Map<number, number>();
  private onKeyPress?: (note: number) => void;
  private onKeyRelease?: (note: number) => void;
  private backgroundCanvas: HTMLCanvasElement | null = null;
  private backgroundNeedsUpdate = true;

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context is not available');
    }
    this.ctx = context;
    this.pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    this.width = width;
    this.height = height;
    this.settings.hitLineY = height - this.settings.pianoHeight;
    this.configureCanvasSize(width, height);
    this.recalculateKeyLayout();
    this.attachEvents();
  }

  updateNotes(notes: ActiveNote[], _currentTime?: number): void {
    if (this.destroyed) return;
    this.noteBuffer.length = notes.length;
    for (let i = 0; i < notes.length; i += 1) {
      this.noteBuffer[i] = notes[i];
    }
    this.requestRender();
  }

  updateSettings(newSettings: Partial<RendererSettings>): void {
    if (this.destroyed) return;
    const mergedColors = { ...this.settings.colors, ...(newSettings.colors ?? {}) };
    const nextSettings = { ...this.settings, ...newSettings, colors: mergedColors };
    nextSettings.pianoHeight = Math.max(60, nextSettings.pianoHeight);
    nextSettings.hitLineY = this.height - nextSettings.pianoHeight;
    this.settings = nextSettings;
    this.colors = this.normalizeColors(nextSettings.colors);
    this.recalculateKeyLayout();
    this.backgroundNeedsUpdate = true;
    this.requestRender();
  }

  resize(width: number, height: number): void {
    if (this.destroyed) return;
    this.width = width;
    this.height = height;
    this.settings.hitLineY = height - this.settings.pianoHeight;
    this.configureCanvasSize(width, height);
    this.recalculateKeyLayout();
    this.backgroundNeedsUpdate = true;
    this.requestRender();
  }

  setKeyCallbacks(onPress: (note: number) => void, onRelease: (note: number) => void): void {
    this.onKeyPress = onPress;
    this.onKeyRelease = onRelease;
  }

  highlightKey(midiNote: number, active: boolean): void {
    const clamped = this.clampMidi(midiNote);
    if (active) {
      this.highlightedKeys.add(clamped);
    } else {
      this.highlightedKeys.delete(clamped);
    }
    this.requestRender();
  }

  setGuideHighlightsByMidiNotes(midiNotes: number[]): void {
    const next = new Set<number>();
    midiNotes.forEach((note) => {
      const midi = this.clampMidi(note);
      next.add(midi);
    });
    this.applyGuideHighlights(next);
  }

  setGuideHighlightsByPitchClasses(pitchClasses: number[]): void {
    const normalized = new Set<number>();
    pitchClasses.forEach((pc) => {
      const safe = ((pc % 12) + 12) % 12;
      normalized.add(safe);
    });
    const target = new Set<number>();
    for (let midi = MIN_MIDI; midi <= MAX_MIDI; midi += 1) {
      if (normalized.has(midi % 12)) {
        target.add(midi);
      }
    }
    this.applyGuideHighlights(target);
  }

  clearAllHighlights(): void {
    this.highlightedKeys.clear();
    this.guideHighlightedKeys.clear();
    this.requestRender();
  }

  clearActiveHighlights(): void {
    this.highlightedKeys.clear();
    this.requestRender();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.detachEvents();
    if (this.renderHandle !== null) {
      if (typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function' && typeof this.renderHandle === 'number') {
        window.cancelAnimationFrame(this.renderHandle);
      } else {
        clearTimeout(this.renderHandle as ReturnType<typeof setTimeout>);
      }
      this.renderHandle = null;
    }
    this.noteBuffer.length = 0;
    this.highlightedKeys.clear();
    this.guideHighlightedKeys.clear();
    this.pointerMap.clear();
    this.backgroundCanvas = null;
  }

  get view(): HTMLCanvasElement {
    return this.canvas;
  }

  private configureCanvasSize(width: number, height: number): void {
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.canvas.width = Math.max(1, Math.floor(width * this.pixelRatio));
    this.canvas.height = Math.max(1, Math.floor(height * this.pixelRatio));
    this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    this.settings.noteWidth = width / TOTAL_WHITE_KEYS - 2;
  }

  private normalizeColors(colors: RendererSettings['colors']): Record<keyof RendererSettings['colors'], string> {
    return {
      visible: toColor(colors.visible),
      visibleBlack: toColor(colors.visibleBlack),
      hit: toColor(colors.hit),
      missed: toColor(colors.missed),
      whiteKey: toColor(colors.whiteKey),
      blackKey: toColor(colors.blackKey),
      activeKey: toColor(colors.activeKey),
      guideKey: toColor(colors.guideKey),
      background: toColor(colors.background)
    };
  }

  private recalculateKeyLayout(): void {
    this.keyGeometries.clear();
    this.whiteKeyOrder = [];
    this.blackKeyOrder = [];
    const whiteWidth = this.width / TOTAL_WHITE_KEYS;
    let whiteIndex = 0;
    for (let midi = MIN_MIDI; midi <= MAX_MIDI; midi += 1) {
      const isBlack = BLACK_KEY_OFFSETS.has(midi % 12);
      if (!isBlack) {
        const geometry: KeyGeometry = {
          midi,
          isBlack: false,
          x: whiteIndex * whiteWidth,
          width: whiteWidth,
          height: this.settings.pianoHeight
        };
        this.keyGeometries.set(midi, geometry);
        this.whiteKeyOrder.push(midi);
        whiteIndex += 1;
      }
    }
    const blackHeight = this.settings.pianoHeight * 0.6;
    for (let midi = MIN_MIDI; midi <= MAX_MIDI; midi += 1) {
      if (!BLACK_KEY_OFFSETS.has(midi % 12)) continue;
      const prev = this.findAdjacentWhite(midi, -1);
      const next = this.findAdjacentWhite(midi, 1);
      if (!prev || !next) continue;
      const blackWidth = prev.width * 0.6;
      const center = (prev.x + prev.width + next.x) / 2;
      const geometry: KeyGeometry = {
        midi,
        isBlack: true,
        x: center - blackWidth / 2,
        width: blackWidth,
        height: blackHeight
      };
      this.keyGeometries.set(midi, geometry);
      this.blackKeyOrder.push(midi);
    }
    this.backgroundNeedsUpdate = true;
  }

  private findAdjacentWhite(midi: number, direction: 1 | -1): KeyGeometry | null {
    let cursor = midi + direction;
    while (cursor >= MIN_MIDI && cursor <= MAX_MIDI) {
      const isBlack = BLACK_KEY_OFFSETS.has(cursor % 12);
      if (!isBlack) {
        return this.keyGeometries.get(cursor) ?? null;
      }
      cursor += direction;
    }
    return null;
  }

  private attachEvents(): void {
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerUp);
    this.canvas.addEventListener('pointerleave', this.handlePointerUp);
    this.canvas.addEventListener('contextmenu', this.preventContextMenu);
    this.canvas.style.touchAction = 'none';
  }

  private detachEvents(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
    this.canvas.removeEventListener('pointerleave', this.handlePointerUp);
    this.canvas.removeEventListener('contextmenu', this.preventContextMenu);
  }

  private preventContextMenu = (event: Event): void => {
    event.preventDefault();
  };

  private handlePointerDown = (event: PointerEvent): void => {
    if (this.destroyed) return;
    const midi = this.hitTest(event);
    if (midi === null) return;
    try {
      this.canvas.setPointerCapture(event.pointerId);
    } catch {
      // ignore
    }
    this.pointerMap.set(event.pointerId, midi);
    this.triggerKeyPress(midi);
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (this.destroyed) return;
    if (!this.pointerMap.has(event.pointerId)) return;
    const nextMidi = this.hitTest(event);
    const prevMidi = this.pointerMap.get(event.pointerId);
    if (nextMidi === null || nextMidi === prevMidi) {
      return;
    }
    if (prevMidi !== undefined) {
      this.triggerKeyRelease(prevMidi);
    }
    this.pointerMap.set(event.pointerId, nextMidi);
    this.triggerKeyPress(nextMidi);
  };

  private handlePointerUp = (event: PointerEvent): void => {
    const midi = this.pointerMap.get(event.pointerId);
    if (midi !== undefined) {
      this.triggerKeyRelease(midi);
      this.pointerMap.delete(event.pointerId);
    }
  };

  private triggerKeyPress(midi: number): void {
    this.highlightKey(midi, true);
    this.onKeyPress?.(midi);
  }

  private triggerKeyRelease(midi: number): void {
    this.highlightKey(midi, false);
    this.onKeyRelease?.(midi);
  }

  private hitTest(event: PointerEvent): number | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * this.width;
    const y = ((event.clientY - rect.top) / rect.height) * this.height;
    return this.getKeyAtPosition(x, y);
  }

  private getKeyAtPosition(x: number, y: number): number | null {
    if (y < this.settings.hitLineY) return null;
    for (const midi of this.blackKeyOrder) {
      const geometry = this.keyGeometries.get(midi);
      if (!geometry) continue;
      const top = this.settings.hitLineY;
      const bottom = top + geometry.height;
      if (x >= geometry.x && x <= geometry.x + geometry.width && y >= top && y <= bottom) {
        return midi;
      }
    }
    for (const midi of this.whiteKeyOrder) {
      const geometry = this.keyGeometries.get(midi);
      if (!geometry) continue;
      const top = this.settings.hitLineY;
      const bottom = this.height;
      if (x >= geometry.x && x <= geometry.x + geometry.width && y >= top && y <= bottom) {
        return midi;
      }
    }
    return null;
  }

  private requestRender(): void {
    if (this.renderPending || this.destroyed) {
      return;
    }
    this.renderPending = true;
    const raf =
      typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
        ? window.requestAnimationFrame.bind(window)
        : (callback: FrameRequestCallback) => setTimeout(() => callback(performance.now()), 1000 / 60);
    this.renderHandle = raf(this.renderLoop);
  }

  private renderLoop = (): void => {
    this.renderPending = false;
    this.renderHandle = null;
    if (this.destroyed) return;
    this.drawFrame();
  };

  private drawFrame(): void {
    if (this.backgroundNeedsUpdate) {
      this.renderStaticLayers();
      this.backgroundNeedsUpdate = false;
    }
    const controller = (window as typeof window & { unifiedFrameController?: any })?.unifiedFrameController;
    const token = controller?.beginFrame?.('render', 'canvas-notes');
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
    ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    if (this.backgroundCanvas) {
      ctx.drawImage(this.backgroundCanvas, 0, 0, this.width, this.height);
    } else {
      ctx.fillStyle = this.colors.background;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    if (this.settings.showHitLine) {
      this.drawHitLine(ctx);
    }
    this.drawNotes(ctx);
    this.drawKeyHighlights(ctx);
    if (token) {
      controller.endFrame(token);
    }
  }

  private renderStaticLayers(): void {
    if (typeof document === 'undefined') return;
    const canvas = document.createElement('canvas');
    canvas.width = this.canvas.width;
    canvas.height = this.canvas.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height - this.settings.pianoHeight);
    gradient.addColorStop(0, '#020617');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height - this.settings.pianoHeight);
    this.drawGuideLanes(ctx);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, this.settings.hitLineY, this.width, this.settings.pianoHeight);
    this.drawStaticKeys(ctx);
    this.backgroundCanvas = canvas;
  }

  private drawStaticKeys(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const whiteTop = this.settings.hitLineY;
    const whiteHeight = this.settings.pianoHeight;
    for (const midi of this.whiteKeyOrder) {
      const key = this.keyGeometries.get(midi);
      if (!key) continue;
      const keyX = key.x + 0.4;
      const keyWidth = Math.max(1, key.width - 0.8);
      const keyY = whiteTop + 0.4;
      const keyHeight = Math.max(whiteHeight - 0.8, 1);
      const radius = Math.min(8, keyWidth * 0.25);
      const bodyGradient = ctx.createLinearGradient(keyX, keyY, keyX, keyY + keyHeight);
      bodyGradient.addColorStop(0, '#fefefe');
      bodyGradient.addColorStop(0.65, '#e2e8f0');
      bodyGradient.addColorStop(1, '#cbd5f5');
      ctx.fillStyle = bodyGradient;
      this.drawTopRoundedRectPath(ctx, keyX, keyY, keyWidth, keyHeight, radius);
      ctx.fill();
      this.drawTopRoundedRectPath(ctx, keyX, keyY, keyWidth, keyHeight, radius);
      ctx.strokeStyle = 'rgba(15,23,42,0.35)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.save();
      this.drawTopRoundedRectPath(ctx, keyX, keyY, keyWidth, keyHeight, radius);
      ctx.clip();
      const glossGradient = ctx.createLinearGradient(keyX, keyY, keyX, keyY + keyHeight * 0.55);
      glossGradient.addColorStop(0, 'rgba(255,255,255,0.55)');
      glossGradient.addColorStop(0.5, 'rgba(255,255,255,0.1)');
      glossGradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glossGradient;
      ctx.fillRect(keyX, keyY, keyWidth, keyHeight * 0.6);
      ctx.restore();
    }
    for (const midi of this.blackKeyOrder) {
      const key = this.keyGeometries.get(midi);
      if (!key) continue;
      const top = this.settings.hitLineY;
      const keyX = key.x + 0.3;
      const keyWidth = Math.max(1, key.width - 0.6);
      const keyHeight = key.height;
      const radius = Math.min(4, keyWidth * 0.3);
      const bodyGradient = ctx.createLinearGradient(keyX, top, keyX, top + keyHeight);
      bodyGradient.addColorStop(0, '#111827');
      bodyGradient.addColorStop(0.5, '#0f172a');
      bodyGradient.addColorStop(1, '#1f2937');
      ctx.fillStyle = bodyGradient;
      this.drawTopRoundedRectPath(ctx, keyX, top, keyWidth, keyHeight, radius);
      ctx.fill();
      this.drawTopRoundedRectPath(ctx, keyX, top, keyWidth, keyHeight, radius);
      ctx.strokeStyle = 'rgba(15,23,42,0.45)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
      ctx.save();
      this.drawTopRoundedRectPath(ctx, keyX, top, keyWidth, keyHeight, radius);
      ctx.clip();
      const glossGradient = ctx.createLinearGradient(keyX, top, keyX, top + keyHeight * 0.5);
      glossGradient.addColorStop(0, 'rgba(255,255,255,0.3)');
      glossGradient.addColorStop(0.4, 'rgba(255,255,255,0.08)');
      glossGradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glossGradient;
      ctx.fillRect(keyX, top, keyWidth, keyHeight * 0.5);
      ctx.restore();
    }
    ctx.restore();
  }

  private drawGuideLanes(ctx: CanvasRenderingContext2D): void {
    const laneHeight = this.settings.hitLineY;
    if (laneHeight <= 0) {
      return;
    }
    ctx.save();
    const alternatingFill = 'rgba(148,163,184,0.07)';
    const accentFill = 'rgba(59,130,246,0.08)';
    const baseStroke = 'rgba(148,163,184,0.12)';
    const accentStroke = 'rgba(59,130,246,0.35)';
    this.whiteKeyOrder.forEach((midi, index) => {
      const geometry = this.keyGeometries.get(midi);
      if (!geometry) return;
      if (index % 2 === 0) {
        ctx.fillStyle = alternatingFill;
        ctx.fillRect(geometry.x, 0, geometry.width, laneHeight);
      }
    });
    let prevMidi: number | null = null;
    for (const midi of this.whiteKeyOrder) {
      const geometry = this.keyGeometries.get(midi);
      if (!geometry) {
        prevMidi = midi;
        continue;
      }
      if (prevMidi !== null) {
        const boundaryX = geometry.x;
        const isSpecialGap = this.isNaturalHalfStep(prevMidi, midi);
        if (isSpecialGap) {
          const prevGeometry = this.keyGeometries.get(prevMidi);
          if (prevGeometry) {
            const gapWidth = Math.min(prevGeometry.width, geometry.width) * 0.6;
            const accentLeft = boundaryX - gapWidth / 2;
            ctx.fillStyle = accentFill;
            ctx.fillRect(accentLeft, 0, gapWidth, laneHeight);
          }
        }
        ctx.strokeStyle = isSpecialGap ? accentStroke : baseStroke;
        ctx.lineWidth = isSpecialGap ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(boundaryX, 0);
        ctx.lineTo(boundaryX, laneHeight);
        ctx.stroke();
      }
      prevMidi = midi;
    }
    ctx.restore();
  }

  private drawTopRoundedRectPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x, y + safeRadius);
    ctx.quadraticCurveTo(x, y, x + safeRadius, y);
    ctx.lineTo(x + width - safeRadius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
  }

  private drawHitLine(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.settings.hitLineY);
    ctx.lineTo(this.width, this.settings.hitLineY);
    ctx.stroke();
    ctx.restore();
  }

  private drawNotes(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.noteBuffer.length; i += 1) {
      const note = this.noteBuffer[i];
      if (!note || note.state === 'completed') continue;
      const geometry = this.getGeometryForPitch(note.pitch);
      if (!geometry) continue;
      const noteY = note.y ?? this.settings.hitLineY;
      if (noteY < -100 || noteY > this.height + 100) continue;
      const width = geometry.isBlack ? geometry.width * 0.7 : geometry.width * 0.9;
      const height = this.settings.noteHeight;
      const x = geometry.x + geometry.width / 2 - width / 2;
      const y = noteY - height;
      ctx.fillStyle = this.getStateColor(note.state, geometry.isBlack);
      ctx.fillRect(x, y, width, height);
      if (note.state === 'missed') {
        ctx.strokeStyle = 'rgba(248,113,113,0.5)';
        ctx.strokeRect(x, y, width, height);
      }
      const label = this.getNoteLabel(note);
      if (label) {
        ctx.fillStyle = '#f8fafc';
        ctx.font = `${Math.max(10, width * 0.4)}px 'Inter', 'Noto Sans JP', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(label, geometry.x + geometry.width / 2, y - 2);
      }
    }
  }

  private drawKeyHighlights(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const top = this.settings.hitLineY;
    const height = this.settings.pianoHeight;
    const drawHighlight = (midi: number, color: string): void => {
      const geometry = this.keyGeometries.get(midi);
      if (!geometry) return;
      const keyTop = top;
      const keyHeight = geometry.isBlack ? geometry.height : height;
      ctx.fillStyle = color;
      ctx.globalAlpha = geometry.isBlack ? 0.55 : 0.35;
      ctx.fillRect(geometry.x, keyTop, geometry.width, keyHeight);
      ctx.globalAlpha = 1;
    };
    this.guideHighlightedKeys.forEach((midi) => drawHighlight(midi, this.colors.guideKey));
    this.highlightedKeys.forEach((midi) => drawHighlight(midi, this.colors.activeKey));
    ctx.restore();
  }

  private getStateColor(state: ActiveNote['state'], isBlack: boolean): string {
    if (state === 'hit' || state === 'good' || state === 'perfect') {
      return this.colors.hit;
    }
    if (state === 'missed') {
      return this.colors.missed;
    }
    return isBlack ? this.colors.visibleBlack : this.colors.visible;
  }

  private getNoteLabel(note: ActiveNote): string | null {
    if (this.settings.noteNameStyle === 'off') return null;
    const baseName = this.resolveNoteName(note);
    if (!baseName) return null;
    if (this.settings.noteNameStyle === 'solfege') {
      return this.toSolfege(baseName);
    }
    return baseName;
  }

  private resolveNoteName(note: ActiveNote): string | null {
    const preferredName = note.noteName ? this.trimOctave(note.noteName) : null;
    const englishName = preferredName ? this.normalizeToEnglish(preferredName) : this.midiToNoteName(note.pitch + this.settings.transpose);
    if (!englishName) return null;
    if (this.settings.simpleDisplayMode) {
      return this.simplifyNoteName(englishName);
    }
    return englishName;
  }

  private isNaturalHalfStep(prevMidi: number, nextMidi: number): boolean {
    const normalize = (value: number): number => {
      const mod = value % 12;
      return mod < 0 ? mod + 12 : mod;
    };
    const prev = normalize(prevMidi);
    const next = normalize(nextMidi);
    return (prev === 11 && next === 0) || (prev === 4 && next === 5);
  }

  private normalizeToEnglish(noteName: string): string {
    if (/^[A-G]/i.test(noteName)) {
      return this.trimOctave(noteName);
    }
    return JAPANESE_TO_ENGLISH_MAP[noteName] ?? noteName;
  }

    private simplifyNoteName(noteName: string): string {
      const trimmed = this.trimOctave(noteName);
      const simpleMap: Record<string, string> = {
        'B#': 'C',
        'E#': 'F',
        'Cb': 'B',
        'Fb': 'E',
        'Ax': 'B',
        'Bx': 'C#',
        'Cx': 'D',
        'Dx': 'Eb',
        'Ex': 'F#',
        'Fx': 'G',
        'Gx': 'A',
        'Abb': 'G',
        'Bbb': 'A',
        'Cbb': 'Bb',
        'Dbb': 'C',
        'Ebb': 'D',
        'Fbb': 'Eb',
        'Gbb': 'F'
      };
      return simpleMap[trimmed] ?? trimmed;
    }

  private trimOctave(noteName: string): string {
    return noteName.replace(/\d+$/, '');
  }

  private midiToNoteName(midi: number): string | null {
    const clamped = this.clampMidi(midi);
    const name = NOTE_NAMES[clamped % 12];
    const octave = Math.floor(clamped / 12) - 1;
    return `${name}${octave}`;
  }

  private toSolfege(noteName: string): string {
    const base = this.trimOctave(noteName);
    return JAPANESE_NOTE_MAP[base] ?? base;
  }

  private getGeometryForPitch(pitch: number): KeyGeometry | null {
    const midi = this.clampMidi(pitch + this.settings.transpose);
    return this.keyGeometries.get(midi) ?? null;
  }

  private clampMidi(midi: number): number {
    if (Number.isNaN(midi)) return MIN_MIDI;
    return Math.min(MAX_MIDI, Math.max(MIN_MIDI, Math.round(midi)));
  }

  private applyGuideHighlights(target: Set<number>): void {
    this.guideHighlightedKeys = target;
    this.requestRender();
  }
}

export const PIXINotesRenderer: React.FC<PIXINotesRendererProps> = ({
  width,
  height,
  onReady,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<PIXINotesRendererInstance | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const renderer = new PIXINotesRendererInstance(canvas, width, height);
    rendererRef.current = renderer;
    onReady?.(renderer);
    return () => {
      renderer.destroy();
      rendererRef.current = null;
      onReady?.(null);
    };
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

export default PIXINotesRenderer;
