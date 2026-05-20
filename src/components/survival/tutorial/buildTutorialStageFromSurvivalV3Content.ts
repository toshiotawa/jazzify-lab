import type { ChordDefinition } from '@/components/fantasy/FantasyGameEngine';
import type { DifficultyConfig } from '@/components/survival/SurvivalTypes';
import type {
  StageDefinition,
  SurvivalChordProgressionEntry,
} from '@/components/survival/SurvivalStageDefinitions';
import type { SurvivalPhraseChord, SurvivalPhraseDefinition } from '@/utils/survivalPhraseDefinitions';

import type {
  SurvivalTutorialV3ChordDef,
  SurvivalTutorialV3ContentRef,
  SurvivalTutorialV3ProgressionContent,
} from './survivalTutorialV3ScriptTypes';
import { survivalTutorialV3ContentIsPhraseBlock } from './survivalTutorialV3ScriptTypes';

const v3ChordDefToProgressionEntry = (c: SurvivalTutorialV3ChordDef): SurvivalChordProgressionEntry => ({
  name: c.name,
  voicing: [...c.voicing],
  voicingNames: c.voicingNames ? [...c.voicingNames] : undefined,
  keyFifths: c.keyFifths ?? 0,
  voicing_staves: c.voicing_staves ? [...c.voicing_staves] : undefined,
});

export function buildStageDefinitionFromSurvivalV3Content(
  block: SurvivalTutorialV3ContentRef,
): StageDefinition {
  if (survivalTutorialV3ContentIsPhraseBlock(block)) {
    return {
      stageNumber: 0,
      name: block.stage.name,
      nameEn: block.stage.nameEn,
      difficulty: 'easy',
      stageType: 'random',
      chordSuffix: '',
      chordDisplayName: block.stage.chordDisplayName,
      chordDisplayNameEn: block.stage.chordDisplayNameEn,
      rootPattern: null,
      rootPatternName: '',
      rootPatternNameEn: '',
      allowedChords: [],
      blockKey: 'lesson_practice',
      mapCategory: 'phrases',
      lessonOnly: block.stage.lessonOnly ?? true,
    };
  }

  const prog = block;
  const chordProgression = (prog.chordProgression ?? []).map(v3ChordDefToProgressionEntry);
  const allowedFromRandom = [
    ...(prog.randomChordPoolEasy ?? []).map((c) => c.name),
    ...(prog.randomChordPoolHard ?? []).map((c) => c.name),
  ];
  const uniqueAllowed = [...new Set(allowedFromRandom)];

  return {
    stageNumber: 0,
    name: prog.stage.name,
    nameEn: prog.stage.nameEn,
    difficulty: 'easy',
    stageType: prog.stage.stageType,
    chordSuffix: '',
    chordDisplayName: prog.stage.chordDisplayName,
    chordDisplayNameEn: prog.stage.chordDisplayNameEn,
    rootPattern: null,
    rootPatternName: '',
    rootPatternNameEn: '',
    allowedChords: prog.stage.stageType === 'random' ? uniqueAllowed : [],
    blockKey: 'lesson_practice',
    mapCategory: prog.stage.mapCategory ?? 'lesson',
    lessonOnly: prog.stage.lessonOnly ?? true,
    chordProgression: prog.stage.stageType === 'progression' ? chordProgression : undefined,
  };
}

export function buildDifficultyConfigForSurvivalV3(
  stage: StageDefinition,
  block: SurvivalTutorialV3ContentRef,
): DifficultyConfig {
  if (survivalTutorialV3ContentIsPhraseBlock(block)) {
    const u = block.phrases[0]?.audio_url?.trim();
    return {
      difficulty: 'easy',
      displayName: stage.name,
      description: stage.name,
      descriptionEn: stage.nameEn,
      allowedChords: [],
      enemySpawnRate: 3,
      enemySpawnCount: 2,
      enemyStatMultiplier: 0.5,
      expMultiplier: 0.5,
      itemDropRate: 0.1,
      bgmUrl: u && u.length > 0 ? u : null,
    };
  }

  const prog = block as SurvivalTutorialV3ProgressionContent;
  const pool =
    prog.stage.stageType === 'random'
      ? [...(prog.randomChordPoolEasy ?? []), ...(prog.randomChordPoolHard ?? [])]
      : prog.chordProgression ?? [];
  const ids = [...new Set(pool.map((c) => c.name))];

  return {
    difficulty: 'easy',
    displayName: stage.name,
    description: stage.name,
    descriptionEn: stage.nameEn,
    allowedChords: ids,
    enemySpawnRate: 3,
    enemySpawnCount: 2,
    enemyStatMultiplier: 0.5,
    expMultiplier: 0.5,
    itemDropRate: 0.1,
    bgmUrl: null,
  };
}

