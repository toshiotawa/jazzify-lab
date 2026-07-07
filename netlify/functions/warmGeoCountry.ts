/**
 * getGeoCountry Edge Function のコールドスタート緩和（15分毎に自サイトへ HEAD）。
 */

const resolveSiteOrigin = (): string => {
  const url = process.env.URL ?? process.env.DEPLOY_URL ?? process.env.SITE_URL;
  if (typeof url === 'string' && url.length > 0) {
    return url.replace(/\/$/, '');
  }
  return 'https://jazzify.jp';
};

export const handler = async (): Promise<{ statusCode: number; body: string }> => {
  const origin = resolveSiteOrigin();
  try {
    await fetch(`${origin}/.netlify/functions/getGeoCountry`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
  } catch {
    return { statusCode: 200, body: JSON.stringify({ warmed: false }) };
  }
  return { statusCode: 200, body: JSON.stringify({ warmed: true }) };
};
