/** Phrases / composite phrase: ignore held-key repeat note-ons until note-off (Web MIDI 対策). */

export const normalizePhrasePitchClass = (midiOrPc: number): number =>
  ((midiOrPc % 12) + 12) % 12;

/** Returns false when the same pitch class is already held (duplicate note-on). */
export const acceptPhraseNoteOn = (
  activeHeldPitchClasses: Set<number>,
  midiOrPc: number,
): boolean => {
  const pc = normalizePhrasePitchClass(midiOrPc);
  if (activeHeldPitchClasses.has(pc)) {
    return false;
  }
  activeHeldPitchClasses.add(pc);
  return true;
};

export const releasePhraseNote = (
  activeHeldPitchClasses: Set<number>,
  midiOrPc: number,
): void => {
  activeHeldPitchClasses.delete(normalizePhrasePitchClass(midiOrPc));
};

export const resetPhraseNoteGate = (activeHeldPitchClasses: Set<number>): void => {
  activeHeldPitchClasses.clear();
};

/** 評価後ゲート同期: 小節／フレーズ境界とミスでクリアし、progress では held 重複抑制を維持 */
type SurvivalPhraseEvaluationGateSyncResult =
  | 'progress'
  | 'measure-complete'
  | 'phrase-complete'
  | 'miss';

export const syncPhraseInputGateAfterEvaluation = (
  activeHeldPitchClasses: Set<number>,
  result: SurvivalPhraseEvaluationGateSyncResult,
  playedPitchClass: number,
): void => {
  if (
    result === 'miss'
    || result === 'measure-complete'
    || result === 'phrase-complete'
  ) {
    resetPhraseNoteGate(activeHeldPitchClasses);
    return;
  }
  // 正解で次ノートへ進んだら当該 PC を gate から外し、同一小節内の再入力（E…E 等）を許可
  releasePhraseNote(activeHeldPitchClasses, playedPitchClass);
};
