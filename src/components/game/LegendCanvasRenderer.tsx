import React, { useEffect, useRef } from 'react';
import type { ActiveNote } from '@/types';
import { cn } from '@/utils/cn';
import { log } from '@/utils/logger';
import type { LegendRendererInstance, LegendRendererSettings } from './LegendRendererTypes';

const LOOKAHEAD_SECONDS = 15;
const MIN_PIANO_HEIGHT = 70;
const LOWEST_MIDI = 21;
const HIGHEST_MIDI = 108;
const TOTAL_WHITE_KEYS = 52;
const BLACK_KEY_SEMITONES = new Set([1, 3, 6, 8, 10]);

const COLORS = {
  background: '#0a0f1c',
  guideline: '#111827',
  hitLine: '#f97316',
  noteWhite: '#60a5fa',
  noteBlack: '#1d4ed8',
  noteHit: '#4ade80',
  noteMissed: '#ef4444',
  label: '#e2e8f0',
  whiteKey: '#f8fafc',
  blackKey: '#1f2937',
  activeKey: '#facc15',
  guideKey: '#22c55e',
  keyBorder: '#0f172a'
} as const;

interface LegendCanvasRendererProps {
  width: number;
  height: number;
  onReady?: (instance: LegendRendererInstance | null) => void;
  className?: string;
}

interface KeyLayout {
  midi: number;
  x: number;
  width: number;
  isBlack: boolean;
}

interface InternalSettings extends LegendRendererSettings {
  hitLineY: number;
  noteSpeed: number;
}

const DEFAULT_SETTINGS: InternalSettings = {
  noteNameStyle: 'off',
  simpleDisplayMode: false,
  pianoHeight: 80,
  transpose: 0,
  transposingInstrument: 'concert_pitch',
  practiceGuide: 'off',
  hitLineY: 0,
  noteSpeed: 1
};

export class LegendCanvasRendererInstance implements LegendRendererInstance {
  public readonly view: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly dpr: number;

  private width: number;
  private height: number;
  private settings: InternalSettings;

  private keyLayouts: Map<number, KeyLayout> = new Map();
  private whiteKeyLayouts: KeyLayout[] = [];
  private blackKeyLayouts: KeyLayout[] = [];

  private highlightedKeys: Set<number> = new Set();
  private guideHighlightedKeys: Set<number> = new Set();

  private onKeyPress?: (note: number) => void;
  private onKeyRelease?: (note: number) => void;

  private activeNotes: Map<string, ActiveNote> = new Map();
  private currentTime = 0;
  private lastUpdateTime = 0;

  private animationFrameId: number | null = null;
  private destroyed = false;

  private activePointerId: number | null = null;
  private currentDragNote: number | null = null;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.settings = {
      ...DEFAULT_SETTINGS,
      pianoHeight: Math.max(MIN_PIANO_HEIGHT, DEFAULT_SETTINGS.pianoHeight),
      hitLineY: height - Math.max(MIN_PIANO_HEIGHT, DEFAULT_SETTINGS.pianoHeight)
    };

    this.view = document.createElement('canvas');
    this.view.className = 'legend-canvas';
    this.view.style.touchAction = 'pan-x';
    this.view.style.display = 'block';
    this.view.style.pointerEvents = 'auto';

    this.dpr = window.devicePixelRatio ?? 1;
    const context = this.view.getContext('2d');
    if (!context) {
      throw new Error('CanvasRenderingContext2D is not available');
    }
    this.ctx = context;

