export type PaywallSource =
  | 'main_quest'
  | 'chapter_complete'
  | 'soft_landing'
  | 'dashboard'
  | 'lesson_list'
  | 'resume_modal'
  | 'survival'
  | 'pricing_table'
  | 'account_modal';

/** GA4 では source が流入元と衝突しうるため paywall_source を併記する。 */
export const buildPaywallEventParams = (
  source: PaywallSource,
  extra?: Record<string, string | number | boolean | undefined>,
) => ({
  source,
  paywall_source: source,
  ...extra,
});
