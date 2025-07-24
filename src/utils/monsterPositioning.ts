/**
 * モンスターの位置計算を統一するユーティリティ
 * UI要素とPIXI.jsの両方で同じロジックを使用することで、位置のズレを防ぎます
 */

export type MonsterPosition = 'A' | 'B' | 'C';

/**
 * モンスターの配置位置を計算する統一関数
 * @param position - モンスターの位置 ('A', 'B', 'C')
 * @param containerWidth - コンテナの幅
 * @returns X座標（中心座標）
 */
export function getMonsterPositionX(position: MonsterPosition, containerWidth: number): number {
  switch (position) {
    case 'A': return containerWidth * 0.25;
    case 'B': return containerWidth * 0.50;
    case 'C': return containerWidth * 0.75;
  }
}

/**
 * CSSのパーセンテージ値を取得
 * @param position - モンスターの位置
 * @returns CSSのleftプロパティ用のパーセンテージ値
 */
export function getMonsterPositionPercentage(position: MonsterPosition): string {
  switch (position) {
    case 'A': return '25%';
    case 'B': return '50%';
    case 'C': return '75%';
  }
}

/**
 * 単一モンスターモードかどうかを判定し、適切な位置を返す
 * @param monsterCount - モンスターの総数
 * @param position - モンスターの位置
 * @returns 調整された位置
 */
export function getAdjustedPosition(monsterCount: number, position: MonsterPosition): MonsterPosition {
  // 1体の場合は常に中央（B）に配置
  if (monsterCount === 1) {
    return 'B';
  }
  return position;
}

/**
 * モンスターコンテナの設定を取得
 * @returns コンテナのスタイル設定
 */
export function getMonsterContainerStyle() {
  return {
    position: 'relative' as const,
    width: '100%',
    maxWidth: '90vw',
    margin: '0 auto',
    height: 'min(120px, 22vw)'
  };
}

/**
 * 個別のモンスター要素のスタイルを取得
 * @param position - モンスターの位置
 * @param monsterCount - モンスターの総数
 * @returns モンスター要素のスタイル
 */
export function getMonsterElementStyle(position: MonsterPosition, monsterCount: number) {
  const adjustedPosition = getAdjustedPosition(monsterCount, position);
  
  return {
    position: 'absolute' as const,
    left: getMonsterPositionPercentage(adjustedPosition),
    transform: 'translateX(-50%)',
    width: '160px',
    maxWidth: '160px'
  };
}