import type { EarTrainingTutorialScene } from './earTrainingTutorialScriptTypes';

/** 会話行がタイマーで自動送りされるか（最終行→OSMD 直前はタップ必須） */
export const shouldScheduleDialogueAutoAdvance = (
  lineIndex: number,
  lineCount: number,
  requireTapOnLastLine: boolean,
): boolean => {
  if (lineCount <= 0) {
    return false;
  }
  if (lineIndex >= lineCount - 1 && requireTapOnLastLine) {
    return false;
  }
  return true;
};

export const dialogueRequiresTapBeforeOsmd = (
  nextScene: EarTrainingTutorialScene | null | undefined,
): boolean => nextScene?.type === 'chord_osmd';
