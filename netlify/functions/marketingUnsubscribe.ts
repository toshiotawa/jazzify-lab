/**
 * メルマガ配信停止。メール内リンク（uid + HMACトークン）から GET で呼ばれ、
 * profiles.marketing_email_opt_in を false にして完了ページ（HTML）を返す。
 */

import type { Handler } from '@netlify/functions';
import { getSupabaseServiceClient } from './lib/lemonNetlifyCommon';
import { verifyUnsubscribeToken } from './lib/marketingEmailDelivery';

const htmlResponse = (statusCode: number, title: string, message: string) => ({
  statusCode,
  headers: { 'Content-Type': 'text/html; charset=utf-8' },
  body: `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#1e293b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:60px 20px;">
    <div style="background-color:#334155;border-radius:12px;padding:40px;text-align:center;">
      <h1 style="color:#ffffff;font-size:20px;margin:0 0 16px;">${title}</h1>
      <p style="color:#cbd5e1;font-size:14px;line-height:1.8;margin:0;">${message}</p>
    </div>
  </div>
</body>
</html>`,
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const uid = event.queryStringParameters?.uid ?? '';
  const token = event.queryStringParameters?.token ?? '';
  if (!uid || !token || !verifyUnsubscribeToken(uid, token)) {
    return htmlResponse(
      400,
      'リンクが無効です / Invalid link',
      'このリンクは無効です。お手数ですが、メール内の配信停止リンクをもう一度お試しください。<br>This unsubscribe link is invalid. Please try the link in your email again.',
    );
  }

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from('profiles')
    .update({ marketing_email_opt_in: false })
    .eq('id', uid);
  if (error) {
    return htmlResponse(
      500,
      'エラーが発生しました / Something went wrong',
      '配信停止の処理に失敗しました。しばらくしてから再度お試しください。<br>We could not process your request. Please try again later.',
    );
  }

  return htmlResponse(
    200,
    '配信停止が完了しました / Unsubscribed',
    'Jazzifyからのお知らせメールの配信を停止しました。<br>You will no longer receive marketing emails from Jazzify.',
  );
};
