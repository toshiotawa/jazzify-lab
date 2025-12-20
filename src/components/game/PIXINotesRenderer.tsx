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
    correctKey: string | number; // 正解済み鍵盤の色
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

interface PointerState {
  midi: number | null;
  pointerType: PointerEvent['pointerType'];
  startX: number;
  startY: number;
  isScrolling: boolean;
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
    correctKey: '#EF4444', // 正解済み鍵盤は赤色
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
  private correctHighlightedKeys = new Set<number>(); // 正解済み鍵盤（赤色で保持）
  private pointerStates = new Map<number, PointerState>();
  private onKeyPress?: (note: number) => void;
  private onKeyRelease?: (note: number) => void;
  private backgroundCanvas: HTMLCanvasElement | null = null;
  private backgroundNeedsUpdate = true;
  private chordText = '';
  
  // 🚀 パフォーマンス最適化: レンダリング頻度制御
  private lastRenderTime = 0;
  private readonly minRenderInterval = 16; // 16ms = 60FPS（安定性重視）
  private frameSkipCount = 0;
  private readonly maxFrameSkip = 1; // 最大1フレームスキップ（応答性向上）
  
  // 🚀 GC最適化: 一時オブジェクトのキャッシュ
  private readonly tempGradientCache = new Map<string, CanvasGradient>();

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
    
    // 🚀 最適化: 配列長を調整してからコピー（GC削減）
    const newLen = notes.length;
    const bufLen = this.noteBuffer.length;
    
    if (bufLen !== newLen) {
      this.noteBuffer.length = newLen;
    }
    
    for (let i = 0; i < newLen; i += 1) {
      this.noteBuffer[i] = notes[i];
    }
    
    this.requestRenderThrottled();
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

