import { getSupabaseClient } from '@/platform/supabaseClient';
import type { SurvivalMapCategory } from '@/platform/supabaseSurvival';
import { buildBundledSurvivalBlockBossIntroScript } from './buildSurvivalBlockBossIntroScripts';
import {
  parseSurvivalStageIntroScript,
  type SurvivalStageIntroMapCategory,
  type SurvivalStageIntroScript,
} from './survivalStageIntroScriptTypes';

const isStageIntroCategory = (c: SurvivalMapCategory): c is SurvivalStageIntroMapCategory =>
  c === 'basic' || c === 'songs' || c === 'phrases';

/** ブロック1 最終ステージのボス戦タイムド台本（`survival_block_boss_intro_scripts`）。 */
export async function fetchSurvivalBlockBossIntroScript(
  mapCategory: SurvivalMapCategory,
): Promise<SurvivalStageIntroScript> {
  if (!isStageIntroCategory(mapCategory)) {
    return buildBundledSurvivalBlockBossIntroScript('basic');
  }
  const fallback = (): SurvivalStageIntroScript =>
    buildBundledSurvivalBlockBossIntroScript(mapCategory);

  try {
    const { data, error } = await getSupabaseClient()
      .from('survival_block_boss_intro_scripts')
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
