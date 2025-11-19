import React, { useEffect, useRef } from 'react';
import type { ActiveNote } from '@/types';
import { cn } from '@/utils/cn';
import { log } from '@/utils/logger';
import { unifiedFrameController } from '@/utils/performanceOptimizer';

const LOWEST_NOTE = 21;
const HIGHEST_NOTE = 108;
const WHITE_KEY_COUNT = 52;
const BLACK_KEY_WIDTH_RATIO = 0.64;
const SEEK_RESET_THRESHOLD = 4; // seconds
const LABEL_FONT = '600 12px "Inter", "Noto Sans JP", sans-serif';

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
}

interface RendererSettings {
  noteWidth: number;
  noteHeight: number;
  hitLineY: number;
  pianoHeight: number;
  noteSpeed: number;
  colors: RendererColors;
  noteNameStyle: 'off' | 'abc' | 'solfege';
  simpleDisplayMode: boolean;
  transpose: number;
  transposingInstrument: string;
  practiceGuide?: 'off' | 'key' | 'key_auto';
  showHitLine: boolean;
  viewportHeight: number;
  timingAdjustment: number;
}

interface NoteVisual {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isBlack: boolean;
  state: ActiveNote['state'];
  labelText: string | null;
  labelCanvas: HTMLCanvasElement | null;
}

interface KeyLayout {
  midi: number;
  x: number;
  width: number;
  height: number;
  isBlack: boolean;
}

type KeyCallbacks = {
  onPress?: (note: number) => void;
  onRelease?: (note: number) => void;
};

const defaultColors: RendererColors = {
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
  backgroundTop: '#05050A',
  backgroundBottom: '#101020'
};

const isBlackKey = (midi: number): boolean => {
  const note = midi % 12;
  return note === 1 || note === 3 || note === 6 || note === 8 || note === 10;
};

const clampMidi = (midi: number): number => {
  if (midi < LOWEST_NOTE) return LOWEST_NOTE;
  if (midi > HIGHEST_NOTE) return HIGHEST_NOTE;
  return midi;
};

const simplifyNoteName = (name: string): string => {
  if (!name) return name;
  return name
    .replace('♭', 'b')
    .replace('♯', '#')
    .replace(/sharp/gi, '#')
    .replace(/flat/gi, 'b');
};

const midiToNoteName = (midi: number): string => {
  const pitchClasses = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const note = pitchClasses[clampMidi(midi) % 12];
  return `${note}${octave}`;
};

const midiToSolfege = (midi: number): string => {
  const solfege = ['ド', 'ド#', 'レ', 'レ#', 'ミ', 'ファ', 'ファ#', 'ソ', 'ソ#', 'ラ', 'ラ#', 'シ'];
  return solfege[clampMidi(midi) % 12];
};

class LabelAtlas {
  private cache = new Map<string, HTMLCanvasElement>();

  get(text: string, fillStyle = '#FFFFFF'): HTMLCanvasElement {
    const key = `${fillStyle}:${text}`;
    const cached = this.cache.get(key);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    ctx.font = LABEL_FONT;
    const metrics = ctx.measureText(text);
    const padding = 4;
    const width = Math.ceil(metrics.width + padding * 2);
    const height = 18;
    canvas.width = width;
    canvas.height = height;
    ctx.font = LABEL_FONT;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    const radius = 4;
    ctx.beginPath();
    ctx.moveTo(padding, 0);
    ctx.lineTo(width - padding, 0);
    ctx.quadraticCurveTo(width, 0, width, padding);
    ctx.lineTo(width, height - padding);
    ctx.quadraticCurveTo(width, height, width - padding, height);
    ctx.lineTo(padding, height);
    ctx.quadraticCurveTo(0, height, 0, height - padding);
    ctx.lineTo(0, padding);
    ctx.quadraticCurveTo(0, 0, padding, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = fillStyle;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(text, width / 2, height / 2);
    this.cache.set(key, canvas);
    return canvas;
  }

  clear(): void {
    this.cache.clear();
  }
}

export class CanvasNotesRendererInstance {
  public readonly settings: RendererSettings;
  private readonly root: HTMLDivElement;
  private readonly notesCanvas: HTMLCanvasElement;
  private readonly pianoCanvas: HTMLCanvasElement;
  private readonly notesCtx: CanvasRenderingContext2D;
  private readonly pianoCtx: CanvasRenderingContext2D;
  private readonly dpr: number;
  private readonly labelAtlas = new LabelAtlas();
  private readonly notePool: NoteVisual[] = [];
  private readonly activeNotes = new Map<string, NoteVisual>();
  private readonly renderList: NoteVisual[] = [];
  private readonly seenIds = new Set<string>();
  private keyCallbacks: KeyCallbacks = {};
  private keyLayouts: KeyLayout[] = [];
  private highlightedKeys = new Set<number>();
  private guideKeys = new Set<number>();
  private pointerState = new Map<number, number>();
  private rafId: number | null = null;
  private disposed = false;
  private notesDirty = true;
  private pianoDirty = true;
  private lastTime = 0;

