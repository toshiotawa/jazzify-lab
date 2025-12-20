import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

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

// Resendクライアント（APIキーがない場合はnull）
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * 退会完了メールを送信
 */
async function sendWithdrawalEmail(email: string): Promise<void> {
  if (!resend) {
    console.log('RESEND_API_KEY not set, skipping withdrawal email');
    return;
  }

  try {
    await resend.emails.send({
      from: 'Jazzify <noreply@jazzify.jp>',
      to: email,
      subject: '【Jazzify】退会手続きが完了しました',
      html: `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #334155; border-radius: 12px; padding: 40px; text-align: center;">
      <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 20px;">退会手続きが完了しました</h1>
      <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
        Jazzifyをご利用いただき、誠にありがとうございました。<br>
        アカウント情報は匿名化され、ログインできなくなりました。
      </p>
      <div style="background-color: #1e293b; border-radius: 8px; padding: 20px; margin: 0 0 30px; text-align: left;">
        <p style="color: #94a3b8; font-size: 14px; margin: 0 0 10px;">
          ✓ アカウント情報は匿名化されました
        </p>
        <p style="color: #94a3b8; font-size: 14px; margin: 0 0 10px;">
          ✓ ログインセッションは終了しました
        </p>
        <p style="color: #94a3b8; font-size: 14px; margin: 0;">
          ✓ 同じメールアドレスで再登録が可能です
        </p>
      </div>
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 30px;">
        またのご利用をお待ちしております。
      </p>
      <a href="https://jazzify.jp/" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600;">
        Jazzify公式サイトへ
      </a>
    </div>
    <p style="color: #64748b; font-size: 12px; text-align: center; margin: 20px 0 0;">
      © ${new Date().getFullYear()} Jazzify. All rights reserved.
    </p>
  </div>
</body>
</html>
      `.trim(),
    });
    console.log('Withdrawal email sent successfully to:', email);
  } catch (error) {
    console.error('Failed to send withdrawal email:', error);
    // メール送信失敗は退会処理に影響させない
  }
}

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
      .select('rank, stripe_customer_id, email')
      .eq('id', user.id)
      .single();
    if (profErr) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch profile' }) };
    }
    if (profile?.rank && profile.rank !== 'free') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Freeプランのみ退会できます。まずCustomer Portalで解約してください。' }) };
    }

    // 退会完了メール送信用にオリジナルのメールアドレスを保存
    const originalEmail = profile?.email || user.email;

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

    // 3. 全セッションを無効化（クライアントのトークンを無効にする）
    // これにより、リロードしてもログイン状態が保持されなくなる
    const { error: signOutError } = await supabase.auth.admin.signOut(user.id, 'global');
    if (signOutError) {
      console.error('Failed to sign out user sessions:', signOutError.message);
      // 続行する - セッション無効化に失敗しても退会処理は完了させる
    }

    // 4. Supabase Authユーザーの削除を試みる（失敗しても退会は完了）
    // 注意: 外部キー制約により削除が失敗する場合があるが、
    // メールアドレスが変更されているため元のアドレスでログインできない
    await supabase.auth.admin.deleteUser(user.id).catch(() => {});

    // 5. 退会完了メールを送信（非同期で実行、失敗しても退会は完了）
    if (originalEmail && !originalEmail.includes('@deleted.local')) {
      await sendWithdrawalEmail(originalEmail);
    }
    
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

