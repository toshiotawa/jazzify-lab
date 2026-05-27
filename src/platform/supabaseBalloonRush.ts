import { getSupabaseClient } from '@/platform/supabaseClient';

import type { SurvivalStageIntroScript } from '@/components/survival/stageIntro/survivalStageIntroScriptTypes';
import { parseSurvivalStageIntroScript } from '@/components/survival/stageIntro/survivalStageIntroScriptTypes';

import { rowToBalloonRushResolvedStage, type BalloonRushResolvedStage } from '@/utils/balloonRushStageDefinitions';

export const fetchBalloonRushStageById = async (id: string): Promise<BalloonRushResolvedStage | null> => {
  const { data, error } = await getSupabaseClient()
    .from('balloon_rush_stages')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data || typeof data !== 'object') return null;
  return rowToBalloonRushResolvedStage(data as Record<string, unknown>);
};

export const fetchBalloonRushStagesForLessonAdmin = async (): Promise<BalloonRushResolvedStage[]> => {
  const { data, error } = await getSupabaseClient()
    .from('balloon_rush_stages')
    .select('*')
    .order('slug');

  if (error || !data) return [];
  return data
    .map(r => rowToBalloonRushResolvedStage(r as Record<string, unknown>))
    .filter(s => s.id.length > 0 && s.slug.length > 0);
};

export const fetchBalloonRushPlayDialogue = async (
  stageId: string,
): Promise<SurvivalStageIntroScript | null> => {
  const { data, error } = await getSupabaseClient()
    .from('balloon_rush_play_dialogues')
    .select('script')
    .eq('stage_id', stageId)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data?.script) return null;
  return parseSurvivalStageIntroScript(data.script);
};
