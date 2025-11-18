import React, { useEffect, useRef } from 'react';
import type { ActiveNote } from '@/types';
import { cn } from '@/utils/cn';
import platform from '@/platform';
import type {
  LegendRendererInstance,
  LegendRendererReadyCallback,
  LegendRendererSettings
} from './LegendRenderer.types';

const MIN_MIDI = 21;
const MAX_MIDI = 108;
const TOTAL_WHITE_KEYS = 52;
const LOOKAHEAD_SECONDS = 12;

const DEFAULT_SETTINGS: Required<LegendRendererSettings> & {
  noteWidth: number;
  noteHeight: number;
  noteSpeed: number;
  showHitLine: boolean;
  viewportHeight: number;
  timingAdjustment: number;
} = {
  noteNameStyle: 'off',
  simpleDisplayMode: false,
  pianoHeight: 90,
  transpose: 0,
  transposingInstrument: 'concert_pitch',
  practiceGuide: 'off',
  noteWidth: 24,
  noteHeight: 6,
  noteSpeed: 420,
  showHitLine: true,
  viewportHeight: 600,
  timingAdjustment: 0
};

const COLORS = {
  backgroundTop: '#0f172a',
  backgroundBottom: '#1e1b4b',
  noteWhite: '#60a5fa',
  noteBlack: '#3b82f6',
  noteHit: '#22c55e',
  noteMiss: '#f97316',
  pianoWhite: '#f8fafc',
  pianoBlack: '#111827',
  pianoBorder: '#1f2937',
  activeKey: '#f97316',
  guideKey: '#22c55e',
  hitLine: '#facc15'
};

interface KeyRegion {
  note: number;
  x: number;
  width: number;
  height: number;
  isBlack: boolean;
}

interface CanvasNotesRendererProps {
  width: number;
  height: number;
  className?: string;
  onReady?: LegendRendererReadyCallback;
}

export class CanvasNotesRendererInstance implements LegendRendererInstance {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private settings: typeof DEFAULT_SETTINGS;
  private activeNotes: ActiveNote[] = [];
  private currentTime = 0;
  private externalHighlights: Set<number> = new Set();
  private guideHighlights: Set<number> = new Set();
  private manualHighlights: Set<number> = new Set();
  private keyRegions: KeyRegion[] = [];
  private keyCallbacks: {
    onKeyPress?: (note: number) => void;
    onKeyRelease?: (note: number) => void;
  } = {};
  private pointerActiveKeys: Map<number, number> = new Map();
  private hitLineY: number;
  private destroyed = false;
  private animationFrameId: number | null = null;
  private needsRender = true;
  private readonly windowRef = platform.getWindow();

  constructor(width: number, height: number) {
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    this.canvas.style.touchAction = 'pan-x';
    this.canvas.style.userSelect = 'none';
    this.canvas.style.webkitUserSelect = 'none';
    this.canvas.style.webkitTapHighlightColor = 'transparent';

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D コンテキストを取得できませんでした。');
    }
    this.ctx = ctx;

