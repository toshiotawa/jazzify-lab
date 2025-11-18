import React, { useEffect, useRef } from 'react';
import type { ActiveNote } from '@/types';
import { cn } from '@/utils/cn';
import { ObjectPool, unifiedFrameController } from '@/utils/performanceOptimizer';

const MIN_NOTE = 21;
const MAX_NOTE = 108;
const WHITE_KEY_COUNT = 52;
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const HEX_COLOR = /^#([0-9a-f]{6})$/i;

type NoteNameStyle = 'off' | 'abc' | 'solfege';

interface RendererSettings {
  noteWidth: number;
  noteHeight: number;
  pianoHeight: number;
  hitLineY: number;
  noteNameStyle: NoteNameStyle;
  simpleDisplayMode: boolean;
  transpose: number;
  practiceGuide?: 'off' | 'key' | 'key_auto';
  showHitLine: boolean;
  colors: {
    background: string;
    grid: string;
    visible: string;
    visibleBlack: string;
    hit: string;
    missed: string;
    whiteKey: string;
    blackKey: string;
    activeKey: string;
    guideKey: string;
    label: string;
  };
}

interface NoteRenderItem {
  id: string;
  note: ActiveNote | null;
  x: number;
  y: number;
  width: number;
  height: number;
  isBlack: boolean;
  label: string | null;
  cachedNoteName?: string;
  labelVersion: number;
  lastSeenFrame: number;
}

interface PianoKey {
  midi: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isBlack: boolean;
}

interface PIXINotesRendererProps {
  width: number;
  height: number;
  onReady?: (renderer: PIXINotesRendererInstance | null) => void;
  className?: string;
}

const DEFAULT_COLORS = {
  background: '#020617',
  grid: 'rgba(255,255,255,0.04)',
  visible: '#4A90E2',
  visibleBlack: '#2C5282',
  hit: '#48BB78',
  missed: '#E53E3E',
  whiteKey: '#f8fafc',
  blackKey: '#111827',
  activeKey: '#f97316',
  guideKey: '#22C55E',
  label: '#e2e8f0'
};

const COMPLEX_TO_SIMPLE_MAP: Record<string, string> = {
  'B#': 'C',
  'E#': 'F',
  CB: 'B',
  FB: 'E',
  AX: 'B',
  BX: 'C#',
  CX: 'D',
  DX: 'Eb',
  EX: 'F#',
  FX: 'G',
  GX: 'A',
  ABB: 'G',
  BBB: 'A',
  CBB: 'Bb',
  DBB: 'C',
  EBB: 'D',
  FBB: 'Eb',
  GBB: 'F'
};

