/**
 * `.env.r2` と process.env から R2 / Wrangler 用の値を取り出す。
 */

/**
 * @param {Record<string, string>} envR2
 * @param {NodeJS.ProcessEnv} [base]
 */
export function r2AccountIdFrom(envR2, base = process.env) {
  return (
    base.CLOUDFLARE_ACCOUNT_ID ||
    envR2.CLOUDFLARE_ACCOUNT_ID ||
    envR2.CF_ACCOUNT_ID ||
    envR2.VITE_CLOUDFLARE_ACCOUNT_ID ||
    base.CF_ACCOUNT_ID ||
    ''
  );
}

/**
 * R2 S3 互換 API 用（--s3 モード）
 * @param {Record<string, string>} envR2
 * @param {NodeJS.ProcessEnv} [base]
 */
export function r2S3CredentialsFrom(envR2, base = process.env) {
  const accountId = r2AccountIdFrom(envR2, base);
  const accessKey =
    envR2.CF_ACCESS_KEY ||
    base.CF_ACCESS_KEY ||
    envR2.AWS_ACCESS_KEY_ID ||
    base.AWS_ACCESS_KEY_ID ||
    envR2.R2_ACCESS_KEY_ID ||
    base.R2_ACCESS_KEY_ID ||
    envR2.VITE_CLOUDFLARE_ACCESS_KEY_ID ||
    base.VITE_CLOUDFLARE_ACCESS_KEY_ID ||
    '';
  const secretKey =
    envR2.CF_SECRET_KEY ||
    base.CF_SECRET_KEY ||
    envR2.AWS_SECRET_ACCESS_KEY ||
    base.AWS_SECRET_ACCESS_KEY ||
    envR2.R2_SECRET_ACCESS_KEY ||
    base.R2_SECRET_ACCESS_KEY ||
    envR2.VITE_CLOUDFLARE_SECRET_ACCESS_KEY ||
    base.VITE_CLOUDFLARE_SECRET_ACCESS_KEY ||
    '';
  return { accountId, accessKey, secretKey };
}

/**
 * Wrangler 子プロセス用。非対話環境では CLOUDFLARE_API_TOKEN が必要なことがある。
 * @param {Record<string, string>} envR2
 * @param {NodeJS.ProcessEnv} [base]
 */
export function wranglerSpawnEnv(envR2, base = process.env) {
  const accountId = r2AccountIdFrom(envR2, base);
  const apiToken = base.CLOUDFLARE_API_TOKEN || envR2.CLOUDFLARE_API_TOKEN || '';
  return {
    ...base,
    ...(accountId ? { CLOUDFLARE_ACCOUNT_ID: accountId } : {}),
    ...(apiToken ? { CLOUDFLARE_API_TOKEN: apiToken } : {}),
  };
}