    this.settings = { ...DEFAULT_SETTINGS };
    this.hitLineY = height - this.settings.pianoHeight;
    this.resize(width, height);
    this.attachPointerEvents();
  }

  get view(): HTMLCanvasElement {
    return this.canvas;
  }

  updateNotes(activeNotes: ActiveNote[], currentTime?: number): void {
    this.activeNotes = activeNotes;
    if (typeof currentTime === 'number') {
      this.currentTime = currentTime;
    }
    this.requestRender();
  }

  updateSettings(newSettings: Partial<LegendRendererSettings>): void {
    const prevPianoHeight = this.settings.pianoHeight;
    this.settings = {
      ...this.settings,
      ...newSettings,
      noteWidth: newSettings.noteWidth ?? this.settings.noteWidth,
      noteHeight: newSettings.noteHeight ?? this.settings.noteHeight,
      noteSpeed: newSettings.noteSpeed ?? this.settings.noteSpeed,
      showHitLine: newSettings.showHitLine ?? this.settings.showHitLine,
      viewportHeight: newSettings.viewportHeight ?? this.settings.viewportHeight,
      timingAdjustment: newSettings.timingAdjustment ?? this.settings.timingAdjustment
    };

    if (newSettings.pianoHeight !== undefined && newSettings.pianoHeight !== prevPianoHeight) {
      this.hitLineY = this.canvas.height / (this.windowRef.devicePixelRatio || 1) - this.settings.pianoHeight;
      this.rebuildKeyRegions();
    }

    this.requestRender();
  }

  setKeyCallbacks(onKeyPress: (note: number) => void, onKeyRelease: (note: number) => void): void {
    this.keyCallbacks.onKeyPress = onKeyPress;
    this.keyCallbacks.onKeyRelease = onKeyRelease;
  }

  highlightKey(midiNote: number, active: boolean): void {
    if (midiNote < MIN_MIDI || midiNote > MAX_MIDI) {
      return;
    }
    if (active) {
      this.externalHighlights.add(midiNote);
    } else {
      this.externalHighlights.delete(midiNote);
    }
    this.requestRender();
  }

  resize(width: number, height: number): void {
    const dpr = this.windowRef.devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.floor(width * dpr));
    this.canvas.height = Math.max(1, Math.floor(height * dpr));
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.hitLineY = height - this.settings.pianoHeight;
    this.rebuildKeyRegions();
    this.requestRender();
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      this.windowRef.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.destroyed = true;
    this.detachPointerEvents();
    this.pointerActiveKeys.clear();
    this.manualHighlights.clear();
    this.externalHighlights.clear();
    this.guideHighlights.clear();
  }

  private requestRender(): void {
    if (this.destroyed) return;
    this.needsRender = true;
    if (this.animationFrameId !== null) return;
    this.animationFrameId = this.windowRef.requestAnimationFrame(() => {
      this.animationFrameId = null;
      if (!this.needsRender || this.destroyed) {
        return;
      }
      this.needsRender = false;
      this.draw();
    });
  }

  private draw(): void {
    this.drawBackground();
    this.drawNotes();
    if (this.settings.showHitLine) {
      this.drawHitLine();
    }
    this.drawKeyboard();
  }

  private drawBackground(): void {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.hitLineY);
    gradient.addColorStop(0, COLORS.backgroundTop);
    gradient.addColorStop(1, COLORS.backgroundBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.hitLineY);
  }

  private drawNotes(): void {
    const ctx = this.ctx;
    const noteHeight = this.settings.noteHeight;

    for (const note of this.activeNotes) {
      const x = this.getNoteX(note.pitch);
      if (Number.isNaN(x)) continue;
      const y = this.getNoteY(note);
      const width = this.getNoteWidth(note.pitch);
      const color = this.getNoteColor(note);
      ctx.fillStyle = color;
      ctx.globalAlpha = this.getNoteAlpha(note);
      ctx.fillRect(x - width / 2, y - noteHeight / 2, width, noteHeight);

      if (this.settings.noteNameStyle !== 'off') {
        const label = this.getNoteLabel(note);
        if (label) {
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = '#f9fafb';
          ctx.font = '12px "Kaisei Opti", system-ui';
          ctx.textAlign = 'center';
          ctx.fillText(label, x, y - noteHeight);
        }
      }
      ctx.globalAlpha = 1;
    }
  }

  private getNoteY(note: ActiveNote): number {
    if (typeof note.y === 'number') {
      return note.y;
    }
    const totalDistance = this.hitLineY + 40;
    const speed = totalDistance / LOOKAHEAD_SECONDS;
    const adjustedTime = note.time - this.currentTime;
    return this.hitLineY - adjustedTime * speed;
  }

  private getNoteColor(note: ActiveNote): string {
    switch (note.state) {
      case 'hit':
      case 'good':
      case 'perfect':
        return COLORS.noteHit;
      case 'missed':
        return COLORS.noteMiss;
      default: {
        const effective = note.pitch + this.settings.transpose;
        return this.isBlackKey(effective) ? COLORS.noteBlack : COLORS.noteWhite;
      }
    }
  }

  private getNoteAlpha(note: ActiveNote): number {
    if (note.state === 'hit' || note.state === 'good' || note.state === 'perfect') {
      return 0.25;
    }
    return 0.95;
  }

  private drawHitLine(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = COLORS.hitLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, this.hitLineY);
    ctx.lineTo(this.canvas.width, this.hitLineY);
    ctx.stroke();
  }

  private drawKeyboard(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(0, this.hitLineY);
    ctx.fillStyle = COLORS.pianoBorder;
    ctx.fillRect(0, 0, this.canvas.width, this.settings.pianoHeight);

    // Draw white keys first
    for (const region of this.keyRegions.filter(k => !k.isBlack)) {
      const isHighlighted = this.isKeyHighlighted(region.note);
      ctx.fillStyle = isHighlighted ? this.getHighlightColor(region.note) : COLORS.pianoWhite;
      ctx.strokeStyle = COLORS.pianoBorder;
      ctx.lineWidth = 1;
      ctx.fillRect(region.x, 0, region.width, region.height);
      ctx.strokeRect(region.x, 0, region.width, region.height);
    }

    // Draw black keys
    for (const region of this.keyRegions.filter(k => k.isBlack)) {
      const isHighlighted = this.isKeyHighlighted(region.note);
      ctx.fillStyle = isHighlighted ? this.getHighlightColor(region.note) : COLORS.pianoBlack;
      ctx.fillRect(region.x, 0, region.width, region.height);
    }

    ctx.restore();
  }

  private getHighlightColor(note: number): string {
    return this.manualHighlights.has(note) || this.externalHighlights.has(note)
      ? COLORS.activeKey
      : COLORS.guideKey;
  }

  private isKeyHighlighted(note: number): boolean {
    return (
      this.manualHighlights.has(note) ||
      this.externalHighlights.has(note) ||
      this.guideHighlights.has(note)
    );
  }

  private rebuildKeyRegions(): void {
    const whiteKeyWidth = this.canvas.width / (this.windowRef.devicePixelRatio || 1) / TOTAL_WHITE_KEYS;
    const whiteRegions: KeyRegion[] = [];
    const blackRegions: KeyRegion[] = [];
    let whiteIndex = 0;

    for (let midi = MIN_MIDI; midi <= MAX_MIDI; midi++) {
      if (this.isBlackKey(midi)) {
        const { x } = this.getBlackKeyPosition(midi, whiteKeyWidth);
        const width = whiteKeyWidth * 0.6;
        blackRegions.push({
          note: midi,
          x: x - width / 2,
          width,
          height: this.settings.pianoHeight * 0.65,
          isBlack: true
        });
      } else {
        whiteRegions.push({
          note: midi,
          x: whiteIndex * whiteKeyWidth,
          width: whiteKeyWidth,
          height: this.settings.pianoHeight,
          isBlack: false
        });
        whiteIndex++;
      }
    }

    this.keyRegions = [...whiteRegions, ...blackRegions];
  }

  private getBlackKeyPosition(midi: number, whiteWidth: number): { x: number } {
    let whiteKeyIndex = 0;
    for (let note = MIN_MIDI; note < midi; note++) {
      if (!this.isBlackKey(note)) {
        whiteKeyIndex++;
      }
    }
    const offsets: Record<number, number> = {
      1: 0.7,
      3: 1.7,
      6: 2.8,
      8: 3.8,
      10: 4.8
    };
    const octaveOffset = offsets[midi % 12] ?? 0;
    const octaveBase = whiteKeyIndex - (whiteKeyIndex % 7);
    return {
      x: (octaveBase + octaveOffset) * whiteWidth
    };
  }

  private getNoteX(pitch: number): number {
    const effectivePitch = pitch + this.settings.transpose;
    if (effectivePitch < MIN_MIDI || effectivePitch > MAX_MIDI) {
      return Number.NaN;
    }
    const region = this.keyRegions.find((key) => key.note === effectivePitch);
    if (!region) {
      return Number.NaN;
    }
    return region.x + region.width / 2;
  }

  private getNoteWidth(pitch: number): number {
    const effectivePitch = pitch + this.settings.transpose;
    const baseWidth = this.settings.noteWidth;
    return this.isBlackKey(effectivePitch) ? baseWidth * 0.7 : baseWidth;
  }

  private getNoteLabel(note: ActiveNote): string | null {
    if (this.settings.noteNameStyle === 'off') {
      return null;
    }

    let sourceName: string | undefined = note.noteName;
    if (!sourceName) {
      sourceName = this.getMidiNoteName(note.pitch + this.settings.transpose);
    }

    if (!sourceName) {
      return null;
    }

    if (this.settings.simpleDisplayMode) {
      sourceName = this.getSimplifiedName(sourceName);
    }

    if (this.settings.noteNameStyle === 'solfege') {
      return this.toSolfege(sourceName);
    }

    return sourceName;
  }

  private getMidiNoteName(pitch: number): string {
    const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const index = ((pitch % 12) + 12) % 12;
    return names[index];
  }

  private toSolfege(name: string): string {
    const mapping: Record<string, string> = {
      'C': 'ド',
      'C#': 'ド#',
      'D': 'レ',
      'D#': 'レ#',
      'E': 'ミ',
      'F': 'ファ',
      'F#': 'ファ#',
      'G': 'ソ',
      'G#': 'ソ#',
      'A': 'ラ',
      'A#': 'ラ#',
      'B': 'シ'
    };
    const key = name.replace(/\d+$/, '');
    return mapping[key] ?? key;
  }

  private getSimplifiedName(name: string): string {
    const normalized = name.replace(/\d+$/, '');
    const map: Record<string, string> = {
      'B#': 'C',
      'E#': 'F',
      'Cb': 'B',
      'Fb': 'E',
      'Ax': 'B',
      'Bx': 'C#',
      'Cx': 'D',
      'Dx': 'D#',
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
    return map[normalized] ?? normalized;
  }

  private isBlackKey(midiNote: number): boolean {
    const noteInOctave = ((midiNote % 12) + 12) % 12;
    return [1, 3, 6, 8, 10].includes(noteInOctave);
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
    if (this.destroyed) return;
    const note = this.getNoteFromPointer(event);
    if (note === null) return;
    this.canvas.setPointerCapture(event.pointerId);
    this.pointerActiveKeys.set(event.pointerId, note);
    this.manualHighlights.add(note);
    this.keyCallbacks.onKeyPress?.(note);
    this.requestRender();
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (!this.pointerActiveKeys.has(event.pointerId)) return;
    const currentNote = this.pointerActiveKeys.get(event.pointerId) ?? null;
    const nextNote = this.getNoteFromPointer(event);
    if (nextNote === null || nextNote === currentNote) {
      return;
    }
    if (currentNote !== null) {
      this.manualHighlights.delete(currentNote);
      this.keyCallbacks.onKeyRelease?.(currentNote);
    }
    this.pointerActiveKeys.set(event.pointerId, nextNote);
    this.manualHighlights.add(nextNote);
    this.keyCallbacks.onKeyPress?.(nextNote);
    this.requestRender();
  };

  private handlePointerUp = (event: PointerEvent): void => {
    const note = this.pointerActiveKeys.get(event.pointerId);
    if (note !== undefined) {
      this.manualHighlights.delete(note);
      this.keyCallbacks.onKeyRelease?.(note);
      this.pointerActiveKeys.delete(event.pointerId);
      this.requestRender();
    }
    try {
      this.canvas.releasePointerCapture(event.pointerId);
    } catch {
      // ignore errors when capture was not set
    }
  };

  private getNoteFromPointer(event: PointerEvent): number | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (y < this.hitLineY) {
      return null;
    }

    const relativeY = y - this.hitLineY;

    // Black keys first
    for (const region of this.keyRegions.filter(k => k.isBlack)) {
      if (
        x >= region.x &&
        x <= region.x + region.width &&
        relativeY >= 0 &&
        relativeY <= region.height
      ) {
        return region.note;
      }
    }

    for (const region of this.keyRegions.filter(k => !k.isBlack)) {
      if (
        x >= region.x &&
        x <= region.x + region.width &&
        relativeY >= 0 &&
        relativeY <= region.height
      ) {
        return region.note;
      }
    }

    return null;
  }

  // Optional APIs for guide integration (kept for compatibility with PIXI implementation consumers)
  setGuideHighlightsByPitchClasses(pitchClasses: number[]): void {
    const normalized = new Set(pitchClasses.map((pc) => ((pc % 12) + 12) % 12));
    const nextSet = new Set<number>();
    for (let midi = MIN_MIDI; midi <= MAX_MIDI; midi++) {
      if (normalized.has(((midi % 12) + 12) % 12)) {
        nextSet.add(midi);
      }
    }
    this.guideHighlights = nextSet;
    this.requestRender();
  }

  setGuideHighlightsByMidiNotes(midiNotes: number[]): void {
    this.guideHighlights = new Set(
      midiNotes.filter((note) => note >= MIN_MIDI && note <= MAX_MIDI)
    );
    this.requestRender();
  }
}

export const CanvasNotesRenderer: React.FC<CanvasNotesRendererProps> = ({
  width,
  height,
  className,
  onReady
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasNotesRendererInstance | null>(null);

  useEffect(() => {
    if (!containerRef.current || rendererRef.current) {
      return;
    }
    const renderer = new CanvasNotesRendererInstance(width, height);
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
    if (rendererRef.current) {
      rendererRef.current.resize(width, height);
    }
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
      style={{ width, height }}
    />
  );
};

export default CanvasNotesRenderer;
