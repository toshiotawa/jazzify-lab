import type {
  SurvivalTutorialScriptPayloadV3,
  SurvivalTutorialV3DemoPlayScene,
  SurvivalTutorialV3Scene,
} from '@/components/survival/tutorial/survivalTutorialV3ScriptTypes';

export const DEFAULT_SURVIVAL_TUTORIAL_DRUM_LOOP_VOLUME = 0.35;

export interface ResolvedSurvivalTutorialDemoPlayAudio {
  readonly url: string | null;
  readonly volume: number;
}

const trimUrl = (value: string | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export const resolveSurvivalTutorialDemoPlayAudio = (
  scene: SurvivalTutorialV3DemoPlayScene,
  script: SurvivalTutorialScriptPayloadV3,
  isEnglishCopy: boolean,
): ResolvedSurvivalTutorialDemoPlayAudio => {
  const audio = scene.audio;
  const drumLoop = script.audioTracks?.drum_loop;

  const localeUrl = isEnglishCopy
    ? trimUrl(audio?.url_en) ?? trimUrl(audio?.url)
    : trimUrl(audio?.url_ja) ?? trimUrl(audio?.url);
  const fallbackUrl = trimUrl(scene.bgm?.url) ?? trimUrl(drumLoop?.url);
  const url = localeUrl ?? fallbackUrl;

  const volume = audio?.volume ?? drumLoop?.volume ?? DEFAULT_SURVIVAL_TUTORIAL_DRUM_LOOP_VOLUME;

  return { url, volume };
};

/** シーン切替時の共有 BGM(main_bgm) の扱い。 */
export type TutorialV3BgmAction = 'keep' | 'restart' | 'stop';

export interface TutorialV3BgmState {
  readonly currentUrl: string | null;
  readonly isPlaying: boolean;
}

export const resolveTutorialV3SceneBgmUrl = (
  scene: SurvivalTutorialV3Scene,
  fallbackUrl: string | undefined,
): string | null => {
  if (scene.type === 'finish') return null;
  return trimUrl(scene.bgm?.url) ?? trimUrl(fallbackUrl);
};

/**
 * シーン切替時の共有 BGM アクションを決める。
 * - URL なし/finish: `stop`
 * - resetOnEnter=true: `restart`
 * - 同じ URL が再生中: `keep`(再生位置を維持し再生成しない)
 * - URL が変わった、または停止中: `restart`
 */
export const resolveTutorialV3BgmAction = (
  scene: SurvivalTutorialV3Scene,
  nextUrl: string | null,
  state: TutorialV3BgmState,
): TutorialV3BgmAction => {
  if (!nextUrl || scene.type === 'finish') return 'stop';
  if (scene.bgm?.resetOnEnter === true) return 'restart';
  return state.isPlaying && state.currentUrl === nextUrl ? 'keep' : 'restart';
};
