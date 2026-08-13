import type { EarTrainingPhrase } from '@/types';
import {
  buildPlayableMeasureLabels,
  buildPlayableMeasures,
  buildDisabledMeasures,
  chordOsmdBeatToTargetTimeSec,
  collectChordOsmdMusicXmlAttacks,
  collectChordOsmdStraightBeatKeys,
  forEachChordOsmdNoteCluster,
  type ChordOsmdMusicXmlAttack,
  type ChordOsmdRhythmTarget,
  type ChordOsmdSwingScope,
  midiCountArray,
  parseMusicXmlNoteElementToMidi,
  musicXmlNoteHasTieStop,
} from '@/utils/earTrainingChordOsmd';
import { buildPrecisionNotesFromMidi } from '@/utils/earTrainingPrecisionMidi';
import {
  isPrecisionShortNoteDuration,
  type PrecisionNote,
  trimOverlappingSamePitchNotes,
} from '@/utils/earTrainingPrecisionNotes';

/** MIDI と MusicXML クラスタの greedy マッチ許容（秒） */
export const CANONICAL_MIDI_XML_MATCH_WINDOW_SEC = 0.1;

const SAME_TARGET_EPSILON_SEC = 0.0005;

export type EarTrainingTimingSource = 'midi' | 'musicxml' | 'midi_merged_xml';

export interface CanonicalPhraseNote {
  midi: number;
  startSec: number;
  durationSec: number;
  measureNumber: number;
  clusterId: string;
  source: EarTrainingTimingSource;
  spelling?: string;
  beatStartInMeasure: number;
  attackOrderIndex: number;
  partIndex?: number;
  staff?: 1 | 2;
}

export interface BuildCanonicalPhraseNotesParams {
  musicXmlText?: string | null;
  midiData?: Uint8Array | null;
  /** SMF 未ロード時のフォールバック（OSMD 旧経路互換） */
  midiNotes?: readonly { midi: number; startSec: number; durationSec?: number }[] | null;
  bpm: number;
  beatsPerMeasure: number;
  isSwing?: boolean;
  transposeOffset?: number;
  audioAnchorMs?: number | null;
}

export interface CanonicalPhraseBuildResult {
  notes: CanonicalPhraseNote[];
  timingSource: EarTrainingTimingSource;
  attacks: readonly ChordOsmdMusicXmlAttack[];
}

interface ResolvedAttackTiming {
  attack: ChordOsmdMusicXmlAttack;
  orderIndex: number;
  xmlStartSec: number;
  resolvedStartSec: number;
  source: EarTrainingTimingSource;
  noteDurations: Map<number, number>;
  matchedMidiByPitch: Map<number, { startSec: number; durationSec: number }>;
}

const clusterIdForAttack = (attack: ChordOsmdMusicXmlAttack, orderIndex: number): string => (
  `attack:${attack.measureNumber}:${attack.beatStartInMeasure.toFixed(4)}:${orderIndex}`
);

const attackSwingScope = (attack: ChordOsmdMusicXmlAttack): ChordOsmdSwingScope | undefined => (
  attack.partIndex === undefined
    ? undefined
    : { partIndex: attack.partIndex, staff: attack.staff ?? 1 }
);

const resolveAttackXmlStartSec = (
  attack: ChordOsmdMusicXmlAttack,
  bpm: number,
  beatsPerMeasure: number,
  isSwing: boolean,
  straightBeatKeys?: ReadonlySet<string>,
): number => (
  chordOsmdBeatToTargetTimeSec(
    attack.measureNumber,
    attack.beatStartInMeasure,
    bpm,
    beatsPerMeasure,
    isSwing,
    straightBeatKeys,
    attackSwingScope(attack),
  )
);

const durationSecFromDivisions = (
  durationDivisions: number,
  divisions: number,
  bpm: number,
): number => {
  const beatDurationSec = 60 / Math.max(1, bpm);
  const quarters = durationDivisions / Math.max(1, divisions);
  return Math.max(0.05, quarters * beatDurationSec);
};

