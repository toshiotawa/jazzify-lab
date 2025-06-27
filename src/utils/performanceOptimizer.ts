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
 * パフォーマンス監視
 */
export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = 0;
  private fps = 0;
  
  updateFPS(): number {
    this.frameCount++;
    const now = performance.now();
    
    if (now - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = now;
    }
    
    return this.fps;
  }
  
  getFPS(): number {
    return this.fps;
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
  }
};

// シングルトンインスタンス
export const frameController = new FrameRateController(LIGHTWEIGHT_CONFIG);
export const performanceMonitor = new PerformanceMonitor(); 