/**
 * 🎯 ノーツ降下軽量化設定
 * パフォーマンス改善のためのシンプルな設定
 */

export interface LightweightConfig {
  // フレームレート制御
  targetFPS: number;
  
  // 表示制限
  maxActiveNotes: number;
  
  // エフェクト軽減
  reduceEffects: boolean;
  
  // 描画最適化
  simplifiedGraphics: boolean;
  
  // 更新頻度
  updateInterval: number;
  
  // デバッグログ制御
  enableDebugLogs: boolean;
}

// 軽量化モード（パフォーマンス重視）
export const LIGHTWEIGHT_MODE: LightweightConfig = {
  targetFPS: 30,           // 60FPS → 30FPSに軽量化
  maxActiveNotes: 15,      // 同時表示ノーツ数を制限
  reduceEffects: true,     // パーティクルエフェクト軽減
  simplifiedGraphics: true, // グラフィック簡略化
  updateInterval: 33,      // 30FPS相当（33ms）
  enableDebugLogs: false   // デバッグログを無効化
};

// 標準モード（品質重視）
export const STANDARD_MODE: LightweightConfig = {
  targetFPS: 60,
  maxActiveNotes: 30,
  reduceEffects: false,
  simplifiedGraphics: false,
  updateInterval: 16,      // 60FPS相当（16ms）
  enableDebugLogs: true    // デバッグログを有効化（標準モード）
};

// 現在の設定（デフォルトは軽量化モード）
export let currentConfig: LightweightConfig = LIGHTWEIGHT_MODE;

// 設定変更関数
export const setPerformanceMode = (lightweight: boolean) => {
  currentConfig = lightweight ? LIGHTWEIGHT_MODE : STANDARD_MODE;
  // // console.log(`🎯 パフォーマンスモード変更: ${lightweight ? '軽量化' : '標準'}モード`);
};

// フレームレート制御ヘルパー
export class SimpleFPSController {
  private lastTime = 0;
  
  shouldSkipFrame(currentTime: number): boolean {
    const deltaTime = currentTime - this.lastTime;
    const targetInterval = currentConfig.updateInterval;
    
    if (deltaTime < targetInterval) {
      return true; // フレームスキップ
    }
    
    this.lastTime = currentTime;
    return false;
  }
  
  getDeltaTime(currentTime: number): number {
    return currentTime - this.lastTime;
  }
}

export const fpsController = new SimpleFPSController();

// デバッグログ制御ヘルパー
export const debugLog = (message: string, ...args: unknown[]) => {
  if (currentConfig.enableDebugLogs) {
    // // console.log(message, ...args);
  }
};

export const debugWarn = (message: string, ...args: unknown[]) => {
  if (currentConfig.enableDebugLogs) {
    // console.warn(message, ...args);
  }
};

export const debugError = (message: string, ...args: unknown[]) => {
  if (currentConfig.enableDebugLogs) {
    // console.error(message, ...args);
  }
}; 