  constructor(private width: number, private height: number) {
    this.dpr = window.devicePixelRatio || 1;
    this.settings = {
      noteWidth: this.computeWhiteKeyWidth() - 2,
      noteHeight: 12,
      hitLineY: height - 80,
      pianoHeight: 80,
      noteSpeed: 400,
      colors: defaultColors,
      noteNameStyle: 'off',
      simpleDisplayMode: false,
      transpose: 0,
      transposingInstrument: 'concert_pitch',
      practiceGuide: 'off',
      showHitLine: true,
      viewportHeight: height,
      timingAdjustment: 0
    };

    this.root = document.createElement('div');
    this.root.className = 'w-full h-full relative select-none';
    this.root.style.touchAction = 'pan-x';

    this.notesCanvas = document.createElement('canvas');
    this.pianoCanvas = document.createElement('canvas');
    this.notesCanvas.style.position = 'absolute';
    this.notesCanvas.style.inset = '0';
    this.notesCanvas.style.width = `${width}px`;
    this.notesCanvas.style.height = `${height}px`;
    this.pianoCanvas.style.position = 'absolute';
    this.pianoCanvas.style.inset = '0';
    this.pianoCanvas.style.width = `${width}px`;
    this.pianoCanvas.style.height = `${height}px`;
    this.pianoCanvas.style.pointerEvents = 'auto';

    this.root.appendChild(this.notesCanvas);
    this.root.appendChild(this.pianoCanvas);

    const notesCtx = this.notesCanvas.getContext('2d');
    const pianoCtx = this.pianoCanvas.getContext('2d');
    if (!notesCtx || !pianoCtx) {
      throw new Error('Canvas context not available');
    }
    this.notesCtx = notesCtx;
    this.pianoCtx = pianoCtx;

    this.resizeCanvas(this.notesCanvas, width, height);
    this.resizeCanvas(this.pianoCanvas, width, height);

    this.computeKeyLayouts();
    this.attachPointerHandlers();
    this.startLoop();
  }

  private resizeCanvas(canvas: HTMLCanvasElement, width: number, height: number): void {
    canvas.width = Math.floor(width * this.dpr);
    canvas.height = Math.floor(height * this.dpr);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(this.dpr, this.dpr);
    }
  }

  private computeWhiteKeyWidth(): number {
    return this.width / WHITE_KEY_COUNT;
  }

  private computeKeyLayouts(): void {
    const whiteKeyWidth = this.computeWhiteKeyWidth();
    const layouts: KeyLayout[] = [];
    let whiteIndex = 0;
    for (let midi = LOWEST_NOTE; midi <= HIGHEST_NOTE; midi++) {
      if (isBlackKey(midi)) {
        const prevWhite = Math.max(0, whiteIndex - 1);
        const nextWhite = Math.min(WHITE_KEY_COUNT - 1, whiteIndex);
        const prevCenter = (prevWhite + 0.5) * whiteKeyWidth;
        const nextCenter = (nextWhite + 0.5) * whiteKeyWidth;
        const center = (prevCenter + nextCenter) / 2;
        const width = whiteKeyWidth * BLACK_KEY_WIDTH_RATIO;
        layouts.push({
          midi,
          x: center - width / 2,
          width,
          height: this.settings.pianoHeight * 0.65,
          isBlack: true
        });
      } else {
        const x = whiteIndex * whiteKeyWidth;
        layouts.push({
          midi,
          x,
          width: whiteKeyWidth,
          height: this.settings.pianoHeight,
          isBlack: false
        });
        whiteIndex += 1;
      }
    }
    this.keyLayouts = layouts;
    this.pianoDirty = true;
  }

  private attachPointerHandlers(): void {
    this.pianoCanvas.addEventListener('pointerdown', this.handlePointerDown);
    this.pianoCanvas.addEventListener('pointermove', this.handlePointerMove);
    this.pianoCanvas.addEventListener('pointerup', this.handlePointerUp);
    this.pianoCanvas.addEventListener('pointercancel', this.handlePointerUp);
    this.pianoCanvas.addEventListener('pointerleave', this.handlePointerUp);
  }

