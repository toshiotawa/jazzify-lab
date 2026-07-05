/**
 * iOS 向け GA4 Measurement Protocol プロキシ。
 * api_secret をクライアントに埋め込まないための中継。マイルストーンは iOS から Supabase RPC 直叩き。
 */

import type { Handler } from '@netlify/functions';
import { sendGa4Event } from './lib/ga4MeasurementProtocol';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const ALLOWED_EVENTS = new Set([
  'first_open',
  'sign_up_click',
  'sign_up',
  'tutorial_begin',
  'tutorial_complete',
  'paywall_view',
  'begin_checkout',
  'purchase',
]);

type JsonPrimitive = string | number | boolean;

interface IosAnalyticsBody {
  client_id?: unknown;
  event_name?: unknown;
  params?: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const sanitizeParams = (raw: unknown): Record<string, JsonPrimitive> | undefined => {
  if (!isRecord(raw)) {
    return undefined;
  }

  const params: Record<string, JsonPrimitive> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (
      typeof value === 'string'
      || typeof value === 'number'
      || typeof value === 'boolean'
    ) {
      params[key] = value;
    }
  }
  return Object.keys(params).length > 0 ? params : undefined;
};

const isValidClientId = (value: unknown): value is string =>
  typeof value === 'string' && value.length >= 8 && value.length <= 64;

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body: IosAnalyticsBody;
  try {
    body = JSON.parse(event.body ?? '{}') as IosAnalyticsBody;
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  if (!isValidClientId(body.client_id)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid client_id' }) };
  }

  const eventName = body.event_name;
  if (typeof eventName !== 'string' || !ALLOWED_EVENTS.has(eventName)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid event_name' }) };
  }

  await sendGa4Event(body.client_id, eventName, sanitizeParams(body.params));

  return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
};
