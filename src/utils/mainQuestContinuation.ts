/** 一本道コース（メインクエスト / ソフトランディング）のクエスト詳細 entry モーダル表示条件 */
export function shouldShowMainQuestTaskEntryPrompt(input: {
  isSequentialCourse: boolean;
  isMainQuestCourse: boolean;
  hasAutoStart: boolean;
  hasJustCleared: boolean;
}): boolean {
  if (input.isMainQuestCourse) {
    return false;
  }
  if (!input.hasAutoStart || input.hasJustCleared) {
    return false;
  }
  return input.isSequentialCourse;
}

/** メインクエストでは課題クリア後の次課題モーダルを出さない */
export function shouldShowMainQuestTaskAfterClearPrompt(input: {
  isMainQuestCourse: boolean;
}): boolean {
  return !input.isMainQuestCourse;
}
