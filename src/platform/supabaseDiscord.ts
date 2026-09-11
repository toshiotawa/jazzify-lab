import { getSupabaseClient } from '@/platform/supabaseClient';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;

export interface DiscordMembership {
  user_id: string;
  discord_user_id: string;
  guild_id: string;
  joined_at: string;
  last_checked_at: string | null;
}

export async function startDiscordLink(
  accessToken: string,
  locale: 'ja' | 'en',
): Promise<string> {
  const res = await fetch(`${supabaseUrl}/functions/v1/discord-link-start`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ locale }),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(payload.error ?? 'Failed to start Discord link');
  }

  const payload = await res.json() as { authorize_url?: string };
  if (!payload.authorize_url) {
    throw new Error('Missing Discord authorize URL');
  }

  return payload.authorize_url;
}

export async function fetchMyDiscordMembership(
  userId: string,
): Promise<DiscordMembership | null> {
  const { data, error } = await getSupabaseClient()
    .from('discord_memberships')
    .select('user_id, discord_user_id, guild_id, joined_at, last_checked_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
