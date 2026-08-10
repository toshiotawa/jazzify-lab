import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  CODE_RUN_DEMO_EVENTS,
  buildCodeRunDemoEventParams,
  trackCodeRunDemoEvent,
} from '@/embed/codeRunDemoAnalytics';
import { CODE_RUN_DEMOS } from '@/embed/codeRunDemoCatalog';

vi.mock('@/utils/analytics/ga', () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from '@/utils/analytics/ga';

describe('codeRunDemoAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('builds params with demo id, locale, difficulty, and optional from', () => {
    expect(buildCodeRunDemoEventParams({
      demoConfig: CODE_RUN_DEMOS.demo_1,
      difficulty: 'easy',
      from: 'jazzpianodays',
    })).toEqual({
      demo_id: 'demo_1',
      demo_lp_locale: 'ja',
      demo_difficulty: 'easy',
      embed_from: 'jazzpianodays',
    });
  });

  it('omits embed_from when from is empty', () => {
    expect(buildCodeRunDemoEventParams({
      demoConfig: CODE_RUN_DEMOS.demo_4,
      difficulty: 'normal',
      from: '  ',
    })).toEqual({
      demo_id: 'demo_4',
      demo_lp_locale: 'en',
      demo_difficulty: 'normal',
    });
  });

  it('tracks play/clear via dedicated event names', () => {
    trackCodeRunDemoEvent(CODE_RUN_DEMO_EVENTS.play, {
      demoConfig: CODE_RUN_DEMOS.demo_2,
      difficulty: 'normal',
      from: 'en_blog',
    });
    expect(trackEvent).toHaveBeenCalledWith(CODE_RUN_DEMO_EVENTS.play, {
      demo_id: 'demo_2',
      demo_lp_locale: 'en',
      demo_difficulty: 'normal',
      embed_from: 'en_blog',
    });

    trackCodeRunDemoEvent(CODE_RUN_DEMO_EVENTS.clear, {
      demoConfig: CODE_RUN_DEMOS.demo_2,
      difficulty: 'easy',
      from: 'en_blog',
    });
    expect(trackEvent).toHaveBeenCalledWith(CODE_RUN_DEMO_EVENTS.clear, expect.objectContaining({
      demo_id: 'demo_2',
    }));
  });
});
