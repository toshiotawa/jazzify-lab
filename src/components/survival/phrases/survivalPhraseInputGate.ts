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
