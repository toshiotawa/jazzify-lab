import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(
  supabaseUrl!,
  supabaseServiceRoleKey!
);

export const handler = async (event: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  console.log('deleteAccount function invoked');

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('Missing authorization token');
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing authorization token' }) };
    }
    const token = authHeader.substring(7);
    
    console.log('Verifying user token...');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) };
    }
    console.log('User verified:', user.id);

    // Freeガード: Freeでない場合は停止
    console.log('Fetching user profile...');
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('rank, stripe_customer_id')
      .eq('id', user.id)
      .single();
      
    if (profErr) {
      console.error('Profile fetch error:', profErr);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch profile' }) };
    }
    
    console.log('Profile rank:', profile?.rank);
    if (profile?.rank && profile.rank !== 'free') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Freeプランのみ退会できます。まずCustomer Portalで解約してください。' }) };
    }

    // プロフィール匿名化（外部キーを保つ）
    console.log('Anonymizing profile...');
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
      console.error('Anonymization error:', anonErr);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to anonymize profile', details: anonErr.message }) };
    }

    // Supabase Authユーザーを削除（以降ログイン不可）
    console.log('Deleting auth user...');
    const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
    
    if (delErr) {
      console.error('Delete user error:', delErr);
      // プロフィールは匿名化済みなので、ここは500エラーだが、
      // ユーザーにとっては「退会処理の一部失敗」となる。
      // ただし、Authユーザー削除失敗は重大なのでエラーを返す。
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to delete auth user', details: delErr.message }) };
    }

    console.log('Account deleted successfully');
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (error: any) {
    console.error('Unhandled error in deleteAccount:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', details: error?.message }) };
  }
};