const buildNoteDurationsFromMusicXml = (
  musicXmlText: string,
  bpm: number,
  beatsPerMeasure: number,
  isSwing: boolean,
  straightBeatKeys?: ReadonlySet<string>,
): Map<string, Map<number, number>> => {
  const byCluster = new Map<string, Map<number, number>>();
  forEachChordOsmdNoteCluster(musicXmlText, ({
    measureNumber,
    beatStartInMeasure,
    clusterNotes,
    timing,
    durationDivisions,
    partIndex,
    staff,
  }) => {
    const swingScope: ChordOsmdSwingScope = { partIndex, staff };
    let startSec: number;
    let durationSec: number;
    if (!isSwing) {
      startSec = chordOsmdBeatToTargetTimeSec(
        measureNumber,
        beatStartInMeasure,
        bpm,
        beatsPerMeasure,
      );
      durationSec = durationSecFromDivisions(durationDivisions, timing.divisions, bpm);
    } else {
      const quarters = durationDivisions / Math.max(1, timing.divisions);
      startSec = chordOsmdBeatToTargetTimeSec(
        measureNumber,
        beatStartInMeasure,
        bpm,
        beatsPerMeasure,
        true,
        straightBeatKeys,
        swingScope,
      );
      const endSec = chordOsmdBeatToTargetTimeSec(
        measureNumber,
        beatStartInMeasure + quarters,
        bpm,
        beatsPerMeasure,
        true,
        straightBeatKeys,
        swingScope,
      );
      durationSec = Math.max(0.05, endSec - startSec);
    }
    const clusterKey = `${measureNumber}:${beatStartInMeasure.toFixed(4)}:${partIndex}:${staff}`;
    let midiDurations = byCluster.get(clusterKey);
    if (!midiDurations) {
      midiDurations = new Map();
      byCluster.set(clusterKey, midiDurations);
    }
    for (const noteEl of clusterNotes) {
      if (musicXmlNoteHasTieStop(noteEl)) {
        continue;
      }
      const midi = parseMusicXmlNoteElementToMidi(noteEl, timing.keyFifths);
      if (midi === null) {
        continue;
      }
      midiDurations.set(midi, durationSec);
    }
  });
  return byCluster;
};

const findClusterDurations = (
  attack: ChordOsmdMusicXmlAttack,
  durationMaps: Map<string, Map<number, number>>,
): Map<number, number> => {
  const partIndex = attack.partIndex ?? 0;
  const staff = attack.staff ?? 1;
  const clusterKey = `${attack.measureNumber}:${attack.beatStartInMeasure.toFixed(4)}:${partIndex}:${staff}`;
  return durationMaps.get(clusterKey) ?? new Map();
};

const resolveAttackTimings = (
  attacks: readonly ChordOsmdMusicXmlAttack[],
  midiNotes: readonly { midi: number; startSec: number; durationSec: number }[],
  bpm: number,
  beatsPerMeasure: number,
  isSwing: boolean,
  straightBeatKeys?: ReadonlySet<string>,
  durationMaps?: Map<string, Map<number, number>>,
): { resolved: ResolvedAttackTiming[]; unusedMidi: typeof midiNotes } => {
  const usedMidiIndices = new Set<number>();
  const resolved: ResolvedAttackTiming[] = [];

  attacks.forEach((attack, orderIndex) => {
    const xmlStartSec = resolveAttackXmlStartSec(
      attack,
      bpm,
      beatsPerMeasure,
      isSwing,
      straightBeatKeys,
    );
    const matchedStarts: number[] = [];
    const matchedMidiByPitch = new Map<number, { startSec: number; durationSec: number }>();
    attack.midis.forEach((targetMidi) => {
      let bestIndex: number | null = null;
      let bestDelta = Number.POSITIVE_INFINITY;
      midiNotes.forEach((note, index) => {
        if (usedMidiIndices.has(index)) {
          return;
        }
        if (note.midi !== targetMidi) {
          return;
        }
        const delta = Math.abs(note.startSec - xmlStartSec);
        if (delta <= CANONICAL_MIDI_XML_MATCH_WINDOW_SEC && delta < bestDelta) {
          bestDelta = delta;
          bestIndex = index;
        }
      });
      if (bestIndex !== null) {
        usedMidiIndices.add(bestIndex);
        const matched = midiNotes[bestIndex];
        matchedStarts.push(matched.startSec);
        matchedMidiByPitch.set(targetMidi, matched);
      }
    });

    const noteDurations = durationMaps
      ? findClusterDurations(attack, durationMaps)
      : new Map<number, number>();
    const defaultDuration = (60 / Math.max(1, bpm)) * 0.5;

    let resolvedStartSec = xmlStartSec;
    let source: EarTrainingTimingSource = 'musicxml';
    if (matchedStarts.length > 0) {
      resolvedStartSec = Math.min(...matchedStarts);
      source = matchedStarts.length === attack.midis.length ? 'midi' : 'midi_merged_xml';
    }

    resolved.push({
      attack,
      orderIndex,
      xmlStartSec,
      resolvedStartSec,
      source,
      noteDurations: noteDurations.size > 0 ? noteDurations : new Map(attack.midis.map(m => [m, defaultDuration])),
      matchedMidiByPitch,
    });
  });

  const unusedMidi = midiNotes.filter((_, index) => !usedMidiIndices.has(index));
  return { resolved, unusedMidi };
};

