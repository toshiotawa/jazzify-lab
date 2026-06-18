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