  private detachPointerHandlers(): void {
    this.pianoCanvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.pianoCanvas.removeEventListener('pointermove', this.handlePointerMove);
    this.pianoCanvas.removeEventListener('pointerup', this.handlePointerUp);
    this.pianoCanvas.removeEventListener('pointercancel', this.handlePointerUp);
    this.pianoCanvas.removeEventListener('pointerleave', this.handlePointerUp);
  }

  private handlePointerDown = (event: PointerEvent): void => {
    const midi = this.pickMidiFromEvent(event);
    if (midi === null) return;
    this.pianoCanvas.setPointerCapture(event.pointerId);
    this.pointerState.set(event.pointerId, midi);
    this.highlightKey(midi, true);
    this.keyCallbacks.onPress?.(midi);
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (!this.pointerState.has(event.pointerId)) return;
    const currentMidi = this.pointerState.get(event.pointerId) ?? null;
    const nextMidi = this.pickMidiFromEvent(event);
    if (nextMidi === null || nextMidi === currentMidi) return;
    if (currentMidi !== null) {
      this.pointerState.set(event.pointerId, nextMidi);
      this.highlightKey(currentMidi, false);
      this.keyCallbacks.onRelease?.(currentMidi);
    }
    this.highlightKey(nextMidi, true);
    this.keyCallbacks.onPress?.(nextMidi);
  };

