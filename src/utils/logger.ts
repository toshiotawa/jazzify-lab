/**
 * 統一ログシステム - プロダクション最適化版
 * 本番環境では全ログを無効化し、CPU消費を完全に削減
 */

type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

// プロダクション環境では全ログを無効化
let currentLevel: LogLevel = import.meta.env.PROD ? 'silent' : 'debug';

/**
 * ログレベルを動的に変更（プロダクションでは無効）
 */
export function setLogLevel(level: LogLevel): void {
  if (!import.meta.env.PROD) {
    currentLevel = level;
  }
}

/**
 * URL パラメータでログレベルを制御（開発環境のみ）
 */
if (typeof window !== 'undefined' && !import.meta.env.PROD) {
  const params = new URLSearchParams(window.location.search);
  if (params.get('debug') === 'true') {
    currentLevel = 'debug';
  } else if (params.get('silent') === 'true') {
    currentLevel = 'silent';
  }
}

/**
 * プロダクション環境用空関数
 */
const noop = () => {};

/**
 * 統一ログインターフェース - プロダクション最適化
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
 * 開発専用ログ（プロダクションでも有効）
 */
export const devLog = {
  debug: (...args: unknown[]) => 
    currentLevel === 'debug' && console.log(...args),
  
  info: (...args: unknown[]) => 
    ['info', 'debug'].includes(currentLevel) && console.info(...args),
  
  error: (...args: unknown[]) => 
    console.error(...args), // エラーは常に表示
};

/**
 * 現在のログレベルを取得
 */
export function getLogLevel(): LogLevel {
  return currentLevel;
}

export default log; 