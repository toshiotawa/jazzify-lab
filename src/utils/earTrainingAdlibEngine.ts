import type {
  EarTrainingPhrase,
  EarTrainingPhraseChord,
} from '@/types';
import type { EarTrainingHarmonyHudRow } from '@/utils/earTrainingChordTimeline';
import type { ChordVoicingStaffGroup } from '@/components/earTraining/ChordVoicingStaff';
import {
  getVoicingPitchClasses,
} from '@/utils/earTrainingChordVoicingEngine';
import { computeVoicingKeyboardHints } from '@/utils/earTrainingChordVoicingHints';
import {
  getHarmonyRowForChordId,
} from '@/utils/earTrainingChordTimeline';
import {
  midiToPitchClass,
  type EarTrainingDamageConfig,
} from '@/utils/earTrainingEngine';
import { parseVoicingNoteName } from '@/utils/voicingMusicXml';

/** 同一 harmony 群ウィンドウ内の火の玉上限 */
export const ADLIB_MAX_FIREBALLS_PER_HARMONY = 16;

export interface EarTrainingAdlibWindowState {
  readonly harmonyRepresentativeId: string | null;
  /** ウィンドウ内で一度でも正解した pitch class（譜面・鍵盤の緑表示用） */
  readonly pressedPitchClasses: ReadonlySet<number>;
  /** ウィンドウ内で発射した火の玉回数（同音連打含む） */
  readonly fireCount: number;
}

export type EarTrainingAdlibNoteResultKind = 'correct' | 'miss';

export interface EarTrainingAdlibNoteResult {
  readonly kind: EarTrainingAdlibNoteResultKind;
  readonly nextWindow: EarTrainingAdlibWindowState;
  readonly shouldFire: boolean;
  readonly enemyDamage: number;
  readonly playerDamage: number;
  readonly hitPitchClass: number | null;
}

export const createAdlibWindowState = (
  harmonyRepresentativeId: string | null = null,
): EarTrainingAdlibWindowState => ({
  harmonyRepresentativeId,
  pressedPitchClasses: new Set<number>(),
  fireCount: 0,
});

export const applyHarmonyWindowTransition = (
  current: EarTrainingAdlibWindowState,
  harmonyRepresentativeId: string | null,
): EarTrainingAdlibWindowState => {
  if (harmonyRepresentativeId === current.harmonyRepresentativeId) {
    return current;
  }
  return createAdlibWindowState(harmonyRepresentativeId);
};

export const getAdlibHarmonyRowForActiveChord = (
  phrase: EarTrainingPhrase | undefined,
  activeChord: EarTrainingPhraseChord | null,
): EarTrainingHarmonyHudRow | null => {
  if (!activeChord) {
    return null;
  }
  return getHarmonyRowForChordId(phrase, activeChord.id);
};

export const getHarmonyUnionPitchClasses = (
  phrase: EarTrainingPhrase | undefined,
  harmonyRow: EarTrainingHarmonyHudRow,
): ReadonlySet<number> => {
  const pcs = new Set<number>();
  const chords = phrase?.chords ?? [];
  for (const chordId of harmonyRow.voicingIds) {
    const chord = chords.find(c => c.id === chordId);
    if (!chord) {
      continue;
    }
    getVoicingPitchClasses(chord).forEach(pc => pcs.add(pc));
  }
  return pcs;
};

const collectHarmonyVoicingNoteNames = (
  phrase: EarTrainingPhrase | undefined,
  harmonyRow: EarTrainingHarmonyHudRow,
): readonly string[] => {
  const chords = (phrase?.chords ?? [])
    .filter(c => harmonyRow.voicingIds.includes(c.id))
    .slice()
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  const names: string[] = [];
  for (const chord of chords) {
    for (const noteName of chord.voicing ?? []) {
      const trimmed = noteName.trim();
      if (trimmed) {
        names.push(trimmed);
      }
    }
  }
  return names;
};

export const computeAdlibKeyboardHints = (
  phrase: EarTrainingPhrase | undefined,
  harmonyRow: EarTrainingHarmonyHudRow,
  pressedPitchClasses: ReadonlySet<number>,
) => computeVoicingKeyboardHints(
  collectHarmonyVoicingNoteNames(phrase, harmonyRow),
  pressedPitchClasses,
);

export const buildAdlibStaffVoicingGroups = (
  phrase: EarTrainingPhrase | undefined,
  harmonyRow: EarTrainingHarmonyHudRow,
): readonly ChordVoicingStaffGroup[] => {
  const chords = (phrase?.chords ?? [])
    .filter(c => harmonyRow.voicingIds.includes(c.id))
    .slice()
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  const groups: ChordVoicingStaffGroup[] = [];
  let slotIndex = 0;
  for (const chord of chords) {
    const voicing = chord.voicing ?? [];
    const staves = chord.voicing_staves ?? [];
    voicing.forEach((noteName, voicingIndex) => {
      const staffRaw = staves[voicingIndex];
      const staff: 1 | 2 = staffRaw === 2 ? 2 : 1;
      groups.push({
        id: `adlib-${chord.id}-n${voicingIndex}`,
        chordName: slotIndex === 0 ? harmonyRow.chordName : '',
        voicing: [noteName],
        voicingStaves: [staff],
        measureOffset: 0,
        isActive: false,
      });
      slotIndex += 1;
    });
  }
  if (groups.length === 0) {
    return [{
      id: `adlib-${harmonyRow.representativeId}-rest`,
      chordName: harmonyRow.chordName,
      voicing: [],
      voicingStaves: [],
      measureOffset: 0,
      isActive: false,
      isRest: true,
    }];
  }
  return groups;
};

export const buildAdlibStaffCorrectPitchClassesByGroupId = (
  groups: readonly ChordVoicingStaffGroup[],
  pressedPitchClasses: ReadonlySet<number>,
): ReadonlyMap<string, readonly number[]> => {
  const map = new Map<string, readonly number[]>();
  groups.forEach(group => {
    const noteName = group.voicing[0];
    if (!noteName) {
      return;
    }
    try {
      const pc = midiToPitchClass(parseVoicingNoteName(noteName.trim()).midi);
      if (pressedPitchClasses.has(pc)) {
        map.set(group.id, [pc]);
      }
    } catch {
      // ignore invalid note names
    }
  });
  return map;
};

export const handleAdlibNoteOn = (
  window: EarTrainingAdlibWindowState,
  unionPitchClasses: ReadonlySet<number>,
  midiNote: number,
  damage: EarTrainingDamageConfig,
): EarTrainingAdlibNoteResult => {
  const inputPc = midiToPitchClass(midiNote);

  if (!unionPitchClasses.has(inputPc)) {
    return {
      kind: 'miss',
      nextWindow: window,
      shouldFire: false,
      enemyDamage: 0,
      playerDamage: damage.miss,
      hitPitchClass: null,
    };
  }

  const shouldFire = window.fireCount < ADLIB_MAX_FIREBALLS_PER_HARMONY;
  const nextPressed = new Set(window.pressedPitchClasses);
  nextPressed.add(inputPc);

  return {
    kind: 'correct',
    nextWindow: {
      harmonyRepresentativeId: window.harmonyRepresentativeId,
      pressedPitchClasses: nextPressed,
      fireCount: shouldFire ? window.fireCount + 1 : window.fireCount,
    },
    shouldFire,
    enemyDamage: shouldFire ? damage.perCorrectNote : 0,
    playerDamage: 0,
    hitPitchClass: inputPc,
  };
};
