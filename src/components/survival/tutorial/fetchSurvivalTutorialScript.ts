import { getSupabaseClient } from '@/platform/supabaseClient';
import type { TutorialAudioTracksMap } from './TutorialAudioController';

export interface SurvivalTutorialScriptRow {
  id: string;
  title: string;
  title_en: string;
  script: SurvivalTutorialScriptPayload;
}

export interface SurvivalTutorialScriptPayload {
  version: number;
  audioTracks?: TutorialAudioTracksMap;
  builtinRunner?: string;
}

const BUNDLED_ONBOARDING: SurvivalTutorialScriptRow = {
  id: 'onboarding-v1',
  title: 'サバイバルチュートリアル（II-V-I）',
  title_en: 'Survival Tutorial (II-V-I)',
  script: {
    version: 1,
    builtinRunner: 'onboarding-v1',
    audioTracks: {
      main_bgm: { resolveFrom: 'progression', defaultLoop: true, defaultVolume: 0.45 },
      drum_loop: {
        url: 'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
        defaultLoop: true,
        defaultVolume: 0.35,
      },
    },
  },
};

function parsePayload(raw: unknown): SurvivalTutorialScriptPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const version = o.version;
  if (typeof version !== 'number') return null;
  const audioTracks =
    o.audioTracks && typeof o.audioTracks === 'object'
      ? (o.audioTracks as TutorialAudioTracksMap)
      : undefined;
  const builtinRunner =
    typeof o.builtinRunner === 'string' ? o.builtinRunner : undefined;
  return { version, audioTracks, builtinRunner };
}

export async function fetchSurvivalTutorialScript(
  scriptId: string,
): Promise<SurvivalTutorialScriptRow> {
  if (scriptId === 'onboarding-v1') {
    try {
      const { data, error } = await getSupabaseClient()
        .from('survival_tutorial_scripts')
        .select('id, title, title_en, script')
        .eq('id', scriptId)
        .eq('is_active', true)
        .maybeSingle();
      if (!error && data) {
        const parsed = parsePayload(data.script);
        if (parsed) {
          return {
            id: data.id,
            title: data.title,
            title_en: data.title_en,
            script: parsed,
          };
        }
      }
    } catch {
      /* fallback */
    }
    return BUNDLED_ONBOARDING;
  }

  const { data, error } = await getSupabaseClient()
    .from('survival_tutorial_scripts')
    .select('id, title, title_en, script')
    .eq('id', scriptId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    throw new Error(`Tutorial script not found: ${scriptId}`);
  }
  const parsed = parsePayload(data.script);
  if (!parsed) {
    throw new Error(`Invalid tutorial script payload: ${scriptId}`);
  }
  return {
    id: data.id,
    title: data.title,
    title_en: data.title_en,
    script: parsed,
  };
}