const resolvedAttacksToCanonicalNotes = (
  resolved: readonly ResolvedAttackTiming[],
  transposeOffset: number,
): CanonicalPhraseNote[] => {
  const notes: CanonicalPhraseNote[] = [];

  for (const item of resolved) {
    const clusterId = clusterIdForAttack(item.attack, item.orderIndex);
    item.attack.midis.forEach((midi, index) => {
      const transposed = midi + transposeOffset;
      const spelling = item.attack.spellings?.[index];
      const matched = item.matchedMidiByPitch.get(midi);
      const durationSec = matched?.durationSec
        ?? item.noteDurations.get(midi)
        ?? (60 / 120) * 0.5;
      notes.push({
        midi: transposed,
        startSec: item.resolvedStartSec,
        durationSec,
        measureNumber: item.attack.measureNumber,
        clusterId,
        source: item.source,
        beatStartInMeasure: item.attack.beatStartInMeasure,
        attackOrderIndex: item.orderIndex,
        ...(spelling ? { spelling } : {}),
        ...(item.attack.partIndex !== undefined ? { partIndex: item.attack.partIndex } : {}),
        ...(item.attack.staff !== undefined ? { staff: item.attack.staff } : {}),
      });
    });
  }
  return notes;
};

const unusedMidiToCanonicalNotes = (
  unusedMidi: readonly { midi: number; startSec: number; durationSec: number }[],
  transposeOffset: number,
  startOrderIndex: number,
): CanonicalPhraseNote[] => {
  const clusters = new Map<number, { midi: number; startSec: number; durationSec: number }[]>();
  for (const note of unusedMidi) {
    const tickKey = Math.round(note.startSec / SAME_TARGET_EPSILON_SEC);
    const bucket = clusters.get(tickKey) ?? [];
    bucket.push(note);
    clusters.set(tickKey, bucket);
  }

  const notes: CanonicalPhraseNote[] = [];
  let orderIndex = startOrderIndex;
  const sortedKeys = [...clusters.keys()].sort((a, b) => a - b);
  for (const key of sortedKeys) {
    const cluster = clusters.get(key);
    if (!cluster) {
      continue;
    }
    const startSec = cluster[0]?.startSec ?? 0;
    const clusterId = `midi:${startSec.toFixed(4)}:${orderIndex}`;
    cluster.forEach((note) => {
      notes.push({
        midi: note.midi + transposeOffset,
        startSec,
        durationSec: note.durationSec,
        measureNumber: 1,
        clusterId,
        source: 'midi',
        beatStartInMeasure: 1,
        attackOrderIndex: orderIndex,
      });
    });
    orderIndex += 1;
  }
  return notes;
};

const applyAudioAnchor = (
  notes: CanonicalPhraseNote[],
  audioAnchorMs?: number | null,
): CanonicalPhraseNote[] => {
  const anchorSec = (audioAnchorMs ?? 0) / 1000;
  if (Math.abs(anchorSec) < 1e-9) {
    return notes;
  }
  return notes.map(note => ({
    ...note,
    startSec: note.startSec + anchorSec,
  }));
};

