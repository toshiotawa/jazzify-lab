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
      case 'chord_precision':
        return 'Precision mode';
      case 'adlib':
        return 'Ad lib';
      case 'phrase_pair_adlib':
        return 'Phrase pair ad lib';
      case 'adlib_call_response':
        return 'Ad lib call & response';
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
    case 'chord_precision':
      return '精密モード';
    case 'adlib':
      return 'アドリブ';
    case 'phrase_pair_adlib':
      return 'フレーズペアアドリブ';
    case 'adlib_call_response':
      return 'アドリブコール&レスポンス';
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
        ? 'Clear: reach the goal'
        : 'クリア条件: ゴールに到達',
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

type VideoLessonRequirementLines = {
  taskTypeLine: string;
  clearLine: string;
};

type VideoLessonStageSnapshot = {
  duration_sec?: number | null;
  duration_en_sec?: number | null;
  required_watch_ratio?: number | null;
};

const formatApproxDurationMinutes = (
  durationSec: number | null | undefined,
  isEnglish: boolean,
): string | null => {
  if (typeof durationSec !== 'number' || !(durationSec > 0)) {
    return null;
  }
  const minutes = Math.max(1, Math.round(durationSec / 60));
  return isEnglish ? `about ${minutes} min` : `約${minutes}分`;
};

export const buildVideoLessonRequirementDisplay = (
  stage: VideoLessonStageSnapshot | null | undefined,
  isEnglish: boolean,
): VideoLessonRequirementLines => {
  const taskTypePrefix = isEnglish ? 'Task type' : '課題タイプ';
  const clearPrefix = isEnglish ? 'Clear' : 'クリア条件';
  const durationHint = formatApproxDurationMinutes(
    isEnglish
      ? (stage?.duration_en_sec ?? stage?.duration_sec)
      : stage?.duration_sec,
    isEnglish,
  );
  const taskTypeBody = durationHint
    ? (isEnglish ? `Video watch · ${durationHint}` : `動画視聴・${durationHint}`)
    : (isEnglish ? 'Video watch' : '動画視聴');
  const ratioRaw = stage?.required_watch_ratio;
  const ratio = typeof ratioRaw === 'number' && Number.isFinite(ratioRaw) ? ratioRaw : 0.9;
  const percent = Math.round(Math.min(1, Math.max(0.5, ratio)) * 100);
  const clearBody = isEnglish
    ? `watch at least ${percent}% then tap Complete`
    : `${percent}%以上視聴して完了ボタンを押す`;
  return {
    taskTypeLine: `${taskTypePrefix}: ${taskTypeBody}`,
    clearLine: `${clearPrefix}: ${clearBody}`,
  };
};
