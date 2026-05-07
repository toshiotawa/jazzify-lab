import { describe, it, expect, vi, afterEach } from 'vitest';

describe('shouldIncludeDeveloperLessonCourses', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('VITE_INCLUDE_DEV_LESSON_COURSES が true のときは本番扱いでも true', async () => {
    vi.stubEnv('VITE_INCLUDE_DEV_LESSON_COURSES', 'true');
    vi.stubEnv('VITE_APP_ENV', 'production');
    vi.stubEnv('MODE', 'production');
    vi.resetModules();
    const { shouldIncludeDeveloperLessonCourses } = await import('./environment');
    expect(shouldIncludeDeveloperLessonCourses()).toBe(true);
  });

  it('VITE_INCLUDE_DEV_LESSON_COURSES が true でないときは isDevelopment に従う', async () => {
    vi.stubEnv('VITE_INCLUDE_DEV_LESSON_COURSES', '');
    vi.stubEnv('VITE_APP_ENV', 'production');
    vi.stubEnv('MODE', 'production');
    vi.resetModules();
    const { shouldIncludeDeveloperLessonCourses } = await import('./environment');
    expect(shouldIncludeDeveloperLessonCourses()).toBe(false);
  });

  it('VITE_INCLUDE_DEV_LESSON_COURSES が true でないとき development なら true', async () => {
    vi.stubEnv('VITE_INCLUDE_DEV_LESSON_COURSES', '');
    vi.stubEnv('VITE_APP_ENV', '');
    vi.stubEnv('MODE', 'development');
    vi.resetModules();
    const { shouldIncludeDeveloperLessonCourses } = await import('./environment');
    expect(shouldIncludeDeveloperLessonCourses()).toBe(true);
  });

  it('VITE_APP_ENV が staging のときは true', async () => {
    vi.stubEnv('VITE_INCLUDE_DEV_LESSON_COURSES', '');
    vi.stubEnv('VITE_APP_ENV', 'staging');
    vi.stubEnv('MODE', 'production');
    vi.resetModules();
    const { shouldIncludeDeveloperLessonCourses } = await import('./environment');
    expect(shouldIncludeDeveloperLessonCourses()).toBe(true);
  });

  it('shouldIncludeDeveloperLessonCoursesForUser: 管理者なら本番でも true', async () => {
    vi.stubEnv('VITE_INCLUDE_DEV_LESSON_COURSES', '');
    vi.stubEnv('VITE_APP_ENV', 'production');
    vi.stubEnv('MODE', 'production');
    vi.resetModules();
    const { shouldIncludeDeveloperLessonCoursesForUser } = await import('./environment');
    expect(shouldIncludeDeveloperLessonCoursesForUser(true)).toBe(true);
    expect(shouldIncludeDeveloperLessonCoursesForUser(false)).toBe(false);
    expect(shouldIncludeDeveloperLessonCoursesForUser(undefined)).toBe(false);
  });
});
