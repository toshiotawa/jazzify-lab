import type { BalloonRushStageType } from '@/utils/balloonRushStageDefinitions';
import type { EarTrainingStage } from '@/types';
import type { StageDefinition } from '@/components/survival/SurvivalStageDefinitions';
import {
  formatSurvivalEncounterLabel,
  formatSurvivalStageModeLabel,
} from '@/components/survival/SurvivalStageDefinitions';
import { getEarTrainingLessonClearConditionText } from '@/utils/earTrainingLessonClearCondition';

type EarTrainingModeLabelSource = Pick<EarTrainingStage, 'mode'>;

function formatEarTrainingModeLabel(
  stage: EarTrainingModeLabelSource | null | undefined,
  isEnglish: boolean,
): string {
  const mode = stage?.mode;
  if (isEnglish) {
    switch (mode) {
      case 'phrase':
        return 'Ear copy';
      case 'chord_voicing':
        return 'Chord voicing';
      case 'chord_quiz':
        return 'Chord quiz';
      case 'chord_osmd':
        return 'Sheet music battle';
      case 'adlib':
        return 'Ad lib';
      case 'phrase_pair_adlib':
        return 'Phrase pair ad lib';
      default:
        return 'Battle mode';
    }
  }
  switch (mode) {
    case 'phrase':
      return '耳コピ';
    case 'chord_voicing':
      return 'コード演奏';
    case 'chord_quiz':
      return 'コードクイズ';
    case 'chord_osmd':
      return '楽譜バトル';
    case 'adlib':
      return 'アドリブ';
    case 'phrase_pair_adlib':
      return 'フレーズペアアドリブ';
    default:
      return 'バトルモード';
  }
}

function formatBalloonRushStageModeLabel(
  stageType: BalloonRushStageType | null | undefined,
  isEnglish: boolean,
): string {
  if (stageType === 'random') {
    return isEnglish ? 'Random chords' : 'ランダムコード';
  }
  return isEnglish ? 'Progression chords' : 'プログレッションコード';
}

type SurvivalLessonRequirementLines = {
  modeEncounterLine: string;
  clearLine: string;
};

export const buildSurvivalLessonRequirementDisplay = (
  stage: StageDefinition,
  isBossEncounter: boolean,
  timeLimitSec: number,
  killQuota: number,
  isEnglish: boolean,
): SurvivalLessonRequirementLines => {
  const modeLabel = formatSurvivalStageModeLabel(stage, isEnglish);
  const encounterLabel = formatSurvivalEncounterLabel(stage, isEnglish);
  const modeEncounterLine = isEnglish
    ? `Mode: ${modeLabel} · Encounter: ${isBossEncounter ? 'Boss' : encounterLabel}`
    : `出題: ${modeLabel} · 戦闘: ${isBossEncounter ? 'ボス' : encounterLabel}`;
  if (stage.playMode === 'code_run') {
    return {
      modeEncounterLine,
      clearLine: isEnglish
        ? `Clear: reach the goal within ${timeLimitSec}s`
        : `クリア条件: ${timeLimitSec}秒以内にゴール`,
    };
  }
  const clearLine = isBossEncounter
    ? (isEnglish ? 'Clear: defeat the boss' : 'クリア条件: ボス撃破')
    : isEnglish
      ? `Clear: survive ${timeLimitSec}s and defeat ${killQuota} enemies`
      : `クリア条件: ${timeLimitSec}秒生存 + ${killQuota}体撃破`;
  return { modeEncounterLine, clearLine };
};

type EarTrainingLessonRequirementLines = {
  taskTypeLine: string;
  clearLine: string;
};

export const buildEarTrainingLessonRequirementDisplay = (
  stage: Pick<
    EarTrainingStage,
    'mode' | 'quiz_duration_seconds' | 'quiz_required_correct_count'
  > | null | undefined,
  isEnglish: boolean,
): EarTrainingLessonRequirementLines => {
  const taskTypePrefix = isEnglish ? 'Task type' : '課題タイプ';
  const clearPrefix = isEnglish ? 'Clear' : 'クリア条件';
  const modeLabel = formatEarTrainingModeLabel(stage, isEnglish);
  const body = getEarTrainingLessonClearConditionText(stage, isEnglish);
  return {
    taskTypeLine: `${taskTypePrefix}: ${modeLabel}`,
    clearLine: `${clearPrefix}: ${body}`,
  };
};

type BalloonRushLessonRequirementLines = {
  taskTypeLine: string;
  clearLine: string;
};

/** Web `BalloonRushStageRow`（lesson ネスト）と snake_case で整合 */
type BalloonRushLessonStageSnapshot = {
  stage_type?: BalloonRushStageType | null;
  time_limit_sec?: number | null;
  pop_quota?: number | null;
};

export const buildBalloonRushLessonRequirementDisplay = (
  stage: BalloonRushLessonStageSnapshot | null | undefined,
  isEnglish: boolean,
): BalloonRushLessonRequirementLines | null => {
  const tl = typeof stage?.time_limit_sec === 'number' ? stage.time_limit_sec : undefined;
  const pq = typeof stage?.pop_quota === 'number' ? stage.pop_quota : undefined;
  if (tl === undefined || pq === undefined) {
    return null;
  }
  const taskTypePrefix = isEnglish ? 'Task type' : '課題タイプ';
  const clearPrefix = isEnglish ? 'Clear' : 'クリア条件';
  const st: BalloonRushStageType =
    stage?.stage_type === 'random' ? 'random' : 'progression';
  const modeLabel = formatBalloonRushStageModeLabel(st, isEnglish);
  const body = isEnglish
    ? `pop ${pq} balloons within ${tl}s`
    : `${tl}秒以内に風船を${pq}個割る`;
  return {
    taskTypeLine: `${taskTypePrefix}: ${modeLabel}`,
    clearLine: `${clearPrefix}: ${body}`,
  };
};
