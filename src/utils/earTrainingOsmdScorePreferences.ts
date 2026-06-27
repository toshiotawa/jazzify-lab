export const EAR_TRAINING_OSMD_USER_ZOOM_STORAGE_KEY = 'earTraining.osmd.userZoom';

export const EAR_TRAINING_OSMD_USER_ZOOM_MIN = 0.5;
export const EAR_TRAINING_OSMD_USER_ZOOM_MAX = 2;
export const EAR_TRAINING_OSMD_USER_ZOOM_STEP = 0.1;
export const EAR_TRAINING_OSMD_USER_ZOOM_DEFAULT = 1.9;

export const clampEarTrainingOsmdUserZoom = (value: number): number =>
  Math.min(
    EAR_TRAINING_OSMD_USER_ZOOM_MAX,
    Math.max(EAR_TRAINING_OSMD_USER_ZOOM_MIN, Math.round(value * 10) / 10),
  );

export const loadEarTrainingOsmdUserZoom = (): number => {
  if (typeof window === 'undefined') {
    return EAR_TRAINING_OSMD_USER_ZOOM_DEFAULT;
  }
  try {
    const raw = window.localStorage.getItem(EAR_TRAINING_OSMD_USER_ZOOM_STORAGE_KEY);
    if (raw === null) {
      return EAR_TRAINING_OSMD_USER_ZOOM_DEFAULT;
    }
    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed)) {
      return EAR_TRAINING_OSMD_USER_ZOOM_DEFAULT;
    }
    return clampEarTrainingOsmdUserZoom(parsed);
  } catch {
    return EAR_TRAINING_OSMD_USER_ZOOM_DEFAULT;
  }
};

export const saveEarTrainingOsmdUserZoom = (value: number): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(
      EAR_TRAINING_OSMD_USER_ZOOM_STORAGE_KEY,
      String(clampEarTrainingOsmdUserZoom(value)),
    );
  } catch {
    // ignore quota / private mode
  }
};
