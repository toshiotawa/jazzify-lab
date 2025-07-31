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
export class UnifiedFrameController {
  private lastFrameTime = 0;
  private frameSkipCount = 0;
  private config: PerformanceConfig;
  private lastNoteUpdateTime = 0;
  private lastEffectUpdateTime = 0;
  
  constructor(config: PerformanceConfig = PRODUCTION_CONFIG) {
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
 * パフォーマンス監視
 */
export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = 0;
  private fps = 0;
  private frameStartTime = 0;
  private frameDuration = 0;
  private optimizationWarnings = new Set<string>();
  private lastOptimizationCheck = 0;
  private initializationTime = performance.now();
  private isInitializationPhase = true;
  private animationFrameId: number | null = null;
  private isMonitoring = false;
  
  constructor() {
    // 自動的にフレーム監視を開始
    this.startMonitoring();
  }
  
  /**
   * 自動フレーム監視を開始
   */
  private startMonitoring(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    
    const monitorFrame = () => {
      this.startFrame();
      
      // 次のフレームでendFrameを呼ぶ
      this.animationFrameId = requestAnimationFrame(() => {
        this.endFrame();
        this.updateFPS();
        
        // 継続的に監視
        if (this.isMonitoring) {
          monitorFrame();
        }
      });
    };
    
    monitorFrame();
  }
  
  /**
   * 監視を停止
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  startFrame(): void {
    this.frameStartTime = performance.now();
    
    // 初期化フェーズの判定（最初の15秒間に延長）
    if (this.isInitializationPhase && (this.frameStartTime - this.initializationTime) > 15000) {
      this.isInitializationPhase = false;
      // // console.log('🎯 パフォーマンス監視開始 - 初期化フェーズ完了');
    }
  }
  
  endFrame(): void {
    this.frameDuration = performance.now() - this.frameStartTime;
  }
  
  updateFPS(): number {
    this.frameCount++;
    const now = performance.now();
    
    if (now - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = now;
      
      // 初期化フェーズでは警告を出さない
      if (!this.isInitializationPhase) {
        this.checkOptimizationHealth();
      }
    }
    
    return this.fps;
  }
  
  getFPS(): number {
    return this.fps;
  }
  
  getFrameDuration(): number {
    return this.frameDuration;
  }
  
  isPerformanceGood(): boolean {
    // 初期化フェーズでは常に正常と判定
    if (this.isInitializationPhase) return true;
    return this.fps >= 50 && this.frameDuration <= 20; // 50FPS以上、20ms以下
  }
  
  /**
   * 最適化の健全性チェック（頻度制限強化）
   */
  private checkOptimizationHealth(): void {
    const now = performance.now();
    // チェック間隔を10秒に延長（警告頻度を大幅削減）
    if (now - this.lastOptimizationCheck < 10000) return;
    
    this.lastOptimizationCheck = now;
    
    // 極めて厳格な閾値で警告（本当に深刻な問題のみ）
    if (this.fps < 15) {
      this.warnOnce('CRITICAL_FPS', `🔴 深刻なFPS低下: ${this.fps}FPS (目標: 60FPS)`);
    } else if (this.fps < 25) {
      this.warnOnce('LOW_FPS', `⚠️ FPS低下検出: ${this.fps}FPS (目標: 60FPS)`);
    }
    
    // フレーム時間も同様に厳格化
    if (this.frameDuration > 50) {
      this.warnOnce('CRITICAL_FRAME_TIME', `🔴 深刻なフレーム遅延: ${this.frameDuration.toFixed(1)}ms (目標: <20ms)`);
    } else if (this.frameDuration > 30) {
      this.warnOnce('HIGH_FRAME_TIME', `⚠️ フレーム時間超過: ${this.frameDuration.toFixed(1)}ms (目標: <20ms)`);
    }
    
    // 統合フレーム制御の動作確認（1回のみ）
    if (!window.unifiedFrameController) {
      this.warnOnce('MISSING_FRAME_CONTROLLER', '🔴 統合フレーム制御が無効化されています！');
    }
    
    // レンダー最適化の動作確認（1回のみ）
    if (!window.renderOptimizer) {
      this.warnOnce('MISSING_RENDER_OPTIMIZER', '🔴 レンダー最適化が無効化されています！');
    }
  }
  
  /**
   * 重複警告を防ぐワーニングシステム（強化版）
   */
  private warnOnce(key: string, message: string): void {
    if (!this.optimizationWarnings.has(key)) {
      // 軽量なワーニング出力
      // console.warn(message);
      this.optimizationWarnings.add(key);
      
      // 警告のリセット時間を延長（10分後）
      setTimeout(() => {
        this.optimizationWarnings.delete(key);
      }, 600000);
    }
  }
  
  /**
   * パフォーマンス状態の詳細レポート
   */
  getPerformanceReport(): {
    fps: number;
    frameDuration: number;
    isHealthy: boolean;
    warnings: string[];
    isInitializing: boolean;
    optimizations: {
      frameController: boolean;
      renderOptimizer: boolean;
      unifiedControl: boolean;
    };
  } {
    return {
      fps: this.fps,
      frameDuration: this.frameDuration,
      isHealthy: this.isPerformanceGood(),
      warnings: Array.from(this.optimizationWarnings),
      isInitializing: this.isInitializationPhase,
      optimizations: {
        frameController: !!window.unifiedFrameController,
        renderOptimizer: !!window.renderOptimizer,
        unifiedControl: !!window.unifiedFrameController?.getConfig
      }
    };
  }
}

/**
 * 開発時デバッグ用パフォーマンスダッシュボード
 */
export class PerformanceDebugger {
  private static instance: PerformanceDebugger;
  private debugElement: HTMLDivElement | null = null;
  private isEnabled = false;
  
