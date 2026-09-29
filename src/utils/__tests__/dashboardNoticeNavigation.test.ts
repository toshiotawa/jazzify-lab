import {
  dashboardNoticeWebPathForTab,
  isAllowedDashboardNoticeExternalUrl,
  isDashboardNoticeTabTarget,
  resolveDashboardNoticeAction,
} from '@/utils/dashboardNoticeNavigation';

describe('dashboardNoticeNavigation', () => {
  describe('isAllowedDashboardNoticeExternalUrl', () => {
    it('allows https URLs only', () => {
      expect(isAllowedDashboardNoticeExternalUrl('https://jazzify.jp/')).toBe(true);
      expect(isAllowedDashboardNoticeExternalUrl('http://jazzify.jp/')).toBe(false);
      expect(isAllowedDashboardNoticeExternalUrl('javascript:alert(1)')).toBe(false);
    });
  });

  describe('isDashboardNoticeTabTarget', () => {
    it('recognizes known tab keys', () => {
      expect(isDashboardNoticeTabTarget('account')).toBe(true);
      expect(isDashboardNoticeTabTarget('unknown')).toBe(false);
    });
  });

  describe('dashboardNoticeWebPathForTab', () => {
    it('maps tabs to WEB paths', () => {
      expect(dashboardNoticeWebPathForTab('account')).toBe('/main/account');
      expect(dashboardNoticeWebPathForTab('quest')).toBe('/main/courses');
      expect(dashboardNoticeWebPathForTab('training')).toBe('/main/play/training');
    });
  });

  describe('resolveDashboardNoticeAction', () => {
    it('resolves external actions', () => {
      expect(resolveDashboardNoticeAction('external', 'https://jazzify.jp/')).toEqual({
        kind: 'external',
        externalUrl: 'https://jazzify.jp/',
      });
    });

    it('rejects invalid external URLs', () => {
      expect(resolveDashboardNoticeAction('external', 'http://example.com')).toBeNull();
    });

    it('resolves tab actions', () => {
      expect(resolveDashboardNoticeAction('tab', 'account')).toEqual({
        kind: 'tab',
        webPath: '/main/account',
      });
    });

    it('rejects unknown tab keys', () => {
      expect(resolveDashboardNoticeAction('tab', 'billing')).toBeNull();
    });
  });
});
