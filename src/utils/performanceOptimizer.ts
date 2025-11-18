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
  skipFrameThreshold: 16, // 16ms (60FPS)
  maxSkipFrames: 1, // 最大1フレームスキップ
  
  enableHardwareAcceleration: true,
  reduceEffects: true, // エフェクト軽量化
  limitActiveNotes: 30, // 同時表示ノーツ数制限
  
  noteUpdateInterval: 16, // 60FPS相当
  effectUpdateInterval: 33, // 30FPS相当（エフェクトは低頻度）
  
  objectPoolSize: 50,
  garbageCollectionInterval: 3000 // 3秒ごと
};

// 🎯 軽量化モード設定
export const LIGHTWEIGHT_CONFIG: PerformanceConfig = {
  targetFPS: 30, // 60FPS → 30FPSに軽量化
  skipFrameThreshold: 33, // 33ms（30FPS）
  maxSkipFrames: 2,
  
  enableHardwareAcceleration: true,
  reduceEffects: true,
  limitActiveNotes: 20, // 同時表示ノーツ数制限
  
  noteUpdateInterval: 16, // 60FPS相当
  effectUpdateInterval: 33, // 30FPS相当
  
  objectPoolSize: 50,
  garbageCollectionInterval: 5000 // 5秒ごと
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

export class UnifiedFrameController {
  private channelStates: Record<FrameChannel, ChannelState>;
  private config: PerformanceConfig;
  private lastNoteUpdateTime = 0;
  private lastEffectUpdateTime = 0;
  private phaseSequence = 0;
  
  constructor(config: PerformanceConfig = PRODUCTION_CONFIG) {
    this.config = config;
    this.channelStates = FRAME_CHANNELS.reduce<Record<FrameChannel, ChannelState>>((acc, channel) => {
      acc[channel] = { lastFrameTime: 0, skipCount: 0 };
      return acc;
    }, {} as Record<FrameChannel, ChannelState>);
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

  measurePhase<T>(channel: FrameChannel, label: string, fn: () => T): T {
    const hasPerformanceApi = typeof performance !== 'undefined' && typeof performance.mark === 'function' && typeof performance.measure === 'function';
    const fallbackStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const startMark = hasPerformanceApi ? this.buildMarkName(channel, label, 'start') : null;

    if (startMark) {
      performance.mark(startMark);
    }

    try {
      return fn();
    } finally {
      const duration = this.finishMeasurement(channel, label, startMark, fallbackStart, hasPerformanceApi);
      performanceMonitor.record({
        channel,
        label,
        duration,
        timestamp: typeof performance !== 'undefined' ? performance.now() : Date.now()
      });
    }
  }

  private finishMeasurement(channel: FrameChannel, label: string, startMark: string | null, fallbackStart: number, hasPerformanceApi: boolean): number {
    if (!hasPerformanceApi || !startMark) {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      return now - fallbackStart;
    }

    const endMark = this.buildMarkName(channel, label, 'end');
    performance.mark(endMark);
    const measureName = this.buildMarkName(channel, label, 'measure');
    performance.measure(measureName, startMark, endMark);
    const entries = performance.getEntriesByName(measureName);
    const duration = entries[entries.length - 1]?.duration ?? (performance.now() - fallbackStart);
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);
    return duration;
  }

  private buildMarkName(channel: FrameChannel, label: string, phase: 'start' | 'end' | 'measure'): string {
    this.phaseSequence += 1;
    return `ufc:${channel}:${label}:${phase}:${this.phaseSequence}`;
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

interface FrameMetric {
  channel: FrameChannel;
  label: string;
  duration: number;
  timestamp: number;
}

export class FramePerformanceMonitor {
  private readonly samples: FrameMetric[] = [];
  private readonly maxSamples = 360;

  record(metric: FrameMetric): void {
    this.samples.push(metric);
    if (this.samples.length > this.maxSamples) {
      this.samples.splice(0, this.samples.length - this.maxSamples);
    }
  }

  getRecentSamples(channel?: FrameChannel): FrameMetric[] {
    if (!channel) {
      return [...this.samples];
    }
    return this.samples.filter((sample) => sample.channel === channel);
  }

  getSummary(channel?: FrameChannel): Array<{ channel: FrameChannel; label: string; average: number; max: number; latest: number }> {
    const buckets = new Map<string, FrameMetric[]>();
    const pushSample = (key: string, metric: FrameMetric) => {
      if (!buckets.has(key)) {
        buckets.set(key, []);
      }
      buckets.get(key)!.push(metric);
    };

    for (const sample of this.samples) {
      if (channel && sample.channel !== channel) {
        continue;
      }
      const bucketKey = `${sample.channel}:${sample.label}`;
      pushSample(bucketKey, sample);
    }

    const summaries: Array<{ channel: FrameChannel; label: string; average: number; max: number; latest: number }> = [];
    buckets.forEach((metrics, key) => {
      if (metrics.length === 0) {
        return;
      }
      const total = metrics.reduce((sum, metric) => sum + metric.duration, 0);
      const average = total / metrics.length;
      const max = Math.max(...metrics.map((metric) => metric.duration));
      const latest = metrics[metrics.length - 1]?.duration ?? 0;
      const [bucketChannel, label] = key.split(':') as [FrameChannel, string];
      summaries.push({
        channel: bucketChannel,
        label,
        average,
        max,
        latest
      });
    });

    return summaries.sort((a, b) => a.channel.localeCompare(b.channel) || a.label.localeCompare(b.label));
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
      timeout = setTimeout(() => func.apply(null, args), wait);
    }) as T;
  },
  
  /**
   * スロットル処理
   */
  throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(null, args);
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
    performanceMonitor: FramePerformanceMonitor;
  }
}

// シングルトンインスタンス
export const unifiedFrameController = new UnifiedFrameController(PRODUCTION_CONFIG);
export const frameController = new FrameRateController(LIGHTWEIGHT_CONFIG);
export const renderOptimizer = new RenderOptimizer();
export const performanceMonitor = new FramePerformanceMonitor();

// グローバルアクセス用（デバッグ・検証）
if (typeof window !== 'undefined') {
  window.unifiedFrameController = unifiedFrameController;
  window.renderOptimizer = renderOptimizer;
  window.performanceMonitor = performanceMonitor;
} 