    this.configureCanvasElement();
    this.buildKeyLayout();
    this.attachPointerEvents();
    this.startRenderLoop();
  }

  updateNotes(activeNotes: ActiveNote[], currentTime?: number): void {
    if (this.destroyed) return;
    if (typeof currentTime === 'number') {
      const movedBackward = currentTime < this.lastUpdateTime;
      const jumped = Math.abs(currentTime - this.lastUpdateTime) > LOOKAHEAD_SECONDS * 0.5;
      if (movedBackward || jumped) {
        this.activeNotes.clear();
      }
      this.lastUpdateTime = currentTime;
      this.currentTime = currentTime;
    }

    const next = new Map<string, ActiveNote>();
    for (const note of activeNotes) {
      next.set(note.id, note);
    }
    this.activeNotes = next;
  }

  updateSettings(settings: Partial<LegendRendererSettings>): void {
    if (this.destroyed) return;
    const prevPianoHeight = this.settings.pianoHeight;
    this.settings = {
      ...this.settings,
      ...settings,
      pianoHeight: settings.pianoHeight !== undefined
        ? Math.max(MIN_PIANO_HEIGHT, settings.pianoHeight)
        : this.settings.pianoHeight
    };
    this.settings.hitLineY = this.height - this.settings.pianoHeight;

    if (this.settings.pianoHeight !== prevPianoHeight) {
      this.buildKeyLayout();
    }
  }

  setKeyCallbacks(onKeyPress: (note: number) => void, onKeyRelease: (note: number) => void): void {
    this.onKeyPress = onKeyPress;
    this.onKeyRelease = onKeyRelease;
  }

  highlightKey(midiNote: number, active: boolean): void {
    const clamped = Math.min(HIGHEST_MIDI, Math.max(LOWEST_MIDI, Math.round(midiNote)));
    if (active) {
      this.highlightedKeys.add(clamped);
    } else {
      this.highlightedKeys.delete(clamped);
      this.guideHighlightedKeys.delete(clamped);
    }
  }

  resize(width: number, height: number): void {
    if (this.destroyed) return;
    this.width = width;
    this.height = height;
    this.configureCanvasElement();
    this.settings.hitLineY = this.height - this.settings.pianoHeight;
    this.buildKeyLayout();
  }

  destroy(): void {
    this.destroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.detachPointerEvents();
    this.activeNotes.clear();
    this.highlightedKeys.clear();
    this.guideHighlightedKeys.clear();
  }

  private configureCanvasElement(): void {
    this.view.width = this.width * this.dpr;
    this.view.height = this.height * this.dpr;
    this.view.style.width = `${this.width}px`;
    this.view.style.height = `${this.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private startRenderLoop(): void {
    const loop = () => {
      if (this.destroyed) return;
      const controller = (window as unknown as { unifiedFrameController?: { shouldSkipFrame: (time: number, channel: string) => boolean } }).unifiedFrameController;
      const now = performance.now();
      if (controller?.shouldSkipFrame(now, 'legend-canvas')) {
        this.animationFrameId = requestAnimationFrame(loop);
        return;
      }
      this.drawFrame();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  private drawFrame(): void {
    this.ctx.save();
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.drawBackground();
    this.drawNotes();
    this.drawHitLine();
    this.drawKeyboard();

    this.ctx.restore();
  }

  private drawBackground(): void {
    this.ctx.fillStyle = COLORS.background;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.strokeStyle = COLORS.guideline;
    this.ctx.lineWidth = 1;
    const divisions = 6;
    for (let i = 1; i < divisions; i++) {
      const y = (this.settings.hitLineY / divisions) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
  }

  private drawHitLine(): void {
    this.ctx.strokeStyle = COLORS.hitLine;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.settings.hitLineY);
    this.ctx.lineTo(this.width, this.settings.hitLineY);
    this.ctx.stroke();
  }

  private drawNotes(): void {
    if (this.activeNotes.size === 0) return;
    const totalDistance = this.settings.hitLineY + 10;
    const speedPxPerSec = (totalDistance / LOOKAHEAD_SECONDS) * this.settings.noteSpeed;

    for (const note of this.activeNotes.values()) {
      const { x, width, isBlack } = this.getNoteLayout(note.pitch);
      const y = this.getNoteY(note, speedPxPerSec);
      const noteHeight = this.getNoteHeight(note);
      if (y + noteHeight < 0 || y - noteHeight > this.height) {
        continue;
      }

      this.ctx.fillStyle = this.getNoteColor(note, isBlack);
      const rectX = x - width / 2;
      this.ctx.fillRect(rectX, y - noteHeight, width, noteHeight);

      const label = this.getDisplayNoteName(note);
      if (label) {
        this.ctx.font = '12px "Inter", "Noto Sans JP", sans-serif';
        this.ctx.fillStyle = COLORS.label;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText(label, x, y - noteHeight - 2);
      }
    }
  }

  private drawKeyboard(): void {
    const top = this.settings.hitLineY;
    const height = this.settings.pianoHeight;

    // white keys first
    for (const key of this.whiteKeyLayouts) {
      const { fill, stroke } = this.getKeyColors(key.midi);
      this.ctx.fillStyle = fill;
      this.ctx.fillRect(key.x, top, key.width, height);
      this.ctx.strokeStyle = stroke;
      this.ctx.strokeRect(key.x, top, key.width, height);
    }

    // black keys overlay
    for (const key of this.blackKeyLayouts) {
      const { fill } = this.getKeyColors(key.midi, true);
      const keyHeight = height * 0.65;
      this.ctx.fillStyle = fill;
      this.ctx.fillRect(key.x, top, key.width, keyHeight);
    }
  }

  private getNoteLayout(pitch: number): KeyLayout {
    const effectivePitch = this.getEffectivePitch(pitch);
    return this.keyLayouts.get(effectivePitch) ?? {
      midi: effectivePitch,
      x: this.width / 2,
      width: this.width / TOTAL_WHITE_KEYS,
      isBlack: false
    };
  }

  private getNoteY(note: ActiveNote, speed: number): number {
    if (typeof note.y === 'number') {
      return note.y;
    }
    const timeUntilHit = (note.time ?? 0) - this.currentTime;
    return this.settings.hitLineY - timeUntilHit * speed;
  }

  private getNoteHeight(note: ActiveNote): number {
    if (note.state === 'hit' || note.state === 'perfect' || note.state === 'good') {
      return 6;
    }
    return 12;
  }

  private getNoteColor(note: ActiveNote, isBlack: boolean): string {
    switch (note.state) {
      case 'hit':
      case 'good':
      case 'perfect':
        return COLORS.noteHit;
      case 'missed':
        return COLORS.noteMissed;
      default:
        return isBlack ? COLORS.noteBlack : COLORS.noteWhite;
    }
  }

  private buildKeyLayout(): void {
    this.keyLayouts.clear();
    this.whiteKeyLayouts = [];
    this.blackKeyLayouts = [];

    const whiteKeyWidth = this.width / TOTAL_WHITE_KEYS;
    const blackKeyWidth = whiteKeyWidth * 0.6;
    const whiteCenters = new Map<number, number>();
    let whiteIndex = 0;

    for (let midi = LOWEST_MIDI; midi <= HIGHEST_MIDI; midi++) {
      if (this.isBlackKey(midi)) continue;
      const x = whiteIndex * whiteKeyWidth;
      const layout: KeyLayout = { midi, x, width: whiteKeyWidth, isBlack: false };
      this.keyLayouts.set(midi, layout);
      this.whiteKeyLayouts.push(layout);
      whiteCenters.set(midi, x + whiteKeyWidth / 2);
      whiteIndex += 1;
    }

    for (let midi = LOWEST_MIDI; midi <= HIGHEST_MIDI; midi++) {
      if (!this.isBlackKey(midi)) continue;
      const prevWhite = this.findAdjacentWhite(midi, -1);
      const nextWhite = this.findAdjacentWhite(midi, 1);
      const prevCenter = prevWhite ? whiteCenters.get(prevWhite) ?? 0 : 0;
      const nextCenter = nextWhite ? whiteCenters.get(nextWhite) ?? this.width : this.width;
      const center = (prevCenter + nextCenter) / 2;
      const layout: KeyLayout = {
        midi,
        x: center - blackKeyWidth / 2,
        width: blackKeyWidth,
        isBlack: true
      };
      this.keyLayouts.set(midi, layout);
      this.blackKeyLayouts.push(layout);
    }
  }

  private findAdjacentWhite(midi: number, direction: -1 | 1): number | null {
    let current = midi + direction;
    while (current >= LOWEST_MIDI && current <= HIGHEST_MIDI) {
      if (!this.isBlackKey(current)) {
        return current;
      }
      current += direction;
    }
    return null;
  }

  private isBlackKey(midi: number): boolean {
    const normalized = ((midi % 12) + 12) % 12;
    return BLACK_KEY_SEMITONES.has(normalized);
  }

  private getEffectivePitch(pitch: number): number {
    const value = pitch + this.settings.transpose;
    return Math.min(HIGHEST_MIDI, Math.max(LOWEST_MIDI, value));
  }

  private getKeyColors(midi: number, isBlack = false): { fill: string; stroke: string } {
    const active = this.highlightedKeys.has(midi);
    const guide = this.guideHighlightedKeys.has(midi);
    if (active) {
      return { fill: COLORS.activeKey, stroke: COLORS.keyBorder };
    }
    if (guide) {
      return { fill: COLORS.guideKey, stroke: COLORS.keyBorder };
    }
    return {
      fill: isBlack ? COLORS.blackKey : COLORS.whiteKey,
      stroke: COLORS.keyBorder
    };
  }

  private getDisplayNoteName(note: ActiveNote): string | null {
    if (this.settings.noteNameStyle === 'off') {
      return null;
    }

    const targetStyle = this.settings.noteNameStyle;
    const { simpleDisplayMode } = this.settings;

    const convert = targetStyle === 'solfege'
      ? (name: string) => this.toSolfege(name)
      : (name: string) => name;

    if (simpleDisplayMode && note.noteName) {
      return convert(
        targetStyle === 'solfege'
          ? this.getSimplifiedDisplayName(note.noteName)
          : this.getEnglishSimplifiedDisplayName(note.noteName)
      );
    }

    if (!simpleDisplayMode && note.noteName) {
      return convert(note.noteName);
    }

    const pitch = this.getDisplayPitchForNames(note.pitch);
    const midiName = this.getMidiNoteName(pitch);
    return convert(midiName);
  }

  private getDisplayPitchForNames(pitch: number): number {
    return pitch + this.getTransposingInstrumentOffset();
  }

  private getTransposingInstrumentOffset(): number {
    switch (this.settings.transposingInstrument) {
      case 'bb_major_2nd':
        return 2;
      case 'bb_major_9th':
        return 14;
      case 'eb_major_6th':
        return 9;
      case 'eb_major_13th':
        return 21;
      default:
        return 0;
    }
  }

  private getMidiNoteName(midiNote: number): string {
    const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const index = ((Math.round(midiNote) % 12) + 12) % 12;
    return names[index];
  }

  private toSolfege(name: string): string {
    const normalized = name.replace(/\d+$/, '');
    const map: Record<string, string> = {
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
    return map[normalized] ?? normalized;
  }

  private getSimplifiedDisplayName(noteName: string): string {
    const base = noteName.replace(/\d+$/, '');
    const map: Record<string, string> = {
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
    return map[base] ?? base;
  }

  private getEnglishSimplifiedDisplayName(noteName: string): string {
    const base = noteName.replace(/\d+$/, '');
    const map: Record<string, string> = {
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
    return map[base] ?? base;
  }

  private attachPointerEvents(): void {
    this.view.addEventListener('pointerdown', this.handlePointerDown);
    this.view.addEventListener('pointermove', this.handlePointerMove);
    this.view.addEventListener('pointerup', this.handlePointerUp);
    this.view.addEventListener('pointerleave', this.handlePointerUp);
    this.view.addEventListener('pointercancel', this.handlePointerUp);
  }

  private detachPointerEvents(): void {
    this.view.removeEventListener('pointerdown', this.handlePointerDown);
    this.view.removeEventListener('pointermove', this.handlePointerMove);
    this.view.removeEventListener('pointerup', this.handlePointerUp);
    this.view.removeEventListener('pointerleave', this.handlePointerUp);
    this.view.removeEventListener('pointercancel', this.handlePointerUp);
  }

  private handlePointerDown = (event: PointerEvent): void => {
    if (this.activePointerId !== null) return;

    const note = this.getNoteFromPointer(event);
    if (note === null) return;

    this.activePointerId = event.pointerId;
    this.currentDragNote = note;
    try {
      this.view.setPointerCapture(event.pointerId);
    } catch (error) {
      log.warn('pointer capture failed', error);
    }

    this.triggerKeyPress(note);
    event.preventDefault();
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (this.activePointerId !== event.pointerId) return;
    const note = this.getNoteFromPointer(event);
    if (note === null || note === this.currentDragNote) return;
    if (this.currentDragNote !== null) {
      this.triggerKeyRelease(this.currentDragNote);
    }
    this.currentDragNote = note;
    this.triggerKeyPress(note);
  };

  private handlePointerUp = (event: PointerEvent): void => {
    if (this.activePointerId !== event.pointerId) return;
    if (this.currentDragNote !== null) {
      this.triggerKeyRelease(this.currentDragNote);
    }
    this.currentDragNote = null;
    this.activePointerId = null;
    try {
      this.view.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  };

  private getNoteFromPointer(event: PointerEvent): number | null {
    const rect = this.view.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (y < this.settings.hitLineY) {
      return null;
    }

    // black keys first
    for (const key of this.blackKeyLayouts) {
      if (this.pointInKey(x, y, key, this.settings.hitLineY, this.settings.pianoHeight * 0.65)) {
        return key.midi;
      }
    }
    for (const key of this.whiteKeyLayouts) {
      if (this.pointInKey(x, y, key, this.settings.hitLineY, this.settings.pianoHeight)) {
        return key.midi;
      }
    }
    return null;
  }

  private pointInKey(x: number, y: number, key: KeyLayout, top: number, height: number): boolean {
    return (
      x >= key.x &&
      x <= key.x + key.width &&
      y >= top &&
      y <= top + height
    );
  }

  private triggerKeyPress(note: number): void {
    this.highlightKey(note, true);
    this.onKeyPress?.(note);
  }

  private triggerKeyRelease(note: number): void {
    this.highlightKey(note, false);
    this.onKeyRelease?.(note);
  }
}

export const LegendCanvasRenderer: React.FC<LegendCanvasRendererProps> = ({
  width,
  height,
  onReady,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<LegendCanvasRendererInstance | null>(null);
  const widthRef = useRef(width);
  const heightRef = useRef(height);
  const onReadyRef = useRef<typeof onReady>(onReady);
  const skippedInitialOnReadyEffect = useRef(false);

  widthRef.current = width;
  heightRef.current = height;
  onReadyRef.current = onReady;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || rendererRef.current) {
      return;
    }

    const renderer = new LegendCanvasRendererInstance(widthRef.current, heightRef.current);
    rendererRef.current = renderer;
    container.appendChild(renderer.view);
    onReadyRef.current?.(renderer);

    return () => {
      renderer.destroy();
      rendererRef.current = null;
      onReadyRef.current?.(null);
    };
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.resize(width, height);
    }
  }, [width, height]);

  useEffect(() => {
    if (!skippedInitialOnReadyEffect.current) {
      skippedInitialOnReadyEffect.current = true;
      return;
    }
    if (rendererRef.current) {
      onReady?.(rendererRef.current);
    }
  }, [onReady]);

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      style={{
        width,
        height,
        minWidth: width,
        minHeight: height,
        overflow: 'hidden',
        backgroundColor: '#0a0f1c'
      }}
    />
  );
};

export default LegendCanvasRenderer;
