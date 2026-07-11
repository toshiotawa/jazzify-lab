import { getSupabaseClient } from '@/platform/supabaseClient';
import { buildEarTrainingDeveloperFullV1Script } from './buildEarTrainingDeveloperFullV1Script';
import {
  buildOsmdTimingAdjustmentV1Script,
  OSMD_TIMING_ADJUSTMENT_SCRIPT_ID,
} from './buildOsmdTimingAdjustmentV1Script';
import {
  isEarTrainingTutorialScriptPayload,
  type EarTrainingTutorialScriptPayload,
} from './earTrainingTutorialScriptTypes';

export interface EarTrainingTutorialScriptRow {
  id: string;
  title: string;
  title_en: string;
  script: EarTrainingTutorialScriptPayload;
}

const BUNDLED_DEVELOPER_FULL: EarTrainingTutorialScriptRow = {
  id: 'developer-full-v1',
  title: '耳コピチュートリアル（全分岐テスト）',
  title_en: 'Ear training tutorial (full branch test)',
  script: buildEarTrainingDeveloperFullV1Script(),
};

const BUNDLED_OSMD_TIMING_ADJUSTMENT: EarTrainingTutorialScriptRow = {
  id: OSMD_TIMING_ADJUSTMENT_SCRIPT_ID,
  title: 'OSMDタイミング調整チュートリアル',
  title_en: 'OSMD Timing Adjustment Tutorial',
  script: buildOsmdTimingAdjustmentV1Script(),
};

function parsePayload(raw: unknown): EarTrainingTutorialScriptPayload | null {
  if (isEarTrainingTutorialScriptPayload(raw)) {
    return raw;
  }
  return null;
}

export async function fetchEarTrainingTutorialScript(
  scriptId: string,
): Promise<EarTrainingTutorialScriptRow> {
  if (scriptId === OSMD_TIMING_ADJUSTMENT_SCRIPT_ID) {
    try {
      const { data, error } = await getSupabaseClient()
        .from('ear_training_tutorial_scripts')
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
    return BUNDLED_OSMD_TIMING_ADJUSTMENT;
  }

  if (scriptId === 'developer-full-v1') {
    try {
      const { data, error } = await getSupabaseClient()
        .from('ear_training_tutorial_scripts')
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
    return BUNDLED_DEVELOPER_FULL;
  }

  const { data, error } = await getSupabaseClient()
    .from('ear_training_tutorial_scripts')
    .select('id, title, title_en, script')
    .eq('id', scriptId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    throw new Error(`Ear training tutorial script not found: ${scriptId}`);
  }
  const parsed = parsePayload(data.script);
  if (!parsed) {
    throw new Error(`Invalid ear training tutorial script: ${scriptId}`);
  }
  return {
    id: data.id,
    title: data.title,
    title_en: data.title_en,
    script: parsed,
  };
}
