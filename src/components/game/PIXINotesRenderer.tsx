import React, { useEffect, useRef } from 'react';
import type { ActiveNote } from '@/types';
import { cn } from '@/utils/cn';
import { unifiedFrameController } from '@/utils/performanceOptimizer';

const WHITE_KEY_COUNT = 52;
const MIN_PIANO_HEIGHT = 70;
const POINTER_RELEASE_DELAY_MS = 150;

type NoteState = ActiveNote['state'];
type NoteNameStyle = 'off' | 'abc' | 'solfege';

interface RendererColors {
  visible: string;
  visibleBlack: string;
  hit: string;
  missed: string;
  perfect: string;
  good: string;
  whiteKey: string;
  blackKey: string;
  activeKey: string;
  guideKey: string;
  backgroundTop: string;
  backgroundBottom: string;
  grid: string;
  hitLine: string;
}

interface RendererSettings {
  noteWidth: number;
  noteHeight: number;
  pianoHeight: number;
  noteSpeed: number;
  showHitLine: boolean;
  viewportHeight: number;
  timingAdjustment: number;
  transpose: number;
  noteNameStyle: NoteNameStyle;
  simpleDisplayMode: boolean;
  transposingInstrument: string;
  practiceGuide?: 'off' | 'key' | 'key_auto';
  colors: RendererColors;
}

interface NoteRenderState {
  id: string;
  pitch: number;
  x: number;
  y: number;
  state: NoteState;
  noteName?: string;
  crossingLogged?: boolean;
  isBlack: boolean;
}

interface KeyRegion {
  midi: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isBlack: boolean;
}

export interface PIXINotesRendererProps {
  width: number;
  height: number;
  onReady?: (renderer: PIXINotesRendererInstance | null) => void;
  className?: string;
}

const DEFAULT_COLORS: RendererColors = {
  visible: '#4A90E2',
  visibleBlack: '#2C5282',
  hit: '#48BB78',
  missed: '#E53E3E',
  perfect: '#F6E05E',
  good: '#48BB78',
  whiteKey: '#FFFFFF',
  blackKey: '#2D2D2D',
  activeKey: '#FF8C00',
  guideKey: '#22C55E',
  backgroundTop: '#0A0F1F',
  backgroundBottom: '#1F2937',
  grid: 'rgba(148, 163, 184, 0.25)',
  hitLine: '#FBBF24'
};

const clamp = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
};

export class PIXINotesRendererInstance {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private devicePixelRatio: number;

  private readonly noteStates = new Map<string, NoteRenderState>();
  private readonly recycledNotes: NoteRenderState[] = [];
  private readonly tempActiveIds = new Set<string>();
  private readonly pointerActiveNotes = new Map<number, number>();
  private readonly activeKeyPresses = new Set<number>();
  private readonly highlightedKeys = new Set<number>();
  private readonly guideHighlightedKeys = new Set<number>();

  private keyRegions: KeyRegion[] = [];
  private animationFrame: number | null = null;
  private isDestroyed = false;
  private needsRedraw = true;
  private currentTime = 0;
  private frameToken: string | null = null;

  private onKeyPress?: (note: number) => void;
  private onKeyRelease?: (note: number) => void;

  private readonly settings: RendererSettings = {
    noteWidth: 24,
    noteHeight: 4,
    pianoHeight: 100,
    noteSpeed: 400,
    showHitLine: true,
    viewportHeight: 600,
    timingAdjustment: 0,
    transpose: 0,
    noteNameStyle: 'off',
    simpleDisplayMode: false,
    transposingInstrument: 'concert_pitch',
    practiceGuide: 'off',
    colors: DEFAULT_COLORS
  };

