// @ts-nocheck
// deno-lint-ignore-file

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.24.0';

// Environment variables are injected by Supabase when deployed
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * シーズン切替バッチ
 * - profiles テーブルの next_season_xp_multiplier を 1 にリセット
 * - 実行スケジュール: 毎月 1日 00:00 UTC (Supabase ダッシュボードで設定)
 */
serve(async () => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ next_season_xp_multiplier: 1 })
      .neq('next_season_xp_multiplier', 1);
    if (error) throw error;
    return new Response('Season multiplier reset OK', { status: 200 });
  } catch (e) {
    console.error('reset-season-multiplier error', e);
    return new Response('Error', { status: 500 });
  }
}); 