const deriveTimingSource = (notes: readonly CanonicalPhraseNote[]): EarTrainingTimingSource => {
  const sources = new Set(notes.map(note => note.source));
  if (sources.size === 1) {
    const only = sources.values().next().value;
    if (only === 'midi' || only === 'musicxml' || only === 'midi_merged_xml') {
      return only;
    }
  }
  if (sources.has('midi_merged_xml') || (sources.has('midi') && sources.has('musicxml'))) {
    return 'midi_merged_xml';
  }
  if (sources.has('midi')) {
    return 'midi';
  }
  return 'musicxml';
};

/** OSMD / 精密で共有する正本ノーツ列を1回だけ生成する。 */
export const buildCanonicalPhraseNotes = (
  params: BuildCanonicalPhraseNotesParams,
): CanonicalPhraseBuildResult => {
  const {
    musicXmlText,
    midiData,
    midiNotes: midiNotesParam,
    bpm,
    beatsPerMeasure,
    isSwing = false,
    transposeOffset = 0,
    audioAnchorMs,
  } = params;

  const xmlText = musicXmlText?.trim() ?? '';
  const attacks = xmlText ? collectChordOsmdMusicXmlAttacks(xmlText) : [];
  const straightBeatKeys = isSwing && xmlText
    ? collectChordOsmdStraightBeatKeys(xmlText)
    : undefined;

  let midiNotes: Array<{ midi: number; startSec: number; durationSec: number }> = [];
  if (midiData && midiData.length > 0) {
    const built = buildPrecisionNotesFromMidi(midiData, bpm, 0);
    midiNotes = built.notes.map(note => ({
      midi: note.midi,
      startSec: note.startSec,
      durationSec: note.durationSec,
    }));
  } else if (midiNotesParam && midiNotesParam.length > 0) {
    const defaultDuration = (60 / Math.max(1, bpm)) * 0.5;
    midiNotes = midiNotesParam.map(note => ({
      midi: note.midi,
      startSec: note.startSec,
      durationSec: note.durationSec ?? defaultDuration,
    }));
  }

  let notes: CanonicalPhraseNote[] = [];

  if (attacks.length > 0) {
    const durationMaps = xmlText
      ? buildNoteDurationsFromMusicXml(xmlText, bpm, beatsPerMeasure, isSwing, straightBeatKeys)
      : undefined;
    const { resolved, unusedMidi } = resolveAttackTimings(
      attacks,
      midiNotes,
      bpm,
      beatsPerMeasure,
      isSwing,
      straightBeatKeys,
      durationMaps,
    );
    notes = [
      ...resolvedAttacksToCanonicalNotes(resolved, transposeOffset),
      ...unusedMidiToCanonicalNotes(unusedMidi, transposeOffset, resolved.length),
    ];
  } else if (midiNotes.length > 0) {
    notes = unusedMidiToCanonicalNotes(midiNotes, transposeOffset, 0);
  }

  notes.sort((a, b) => {
    if (Math.abs(a.startSec - b.startSec) > SAME_TARGET_EPSILON_SEC) {
      return a.startSec - b.startSec;
    }
    if (a.attackOrderIndex !== b.attackOrderIndex) {
      return a.attackOrderIndex - b.attackOrderIndex;
    }
    if (a.midi !== b.midi) {
      return a.midi - b.midi;
    }
    return a.clusterId.localeCompare(b.clusterId);
  });

  notes = applyAudioAnchor(notes, audioAnchorMs);

  return {
    notes,
    timingSource: deriveTimingSource(notes),
    attacks,
  };
};

export const canonicalNotesToPrecisionNotes = (
  notes: readonly CanonicalPhraseNote[],
  bpm: number,
): PrecisionNote[] => {
  const precisionNotes: PrecisionNote[] = notes.map((note, index) => ({
    id: `c:${note.clusterId}:${note.midi}:${index}`,
    midi: note.midi,
    startSec: note.startSec,
    durationSec: note.durationSec,
    isBlackKey: [1, 3, 6, 8, 10].includes(((note.midi % 12) + 12) % 12),
    measureNumber: note.measureNumber,
    isShortNote: isPrecisionShortNoteDuration(note.durationSec, bpm),
  }));
  return trimOverlappingSamePitchNotes(precisionNotes, bpm);
};

