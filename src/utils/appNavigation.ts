import { isIOSWebView } from '@/utils/iosbridge';
import { APP_BASE_PATH, buildAppUrl, getHashBase, normalizePathname } from '@/utils/appPaths';

/** hash を正規化（先頭 `#` を保証） */
export const normalizeAppHash = (hash: string): string =>
  hash.startsWith('#') ? hash : `#${hash}`;

/**
 * WEB: pathname が `/main` でなければ `/main` + hash へ遷移。
 * iOS WebView: 従来通り hash のみ更新（pathname は既に `/main`）。
 */
export const setAppHash = (hash: string): void => {
  const normalized = normalizeAppHash(hash);
  if (isIOSWebView()) {
    window.location.hash = normalized;
    return;
  }
  const pathname = normalizePathname(window.location.pathname);
  if (pathname === APP_BASE_PATH) {
    window.location.hash = normalized;
    return;
  }
  window.location.assign(buildAppUrl(normalized, window.location.search));
};

/** React Router navigate 用の `/main#...` パス */
export const appHashPath = (hash: string): string => buildAppUrl(normalizeAppHash(hash));

/** ダッシュボードへ */
export const navigateToDashboardPath = (): string => dashboardPath();

/** レッスン詳細へ（hash 互換） */
export const navigateToLessonDetailPath = (lessonId: string): string =>
  lessonDetailPath(lessonId);

/** レッスン詳細 path route */
export const lessonDetailPath = (lessonId: string): string =>
  `${APP_BASE_PATH}/lessons/${encodeURIComponent(lessonId)}`;

/** コース path route */
export const coursePath = (courseId: string): string =>
  `${APP_BASE_PATH}/courses/${encodeURIComponent(courseId)}`;

/** レッスン一覧 path route */
export const lessonsListPath = (): string => `${APP_BASE_PATH}/lessons`;

/** ダッシュボード path route */
export const dashboardPath = (): string => `${APP_BASE_PATH}/dashboard`;

/** legacy hash を WEB path route へ変換（iOS では null） */
export const hashToAppPath = (hash: string): string | null => {
  if (isIOSWebView()) return null;
  const base = getHashBase(hash);
  const query = hash.includes('?') ? hash.split('?').slice(1).join('?') : '';
  const search = query ? `?${query}` : '';
  const params = new URLSearchParams(query);

  switch (base) {
    case '#dashboard':
      return dashboardPath();
    case '#lessons':
      return `${lessonsListPath()}${search}`;
    case '#course': {
      const id = params.get('id');
      if (!id) return null;
      params.delete('id');
      const remaining = params.toString();
      return `${coursePath(id)}${remaining ? `?${remaining}` : ''}`;
    }
    case '#lesson-detail': {
      const id = params.get('id');
      if (!id) return null;
      params.delete('id');
      const remaining = params.toString();
      return `${lessonDetailPath(id)}${remaining ? `?${remaining}` : ''}`;
    }
    case '#information':
      return `${APP_BASE_PATH}/information`;
    case '#achievements':
      return `${APP_BASE_PATH}/achievements`;
    case '#pricing':
      return `${APP_BASE_PATH}/pricing`;
    case '#plan-comparison':
      return `${APP_BASE_PATH}/plan-comparison`;
    case '#account':
      return `${APP_BASE_PATH}/account`;
    case '#mypage':
      return `${APP_BASE_PATH}/mypage`;
    case '#fantasy':
      return `${APP_BASE_PATH}/play/fantasy${search}`;
    case '#Story':
      return `${APP_BASE_PATH}/play/story${search}`;
    case '#survival':
      return `${APP_BASE_PATH}/play/survival${search}`;
    case '#survival-lesson':
      return `${APP_BASE_PATH}/play/survival-lesson${search}`;
    case '#survival-tutorial-lesson':
      return `${APP_BASE_PATH}/play/survival-tutorial${search}`;
    case '#balloon-rush-lesson':
      return `${APP_BASE_PATH}/play/balloon-rush${search}`;
    case '#ear-training-lesson':
      return `${APP_BASE_PATH}/play/ear-training${search}`;
    case '#ear-training-tutorial-lesson':
      return `${APP_BASE_PATH}/play/ear-training-tutorial${search}`;
    default:
      return null;
  }
};
