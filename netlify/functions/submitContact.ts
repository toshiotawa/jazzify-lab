/**
 * お問い合わせ送信: Supabase contact_messages へ保存し、Netlify Forms へも転送する。
 */

import type { Handler } from '@netlify/functions';
import {
  buildNetlifyFormBody,
  normalizeContactInput,
  validateContactInput,
} from '../../src/utils/contactSubmission';
import { getSupabaseServiceClient } from './lib/lemonNetlifyCommon';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const USER_AGENT_MAX_LENGTH = 500;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const truncateUserAgent = (raw: string | undefined): string | null => {
  if (!raw) {
    return null;
  }
  return raw.length > USER_AGENT_MAX_LENGTH
    ? raw.slice(0, USER_AGENT_MAX_LENGTH)
    : raw;
};

const resolveUserId = async (authHeader: string | undefined): Promise<string | null> => {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (token.length === 0) {
    return null;
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }
  return data.user.id;
};

const getNetlifyFormsUrl = (): string => {
  const base = process.env.URL ?? 'https://jazzify.jp';
  return `${base.replace(/\/$/, '')}/contact`;
};

const forwardToNetlifyForms = async (
  input: ReturnType<typeof normalizeContactInput>,
): Promise<boolean> => {
  try {
    const response = await fetch(getNetlifyFormsUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: buildNetlifyFormBody(input),
    });
    return response.ok;
  } catch {
    return false;
  }
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(event.body ?? '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  if (!isRecord(parsedBody)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid body' }) };
  }

  const input = normalizeContactInput(parsedBody);

  if (input.botField.length > 0) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  const validation = validateContactInput(input);
  if (!validation.ok) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid input', reason: validation.reason }),
    };
  }

  const userId = await resolveUserId(event.headers.authorization ?? event.headers.Authorization);
  const userAgent = truncateUserAgent(
    event.headers['user-agent'] ?? event.headers['User-Agent'],
  );

  const supabase = getSupabaseServiceClient();
  const netlifyForwarded = await forwardToNetlifyForms(input);

  const { error: insertError } = await supabase.from('contact_messages').insert({
    user_id: userId,
    name: input.name,
    email: input.email,
    message: input.message,
    source: input.source,
    locale: input.locale ?? null,
    app_version: input.appVersion ?? null,
    user_agent: userAgent,
    netlify_forwarded: netlifyForwarded,
  });

  const dbSaved = !insertError;

  if (dbSaved || netlifyForwarded) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  return {
    statusCode: 502,
    headers,
    body: JSON.stringify({ error: 'Failed to save contact message' }),
  };
};
