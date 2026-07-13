import { JAZZIFY_APP_STORE_URL } from '@/components/landing/landingLinks';
import { getStoredFirstTouch, type FirstTouchData } from '@/utils/analytics/attribution';

/** Apple Campaign Links の ct 最大長（安全側）。 */
const CAMPAIGN_TOKEN_MAX_LENGTH = 40;

export interface AppStoreCampaignParams {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  /** App Store Connect のプロバイダトークン。未指定時は env を参照。 */
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

const resolveProviderToken = (explicit?: string | null): string | null => {
  const fromArg = sanitizeCampaignSegment(explicit);
  if (fromArg) {
    return fromArg;
  }
  const fromEnv = import.meta.env.VITE_APP_STORE_PROVIDER_TOKEN;
  return sanitizeCampaignSegment(typeof fromEnv === 'string' ? fromEnv : null);
};

/**
 * App Store Campaign Link を生成する。
 * - mt=8（App Store）は常に付与
 * - ct は UTM から生成（無ければ省略）
 * - pt は providerToken または VITE_APP_STORE_PROVIDER_TOKEN（無ければ省略）
 *
 * 注意: これは ASC のキャンペーン別 DL 集計用。個別ユーザーへの紐づけはできない。
 */
export const buildAppStoreCampaignUrl = (
  params: AppStoreCampaignParams = {},
  baseUrl: string = JAZZIFY_APP_STORE_URL,
): string => {
  const url = new URL(baseUrl);
  url.searchParams.set('mt', '8');

  const providerToken = resolveProviderToken(params.providerToken);
  if (providerToken) {
    url.searchParams.set('pt', providerToken);
  }

  const campaignToken = buildAppStoreCampaignToken(params);
  if (campaignToken) {
    url.searchParams.set('ct', campaignToken);
  }

  return url.toString();
};

export const buildAppStoreCampaignUrlFromFirstTouch = (
  firstTouch: FirstTouchData | null = getStoredFirstTouch(),
): string => {
  if (!firstTouch) {
    return buildAppStoreCampaignUrl();
  }
  return buildAppStoreCampaignUrl({
    utm_source: firstTouch.utm_source,
    utm_medium: firstTouch.utm_medium,
    utm_campaign: firstTouch.utm_campaign,
    utm_content: firstTouch.utm_content,
  });
};