const attackMidiCounts = (midis: readonly number[]): Map<number, number> => {
  const counts = new Map<number, number>();
  for (const midi of midis) {
    counts.set(midi, (counts.get(midi) ?? 0) + 1);
  }
  return counts;
};

const uniqueSpellings = (
  midis: readonly number[],
  spellings?: readonly string[],
): string[] | undefined => {
  if (!spellings || spellings.length === 0) {
    return undefined;
  }
  const seen = new Set<number>();
  const result: string[] = [];
  midis.forEach((midi, index) => {
    if (seen.has(midi)) {
      return;
    }
    seen.add(midi);
    const spelling = spellings[index];
    if (spelling) {
      result.push(spelling);
    }
  });
  return result.length > 0 ? result : undefined;
};

/** 正本ノーツから OSMD リズムターゲットを生成（fromScore 相当）。 */
export const canonicalNotesToOsmdRhythmTargets = (
  notes: readonly CanonicalPhraseNote[],
  phrase: EarTrainingPhrase | undefined,
  bpm: number,
  beatsPerMeasure: number,
  attacks: readonly ChordOsmdMusicXmlAttack[],
  transposeOffset = 0,
): ChordOsmdRhythmTarget[] => {
  if (!phrase || notes.length === 0) {
    return [];
  }

  const chords = phrase.chords ?? [];
  const playableMeasures = buildPlayableMeasures(chords);
  const disabledMeasures = buildDisabledMeasures(chords);
  const measureLabels = buildPlayableMeasureLabels(chords, transposeOffset);
  const useAllScoreMeasures = playableMeasures.size === 0 && disabledMeasures.size === 0;

  const notesByCluster = new Map<string, CanonicalPhraseNote[]>();
  for (const note of notes) {
    const bucket = notesByCluster.get(note.clusterId) ?? [];
    bucket.push(note);
    notesByCluster.set(note.clusterId, bucket);
  }

  const attackByOrder = new Map<number, ChordOsmdMusicXmlAttack>();
  attacks.forEach((attack, index) => {
    attackByOrder.set(index, attack);
  });

  const clusterEntries = [...notesByCluster.entries()].sort((a, b) => {
    const aStart = a[1][0]?.startSec ?? 0;
    const bStart = b[1][0]?.startSec ?? 0;
    if (Math.abs(aStart - bStart) > SAME_TARGET_EPSILON_SEC) {
      return aStart - bStart;
    }
    const aOrder = a[1][0]?.attackOrderIndex ?? 0;
    const bOrder = b[1][0]?.attackOrderIndex ?? 0;
    return aOrder - bOrder;
  });

  const targets: ChordOsmdRhythmTarget[] = [];
  let orderIndex = 0;
  for (const [clusterId, clusterNotes] of clusterEntries) {
    const first = clusterNotes[0];
    if (!first) {
      continue;
    }
    const attack = attackByOrder.get(first.attackOrderIndex);
    const measureNumber = attack?.measureNumber ?? first.measureNumber;
    if (!useAllScoreMeasures && playableMeasures.size > 0 && !playableMeasures.has(measureNumber)) {
      continue;
    }
    if (!useAllScoreMeasures && disabledMeasures.has(measureNumber)) {
      continue;
    }

    const midis = clusterNotes.map(note => note.midi);
    const spellings = attack?.spellings;
    const noteSpellings = uniqueSpellings(midis, spellings);

    targets.push({
      id: clusterId.includes('attack:')
        ? `${clusterId}`
        : clusterId,
      label: measureLabels.get(measureNumber) ?? '—',
      orderIndex,
      targetTimeSec: first.startSec,
      measureNumber,
      midiCounts: midiCountArray(attackMidiCounts(midis)),
      ...(noteSpellings ? { noteSpellings } : {}),
    });
    orderIndex += 1;
  }

  return targets;
};
