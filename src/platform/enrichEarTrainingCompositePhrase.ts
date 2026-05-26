import type { EarTrainingStage } from '@/types';
import { getSupabaseClient } from '@/platform/supabaseClient';
import {
  buildEarTrainingCompositeBootstrap,
  type EarTrainingCompositeConfigRow,
} from '@/utils/earTrainingCompositePhraseAdapter';

/** 複合フレーズステージに `compositePhraseBootstrap` を付与（未取得時は変更なし）。 */
export const enrichEarTrainingStageWithComposite = async (
  stage: EarTrainingStage,
): Promise<EarTrainingStage> => {
  if (!stage.chord_voicing_composite_phrase) {
    const { compositePhraseBootstrap: _drop, ...rest } = stage;
    return rest;
  }

  const supabase = getSupabaseClient();
  const { data: cfgRaw, error } = await supabase
    .from('ear_training_composite_phrase_config')
    .select('id, bgm_url, key_fifths')
    .eq('stage_id', stage.id)
    .maybeSingle();

  if (error || !cfgRaw || typeof cfgRaw.bgm_url !== 'string') {
    const { compositePhraseBootstrap: _drop, ...rest } = stage;
    return rest;
  }

  const cfg = cfgRaw as EarTrainingCompositeConfigRow;

  const { data: srcRows, error: srcErr } = await supabase
    .from('ear_training_composite_phrase_sources')
    .select('source_phrase_id')
    .eq('config_id', cfg.id)
    .order('sort_order', { ascending: true });

  if (srcErr || !srcRows?.length) {
    const { compositePhraseBootstrap: _drop, ...rest } = stage;
    return rest;
  }

  const ids = srcRows.map((r) => r.source_phrase_id as string);
  const bootstrap = buildEarTrainingCompositeBootstrap(stage, cfg, ids);

  if (!bootstrap) {
    const { compositePhraseBootstrap: _drop, ...rest } = stage;
    return rest;
  }

  return {
    ...stage,
    compositePhraseBootstrap: bootstrap,
  };
};
