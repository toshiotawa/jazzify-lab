/**
 * Achievement-based title system utilities
 * Combines mission and lesson completion counts with title unlocking logic
 */

import { 
  getAvailableMissionTitles, 
  getAvailableLessonTitles, 
  getTitleConditionText,
  type MissionTitle,
  type LessonTitle,
  type AchievementTitle 
} from './titleConstants';
import { fetchUserStats } from '@/platform/supabaseUserStats';

/**
 * ユーザーのミッション・レッスン完了数を取得してアチーブメント称号を計算
 * @param userId ユーザーID（未指定の場合は現在のユーザー）
 * @returns 取得可能なアチーブメント称号リスト
 */
export const getUserAchievementTitles = async (userId?: string) => {
  try {
    const stats = await fetchUserStats(userId);
    
    const missionTitles = getAvailableMissionTitles(stats.missionCompletedCount);
    const lessonTitles = getAvailableLessonTitles(stats.lessonCompletedCount);
    
    return {
      missionTitles,
      lessonTitles,
      missionCompletedCount: stats.missionCompletedCount,
      lessonCompletedCount: stats.lessonCompletedCount
    };
  } catch (error) {
    // console.error('Failed to fetch user achievement titles:', error);
    return {
      missionTitles: [] as MissionTitle[],
      lessonTitles: [] as LessonTitle[],
      missionCompletedCount: 0,
      lessonCompletedCount: 0
    };
  }
};

/**
 * 称号がアチーブメント称号かどうかを判定
 * @param titleName 称号名
 * @returns アチーブメント称号の場合true
 */
export const isAchievementTitle = (titleName: string): titleName is AchievementTitle => {
  return getTitleConditionText(titleName) !== '';
};

/**
 * アチーブメント称号の表示用データを生成
 * @param titleName 称号名
 * @returns 表示用データ（名前と条件テキスト）
 */
export const formatAchievementTitleDisplay = (titleName: string) => {
  const conditionText = getTitleConditionText(titleName);
  if (conditionText) {
    return `${titleName}（${conditionText}）`;
  }
  return titleName;
};