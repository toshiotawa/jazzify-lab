import type { EarTrainingStage } from '@/types';
import { getSupabaseClient } from '@/platform/supabaseClient';
import {
  buildPhrasePairAdlibBootstrap,
  type EarTrainingAdlibPatternRow,
  type EarTrainingPhrasePairAdlibConfigRow,
  type EarTrainingPhrasePairAdlibStepRow,
} from '@/utils/earTrainingPhrasePairAdlibAdapter';

/** phrase_pair_adlib ステージに bootstrap を付与。 */
export const enrichEarTrainingStageWithPhrasePairAdlib = async (
  stage: EarTrainingStage,
): Promise<EarTrainingStage> => {
  if (stage.mode !== 'phrase_pair_adlib') {
    const { phrasePairAdlibBootstrap: _drop, ...rest } = stage;
    return rest;
  }

  const supabase = getSupabaseClient();
  const { data: cfgRaw, error } = await supabase
    .from('ear_training_phrase_pair_adlib_config')
    .select('id, bgm_url, key_fifths, loop_duration_sec')
    .eq('stage_id', stage.id)
    .maybeSingle();

  if (error || !cfgRaw || typeof cfgRaw.bgm_url !== 'string') {
    const { phrasePairAdlibBootstrap: _drop, ...rest } = stage;
    return rest;
  }

  const cfg = cfgRaw as EarTrainingPhrasePairAdlibConfigRow;

  const { data: stepRows, error: stepErr } = await supabase
    .from('ear_training_phrase_pair_adlib_steps')
    .select('id, order_index, chord_name, pattern_group_id, measure_number, start_time_sec, end_time_sec')
    .eq('config_id', cfg.id)
    .order('order_index', { ascending: true });

  if (stepErr || !stepRows?.length) {
    const { phrasePairAdlibBootstrap: _drop, ...rest } = stage;
    return rest;
  }

  const groupIds = [...new Set(stepRows.map((r) => r.pattern_group_id as string))];
  const { data: patternRows, error: patErr } = await supabase
    .from('ear_training_adlib_patterns')
    .select('id, group_id, label, pcs, family_id, carry_tail_length, priority, sort_order, voicing, voicing_staves')
    .in('group_id', groupIds)
    .order('sort_order', { ascending: true });

  if (patErr || !patternRows?.length) {
    const { phrasePairAdlibBootstrap: _drop, ...rest } = stage;
    return rest;
  }

  const bootstrap = buildPhrasePairAdlibBootstrap(
    cfg,
    stepRows as EarTrainingPhrasePairAdlibStepRow[],
    patternRows as EarTrainingAdlibPatternRow[],
  );

  if (!bootstrap) {
    const { phrasePairAdlibBootstrap: _drop, ...rest } = stage;
    return rest;
  }

  return {
    ...stage,
    phrasePairAdlibBootstrap: bootstrap,
  };
};
