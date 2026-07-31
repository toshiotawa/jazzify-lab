import { getStoredFirstTouch, type FirstTouchData } from '@/utils/analytics/attribution';

const APP_STORE_LISTING_BASE =
  'https://apps.apple.com/app/apple-store/id6761457001';

/** App Store Connect のプロバイダトークン（Jazzify）。env 未設定時のフォールバック。 */
const DEFAULT_APP_STORE_PROVIDER_TOKEN = '128644431';

/** Apple Campaign Links の ct 最大長（安全側）。 */
const CAMPAIGN_TOKEN_MAX_LENGTH = 40;

export interface AppStoreCampaignParams {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  /** App Store Connect のプロバイダトークン。未指定時は env / 既定値を参照。 */
  providerToken?: string | null;
}

const sanitizeCampaignSegment = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const sanitized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return sanitized.length > 0 ? sanitized : null;
};

/**
 * UTM から App Store Campaign Link の ct を組み立てる。
 * 優先: source → campaign → content（medium は冗長になりやすいので除外）。
 */
export const buildAppStoreCampaignToken = (
  params: Pick<AppStoreCampaignParams, 'utm_source' | 'utm_campaign' | 'utm_content'>,
): string | null => {
  const parts = [
    sanitizeCampaignSegment(params.utm_source),
    sanitizeCampaignSegment(params.utm_campaign),
    sanitizeCampaignSegment(params.utm_content),
  ].filter((part): part is string => part !== null);

  if (parts.length === 0) {
    return null;
  }

  const joined = parts.join('_');
  if (joined.length <= CAMPAIGN_TOKEN_MAX_LENGTH) {
    return joined;
  }
  return joined.slice(0, CAMPAIGN_TOKEN_MAX_LENGTH).replace(/_+$/g, '');
};

const resolveProviderToken = (explicit?: string | null): string => {
  const fromArg = sanitizeCampaignSegment(explicit);
  if (fromArg) {
    return fromArg;
  }
  const fromEnv = import.meta.env.VITE_APP_STORE_PROVIDER_TOKEN;
  return (
    sanitizeCampaignSegment(typeof fromEnv === 'string' ? fromEnv : null) ??
    DEFAULT_APP_STORE_PROVIDER_TOKEN
  );
};

const LP_IOS_FALLBACK_PARAMS: AppStoreCampaignParams = {
  utm_source: 'lp',
  utm_campaign: 'ios',
};

/**
 * App Store Campaign Link を生成する。
 * - mt=8（App Store）は常に付与
 * - ct は UTM から生成（無ければ省略。LPボタンは FromFirstTouch 経由で lp_ios フォールバック）
 * - pt は providerToken → VITE_APP_STORE_PROVIDER_TOKEN → 既定トークン
 *
 * 注意: これは ASC のキャンペーン別 DL 集計用。個別ユーザーへの紐づけはできない。
 */
export const buildAppStoreCampaignUrl = (
  params: AppStoreCampaignParams = {},
  baseUrl: string = APP_STORE_LISTING_BASE,
): string => {
  const url = new URL(baseUrl);
  url.searchParams.set('mt', '8');
  url.searchParams.set('pt', resolveProviderToken(params.providerToken));

  const campaignToken = buildAppStoreCampaignToken(params);
  if (campaignToken) {
    url.searchParams.set('ct', campaignToken);
  }

  return url.toString();
};

/**
 * LP 着地時の first_touch UTM から App Store Campaign Link を作る。
 * UTM が無い場合は ct=lp_ios（従来の固定リンクと同等のラベル）。
 */
export const buildAppStoreCampaignUrlFromFirstTouch = (
  firstTouch: FirstTouchData | null = getStoredFirstTouch(),
): string => {
  if (!firstTouch) {
    return buildAppStoreCampaignUrl(LP_IOS_FALLBACK_PARAMS);
  }

  const campaignToken = buildAppStoreCampaignToken({
    utm_source: firstTouch.utm_source,
    utm_campaign: firstTouch.utm_campaign,
    utm_content: firstTouch.utm_content,
  });

  if (!campaignToken) {
    return buildAppStoreCampaignUrl(LP_IOS_FALLBACK_PARAMS);
  }

  return buildAppStoreCampaignUrl({
    utm_source: firstTouch.utm_source,
    utm_medium: firstTouch.utm_medium,
    utm_campaign: firstTouch.utm_campaign,
    utm_content: firstTouch.utm_content,
  });
};
