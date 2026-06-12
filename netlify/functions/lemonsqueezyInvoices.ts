import {
  authenticateRequest,
  billingCorsHeaders,
} from './lib/lemonNetlifyCommon';
import { listBillingInvoicesForUser } from './lib/lemonBillingPersistence';
import { syncUserBillingInvoicesFromLemon } from './lib/lemonBillingInvoiceSync';
import { coerceStoredAmountToMajorUnits, formatInvoiceAmountLabel } from './lib/lemonMonetaryAmount';

interface NetlifyEvent {
  httpMethod: string;
  headers: Record<string, string | undefined>;
}

const invoiceSortKey = (row: {
  paid_at: string | null;
  provider_created_at: string | null;
  created_at: string;
}): number => {
  const raw = row.paid_at ?? row.provider_created_at ?? row.created_at;
  const ms = new Date(raw).getTime();
  return Number.isFinite(ms) ? ms : 0;
};

const formatStatusLabel = (status: string | null): string | null => {
  if (!status) return null;
  const normalized = status.toLowerCase();
  if (normalized === 'paid') return '支払い済み';
  if (normalized === 'refunded') return '返金済み';
  if (normalized === 'pending') return '処理中';
  if (normalized === 'failed') return '失敗';
  return status;
};

const formatTotalLabel = (total: number | null, currency: string | null): string | null =>
  formatInvoiceAmountLabel(coerceStoredAmountToMajorUnits(total), currency);

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: billingCorsHeaders };
  }
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: billingCorsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const authResult = await authenticateRequest(authHeader);
    if ('error' in authResult) {
      return {
        statusCode: authResult.statusCode,
        headers: billingCorsHeaders,
        body: JSON.stringify({ error: authResult.error }),
      };
    }

    const { supabase, userId } = authResult;
    let rows = await listBillingInvoicesForUser(supabase, userId);

    if (rows.length === 0) {
      await syncUserBillingInvoicesFromLemon(supabase, userId);
      rows = await listBillingInvoicesForUser(supabase, userId);
    }

    const sorted = [...rows].sort((a, b) => invoiceSortKey(b) - invoiceSortKey(a));

    const invoices = sorted.map((row) => ({
      id: row.provider_invoice_id,
      created_at: row.provider_created_at ?? row.paid_at ?? row.created_at,
      status: row.status,
      status_formatted: formatStatusLabel(row.status),
      total_formatted: formatTotalLabel(row.total, row.currency),
      invoice_url: row.invoice_url,
      plan_code: row.plan_code,
    }));

    return {
      statusCode: 200,
      headers: billingCorsHeaders,
      body: JSON.stringify({ invoices }),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      statusCode: 500,
      headers: billingCorsHeaders,
      body: JSON.stringify({ error: 'Internal server error', details: message }),
    };
  }
};
