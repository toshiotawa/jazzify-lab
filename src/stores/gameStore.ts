/**
 * 全モード共通のゲーム設定ストア (Zustand)
 */

import { createWithEqualityFn } from 'zustand/traditional';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { GameSettings } from '@/types';

const defaultSettings: GameSettings = {
  masterVolume: 0.8,
  musicVolume: 0.7,
  midiVolume: 0.8,
  soundEffectVolume: 0.8,
  bgmVolume: 0.7,
  playRootSound: true,
  rootSoundVolume: 0.7,
  notesSpeed: 1.0,
  playbackSpeed: 1.0,
  instrumentMode: 'piano',
  allowOctaveError: false,
  noteOctaveShift: 0,
  timingAdjustment: 0,
  showNoteNames: true,
  noteNameStyle: 'abc',
  simpleDisplayMode: false,
  showSheetMusic: true,
  sheetMusicChordsOnly: false,
  showFPS: false,
  showSeekbar: true,
  showHeader: true,
  viewportHeight: 600,
  pianoHeight: 80,
  inputMethod: 'midi',
  selectedMidiDevice: null,
  selectedAudioDevice: null,
  selectedAudioOutputDevice: 'default',
  transpose: 0,
  transposingInstrument: 'concert_pitch',
  latencyAdjustment: 0,
  practiceGuide: 'key',
  performanceMode: 'standard',
  voiceSensitivity: 5,
};

const validateSettings = (
  settings: GameSettings,
): { valid: boolean; errors: string[]; normalized: GameSettings } => {
  const errors: string[] = [];
  const normalized: GameSettings = { ...settings };

  if (normalized.masterVolume < 0 || normalized.masterVolume > 1) {
    errors.push('マスター音量は0-1の範囲で設定してください');
    normalized.masterVolume = Math.max(0, Math.min(1, normalized.masterVolume));
  }

  if (normalized.musicVolume < 0 || normalized.musicVolume > 1) {
    errors.push('音楽音量は0-1の範囲で設定してください');
    normalized.musicVolume = Math.max(0, Math.min(1, normalized.musicVolume));
  }

  if (normalized.midiVolume < 0 || normalized.midiVolume > 1) {
    errors.push('MIDI音量は0-1の範囲で設定してください');
    normalized.midiVolume = Math.max(0, Math.min(1, normalized.midiVolume));
  }

  if (normalized.bgmVolume < 0 || normalized.bgmVolume > 1) {
    errors.push('BGM音量は0-1の範囲で設定してください');
    normalized.bgmVolume = Math.max(0, Math.min(1, normalized.bgmVolume));
  }

  if (normalized.notesSpeed < 0.1 || normalized.notesSpeed > 4.0) {
    errors.push('ノート速度は0.1-4.0の範囲で設定してください');
    normalized.notesSpeed = Math.max(0.1, Math.min(4.0, normalized.notesSpeed));
  }

  if (normalized.playbackSpeed < 0.1 || normalized.playbackSpeed > 3.0) {
    errors.push('再生速度は0.1-3.0の範囲で設定してください');
    normalized.playbackSpeed = Math.max(0.1, Math.min(3.0, normalized.playbackSpeed));
  }

  if (normalized.timingAdjustment < -1000 || normalized.timingAdjustment > 1000) {
    errors.push('タイミング調整は-1000ms〜+1000msの範囲で設定してください');
    normalized.timingAdjustment = Math.max(-1000, Math.min(1000, normalized.timingAdjustment));
  }

  if (normalized.transpose < -12 || normalized.transpose > 12) {
    errors.push('移調は-12〜+12半音の範囲で設定してください');
    normalized.transpose = Math.max(-12, Math.min(12, normalized.transpose));
  }

  if (normalized.noteOctaveShift < -2 || normalized.noteOctaveShift > 2) {
    errors.push('オクターブシフトは-2〜+2オクターブの範囲で設定してください');
    normalized.noteOctaveShift = Math.max(-2, Math.min(2, normalized.noteOctaveShift));
  }

  if (normalized.viewportHeight < 400 || normalized.viewportHeight > 1200) {
    errors.push('ビューポートの高さは400-1200pxの範囲で設定してください');
    normalized.viewportHeight = Math.max(400, Math.min(1200, normalized.viewportHeight));
  }

  if (normalized.pianoHeight < 80 || normalized.pianoHeight > 300) {
    errors.push('ピアノの高さは80-300pxの範囲で設定してください');
    normalized.pianoHeight = Math.max(80, Math.min(300, normalized.pianoHeight));
  }

  return {
    valid: errors.length === 0,
    errors,
    normalized,
  };
};

interface GameStoreState {
  settings: GameSettings;
  settingsErrors: string[];
  updateSettings: (settings: Partial<GameSettings>) => void;
  updateSettingsSafe: (settings: Partial<GameSettings>) => { success: boolean; errors: string[] };
  resetSettings: () => void;
  clearSettingsErrors: () => void;
}

export const useGameStore = createWithEqualityFn<GameStoreState>()(
  devtools(
    immer((set) => ({
      settings: defaultSettings,
      settingsErrors: [],

      updateSettings: (newSettings) => {
        set((state) => {
          const validation = validateSettings({ ...state.settings, ...newSettings });
          state.settings = validation.normalized;
          if (!validation.valid) {
            state.settingsErrors.push(...validation.errors);
          }
        });
      },

      updateSettingsSafe: (newSettings) => {
        const current = useGameStore.getState().settings;
        const validation = validateSettings({ ...current, ...newSettings });
        if (!validation.valid) {
          set((state) => {
            state.settingsErrors.push(...validation.errors);
          });
          return { success: false, errors: validation.errors };
        }
        set((state) => {
          state.settings = validation.normalized;
        });
        return { success: true, errors: [] };
      },

      resetSettings: () => {
        set((state) => {
          state.settings = { ...defaultSettings };
          state.settingsErrors = [];
        });
      },

      clearSettingsErrors: () => {
        set((state) => {
          state.settingsErrors = [];
        });
      },
    })),
    { name: 'game-store' },
  ),
);

export const useSettings = () => useGameStore((state) => state.settings);

export const useSettingsValidation = () => {
  const updateSettingsSafe = useGameStore((state) => state.updateSettingsSafe);
  const clearSettingsErrors = useGameStore((state) => state.clearSettingsErrors);
  return { updateSettingsSafe, clearSettingsErrors };
};

if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('gameSettings');
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<GameSettings>;
      delete parsed.playbackSpeed;
      delete parsed.showSheetMusic;
      delete parsed.sheetMusicChordsOnly;
      useGameStore.getState().updateSettings(parsed);
    }
  } catch {
    /* ignore corrupt localStorage */
  }

  useGameStore.subscribe((state) => {
    const { playbackSpeed, showSheetMusic, sheetMusicChordsOnly, ...persist } = state.settings;
    try {
      localStorage.setItem('gameSettings', JSON.stringify(persist));
    } catch {
      /* ignore quota errors */
    }
  });
}
