import React, { useEffect, useRef } from 'react';
import type { PrecisionNote } from '@/utils/earTrainingPrecisionNotes';
import type { PrecisionNoteJudgment, PrecisionNoteRuntimeState } from '@/utils/earTrainingPrecisionJudge';
import { pianoKeyboardTheme } from '@/theme/pianoKeyboardTheme';
import { cn } from '@/utils/cn';

export const PRECISION_NOTE_FALL_LEAD_SEC = 3;

const BLACK_KEY_OFFSETS = new Set([1, 3, 6, 8, 10]);
const NOTE_VANISH_EFFECT_DURATION_MS = 180;
const NOTE_HIT_EFFECT_DURATION_MS = 120;
const LANE_FLASH_DURATION_MS = 160;

interface KeyGeometry {
  midi: number;
  isBlack: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface NoteRenderSnapshot {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  radius: number;
  isBlack: boolean;
  judgment: PrecisionNoteJudgment | 'hit';
}

interface VanishEffect {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  startedAtMs: number;
}

interface PrecisionNotesRendererProps {
  width: number;
  height: number;
  minMidi: number;
  maxMidi: number;
  pianoHeight: number;
  className?: string;
  onReady?: (renderer: PrecisionNotesRendererInstance | null) => void;
}

export interface PrecisionNotesRendererInstance {
  setKeyboardRange(minMidi: number, maxMidi: number): void;
  setPhraseTimeSec(timeSec: number): void;
  setNotes(notes: readonly PrecisionNote[]): void;
  setRuntimeStates(states: ReadonlyMap<string, PrecisionNoteRuntimeState>): void;
  setPracticeKeyboardHighlight(enabled: boolean): void;
  highlightKey(midi: number, active: boolean): void;
  setKeyCallbacks(onPress: (midi: number) => void, onRelease: (midi: number) => void): void;
  resize(width: number, height: number, pianoHeight: number): void;
  destroy(): void;
}

const isBlackKey = (midi: number): boolean => (
  BLACK_KEY_OFFSETS.has(((Math.round(midi) % 12) + 12) % 12)
);

const countWhiteKeysInRange = (minMidi: number, maxMidi: number): number => {
  let count = 0;
  for (let midi = minMidi; midi <= maxMidi; midi += 1) {
    if (!isBlackKey(midi)) {
      count += 1;
    }
  }
  return Math.max(1, count);
};

class PrecisionNotesRendererEngine implements PrecisionNotesRendererInstance {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private pianoHeight = 88;
  private minMidi = 60;
  private maxMidi = 83;
  private phraseTimeSec = 0;
  private notes: readonly PrecisionNote[] = [];
  private runtimeStates = new Map<string, PrecisionNoteRuntimeState>();
  private practiceHighlight = false;
  private activeKeys = new Set<number>();
  private keyGeometries: KeyGeometry[] = [];
  private whiteKeyWidth = 1;
  private hitLineY = 0;
  private noteLaneHeight = 0;
  private noteSpeedPxPerSec = 1;
  private staticLayer: HTMLCanvasElement | null = null;
  private staticDirty = true;
  private rafId: number | null = null;
  private lastFrameMs = 0;
  private vanishEffects: VanishEffect[] = [];
  private previousJudgments = new Map<string, PrecisionNoteJudgment>();
  private onKeyPress: ((midi: number) => void) | null = null;
  private onKeyRelease: ((midi: number) => void) | null = null;
  private pointerMidi: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable');
    }
    this.ctx = ctx;
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('pointercancel', this.handlePointerUp);
    canvas.addEventListener('pointerleave', this.handlePointerUp);
  }

  setKeyboardRange(minMidi: number, maxMidi: number): void {
    this.minMidi = Math.min(minMidi, maxMidi);
    this.maxMidi = Math.max(minMidi, maxMidi);
    this.staticDirty = true;
    this.recalculateLayout();
    this.requestRender();
  }

  setPhraseTimeSec(timeSec: number): void {
    this.phraseTimeSec = timeSec;
    this.trackJudgmentTransitions();
    this.requestRender();
  }

  setNotes(notes: readonly PrecisionNote[]): void {
    this.notes = notes;
    this.previousJudgments.clear();
    for (const note of notes) {
      this.previousJudgments.set(note.id, 'pending');
    }
    this.requestRender();
  }

  setRuntimeStates(states: ReadonlyMap<string, PrecisionNoteRuntimeState>): void {
    this.runtimeStates = new Map(states);
    this.trackJudgmentTransitions();
    this.requestRender();
  }

  setPracticeKeyboardHighlight(enabled: boolean): void {
    this.practiceHighlight = enabled;
    this.requestRender();
  }

  highlightKey(midi: number, active: boolean): void {
    const rounded = Math.round(midi);
    if (active) {
      this.activeKeys.add(rounded);
    } else {
      this.activeKeys.delete(rounded);
    }
    this.requestRender();
  }

  setKeyCallbacks(onPress: (midi: number) => void, onRelease: (midi: number) => void): void {
    this.onKeyPress = onPress;
    this.onKeyRelease = onRelease;
  }

  resize(width: number, height: number, pianoHeight: number): void {
    this.width = width;
    this.height = height;
    this.pianoHeight = pianoHeight;
    this.canvas.width = width;
    this.canvas.height = height;
    this.staticDirty = true;
    this.recalculateLayout();
    this.requestRender();
  }

  destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
    this.canvas.removeEventListener('pointerleave', this.handlePointerUp);
  }

  private handlePointerDown = (event: PointerEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (y < this.hitLineY) {
      return;
    }
    const midi = this.findKeyAt(x, y);
    if (midi === null) {
      return;
    }
    this.pointerMidi = midi;
    this.activeKeys.add(midi);
    this.onKeyPress?.(midi);
    this.requestRender();
  };

  private handlePointerUp = (): void => {
    if (this.pointerMidi !== null) {
      this.onKeyRelease?.(this.pointerMidi);
      this.activeKeys.delete(this.pointerMidi);
      this.pointerMidi = null;
      this.requestRender();
    }
  };

  private findKeyAt(x: number, y: number): number | null {
    for (let i = this.keyGeometries.length - 1; i >= 0; i -= 1) {
      const key = this.keyGeometries[i];
      if (!key) {
        continue;
      }
      if (x >= key.x && x <= key.x + key.width && y >= key.y && y <= key.y + key.height) {
        return key.midi;
      }
    }
    return null;
  }

  private recalculateLayout(): void {
    const whiteCount = countWhiteKeysInRange(this.minMidi, this.maxMidi);
    this.whiteKeyWidth = this.width / whiteCount;
    this.hitLineY = this.height - this.pianoHeight;
    this.noteLaneHeight = Math.max(0, this.hitLineY);
    this.noteSpeedPxPerSec = this.noteLaneHeight / PRECISION_NOTE_FALL_LEAD_SEC;
    this.keyGeometries = this.buildKeyGeometries();
  }

  private buildKeyGeometries(): KeyGeometry[] {
    const keys: KeyGeometry[] = [];
    let whiteIndex = 0;
    for (let midi = this.minMidi; midi <= this.maxMidi; midi += 1) {
      const black = isBlackKey(midi);
      if (!black) {
        keys.push({
          midi,
          isBlack: false,
          x: whiteIndex * this.whiteKeyWidth,
          width: this.whiteKeyWidth,
          height: this.pianoHeight,
          y: this.hitLineY,
        });
        whiteIndex += 1;
      }
    }
    whiteIndex = 0;
    for (let midi = this.minMidi; midi <= this.maxMidi; midi += 1) {
      if (!isBlackKey(midi)) {
        whiteIndex += 1;
        continue;
      }
      const whiteLeft = (whiteIndex - 1) * this.whiteKeyWidth;
      keys.push({
        midi,
        isBlack: true,
        x: whiteLeft + this.whiteKeyWidth * 0.7,
        width: this.whiteKeyWidth * 0.6,
        height: this.pianoHeight * 0.62,
        y: this.hitLineY,
      });
    }
    return keys;
  }

  private laneXForMidi(midi: number): { x: number; width: number } {
    const rounded = Math.round(midi);
    for (const key of this.keyGeometries) {
      if (key.midi === rounded) {
        return { x: key.x, width: key.width };
      }
    }
    return { x: 0, width: this.whiteKeyWidth };
  }

  private trackJudgmentTransitions(): void {
    const now = performance.now();
    for (const note of this.notes) {
      const state = this.runtimeStates.get(note.id);
      const prev = this.previousJudgments.get(note.id) ?? 'pending';
      const next = state?.judgment ?? 'pending';
      if (prev === next) {
        continue;
      }
      this.previousJudgments.set(note.id, next);
      if (next === 'good' || next === 'miss') {
        const lane = this.laneXForMidi(note.midi);
        const bottom = this.noteBottomY(note);
        const height = note.durationSec * this.noteSpeedPxPerSec;
        this.vanishEffects.push({
          x: lane.x,
          y: bottom - height,
          width: lane.width,
          height,
          color: next === 'good' ? '#22c55e' : '#ef4444',
          startedAtMs: now,
        });
        if (this.vanishEffects.length > 24) {
          this.vanishEffects.shift();
        }
      }
    }
  }

  private noteBottomY(note: PrecisionNote): number {
    const delta = note.startSec - this.phraseTimeSec;
    return this.hitLineY - delta * this.noteSpeedPxPerSec;
  }

  private requestRender(): void {
    if (this.rafId !== null) {
      return;
    }
    this.rafId = requestAnimationFrame(this.renderFrame);
  }

  private renderFrame = (nowMs: number): void => {
    this.rafId = null;
    if (nowMs - this.lastFrameMs < 16) {
      this.requestRender();
      return;
    }
    this.lastFrameMs = nowMs;
    this.draw(nowMs);
    if (this.hasAnimatedContent()) {
      this.requestRender();
    }
  };

  private hasAnimatedContent(): boolean {
    if (this.vanishEffects.length > 0) {
      return true;
    }
    for (const note of this.notes) {
      const state = this.runtimeStates.get(note.id);
      if (!state) {
        continue;
      }
      const bottom = this.noteBottomY(note);
      const top = bottom - note.durationSec * this.noteSpeedPxPerSec;
      if (top < this.noteLaneHeight + 40 && bottom > -40) {
        return true;
      }
    }
    return false;
  }

  private draw(nowMs: number): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    this.ensureStaticLayer();
    if (this.staticLayer) {
      ctx.drawImage(this.staticLayer, 0, 0);
    }
    this.drawNotes(ctx);
    this.drawVanishEffects(ctx, nowMs);
    this.drawHitLine(ctx);
    this.drawKeyHighlights(ctx);
  }

  private ensureStaticLayer(): void {
    if (!this.staticDirty && this.staticLayer) {
      return;
    }
    if (!this.staticLayer) {
      this.staticLayer = document.createElement('canvas');
    }
    this.staticLayer.width = this.width;
    this.staticLayer.height = this.height;
    const ctx = this.staticLayer.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, this.width, this.height);
    this.drawGuideLanes(ctx);
    this.drawKeys(ctx);
    this.staticDirty = false;
  }

  private drawGuideLanes(ctx: CanvasRenderingContext2D): void {
    let whiteIndex = 0;
    for (let midi = this.minMidi; midi <= this.maxMidi; midi += 1) {
      if (isBlackKey(midi)) {
        continue;
      }
      const x = whiteIndex * this.whiteKeyWidth;
      const pitchClass = ((midi % 12) + 12) % 12;
      const isEvenLane = whiteIndex % 2 === 0;
      ctx.fillStyle = isEvenLane ? 'rgba(30,41,59,0.35)' : 'rgba(15,23,42,0.25)';
      ctx.fillRect(x, 0, this.whiteKeyWidth, this.noteLaneHeight);
      if (pitchClass === 11 || pitchClass === 4) {
        ctx.fillStyle = 'rgba(148,163,184,0.18)';
        ctx.fillRect(x + this.whiteKeyWidth - 1, 0, 2, this.noteLaneHeight);
      }
      whiteIndex += 1;
    }
  }

  private drawKeys(ctx: CanvasRenderingContext2D): void {
    for (const key of this.keyGeometries) {
      if (key.isBlack) {
        continue;
      }
      ctx.fillStyle = pianoKeyboardTheme.whiteKeyBase;
      ctx.fillRect(key.x, key.y, key.width, key.height);
      ctx.strokeStyle = pianoKeyboardTheme.keySeparatorStroke;
      ctx.strokeRect(key.x + 0.5, key.y + 0.5, key.width - 1, key.height - 1);
    }
    for (const key of this.keyGeometries) {
      if (!key.isBlack) {
        continue;
      }
      ctx.fillStyle = pianoKeyboardTheme.blackKeyBase;
      ctx.fillRect(key.x, key.y, key.width, key.height);
    }
  }

  private drawHitLine(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.hitLineY);
    ctx.lineTo(this.width, this.hitLineY);
    ctx.stroke();
  }

  private drawKeyHighlights(ctx: CanvasRenderingContext2D): void {
    if (!this.practiceHighlight && this.activeKeys.size === 0) {
      return;
    }
    for (const key of this.keyGeometries) {
      if (!this.activeKeys.has(key.midi)) {
        continue;
      }
      ctx.fillStyle = 'rgba(56,189,248,0.55)';
      if (key.isBlack) {
        ctx.fillRect(key.x, key.y, key.width, key.height);
      } else {
        const inset = key.width * 0.08;
        ctx.fillRect(key.x + inset, key.y, key.width - inset * 2, key.height);
      }
    }
  }

  private buildNoteSnapshots(): NoteRenderSnapshot[] {
    const snapshots: NoteRenderSnapshot[] = [];
    for (const note of this.notes) {
      const state = this.runtimeStates.get(note.id);
      const judgment = state?.judgment ?? 'pending';
      if (state?.hiddenFromLane) {
        continue;
      }
      const bottom = this.noteBottomY(note);
      const height = Math.max(6, note.durationSec * this.noteSpeedPxPerSec);
      const top = bottom - height;
      if (bottom < -20 || top > this.noteLaneHeight + 20) {
        continue;
      }
      const lane = this.laneXForMidi(note.midi);
      const isBlack = note.isBlackKey;
      let color = isBlack ? '#a855f7' : '#38bdf8';
      if (judgment === 'good') {
        color = '#22c55e';
      } else if (judgment === 'miss') {
        color = 'rgba(148,163,184,0.45)';
      }
      snapshots.push({
        x: lane.x + (isBlack ? lane.width * 0.08 : lane.width * 0.1),
        y: top,
        width: lane.width * (isBlack ? 0.84 : 0.8),
        height,
        color,
        radius: isBlack ? 4 : 6,
        isBlack,
        judgment: judgment === 'good' ? 'hit' : judgment,
      });
    }
    return snapshots;
  }

  private drawNotes(ctx: CanvasRenderingContext2D): void {
    for (const snap of this.buildNoteSnapshots()) {
      ctx.fillStyle = snap.color;
      if (snap.isBlack) {
        ctx.beginPath();
        ctx.roundRect(snap.x, snap.y, snap.width, snap.height, snap.radius);
        ctx.fill();
      } else {
        ctx.fillRect(snap.x, snap.y, snap.width, snap.height);
      }
    }
  }

  private drawVanishEffects(ctx: CanvasRenderingContext2D, nowMs: number): void {
    this.vanishEffects = this.vanishEffects.filter(effect => {
      const t = (nowMs - effect.startedAtMs) / NOTE_VANISH_EFFECT_DURATION_MS;
      if (t >= 1) {
        return false;
      }
      const alpha = 1 - t;
      ctx.fillStyle = effect.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
      if (effect.color.startsWith('#')) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = effect.color;
      }
      ctx.fillRect(effect.x, effect.y - t * 12, effect.width, effect.height);
      ctx.globalAlpha = 1;
      return true;
    });
  }
}

export const PrecisionNotesRenderer: React.FC<PrecisionNotesRendererProps> = ({
  width,
  height,
  minMidi,
  maxMidi,
  pianoHeight,
  className,
  onReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<PrecisionNotesRendererInstance | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }
    const engine = new PrecisionNotesRendererEngine(canvas);
    engine.resize(width, height, pianoHeight);
    engine.setKeyboardRange(minMidi, maxMidi);
    engineRef.current = engine;
    onReady?.(engine);
    return () => {
      engine.destroy();
      engineRef.current = null;
      onReady?.(null);
    };
  }, [onReady]);

  useEffect(() => {
    engineRef.current?.resize(width, height, pianoHeight);
  }, [width, height, pianoHeight]);

  useEffect(() => {
    engineRef.current?.setKeyboardRange(minMidi, maxMidi);
  }, [minMidi, maxMidi]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('block touch-none', className)}
      style={{ width, height }}
      aria-label="Precision falling notes keyboard"
    />
  );
};

export default PrecisionNotesRenderer;
