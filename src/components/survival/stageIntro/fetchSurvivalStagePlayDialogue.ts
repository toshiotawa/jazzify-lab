import { getSupabaseClient } from '@/platform/supabaseClient';
import type { SurvivalMapCategory } from '@/platform/supabaseSurvival';
import { buildBundledSurvivalStagePlayDialogue } from './buildSurvivalStagePlayDialogueScripts';
import {
  parseSurvivalStageIntroScript,
  type SurvivalStageIntroScript,
} from './survivalStageIntroScriptTypes';

export async function fetchSurvivalStagePlayDialogue(
  mapCategory: SurvivalMapCategory,
  stageNumber: number,
): Promise<SurvivalStageIntroScript | null> {
  const bundled = buildBundledSurvivalStagePlayDialogue(mapCategory, stageNumber);
  try {
    const { data, error } = await getSupabaseClient()
      .from('survival_stage_play_dialogues')
      .select('script')
      .eq('map_category', mapCategory)
      .eq('stage_number', stageNumber)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data?.script) {
      return bundled;
    }
    const parsed = parseSurvivalStageIntroScript(data.script);
    return parsed ?? bundled;
  } catch {
    return bundled;
  }
}
