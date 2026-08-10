import { describe, expect, it } from 'vitest';
import {
  isMainQuestBlockedForSoftLanding,
  shouldAutoShowSoftLandingOfferOnDashboard,
  shouldPrioritizeSoftLandingGuidance,
} from '@/utils/softLandingGuidance';
import type { SoftLandingCandidate } from '@/utils/softLanding';
import type { Course } from '@/types';
import {
  markSoftLandingSessionDismissed,
  readSoftLandingSessionDismissed,
} from '@/utils/softLandingResume';

const course = (overrides: Partial<Course>): Course => ({
  id: 'course-sl-1',
  title: 'Chord Run',
  created_at: '',
  updated_at: '',
  lessons: [
    {
      id: 'lesson-1',
      course_id: 'course-sl-1',
      title: 'L1',
      description: '',
      order_index: 0,
      block_number: 1,
      created_at: '',
      updated_at: '',
    },
  ],
  order_index: 1,
  soft_landing_order: 1,
  ...overrides,
});

const candidate: SoftLandingCandidate = {
  course: course({}),
  block1Completed: false,
};

describe('shouldPrioritizeSoftLandingGuidance', () => {
  it('prioritizes guidance for free users with a pending soft landing course', () => {
    expect(shouldPrioritizeSoftLandingGuidance({
      isPremiumMember: false,
      mainQuestBlocked: true,
      nextCourse: candidate,
      sessionDismissed: false,
    })).toBe(true);
  });

  it('stops prioritizing after the user says no in this session', () => {
    expect(shouldPrioritizeSoftLandingGuidance({
      isPremiumMember: false,
      mainQuestBlocked: true,
      nextCourse: candidate,
      sessionDismissed: true,
    })).toBe(false);
  });

  it('does not apply to premium members or fully cleared soft landing', () => {
    expect(shouldPrioritizeSoftLandingGuidance({
      isPremiumMember: true,
      mainQuestBlocked: true,
      nextCourse: candidate,
    })).toBe(false);
    expect(shouldPrioritizeSoftLandingGuidance({
      isPremiumMember: false,
      mainQuestBlocked: true,
      nextCourse: null,
    })).toBe(false);
  });
});

describe('shouldAutoShowSoftLandingOfferOnDashboard', () => {
  it('auto-shows once per session when enforcing', () => {
    expect(shouldAutoShowSoftLandingOfferOnDashboard({
      isPremiumMember: false,
      mainQuestBlocked: true,
      nextCourse: candidate,
      sessionDismissed: false,
      offerAlreadyShownThisSession: false,
    })).toBe(true);
    expect(shouldAutoShowSoftLandingOfferOnDashboard({
      isPremiumMember: false,
      mainQuestBlocked: true,
      nextCourse: candidate,
      sessionDismissed: false,
      offerAlreadyShownThisSession: true,
    })).toBe(false);
  });
});

describe('isMainQuestBlockedForSoftLanding', () => {
  it('returns true when next lesson is block2+', () => {
    expect(isMainQuestBlockedForSoftLanding({
      completedLessons: 3,
      totalLessons: 10,
      nextLesson: {
        id: 'next',
        title: 'Next',
        title_en: null,
        order_index: 3,
        block_number: 2,
      },
    })).toBe(true);
  });
});

describe('softLandingResume session flags', () => {
  it('marks session dismissed in sessionStorage', () => {
    sessionStorage.clear();
    expect(readSoftLandingSessionDismissed()).toBe(false);
    markSoftLandingSessionDismissed();
    expect(readSoftLandingSessionDismissed()).toBe(true);
  });
});
