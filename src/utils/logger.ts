/**
 * 統一ログシステム - パフォーマンス最適化版
 * フレーム毎のログスパムを防止し、CPU消費を削減
 */

type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

// 環境に応じたデフォルトレベル設定
let currentLevel: LogLevel = import.meta.env.PROD ? 'warn' : 'debug';

/**
 * ログレベルを動的に変更
 * URL パラメータ ?debug=true でデバッグ有効化可能
 */
export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

/**
 * URL パラメータでログレベルを制御
 */
if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  if (params.get('debug') === 'true') {
    currentLevel = 'debug';
  } else if (params.get('silent') === 'true') {
    currentLevel = 'silent';
  }
}

/**
 * 統一ログインターフェース
 */
export const log = {
  error: (...args: unknown[]) => 
    currentLevel !== 'silent' && console.error(...args),
  
  warn: (...args: unknown[]) => 
    ['warn', 'info', 'debug'].includes(currentLevel) && console.warn(...args),
  
  info: (...args: unknown[]) => 
    ['info', 'debug'].includes(currentLevel) && console.info(...args),
  
  debug: (...args: unknown[]) => 
    currentLevel === 'debug' && console.log(...args),
};

/**
 * 頻度制限付きログ（FPS測定など）
 */
class ThrottledLogger {
  private lastLogTime = 0;
  private interval: number;
  
  constructor(intervalMs: number = 1000) {
    this.interval = intervalMs;
  }
  
  info(message: string, ...args: unknown[]): void {
    const now = performance.now();
    if (now - this.lastLogTime >= this.interval) {
      log.info(message, ...args);
      this.lastLogTime = now;
    }
  }
  
  debug(message: string, ...args: unknown[]): void {
    const now = performance.now();
    if (now - this.lastLogTime >= this.interval) {
      log.debug(message, ...args);
      this.lastLogTime = now;
    }
  }
}

/**
 * パフォーマンス監視用の制限付きロガー
 */
export const perfLog = new ThrottledLogger(1000);

/**
 * 開発専用ログ（プロダクションでは完全無効）
 */
export const devLog = {
  debug: (...args: unknown[]) => 
    !import.meta.env.PROD && currentLevel === 'debug' && console.log(...args),
  
  info: (...args: unknown[]) => 
    !import.meta.env.PROD && ['info', 'debug'].includes(currentLevel) && console.info(...args),
};

/**
 * 現在のログレベルを取得
 */
export function getLogLevel(): LogLevel {
  return currentLevel;
}

export default log; 