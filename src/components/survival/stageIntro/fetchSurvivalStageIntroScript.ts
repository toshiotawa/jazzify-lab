import { getSupabaseClient } from '@/platform/supabaseClient';
import type { SurvivalMapCategory } from '@/platform/supabaseSurvival';
import { buildBundledSurvivalStageIntroScript } from './buildSurvivalStageIntroScripts';
import {
  parseSurvivalStageIntroScript,
  type SurvivalStageIntroMapCategory,
  type SurvivalStageIntroScript,
} from './survivalStageIntroScriptTypes';

const isStageIntroCategory = (c: SurvivalMapCategory): c is SurvivalStageIntroMapCategory =>
  c === 'basic' || c === 'songs' || c === 'phrases';

export async function fetchSurvivalStageIntroScript(
  mapCategory: SurvivalMapCategory,
): Promise<SurvivalStageIntroScript> {
  if (!isStageIntroCategory(mapCategory)) {
    return buildBundledSurvivalStageIntroScript('basic');
  }
  const fallback = (): SurvivalStageIntroScript =>
    buildBundledSurvivalStageIntroScript(mapCategory);

  try {
    const { data, error } = await getSupabaseClient()
      .from('survival_stage_intro_scripts')
      .select('script')
      .eq('map_category', mapCategory)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data?.script) {
      return fallback();
    }
    const parsed = parseSurvivalStageIntroScript(data.script);
    return parsed ?? fallback();
  } catch {
    return fallback();
  }
}
