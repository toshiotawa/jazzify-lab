/**
 * Survival Tutorial V4 — manifest 組み立て。
 *
 * MusicXML(素材) + MIDI(テンポ) + 制御設定(sceneType/bgm) を合成し、
 * シーン境界・MIDI 秒・拍同期セリフ・塊(chunk) を含む中間 JSON(manifest) を生成する。
 *
 * 重要方針(計画準拠):
 * - シーン境界は MusicXML のリハーサルマークで決定。MIDI からは読まない。
 * - 同期は秒直書きではなく measure/beat → tick → sec へ変換。
 * - 塊は音符 onset 単位。コード名は harmony 区間の先頭塊にのみ付与。
 * - staff 3 は再生専用(bass)。描画・判定対象外。
 */
import type {
  SurvivalTutorialV3DialogueSpeaker,
  SurvivalTutorialV3UiOverrides,
} from '../survivalTutorialV3ScriptTypes';
import type {
  SurvivalTutorialV4Assets,
  SurvivalTutorialV4Chunk,
  SurvivalTutorialV4Line,
  SurvivalTutorialV4Manifest,
  SurvivalTutorialV4MidiRange,
  SurvivalTutorialV4Position,
  SurvivalTutorialV4Scene,
  SurvivalTutorialV4SceneType,
} from './survivalTutorialV4Types';
import {
  parseSurvivalTutorialV4MusicXml,
  type SurvivalTutorialV4ParsedNote,
  type SurvivalTutorialV4ParsedScore,
} from './parseSurvivalTutorialV4MusicXml';
import {
  buildRollChunkFromSequence,
  detectVoicingRollSequences,
  groupNotesByOnset,
  type SurvivalTutorialOnsetGroup,
} from './detectSurvivalTutorialRollChunks';
import {
  createConstantTempoMap,
  midiTickToSeconds,
  parseSurvivalTutorialV4MidiTempoMap,
  quarterBeatsToTick,
  type SurvivalTutorialV4MidiTempoMap,
} from './parseSurvivalTutorialV4Midi';

export interface SurvivalTutorialV4SceneControl {
  /** リハーサルマークのテキストと一致させる。 */
  readonly id: string;
  readonly sceneType: SurvivalTutorialV4SceneType;
  readonly bgmUrl?: string;
  /** 既定: demo は true(時間ありのため先頭へ)、dialogue/play は false。 */
  readonly bgmResetOnEnter?: boolean;
  readonly keyFifths?: number;
}

export interface SurvivalTutorialV4BuildConfig {
  readonly id: string;
  readonly assets?: SurvivalTutorialV4Assets;
  readonly ui?: SurvivalTutorialV3UiOverrides;
  /** シーン順は startBeat で再ソートされる。 */
  readonly scenes: readonly SurvivalTutorialV4SceneControl[];
}

export interface SurvivalTutorialV4BuildParams {
  readonly musicXml: string;
  readonly midi?: Uint8Array;
  readonly config: SurvivalTutorialV4BuildConfig;
}

const BEAT_EPSILON = 1e-6;

const round = (value: number): number => Math.round(value * 1_000_000) / 1_000_000;

const verseToSpeaker = (verse: number): SurvivalTutorialV3DialogueSpeaker => {
  if (verse === 1) return 'fai';
  if (verse === 2) return 'jajii';
  return 'narration';
};

interface SceneSpan {
  readonly control: SurvivalTutorialV4SceneControl;
  readonly startBeat: number;
  readonly endBeat: number;
  readonly startPosition: SurvivalTutorialV4Position;
  readonly endPosition: SurvivalTutorialV4Position;
}

const resolveBeatToPosition = (
  score: SurvivalTutorialV4ParsedScore,
  absBeat: number,
): SurvivalTutorialV4Position => {
  const starts = score.measureStartBeats;
  let measureIndex = 0;
  for (let i = 0; i < starts.length; i += 1) {
    if (starts[i] <= absBeat + BEAT_EPSILON) measureIndex = i;
    else break;
  }
  if (absBeat >= score.totalQuarterBeats - BEAT_EPSILON) {
    return { measure: score.measureCount + 1, beat: 1 };
  }
  return {
    measure: measureIndex + 1,
    beat: round(absBeat - starts[measureIndex] + 1),
  };
};

