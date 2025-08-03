/**
 * UIStrategy
 * FantasyGameEngineのUI戦略パターン
 */

import type { FantasyStage } from '../FantasyGameEngine';

export interface UIStrategy {
  init(stage: FantasyStage): void;
  onPlayerInput(midi: number, timestamp: number): void;
  update(currentTimeMs: number): void;
  destroy(): void;
}

/**
 * シングルモード用UI戦略（既存のUI）
 */
export class SingleUIStrategy implements UIStrategy {
  init(stage: FantasyStage): void {
    // 既存のシングルモード初期化処理
  }

  onPlayerInput(midi: number, timestamp: number): void {
    // 既存の入力処理
  }

  update(currentTimeMs: number): void {
    // 既存の更新処理
  }

  destroy(): void {
    // クリーンアップ処理
  }
}