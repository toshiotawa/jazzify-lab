import {
  clampEarTrainingOsmdUserZoom,
  EAR_TRAINING_OSMD_USER_ZOOM_DEFAULT,
  EAR_TRAINING_OSMD_USER_ZOOM_STORAGE_KEY,
  loadEarTrainingOsmdUserZoom,
  saveEarTrainingOsmdUserZoom,
} from '@/utils/earTrainingOsmdScorePreferences';

describe('earTrainingOsmdScorePreferences', () => {
  beforeEach(() => {
    window.localStorage.removeItem(EAR_TRAINING_OSMD_USER_ZOOM_STORAGE_KEY);
  });

  it('returns default when nothing is stored', () => {
    expect(loadEarTrainingOsmdUserZoom()).toBe(EAR_TRAINING_OSMD_USER_ZOOM_DEFAULT);
  });

  it('clamps out-of-range values', () => {
    expect(clampEarTrainingOsmdUserZoom(0.1)).toBe(0.5);
    expect(clampEarTrainingOsmdUserZoom(3)).toBe(2);
    expect(clampEarTrainingOsmdUserZoom(1.23)).toBe(1.2);
  });

  it('persists and reloads user zoom', () => {
    saveEarTrainingOsmdUserZoom(1.4);
    expect(window.localStorage.getItem(EAR_TRAINING_OSMD_USER_ZOOM_STORAGE_KEY)).toBe('1.4');
    expect(loadEarTrainingOsmdUserZoom()).toBe(1.4);
  });

  it('clamps invalid stored values on load', () => {
    window.localStorage.setItem(EAR_TRAINING_OSMD_USER_ZOOM_STORAGE_KEY, '9.9');
    expect(loadEarTrainingOsmdUserZoom()).toBe(2);
    window.localStorage.setItem(EAR_TRAINING_OSMD_USER_ZOOM_STORAGE_KEY, 'not-a-number');
    expect(loadEarTrainingOsmdUserZoom()).toBe(EAR_TRAINING_OSMD_USER_ZOOM_DEFAULT);
  });
});