const buildSceneSpans = (
  score: SurvivalTutorialV4ParsedScore,
  config: SurvivalTutorialV4BuildConfig,
): SceneSpan[] => {
  const matched = config.scenes.map((control) => {
    const rehearsal = score.rehearsals.find((item) => item.mark === control.id);
    if (!rehearsal) {
      throw new Error(`リハーサルマーク "${control.id}" が MusicXML に見つかりません`);
    }
    return { control, startBeat: rehearsal.startBeat };
  });
  matched.sort((a, b) => a.startBeat - b.startBeat);

  return matched.map((entry, index) => {
    const next = matched[index + 1];
    const endBeat = next ? next.startBeat : score.totalQuarterBeats;
    return {
      control: entry.control,
      startBeat: entry.startBeat,
      endBeat,
      startPosition: resolveBeatToPosition(score, entry.startBeat),
      endPosition: resolveBeatToPosition(score, endBeat),
    };
  });
};

const buildLines = (
  score: SurvivalTutorialV4ParsedScore,
  span: SceneSpan,
): SurvivalTutorialV4Line[] => {
  const inScene = score.lyrics
    .filter(
      (lyric) =>
        lyric.startBeat >= span.startBeat - BEAT_EPSILON &&
        lyric.startBeat < span.endBeat - BEAT_EPSILON,
    )
    .sort((a, b) => a.startBeat - b.startBeat);

  return inScene.map((lyric, index) => {
    const next = inScene[index + 1];
    const localStart = round(lyric.startBeat - span.startBeat);
    const durationBeats = next ? round(next.startBeat - lyric.startBeat) : undefined;
    const line: SurvivalTutorialV4Line = {
      ja: lyric.text,
      en: '',
      speaker: verseToSpeaker(lyric.verse),
      startBeat: localStart,
      ...(durationBeats !== undefined ? { durationBeats } : {}),
    };
    return line;
  });
};

const groupByOnset = (
  notes: readonly SurvivalTutorialV4ParsedNote[],
): SurvivalTutorialOnsetGroup[] => groupNotesByOnset(notes);

const sortedUniqueMidis = (
  notes: readonly SurvivalTutorialV4ParsedNote[],
): SurvivalTutorialV4ParsedNote[] => {
  const seen = new Set<number>();
  const result: SurvivalTutorialV4ParsedNote[] = [];
  for (const note of [...notes].sort((a, b) => a.midi - b.midi)) {
    if (seen.has(note.midi)) continue;
    seen.add(note.midi);
    result.push(note);
  }
  return result;
};

const buildRegularChunk = (
  group: SurvivalTutorialOnsetGroup,
  chunkEndBeat: number,
  spanStartBeat: number,
  chordName: string,
  bassNotes: readonly SurvivalTutorialV4ParsedNote[],
  keyFifths: number,
): SurvivalTutorialV4Chunk => {
  const playable = sortedUniqueMidis(group.notes);
  const bassInChunk = sortedUniqueMidis(
    bassNotes.filter(
      (note) =>
        note.startBeat >= group.startBeat - BEAT_EPSILON &&
        note.startBeat < chunkEndBeat - BEAT_EPSILON,
    ),
  );
  return {
    startBeat: round(group.startBeat - spanStartBeat),
    durationBeats: round(chunkEndBeat - group.startBeat),
    measureNumber: group.notes[0]?.measureNumber ?? 1,
    chordName,
    notes: playable.map((note) => note.midi),
    noteNames: playable.map((note) => note.noteName),
    noteStaves: playable.map((note) => (note.staff === 2 ? 2 : 1)),
    bass: bassInChunk.map((note) => note.midi),
    bassNames: bassInChunk.map((note) => note.noteName),
    keyFifths,
  };
};