const ENGLISH_TO_SOLFEGE: Record<string, string> = {
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

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const normalizeNoteToken = (raw: string): string => {
  if (!raw) {
    return raw;
  }
  const replaced = raw
    .replace(/♯|＃/g, '#')
    .replace(/♭|ｂ/g, 'b')
    .replace(/𝄪|Ｘ|ｘ/g, 'x')
    .replace(/𝄫/g, 'bb')
    .replace(/\d+/g, '')
    .trim();
  if (!replaced) {
    return replaced;
  }
  const first = replaced.charAt(0).toUpperCase();
  const rest = replaced.slice(1).replace(/[A-Z]/g, (char) => char.toLowerCase());
  return `${first}${rest}`;
};

const getSimplifiedEnglishName = (noteName?: string): string | null => {
  if (!noteName) {
    return null;
  }
  const token = normalizeNoteToken(noteName);
  return COMPLEX_TO_SIMPLE_MAP[token] || token;
};

const englishToSolfege = (noteName: string): string => {
  return ENGLISH_TO_SOLFEGE[noteName] || noteName;
};

const getMidiNoteName = (pitch: number): string => {
  const midi = clamp(Math.round(pitch), 0, 127);
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[midi % 12]}${octave}`;
};

const parseHexColor = (color: string): [number, number, number] | null => {
  const match = HEX_COLOR.exec(color);
  if (!match) {
    return null;
  }
  const value = parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const withAlpha = (color: string, alpha: number): string => {
  const rgb = parseHexColor(color);
  if (!rgb) {
    return color;
  }
  const [r, g, b] = rgb;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const createDefaultSettings = (): RendererSettings => ({
  noteWidth: 24,
  noteHeight: 6,
  pianoHeight: 80,
  hitLineY: 0,
  noteNameStyle: 'off',
  simpleDisplayMode: false,
  transpose: 0,
  practiceGuide: 'off',
  showHitLine: true,
  colors: { ...DEFAULT_COLORS }
});

export class PIXINotesRendererInstance {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly backgroundCanvas: HTMLCanvasElement;
  private readonly backgroundCtx: CanvasRenderingContext2D;
  private pixelRatio: number;
  private width: number;
  private height: number;
  private renderHandle: number | null = null;
  private disposed = false;
  private needsBackgroundRedraw = true;
  private readonly noteItems = new Map<string, NoteRenderItem>();
  private readonly activeItems: NoteRenderItem[] = [];
  private readonly notePool = new ObjectPool<NoteRenderItem>(
    () => ({
      id: '',
      note: null,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      isBlack: false,
      label: null,
      cachedNoteName: undefined,
      labelVersion: -1,
      lastSeenFrame: 0
    }),
    (item) => {
      item.id = '';
      item.note = null;
      item.label = null;
      item.cachedNoteName = undefined;
      item.labelVersion = -1;
      item.lastSeenFrame = 0;
    },
    256
  );
  private frameCounter = 0;
  private readonly highlightedKeys = new Set<number>();
  private readonly guideHighlightedKeys = new Set<number>();
  private keyLayout: PianoKey[] = new Array(MAX_NOTE - MIN_NOTE + 1).fill(null) as PianoKey[];
  private blackKeys: PianoKey[] = [];
  private whiteKeys: PianoKey[] = [];
  private onKeyPress?: (note: number) => void;
  private onKeyRelease?: (note: number) => void;
  private activePointerId: number | null = null;
  private activePointerNote: number | null = null;
  private readonly activeKeyPresses = new Set<number>();
  private labelGeneration = 0;
  private settings: RendererSettings = createDefaultSettings();

  constructor(width: number, height: number) {
    this.width = Math.max(1, Math.round(width));
    this.height = Math.max(1, Math.round(height));
    this.pixelRatio = typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1;

    this.canvas = document.createElement('canvas');
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to acquire 2D context for notes canvas');
    }
    this.ctx = context;
    this.canvas.style.display = 'block';
    this.canvas.style.touchAction = 'none';
    this.canvas.style.userSelect = 'none';

    this.backgroundCanvas = document.createElement('canvas');
    const bgCtx = this.backgroundCanvas.getContext('2d');
    if (!bgCtx) {
      throw new Error('Failed to acquire 2D context for notes background');
    }
    this.backgroundCtx = bgCtx;

    this.applyCanvasSize();
    this.updateLayout();
    this.attachPointerEvents();
  }

  get view(): HTMLCanvasElement {
    return this.canvas;
  }

  updateNotes(activeNotes: ActiveNote[], _currentTime?: number): void {
    if (this.disposed) {
      return;
    }

    this.frameCounter += 1;
    const frameId = this.frameCounter;

    if (activeNotes.length === 0) {
      if (this.noteItems.size > 0) {
        this.noteItems.forEach((item) => this.notePool.release(item));
        this.noteItems.clear();
        this.activeItems.length = 0;
        this.scheduleRender();
      }
      return;
    }

    for (const note of activeNotes) {
      let item = this.noteItems.get(note.id);
      if (!item) {
        item = this.notePool.get();
        item.id = note.id;
        this.noteItems.set(note.id, item);
      }
      item.note = note;
      item.lastSeenFrame = frameId;
      item.width = this.settings.noteWidth;
      item.height = this.settings.noteHeight;
      item.isBlack = this.isBlackKey(note.pitch + this.settings.transpose);
      item.x = this.pitchToX(note.pitch);
      item.y = this.resolveNoteY(note);

      if (this.settings.noteNameStyle === 'off') {
        item.label = null;
        item.labelVersion = this.labelGeneration;
      } else if (item.labelVersion !== this.labelGeneration || item.cachedNoteName !== note.noteName) {
        item.label = this.resolveLabel(note);
        item.cachedNoteName = note.noteName;
        item.labelVersion = this.labelGeneration;
      }
    }

    for (const [id, item] of this.noteItems) {
      if (item.lastSeenFrame !== frameId) {
        this.noteItems.delete(id);
        this.notePool.release(item);
      }
    }

    let index = 0;
    for (const item of this.noteItems.values()) {
      if (index < this.activeItems.length) {
        this.activeItems[index] = item;
      } else {
        this.activeItems.push(item);
      }
      index += 1;
    }
    this.activeItems.length = index;

    this.scheduleRender();
  }

  updateSettings(newSettings: Partial<RendererSettings>): void {
    if (this.disposed) return;

    const prevStyle = this.settings.noteNameStyle;
    const prevSimple = this.settings.simpleDisplayMode;
    const prevTranspose = this.settings.transpose;
    const prevPianoHeight = this.settings.pianoHeight;
    const prevHitLine = this.settings.showHitLine;

    if (typeof newSettings.noteNameStyle === 'string') {
      this.settings.noteNameStyle = newSettings.noteNameStyle;
    }
    if (typeof newSettings.simpleDisplayMode === 'boolean') {
      this.settings.simpleDisplayMode = newSettings.simpleDisplayMode;
    }
    if (typeof newSettings.transpose === 'number') {
      this.settings.transpose = clamp(newSettings.transpose, -12, 12);
    }
    if (typeof newSettings.practiceGuide === 'string') {
      this.settings.practiceGuide = newSettings.practiceGuide;
    }
    if (typeof newSettings.showHitLine === 'boolean') {
      this.settings.showHitLine = newSettings.showHitLine;
    }
    if (typeof newSettings.pianoHeight === 'number') {
      this.settings.pianoHeight = clamp(Math.round(newSettings.pianoHeight), 48, 140);
    }

    if (
      this.settings.noteNameStyle !== prevStyle ||
      this.settings.simpleDisplayMode !== prevSimple ||
      this.settings.transpose !== prevTranspose
    ) {
      this.bumpLabelGeneration();
    }

    if (this.settings.pianoHeight !== prevPianoHeight) {
      this.updateLayout();
    } else if (this.settings.showHitLine !== prevHitLine) {
      this.scheduleRender();
    }
  }

  highlightKey(midiNote: number, active: boolean): void {
    const note = clamp(Math.round(midiNote), MIN_NOTE, MAX_NOTE);
    if (active) {
      if (!this.highlightedKeys.has(note)) {
        this.highlightedKeys.add(note);
        this.scheduleRender();
      }
    } else if (this.highlightedKeys.delete(note)) {
      this.scheduleRender();
    }
  }

  setKeyCallbacks(onKeyPress: (note: number) => void, onKeyRelease: (note: number) => void): void {
    this.onKeyPress = onKeyPress;
    this.onKeyRelease = onKeyRelease;
  }

  setGuideHighlightsByPitchClasses(pitchClasses: number[]): void {
    const normalized = new Set<number>();
    pitchClasses.forEach((pc) => {
      const value = ((Math.round(pc) % 12) + 12) % 12;
      for (let midi = MIN_NOTE; midi <= MAX_NOTE; midi++) {
        if (midi % 12 === value) {
          normalized.add(midi);
        }
      }
    });
    this.syncGuideHighlights(normalized);
  }

  setGuideHighlightsByMidiNotes(midiNotes: number[]): void {
    const normalized = new Set<number>();
    midiNotes.forEach((note) => {
      normalized.add(clamp(Math.round(note), MIN_NOTE, MAX_NOTE));
    });
    this.syncGuideHighlights(normalized);
  }

  clearAllHighlights(): void {
    if (this.highlightedKeys.size === 0 && this.guideHighlightedKeys.size === 0) {
      return;
    }
    this.highlightedKeys.clear();
    this.guideHighlightedKeys.clear();
    this.activeKeyPresses.clear();
    this.scheduleRender();
  }

  clearActiveHighlights(): void {
    if (this.highlightedKeys.size === 0) return;
    this.highlightedKeys.clear();
    this.activeKeyPresses.clear();
    this.scheduleRender();
  }

  resize(width: number, height: number): void {
    if (this.disposed) return;
    this.width = Math.max(1, Math.round(width));
    this.height = Math.max(1, Math.round(height));
    this.pixelRatio = typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1;
    this.applyCanvasSize();
    this.updateLayout();
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.renderHandle !== null) {
      cancelAnimationFrame(this.renderHandle);
      this.renderHandle = null;
    }
    this.detachPointerEvents();
    this.noteItems.forEach((item) => this.notePool.release(item));
    this.noteItems.clear();
    this.activeItems.length = 0;
    this.activeKeyPresses.clear();
  }

  private syncGuideHighlights(target: Set<number>): void {
    let changed = false;
    for (const midi of Array.from(this.guideHighlightedKeys)) {
      if (!target.has(midi)) {
        this.guideHighlightedKeys.delete(midi);
        changed = true;
      }
    }
    target.forEach((midi) => {
      if (!this.guideHighlightedKeys.has(midi)) {
        this.guideHighlightedKeys.add(midi);
        changed = true;
      }
    });
    if (changed) {
      this.scheduleRender();
    }
  }

  private resolveLabel(note: ActiveNote): string | null {
    if (this.settings.noteNameStyle === 'off') {
      return null;
    }
    const effectivePitch = note.pitch + this.settings.transpose;
    const baseName = note.noteName || getMidiNoteName(effectivePitch);
    const simplified = this.settings.simpleDisplayMode
      ? getSimplifiedEnglishName(baseName) ?? normalizeNoteToken(baseName)
      : normalizeNoteToken(baseName);
    if (this.settings.noteNameStyle === 'solfege') {
      return englishToSolfege(simplified);
    }
    return simplified;
  }

  private resolveNoteY(note: ActiveNote): number {
    if (typeof note.y === 'number' && Number.isFinite(note.y)) {
      return note.y;
    }
    if (typeof note.previousY === 'number' && Number.isFinite(note.previousY)) {
      return note.previousY;
    }
    return this.settings.hitLineY;
  }

  private isBlackKey(midi: number): boolean {
    const pitchClass = ((midi % 12) + 12) % 12;
    return pitchClass === 1 || pitchClass === 3 || pitchClass === 6 || pitchClass === 8 || pitchClass === 10;
  }

  private pitchToX(pitch: number): number {
    const midi = clamp(Math.round(pitch), MIN_NOTE, MAX_NOTE);
    const key = this.keyLayout[midi - MIN_NOTE];
    if (!key) {
      return 0;
    }
    return key.x + key.width / 2;
  }

  private bumpLabelGeneration(): void {
    this.labelGeneration += 1;
    this.noteItems.forEach((item) => {
      item.labelVersion = -1;
    });
    this.scheduleRender();
  }

  private updateLayout(): void {
    this.settings.hitLineY = this.height - this.settings.pianoHeight;
    const whiteWidth = this.width / WHITE_KEY_COUNT;
    this.settings.noteWidth = Math.max(8, whiteWidth - 2);
    const noteArea = Math.max(120, this.settings.hitLineY);
    this.settings.noteHeight = clamp(Math.round(noteArea / 80), 6, 18);
    this.buildKeyLayout();
    this.needsBackgroundRedraw = true;
    this.scheduleRender();
  }

  private buildKeyLayout(): void {
    const layout: PianoKey[] = new Array(MAX_NOTE - MIN_NOTE + 1);
    const whiteKeys: PianoKey[] = [];
    const blackKeys: PianoKey[] = [];
    const whiteWidth = this.width / WHITE_KEY_COUNT;
    const baseY = this.height - this.settings.pianoHeight;
    let whiteIndex = 0;

    for (let midi = MIN_NOTE; midi <= MAX_NOTE; midi++) {
      const isBlack = this.isBlackKey(midi);
      let centerX: number;
      if (isBlack) {
        const prevWhiteIdx = Math.max(0, whiteIndex - 1);
        const nextWhiteIdx = Math.min(WHITE_KEY_COUNT - 1, whiteIndex);
        const prevCenter = prevWhiteIdx * whiteWidth + whiteWidth / 2;
        const nextCenter = nextWhiteIdx * whiteWidth + whiteWidth / 2;
        centerX = (prevCenter + nextCenter) / 2;
      } else {
        centerX = whiteIndex * whiteWidth + whiteWidth / 2;
        whiteIndex += 1;
      }

      const width = isBlack ? whiteWidth * 0.6 : whiteWidth - 1;
      const height = isBlack ? this.settings.pianoHeight * 0.65 : this.settings.pianoHeight;
      const key: PianoKey = {
        midi,
        x: centerX - width / 2,
        y: baseY,
        width,
        height,
        isBlack
      };
      layout[midi - MIN_NOTE] = key;
      (isBlack ? blackKeys : whiteKeys).push(key);
    }

    this.keyLayout = layout;
    this.blackKeys = blackKeys;
    this.whiteKeys = whiteKeys;
  }

  private scheduleRender(): void {
    if (this.disposed || this.renderHandle !== null) {
      return;
    }
    this.renderHandle = requestAnimationFrame(() => {
      this.renderHandle = null;
      this.renderFrame();
    });
  }

  private renderFrame(): void {
    if (this.disposed) {
      return;
    }
    unifiedFrameController.runMeasured('render', 'canvas-notes', () => {
      if (this.needsBackgroundRedraw) {
        this.drawBackground();
        this.needsBackgroundRedraw = false;
      }

      this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.ctx.drawImage(this.backgroundCanvas, 0, 0, this.width, this.height);

      if (this.settings.showHitLine) {
        this.ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.settings.hitLineY);
        this.ctx.lineTo(this.width, this.settings.hitLineY);
        this.ctx.stroke();
      }

      this.drawNotes();
      this.drawKeyHighlights();
    });
  }

  private drawBackground(): void {
    this.backgroundCtx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    this.backgroundCtx.clearRect(0, 0, this.width, this.height);

    const gradient = this.backgroundCtx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#030712');
    gradient.addColorStop(1, '#02030a');
    this.backgroundCtx.fillStyle = gradient;
    this.backgroundCtx.fillRect(0, 0, this.width, this.height);

    this.backgroundCtx.strokeStyle = this.settings.colors.grid;
    this.backgroundCtx.lineWidth = 1;
    for (let y = 0; y <= this.settings.hitLineY; y += 50) {
      this.backgroundCtx.beginPath();
      this.backgroundCtx.moveTo(0, y);
      this.backgroundCtx.lineTo(this.width, y);
      this.backgroundCtx.stroke();
    }

    this.backgroundCtx.fillStyle = this.settings.colors.whiteKey;
    this.whiteKeys.forEach((key) => {
      this.backgroundCtx.fillStyle = this.settings.colors.whiteKey;
      this.backgroundCtx.fillRect(key.x, key.y, key.width, key.height);
      this.backgroundCtx.strokeStyle = 'rgba(15,23,42,0.35)';
      this.backgroundCtx.strokeRect(key.x, key.y, key.width, key.height);
    });

    this.backgroundCtx.fillStyle = this.settings.colors.blackKey;
    this.blackKeys.forEach((key) => {
      this.backgroundCtx.fillRect(key.x, key.y, key.width, key.height);
    });
  }

  private drawNotes(): void {
    if (this.activeItems.length === 0) {
      return;
    }
    const ctx = this.ctx;
    ctx.font = `600 12px "Inter", "Noto Sans JP", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.lineJoin = 'round';

    for (const item of this.activeItems) {
      const note = item.note;
      if (!note) continue;
      const color = this.getStateColor(note.state, item.isBlack);
      ctx.fillStyle = color;
      const x = item.x - item.width / 2;
      const y = item.y - item.height / 2;
      ctx.fillRect(x, y, item.width, item.height);

      if (item.label) {
        ctx.fillStyle = this.settings.colors.label;
        ctx.fillText(item.label, item.x, y - 4);
      }
    }
  }

  private drawKeyHighlights(): void {
    if (this.highlightedKeys.size === 0 && this.guideHighlightedKeys.size === 0) {
      return;
    }
    const ctx = this.ctx;
    for (const key of this.keyLayout) {
      if (!key) continue;
      const midi = key.midi;
      const isActive = this.highlightedKeys.has(midi);
      const isGuide = this.guideHighlightedKeys.has(midi);
      if (!isActive && !isGuide) continue;
      const overlayColor = isActive
        ? withAlpha(this.settings.colors.activeKey, 0.9)
        : withAlpha(this.settings.colors.guideKey, 0.6);
      ctx.fillStyle = overlayColor;
      ctx.fillRect(key.x, key.y, key.width, key.height);
    }
  }

  private getStateColor(state: ActiveNote['state'], isBlack: boolean): string {
    if (state === 'hit' || state === 'good' || state === 'perfect') {
      return this.settings.colors.hit;
    }
    if (state === 'missed') {
      return this.settings.colors.missed;
    }
    return isBlack ? this.settings.colors.visibleBlack : this.settings.colors.visible;
  }

  private applyCanvasSize(): void {
    this.canvas.width = Math.floor(this.width * this.pixelRatio);
    this.canvas.height = Math.floor(this.height * this.pixelRatio);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.backgroundCanvas.width = this.canvas.width;
    this.backgroundCanvas.height = this.canvas.height;
    this.needsBackgroundRedraw = true;
  }

  private attachPointerEvents(): void {
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointerleave', this.handlePointerLeave);
    this.canvas.addEventListener('pointercancel', this.handlePointerCancel);
  }

  private detachPointerEvents(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointerleave', this.handlePointerLeave);
    this.canvas.removeEventListener('pointercancel', this.handlePointerCancel);
  }

  private handlePointerDown = (event: PointerEvent): void => {
    if (this.disposed) return;
    this.canvas.setPointerCapture(event.pointerId);
    const midi = this.getMidiFromPointer(event);
    if (midi === null) return;
    this.activePointerId = event.pointerId;
    this.activePointerNote = midi;
    this.triggerKeyPress(midi);
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (this.disposed || this.activePointerId !== event.pointerId) return;
    const midi = this.getMidiFromPointer(event);
    if (midi === null) {
      return;
    }
    if (this.activePointerNote !== midi) {
      if (this.activePointerNote !== null) {
        this.triggerKeyRelease(this.activePointerNote);
      }
      this.activePointerNote = midi;
      this.triggerKeyPress(midi);
    }
  };

  private handlePointerUp = (event: PointerEvent): void => {
    if (this.disposed || this.activePointerId !== event.pointerId) return;
    if (this.activePointerNote !== null) {
      this.triggerKeyRelease(this.activePointerNote);
    }
    this.activePointerId = null;
    this.activePointerNote = null;
    this.canvas.releasePointerCapture(event.pointerId);
  };

  private handlePointerLeave = (): void => {
    if (this.activePointerNote !== null) {
      this.triggerKeyRelease(this.activePointerNote);
      this.activePointerNote = null;
      this.activePointerId = null;
    }
  };

  private handlePointerCancel = (event: PointerEvent): void => {
    if (this.activePointerId === event.pointerId && this.activePointerNote !== null) {
      this.triggerKeyRelease(this.activePointerNote);
    }
    this.activePointerId = null;
    this.activePointerNote = null;
  };

  private triggerKeyPress(note: number): void {
    if (this.activeKeyPresses.has(note)) return;
    this.activeKeyPresses.add(note);
    this.highlightKey(note, true);
    this.onKeyPress?.(note);
  }

  private triggerKeyRelease(note: number): void {
    if (!this.activeKeyPresses.has(note)) {
      this.highlightKey(note, false);
      return;
    }
    this.activeKeyPresses.delete(note);
    this.highlightKey(note, false);
    this.onKeyRelease?.(note);
  }

  private getMidiFromPointer(event: PointerEvent): number | null {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return null;
    }
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    if (y < this.settings.hitLineY) {
      return null;
    }

    for (const key of this.blackKeys) {
      if (this.pointInKey(x, y, key)) {
        return key.midi;
      }
    }
    for (const key of this.whiteKeys) {
      if (this.pointInKey(x, y, key)) {
        return key.midi;
      }
    }
    return null;
  }

  private pointInKey(x: number, y: number, key: PianoKey): boolean {
    return x >= key.x && x <= key.x + key.width && y >= key.y && y <= key.y + key.height;
  }
}

export const PIXINotesRenderer: React.FC<PIXINotesRendererProps> = ({
  width,
  height,
  onReady,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<PIXINotesRendererInstance | null>(null);

  useEffect(() => {
    if (!containerRef.current || rendererRef.current) return;
    const renderer = new PIXINotesRendererInstance(width, height);
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.view);
    onReady?.(renderer);

    return () => {
      renderer.destroy();
      rendererRef.current = null;
      onReady?.(null);
    };
  }, [width, height, onReady]);

  useEffect(() => {
    rendererRef.current?.resize(width, height);
  }, [width, height]);

  useEffect(() => {
    if (rendererRef.current) {
      onReady?.(rendererRef.current);
    }
  }, [onReady]);

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full h-full', className)}
      style={{ width, height, minWidth: width, minHeight: height, overflow: 'hidden' }}
    />
  );
};

export default PIXINotesRenderer;
