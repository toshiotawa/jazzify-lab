/**
 * Survival Tutorial V4 — ランタイムアダプタ(V4 manifest → 既存 V3 ランタイム型)。
 *
 * フェーズ2 の最初の足場。V4 の中間 JSON(manifest) のシーンを、既存の実績ある
 * V3 ランタイム型へ変換する純粋関数群。UI からはこの変換結果を既存の
 * デモ/フレーズ実行経路へ流し込む。
 *
 * 変換方針:
 * - demo: chunk(notes/noteStaves) → `SurvivalTutorialV3DemoChordEvent`(voicing/voicing_staves)。
 *   staff3 の bass は V3 demo 型に枠が無いため別途 `bass` として保持(再生は後段で対応)。
 * - play: chunk(判定対象 notes) → `SurvivalPhraseDefinition`(左→右で1音ずつ判定)。
 *   notes が空の塊(休符小節)は判定不能のため除外。
 * - dialogue: V4 line → V3 `dialogue_only`(自動送り+クリック)。
 *
 * すべて純粋関数(副作用なし・割り当ては入力比例)。レンダーループ非依存。
 */
import type { SurvivalPhraseChord, SurvivalPhraseDefinition } from '@/utils/survivalPhraseDefinitions';
import type {
  SurvivalTutorialV3DemoChordEvent,
  SurvivalTutorialV3DemoLine,
  SurvivalTutorialV3DemoPlayScene,
  SurvivalTutorialV3DialogueLine,
  SurvivalTutorialV3DialogueOnlyScene,
} from '../survivalTutorialV3ScriptTypes';
import type {
  SurvivalTutorialV4Chunk,
  SurvivalTutorialV4DemoScene,
  SurvivalTutorialV4DialogueScene,
  SurvivalTutorialV4Line,
  SurvivalTutorialV4PlayScene,
} from './survivalTutorialV4Types';

const pitchClassOf = (midi: number): number => ((midi % 12) + 12) % 12;

const toStaff12 = (staff: 1 | 2 | undefined): 1 | 2 => (staff === 1 ? 1 : 2);

const v4LineToDemoLine = (line: SurvivalTutorialV4Line): SurvivalTutorialV3DemoLine => ({
  ja: line.ja,
  en: line.en,
  ...(line.speaker ? { speaker: line.speaker } : {}),
  startBeat: line.startBeat,
  ...(line.durationBeats !== undefined ? { durationBeats: line.durationBeats } : {}),
});

const v4LineToDialogueLine = (
  line: SurvivalTutorialV4Line,
): SurvivalTutorialV3DialogueLine => ({
  ja: line.ja,
  en: line.en,
  ...(line.speaker ? { speaker: line.speaker } : {}),
});

/** demo 用: 1 塊 → V3 demo 和音イベント(staff1/2 のみ。bass=staff3 は対象外)。 */
export const survivalTutorialV4ChunkToDemoChordEvent = (
  chunk: SurvivalTutorialV4Chunk,
): SurvivalTutorialV3DemoChordEvent => ({
  startBeat: chunk.startBeat,
  durationBeats: chunk.durationBeats,
  chordName: chunk.chordName,
  voicing: [...chunk.notes],
  ...(chunk.noteNames ? { voicingNames: [...chunk.noteNames] } : {}),
  ...(chunk.noteStaves ? { voicing_staves: [...chunk.noteStaves] } : {}),
  measureNumber: chunk.measureNumber,
  ...(chunk.keyFifths !== undefined ? { keyFifths: chunk.keyFifths } : {}),
  ...(chunk.bass && chunk.bass.length > 0 ? { bass: [...chunk.bass] } : {}),
});

// ts-prune-ignore-next テスト/フェーズ2 UI から利用
export const survivalTutorialV4DemoSceneToV3 = (
  scene: SurvivalTutorialV4DemoScene,
): SurvivalTutorialV3DemoPlayScene => ({
  type: 'demo_play',
  bpm: scene.bpm,
  beatsPerMeasure: scene.beatsPerMeasure,
  keyFifths: scene.keyFifths,
  chords: scene.chords.map(survivalTutorialV4ChunkToDemoChordEvent),
  lines: scene.lines.map(v4LineToDemoLine),
  livePlayback: true,
});

// ts-prune-ignore-next テスト/フェーズ2 UI から利用
export const survivalTutorialV4DialogueSceneToV3 = (
  scene: SurvivalTutorialV4DialogueScene,
): SurvivalTutorialV3DialogueOnlyScene => ({
  type: 'dialogue_only',
  lines: scene.lines.map(v4LineToDialogueLine),
});

/** play 用: 判定対象塊 → フレーズ定義(休符塊=notes 空は除外)。 */
// ts-prune-ignore-next テスト/フェーズ2 UI から利用
export const survivalTutorialV4PlaySceneToPhraseDefinition = (
  scene: SurvivalTutorialV4PlayScene,
): SurvivalPhraseDefinition => {
  const chords: SurvivalPhraseChord[] = [];
  let orderIndex = 0;
  for (const chunk of scene.questions) {
    if (chunk.notes.length === 0) continue;
    const names = chunk.noteNames;
    const staves = chunk.noteStaves;
    const notes = chunk.notes.map((pitchMidi, noteIndex) => ({
      orderIndex: noteIndex,
      pitchMidi,
      pitchClass: pitchClassOf(pitchMidi),
      noteName: names?.[noteIndex] ?? `M${pitchMidi}`,
      staff: toStaff12(staves?.[noteIndex]),
    }));
    chords.push({
      id: `v4-play:${scene.id}:${orderIndex}`,
      orderIndex,
      chordName: chunk.chordName,
      measureNumber: chunk.measureNumber,
      notes,
    });
    orderIndex += 1;
  }

  return {
    id: `v4-play:${scene.id}`,
    mapCategory: 'phrases',
    stageNumber: 0,
    title: scene.id,
    bgmUrl: scene.bgm.url ?? null,
    keyFifths: scene.keyFifths,
    chords,
  };
};
