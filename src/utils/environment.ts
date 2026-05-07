/**
 * 環境設定のユーティリティ
 */

export type Environment = 'development' | 'staging' | 'production';

export const getEnvironment = (): Environment => {
  // VITE_APP_ENVが設定されている場合はそれを使用
  if (import.meta.env.VITE_APP_ENV) {
    return import.meta.env.VITE_APP_ENV as Environment;
  }
  
  // MODE値に基づいて判定
  if (import.meta.env.MODE === 'production') {
    return 'production';
  }
  
  return 'development';
};

export const isStaging = (): boolean => {
  return getEnvironment() === 'staging';
};

export const isProduction = (): boolean => {
  return getEnvironment() === 'production';
};

export const isDevelopment = (): boolean => {
  return getEnvironment() === 'development';
};

/** 開発者専用レッスンコースをクライアントに含めるか（Web・未ログイン時の既定） */
export const shouldIncludeDeveloperLessonCourses = (): boolean => {
  if (import.meta.env.VITE_INCLUDE_DEV_LESSON_COURSES === 'true') {
    return true;
  }
  if (isStaging()) {
    return true;
  }
  return isDevelopment();
};

/**
 * ログインセッション単位で is_developer_only コースを含めるか。
 * 本番 Web では管理者のみ true になり得る（環境フラグ・staging・local と併用）。
 */
export const shouldIncludeDeveloperLessonCoursesForUser = (isAdmin: boolean | undefined): boolean =>
  shouldIncludeDeveloperLessonCourses() || isAdmin === true;

// 環境に応じた設定値を返す
export const getEnvConfig = () => {
  const env = getEnvironment();
  
  switch (env) {
    case 'staging':
      return {
        apiUrl: import.meta.env.VITE_API_URL || 'https://stg-api.jazzify.jp',
        debugMode: true,
        showEnvBadge: true,
      };
    case 'production':
      return {
        apiUrl: import.meta.env.VITE_API_URL || 'https://api.jazzify.jp',
        debugMode: false,
        showEnvBadge: false,
      };
    default: // development
      return {
        apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
        debugMode: true,
        showEnvBadge: true,
      };
  }
};