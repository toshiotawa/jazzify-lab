import type { DefensePhrase } from '@/game/defense/defenseTypes';

/** Collect all pitch MIDI values from a defense stage's phrases (stable keyboard-fit input). */
export const computeDefenseStageMidis = (phrases: readonly DefensePhrase[]): number[] => {
  const midis: number[] = [];
  for (let p = 0; p < phrases.length; p += 1) {
    const phrase = phrases[p];
    const chords = phrase.chords;
    for (let c = 0; c < chords.length; c += 1) {
      const notes = chords[c].notes;
      for (let n = 0; n < notes.length; n += 1) {
        midis.push(notes[n].pitchMidi);
      }
    }
  }
  return midis;
};
