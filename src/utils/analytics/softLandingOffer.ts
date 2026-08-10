import type { PaywallSource } from '@/utils/analytics/paywallSource';

export type SoftLandingOfferEntry = 'chapter_complete' | 'soft_landing' | 'dashboard';

export interface SoftLandingOfferCourse {
  id: string;
  title: string;
  title_en?: string | null;
  description?: string;
  description_en?: string | null;
  soft_landing_order?: number | null;
}

export interface SoftLandingOfferEventParams extends Record<string, string | number | boolean | undefined> {
  course_id: string;
  entry: SoftLandingOfferEntry;
  sequence_index: number;
}

export const buildSoftLandingOfferEventParams = (
  course: Pick<SoftLandingOfferCourse, 'id' | 'soft_landing_order'>,
  entry: SoftLandingOfferEntry,
): SoftLandingOfferEventParams => ({
  course_id: course.id,
  entry,
  sequence_index: course.soft_landing_order ?? 0,
});

export const SOFT_LANDING_OFFER_EVENTS = {
  viewed: 'soft_landing_offer_viewed',
  accepted: 'soft_landing_offer_accepted',
  dismissed: 'soft_landing_offer_dismissed',
} as const;

export const isSoftLandingPaywallSource = (source: PaywallSource): boolean =>
  source === 'chapter_complete' || source === 'main_quest' || source === 'soft_landing';