  setChordDisplay(text: string): void {
    if (this.destroyed) {
      return;
    }
    if (this.chordText === text) {
      return;
    }
    this.chordText = text;
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

  /**
   * 正解済み鍵盤をMIDIノート番号で設定（赤色で表示保持）
   * Singleモード専用：正解した音のガイド位置のオクターブのみ光る
   */
  setCorrectHighlightsByMidiNotes(midiNotes: number[]): void {
    this.correctHighlightedKeys.clear();
    midiNotes.forEach((note) => {
      const midi = this.clampMidi(note);
      this.correctHighlightedKeys.add(midi);
    });
    this.requestRender();
  }

  /**
   * 正解済み鍵盤のハイライトをクリア
   */
  clearCorrectHighlights(): void {
    this.correctHighlightedKeys.clear();
    this.requestRender();
  }

  clearAllHighlights(): void {
    this.highlightedKeys.clear();
    this.guideHighlightedKeys.clear();
    this.correctHighlightedKeys.clear();
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
    this.correctHighlightedKeys.clear();
    this.pointerStates.clear();
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
      correctKey: toColor(colors.correctKey),
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
    // タッチイベントの追加（iOSでの反応速度向上）
    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd);
    this.canvas.addEventListener('touchcancel', this.handleTouchEnd);

    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerUp);
    this.canvas.addEventListener('pointerleave', this.handlePointerUp);
    this.canvas.addEventListener('contextmenu', this.preventContextMenu);
    this.canvas.style.touchAction = 'pan-x pinch-zoom';
  }

  private detachEvents(): void {
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    this.canvas.removeEventListener('touchcancel', this.handleTouchEnd);

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

    private handleTouchStart = (event: TouchEvent): void => {
      if (this.destroyed) return;
      // スクロール判定は touchmove で行うため、ここでは preventDefault しない
      // ただし、PointerEvent との重複を防ぐため、PointerEvent 側で touch を無視する
      
      const rect = this.canvas.getBoundingClientRect();
      const pointerType = 'touch';

      for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        const x = ((touch.clientX - rect.left) / rect.width) * this.width;
        const y = ((touch.clientY - rect.top) / rect.height) * this.height;
        const midi = this.getKeyAtPosition(x, y);
        
        const state: PointerState = {
          midi,
          pointerType,
          startX: touch.clientX,
          startY: touch.clientY,
          isScrolling: false
        };
        
        // Touch.identifier をキーとして使用
        this.pointerStates.set(touch.identifier, state);
        
        if (midi !== null) {
          this.triggerKeyPress(midi);
        }
      }
    };

    private handleTouchMove = (event: TouchEvent): void => {
      if (this.destroyed) return;
      const rect = this.canvas.getBoundingClientRect();

      for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        const state = this.pointerStates.get(touch.identifier);
        
        if (!state) continue;
        
        // スクロール判定
        if (state.isScrolling) continue;
        
        const deltaX = touch.clientX - state.startX;
        const deltaY = touch.clientY - state.startY;
        
        // 横方向への動きが大きい場合はスクロールとみなす
        if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
           if (state.midi !== null) {
             this.triggerKeyRelease(state.midi);
             state.midi = null;
           }
           state.isScrolling = true;
           continue;
        }
        
        // 縦方向の動きなど、スクロールでない場合は preventDefault してブラウザ動作を抑制（リフレッシュなど）
        // ただし pan-x なので横スクロールはブラウザが処理するはず
        // ここで preventDefault すると横スクロールも止まる可能性があるので注意
        // event.preventDefault(); // ここではしない

        const x = ((touch.clientX - rect.left) / rect.width) * this.width;
        const y = ((touch.clientY - rect.top) / rect.height) * this.height;
        const nextMidi = this.getKeyAtPosition(x, y);
        
        if (nextMidi === null || nextMidi === state.midi) {
          continue;
        }
        
        if (state.midi !== null) {
          this.triggerKeyRelease(state.midi);
        }
        
        state.midi = nextMidi;
        this.triggerKeyPress(nextMidi);
      }
    };

    private handleTouchEnd = (event: TouchEvent): void => {
      if (this.destroyed) return;
      
      for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        const state = this.pointerStates.get(touch.identifier);
        
        if (state) {
          if (state.midi !== null) {
            this.triggerKeyRelease(state.midi);
          }
          this.pointerStates.delete(touch.identifier);
        }
      }
    };

    private handlePointerDown = (event: PointerEvent): void => {
      if (this.destroyed) return;
      // タッチイベントは handleTouchStart で処理済みのため無視
      if (event.pointerType === 'touch') return;

      const midi = this.hitTest(event);
      const pointerType = event.pointerType || 'mouse';
      const state: PointerState = {
        midi,
        pointerType,
        startX: event.clientX,
        startY: event.clientY,
        isScrolling: false
      };
      this.pointerStates.set(event.pointerId, state);
      if (midi !== null) {
        if (pointerType !== 'touch') {
          try {
            this.canvas.setPointerCapture(event.pointerId);
          } catch {
            // ignore
          }
        }
        this.triggerKeyPress(midi);
      }
    };

    private handlePointerMove = (event: PointerEvent): void => {
      if (this.destroyed) return;
      const state = this.pointerStates.get(event.pointerId);
      if (!state || state.isScrolling) {
        return;
      }
      if (state.pointerType === 'touch') {
        const deltaX = event.clientX - state.startX;
        const deltaY = event.clientY - state.startY;
        const horizontalSwipe = Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY);
        if (horizontalSwipe) {
          if (state.midi !== null) {
            this.triggerKeyRelease(state.midi);
            state.midi = null;
          }
          state.isScrolling = true;
        }
        return;
      }
      const nextMidi = this.hitTest(event);
      if (nextMidi === null || nextMidi === state.midi) {
        return;
      }
      if (state.midi !== null) {
        this.triggerKeyRelease(state.midi);
      }
      state.midi = nextMidi;
      this.triggerKeyPress(nextMidi);
    };

    private handlePointerUp = (event: PointerEvent): void => {
      const state = this.pointerStates.get(event.pointerId);
      if (!state) {
        return;
      }
      if (state.midi !== null) {
        this.triggerKeyRelease(state.midi);
      }
      if (state.pointerType !== 'touch') {
        try {
          this.canvas.releasePointerCapture(event.pointerId);
        } catch {
          // ignore
        }
      }
      this.pointerStates.delete(event.pointerId);
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

  /**
   * 🚀 スロットル付きレンダリングリクエスト（最適化版）
   * - 連続スキップ制限を緩和しつつ、安定した60FPSを維持
   * - GC圧を最小化
   */
  private requestRenderThrottled(): void {
    if (this.renderPending || this.destroyed) {
      return;
    }
    
    const now = performance.now();
    const elapsed = now - this.lastRenderTime;
    
    // 60FPS（16ms）を維持しつつ、必要に応じてスキップ
    if (elapsed < this.minRenderInterval) {
      this.frameSkipCount += 1;
      // 最大1フレームスキップ後は強制レンダリング
      if (this.frameSkipCount <= this.maxFrameSkip) {
        return;
      }
    }
    
    this.frameSkipCount = 0;
    this.lastRenderTime = now;
    this.requestRender();
  }

  private renderLoop = (): void => {
    this.renderPending = false;
    this.renderHandle = null;
    if (this.destroyed) return;
    this.drawFrame();
  };

  /**
   * 🚀 最適化版: フレーム描画
   * - unifiedFrameController の参照を削除（オーバーヘッド削減）
   * - Canvas 操作の最適化
   */
  private drawFrame(): void {
    if (this.backgroundNeedsUpdate) {
      this.renderStaticLayers();
      this.backgroundNeedsUpdate = false;
    }
    
    const ctx = this.ctx;
    
    // 🚀 save/restore を削減し、直接 transform 設定
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
    this.drawChordOverlay(ctx);
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

    private drawGuideLanes(ctx: CanvasRenderingContext2D): void {
      const laneHeight = this.settings.hitLineY;
      if (laneHeight <= 0) {
        return;
      }
      const evenLaneColor = 'rgba(15,23,42,0.18)';
      const oddLaneColor = 'rgba(15,23,42,0.12)';
      this.whiteKeyOrder.forEach((midi, index) => {
        const key = this.keyGeometries.get(midi);
        if (!key) return;
        ctx.fillStyle = index % 2 === 0 ? evenLaneColor : oddLaneColor;
        ctx.fillRect(key.x, 0, key.width, laneHeight);
      });

      const accentSourceNotes = new Set(['B', 'E']);
        const boundaryColor = 'rgba(248,250,252,0.12)';
      for (let i = 0; i < this.whiteKeyOrder.length - 1; i += 1) {
        const currentMidi = this.whiteKeyOrder[i];
        const key = this.keyGeometries.get(currentMidi);
        if (!key) continue;
        const boundaryX = key.x + key.width;
        const nextKey = this.keyGeometries.get(this.whiteKeyOrder[i + 1]);
        const referenceWidth = nextKey ? Math.min(key.width, nextKey.width) : key.width;
        const baseWidth = Math.max(1.5, referenceWidth * 0.055);
        ctx.fillStyle = boundaryColor;
        ctx.fillRect(boundaryX - baseWidth / 2, 0, baseWidth, laneHeight);

        const noteName = NOTE_NAMES[currentMidi % 12];
        if (accentSourceNotes.has(noteName)) {
          const accentWidth = Math.max(baseWidth * 2.5, 2);
          ctx.fillStyle = 'rgba(56,189,248,0.22)';
          ctx.fillRect(boundaryX - accentWidth / 2, 0, accentWidth, laneHeight);
        }
      }
    }

  private drawStaticKeys(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(15,23,42,0.35)';
    ctx.lineWidth = 1;
    for (const midi of this.whiteKeyOrder) {
      const key = this.keyGeometries.get(midi);
      if (!key) continue;
      const keyTop = this.settings.hitLineY;
      const keyBottom = keyTop + this.settings.pianoHeight;
      const radius = Math.min(6, key.width * 0.25);
      const whiteGradient = ctx.createLinearGradient(key.x, keyTop, key.x, keyBottom);
      whiteGradient.addColorStop(0, '#fdfdfd');
      whiteGradient.addColorStop(0.45, '#e2e8f0');
      whiteGradient.addColorStop(1, '#cbd5f5');
      ctx.save();
      ctx.beginPath();
      this.drawRoundedRectPath(ctx, key.x, keyTop, key.width, this.settings.pianoHeight, radius);
      ctx.closePath();
      ctx.fillStyle = whiteGradient;
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(key.x + 0.5, keyTop + 1, key.width - 1, 1.5);
      ctx.fillStyle = 'rgba(15,23,42,0.12)';
      ctx.fillRect(key.x + key.width - 1.4, keyTop + 4, 1.4, this.settings.pianoHeight - 8);
      ctx.restore();
      ctx.strokeStyle = 'rgba(15,23,42,0.35)';
      ctx.stroke();
      ctx.restore();
    }
    for (const midi of this.blackKeyOrder) {
      const key = this.keyGeometries.get(midi);
      if (!key) continue;
      const keyTop = this.settings.hitLineY;
      const keyBottom = keyTop + key.height;
      const radius = Math.min(6, key.width * 0.45);
      const blackGradient = ctx.createLinearGradient(key.x, keyTop, key.x + key.width, keyBottom);
      blackGradient.addColorStop(0, '#0b1220');
      blackGradient.addColorStop(0.5, '#1f2937');
      blackGradient.addColorStop(1, '#05060a');
      ctx.save();
      ctx.beginPath();
      this.drawRoundedRectPath(ctx, key.x, keyTop, key.width, key.height, radius);
      ctx.closePath();
      ctx.fillStyle = blackGradient;
      ctx.fill();
      ctx.save();
      ctx.clip();
      const glossHeight = Math.min(6, key.height * 0.35);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(key.x + 1, keyTop + 1, key.width - 2, glossHeight);
      const sideHighlightWidth = Math.max(1, key.width * 0.22);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(key.x + 0.5, keyTop + 2, sideHighlightWidth, key.height - 4);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(key.x + 0.5, keyBottom - 3, key.width - 1, 3);
      ctx.restore();
      ctx.strokeStyle = 'rgba(0,0,0,0.65)';
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  private drawRoundedRectPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    const r = Math.max(0, Math.min(radius, width / 2, height / 2));
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
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
    const drawHighlight = (midi: number, color: string, alpha?: number): void => {
      const geometry = this.keyGeometries.get(midi);
      if (!geometry) return;
      const keyTop = top;
      const keyHeight = geometry.isBlack ? geometry.height : height;
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha ?? (geometry.isBlack ? 0.55 : 0.35);
      ctx.fillRect(geometry.x, keyTop, geometry.width, keyHeight);
      ctx.globalAlpha = 1;
    };
    // ガイドハイライト（緑色）
    this.guideHighlightedKeys.forEach((midi) => drawHighlight(midi, this.colors.guideKey));
    // 正解済みハイライト（赤色）- ガイドより上に描画
    this.correctHighlightedKeys.forEach((midi) => drawHighlight(midi, this.colors.correctKey, 0.6));
    // アクティブハイライト（オレンジ）- 最前面
    this.highlightedKeys.forEach((midi) => drawHighlight(midi, this.colors.activeKey));
    ctx.restore();
  }

  private drawChordOverlay(ctx: CanvasRenderingContext2D): void {
    if (!this.chordText) {
      return;
    }
    ctx.save();
    const fontSize = Math.max(24, this.width * 0.03);
    const paddingX = fontSize * 0.6;
    const paddingY = fontSize * 0.4;
    ctx.font = `600 ${fontSize}px 'Inter', 'Noto Sans JP', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textWidth = ctx.measureText(this.chordText).width;
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = fontSize + paddingY * 2;
    const boxX = Math.max(16, (this.width - boxWidth) / 2);
    const boxY = Math.max(24, this.height * 0.12);
    ctx.fillStyle = 'rgba(2,6,23,0.7)';
    ctx.beginPath();
    this.drawRoundedRectPath(ctx, boxX, boxY, boxWidth, boxHeight, Math.min(18, boxHeight / 2));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(this.chordText, this.width / 2, boxY + boxHeight / 2);
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
