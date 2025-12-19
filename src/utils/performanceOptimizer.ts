/**
 * 🎯 パフォーマンス最適化ユーティリティ
 * ノーツ降下の軽量化のための設定とヘルパー関数
 */

export interface PerformanceConfig {
  // フレームレート制御
  targetFPS: number;
  skipFrameThreshold: number;
  maxSkipFrames: number;
  
  // レンダリング最適化
  enableHardwareAcceleration: boolean;
  reduceEffects: boolean;
  limitActiveNotes: number;
  
  // 更新頻度制御
  noteUpdateInterval: number;
  effectUpdateInterval: number;
  
  // メモリ管理
  objectPoolSize: number;
  garbageCollectionInterval: number;
}

// 🎯 本番用軽量化モード設定
export const PRODUCTION_CONFIG: PerformanceConfig = {
  targetFPS: 60, // 60FPSを維持
  skipFrameThreshold: 14, // 14ms - フレーム間隔を少し緩めて安定性向上
  maxSkipFrames: 3, // 最大3フレームスキップ - 重い処理時の追従性向上
  
  enableHardwareAcceleration: true,
  reduceEffects: true, // エフェクト軽量化
  limitActiveNotes: 50, // 同時表示ノーツ数制限を緩和
  
  noteUpdateInterval: 8, // 8ms - ロジック更新は高頻度で維持
  effectUpdateInterval: 50, // 50ms - エフェクトはさらに低頻度に（20FPS相当）
  
  objectPoolSize: 100, // プールサイズを拡大してGC圧削減
  garbageCollectionInterval: 5000 // 5秒ごと - GC頻度を下げる
};

// 🎯 軽量化モード設定（低スペックPC向け）
export const LIGHTWEIGHT_CONFIG: PerformanceConfig = {
  targetFPS: 30, // 60FPS → 30FPSに軽量化
  skipFrameThreshold: 30, // 30ms - 少し緩めて安定性向上
  maxSkipFrames: 4, // 最大4フレームスキップ
  
  enableHardwareAcceleration: true,
  reduceEffects: true,
  limitActiveNotes: 30, // 同時表示ノーツ数制限を緩和
  
  noteUpdateInterval: 16, // 60FPS相当（ロジックは高頻度維持）
  effectUpdateInterval: 66, // ~15FPS相当
  
  objectPoolSize: 80, // プールサイズを拡大
  garbageCollectionInterval: 8000 // 8秒ごと - さらにGC頻度を下げる
};

// 🎯 標準モード設定
export const STANDARD_CONFIG: PerformanceConfig = {
  targetFPS: 60,
  skipFrameThreshold: 16,
  maxSkipFrames: 3,
  
  enableHardwareAcceleration: true,
  reduceEffects: false,
  limitActiveNotes: 50,
  
  noteUpdateInterval: 16,
  effectUpdateInterval: 16,
  
  objectPoolSize: 100,
  garbageCollectionInterval: 10000
};

/**
 * 統合フレームレート制御クラス
 * GameEngineとPIXIの競合を解決
 */
export type FrameChannel = 'global' | 'logic' | 'render' | 'effects';
const FRAME_CHANNELS: FrameChannel[] = ['global', 'logic', 'render', 'effects'];

interface ChannelState {
  lastFrameTime: number;
  skipCount: number;
}

export interface FrameStats {
  channel: FrameChannel;
  sampleCount: number;
  average: number;
  min: number;
  max: number;
}

export interface FrameToken {
  channel: FrameChannel;
  label: string;
  startMark: string;
  startTime: number;
}

export class UnifiedFrameController {
  private channelStates: Record<FrameChannel, ChannelState>;
  private config: PerformanceConfig;
  private lastNoteUpdateTime = 0;
  private lastEffectUpdateTime = 0;
  // 🚀 リングバッファ方式に変更（shift()による GC 削減）
  private frameTimeHistory: Record<FrameChannel, Float32Array>;
  private frameTimeIndex: Record<FrameChannel, number>;
  private frameTimeCount: Record<FrameChannel, number>;
  private readonly maxFrameSamples = 180;
  
