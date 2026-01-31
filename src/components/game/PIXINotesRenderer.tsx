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

// 3D効果用の定数
const KEY_3D_DEPTH = 8; // 鍵盤の奥行き（px）
const KEY_PRESSED_OFFSET = 4; // 押下時の沈み込み（px）

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
  'Cb': 'ド♭',
  'C##': 'ドx',
  'Cx': 'ドx',
  'Cbb': 'ド♭♭',
  D: 'レ',
  'D#': 'レ#',
  'Db': 'レ♭',
  'D##': 'レx',
  'Dx': 'レx',
  'Dbb': 'レ♭♭',
  E: 'ミ',
  'E#': 'ミ♯',
  'Eb': 'ミ♭',
  'E##': 'ミx',
  'Ex': 'ミx',
  'Ebb': 'ミ♭♭',
  F: 'ファ',
  'F#': 'ファ#',
  'Fb': 'ファ♭',
  'F##': 'ファx',
  'Fx': 'ファx',
  'Fbb': 'ファ♭♭',
  G: 'ソ',
  'G#': 'ソ#',
  'Gb': 'ソ♭',
  'G##': 'ソx',
  'Gx': 'ソx',
  'Gbb': 'ソ♭♭',
  A: 'ラ',
  'A#': 'ラ#',
  'Ab': 'ラ♭',
  'A##': 'ラx',
  'Ax': 'ラx',
  'Abb': 'ラ♭♭',
  B: 'シ',
  'B#': 'シ♯',
  'Bb': 'シ♭',
  'B##': 'シx',
  'Bx': 'シx',
  'Bbb': 'シ♭♭'
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
    
    // 描画順序（立体感を出すため）:
    // 1. 白鍵本体
    // 2. 白鍵ハイライト
    // 3. 黒鍵本体（白鍵ハイライトの上に重なる）
    // 4. 黒鍵ハイライト
    // 5. 音名ラベル
    this.drawDynamicWhiteKeys(ctx);
    this.drawWhiteKeyHighlights(ctx);
    this.drawDynamicBlackKeys(ctx);
    this.drawBlackKeyHighlights(ctx);
    this.drawKeyLabels(ctx);
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
    // 静的背景は鍵盤のベースのみ描画（3D効果は動的レイヤーで）
    ctx.save();
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, this.settings.hitLineY, this.width, this.settings.pianoHeight);
    ctx.restore();
  }

  /**
   * 3D効果付きの白鍵を描画（動的レイヤー）
   * 押下状態に応じて沈み込み効果を適用（上端固定、手前が沈む）
   */
  private drawDynamicWhiteKeys(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    const keyTop = this.settings.hitLineY;
    const pianoHeight = this.settings.pianoHeight;
    const depth = KEY_3D_DEPTH;
    const pressedOffset = KEY_PRESSED_OFFSET;

    // 押下された白鍵の側面を先に描画（背景として）
    for (let i = 0; i < this.whiteKeyOrder.length; i++) {
      const midi = this.whiteKeyOrder[i];
      const key = this.keyGeometries.get(midi);
      if (!key) continue;

      const isPressed = this.highlightedKeys.has(midi);
      if (isPressed) {
        // 隣の鍵盤の押下状態をチェック
        const leftMidi = i > 0 ? this.whiteKeyOrder[i - 1] : null;
        const rightMidi = i < this.whiteKeyOrder.length - 1 ? this.whiteKeyOrder[i + 1] : null;
        const leftPressed = leftMidi !== null && this.highlightedKeys.has(leftMidi);
        const rightPressed = rightMidi !== null && this.highlightedKeys.has(rightMidi);
        
        this.drawWhiteKeySideFaces(ctx, key, keyTop, pianoHeight, pressedOffset, leftPressed, rightPressed);
      }
    }

    // 白鍵を描画
    for (const midi of this.whiteKeyOrder) {
      const key = this.keyGeometries.get(midi);
      if (!key) continue;

      const isPressed = this.highlightedKeys.has(midi);
      // 上端は固定、押下時は手前の側面が短くなる
      const currentDepth = isPressed ? depth - pressedOffset : depth;

      this.draw3DWhiteKey(ctx, key, keyTop, pianoHeight, 0, currentDepth, isPressed);
    }

    ctx.restore();
  }

  /**
   * 3D効果付きの黒鍵を描画（動的レイヤー）
   * 上端固定、手前が沈む
   */
  private drawDynamicBlackKeys(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    const keyTop = this.settings.hitLineY;
    const depth = KEY_3D_DEPTH;
    const pressedOffset = KEY_PRESSED_OFFSET;

    // 押下された黒鍵の側面を先に描画
    for (const midi of this.blackKeyOrder) {
      const key = this.keyGeometries.get(midi);
      if (!key) continue;

      const isPressed = this.highlightedKeys.has(midi);
      if (isPressed) {
        this.drawBlackKeySideFaces(ctx, key, keyTop, pressedOffset);
      }
    }

    // 黒鍵を描画（白鍵の上に）
    for (const midi of this.blackKeyOrder) {
      const key = this.keyGeometries.get(midi);
      if (!key) continue;

      const isPressed = this.highlightedKeys.has(midi);
      // 上端は固定、押下時は手前の側面が短くなる
      const currentDepth = isPressed ? depth - pressedOffset : depth;

      this.draw3DBlackKey(ctx, key, keyTop, 0, currentDepth, isPressed);
    }

    ctx.restore();
  }

  /**
   * 押下された白鍵の左右の側面を描画（上端固定）
   * 隣の鍵盤との段差を表現
   */
  private drawWhiteKeySideFaces(
    ctx: CanvasRenderingContext2D,
    key: KeyGeometry,
    keyTop: number,
    pianoHeight: number,
    pressedOffset: number,
    leftPressed: boolean,
    rightPressed: boolean
  ): void {
    const x = key.x;
    const w = key.width;
    // 押下時の鍵盤下端位置
    const pressedBottom = keyTop + pianoHeight - (KEY_3D_DEPTH - KEY_PRESSED_OFFSET);
    // 通常時の鍵盤下端位置
    const normalBottom = keyTop + pianoHeight - KEY_3D_DEPTH;

    // 左側面を描画（左隣が押下されていない場合）
    // 押下された鍵盤は沈んでいるので、隣の鍵盤との間に段差ができる
    if (!leftPressed) {
      const sideHeight = pressedOffset;
      ctx.fillStyle = '#7a8a9a';
      ctx.beginPath();
      ctx.moveTo(x, normalBottom);
      ctx.lineTo(x, pressedBottom);
      ctx.lineTo(x + 2, pressedBottom);
      ctx.lineTo(x + 2, normalBottom);
      ctx.closePath();
      ctx.fill();
      
      // 左側面の境界線
      ctx.strokeStyle = 'rgba(15,23,42,0.3)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x, normalBottom);
      ctx.lineTo(x, pressedBottom);
      ctx.stroke();
      
      // 白鍵の音名表示（noteNameStyle設定に従う）
      if (this.settings.noteNameStyle !== 'off') {
        const noteName = NOTE_NAMES[midi % 12];
        // solfegeの場合は日本語表記、abcの場合は英語表記（オクターブ番号なし）
        let displayName: string;
        if (this.settings.noteNameStyle === 'solfege') {
          displayName = JAPANESE_NOTE_MAP[noteName] || noteName;
        } else {
          displayName = noteName;
        }
        const fontSize = Math.max(8, Math.min(12, key.width * 0.5));
        ctx.font = `${fontSize}px 'Inter', sans-serif`;
        ctx.fillStyle = 'rgba(71, 85, 105, 0.8)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(displayName, key.x + key.width / 2, keyBottom - 4);
      }
      
      ctx.restore();
    }

    // 右側面を描画（右隣が押下されていない場合）
    if (!rightPressed) {
      const sideHeight = pressedOffset;
      ctx.fillStyle = '#6a7a8a';
      ctx.beginPath();
      ctx.moveTo(x + w, normalBottom);
      ctx.lineTo(x + w, pressedBottom);
      ctx.lineTo(x + w - 2, pressedBottom);
      ctx.lineTo(x + w - 2, normalBottom);
      ctx.closePath();
      ctx.fill();
      
      // 右側面の境界線
      ctx.strokeStyle = 'rgba(15,23,42,0.3)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x + w, normalBottom);
      ctx.lineTo(x + w, pressedBottom);
      ctx.stroke();
    }
  }

  /**
   * 押下された黒鍵の左右の側面を描画（上端固定）
   */
  private drawBlackKeySideFaces(
    ctx: CanvasRenderingContext2D,
    key: KeyGeometry,
    keyTop: number,
    pressedOffset: number
  ): void {
    const x = key.x;
    const w = key.width;
    // 押下時の鍵盤下端位置
    const pressedBottom = keyTop + key.height - (KEY_3D_DEPTH - KEY_PRESSED_OFFSET);
    // 通常時の鍵盤下端位置
    const normalBottom = keyTop + key.height - KEY_3D_DEPTH;

    // 左側面（段差部分）
    ctx.fillStyle = '#0a0a12';
    ctx.beginPath();
    ctx.moveTo(x, normalBottom);
    ctx.lineTo(x, pressedBottom);
    ctx.lineTo(x + 1.5, pressedBottom);
    ctx.lineTo(x + 1.5, normalBottom);
    ctx.closePath();
    ctx.fill();

    // 右側面（段差部分）
    ctx.fillStyle = '#050508';
    ctx.beginPath();
    ctx.moveTo(x + w, normalBottom);
    ctx.lineTo(x + w, pressedBottom);
    ctx.lineTo(x + w - 1.5, pressedBottom);
    ctx.lineTo(x + w - 1.5, normalBottom);
    ctx.closePath();
    ctx.fill();

    // 境界線
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, normalBottom);
    ctx.lineTo(x, pressedBottom);
    ctx.moveTo(x + w, normalBottom);
    ctx.lineTo(x + w, pressedBottom);
    ctx.stroke();
  }

  /**
   * 3D白鍵を描画
   */
  private draw3DWhiteKey(
    ctx: CanvasRenderingContext2D,
    key: KeyGeometry,
    keyTop: number,
    pianoHeight: number,
    yOffset: number,
    depth: number,
    isPressed: boolean
  ): void {
    const x = key.x;
    const y = keyTop + yOffset;
    const w = key.width;
    const h = pianoHeight - depth;
    const radius = Math.min(6, w * 0.25);

    // 手前の側面（底面）を描画
    if (depth > 0) {
      const frontGradient = ctx.createLinearGradient(x, y + h, x, y + h + depth);
      frontGradient.addColorStop(0, '#b8c4d0');
      frontGradient.addColorStop(0.5, '#8a9aaa');
      frontGradient.addColorStop(1, '#6b7a8a');
      ctx.fillStyle = frontGradient;
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + w, y + h + depth);
      ctx.lineTo(x, y + h + depth);
      ctx.closePath();
      ctx.fill();

      // 側面の境界線
      ctx.strokeStyle = 'rgba(15,23,42,0.25)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // 鍵盤上面
    const topGradient = ctx.createLinearGradient(x, y, x, y + h);
    if (isPressed) {
      topGradient.addColorStop(0, '#e8eaf0');
      topGradient.addColorStop(0.45, '#d0d8e0');
      topGradient.addColorStop(1, '#b8c5d5');
    } else {
      topGradient.addColorStop(0, '#fdfdfd');
      topGradient.addColorStop(0.45, '#e2e8f0');
      topGradient.addColorStop(1, '#cbd5f5');
    }

    ctx.save();
    ctx.beginPath();
    this.drawRoundedRectPath(ctx, x, y, w, h, radius);
    ctx.closePath();
    ctx.fillStyle = topGradient;
    ctx.fill();

    // 上面のハイライト
    ctx.save();
    ctx.clip();
    if (!isPressed) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(x + 0.5, y + 1, w - 1, 1.5);
    }
    // 右端の影
    ctx.fillStyle = 'rgba(15,23,42,0.12)';
    ctx.fillRect(x + w - 1.4, y + 4, 1.4, h - 8);
    ctx.restore();

    // 境界線
    ctx.strokeStyle = 'rgba(15,23,42,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  /**
   * 3D黒鍵を描画
   */
  private draw3DBlackKey(
    ctx: CanvasRenderingContext2D,
    key: KeyGeometry,
    keyTop: number,
    yOffset: number,
    depth: number,
    isPressed: boolean
  ): void {
    const x = key.x;
    const y = keyTop + yOffset;
    const w = key.width;
    const h = key.height - depth;
    const radius = Math.min(6, w * 0.45);

    // 手前の側面を描画
    if (depth > 0) {
      const frontGradient = ctx.createLinearGradient(x, y + h, x, y + h + depth);
      frontGradient.addColorStop(0, '#1a1a2e');
      frontGradient.addColorStop(0.5, '#0f0f1a');
      frontGradient.addColorStop(1, '#050508');
      ctx.fillStyle = frontGradient;
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + w, y + h + depth);
      ctx.lineTo(x, y + h + depth);
      ctx.closePath();
      ctx.fill();

      // 側面の境界線
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // 鍵盤上面
    const topGradient = ctx.createLinearGradient(x, y, x + w, y + h);
    if (isPressed) {
      topGradient.addColorStop(0, '#1a2030');
      topGradient.addColorStop(0.5, '#2a3a4a');
      topGradient.addColorStop(1, '#101520');
    } else {
      topGradient.addColorStop(0, '#0b1220');
      topGradient.addColorStop(0.5, '#1f2937');
      topGradient.addColorStop(1, '#05060a');
    }

    ctx.save();
    ctx.beginPath();
    this.drawRoundedRectPath(ctx, x, y, w, h, radius);
    ctx.closePath();
    ctx.fillStyle = topGradient;
    ctx.fill();

    // 光沢効果
    ctx.save();
    ctx.clip();
    if (!isPressed) {
      const glossHeight = Math.min(6, h * 0.35);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(x + 1, y + 1, w - 2, glossHeight);
      const sideHighlightWidth = Math.max(1, w * 0.22);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(x + 0.5, y + 2, sideHighlightWidth, h - 4);
    }
    // 下端の影
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x + 0.5, y + h - 3, w - 1, 3);
    ctx.restore();

    // 境界線
    ctx.strokeStyle = 'rgba(0,0,0,0.65)';
    ctx.lineWidth = 1;
    ctx.stroke();
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

  /**
   * 白鍵のハイライトを描画（上端固定）
   */
  private drawWhiteKeyHighlights(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const keyTop = this.settings.hitLineY;
    const pianoHeight = this.settings.pianoHeight;
    const depth = KEY_3D_DEPTH;
    const pressedOffset = KEY_PRESSED_OFFSET;

    const drawHighlight = (midi: number, color: string, alpha?: number): void => {
      const geometry = this.keyGeometries.get(midi);
      if (!geometry || geometry.isBlack) return;

      const isPressed = this.highlightedKeys.has(midi);
      // 上端は固定
      const y = keyTop;
      const currentDepth = isPressed ? depth - pressedOffset : depth;
      const h = pianoHeight - currentDepth;
      const radius = Math.min(6, geometry.width * 0.25);

      ctx.fillStyle = color;
      ctx.globalAlpha = alpha ?? 0.35;
      
      // 3D形状に合わせたハイライト
      ctx.beginPath();
      this.drawRoundedRectPath(ctx, geometry.x, y, geometry.width, h, radius);
      ctx.closePath();
      ctx.fill();
      
      // 手前の側面にもハイライトを適用
      if (currentDepth > 0) {
        ctx.globalAlpha = (alpha ?? 0.35) * 0.6;
        ctx.beginPath();
        ctx.moveTo(geometry.x, y + h);
        ctx.lineTo(geometry.x + geometry.width, y + h);
        ctx.lineTo(geometry.x + geometry.width, y + h + currentDepth);
        ctx.lineTo(geometry.x, y + h + currentDepth);
        ctx.closePath();
        ctx.fill();
      }
      
      ctx.globalAlpha = 1;
    };

    // ガイドハイライト（緑色）
    this.guideHighlightedKeys.forEach((midi) => drawHighlight(midi, this.colors.guideKey));
    // 正解済みハイライト（赤色）
    this.correctHighlightedKeys.forEach((midi) => drawHighlight(midi, this.colors.correctKey, 0.6));
    // アクティブハイライト（オレンジ）
    this.highlightedKeys.forEach((midi) => drawHighlight(midi, this.colors.activeKey));

    ctx.restore();
  }

  /**
   * 黒鍵のハイライトを描画（上端固定）
   */
  private drawBlackKeyHighlights(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const top = this.settings.hitLineY;
    const height = this.settings.pianoHeight;
    const blackKeyHeight = height * 0.6;
    
    const drawHighlight = (midi: number, color: string, alpha?: number): void => {
      const geometry = this.keyGeometries.get(midi);
      if (!geometry) return;
      const keyTop = top;
      
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha ?? (geometry.isBlack ? 0.55 : 0.35);
      
      if (geometry.isBlack) {
        // 黒鍵はそのまま矩形で描画
        ctx.fillRect(geometry.x, keyTop, geometry.width, geometry.height);
      } else {
        // 白鍵は黒鍵を避けた形状で描画
        // 隣接する黒鍵を取得
        const prevBlack = this.keyGeometries.get(midi - 1);
        const nextBlack = this.keyGeometries.get(midi + 1);
        const hasLeftBlack = prevBlack?.isBlack ?? false;
        const hasRightBlack = nextBlack?.isBlack ?? false;
        
        // 白鍵の下部（黒鍵より下）は常に全幅
        const lowerTop = keyTop + blackKeyHeight;
        const lowerHeight = height - blackKeyHeight;
        ctx.fillRect(geometry.x, lowerTop, geometry.width, lowerHeight);
        
        // 白鍵の上部（黒鍵の高さ部分）は黒鍵を避けて描画
        if (!hasLeftBlack && !hasRightBlack) {
          // 両隣に黒鍵がない（AとEの場合など）：全幅で描画
          ctx.fillRect(geometry.x, keyTop, geometry.width, blackKeyHeight);
        } else if (hasLeftBlack && hasRightBlack) {
          // 両隣に黒鍵がある（D, G, Aなど）：中央部分のみ
          const leftBlackRight = prevBlack!.x + prevBlack!.width;
          const rightBlackLeft = nextBlack!.x;
          const upperX = leftBlackRight;
          const upperWidth = rightBlackLeft - leftBlackRight;
          if (upperWidth > 0) {
            ctx.fillRect(upperX, keyTop, upperWidth, blackKeyHeight);
          }
        } else if (hasLeftBlack) {
          // 左側のみ黒鍵がある（EとBなど）：右側を描画
          const leftBlackRight = prevBlack!.x + prevBlack!.width;
          const upperX = leftBlackRight;
          const upperWidth = geometry.x + geometry.width - leftBlackRight;
          if (upperWidth > 0) {
            ctx.fillRect(upperX, keyTop, upperWidth, blackKeyHeight);
          }
        } else if (hasRightBlack) {
          // 右側のみ黒鍵がある（CとFなど）：左側を描画
          const rightBlackLeft = nextBlack!.x;
          const upperWidth = rightBlackLeft - geometry.x;
          if (upperWidth > 0) {
            ctx.fillRect(geometry.x, keyTop, upperWidth, blackKeyHeight);
          }
        }
      }
      
      ctx.globalAlpha = 1;
    };

    // ガイドハイライト（緑色）
    this.guideHighlightedKeys.forEach((midi) => drawHighlight(midi, this.colors.guideKey));
    // 正解済みハイライト（赤色）
    this.correctHighlightedKeys.forEach((midi) => drawHighlight(midi, this.colors.correctKey, 0.6));
    // アクティブハイライト（オレンジ）
    this.highlightedKeys.forEach((midi) => drawHighlight(midi, this.colors.activeKey));

    ctx.restore();
  }

  /**
   * 鍵盤に音名を表示（上端固定）
   */
  private drawKeyLabels(ctx: CanvasRenderingContext2D): void {
    if (this.settings.noteNameStyle === 'off') return;

    ctx.save();
    const keyTop = this.settings.hitLineY;
    const pianoHeight = this.settings.pianoHeight;
    const depth = KEY_3D_DEPTH;
    const pressedOffset = KEY_PRESSED_OFFSET;

    // 白鍵の音名
    for (const midi of this.whiteKeyOrder) {
      const key = this.keyGeometries.get(midi);
      if (!key) continue;

      const isPressed = this.highlightedKeys.has(midi);
      // 上端は固定
      const y = keyTop;
      const currentDepth = isPressed ? depth - pressedOffset : depth;
      const h = pianoHeight - currentDepth;

      const label = this.getKeyLabel(midi);
      if (!label) continue;

      const fontSize = Math.max(10, Math.min(14, key.width * 0.45));
      ctx.font = `600 ${fontSize}px 'Inter', 'Noto Sans JP', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
      ctx.fillText(label, key.x + key.width / 2, y + h - 6);
    }

    // 黒鍵の音名
    for (const midi of this.blackKeyOrder) {
      const key = this.keyGeometries.get(midi);
      if (!key) continue;

      const isPressed = this.highlightedKeys.has(midi);
      // 上端は固定
      const y = keyTop;
      const currentDepth = isPressed ? depth - pressedOffset : depth;
      const h = key.height - currentDepth;

      const label = this.getKeyLabel(midi);
      if (!label) continue;

      const fontSize = Math.max(8, Math.min(11, key.width * 0.45));
      ctx.font = `600 ${fontSize}px 'Inter', 'Noto Sans JP', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = 'rgba(248, 250, 252, 0.85)';
      ctx.fillText(label, key.x + key.width / 2, y + h - 4);
    }

    ctx.restore();
  }

  /**
   * 鍵盤用の音名ラベルを取得
   */
  private getKeyLabel(midi: number): string | null {
    if (this.settings.noteNameStyle === 'off') return null;
    
    const transposedMidi = midi + this.settings.transpose;
    const noteName = this.midiToNoteName(transposedMidi);
    if (!noteName) return null;

    const baseName = this.trimOctave(noteName);
    
    if (this.settings.noteNameStyle === 'solfege') {
      return this.toSolfege(baseName);
    }
    
    if (this.settings.simpleDisplayMode) {
      return this.simplifyNoteName(baseName);
    }
    
    return baseName;
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
