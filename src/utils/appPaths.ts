/** WEB版アプリ本体のベース pathname（iOS WebView も同じ） */
export const APP_BASE_PATH = '/main';

/** LP 専用 pathname（`/` のみ。末尾スラッシュは正規化前に来る可能性あり） */
export const isLandingPath = (path: string): boolean =>
  path === '/' || path === '';

/** アプリ本体 pathname（`/main` および将来の path routing 用 `/main/*`） */
export const isAppPath = (path: string): boolean =>
  path === APP_BASE_PATH || path.startsWith(`${APP_BASE_PATH}/`);

/** pathname 末尾スラッシュを除去（ルート `/` はそのまま） */
export const normalizePathname = (path: string): string =>
  path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;

/**
 * LegacyApp が扱う hash ベース（`#dashboard` 形式）。
 * LP セクションアンカー（`#features` 等）とは区別する。
 */
export const APP_HASH_BASES = new Set([
  '#dashboard',
  '#lessons',
  '#course',
  '#lesson-detail',
  '#information',
  '#achievements',
  '#pricing',
  '#plan-comparison',
  '#account',
  '#mypage',
  '#login',
  '#admin-songs',
  '#admin-fantasy-bgm',
  '#admin-fantasy-stages',
  '#admin-survival',
  '#admin-code-run-map',
  '#admin-lesson-stages',
  '#admin-ear-training',
  '#admin-lessons',
  '#admin-challenges',
  '#admin-users',
  '#admin-announcements',
  '#admin-courses',
  '#admin-dayly-fantasy',
  '#ear-training-lesson',
  '#ear-training-tutorial-lesson',
  '#fantasy',
  '#Story',
  '#survival',
  '#survival-lesson',
  '#survival-tutorial-lesson',
  '#balloon-rush-lesson',
  '#practice',
  '#performance',
  '#play-lesson',
  '#play-mission',
  '#songs',
]);

/** hash からベース部分（クエリ除く）を取得 */
export const getHashBase = (hash: string): string => {
  if (!hash || hash === '#') return '';
  const base = hash.split('?')[0];
  return base.startsWith('#') ? base : `#${base}`;
};

/** LP（`/`）上のアプリ hash を `/main` へ逃がすべきか */
export const shouldRedirectLegacyAppHash = (pathname: string, hash: string): boolean => {
  if (!isLandingPath(normalizePathname(pathname))) return false;
  const base = getHashBase(hash);
  if (!base) return false;
  return APP_HASH_BASES.has(base);
};

/** `/main` + hash 形式の URL を組み立て */
export const buildAppUrl = (hash: string, search = ''): string => {
  const normalizedHash = hash.startsWith('#') ? hash : `#${hash}`;
  return `${APP_BASE_PATH}${search}${normalizedHash}`;
};
