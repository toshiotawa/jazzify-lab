import type { CodeRunDemoConfig, CodeRunDemoDifficulty } from '@/embed/codeRunDemoCatalog';
import type { GaEventParams } from '@/utils/analytics/ga';
import { trackEvent } from '@/utils/analytics/ga';

/** GA4 キーイベント候補（管理画面で Key event 化）。tutorial_* と分けて初回体験 CV を汚染しない。 */
export const CODE_RUN_DEMO_EVENTS = {
  play: 'code_run_demo_play',
  clear: 'code_run_demo_clear',
  timeout: 'code_run_demo_timeout',
  ctaClick: 'code_run_demo_cta_click',
} as const;

type CodeRunDemoTrackableEvent =
  (typeof CODE_RUN_DEMO_EVENTS)[keyof typeof CODE_RUN_DEMO_EVENTS];

interface CodeRunDemoTrackContext {
  readonly demoConfig: CodeRunDemoConfig;
  readonly difficulty: CodeRunDemoDifficulty;
  /** iframe URL の ?from=（例: jazzpianodays / en_blog） */
  readonly from?: string | null;
}

export const buildCodeRunDemoEventParams = (
  context: CodeRunDemoTrackContext,
  extra?: GaEventParams,
): GaEventParams => {
  const from = context.from?.trim();
  return {
    demo_id: context.demoConfig.id,
    demo_lp_locale: context.demoConfig.lpLocale,
    demo_difficulty: context.difficulty,
    ...(from ? { embed_from: from } : {}),
    ...extra,
  };
};

export const trackCodeRunDemoEvent = (
  name: CodeRunDemoTrackableEvent,
  context: CodeRunDemoTrackContext,
  extra?: GaEventParams,
): void => {
  trackEvent(name, buildCodeRunDemoEventParams(context, extra));
};
