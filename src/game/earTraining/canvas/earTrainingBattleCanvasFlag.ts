const STORAGE_KEY = 'ear_training_battle_renderer';
const QUERY_PARAM = 'earTrainingCanvas';

export type EarTrainingBattleRendererMode = 'canvas' | 'phaser';

const parseQueryMode = (value: string | null): EarTrainingBattleRendererMode | null => {
  if (value === '1' || value === 'true' || value === 'canvas') return 'canvas';
  if (value === '0' || value === 'false' || value === 'phaser') return 'phaser';
  return null;
};

export const getEarTrainingBattleRendererMode = (): EarTrainingBattleRendererMode => {
  if (typeof window === 'undefined') return 'canvas';

  const queryMode = parseQueryMode(new URLSearchParams(window.location.search).get(QUERY_PARAM));
  if (queryMode) return queryMode;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'canvas' || stored === 'phaser') return stored;

  return 'canvas';
};

export const setEarTrainingBattleRendererMode = (mode: EarTrainingBattleRendererMode): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, mode);
};

export const isEarTrainingBattleCanvasEnabled = (): boolean =>
  getEarTrainingBattleRendererMode() === 'canvas';