export function chordDefinitionFromV3ChordDef(
  def: SurvivalTutorialV3ChordDef,
  index: number,
  idPrefix: string,
): ChordDefinition {
  const sortedVoicing = [...def.voicing].sort((a, b) => a - b);
  const staffNames =
    def.voicingNames && def.voicingNames.length === def.voicing.length
      ? (() => {
          const zipped = def.voicing.map((m, i) => ({
            midi: m,
            nm: def.voicingNames![i] ?? '',
          }));
          zipped.sort((a, b) => a.midi - b.midi);
          return zipped.map((z) => z.nm);
        })()
      : undefined;

  let progressionStaffVoicingStaves: readonly (1 | 2)[] | undefined;
  if (def.voicing_staves && def.voicing_staves.length === def.voicing.length) {
    const zipped = def.voicing.map((m, i) => ({
      midi: m,
      staff: def.voicing_staves![i] === 1 ? (1 as const) : (2 as const),
    }));
    zipped.sort((a, b) => a.midi - b.midi);
    progressionStaffVoicingStaves = zipped.map((z) => z.staff);
  }

  const letters = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  return {
    id: `${idPrefix}:${index}:${def.name}`,
    root: def.name,
    quality: 'progression',
    notes: sortedVoicing,
    noteNames: sortedVoicing.map((m) => {
      const pc = ((m % 12) + 12) % 12;
      return letters[pc] ?? 'C';
    }),
    displayName: def.name,
    progressionStaffVoicingNames: staffNames,
    progressionStaffVoicingStaves,
    progressionStaffKeyFifths: def.keyFifths ?? 0,
  };
}

export function pickRandomTutorialChords(
  block: SurvivalTutorialV3ProgressionContent,
  hard: boolean,
  count: number,
): ChordDefinition[] {
  const pool = hard ? block.randomChordPoolHard ?? [] : block.randomChordPoolEasy ?? [];
  if (pool.length === 0) {
    return [];
  }
  const picks: ChordDefinition[] = [];
  for (let i = 0; i < count; i += 1) {
    const idx = Math.floor(Math.random() * pool.length);
    const pick = pool[idx];
    if (pick) {
      picks.push(chordDefinitionFromV3ChordDef(pick, i, 'tutorial-rand'));
    }
  }
  return picks;
}

export function buildTutorialPhraseDefinitionFromV3Block(
  block: SurvivalTutorialV3ContentRef,
): SurvivalPhraseDefinition | null {
  if (!survivalTutorialV3ContentIsPhraseBlock(block)) {
    return null;
  }
  const ph = block.phrases[0];
  if (!ph) {
    return null;
  }

  const chords: SurvivalPhraseChord[] = ph.chords.map((ch, chordIndex): SurvivalPhraseChord => {
    const names = ch.voicingNames ?? ch.voicing.map((m) => `M${m}`);
    const notes = ch.voicing.map((pitchMidi, noteIndex) => {
      const nm = names[noteIndex] ?? `N${noteIndex}`;
      const staffNum = ch.voicing_staves?.[noteIndex] === 1 ? 1 : 2;
      return {
        orderIndex: noteIndex,
        pitchMidi,
        pitchClass: ((pitchMidi % 12) + 12) % 12,
        noteName: nm,
        staff: staffNum as 1 | 2,
      };
    });
    return {
      id: `tutorial-phrase:${chordIndex}:${ch.name}`,
      orderIndex: chordIndex,
      chordName: ch.name,
      measureNumber: ch.measure_number,
      notes,
    };
  });

  return {
    id: 'tutorial-v3-inline-phrase',
    mapCategory: 'phrases',
    stageNumber: 0,
    title: ph.title ?? block.stage.name,
    bgmUrl: ph.audio_url?.trim() || null,
    keyFifths: ph.key_fifths ?? 0,
    chords,
  };
}
