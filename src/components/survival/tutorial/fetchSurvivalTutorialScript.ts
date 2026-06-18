import { getSupabaseClient } from '@/platform/supabaseClient';
import { buildOnboardingV1Script } from './buildOnboardingV1Script';
import type { TutorialAudioTracksMap } from './TutorialAudioController';
import {
  isTutorialScriptPayload,
  type TutorialScriptPayload,
} from './tutorialScriptTypes';
import {
  isSurvivalTutorialScriptPayloadV3,
  type SurvivalTutorialScriptPayloadV3,
} from './survivalTutorialV3ScriptTypes';
import { isSurvivalTutorialV4Manifest, type SurvivalTutorialV4Manifest } from './v4/survivalTutorialV4Types';
import { survivalTutorialV4ManifestToV3Payload } from './v4/survivalTutorialV4ManifestToV3Payload';
import sampleV4ManifestJson from './v4/__fixtures__/sampleStageV4.manifest.json';

export interface SurvivalTutorialLegacyPayload {
  version: 1;
  audioTracks?: TutorialAudioTracksMap;
  builtinRunner?: string;
}

export type SurvivalTutorialScriptPayload =
  | TutorialScriptPayload
  | SurvivalTutorialLegacyPayload
  | SurvivalTutorialScriptPayloadV3;

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

/** V4 ブリッジ動作確認用のバンドルサンプル(`#...?scriptId=survival-tutorial-v4-sample`)。 */
const BUNDLED_V4_SAMPLE_ID = 'survival-tutorial-v4-sample';

function buildBundledV4SampleRow(): SurvivalTutorialScriptRow | null {
  const parsed = parsePayload(sampleV4ManifestJson);
  if (!parsed) return null;
  return {
    id: BUNDLED_V4_SAMPLE_ID,
    title: 'サバイバルチュートリアル V4（サンプル）',
    title_en: 'Survival Tutorial V4 (sample)',
    script: parsed,
  };
}

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

/** ネイティブ V4 ランタイム用のバンドル manifest（DB 未配置時の fallback）。 */
const BUNDLED_V4_NATIVE_ID = 'survival-tutorial-v4-native';

function resolveBundledV4Manifest(scriptId: string): SurvivalTutorialV4Manifest | null {
  if (scriptId !== BUNDLED_V4_SAMPLE_ID && scriptId !== BUNDLED_V4_NATIVE_ID) {
    return null;
  }
  if (!isSurvivalTutorialV4Manifest(sampleV4ManifestJson)) return null;
  return sampleV4ManifestJson;
}

/** version 4 manifest をそのまま返す（V3 ブリッジ変換なし）。見つからなければ null。 */
export async function fetchSurvivalTutorialV4Manifest(
  scriptId: string,
): Promise<SurvivalTutorialV4Manifest | null> {
  const bundled = resolveBundledV4Manifest(scriptId);
  if (bundled) return bundled;

  try {
    const { data, error } = await getSupabaseClient()
      .from('survival_tutorial_scripts')
      .select('script')
      .eq('id', scriptId)
      .eq('is_active', true)
      .maybeSingle();
    if (error || !data) return null;
    if (isSurvivalTutorialV4Manifest(data.script)) {
      return data.script;
    }
  } catch {
    return null;
  }
  return null;
}

function parsePayload(raw: unknown): SurvivalTutorialScriptPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  // V4 manifest はブリッジ段階では V3 ペイロードへ変換して既存ランタイムで駆動する。
  if (isSurvivalTutorialV4Manifest(raw)) {
    return survivalTutorialV4ManifestToV3Payload(raw);
  }
  if (isSurvivalTutorialScriptPayloadV3(raw)) {
    return raw;
  }
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

export function isSurvivalTutorialScriptV3(
  script: SurvivalTutorialScriptPayload,
): script is SurvivalTutorialScriptPayloadV3 {
  return isSurvivalTutorialScriptPayloadV3(script);
}

export async function fetchSurvivalTutorialScript(
  scriptId: string,
): Promise<SurvivalTutorialScriptRow> {
  if (scriptId === BUNDLED_V4_SAMPLE_ID) {
    const row = buildBundledV4SampleRow();
    if (row) return row;
    throw new Error(`Invalid bundled v4 sample: ${scriptId}`);
  }

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
