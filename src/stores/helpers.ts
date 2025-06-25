import { shallow } from 'zustand/shallow';
import { useGameStore } from './gameStore';

// ゲームストアの内部型を隠蔽するため、ローカルエイリアスを定義
type StoreState = ReturnType<typeof useGameStore.getState>;

/**
 * Zustand セレクターラッパー
 * 指定 slice のみを購読し shallow 比較で不要な再レンダリングを防ぐ
 */
export const useGameSelector = <T>(
  selector: (state: StoreState) => T
) => useGameStore(selector, shallow);

/**
 * アクションだけを取り出すユーティリティ
 * getState() 由来なのでレンダリングには影響しない
 */
// 型循環の警告を避けるため any を許容
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useGameActions: () => any = () => useGameStore.getState(); 