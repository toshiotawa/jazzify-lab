import { getSupabaseClient, getCurrentUserIdCached } from '@/platform/supabaseClient';
import { getBadgeDefinitionById, type BadgeDefinition } from '@/utils/badgeDefinitions';
import type { SurvivalMapCategory } from '@/components/survival/SurvivalTypes';

export const BADGES_UPDATED_EVENT = 'jazzify:badges-updated';

type BadgeGrantEvent = 'survival_stage_clear' | 'level_reached' | 'quest_clear' | 'sync';

export interface BadgeEventParams {
  event: BadgeGrantEvent;
  mapCategory?: Extract<SurvivalMapCategory, 'basic' | 'songs' | 'phrases'>;
  stageNumber?: number;
  playerLevel?: number;
}

export interface EarnedBadge {
  badgeId: string;
  earnedAt: string;
  definition: BadgeDefinition;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseEarnedBadge(row: unknown): EarnedBadge | null {
  if (!isRecord(row)) return null;
  const badgeId = row.badge_id;
  const earnedAt = row.earned_at;
  if (typeof badgeId !== 'string' || typeof earnedAt !== 'string') return null;
  const definition = getBadgeDefinitionById(badgeId);
  if (!definition) return null;
  return { badgeId, earnedAt, definition };
}

function parseBadgeRows(payload: unknown): EarnedBadge[] {
  if (!Array.isArray(payload)) return [];
  const parsed: EarnedBadge[] = [];
  for (const item of payload) {
    const row = parseEarnedBadge(item);
    if (row) parsed.push(row);
  }
  return parsed;
}

function throwRpcPayloadError(payload: unknown): void {
  if (!isRecord(payload)) return;
  const error = payload.error;
  if (typeof error === 'string' && error.length > 0) {
    throw new Error(error);
  }
}

export async function fetchUserBadges(userId?: string): Promise<EarnedBadge[]> {
  const targetUserId = userId ?? await getCurrentUserIdCached();
  if (!targetUserId) {
    throw new Error('ログインが必要です');
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_badges')
    .select('badge_id, earned_at')
    .eq('user_id', targetUserId)
    .order('earned_at', { ascending: true });

  if (error) throw new Error(error.message);
  return parseBadgeRows(data);
}

export async function grantUserBadgesForEvent(params: BadgeEventParams): Promise<EarnedBadge[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('grant_user_badges_for_event', {
    p_event: params.event,
    p_map_category: params.mapCategory ?? null,
    p_stage_number: params.stageNumber ?? null,
    p_player_level: params.playerLevel ?? null,
  });

  if (error) throw new Error(error.message);
  throwRpcPayloadError(data);
  return parseBadgeRows(data);
}

export async function syncUserBadges(): Promise<EarnedBadge[]> {
  return grantUserBadgesForEvent({ event: 'sync' });
}

export function dispatchBadgesUpdated(grantedBadges: EarnedBadge[]): void {
  if (grantedBadges.length === 0 || typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<EarnedBadge[]>(BADGES_UPDATED_EVENT, { detail: grantedBadges }),
  );
}
