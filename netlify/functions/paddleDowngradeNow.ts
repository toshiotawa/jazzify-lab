import { createClient } from '@supabase/supabase-js';

interface NetlifyEvent {
  httpMethod: string;
  headers: Record<string, string | undefined>;
  body?: string;
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler = async (event: NetlifyEvent) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const authHeader = event.headers.authorization as string | undefined;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing authorization token' }) };
    }
    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) };
    }

    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('rank')
      .eq('id', user.id)
      .single();
    if (profErr) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch profile' }) };
    }

    if (profile?.rank !== 'standard_global') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Only Standard(Global) can be downgraded immediately' }) };
    }

    const { error: updErr } = await supabase
      .from('profiles')
      .update({
        rank: 'free',
        will_cancel: false,
        cancel_date: null,
        downgrade_to: null,
        downgrade_date: null,
      })
      .eq('id', user.id);

    if (updErr) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to downgrade' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', details: message }) };
  }
};

