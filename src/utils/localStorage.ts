import { GameSettings } from '../types';

const STORAGE_KEYS = {
  GAME_SETTINGS: 'jazzgame_settings',
} as const;

/**
 * ローカルストレージから設定を読み込み
 */
export const loadSettingsFromStorage = (): Partial<GameSettings> | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.GAME_SETTINGS);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    
    // 基本的な検証
    if (typeof parsed !== 'object' || parsed === null) {
      console.warn('Invalid settings data in localStorage');
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error);
    return null;
  }
};

/**
 * 設定をローカルストレージに保存
 * 再生速度は保存しない
 */
export const saveSettingsToStorage = (settings: GameSettings): void => {
  try {
    // 再生速度を除外した設定を保存
    const { playbackSpeed, ...settingsToSave } = settings;
    
    localStorage.setItem(STORAGE_KEYS.GAME_SETTINGS, JSON.stringify(settingsToSave));
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
  }
};

/**
 * ローカルストレージから設定を削除
 */
export const clearSettingsFromStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.GAME_SETTINGS);
  } catch (error) {
    console.error('Failed to clear settings from localStorage:', error);
  }
};

/**
 * 設定がローカルストレージに保存されているかチェック
 */
export const hasStoredSettings = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEYS.GAME_SETTINGS) !== null;
  } catch (error) {
    console.error('Failed to check stored settings:', error);
    return false;
  }
}; 