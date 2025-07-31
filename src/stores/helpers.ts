import { useGameStore } from './gameStore';

// ゲームストアの内部型を隠蔽するため、ローカルエイリアスを定義
type StoreState = ReturnType<typeof useGameStore.getState>;

// 簡単なshallow比較の実装（本番環境での読み込みエラーを回避）
const shallowEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  
  return true;
};

/**
 * Zustand セレクターラッパー
 * 指定 slice のみを購読し shallow 比較で不要な再レンダリングを防ぐ
 */
export const useGameSelector = <T>(
  selector: (state: StoreState) => T
) => useGameStore(selector, shallowEqual);

/**
 * アクションだけを取り出すユーティリティ
 * getState() 由来なのでレンダリングには影響しない
 */
// 型循環の警告を避けるため any を許容
 
export const useGameActions: () => any = () => useGameStore.getState(); 