  constructor(config: PerformanceConfig = PRODUCTION_CONFIG) {
    this.config = config;
    this.channelStates = FRAME_CHANNELS.reduce<Record<FrameChannel, ChannelState>>((acc, channel) => {
      acc[channel] = { lastFrameTime: 0, skipCount: 0 };
      return acc;
    }, {} as Record<FrameChannel, ChannelState>);
    // 🚀 リングバッファ初期化（固定サイズ Float32Array）
    this.frameTimeHistory = FRAME_CHANNELS.reduce<Record<FrameChannel, Float32Array>>((acc, channel) => {
      acc[channel] = new Float32Array(this.maxFrameSamples);
      return acc;
    }, {} as Record<FrameChannel, Float32Array>);
    this.frameTimeIndex = FRAME_CHANNELS.reduce<Record<FrameChannel, number>>((acc, channel) => {
      acc[channel] = 0;
      return acc;
    }, {} as Record<FrameChannel, number>);
    this.frameTimeCount = FRAME_CHANNELS.reduce<Record<FrameChannel, number>>((acc, channel) => {
      acc[channel] = 0;
      return acc;
    }, {} as Record<FrameChannel, number>);
  }
  
  private getChannelState(channel: FrameChannel): ChannelState {
    if (!this.channelStates[channel]) {
      this.channelStates[channel] = { lastFrameTime: 0, skipCount: 0 };
    }
    return this.channelStates[channel];
  }
  
  shouldSkipFrame(currentTime: number, channel: FrameChannel = 'global'): boolean {
    const state = this.getChannelState(channel);
    const deltaTime = currentTime - state.lastFrameTime;
    
    if (deltaTime < this.config.skipFrameThreshold) {
      state.skipCount += 1;
      return state.skipCount < this.config.maxSkipFrames;
    }
    
    state.skipCount = 0;
    state.lastFrameTime = currentTime;
    return false;
  }
  
  shouldUpdateNotes(currentTime: number): boolean {
    return (currentTime - this.lastNoteUpdateTime) >= this.config.noteUpdateInterval;
  }
  
  shouldUpdateEffects(currentTime: number): boolean {
    return (currentTime - this.lastEffectUpdateTime) >= this.config.effectUpdateInterval;
  }
  
  markNoteUpdate(currentTime: number): void {
    this.lastNoteUpdateTime = currentTime;
  }
  
  markEffectUpdate(currentTime: number): void {
    this.lastEffectUpdateTime = currentTime;
  }
  
  updateConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  /**
   * 🚀 最適化版: performance.mark/measure を廃止
   * - 毎フレームの mark/measure 呼び出しは GC とオーバーヘッドの原因
   * - 単純な performance.now() 差分のみで十分
   */
  beginFrame(channel: FrameChannel, label?: string): FrameToken {
    const normalizedLabel = label ?? channel;
    // 🚀 mark/measure を削除し、シンプルな時間計測のみ
    return {
      channel,
      label: normalizedLabel,
      startMark: '', // 未使用だが互換性のため保持
      startTime: this.now()
    };
  }

  endFrame(token: FrameToken): number {
    // 🚀 シンプルな時間差計算のみ（GC圧削減）
    const duration = this.now() - token.startTime;
    this.recordFrameTime(token.channel, duration);
    return duration;
  }

  getFrameStats(channel?: FrameChannel): FrameStats | Record<FrameChannel, FrameStats> {
    if (channel) {
      return this.buildStats(channel);
    }
    const result = {} as Record<FrameChannel, FrameStats>;
    FRAME_CHANNELS.forEach((ch) => {
      result[ch] = this.buildStats(ch);
    });
    return result;
  }

  /**
   * 🚀 リングバッファ方式でフレーム時間を記録（GC削減）
   */
  private recordFrameTime(channel: FrameChannel, duration: number): void {
    const history = this.frameTimeHistory[channel];
    const index = this.frameTimeIndex[channel];
    
    history[index] = duration;
    this.frameTimeIndex[channel] = (index + 1) % this.maxFrameSamples;
    
    if (this.frameTimeCount[channel] < this.maxFrameSamples) {
      this.frameTimeCount[channel]++;
    }
  }