const buildChunks = (
  score: SurvivalTutorialV4ParsedScore,
  span: SceneSpan,
  keyFifths: number,
): SurvivalTutorialV4Chunk[] => {
  const sceneNotes = score.notes.filter(
    (note) =>
      note.startBeat >= span.startBeat - BEAT_EPSILON &&
      note.startBeat < span.endBeat - BEAT_EPSILON,
  );
  const voicingNotes = sceneNotes.filter((note) => note.staff === 1 || note.staff === 2);
  const bassNotes = sceneNotes.filter((note) => note.staff === 3);

  const sceneHarmonies = score.harmonies
    .filter(
      (harmony) =>
        harmony.startBeat >= span.startBeat - BEAT_EPSILON &&
        harmony.startBeat < span.endBeat - BEAT_EPSILON,
    )
    .sort((a, b) => a.startBeat - b.startBeat);

  const harmonyRegionStartBeats = new Set(sceneHarmonies.map((h) => round(h.startBeat)));
  const chordNameAtBeat = (beat: number): string => {
    let name = '';
    for (const harmony of sceneHarmonies) {
      if (harmony.startBeat <= beat + BEAT_EPSILON) name = harmony.chordName;
      else break;
    }
    return name;
  };
  const harmonyStartBeatFor = (beat: number): number => {
    let startBeat = 0;
    for (const harmony of sceneHarmonies) {
      if (harmony.startBeat <= beat + BEAT_EPSILON) startBeat = harmony.startBeat;
      else break;
    }
    return startBeat;
  };

  const voicingOnsetGroups = groupByOnset(voicingNotes);
  const rollSequences = detectVoicingRollSequences(voicingOnsetGroups, harmonyStartBeatFor);
  const rollOnsetBeats = new Set<number>();
  for (const sequence of rollSequences) {
    for (let index = sequence.startGroupIndex; index <= sequence.endGroupIndex; index += 1) {
      const group = voicingOnsetGroups[index];
      if (group) {
        rollOnsetBeats.add(round(group.startBeat));
      }
    }
  }
  const measureQuarterBeats = (score.beatsPerMeasure / score.beatType) * 4;

  const chunks: SurvivalTutorialV4Chunk[] = [];

  const nextOnsetAfter = (startBeat: number, candidates: readonly number[]): number | null => {
    const later = candidates.filter((beat) => beat > startBeat + BEAT_EPSILON);
    return later.length > 0 ? Math.min(...later) : null;
  };

  const allOnsetStarts = voicingOnsetGroups.map((group) => group.startBeat);

  for (const sequence of rollSequences) {
    const firstGroup = voicingOnsetGroups[sequence.startGroupIndex];
    const lastGroup = voicingOnsetGroups[sequence.endGroupIndex];
    if (!firstGroup || !lastGroup) continue;
    const trailingEnd = nextOnsetAfter(
      lastGroup.startBeat,
      allOnsetStarts.filter((beat) => Math.abs(beat - lastGroup.startBeat) > BEAT_EPSILON),
    );
    const groupEndBeat = Math.max(...lastGroup.notes.map((note) => note.endBeat));
    const chunkEndBeat = trailingEnd ?? groupEndBeat;
    const isHarmonyRegionStart = harmonyRegionStartBeats.has(round(firstGroup.startBeat));
    chunks.push(
      buildRollChunkFromSequence(
        voicingOnsetGroups,
        sequence,
        bassNotes,
        span.startBeat,
        isHarmonyRegionStart ? chordNameAtBeat(firstGroup.startBeat) : '',
        keyFifths,
        chunkEndBeat,
      ),
    );
  }

  const regularPlayableNotes = voicingNotes.filter(
    (note) => !rollOnsetBeats.has(round(note.startBeat)),
  );
  const regularOnsetGroups = groupByOnset(regularPlayableNotes);
  regularOnsetGroups.forEach((group, index) => {
    const nextGroup = regularOnsetGroups[index + 1];
    const groupEndBeat = Math.max(...group.notes.map((note) => note.endBeat));
    const chunkEndBeat = nextGroup?.startBeat ?? groupEndBeat;
    const isHarmonyRegionStart = harmonyRegionStartBeats.has(round(group.startBeat));
    chunks.push(
      buildRegularChunk(
        group,
        chunkEndBeat,
        span.startBeat,
        isHarmonyRegionStart ? chordNameAtBeat(group.startBeat) : '',
        bassNotes,
        keyFifths,
      ),
    );
  });

  // 休符小節(音符が無い小節)を空塊として補い、空の五線譜表示を可能にする。
  const startMeasure = span.startPosition.measure;
  const endMeasureExclusive =
    span.endPosition.beat <= 1 + BEAT_EPSILON
      ? span.endPosition.measure
      : span.endPosition.measure + 1;
  const measuresWithChunks = new Set(chunks.map((chunk) => chunk.measureNumber));
  for (let measure = startMeasure; measure < endMeasureExclusive; measure += 1) {
    if (measuresWithChunks.has(measure)) continue;
    const measureStartBeat = score.measureStartBeats[measure - 1];
    if (measureStartBeat === undefined) continue;
    chunks.push({
      startBeat: round(measureStartBeat - span.startBeat),
      durationBeats: round(measureQuarterBeats),
      measureNumber: measure,
      chordName: '',
      notes: [],
      bass: [],
      keyFifths,
    });
  }

  return chunks.sort((a, b) => a.startBeat - b.startBeat);
};

