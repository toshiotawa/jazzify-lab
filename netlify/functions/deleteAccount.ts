import { createClient } from '@supabase/supabase-js';

export const handler = async (event: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // プリフライトリクエストの処理
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // 環境変数のチェック
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Server Error: Missing Supabase environment variables');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server configuration error' }),
    };
  }

  try {
    // Supabaseクライアントの初期化
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing authorization token' }) };
    }

    const token = authHeader.substring(7);
    
    // トークンの検証
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth Error:', authError);
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) };
    }

    // Freeガード: Freeでない場合は停止
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('rank, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profErr) {
      console.error('Profile Fetch Error:', profErr);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch profile' }) };
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
      console.error('Anonymize Error:', anonErr);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to anonymize profile' }) };
    }

    // Supabase Authユーザーを削除（以降ログイン不可）
    const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
    
    if (delErr) {
      console.error('Delete User Error:', delErr);
      // プロフィールの匿名化は済んでいるので、ここは200を返すべきか迷うが、
      // 完全に削除できていないので500を返すか、あるいは部分成功とするか。
      // 一旦エラーとして返す。
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to delete auth user' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };

  } catch (error: any) {
    console.error('Unhandled Error:', error);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error?.message || 'Unknown error' 
      }) 
    };
  }
};
