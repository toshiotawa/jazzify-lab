/** Chapter 1 メインクエストのクエスト詳細 entry モーダル表示条件 */
export function shouldShowMainQuestTaskEntryPrompt(input: {
  isMainQuest: boolean;
  blockNumber: number | null | undefined;
  hasAutoStart: boolean;
  hasJustCleared: boolean;
}): boolean {
  if (!input.hasAutoStart || input.hasJustCleared) {
    return false;
  }
  if (!input.isMainQuest) {
    return false;
  }
  return (input.blockNumber ?? 1) === 1;
}
