/**
 * Survival Tutorial V4 — 中間JSON(manifest) の型定義。
 *
 * 設計方針:
 * - MusicXML は「素材」(音/小節/拍/譜面/歌詞Verse/調号/BPM/リハーサルマーク境界) を提供する。
 * - sceneType / bgmPolicy などの「制御情報」は明示的にこの manifest に持つ。
 *   (Swing のリズムは MIDI のノート timing に内包されるため独立した概念は持たない)
 * - MusicXML 自体は保存せず、この manifest が正本。MIDI はテンポマップ算出のための素材。
 * - 3段目(staff=3) は表示せず再生のみ。判定対象でもない(ベース)。
 *
 * 拍(beat)は四分音符基準。`SurvivalTutorialV3DemoChordEvent.startBeat` と同じ扱い。
 */
import type {
  SurvivalTutorialLocalizedText,
  SurvivalTutorialV3DialogueSpeaker,
  SurvivalTutorialV3UiOverrides,
} from '../survivalTutorialV3ScriptTypes';

export type SurvivalTutorialV4SceneType = 'dialogue' | 'demo' | 'play';

/** ステージ全体での小節/拍位置。beat は四分音符基準の 1 始まり。 */
export interface SurvivalTutorialV4Position {
  readonly measure: number;
  readonly beat: number;
}

/** measure/beat から算出した MIDI 上の tick / 秒。シーン2(demo) 再生に使用。 */
export interface SurvivalTutorialV4MidiRange {
  readonly startTick: number;
  readonly endTick: number;
  readonly startSec: number;
  readonly endSec: number;
}

/** シーンごとの BGM ポリシー。resetOnEnter=true でシーン開始時に先頭へ戻す。 */
export interface SurvivalTutorialV4SceneBgm {
  readonly url?: string;
  readonly resetOnEnter: boolean;
}

/** 拍同期セリフ。startBeat はシーン先頭からのローカル拍。話者は Verse 由来。 */
export interface SurvivalTutorialV4Line extends SurvivalTutorialLocalizedText {
  readonly startBeat: number;
  readonly durationBeats?: number;
  readonly speaker?: SurvivalTutorialV3DialogueSpeaker;
}

/**
 * 音符 onset 単位の「塊」。
 * - notes(staff 1|2): 描画 + 判定 + 再生対象の MIDI。
 * - bass(staff 3): 再生専用。描画・判定対象外。
 * - chordName: harmony 区間の先頭塊にのみ付与。継続塊は ''。
 * - 空(notes/bass ともに空)は休符小節(空の五線譜)を表す。
 */
export interface SurvivalTutorialV4Chunk {
  /** シーン先頭からのローカル拍(四分音符基準)。 */
  readonly startBeat: number;
  readonly durationBeats: number;
  /** ステージ全体の絶対小節番号(1 始まり)。 */
  readonly measureNumber: number;
  readonly chordName: string;
  readonly notes: readonly number[];
  readonly noteNames?: readonly string[];
  readonly noteStaves?: readonly (1 | 2)[];
  readonly bass: readonly number[];
  readonly bassNames?: readonly string[];
  readonly keyFifths?: number;
}

interface SurvivalTutorialV4SceneBase {
  /** リハーサルマークのテキスト(例: "S1")。 */
  readonly id: string;
  readonly start: SurvivalTutorialV4Position;
  readonly end: SurvivalTutorialV4Position;
  readonly bgm: SurvivalTutorialV4SceneBgm;
  readonly keyFifths: number;
  readonly beatsPerMeasure: number;
  readonly bpm: number;
  readonly midi: SurvivalTutorialV4MidiRange;
}

export interface SurvivalTutorialV4DialogueScene extends SurvivalTutorialV4SceneBase {
  readonly sceneType: 'dialogue';
  readonly lines: readonly SurvivalTutorialV4Line[];
}

export interface SurvivalTutorialV4DemoScene extends SurvivalTutorialV4SceneBase {
  readonly sceneType: 'demo';
  readonly chords: readonly SurvivalTutorialV4Chunk[];
  readonly lines: readonly SurvivalTutorialV4Line[];
}

export interface SurvivalTutorialV4PlayScene extends SurvivalTutorialV4SceneBase {
  readonly sceneType: 'play';
  readonly questions: readonly SurvivalTutorialV4Chunk[];
  readonly lines: readonly SurvivalTutorialV4Line[];
}

export type SurvivalTutorialV4Scene =
  | SurvivalTutorialV4DialogueScene
  | SurvivalTutorialV4DemoScene
  | SurvivalTutorialV4PlayScene;

export interface SurvivalTutorialV4Assets {
  readonly midi?: string;
  readonly bgm?: { readonly url?: string };
}

/** DB survival_tutorial_scripts.script v4 (manifest)。 */
export interface SurvivalTutorialV4Manifest {
  readonly version: 4;
  readonly id: string;
  readonly assets: SurvivalTutorialV4Assets;
  readonly bpm: number;
  readonly beatsPerMeasure: number;
  readonly keyFifths: number;
  readonly ui?: SurvivalTutorialV3UiOverrides;
  readonly scenes: readonly SurvivalTutorialV4Scene[];
}

// ts-prune-ignore-next テスト/フェーズ2ランタイムから利用
export function isSurvivalTutorialV4Manifest(
  raw: unknown,
): raw is SurvivalTutorialV4Manifest {
  if (!raw || typeof raw !== 'object') return false;
  const o = raw as Record<string, unknown>;
  if (o.version !== 4) return false;
  if (typeof o.id !== 'string') return false;
  if (!Array.isArray(o.scenes)) return false;
  return true;
}

// ts-prune-ignore-next テスト/フェーズ2ランタイムから利用
export function isSurvivalTutorialV4DialogueScene(
  scene: SurvivalTutorialV4Scene,
): scene is SurvivalTutorialV4DialogueScene {
  return scene.sceneType === 'dialogue';
}

// ts-prune-ignore-next テスト/フェーズ2ランタイムから利用
export function isSurvivalTutorialV4DemoScene(
  scene: SurvivalTutorialV4Scene,
): scene is SurvivalTutorialV4DemoScene {
  return scene.sceneType === 'demo';
}

// ts-prune-ignore-next テスト/フェーズ2ランタイムから利用
export function isSurvivalTutorialV4PlayScene(
  scene: SurvivalTutorialV4Scene,
): scene is SurvivalTutorialV4PlayScene {
  return scene.sceneType === 'play';
}