  static getInstance(): PerformanceDebugger {
    if (!this.instance) {
      this.instance = new PerformanceDebugger();
    }
    return this.instance;
  }
  
  enable(): void {
    if (this.isEnabled) return;
    this.isEnabled = true;
    
    this.createDebugUI();
    this.startMonitoring();
  }
  
  disable(): void {
    if (!this.isEnabled) return;
    this.isEnabled = false;
    
    if (this.debugElement) {
      this.debugElement.remove();
      this.debugElement = null;
    }
  }
  
  private createDebugUI(): void {
    this.debugElement = document.createElement('div');
    this.debugElement.id = 'performance-debug';
    this.debugElement.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
      z-index: 9999;
      min-width: 250px;
    `;
    document.body.appendChild(this.debugElement);
  }
  
  private startMonitoring(): void {
    const updateDebugInfo = () => {
      if (!this.isEnabled || !this.debugElement) return;
      
      const report = performanceMonitor.getPerformanceReport();
      
      this.debugElement.innerHTML = `
        <div><strong>🎯 パフォーマンス監視</strong></div>
        <div>FPS: ${report.fps} / 60</div>
        <div>フレーム時間: ${report.frameDuration.toFixed(1)}ms</div>
        <div>状態: ${report.isHealthy ? '✅ 正常' : '⚠️ 要注意'}</div>
        <hr style="margin: 5px 0;">
        <div><strong>最適化状態:</strong></div>
        <div>統合制御: ${report.optimizations.frameController ? '✅' : '❌'}</div>
        <div>レンダー最適化: ${report.optimizations.renderOptimizer ? '✅' : '❌'}</div>
        <div>制御API: ${report.optimizations.unifiedControl ? '✅' : '❌'}</div>
        ${report.warnings.length > 0 ? `
          <hr style="margin: 5px 0;">
          <div style="color: #ff6b6b;"><strong>警告:</strong></div>
          ${report.warnings.map(w => `<div style="color: #ff6b6b;">• ${w}</div>`).join('')}
        ` : ''}
      `;
      
      setTimeout(updateDebugInfo, 1000);
    };
    
    updateDebugInfo();
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
  debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return ((...args: unknown[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    }) as T;
  },
  
  /**
   * スロットル処理
   */
  throttle<T extends (...args: unknown[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean;
    return ((...args: unknown[]) => {
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
    performanceDebugger: PerformanceDebugger;
  }
}

// シングルトンインスタンス
export const unifiedFrameController = new UnifiedFrameController(PRODUCTION_CONFIG);
export const frameController = new FrameRateController(LIGHTWEIGHT_CONFIG);
export const performanceMonitor = new PerformanceMonitor();
export const renderOptimizer = new RenderOptimizer();
export const performanceDebugger = PerformanceDebugger.getInstance();

// グローバルアクセス用（デバッグ・検証）
if (typeof window !== 'undefined') {
  window.unifiedFrameController = unifiedFrameController;
  window.renderOptimizer = renderOptimizer;
  window.performanceMonitor = performanceMonitor;
  window.performanceDebugger = performanceDebugger;
} 