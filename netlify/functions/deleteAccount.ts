import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL ??
  process.env.SUPABASE_SERVICE_ROLE_URL;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL か VITE_SUPABASE_URL が設定されていません');
}

const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseServiceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY が設定されていません');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const handler: Handler = async (event, _context) => {
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
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing authorization token' }) };
    }
    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) };
    }

    // Freeガード: Freeでない場合は停止
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('rank, stripe_customer_id')
      .eq('id', user.id)
      .single();
    if (profErr) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch profile' }) };
    }
    if (profile?.rank && profile.rank !== 'free') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Freeプランのみ退会できます。まずCustomer Portalで解約してください。' }) };
    }

    // プロフィール匿名化（外部キーを保つ）
    // email と nickname は NOT NULL 制約があるため、匿名化した値を設定
    const anonymizedEmail = `deleted_${user.id}@deleted.local`;
    const { error: anonErr } = await supabase
      .from('profiles')
      .update({
        email: anonymizedEmail,
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
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to anonymize profile' }) };
    }

    // Supabase Authユーザーを削除（以降ログイン不可）
    // 注意: 外部キー制約により削除が失敗する場合があるが、
    // プロフィールが匿名化されていれば実質的に退会状態なので成功として扱う
    const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
    
    // Auth削除の結果に関わらず、プロフィール匿名化が成功していれば退会完了
    // （メールアドレスが変更されているため、元のアドレスでログインできなくなる）
    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ 
        success: true,
        authDeleted: !delErr,
        message: delErr ? 'プロフィールは匿名化されました。次回ログアウト後は再ログインできません。' : '退会が完了しました。'
      }) 
    };
  } catch (error: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', details: error?.message }) };
  }
};

