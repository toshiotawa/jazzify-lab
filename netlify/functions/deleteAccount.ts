import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 環境変数の存在確認（ログ出力のみ、実行は継続させるが失敗する可能性が高い）
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Required environment variables are missing: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(
  supabaseUrl || '',
  supabaseServiceRoleKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export const handler = async (event: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing authorization token' }) };
    }
    const token = authHeader.substring(7);
    
    // ユーザー検証
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token', details: authError?.message }) };
    }

    // Freeガード: Freeでない場合は停止
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('rank, stripe_customer_id')
      .eq('id', user.id)
      .single();
      
    if (profErr) {
      console.error('Profile fetch error:', profErr);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch profile', details: profErr.message }) };
    }
    
    if (profile?.rank && profile.rank !== 'free') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Freeプランのみ退会できます。まずCustomer Portalで解約してください。' }) };
    }

    // プロフィール匿名化（外部キーを保つ）
    const { error: anonErr } = await supabase
      .from('profiles')
      .update({
        email: null,
        nickname: '退会ユーザー',
        bio: null,
        twitter_handle: null,
        avatar_url: null,
        stripe_customer_id: null,
        will_cancel: false,
        cancel_date: null,
        downgrade_to: null,
        downgrade_date: null,
      })
      .eq('id', user.id);
      
    if (anonErr) {
      console.error('Profile anonymization error:', anonErr);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to anonymize profile', details: anonErr.message }) };
    }

    // Supabase Authユーザーを削除（以降ログイン不可）
    const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
    if (delErr) {
      console.error('User deletion error:', delErr);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to delete auth user', details: delErr.message }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (error: any) {
    console.error('Delete account handler error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', details: error?.message || 'Unknown error' }) };
  }
};
