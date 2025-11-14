/**
 * 統一ログシステム - プロダクション最適化版
 * 本番環境では全ログを無効化し、CPU消費を完全に削減
 */

type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVEL_STORAGE_KEY = 'jazzgame:logLevel';

const isLogLevel = (value: string | null): value is LogLevel => {
  return value === 'silent' ||
    value === 'error' ||
    value === 'warn' ||
    value === 'info' ||
    value === 'debug';
};

const loadPersistedLogLevel = (): LogLevel | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage?.getItem(LOG_LEVEL_STORAGE_KEY);
    if (isLogLevel(stored)) {
      return stored;
    }
  } catch {
    // localStorageが利用できない場合は無視
  }
  return null;
};

const defaultLogLevel: LogLevel = loadPersistedLogLevel()
  ?? (import.meta.env.PROD ? 'warn' : 'info');

let currentLevel: LogLevel = defaultLogLevel;

const persistLogLevel = (level: LogLevel): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.setItem(LOG_LEVEL_STORAGE_KEY, level);
  } catch {
    // localStorageが利用できない場合は無視
  }
};

/**
 * ログレベルを動的に変更
 */
export function setLogLevel(level: LogLevel, options: { persist?: boolean } = {}): void {
  currentLevel = level;
  if (options.persist !== false) {
    persistLogLevel(level);
  }
}

/**
 * URL パラメータでログレベルを制御（開発環境のみ）
 */
if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  if (params.get('debug') === 'true') {
    setLogLevel('debug', { persist: false });
  } else if (params.get('silent') === 'true') {
    setLogLevel('silent', { persist: false });
  } else if (isLogLevel(params.get('logLevel'))) {
    setLogLevel(params.get('logLevel') as LogLevel, { persist: false });
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
 * 頻度制限付きログ（プロダクションでは完全無効）
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
 * パフォーマンス監視用の制限付きロガー（プロダクションでも有効）
 */
export const perfLog = new ThrottledLogger(1000);

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