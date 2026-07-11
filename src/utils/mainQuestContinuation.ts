/** メインクエストのクエスト詳細 entry モーダル表示条件 */
export function shouldShowMainQuestTaskEntryPrompt(input: {
  isMainQuest: boolean;
  hasAutoStart: boolean;
  hasJustCleared: boolean;
}): boolean {
  if (!input.hasAutoStart || input.hasJustCleared) {
    return false;
  }
  return input.isMainQuest;
}