  /**
   * 🚀 リングバッファからの統計計算（スプレッド演算子を避ける）
   */
  private buildStats(channel: FrameChannel): FrameStats {
    const history = this.frameTimeHistory[channel];
    const count = this.frameTimeCount[channel];
    
    if (count === 0) {
      return {
        channel,
        sampleCount: 0,
        average: 0,
        min: 0,
        max: 0
      };
    }
    
    let total = 0;
    let min = Infinity;
    let max = -Infinity;
    
    for (let i = 0; i < count; i++) {
      const value = history[i];
      total += value;
      if (value < min) min = value;
      if (value > max) max = value;
    }
    
    return {
      channel,
      sampleCount: count,
      average: total / count,
      min: min === Infinity ? 0 : min,
      max: max === -Infinity ? 0 : max
    };
  }

  private now(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }
}

/**
 * フレームレート制御クラス
 */
export class FrameRateController {
  private lastFrameTime = 0;
  private frameSkipCount = 0;
  private config: PerformanceConfig;
  
  constructor(config: PerformanceConfig = LIGHTWEIGHT_CONFIG) {
    this.config = config;
  }
  
  shouldSkipFrame(currentTime: number): boolean {
    const deltaTime = currentTime - this.lastFrameTime;
    
    if (deltaTime < this.config.skipFrameThreshold) {
      this.frameSkipCount++;
      return this.frameSkipCount < this.config.maxSkipFrames;
    }
    
    this.frameSkipCount = 0;
    this.lastFrameTime = currentTime;
    return false;
  }
  
  updateConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * オブジェクトプール（メモリ最適化）
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;
  
  constructor(createFn: () => T, resetFn: (obj: T) => void, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    
    // 初期プールを作成
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(createFn());
    }
  }
  
  get(): T {
    return this.pool.pop() || this.createFn();
  }
  
  release(obj: T): void {
    this.resetFn(obj);
    this.pool.push(obj);
  }
  
  clear(): void {
    this.pool.length = 0;
  }
}

/**
 * レンダリング最適化ヘルパー
 */
export class RenderOptimizer {
  private dirtyFlags = new Set<string>();
  private lastPositions = new Map<string, { x: number; y: number }>();
  
  markDirty(id: string): void {
    this.dirtyFlags.add(id);
  }
  
  isDirty(id: string): boolean {
    return this.dirtyFlags.has(id);
  }
  
  clearDirty(id: string): void {
    this.dirtyFlags.delete(id);
  }
  
  hasPositionChanged(id: string, x: number, y: number): boolean {
    const lastPos = this.lastPositions.get(id);
    if (!lastPos) {
      this.lastPositions.set(id, { x, y });
      return true;
    }
    
    const changed = Math.abs(lastPos.x - x) > 0.5 || Math.abs(lastPos.y - y) > 0.5;
    if (changed) {
      this.lastPositions.set(id, { x, y });
    }
    
    return changed;
  }
  
  cleanup(activeIds: Set<string>): void {
    // 古いポジションデータを削除
    for (const [id] of this.lastPositions) {
      if (!activeIds.has(id)) {
        this.lastPositions.delete(id);
        this.dirtyFlags.delete(id);
      }
    }
  }
}

/**
 * 軽量化のためのユーティリティ関数
 */
export const performanceUtils = {
  /**
   * 配列の軽量な反復処理
   */
  fastForEach<T>(array: T[], callback: (item: T, index: number) => void): void {
    for (let i = 0; i < array.length; i++) {
      callback(array[i], i);
    }
  },
  
  /**
   * オブジェクトの軽量な複製
   */
  shallowClone<T>(obj: T): T {
    return { ...obj };
  },
  
  /**
   * 数値の高速丸め
   */
  fastRound(num: number): number {
    return (num + 0.5) | 0;
  },
  
  /**
   * 範囲チェック（軽量版）
   */
  inRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  },
  
  /**
   * デバウンス処理
   */
  debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    }) as T;
  },
  
  /**
   * スロットル処理
   */
  throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }
};

// グローバル公開（デバッグ・検証用）
declare global {
  interface Window {
    unifiedFrameController: UnifiedFrameController;
    renderOptimizer: RenderOptimizer;
  }
}

// シングルトンインスタンス
export const unifiedFrameController = new UnifiedFrameController(PRODUCTION_CONFIG);
export const frameController = new FrameRateController(LIGHTWEIGHT_CONFIG);
export const renderOptimizer = new RenderOptimizer();

// グローバルアクセス用（デバッグ・検証）
if (typeof window !== 'undefined') {
  window.unifiedFrameController = unifiedFrameController;
  window.renderOptimizer = renderOptimizer;
} 