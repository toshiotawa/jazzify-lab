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
  const fallbackUrl = trimUrl(drumLoop?.url);
  const url = localeUrl ?? fallbackUrl;

  const volume = audio?.volume ?? drumLoop?.volume ?? DEFAULT_SURVIVAL_TUTORIAL_DRUM_LOOP_VOLUME;

  return { url, volume };
};

export const shouldMuteTutorialV3Bgm = (scene: SurvivalTutorialV3Scene): boolean =>
  scene.type === 'phrase_battle' || scene.type === 'demo_play' || scene.type === 'finish';

/** シーン切替時の共有 BGM(main_bgm) の扱い。 */
export type TutorialV3BgmAction = 'keep' | 'restart' | 'stop';

/**
 * シーン切替時の共有 BGM アクションを決める。
 * - ミュート対象シーン(demo/phrase/finish): `stop`
 * - 非ミュートで既に再生中(同一 BGM 継続): `keep`(再生位置を維持し再生成しない)
 * - 非ミュートで停止中: `restart`(先頭から再生開始)
 */
export const resolveTutorialV3BgmAction = (
  scene: SurvivalTutorialV3Scene,
  isCurrentlyPlaying: boolean,
): TutorialV3BgmAction => {
  if (shouldMuteTutorialV3Bgm(scene)) return 'stop';
  return isCurrentlyPlaying ? 'keep' : 'restart';
};
