import { getSupabaseClient } from '@/platform/supabaseClient';
import { buildOnboardingV1Script } from './buildOnboardingV1Script';
import type { TutorialAudioTracksMap } from './TutorialAudioController';
import {
  isTutorialScriptPayload,
  type TutorialScriptPayload,
} from './tutorialScriptTypes';

export interface SurvivalTutorialLegacyPayload {
  version: 1;
  audioTracks?: TutorialAudioTracksMap;
  builtinRunner?: string;
}

export type SurvivalTutorialScriptPayload =
  | TutorialScriptPayload
  | SurvivalTutorialLegacyPayload;

export interface SurvivalTutorialScriptRow {
  id: string;
  title: string;
  title_en: string;
  script: SurvivalTutorialScriptPayload;
}

const BUNDLED_ONBOARDING: SurvivalTutorialScriptRow = {
  id: 'onboarding-v1',
  title: 'サバイバルチュートリアル（II-V-I）',
  title_en: 'Survival Tutorial (II-V-I)',
  script: buildOnboardingV1Script(),
};

function parseLegacyPayload(raw: Record<string, unknown>): SurvivalTutorialLegacyPayload | null {
  if (raw.version !== 1) return null;
  const audioTracks =
    raw.audioTracks && typeof raw.audioTracks === 'object'
      ? (raw.audioTracks as TutorialAudioTracksMap)
      : undefined;
  const builtinRunner =
    typeof raw.builtinRunner === 'string' ? raw.builtinRunner : undefined;
  return { version: 1, audioTracks, builtinRunner };
}

function parsePayload(raw: unknown): SurvivalTutorialScriptPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (isTutorialScriptPayload(raw)) {
    return raw;
  }
  return parseLegacyPayload(o);
}

export function isInterpretedTutorialScript(
  script: SurvivalTutorialScriptPayload,
): script is TutorialScriptPayload {
  return isTutorialScriptPayload(script);
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
