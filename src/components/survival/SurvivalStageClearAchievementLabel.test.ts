import { describe, expect, it } from 'vitest';
import { formatSurvivalStageClearAchievementLabel } from './SurvivalStageDefinitions';

describe('formatSurvivalStageClearAchievementLabel', () => {
  const base = {
    stageTimeLimitSec: 90,
    stageKillQuota: 20,
  };

  it('ボス戦はボス撃破メッセージ', () => {
    expect(formatSurvivalStageClearAchievementLabel({
      ...base,
      isEnglish: false,
      isBossStage: true,
      isCodeRunStage: false,
      isBalloonRushStage: false,
    })).toBe('ボス撃破達成！');
  });

  it('風船ラッシュは時間内ポップ達成メッセージ', () => {
    expect(formatSurvivalStageClearAchievementLabel({
      ...base,
      isEnglish: false,
      isBossStage: false,
      isCodeRunStage: false,
      isBalloonRushStage: true,
    })).toBe('90秒以内に風船を20個割る達成！');
  });

  it('コードランはゴール到達メッセージ', () => {
    expect(formatSurvivalStageClearAchievementLabel({
      ...base,
      isEnglish: false,
      isBossStage: false,
      isCodeRunStage: true,
      isBalloonRushStage: false,
    })).toBe('ゴール到達！');
  });

  it('通常サバイバルは生存+撃破メッセージ', () => {
    expect(formatSurvivalStageClearAchievementLabel({
      ...base,
      isEnglish: false,
      isBossStage: false,
      isCodeRunStage: false,
      isBalloonRushStage: false,
    })).toBe('90秒生存 + 20体撃破達成！');
  });
});