  constructor(width: number, height: number) {
    this.canvas = document.createElement('canvas');
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to acquire 2D rendering context');
    }
    this.ctx = context;
    this.width = width;
    this.height = height;
    this.devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    this.applyCanvasSize();
    this.settings.pianoHeight = Math.max(MIN_PIANO_HEIGHT, this.settings.pianoHeight);
    this.settings.viewportHeight = height;
    this.recalculateNoteWidth();
    this.rebuildKeyRegions();
    this.attachPointerHandlers();
    this.startLoop();
  }

  updateNotes(activeNotes: ActiveNote[], currentTime?: number): void {
    if (typeof currentTime === 'number') {
      this.currentTime = currentTime;
    }

    this.tempActiveIds.clear();

    for (const note of activeNotes) {
      this.tempActiveIds.add(note.id);
      let cached = this.noteStates.get(note.id);
      if (!cached) {
        cached = this.obtainNoteState();
        cached.id = note.id;
        this.noteStates.set(note.id, cached);
      }

      const previouslyCrossed = cached.crossingLogged;
      cached.pitch = note.pitch;
      cached.state = note.state;
      cached.noteName = note.noteName;
      cached.crossingLogged = note.crossingLogged;
      cached.x = this.pitchToX(note.pitch);
      cached.y = typeof note.y === 'number' ? note.y : this.computeNoteY(note);
      cached.isBlack = this.isBlackKey(note.pitch + this.settings.transpose);

      if (note.crossingLogged && !previouslyCrossed && this.settings.practiceGuide !== 'off') {
        this.flashGuideHighlight(note.pitch + this.settings.transpose);
      }
    }

    for (const [id, state] of this.noteStates) {
      if (!this.tempActiveIds.has(id)) {
        this.noteStates.delete(id);
        this.recycleNoteState(state);
      }
    }

    this.needsRedraw = true;
  }

  highlightKey(midiNote: number, active: boolean): void {
    if (active) {
      this.highlightedKeys.add(midiNote);
    } else {
      this.highlightedKeys.delete(midiNote);
    }
    this.needsRedraw = true;
  }

  setKeyCallbacks(onKeyPress: (note: number) => void, onKeyRelease: (note: number) => void): void {
    this.onKeyPress = onKeyPress;
    this.onKeyRelease = onKeyRelease;
  }

  updateSettings(newSettings: Partial<RendererSettings>): void {
    if (newSettings.pianoHeight !== undefined) {
      newSettings.pianoHeight = Math.max(MIN_PIANO_HEIGHT, newSettings.pianoHeight);
    }

    const prevPianoHeight = this.settings.pianoHeight;
    const prevTranspose = this.settings.transpose;

    Object.assign(this.settings, newSettings);

    if (newSettings.pianoHeight && newSettings.pianoHeight !== prevPianoHeight) {
      this.rebuildKeyRegions();
    }

    if (newSettings.transpose !== undefined && newSettings.transpose !== prevTranspose) {
      this.noteStates.forEach((state) => {
        state.x = this.pitchToX(state.pitch);
        state.isBlack = this.isBlackKey(state.pitch + this.settings.transpose);
      });
    }

    this.needsRedraw = true;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.settings.viewportHeight = height;
    this.applyCanvasSize();
    this.recalculateNoteWidth();
    this.rebuildKeyRegions();
    this.needsRedraw = true;
  }

  destroy(): void {
    this.isDestroyed = true;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.detachPointerHandlers();
    this.pointerActiveNotes.clear();
    this.noteStates.clear();
    this.highlightedKeys.clear();
    this.guideHighlightedKeys.clear();
    this.activeKeyPresses.clear();
    this.recycledNotes.length = 0;
  }

  get view(): HTMLCanvasElement {
    return this.canvas;
  }

  setGuideHighlightsByPitchClasses(pitchClasses: number[]): void {
    const normalized = new Set(pitchClasses.map((pc) => ((pc % 12) + 12) % 12));
    this.guideHighlightedKeys.clear();
    for (let midi = 21; midi <= 108; midi++) {
      if (normalized.has(midi % 12)) {
        this.guideHighlightedKeys.add(midi);
      }
    }
    this.needsRedraw = true;
  }

  setGuideHighlightsByMidiNotes(midiNotes: number[]): void {
    this.guideHighlightedKeys.clear();
    for (const midi of midiNotes) {
      const noteNumber = clamp(Math.round(midi), 21, 108);
      this.guideHighlightedKeys.add(noteNumber);
    }
    this.needsRedraw = true;
  }

  clearAllHighlights(): void {
    this.highlightedKeys.clear();
    this.guideHighlightedKeys.clear();
    this.needsRedraw = true;
  }

  clearActiveHighlights(): void {
    this.highlightedKeys.clear();
    this.needsRedraw = true;
  }

  private get hitLineY(): number {
    return this.height - this.settings.pianoHeight;
  }

  private obtainNoteState(): NoteRenderState {
    return this.recycledNotes.pop() ?? {
      id: '',
      pitch: 0,
      x: 0,
      y: 0,
      state: 'visible',
      isBlack: false
    };
  }

  private recycleNoteState(state: NoteRenderState): void {
    this.recycledNotes.push(state);
  }

  private computeNoteY(note: ActiveNote): number {
    const distance = this.hitLineY - (note.time - this.currentTime) * this.settings.noteSpeed;
    return distance;
  }

  private pitchToX(pitch: number): number {
    const effectivePitch = pitch + this.settings.transpose;
    const targetKey = this.keyRegions.find((region) => region.midi === effectivePitch);
    if (targetKey) {
      return targetKey.x + targetKey.width / 2;
    }

    const whiteKeyWidth = this.width / WHITE_KEY_COUNT;
    let whiteIndex = 0;
    for (let note = 21; note < effectivePitch; note++) {
      if (!this.isBlackKey(note)) whiteIndex++;
    }
    return whiteIndex * whiteKeyWidth + whiteKeyWidth / 2;
  }

  private isBlackKey(midiNote: number): boolean {
    const noteInOctave = (midiNote % 12 + 12) % 12;
    return [1, 3, 6, 8, 10].includes(noteInOctave);
  }

  private applyCanvasSize(): void {
    const dpr = this.devicePixelRatio;
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private recalculateNoteWidth(): void {
    const whiteKeyWidth = this.width / WHITE_KEY_COUNT;
    this.settings.noteWidth = Math.max(whiteKeyWidth - 2, 8);
  }

  private rebuildKeyRegions(): void {
    const regions: KeyRegion[] = [];
    const hitLineY = this.hitLineY;
    const whiteKeyWidth = this.width / WHITE_KEY_COUNT;
    let whiteIndex = 0;
    for (let midi = 21; midi <= 108; midi++) {
      if (!this.isBlackKey(midi)) {
        regions.push({
          midi,
          x: whiteIndex * whiteKeyWidth,
          y: hitLineY,
          width: whiteKeyWidth,
          height: this.settings.pianoHeight,
          isBlack: false
        });
        whiteIndex++;
      }
    }

    for (let midi = 21; midi <= 108; midi++) {
      if (this.isBlackKey(midi)) {
        const prevWhite = midi - 1;
        let prevIndex = 0;
        for (let note = 21; note < prevWhite; note++) {
          if (!this.isBlackKey(note)) prevIndex++;
        }
        const x = (prevIndex + 1) * whiteKeyWidth - whiteKeyWidth / 2;
        regions.push({
          midi,
          x: x - whiteKeyWidth * 0.35,
          y: hitLineY,
          width: whiteKeyWidth * 0.7,
          height: this.settings.pianoHeight * 0.65,
          isBlack: true
        });
      }
    }

    this.keyRegions = regions;
  }

  private attachPointerHandlers(): void {
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointerleave', this.handlePointerUp);
    window.addEventListener('pointerup', this.handleWindowPointerUp);
  }

  private detachPointerHandlers(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointerleave', this.handlePointerUp);
    window.removeEventListener('pointerup', this.handleWindowPointerUp);
  }

  private handlePointerDown = (event: PointerEvent): void => {
    const midi = this.hitTest(event);
    if (midi === null) return;
    this.pointerActiveNotes.set(event.pointerId, midi);
    this.handleKeyPress(midi);
    this.canvas.setPointerCapture?.(event.pointerId);
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (!this.pointerActiveNotes.has(event.pointerId)) return;
    const midi = this.hitTest(event);
    if (midi === null) return;
    const current = this.pointerActiveNotes.get(event.pointerId);
    if (current === midi) return;
    if (current !== undefined) {
      this.handleKeyRelease(current);
    }
    this.pointerActiveNotes.set(event.pointerId, midi);
    this.handleKeyPress(midi);
  };

  private handlePointerUp = (event: PointerEvent): void => {
    const midi = this.pointerActiveNotes.get(event.pointerId);
    if (midi === undefined) return;
    this.pointerActiveNotes.delete(event.pointerId);
    this.handleKeyRelease(midi);
  };

  private handleWindowPointerUp = (): void => {
    for (const midi of this.pointerActiveNotes.values()) {
      this.handleKeyRelease(midi);
    }
    this.pointerActiveNotes.clear();
  };

  private handleKeyPress(midi: number): void {
    if (this.activeKeyPresses.has(midi)) return;
    this.activeKeyPresses.add(midi);
    this.highlightKey(midi, true);
    this.onKeyPress?.(midi);
  }

  private handleKeyRelease(midi: number): void {
    if (!this.activeKeyPresses.has(midi)) return;
    this.activeKeyPresses.delete(midi);
    this.highlightKey(midi, false);
    this.onKeyRelease?.(midi);
  }

  private hitTest(event: PointerEvent): number | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (y < this.hitLineY) return null;

    for (const region of this.keyRegions) {
      if (!region.isBlack) continue;
      if (
        x >= region.x &&
        x <= region.x + region.width &&
        y >= region.y &&
        y <= region.y + region.height
      ) {
        return region.midi;
      }
    }

    for (const region of this.keyRegions) {
      if (region.isBlack) continue;
      if (
        x >= region.x &&
        x <= region.x + region.width &&
        y >= region.y &&
        y <= region.y + region.height
      ) {
        return region.midi;
      }
    }

    return null;
  }

  private flashGuideHighlight(midi: number): void {
    if (this.activeKeyPresses.has(midi)) {
      return;
    }
    this.highlightKey(midi, true);
    window.setTimeout(() => {
      if (!this.activeKeyPresses.has(midi)) {
        this.highlightKey(midi, false);
      }
    }, POINTER_RELEASE_DELAY_MS);
  }

  private startLoop(): void {
    const loop = (timestamp: number) => {
      if (this.isDestroyed) return;

      if (unifiedFrameController.shouldSkipFrame(timestamp, 'render')) {
        this.animationFrame = requestAnimationFrame(loop);
        return;
      }

      if (this.needsRedraw) {
        this.frameToken = unifiedFrameController.beginFrame('render');
        this.drawFrame();
        unifiedFrameController.endFrame(this.frameToken);
        this.frameToken = null;
        this.needsRedraw = false;
      }

      this.animationFrame = requestAnimationFrame(loop);
    };

    this.animationFrame = requestAnimationFrame(loop);
  }

  private drawFrame(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    this.drawBackground();
    this.drawGuidelines();
    this.drawNotes();
    if (this.settings.showHitLine) {
      this.drawHitLine();
    }
    this.drawKeyboard();
  }

  private drawBackground(): void {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.hitLineY);
    gradient.addColorStop(0, this.settings.colors.backgroundTop);
    gradient.addColorStop(1, this.settings.colors.backgroundBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.hitLineY);
  }

  private drawGuidelines(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = this.settings.colors.grid;
    ctx.lineWidth = 1;
    const whiteKeyWidth = this.width / WHITE_KEY_COUNT;
    for (let i = 0; i <= WHITE_KEY_COUNT; i++) {
      const x = i * whiteKeyWidth;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, this.hitLineY);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawNotes(): void {
    const ctx = this.ctx;
    const noteHeight = Math.max(3, this.settings.noteHeight);
    const halfWidth = this.settings.noteWidth / 2;
    for (const note of this.noteStates.values()) {
      if (note.state === 'hit' || note.state === 'good' || note.state === 'perfect') {
        continue;
      }
      const y = note.y;
      if (y < -noteHeight || y > this.height + noteHeight) continue;
      ctx.fillStyle = this.resolveNoteColor(note);
      ctx.fillRect(note.x - halfWidth, y - noteHeight, this.settings.noteWidth, noteHeight);

      if (this.settings.noteNameStyle !== 'off' && note.noteName) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px "Kaisei Opti", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(note.noteName, note.x, y - noteHeight - 2);
      }
    }
  }

  private resolveNoteColor(note: NoteRenderState): string {
    const { colors } = this.settings;
    switch (note.state) {
      case 'missed':
        return colors.missed;
      case 'good':
      case 'perfect':
      case 'hit':
        return colors.hit;
      default:
        return note.isBlack ? colors.visibleBlack : colors.visible;
    }
  }

  private drawHitLine(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = this.settings.colors.hitLine;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.hitLineY - 1);
    ctx.lineTo(this.width, this.hitLineY - 1);
    ctx.stroke();
    ctx.restore();
  }

  private drawKeyboard(): void {
    const ctx = this.ctx;
    ctx.save();

    for (const region of this.keyRegions) {
      if (region.isBlack) continue;
      ctx.fillStyle = this.resolveKeyColor(region.midi, false);
      ctx.fillRect(region.x, region.y, region.width, region.height);
      ctx.strokeStyle = '#0f172a';
      ctx.strokeRect(region.x, region.y, region.width, region.height);
    }

    for (const region of this.keyRegions) {
      if (!region.isBlack) continue;
      ctx.fillStyle = this.resolveKeyColor(region.midi, true);
      ctx.fillRect(region.x, region.y, region.width, region.height);
      ctx.strokeStyle = '#111827';
      ctx.strokeRect(region.x, region.y, region.width, region.height);
    }

    ctx.restore();
  }

  private resolveKeyColor(midi: number, isBlack: boolean): string {
    const { colors } = this.settings;
    if (this.highlightedKeys.has(midi)) {
      return colors.activeKey;
    }
    if (this.guideHighlightedKeys.has(midi)) {
      return colors.guideKey;
    }
    return isBlack ? colors.blackKey : colors.whiteKey;
  }
}

export const CanvasNotesRenderer: React.FC<PIXINotesRendererProps> = ({
  width,
  height,
  onReady,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<PIXINotesRendererInstance | null>(null);
  const latestOnReady = useRef<PIXINotesRendererProps['onReady']>(onReady);
  const initialSizeRef = useRef({ width, height });

  useEffect(() => {
    latestOnReady.current = onReady;
    if (rendererRef.current) {
      onReady?.(rendererRef.current);
    }
  }, [onReady]);

  useEffect(() => {
    if (!containerRef.current || rendererRef.current) return;
    const { width: initialWidth, height: initialHeight } = initialSizeRef.current;
    const renderer = new PIXINotesRendererInstance(initialWidth, initialHeight);
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.view);
    renderer.view.style.touchAction = 'pan-x';
    renderer.view.style.display = 'block';

    return () => {
      renderer.destroy();
      rendererRef.current = null;
      latestOnReady.current?.(null);
    };
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.resize(width, height);
    }
  }, [width, height]);

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

export { CanvasNotesRenderer as PIXINotesRenderer };
export default CanvasNotesRenderer;
