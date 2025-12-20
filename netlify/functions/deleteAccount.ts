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

    // 匿名化用のメールアドレスを生成
    const anonymizedEmail = `deleted_${user.id}@deleted.local`;

    // 1. Auth ユーザーのメールアドレスを変更（これにより元のメールでログイン不可になる）
    const { error: authUpdateErr } = await supabase.auth.admin.updateUserById(user.id, {
      email: anonymizedEmail,
      email_confirm: true, // メール確認済みとしてマーク
    });
    if (authUpdateErr) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to update auth email', details: authUpdateErr.message }) };
    }

    // 2. プロフィール匿名化（外部キーを保つ）
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
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to anonymize profile', details: anonErr.message }) };
    }

    // 3. Supabase Authユーザーの削除を試みる（失敗しても退会は完了）
    // 注意: 外部キー制約により削除が失敗する場合があるが、
    // メールアドレスが変更されているため元のアドレスでログインできない
    await supabase.auth.admin.deleteUser(user.id).catch(() => {});
    
    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ 
        success: true,
        message: '退会が完了しました。ご利用ありがとうございました。'
      }) 
    };
  } catch (error: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', details: error?.message }) };
  }
};

