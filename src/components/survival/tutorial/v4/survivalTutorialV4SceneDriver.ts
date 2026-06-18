/**
 * Survival Tutorial V4 — ネイティブ・シームレスランタイムのシーン駆動コア(純粋)。
 *
 * 単一画面で manifest のシーン列を継ぎ目なく進めるための、副作用のない
 * 状態遷移＋BGM継続判定。React シェル(`SurvivalTutorialV4Player`)はこのコアを
 * 参照して再マウントせずにシーンを切り替える。
 *
 * BGM 継続の原則(仕様):
 * - シーンの BGM が前シーンと同一(URL一致)かつ `resetOnEnter` でないなら再生位置を維持(keep)。
 * - demo など `resetOnEnter` のシーンは先頭から(restart)。
 * - BGM URL が無いシーンは停止(stop)。
 */
import type {
  SurvivalTutorialV4Manifest,
  SurvivalTutorialV4Scene,
} from './survivalTutorialV4Types';

export interface SurvivalTutorialV4SceneCursor {
  readonly index: number;
}

export type SurvivalTutorialV4BgmAction =
  | { readonly kind: 'keep' }
  | { readonly kind: 'restart'; readonly url: string }
  | { readonly kind: 'stop' };

export const initialSurvivalTutorialV4Cursor = (): SurvivalTutorialV4SceneCursor => ({
  index: 0,
});

export const currentSurvivalTutorialV4Scene = (
  cursor: SurvivalTutorialV4SceneCursor,
  manifest: SurvivalTutorialV4Manifest,
): SurvivalTutorialV4Scene | null => manifest.scenes[cursor.index] ?? null;

// ts-prune-ignore-next シェルの末尾判定/スキップUIから利用予定。テスト済み。
export const isLastSurvivalTutorialV4Scene = (
  cursor: SurvivalTutorialV4SceneCursor,
  manifest: SurvivalTutorialV4Manifest,
): boolean => cursor.index >= manifest.scenes.length - 1;

export interface SurvivalTutorialV4AdvanceResult {
  readonly cursor: SurvivalTutorialV4SceneCursor;
  /** これ以上シーンが無く、レッスン完了に到達したか。 */
  readonly done: boolean;
}

export const advanceSurvivalTutorialV4Scene = (
  cursor: SurvivalTutorialV4SceneCursor,
  manifest: SurvivalTutorialV4Manifest,
): SurvivalTutorialV4AdvanceResult => {
  const next = cursor.index + 1;
  if (next >= manifest.scenes.length) {
    return { cursor, done: true };
  }
  return { cursor: { index: next }, done: false };
};

/**
 * シーン開始時の共有 BGM アクション。
 * @param currentBgmUrl 現在鳴っている BGM の URL(無音は null)。
 */
export const resolveSurvivalTutorialV4BgmAction = (
  scene: SurvivalTutorialV4Scene,
  currentBgmUrl: string | null,
): SurvivalTutorialV4BgmAction => {
  const url = scene.bgm.url ?? null;
  if (!url) return { kind: 'stop' };
  if (!scene.bgm.resetOnEnter && url === currentBgmUrl) {
    return { kind: 'keep' };
  }
  return { kind: 'restart', url };
};

/** BGM アクション適用後に「現在鳴っている BGM の URL」をどう更新するか。 */
export const nextSurvivalTutorialV4BgmUrl = (
  action: SurvivalTutorialV4BgmAction,
  currentBgmUrl: string | null,
): string | null => {
  switch (action.kind) {
    case 'keep':
      return currentBgmUrl;
    case 'restart':
      return action.url;
    case 'stop':
      return null;
  }
};
