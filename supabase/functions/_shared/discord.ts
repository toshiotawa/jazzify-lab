const DISCORD_API_BASE = 'https://discord.com/api/v10';

export type AppLocale = 'ja' | 'en';

export interface DiscordEnvConfig {
  clientId: string;
  clientSecret: string;
  botToken: string;
  guildIdJa: string;
  guildIdEn: string;
  redirectUri: string;
  appBaseUrl: string;
}

export interface DiscordUserProfile {
  id: string;
  username: string;
}

export interface DiscordFetchResult {
  ok: boolean;
  status: number;
  retryAfterSeconds: number | null;
  body: unknown;
}

export interface KickEligibilityInput {
  rank: string | null | undefined;
  isAdmin: boolean | null | undefined;
}

export function readDiscordEnv(): DiscordEnvConfig {
  const clientId = Deno.env.get('DISCORD_CLIENT_ID') ?? '';
  const clientSecret = Deno.env.get('DISCORD_CLIENT_SECRET') ?? '';
  const botToken = Deno.env.get('DISCORD_BOT_TOKEN') ?? '';
  const guildIdJa = Deno.env.get('DISCORD_GUILD_ID_JA') ?? '';
  const guildIdEn = Deno.env.get('DISCORD_GUILD_ID_EN') ?? '';
  const redirectUri = Deno.env.get('DISCORD_REDIRECT_URI') ?? '';
  const appBaseUrl = Deno.env.get('APP_BASE_URL') ?? '';

  if (!clientId || !clientSecret || !botToken || !guildIdJa || !guildIdEn || !redirectUri || !appBaseUrl) {
    throw new Error('Missing Discord environment configuration');
  }

  return {
    clientId,
    clientSecret,
    botToken,
    guildIdJa,
    guildIdEn,
    redirectUri,
    appBaseUrl,
  };
}

export function resolveGuildId(locale: AppLocale, config: Pick<DiscordEnvConfig, 'guildIdJa' | 'guildIdEn'>): string {
  return locale === 'en' ? config.guildIdEn : config.guildIdJa;
}

export function isPaidRank(rank: string | null | undefined): boolean {
  return rank !== null && rank !== undefined && rank !== 'free';
}

export function canStartDiscordLink(rank: string | null | undefined, isAdmin: boolean | null | undefined): boolean {
  return isPaidRank(rank) || isAdmin === true;
}

export function shouldKickFromDiscord(input: KickEligibilityInput): boolean {
  if (input.isAdmin === true) {
    return false;
  }
  return !isPaidRank(input.rank);
}

export function buildDiscordAuthorizeUrl(
  config: Pick<DiscordEnvConfig, 'clientId' | 'redirectUri'>,
  state: string,
): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'identify guilds.join',
    state,
    prompt: 'consent',
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export function buildAppRedirectUrl(appBaseUrl: string, discordStatus: 'joined' | 'error'): string {
  const base = appBaseUrl.replace(/\/$/, '');
  return `${base}/#dashboard?discord=${discordStatus}`;
}

function parseRetryAfterSeconds(response: Response, body: unknown): number | null {
  const header = response.headers.get('retry-after');
  if (header) {
    const parsed = Number(header);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  if (body && typeof body === 'object' && 'retry_after' in body) {
    const retryAfter = (body as { retry_after?: unknown }).retry_after;
    if (typeof retryAfter === 'number' && retryAfter > 0) {
      return retryAfter;
    }
  }
  return null;
}

export async function discordFetch(
  path: string,
  init: RequestInit,
  botToken?: string,
): Promise<DiscordFetchResult> {
  const headers = new Headers(init.headers);
  if (botToken) {
    headers.set('Authorization', `Bot ${botToken}`);
  }
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${DISCORD_API_BASE}${path}`, {
    ...init,
    headers,
  });

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    retryAfterSeconds: parseRetryAfterSeconds(response, body),
    body,
  };
}

export async function exchangeDiscordCode(
  config: Pick<DiscordEnvConfig, 'clientId' | 'clientSecret' | 'redirectUri'>,
  code: string,
): Promise<string> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
  });

  const response = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const payload = await response.json() as { access_token?: string; error?: string };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error ?? 'Failed to exchange Discord OAuth code');
  }

  return payload.access_token;
}

export async function fetchDiscordUser(accessToken: string): Promise<DiscordUserProfile> {
  const result = await discordFetch('/users/@me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!result.ok || !result.body || typeof result.body !== 'object') {
    throw new Error('Failed to fetch Discord user profile');
  }

  const profile = result.body as { id?: string; username?: string };
  if (!profile.id) {
    throw new Error('Discord user profile missing id');
  }

  return {
    id: profile.id,
    username: profile.username ?? 'unknown',
  };
}

export async function addGuildMember(
  botToken: string,
  guildId: string,
  discordUserId: string,
  accessToken: string,
): Promise<DiscordFetchResult> {
  return discordFetch(
    `/guilds/${guildId}/members/${discordUserId}`,
    {
      method: 'PUT',
      body: JSON.stringify({ access_token: accessToken }),
    },
    botToken,
  );
}

export async function removeGuildMember(
  botToken: string,
  guildId: string,
  discordUserId: string,
): Promise<DiscordFetchResult> {
  return discordFetch(
    `/guilds/${guildId}/members/${discordUserId}`,
    { method: 'DELETE' },
    botToken,
  );
}

export async function sleepMs(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