const buildMidiRange = (
  tempoMap: SurvivalTutorialV4MidiTempoMap,
  span: SceneSpan,
): SurvivalTutorialV4MidiRange => {
  const startTick = quarterBeatsToTick(tempoMap, span.startBeat);
  const endTick = quarterBeatsToTick(tempoMap, span.endBeat);
  return {
    startTick,
    endTick,
    startSec: midiTickToSeconds(tempoMap, startTick),
    endSec: midiTickToSeconds(tempoMap, endTick),
  };
};

// ts-prune-ignore-next 生成スクリプト/テストから利用(フェーズ2でランタイムが利用)
export const buildSurvivalTutorialV4Manifest = (
  params: SurvivalTutorialV4BuildParams,
): SurvivalTutorialV4Manifest => {
  const { musicXml, midi, config } = params;
  const score = parseSurvivalTutorialV4MusicXml(musicXml);
  const tempoMap = midi
    ? parseSurvivalTutorialV4MidiTempoMap(midi)
    : createConstantTempoMap(score.bpm);

  const spans = buildSceneSpans(score, config);

  const scenes: SurvivalTutorialV4Scene[] = spans.map((span) => {
    const { control } = span;
    const keyFifths = control.keyFifths ?? score.keyFifths;
    const bgmResetOnEnter =
      control.bgmResetOnEnter ?? control.sceneType === 'demo';
    const midiRange = buildMidiRange(tempoMap, span);
    const lines = buildLines(score, span);

    const base = {
      id: control.id,
      start: span.startPosition,
      end: span.endPosition,
      bgm: {
        ...(control.bgmUrl !== undefined ? { url: control.bgmUrl } : {}),
        resetOnEnter: bgmResetOnEnter,
      },
      keyFifths,
      beatsPerMeasure: score.beatsPerMeasure,
      bpm: score.bpm,
      midi: midiRange,
    };

    if (control.sceneType === 'dialogue') {
      return { ...base, sceneType: 'dialogue', lines };
    }
    const chunks = buildChunks(score, span, keyFifths);
    if (control.sceneType === 'demo') {
      return { ...base, sceneType: 'demo', chords: chunks, lines };
    }
    return { ...base, sceneType: 'play', questions: chunks, lines };
  });

  return {
    version: 4,
    id: config.id,
    assets: config.assets ?? {},
    bpm: score.bpm,
    beatsPerMeasure: score.beatsPerMeasure,
    keyFifths: score.keyFifths,
    ...(config.ui ? { ui: config.ui } : {}),
    scenes,
  };
};
