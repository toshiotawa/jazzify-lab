import React, { useEffect, useRef } from 'react';
import {
  isPrecisionNoteInPerformanceWindow,
  type PrecisionNote,
} from '@/utils/earTrainingPrecisionNotes';
import {
  type PrecisionNoteJudgment,
  type PrecisionNoteRuntimeState,
} from '@/utils/earTrainingPrecisionJudge';
import { pianoKeyboardTheme } from '@/theme/pianoKeyboardTheme';
import { cn } from '@/utils/cn';

export const PRECISION_NOTE_FALL_LEAD_SEC = 3;

const BLACK_KEY_OFFSETS = new Set([1, 3, 6, 8, 10]);
const NOTE_VANISH_EFFECT_DURATION_MS = 180;
const NOTE_HIT_EFFECT_DURATION_MS = 120;
const NOTE_EDGE_GAP_PX = 2;

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
  borderColor: string;
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

interface HitEffect {
  x: number;
  y: number;
  width: number;
  height: number;
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
  private guideKeys = new Set<number>();
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
  private hitEffects: HitEffect[] = [];
  private previousJudgments = new Map<string, PrecisionNoteJudgment>();
  private previousHiddenFromLane = new Map<string, boolean>();
  private vanishedIds = new Set<string>();
  private onKeyPress: ((midi: number) => void) | null = null;
  private onKeyRelease: ((midi: number) => void) | null = null;
  private pointerMidi: number | null = null;
  private capturedPointerId: number | null = null;

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
    window.addEventListener('blur', this.handleWindowBlur);
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
    this.trackNoteVanish();
    this.requestRender();
  }

  setNotes(notes: readonly PrecisionNote[]): void {
    this.notes = notes;
    this.previousJudgments.clear();
    this.previousHiddenFromLane.clear();
    this.vanishedIds.clear();
    this.hitEffects = [];
    this.vanishEffects = [];
    for (const note of notes) {
      this.previousJudgments.set(note.id, 'pending');
      this.previousHiddenFromLane.set(note.id, false);
    }
    this.requestRender();
  }

  setRuntimeStates(states: ReadonlyMap<string, PrecisionNoteRuntimeState>): void {
    this.runtimeStates = new Map(states);
    this.trackJudgmentTransitions();
    this.trackNoteVanish();
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
    this.releaseHeldPointerKey();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
    this.canvas.removeEventListener('pointerleave', this.handlePointerUp);
    window.removeEventListener('blur', this.handleWindowBlur);
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
    try {
      this.canvas.setPointerCapture(event.pointerId);
      this.capturedPointerId = event.pointerId;
    } catch {
      // pointer capture unsupported
    }
    this.pointerMidi = midi;
    this.activeKeys.add(midi);
    this.onKeyPress?.(midi);
    this.requestRender();
  };

  private handlePointerUp = (_event: PointerEvent): void => {
    this.releaseHeldPointerKey();
    if (this.capturedPointerId !== null) {
      try {
        this.canvas.releasePointerCapture(this.capturedPointerId);
      } catch {
        // ignore
      }
      this.capturedPointerId = null;
    }
  };

  private handleWindowBlur = (): void => {
    this.releaseHeldPointerKey();
  };

  private releaseHeldPointerKey(): void {
    if (this.pointerMidi === null) {
      return;
    }
    const midi = this.pointerMidi;
    this.pointerMidi = null;
    this.onKeyRelease?.(midi);
    this.activeKeys.delete(midi);
    this.requestRender();
  }

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

  private noteRect(note: PrecisionNote): { x: number; y: number; width: number; height: number } {
    const lane = this.laneXForMidi(note.midi);
    const height = Math.max(6, note.durationSec * this.noteSpeedPxPerSec);
    const bottom = this.noteBottomY(note);
    return {
      x: lane.x,
      y: bottom - height,
      width: lane.width,
      height,
    };
  }

  private addHitEffect(note: PrecisionNote, nowMs: number): void {
    const rect = this.noteRect(note);
    this.hitEffects.push({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      startedAtMs: nowMs,
    });
    if (this.hitEffects.length > 24) {
      this.hitEffects.shift();
    }
  }

  private addVanishEffect(note: PrecisionNote, nowMs: number, color: string): void {
    if (this.vanishedIds.has(note.id)) {
      return;
    }
    const rect = this.noteRect(note);
    this.vanishEffects.push({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      color,
      startedAtMs: nowMs,
    });
    this.vanishedIds.add(note.id);
    if (this.vanishEffects.length > 24) {
      this.vanishEffects.shift();
    }
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
      if (next === 'good') {
        this.addHitEffect(note, now);
      }
    }
  }

  private trackNoteVanish(): void {
    const now = performance.now();
    for (const note of this.notes) {
      const state = this.runtimeStates.get(note.id);
      if (!state) {
        continue;
      }
      const wasHidden = this.previousHiddenFromLane.get(note.id) ?? false;
      const isHidden = state.hiddenFromLane ?? false;
      if (!wasHidden && isHidden && state.judgment === 'good') {
        this.addVanishEffect(note, now, '#22c55e');
      }
      this.previousHiddenFromLane.set(note.id, isHidden);

      if (
        state.judgment === 'good'
        && !isHidden
        && !this.vanishedIds.has(note.id)
        && this.phraseTimeSec >= note.startSec + note.durationSec - 0.001
      ) {
        this.addVanishEffect(note, now, '#22c55e');
      }
    }
  }

  private noteBottomY(note: PrecisionNote): number {
    const delta = note.startSec - this.phraseTimeSec;
    return this.hitLineY - delta * this.noteSpeedPxPerSec;
  }

  private collectGuideKeys(): void {
    this.guideKeys.clear();
    if (!this.practiceHighlight) {
      return;
    }
    for (const note of this.notes) {
      const state = this.runtimeStates.get(note.id);
      if (!state || state.judgment !== 'pending') {
        continue;
      }
      if (isPrecisionNoteInPerformanceWindow(note, this.phraseTimeSec)) {
        this.guideKeys.add(note.midi);
      }
    }
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
    if (this.vanishEffects.length > 0 || this.hitEffects.length > 0) {
      return true;
    }
    if (this.practiceHighlight && this.guideKeys.size > 0) {
      return true;
    }
    for (const note of this.notes) {
      if (this.vanishedIds.has(note.id)) {
        continue;
      }
      const state = this.runtimeStates.get(note.id);
      if (!state || state.hiddenFromLane) {
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
    this.collectGuideKeys();
    this.drawNotes(ctx);
    this.drawHitEffects(ctx, nowMs);
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
      if (!this.guideKeys.has(key.midi) || this.activeKeys.has(key.midi)) {
        continue;
      }
      ctx.fillStyle = 'rgba(251, 191, 36, 0.45)';
      if (key.isBlack) {
        ctx.fillRect(key.x, key.y, key.width, key.height);
      } else {
        const inset = key.width * 0.08;
        ctx.fillRect(key.x + inset, key.y, key.width - inset * 2, key.height);
      }
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
      if (this.vanishedIds.has(note.id)) {
        continue;
      }
      const state = this.runtimeStates.get(note.id);
      const judgment = state?.judgment ?? 'pending';
      if (state?.hiddenFromLane) {
        continue;
      }
      const bottom = this.noteBottomY(note);
      const rawHeight = Math.max(6, note.durationSec * this.noteSpeedPxPerSec);
      const top = bottom - rawHeight;
      if (bottom < -20 || top > this.noteLaneHeight + 20) {
        continue;
      }
      const lane = this.laneXForMidi(note.midi);
      const isBlack = note.isBlackKey;
      let color = isBlack ? '#a855f7' : '#38bdf8';
      let borderColor = isBlack ? '#7e22ce' : '#0284c7';
      if (judgment === 'good') {
        color = '#22c55e';
        borderColor = '#15803d';
      } else if (judgment === 'miss') {
        color = 'rgba(148,163,184,0.45)';
        borderColor = 'rgba(71,85,105,0.85)';
      }
      const edgeGap = rawHeight > NOTE_EDGE_GAP_PX * 2 + 4 ? NOTE_EDGE_GAP_PX : 0;
      const height = Math.max(4, rawHeight - edgeGap * 2);
      snapshots.push({
        x: lane.x + (isBlack ? lane.width * 0.08 : lane.width * 0.1),
        y: top + edgeGap,
        width: lane.width * (isBlack ? 0.84 : 0.8),
        height,
        color,
        borderColor,
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
      ctx.strokeStyle = snap.borderColor;
      ctx.lineWidth = 1.5;
      if (snap.isBlack) {
        ctx.beginPath();
        ctx.roundRect(snap.x, snap.y, snap.width, snap.height, snap.radius);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(snap.x, snap.y, snap.width, snap.height);
        ctx.strokeRect(snap.x + 0.75, snap.y + 0.75, snap.width - 1.5, snap.height - 1.5);
      }
    }
  }

  private drawHitEffects(ctx: CanvasRenderingContext2D, nowMs: number): void {
    this.hitEffects = this.hitEffects.filter(effect => {
      const t = (nowMs - effect.startedAtMs) / NOTE_HIT_EFFECT_DURATION_MS;
      if (t >= 1) {
        return false;
      }
      const alpha = 1 - t;
      ctx.globalAlpha = alpha * 0.85;
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(effect.x, effect.y, effect.width, effect.height);
      ctx.globalAlpha = 1;
      return true;
    });
  }

  private drawVanishEffects(ctx: CanvasRenderingContext2D, nowMs: number): void {
    this.vanishEffects = this.vanishEffects.filter(effect => {
      const t = (nowMs - effect.startedAtMs) / NOTE_VANISH_EFFECT_DURATION_MS;
      if (t >= 1) {
        return false;
      }
      const alpha = 1 - t;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = effect.color;
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
