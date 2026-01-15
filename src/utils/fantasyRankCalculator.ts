/**
 * ファンタジーモード ランク計算ユーティリティ
 * 
 * ランク判定基準:
 * - ノーミス（HP全残り）→ Sランク
 * - 80-99% HP残り → Aランク
 * - 60-79% HP残り → Bランク
 * - 1-59% HP残り → Cランク
 * - ゲームオーバー → Dランク
 */

import { FantasyRank } from '@/types';

/**
 * ゲーム結果からランクを計算
 * @param result ゲーム結果 ('clear' | 'gameover')
 * @param remainingHp 残りHP
 * @param maxHp 最大HP
 * @returns ランク (S/A/B/C/D)
 */
export const calculateFantasyRank = (
  result: 'clear' | 'gameover',
  remainingHp: number,
  maxHp: number
): FantasyRank => {
  // ゲームオーバーはDランク
  if (result === 'gameover') {
    return 'D';
  }

  // HPのパーセンテージを計算
  const hpPercentage = (remainingHp / maxHp) * 100;

  // ノーミス（HP全残り）→ Sランク
  if (remainingHp === maxHp) {
    return 'S';
  }

  // 80-99% → Aランク
  if (hpPercentage >= 80) {
    return 'A';
  }

  // 60-79% → Bランク
  if (hpPercentage >= 60) {
    return 'B';
  }

  // 1-59% → Cランク（クリアしているので最低でもC）
  return 'C';
};

/**
 * ランクに応じたクリア換算回数を取得
 * Sランク = 10回分、それ以外 = 1回分
 * @param rank ランク
 * @param result ゲーム結果
 * @returns クリア換算回数
 */
export const getRankClearCredit = (
  rank: FantasyRank,
  result: 'clear' | 'gameover'
): number => {
  // ゲームオーバーは0
  if (result === 'gameover') {
    return 0;
  }

  // Sランクは10回分
  if (rank === 'S') {
    return 10;
  }

  // それ以外は1回分
  return 1;
};

/**
 * ランクの表示色を取得
 * @param rank ランク
 * @returns Tailwind CSS カラークラス
 */
export const getRankColor = (rank: FantasyRank | null | undefined): string => {
  switch (rank) {
    case 'S':
      return 'text-yellow-400'; // ゴールド
    case 'A':
      return 'text-purple-400'; // パープル
    case 'B':
      return 'text-blue-400'; // ブルー
    case 'C':
      return 'text-green-400'; // グリーン
    case 'D':
      return 'text-gray-400'; // グレー
    default:
      return 'text-gray-500';
  }
};

/**
 * ランクの背景色を取得
 * @param rank ランク
 * @returns Tailwind CSS 背景カラークラス
 */
export const getRankBgColor = (rank: FantasyRank | null | undefined): string => {
  switch (rank) {
    case 'S':
      return 'bg-yellow-500/20 border-yellow-500';
    case 'A':
      return 'bg-purple-500/20 border-purple-500';
    case 'B':
      return 'bg-blue-500/20 border-blue-500';
    case 'C':
      return 'bg-green-500/20 border-green-500';
    case 'D':
      return 'bg-gray-500/20 border-gray-500';
    default:
      return 'bg-gray-700/20 border-gray-700';
  }
};

/**
 * ランクの表示名を取得
 * @param rank ランク
 * @param isEnglish 英語表示かどうか
 * @returns ランクの表示名
 */
export const getRankDisplayName = (
  rank: FantasyRank | null | undefined,
  isEnglish: boolean = false
): string => {
  if (!rank) {
    return isEnglish ? 'Not Cleared' : '未クリア';
  }

  const names: Record<FantasyRank, { en: string; ja: string }> = {
    S: { en: 'S Rank (Perfect!)', ja: 'Sランク（ノーミス！）' },
    A: { en: 'A Rank (Excellent)', ja: 'Aランク（素晴らしい）' },
    B: { en: 'B Rank (Good)', ja: 'Bランク（良い）' },
    C: { en: 'C Rank (Clear)', ja: 'Cランク（クリア）' },
    D: { en: 'D Rank (Game Over)', ja: 'Dランク（ゲームオーバー）' },
  };

  return isEnglish ? names[rank].en : names[rank].ja;
};

/**
 * ランクを数値に変換（比較用）
 * @param rank ランク
 * @returns 数値 (S=5, A=4, B=3, C=2, D=1, null=0)
 */
export const rankToNumber = (rank: FantasyRank | null | undefined): number => {
  switch (rank) {
    case 'S':
      return 5;
    case 'A':
      return 4;
    case 'B':
      return 3;
    case 'C':
      return 2;
    case 'D':
      return 1;
    default:
      return 0;
  }
};

/**
 * ランクを比較して、より良いランクを返す
 * @param rank1 ランク1
 * @param rank2 ランク2
 * @returns より良いランク
 */
export const getBetterRank = (
  rank1: FantasyRank | null | undefined,
  rank2: FantasyRank | null | undefined
): FantasyRank | null => {
  const num1 = rankToNumber(rank1);
  const num2 = rankToNumber(rank2);

  if (num1 >= num2) {
    return rank1 ?? null;
  }
  return rank2 ?? null;
};

/**
 * 次ステージ開放までの残りクリア回数を計算
 * @param currentClearCredit 現在のクリア換算回数
 * @param requiredClears 必要クリア換算回数
 * @returns 残りクリア回数（0以上）
 */
export const getRemainingClearsForNextStage = (
  currentClearCredit: number,
  requiredClears: number
): number => {
  return Math.max(0, requiredClears - currentClearCredit);
};

/**
 * 次ステージが開放されているかどうかを判定
 * @param currentClearCredit 現在のクリア換算回数
 * @param requiredClears 必要クリア換算回数
 * @returns 開放されているかどうか
 */
export const isNextStageUnlocked = (
  currentClearCredit: number,
  requiredClears: number
): boolean => {
  return currentClearCredit >= requiredClears;
};
