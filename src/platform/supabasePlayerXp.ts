import { getSupabaseClient } from '@/platform/supabaseClient';

type PlayerXpReason =
  | 'survival_stage_first_clear'
  | 'lesson_first_clear';

export interface AwardPlayerXpResult {
  gainedXp: number;
  duplicate: boolean;
  previousLevel: number;
  newLevel: number;
  leveledUp: boolean;
  totalXp: number;
  inLevelXp: number;
  nextLevelXp: number;
}

export interface PlayerLevelUiState {
  totalXp: number;
  level: number;
  inLevelXp: number;
  nextLevelXp: number;
}

function rpcError(payload: Record<string, unknown>): string | null {
  const err = payload.error;
  return typeof err === 'string' && err.length > 0 ? err : null;
}

function coerceInt(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return fallback;
}

function coerceBool(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function parseAwardPayload(json: Record<string, unknown>): AwardPlayerXpResult {
  const err = rpcError(json);
  if (err !== null) {
    throw new Error(err);
  }
  return {
    gainedXp: coerceInt(json.gained_xp, 0),
    duplicate: coerceBool(json.duplicate, false),
    previousLevel: coerceInt(json.previous_level, 1),
    newLevel: coerceInt(json.new_level, 1),
    leveledUp: coerceBool(json.leveled_up, false),
    totalXp: coerceInt(json.total_xp, 0),
    inLevelXp: coerceInt(json.in_level_xp, 0),
    nextLevelXp: coerceInt(json.next_level_xp, 90),
  };
}

function parseLevelStatePayload(json: Record<string, unknown>): PlayerLevelUiState {
  const err = rpcError(json);
  if (err !== null) {
    throw new Error(err);
  }
  return {
    totalXp: coerceInt(json.total_xp, 0),
    level: coerceInt(json.level, 1),
    inLevelXp: coerceInt(json.in_level_xp, 0),
    nextLevelXp: coerceInt(json.next_level_xp, 90),
  };
}

/** Idempotent XP award (duplicate source_id returns gainedXp 0). */
export async function awardPlayerXp(
  reason: PlayerXpReason,
  sourceId: string,
  amount: number,
): Promise<AwardPlayerXpResult> {
  const supabase = getSupabaseClient();
  const trimmed = sourceId.trim();
  if (!trimmed) {
    throw new Error('Missing source id for XP award');
  }
  const { data, error } = await supabase.rpc('award_player_xp', {
    p_reason: reason,
    p_source_id: trimmed,
    p_amount: Math.trunc(amount),
  });

  if (error) throw new Error(error.message);
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error('Invalid RPC response shape');
  }
  return parseAwardPayload(data as Record<string, unknown>);
}

/** Current player_* track totals for dashboards. */
export async function fetchPlayerLevelState(): Promise<PlayerLevelUiState> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('get_player_level_state');

  if (error) throw new Error(error.message);
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error('Invalid RPC response shape');
  }
  return parseLevelStatePayload(data as Record<string, unknown>);
}
