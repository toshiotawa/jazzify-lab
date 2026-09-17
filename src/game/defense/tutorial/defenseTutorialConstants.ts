/** Defense input-setup tutorial: fixed concert C–D–E at BPM 100, 4/4. */
export const DEFENSE_TUTORIAL_KEY = 'input-setup-v1' as const;

export const DEFENSE_TUTORIAL_BPM = 100;
export const DEFENSE_TUTORIAL_BEATS_PER_BAR = 4;
export const DEFENSE_TUTORIAL_KEY_FIFTHS = 0;

/** Concert pitch classes: C, D, E */
export const DEFENSE_TUTORIAL_TARGET_PITCH_CLASSES = [0, 2, 4] as const;

/** Beat duration at BPM 100 (seconds). */
export const DEFENSE_TUTORIAL_BEAT_SEC = 60 / DEFENSE_TUTORIAL_BPM;

/** One bar loop: 4 beats = 2.4 s */
export const DEFENSE_TUTORIAL_LOOP_SEC = DEFENSE_TUTORIAL_BEAT_SEC * DEFENSE_TUTORIAL_BEATS_PER_BAR;

/** Sample onsets within the loop (seconds). */
export const DEFENSE_TUTORIAL_NOTE_ONSETS_SEC = [0, 0.6, 1.2] as const;

/** Short note length (~0.5 s) with gap before next beat. */
export const DEFENSE_TUTORIAL_NOTE_DURATION_SEC = 0.5;

export type DefenseTutorialConcertOctave = 3 | 4 | 5;
