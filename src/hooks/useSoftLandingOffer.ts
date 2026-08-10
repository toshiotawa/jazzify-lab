import { useCallback, useEffect, useState } from 'react';
import {
  fetchSoftLandingCandidates,
  type SoftLandingCandidateRow,
} from '@/platform/supabaseCourses';
import { resolveNextSoftLandingCourse } from '@/utils/softLanding';
import { trackEvent } from '@/utils/analytics/ga';
import {
  buildSoftLandingOfferEventParams,
  SOFT_LANDING_OFFER_EVENTS,
  type SoftLandingOfferEntry,
} from '@/utils/analytics/softLandingOffer';

interface UseSoftLandingOfferOptions {
  userId: string | undefined;
  enabled: boolean;
  entry: SoftLandingOfferEntry;
}

export function useSoftLandingOffer({
  userId,
  enabled,
  entry,
}: UseSoftLandingOfferOptions) {
  const [candidates, setCandidates] = useState<SoftLandingCandidateRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [excludeCourseId, setExcludeCourseId] = useState<string | undefined>(undefined);

  const reload = useCallback(async (options?: { forceRefresh?: boolean; excludeCourseId?: string }) => {
    if (!userId || !enabled) {
      setCandidates([]);
      return null;
    }
    setLoading(true);
    try {
      const rows = await fetchSoftLandingCandidates(userId, {
        forceRefresh: options?.forceRefresh ?? false,
      });
      setCandidates(rows);
      const next = resolveNextSoftLandingCourse(rows, {
        excludeCourseId: options?.excludeCourseId ?? excludeCourseId,
      });
      return next;
    } catch {
      setCandidates([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId, enabled, excludeCourseId]);

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }
    void reload();
  }, [enabled, userId, reload]);

  const nextCourse = resolveNextSoftLandingCourse(candidates, { excludeCourseId });

  const trackOfferViewed = useCallback((course: NonNullable<typeof nextCourse>['course']) => {
    trackEvent(
      SOFT_LANDING_OFFER_EVENTS.viewed,
      buildSoftLandingOfferEventParams(course, entry),
    );
  }, [entry]);

  const trackOfferAccepted = useCallback((course: NonNullable<typeof nextCourse>['course']) => {
    trackEvent(
      SOFT_LANDING_OFFER_EVENTS.accepted,
      buildSoftLandingOfferEventParams(course, entry),
    );
  }, [entry]);

  const trackOfferDismissed = useCallback((course: NonNullable<typeof nextCourse>['course']) => {
    trackEvent(
      SOFT_LANDING_OFFER_EVENTS.dismissed,
      buildSoftLandingOfferEventParams(course, entry),
    );
  }, [entry]);

  return {
    candidates,
    nextCourse,
    loading,
    reload,
    excludeCourseId,
    setExcludeCourseId,
    trackOfferViewed,
    trackOfferAccepted,
    trackOfferDismissed,
  };
}
