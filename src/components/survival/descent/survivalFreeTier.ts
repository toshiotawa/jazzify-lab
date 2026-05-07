/**
 * サバイバル「フリープランでプレイ可能なステージ」判定用の純関数。
 * Supabase / ステージキャッシュに依存しないため単体テスト可能。
 */

export interface FreeTierBlockLike {
  readonly stageNumbers: readonly number[];
}

/** ブロック一覧の先頭ブロックに含まれるステージ番号 */
export function getStageNumbersOfFirstBlock(blocks: ReadonlyArray<FreeTierBlockLike>): readonly number[] {
  const first = blocks[0];
  if (!first) return [];
  return first.stageNumbers;
}
