/**
 * ゲストユーザー用ファンタジーモード進捗管理
 * ローカルストレージを使用してステージ進捗を保存
 */

const FANTASY_PROGRESS_KEY = 'fantasy_guest_progress';
const FANTASY_CLEARS_KEY = 'fantasy_guest_clears';

export interface LocalFantasyProgress {
  currentStageNumber: string;
  totalClearedStages: number;
  wizardRank: string;
}

export interface LocalFantasyClear {
  stageId: string;
  stageNumber: string;
  clearedAt: string;
  score: number;
  clearType: 'clear' | 'gameover';
  remainingHp?: number;
  totalQuestions: number;
  correctAnswers: number;
}

/**
 * ゲストユーザーの進捗を取得
 */
export function getGuestFantasyProgress(): LocalFantasyProgress {
  try {
    const stored = localStorage.getItem(FANTASY_PROGRESS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('ゲスト進捗の読み込みエラー:', error);
  }
  
  // デフォルトの進捗（ランク1-1から開始）
  return {
    currentStageNumber: '1-1',
    totalClearedStages: 0,
    wizardRank: 'F'
  };
}

/**
 * ゲストユーザーの進捗を保存
 */
export function saveGuestFantasyProgress(progress: LocalFantasyProgress): void {
  try {
    localStorage.setItem(FANTASY_PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('ゲスト進捗の保存エラー:', error);
  }
}

/**
 * ゲストユーザーのクリア記録を取得
 */
export function getGuestFantasyClears(): LocalFantasyClear[] {
  try {
    const stored = localStorage.getItem(FANTASY_CLEARS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('ゲストクリア記録の読み込みエラー:', error);
  }
  
  return [];
}

/**
 * ゲストユーザーのクリア記録を追加
 */
export function addGuestFantasyClear(clear: LocalFantasyClear): void {
  try {
    const clears = getGuestFantasyClears();
    // 同じステージのクリア記録があれば更新、なければ追加
    const existingIndex = clears.findIndex(c => c.stageId === clear.stageId);
    if (existingIndex >= 0) {
      clears[existingIndex] = clear;
    } else {
      clears.push(clear);
    }
    localStorage.setItem(FANTASY_CLEARS_KEY, JSON.stringify(clears));
  } catch (error) {
    console.error('ゲストクリア記録の保存エラー:', error);
  }
}

/**
 * ゲストユーザーの次のステージ番号を更新
 */
export function updateGuestNextStage(nextStageNumber: string): void {
  const progress = getGuestFantasyProgress();
  const [currentRank] = progress.currentStageNumber.split('-').map(Number);
  const [nextRank] = nextStageNumber.split('-').map(Number);
  
  // ランク2以降は進めない（ゲストユーザー制限）
  if (nextRank > 1) {
    return;
  }
  
  progress.currentStageNumber = nextStageNumber;
  progress.totalClearedStages += 1;
  saveGuestFantasyProgress(progress);
}

/**
 * ステージがゲストユーザーにとってアンロックされているかチェック
 */
export function isStageUnlockedForGuest(stageNumber: string): boolean {
  const [rank] = stageNumber.split('-').map(Number);
  
  // ランク2以降はロック
  if (rank > 1) {
    return false;
  }
  
  const progress = getGuestFantasyProgress();
  const clears = getGuestFantasyClears();
  
  // クリア済みならアンロック
  if (clears.some(c => c.stageNumber === stageNumber && c.clearType === 'clear')) {
    return true;
  }
  
  // 現在地より前ならアンロック
  const [currR, currS] = progress.currentStageNumber.split('-').map(Number);
  const [r, s] = stageNumber.split('-').map(Number);
  
  if (r < currR) return true;
  if (r === currR && s <= currS) return true;
  
  return false;
}

/**
 * フリーユーザーにとってステージがアンロックされているかチェック
 */
export function isStageUnlockedForFreeUser(stageNumber: string, userProgress: any, stageClears: any[]): boolean {
  const [rank] = stageNumber.split('-').map(Number);
  
  // ランク2以降はロック（フリーユーザー制限）
  if (rank > 1) {
    return false;
  }
  
  // ランク1内では通常のロジックを適用
  if (!userProgress) return false;
  
  // クリア済みならアンロック
  const stageId = stageClears.find(c => c.stageNumber === stageNumber)?.stageId;
  if (stageId && stageClears.some(c => c.stageId === stageId && c.clearType === 'clear')) {
    return true;
  }
  
  // 現在地より前ならアンロック
  const [currR, currS] = userProgress.currentStageNumber.split('-').map(Number);
  const [r, s] = stageNumber.split('-').map(Number);
  
  if (r < currR) return true;
  if (r === currR && s <= currS) return true;
  
  return false;
}