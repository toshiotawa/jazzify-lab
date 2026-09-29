export type DashboardNoticeTabTarget = 'account' | 'quest' | 'play' | 'training' | 'top';

export type DashboardNoticeActionKind = 'external' | 'tab';

const TAB_TARGETS: readonly DashboardNoticeTabTarget[] = [
  'account',
  'quest',
  'play',
  'training',
  'top',
];

export const isDashboardNoticeTabTarget = (value: string): value is DashboardNoticeTabTarget =>
  (TAB_TARGETS as readonly string[]).includes(value);

export const isAllowedDashboardNoticeExternalUrl = (url: string): boolean =>
  url.startsWith('https://');

/** WEB path for in-app tab navigation from a dashboard notice */
export const dashboardNoticeWebPathForTab = (target: DashboardNoticeTabTarget): string => {
  switch (target) {
    case 'account':
      return '/main/account';
    case 'quest':
      return '/main/courses';
    case 'play':
      return '/main/play';
    case 'training':
      return '/main/play/training';
    case 'top':
      return '/main/dashboard';
    default: {
      const _exhaustive: never = target;
      return _exhaustive;
    }
  }
};

export interface ResolvedDashboardNoticeAction {
  kind: DashboardNoticeActionKind;
  externalUrl?: string;
  webPath?: string;
}

export const resolveDashboardNoticeAction = (
  actionKind: DashboardNoticeActionKind,
  actionTarget: string,
): ResolvedDashboardNoticeAction | null => {
  if (actionKind === 'external') {
    if (!isAllowedDashboardNoticeExternalUrl(actionTarget)) {
      return null;
    }
    return { kind: 'external', externalUrl: actionTarget };
  }
  if (!isDashboardNoticeTabTarget(actionTarget)) {
    return null;
  }
  return {
    kind: 'tab',
    webPath: dashboardNoticeWebPathForTab(actionTarget),
  };
};
