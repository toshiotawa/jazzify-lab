/**
 * 音楽関連のユーティリティ関数
 */

/**
 * 音楽のキー名をフォーマットする
 * @param rootNote ルート音（例: "C", "D#", "Eb"）
 * @param isMinor マイナー調かどうか
 * @param options オプション設定
 * @returns フォーマットされたキー名（例: "C major", "A minor"）
 */
export function formatKeyName(
  rootNote: string, 
  isMinor: boolean, 
  options?: {
    /** 大文字にするか */
    capitalize?: boolean;
    /** 略称を使うか（maj/min） */
    abbreviated?: boolean;
  }
): string {
  const mode = isMinor ? 'minor' : 'major';
  
  if (options?.abbreviated) {
    return `${rootNote} ${isMinor ? 'min' : 'maj'}`;
  }
  
  const keyName = `${rootNote} ${mode}`;
  
  if (options?.capitalize) {
    return keyName.charAt(0).toUpperCase() + keyName.slice(1);
  }
  
  return keyName;
}

/**
 * キー名をパースする
 * @param keyName キー名（例: "C major", "A minor"）
 * @returns パースされたキー情報
 */
export function parseKeyName(keyName: string): {
  rootNote: string;
  isMinor: boolean;
} | null {
  const parts = keyName.trim().split(/\s+/);
  
  if (parts.length < 2) {
    return null;
  }
  
  const rootNote = parts[0];
  const mode = parts[1].toLowerCase();
  
  return {
    rootNote,
    isMinor: mode === 'minor' || mode === 'min'
  };
}

/**
 * 汎用的な音楽文字列フォーマッター
 * @param template テンプレート文字列
 * @param options フォーマットオプション
 * @returns フォーマットされた文字列
 */
export function formatter(
  template: string, 
  options?: {
    /** 大文字/小文字の処理 */
    case?: 'upper' | 'lower' | 'title';
    /** トリミングするか */
    trim?: boolean;
  }
): string {
  let result = template;
  
  if (options?.trim) {
    result = result.trim();
  }
  
  switch (options?.case) {
    case 'upper':
      result = result.toUpperCase();
      break;
    case 'lower':
      result = result.toLowerCase();
      break;
    case 'title':
      result = result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
      break;
  }
  
  return result;
}