  private handlePointerUp = (event: PointerEvent): void => {
    const midi = this.pointerState.get(event.pointerId);
    if (midi !== undefined) {
      this.highlightKey(midi, false);
      this.keyCallbacks.onRelease?.(midi);
      this.pointerState.delete(event.pointerId);
    }
    try {
      this.pianoCanvas.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  };

  private pickMidiFromEvent(event: PointerEvent): number | null {
    const rect = this.pianoCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (y < this.settings.hitLineY) {
      return null;
    }
    for (const layout of this.keyLayouts) {
      if (!layout.isBlack) continue;
      if (x >= layout.x && x <= layout.x + layout.width && y >= this.height - layout.height) {
        return layout.midi;
      }
    }
    for (const layout of this.keyLayouts) {
      if (layout.isBlack) continue;
      if (x >= layout.x && x <= layout.x + layout.width && y >= this.height - layout.height) {
        return layout.midi;
      }
    }
    return null;
  }

  private startLoop(): void {
    const loop = () => {
      if (this.disposed) return;
      const now = performance.now();
      if (!unifiedFrameController.shouldSkipFrame(now, 'render')) {
        performance.mark('notes-render-start');
        if (this.notesDirty) {
          this.drawNotes();
          this.notesDirty = false;
        }
        if (this.pianoDirty) {
          this.drawPiano();
          this.pianoDirty = false;
        }
        performance.mark('notes-render-end');
        performance.measure('canvas-notes-render', 'notes-render-start', 'notes-render-end');
        performance.clearMeasures('canvas-notes-render');
        performance.clearMarks('notes-render-start');
        performance.clearMarks('notes-render-end');
        unifiedFrameController.recordFrame('render', now);
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private borrowNoteVisual(): NoteVisual {
    const pooled = this.notePool.pop();
    if (pooled) {
      return pooled;
    }
    return {
      id: '',
      x: 0,
      y: 0,
      width: this.settings.noteWidth,
      height: this.settings.noteHeight,
      isBlack: false,
      state: 'visible',
      labelText: null,
      labelCanvas: null
    };
  }

  private releaseNoteVisual(note: NoteVisual): void {
    note.id = '';
    note.labelCanvas = null;
    note.labelText = null;
    this.notePool.push(note);
  }

  private updateVisualFromNote(visual: NoteVisual, note: ActiveNote): void {
    const effectivePitch = clampMidi(note.pitch + this.settings.transpose);
    const layout = this.keyLayouts.find((key) => key.midi === effectivePitch);
    if (!layout) return;

    visual.id = note.id;
    visual.isBlack = layout.isBlack;
    visual.width = layout.isBlack ? this.settings.noteWidth * BLACK_KEY_WIDTH_RATIO : this.settings.noteWidth;
    visual.height = this.settings.noteHeight;
    visual.x = layout.x + (layout.width - visual.width) / 2;
    visual.y = note.y ?? this.estimateNoteY(note.time, this.lastTime);
    visual.state = note.state;

    const labelText = this.resolveLabelText(note, effectivePitch);
    if (labelText !== visual.labelText) {
      visual.labelText = labelText;
      visual.labelCanvas = labelText ? this.labelAtlas.get(labelText) : null;
    }
  }

  private estimateNoteY(noteTime: number, currentTime: number): number {
    const timeToHit = noteTime - currentTime;
    const startY = -this.settings.noteHeight;
    const distance = this.settings.hitLineY - startY;
    const FallDuration = 4 / (this.settings.noteSpeed / 400);
    return this.settings.hitLineY - (timeToHit / FallDuration) * distance;
  }

  private resolveLabelText(note: ActiveNote, effectivePitch: number): string | null {
    if (this.settings.noteNameStyle === 'off') {
      return null;
    }
    if (note.noteName) {
      const text = this.settings.simpleDisplayMode ? simplifyNoteName(note.noteName) : note.noteName;
      return this.settings.noteNameStyle === 'solfege' ? midiToSolfege(effectivePitch) : text;
    }
    return this.settings.noteNameStyle === 'solfege'
      ? midiToSolfege(effectivePitch)
      : midiToNoteName(effectivePitch);
  }

  private colorForState(note: NoteVisual): string {
    switch (note.state) {
      case 'hit':
      case 'good':
        return this.settings.colors.hit;
      case 'missed':
        return this.settings.colors.missed;
      default:
        return note.isBlack ? this.settings.colors.visibleBlack : this.settings.colors.visible;
    }
  }

  private drawNotes(): void {
    const ctx = this.notesCtx;
    ctx.clearRect(0, 0, this.width, this.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, this.settings.colors.backgroundTop);
    gradient.addColorStop(1, this.settings.colors.backgroundBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    if (this.settings.showHitLine) {
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, this.settings.hitLineY);
      ctx.lineTo(this.width, this.settings.hitLineY);
      ctx.stroke();
    }

    const whiteNotes: NoteVisual[] = [];
    const blackNotes: NoteVisual[] = [];
    this.renderList.forEach((note) => {
      if (note.isBlack) {
        blackNotes.push(note);
      } else {
        whiteNotes.push(note);
      }
    });

    const drawNoteList = (list: NoteVisual[]) => {
      for (const note of list) {
        if (note.y + note.height / 2 < 0 || note.y - note.height / 2 > this.height) continue;
        ctx.fillStyle = this.colorForState(note);
        const radius = Math.min(6, note.height / 2);
        const top = note.y - note.height / 2;
        const bottom = note.y + note.height / 2;
        const left = note.x;
        const right = note.x + note.width;
        ctx.beginPath();
        ctx.moveTo(left + radius, top);
        ctx.lineTo(right - radius, top);
        ctx.quadraticCurveTo(right, top, right, top + radius);
        ctx.lineTo(right, bottom - radius);
        ctx.quadraticCurveTo(right, bottom, right - radius, bottom);
        ctx.lineTo(left + radius, bottom);
        ctx.quadraticCurveTo(left, bottom, left, bottom - radius);
        ctx.lineTo(left, top + radius);
        ctx.quadraticCurveTo(left, top, left + radius, top);
        ctx.fill();

        if (note.labelCanvas) {
          const label = note.labelCanvas;
          ctx.drawImage(label, left + note.width / 2 - label.width / 2, top - label.height - 4);
        }
      }
    };

    drawNoteList(whiteNotes);
    drawNoteList(blackNotes);
  }

  private drawPiano(): void {
    const ctx = this.pianoCtx;
    ctx.clearRect(0, 0, this.width, this.height);

    const pianoTop = this.height - this.settings.pianoHeight;
    ctx.fillStyle = '#11131d';
    ctx.fillRect(0, pianoTop, this.width, this.settings.pianoHeight);

    for (const layout of this.keyLayouts.filter((k) => !k.isBlack)) {
      const color = this.resolveKeyColor(layout.midi, false);
      ctx.fillStyle = color;
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(layout.x, this.height - layout.height, layout.width, layout.height);
      ctx.fill();
      ctx.stroke();
    }

    for (const layout of this.keyLayouts.filter((k) => k.isBlack)) {
      const color = this.resolveKeyColor(layout.midi, true);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.rect(layout.x, this.height - layout.height - (this.settings.pianoHeight - layout.height), layout.width, layout.height);
      ctx.fill();
    }
  }

  private resolveKeyColor(midi: number, isBlackKey: boolean): string {
    if (this.highlightedKeys.has(midi)) {
      return this.settings.colors.activeKey;
    }
    if (this.guideKeys.has(midi)) {
      return this.settings.colors.guideKey;
    }
    return isBlackKey ? this.settings.colors.blackKey : this.settings.colors.whiteKey;
  }

  updateNotes(activeNotes: ActiveNote[], currentTime?: number): void {
    if (this.disposed) return;
    const time = currentTime ?? 0;
    if (time + SEEK_RESET_THRESHOLD < this.lastTime || time - this.lastTime > SEEK_RESET_THRESHOLD) {
      this.resetVisuals();
    }
    this.lastTime = time;
    this.seenIds.clear();
    this.renderList.length = 0;
    for (const note of activeNotes) {
      this.seenIds.add(note.id);
      let visual = this.activeNotes.get(note.id);
      if (!visual) {
        visual = this.borrowNoteVisual();
        this.activeNotes.set(note.id, visual);
      }
      this.updateVisualFromNote(visual, note);
      if (visual.id) {
        this.renderList.push(visual);
      }
    }

    this.activeNotes.forEach((visual, id) => {
      if (!this.seenIds.has(id)) {
        this.activeNotes.delete(id);
        this.releaseNoteVisual(visual);
      }
    });

    this.notesDirty = true;
  }

  private resetVisuals(): void {
    this.activeNotes.forEach((visual) => this.releaseNoteVisual(visual));
    this.activeNotes.clear();
    this.renderList.length = 0;
  }

  updateSettings(partial: Partial<RendererSettings>): void {
    Object.assign(this.settings, partial);
    if (partial.viewportHeight) {
      this.height = partial.viewportHeight;
      this.settings.hitLineY = this.height - this.settings.pianoHeight;
      this.resizeCanvas(this.notesCanvas, this.width, this.height);
      this.resizeCanvas(this.pianoCanvas, this.width, this.height);
    }
    if (partial.pianoHeight) {
      this.settings.hitLineY = this.height - this.settings.pianoHeight;
      this.computeKeyLayouts();
    }
    if (partial.noteWidth) {
      this.settings.noteWidth = partial.noteWidth;
    }
    if (partial.noteHeight) {
      this.settings.noteHeight = partial.noteHeight;
    }
    this.notesDirty = true;
    this.pianoDirty = true;
  }

  highlightKey(midiNote: number, active: boolean): void {
    if (active) {
      this.highlightedKeys.add(midiNote);
    } else {
      this.highlightedKeys.delete(midiNote);
    }
    this.pianoDirty = true;
  }

  setGuideHighlightsByMidiNotes(midiNotes: number[]): void {
    const keep = new Set<number>(midiNotes.map((n) => clampMidi(n)));
    this.guideKeys.forEach((key) => {
      if (!keep.has(key)) {
        this.guideKeys.delete(key);
      }
    });
    keep.forEach((key) => this.guideKeys.add(key));
    this.pianoDirty = true;
  }

  setGuideHighlightsByPitchClasses(pitchClasses: number[]): void {
    const normalized = new Set(pitchClasses.map((pc) => ((pc % 12) + 12) % 12));
    const next = new Set<number>();
    for (let midi = LOWEST_NOTE; midi <= HIGHEST_NOTE; midi++) {
      if (normalized.has(midi % 12)) {
        next.add(midi);
      }
    }
    this.setGuideHighlightsByMidiNotes(Array.from(next));
  }

  clearAllHighlights(): void {
    this.highlightedKeys.clear();
    this.guideKeys.clear();
    this.pianoDirty = true;
  }

  clearActiveHighlights(): void {
    this.highlightedKeys.clear();
    this.pianoDirty = true;
  }

  setKeyCallbacks(onPress?: (note: number) => void, onRelease?: (note: number) => void): void {
    this.keyCallbacks = { onPress, onRelease };
  }

  destroy(): void {
    this.disposed = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.detachPointerHandlers();
    this.clearAllHighlights();
    this.resetVisuals();
    this.labelAtlas.clear();
  }

  get view(): HTMLDivElement {
    return this.root;
  }
}

export type PIXINotesRendererInstance = CanvasNotesRendererInstance;

interface PIXINotesRendererProps {
  width: number;
  height: number;
  onReady?: (renderer: PIXINotesRendererInstance | null) => void;
  className?: string;
}

export const PIXINotesRenderer: React.FC<PIXINotesRendererProps> = ({
  width,
  height,
  onReady,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasNotesRendererInstance | null>(null);

  useEffect(() => {
    if (!containerRef.current || rendererRef.current) return;
    const renderer = new CanvasNotesRendererInstance(width, height);
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.view);
    onReady?.(renderer);
    log.info('🎨 Canvasノーツレンダラー初期化完了');

    return () => {
      onReady?.(null);
      renderer.destroy();
      if (renderer.view.parentElement) {
        renderer.view.parentElement.removeChild(renderer.view);
      }
      rendererRef.current = null;
    };
  }, [width, height, onReady]);

  return <div ref={containerRef} className={cn('w-full h-full relative', className)} />;
};

export default PIXINotesRenderer;
