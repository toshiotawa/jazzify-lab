/**
 * Survival Tutorial V4 — manifest → V3 ペイロード変換(ブリッジ)。
 *
 * V4 manifest を `SurvivalTutorialScriptPayloadV3` に変換し、既存の V3 ランタイム
 * (`SurvivalLessonTutorialExperience`)で駆動する。
 *
 * 対応:
 * - dialogue → `dialogue_only`
 * - demo     → `demo_play`(staff1/2 表示+ピアノ再生。staff3 bass は livePlayback でベース音源再生)
 * - play     → `phrase_battle`(playAlong) + phrase ブロック。塊ごとに quote セリフ/休符塊送り/
 *              staff3 bass を保持し、塊単位で逐次進める。
 * - 末尾に `finish` を付与し CTA で完了
 *
 * 純粋関数(副作用なし)。
 */
import type {
  SurvivalTutorialLocalizedText,
  SurvivalTutorialScriptPayloadV3,
  SurvivalTutorialV3BattleDialogue,
  SurvivalTutorialV3ContentRef,
  SurvivalTutorialV3PhraseChordDef,
  SurvivalTutorialV3Scene,
  SurvivalTutorialV3UiOverrides,
} from '../survivalTutorialV3ScriptTypes';
import type {
  SurvivalTutorialV4Chunk,
  SurvivalTutorialV4Line,
  SurvivalTutorialV4Manifest,
  SurvivalTutorialV4PlayScene,
} from './survivalTutorialV4Types';
import {
  isSurvivalTutorialV4DemoScene,
  isSurvivalTutorialV4DialogueScene,
  isSurvivalTutorialV4PlayScene,
} from './survivalTutorialV4Types';
import {
  survivalTutorialV4DemoSceneToV3,
  survivalTutorialV4DialogueSceneToV3,
} from './v4RuntimeAdapters';

const DEFAULT_UI: SurvivalTutorialV3UiOverrides = {
  hidePlayerHpBar: true,
  hideSettingsButton: true,
  hideBackButton: true,
  hideMidiToggle: true,
  showExitButton: true,
  playerInvincible: true,
  disableEnemyAttacks: true,
  keyboardHintsDefault: true,
};

const EMPTY_TEXT: SurvivalTutorialLocalizedText = { ja: '', en: '' };

const playContentKey = (sceneId: string): string => `v4-play:${sceneId}`;

const lineToLocalized = (line: SurvivalTutorialV4Line): SurvivalTutorialLocalizedText => ({
  ja: line.ja,
  en: line.en,
  ...(line.speaker ? { speaker: line.speaker } : {}),
});

/**
 * 各塊（onset 単位）にセリフを割り当てる。塊の startBeat <= line.startBeat となる
 * 最後の塊にそのセリフを紐付ける（=その拍で鳴っている塊にセリフを同期）。
 * どの塊にも先行する（最初の塊より前の）セリフは intro として返す。
 */
const assignPlayQuotes = (
  questions: readonly SurvivalTutorialV4Chunk[],
  lines: readonly SurvivalTutorialV4Line[],
): { quoteByIndex: Map<number, SurvivalTutorialV4Line>; intro: SurvivalTutorialV4Line | null } => {
  const quoteByIndex = new Map<number, SurvivalTutorialV4Line>();
  let intro: SurvivalTutorialV4Line | null = null;
  const sortedLines = [...lines].sort((a, b) => a.startBeat - b.startBeat);
  for (const line of sortedLines) {
    let idx = -1;
    for (let i = 0; i < questions.length; i += 1) {
      if (questions[i].startBeat <= line.startBeat) {
        idx = i;
      } else {
        break;
      }
    }
    if (idx < 0) {
      if (intro === null) intro = line;
      continue;
    }
    if (!quoteByIndex.has(idx)) {
      quoteByIndex.set(idx, line);
    }
  }
  return { quoteByIndex, intro };
};

const buildPlayBattleDialogue = (
  intro: SurvivalTutorialV4Line | null,
): SurvivalTutorialV3BattleDialogue => ({
  intro: intro ? lineToLocalized(intro) : EMPTY_TEXT,
  onReveal: EMPTY_TEXT,
  onCorrectRemaining: EMPTY_TEXT,
});

const buildPlayContentBlock = (
  scene: SurvivalTutorialV4PlayScene,
  quoteByIndex: Map<number, SurvivalTutorialV4Line>,
): SurvivalTutorialV3ContentRef => {
  const chords: SurvivalTutorialV3PhraseChordDef[] = scene.questions.map((chunk, idx) => {
    const quote = quoteByIndex.get(idx);
    return {
      name: chunk.chordName,
      voicing: [...chunk.notes],
      ...(chunk.noteNames ? { voicingNames: [...chunk.noteNames] } : {}),
      ...(chunk.noteStaves ? { voicing_staves: [...chunk.noteStaves] } : {}),
      measure_number: chunk.measureNumber,
      ...(quote ? { quote: lineToLocalized(quote) } : {}),
      ...(chunk.bass.length > 0 ? { bass: [...chunk.bass] } : {}),
    };
  });
  return {
    stage: {
      name: scene.id,
      nameEn: scene.id,
      chordDisplayName: scene.id,
      chordDisplayNameEn: scene.id,
      stageType: 'progression',
      mapCategory: 'phrases',
    },
    phrases: [
      {
        order_index: 0,
        title: scene.id,
        title_en: scene.id,
        audio_url: scene.bgm.url ?? null,
        loop_duration_sec: null,
        key_fifths: scene.keyFifths,
        chords,
      },
    ],
  };
};

export const survivalTutorialV4ManifestToV3Payload = (
  manifest: SurvivalTutorialV4Manifest,
): SurvivalTutorialScriptPayloadV3 => {
  const content: Record<string, SurvivalTutorialV3ContentRef> = {};
  const scenes: SurvivalTutorialV3Scene[] = [];

  for (const scene of manifest.scenes) {
    if (isSurvivalTutorialV4DialogueScene(scene)) {
      scenes.push(survivalTutorialV4DialogueSceneToV3(scene));
      continue;
    }
    if (isSurvivalTutorialV4DemoScene(scene)) {
      scenes.push(survivalTutorialV4DemoSceneToV3(scene));
      continue;
    }
    if (isSurvivalTutorialV4PlayScene(scene)) {
      const contentRef = playContentKey(scene.id);
      const { quoteByIndex, intro } = assignPlayQuotes(scene.questions, scene.lines);
      content[contentRef] = buildPlayContentBlock(scene, quoteByIndex);
      scenes.push({
        type: 'phrase_battle',
        bgm: { ...scene.bgm },
        contentRef,
        requiredLoops: 1,
        playAlong: true,
        dialogue: buildPlayBattleDialogue(intro),
      });
    }
  }

  scenes.push({ type: 'finish' });

  const bgmUrl = manifest.assets.bgm?.url;

  return {
    version: 3,
    ...(bgmUrl ? { audioTracks: { drum_loop: { url: bgmUrl } } } : {}),
    ui: manifest.ui ?? DEFAULT_UI,
    content,
    scenes,
    finish: { showCta: true },
  };
};
