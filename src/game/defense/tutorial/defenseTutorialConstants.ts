/** Defense input-setup tutorial: written do-re-mi at BPM 60, 4/4. */
export const DEFENSE_TUTORIAL_KEY = 'input-setup-v1' as const;

export const DEFENSE_TUTORIAL_BPM = 60;
export const DEFENSE_TUTORIAL_BEATS_PER_BAR = 4;
export const DEFENSE_TUTORIAL_KEY_FIFTHS = 0;

/** Written pitch classes for do-re-mi (C, D, E). */
export const DEFENSE_TUTORIAL_WRITTEN_PITCH_CLASSES = [0, 2, 4] as const;

/** Concert MIDI target for the first note (C4). */
export const DEFENSE_TUTORIAL_TARGET_CONCERT_MIDI = 60;

/** Written do-re-mi octave on bass clef (C3/D3/E3 in C). */
export const DEFENSE_TUTORIAL_BASS_WRITTEN_OCTAVE = 3;

/** Beat duration at BPM 60 (seconds). */
export const DEFENSE_TUTORIAL_BEAT_SEC = 60 / DEFENSE_TUTORIAL_BPM;

/** One bar loop: 4 beats = 4 s */
export const DEFENSE_TUTORIAL_LOOP_SEC = DEFENSE_TUTORIAL_BEAT_SEC * DEFENSE_TUTORIAL_BEATS_PER_BAR;

/** Sample onsets within the loop (seconds). */
export const DEFENSE_TUTORIAL_NOTE_ONSETS_SEC = [0, 1, 2] as const;

/** Quarter-note length with a short gap before the next beat. */
export const DEFENSE_TUTORIAL_NOTE_DURATION_SEC = 0.8;

export const DEFENSE_TUTORIAL_SOLFEGE_LABELS = ['ド', 'レ', 'ミ'] as const;

export type DefenseTutorialWrittenOctave = 3 | 4 | 5 | 6;
