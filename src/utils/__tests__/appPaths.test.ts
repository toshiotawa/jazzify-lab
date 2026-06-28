import {
  APP_BASE_PATH,
  buildAppUrl,
  getHashBase,
  isAppPath,
  isLandingPath,
  normalizePathname,
  shouldRedirectLegacyAppHash,
} from '@/utils/appPaths';
import { hashToAppPath } from '@/utils/appNavigation';
import { computeAppRouteOpenForTest } from '@/hooks/useAppRouteOpen';

describe('appPaths', () => {
  describe('isLandingPath', () => {
    it('returns true for root paths', () => {
      expect(isLandingPath('/')).toBe(true);
      expect(isLandingPath('')).toBe(true);
    });

    it('returns false for app paths', () => {
      expect(isLandingPath('/main')).toBe(false);
      expect(isLandingPath('/login')).toBe(false);
    });
  });

  describe('isAppPath', () => {
    it('matches /main and nested paths', () => {
      expect(isAppPath('/main')).toBe(true);
      expect(isAppPath('/main/dashboard')).toBe(true);
      expect(isAppPath('/main/lessons/abc')).toBe(true);
    });

    it('does not match other paths', () => {
      expect(isAppPath('/')).toBe(false);
      expect(isAppPath('/login')).toBe(false);
    });
  });

  describe('normalizePathname', () => {
    it('strips trailing slash except root', () => {
      expect(normalizePathname('/main/')).toBe('/main');
      expect(normalizePathname('/')).toBe('/');
    });
  });

  describe('shouldRedirectLegacyAppHash', () => {
    it('redirects app hashes on landing path', () => {
      expect(shouldRedirectLegacyAppHash('/', '#dashboard')).toBe(true);
      expect(shouldRedirectLegacyAppHash('/', '#lesson-detail?id=abc')).toBe(true);
    });

    it('ignores LP section anchors', () => {
      expect(shouldRedirectLegacyAppHash('/', '#features')).toBe(false);
    });

    it('does not redirect on /main', () => {
      expect(shouldRedirectLegacyAppHash('/main', '#dashboard')).toBe(false);
    });
  });

  describe('buildAppUrl', () => {
    it('builds /main hash URLs', () => {
      expect(buildAppUrl('#dashboard')).toBe('/main#dashboard');
      expect(buildAppUrl('#lesson-detail?id=1')).toBe('/main#lesson-detail?id=1');
    });
  });

  describe('getHashBase', () => {
    it('extracts hash base without query', () => {
      expect(getHashBase('#lesson-detail?id=1')).toBe('#lesson-detail');
    });
  });
});

describe('hashToAppPath', () => {
  it('maps common legacy hashes to path routes', () => {
    expect(hashToAppPath('#dashboard')).toBe(`${APP_BASE_PATH}/dashboard`);
    expect(hashToAppPath('#lessons')).toBe(`${APP_BASE_PATH}/lessons`);
    expect(hashToAppPath('#lesson-detail?id=abc')).toBe(`${APP_BASE_PATH}/lessons/abc`);
    expect(hashToAppPath('#course?id=xyz')).toBe(`${APP_BASE_PATH}/courses/xyz`);
    expect(hashToAppPath('#ear-training-lesson?stageId=1')).toBe(
      `${APP_BASE_PATH}/play/ear-training?stageId=1`,
    );
  });

  it('returns null for unknown hashes', () => {
    expect(hashToAppPath('#features')).toBeNull();
    expect(hashToAppPath('#admin-songs')).toBeNull();
  });
});

describe('useAppRouteOpen path compatibility', () => {
  it('opens dashboard on /main/dashboard without hash', () => {
    expect(
      computeAppRouteOpenForTest('/main/dashboard', '', {
        hash: '#dashboard',
        path: '/main/dashboard',
      }),
    ).toBe(true);
  });

  it('opens dashboard on legacy hash', () => {
    expect(
      computeAppRouteOpenForTest('/main', '#dashboard', {
        hash: '#dashboard',
        path: '/main/dashboard',
      }),
    ).toBe(true);
  });
});

describe('normalizePathname integration', () => {
  it('landing vs app detection', () => {
    const path = normalizePathname('/main/lessons');
    expect(isLandingPath(path)).toBe(false);
    expect(isAppPath(path)).toBe(true);
  });
});
