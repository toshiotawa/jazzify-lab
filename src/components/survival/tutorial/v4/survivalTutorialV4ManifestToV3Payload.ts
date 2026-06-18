/**
 * Survival Tutorial V4 — manifest → V3 ペイロード変換(ブリッジ)。
 *
 * フェーズ2(ブリッジ段階): V4 manifest を妥当な `SurvivalTutorialScriptPayloadV3` に
 * 変換し、既存の実績ある V3 ランタイム(`SurvivalLessonTutorialExperience`)を
 * 無改造で駆動する。シームレス遷移/ライブ音源/ベース再生は後段で本実装する。
 *
 * 対応:
 * - dialogue → `dialogue_only`
 * - demo     → `demo_play`(staff1/2。bass=staff3 は V3 demo に枠が無く後段)
 * - play     → `phrase_battle` + content の phrase ブロック(休符塊は除外)
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

const buildPlayBattleDialogue = (
  scene: SurvivalTutorialV4PlayScene,
): SurvivalTutorialV3BattleDialogue => {
  const intro = scene.lines[0];
  return {
    intro: intro ? { ja: intro.ja, en: intro.en } : EMPTY_TEXT,
    onReveal: EMPTY_TEXT,
    onCorrectRemaining: EMPTY_TEXT,
  };
};

const buildPlayContentBlock = (
  scene: SurvivalTutorialV4PlayScene,
): SurvivalTutorialV3ContentRef => {
  const chords: SurvivalTutorialV3PhraseChordDef[] = [];
  for (const chunk of scene.questions) {
    if (chunk.notes.length === 0) continue;
    chords.push({
      name: chunk.chordName,
      voicing: [...chunk.notes],
      ...(chunk.noteNames ? { voicingNames: [...chunk.noteNames] } : {}),
      ...(chunk.noteStaves ? { voicing_staves: [...chunk.noteStaves] } : {}),
      measure_number: chunk.measureNumber,
    });
  }
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
      content[contentRef] = buildPlayContentBlock(scene);
      scenes.push({
        type: 'phrase_battle',
        contentRef,
        requiredLoops: 1,
        dialogue: buildPlayBattleDialogue(scene),
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
