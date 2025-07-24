/**
 * ファンタジーモード用位置計算ユーティリティ
 * UI と PIXI の両方で同じ関数を使えるよう、共有ユーティリティ
 */

export const getPositionRatio = (pos: 'A' | 'B' | 'C') =>
  pos === 'A' ? 0.25 : pos === 'B' ? 0.5 : 0.75;

/**
 * PIXI用のX座標を計算
 */
export const getPixiPositionX = (position: 'A' | 'B' | 'C', screenWidth: number): number => {
  return screenWidth * getPositionRatio(position);
};

/**
 * CSS用のleft位置を計算
 */
export const getCssLeftPosition = (position: 'A' | 'B' | 'C'): string => {
  return `${getPositionRatio(position) * 100}%`;
}; 