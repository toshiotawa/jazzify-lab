/**
 * サバイバルモード設定モーダル
 * MIDIデバイス・音量・ポップアップ表示設定
 */

import React, { useState, useEffect } from 'react';
import { MidiDeviceSelector } from '../ui/MidiDeviceManager';
import { updateGlobalVolume } from '@/utils/MidiController';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { useGameStore } from '@/stores/gameStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';

const SURVIVAL_SETTINGS_KEY = 'survival_display_settings';

export interface SurvivalDisplaySettings {
  showAutoSelectPopup: boolean;
  showCharacterBonusPopup: boolean;
}

const DEFAULT_DISPLAY_SETTINGS: SurvivalDisplaySettings = {
  showAutoSelectPopup: true,
  showCharacterBonusPopup: true,
};

export const loadSurvivalDisplaySettings = (): SurvivalDisplaySettings => {
  try {
    const saved = localStorage.getItem(SURVIVAL_SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_DISPLAY_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_DISPLAY_SETTINGS;
};

const saveSurvivalDisplaySettings = (settings: SurvivalDisplaySettings): void => {
  try {
    localStorage.setItem(SURVIVAL_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
};

interface SurvivalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMidiConnected?: boolean;
  displaySettings: SurvivalDisplaySettings;
  onDisplaySettingsChange: (settings: SurvivalDisplaySettings) => void;
  bgmVolume?: number;
  onBgmVolumeChange?: (volume: number) => void;
}

const SurvivalSettingsModal: React.FC<SurvivalSettingsModalProps> = ({
  isOpen,
  onClose,
  isMidiConnected = false,
  displaySettings,
  onDisplaySettingsChange,
  bgmVolume: bgmVolumeProp,
  onBgmVolumeChange,
}) => {
  const { settings, updateSettings } = useGameStore();
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });
  
  const [midiDeviceId, setMidiDeviceId] = useState<string | null>(settings.selectedMidiDevice ?? null);
  const [volume, setVolume] = useState<number>(settings.midiVolume ?? 0.8);
  const [rootVolume, setRootVolume] = useState<number>(settings.rootSoundVolume ?? 0.7);
  const [localBgmVolume, setLocalBgmVolume] = useState<number>(bgmVolumeProp ?? 0.3);
  const [seVolume, setSeVolume] = useState<number>(settings.soundEffectVolume ?? 0.8);
  
  useEffect(() => {
    setMidiDeviceId(settings.selectedMidiDevice ?? null);
  }, [settings.selectedMidiDevice]);
  
  useEffect(() => {
    setVolume(settings.midiVolume ?? 0.8);
  }, [settings.midiVolume]);

  useEffect(() => {
    if (bgmVolumeProp !== undefined) setLocalBgmVolume(bgmVolumeProp);
  }, [bgmVolumeProp]);

  const handleMidiDeviceChange = (deviceId: string | null) => {
    setMidiDeviceId(deviceId);
    updateSettings({ selectedMidiDevice: deviceId });
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    updateSettings({ midiVolume: value });
    updateGlobalVolume(value);
  };

  const handleRootVolumeChange = (value: number) => {
    setRootVolume(value);
    updateSettings({ rootSoundVolume: value });
    FantasySoundManager.setRootVolume(value);
  };

  const handleBgmVolumeChange = (value: number) => {
    setLocalBgmVolume(value);
    onBgmVolumeChange?.(value);
  };

  const handleSeVolumeChange = (value: number) => {
    setSeVolume(value);
    updateSettings({ soundEffectVolume: value });
    FantasySoundManager.setVolume(value);
  };

  const handleToggle = (key: keyof SurvivalDisplaySettings) => {
    const updated = { ...displaySettings, [key]: !displaySettings[key] };
    saveSurvivalDisplaySettings(updated);
    onDisplaySettingsChange(updated);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-gray-800 pb-2">
          <h2 className="text-xl font-bold text-white">
            {isEnglishCopy ? 'Survival Mode Settings' : 'サバイバルモード設定'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* MIDIデバイス設定 */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              {isEnglishCopy ? 'MIDI Device' : 'MIDIデバイス'}
            </label>
            <MidiDeviceSelector
              value={midiDeviceId}
              onChange={handleMidiDeviceChange}
              className="w-full"
            />
            <div className="mt-1 text-xs text-gray-400">
              {isMidiConnected ? (isEnglishCopy ? '✅ Connected' : '✅ 接続済み') : (isEnglishCopy ? '❌ Not connected' : '❌ 未接続')}
            </div>
          </div>

          {/* ピアノ音量設定 */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              {isEnglishCopy ? 'Piano Volume' : 'ピアノ音量'}: {Math.round(volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* 正解時ルート音量設定 */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              {isEnglishCopy ? 'Root Note Volume' : '正解時ルート音量'}: {Math.round(rootVolume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={rootVolume}
              onChange={(e) => handleRootVolumeChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-gray-400 mt-1">
              {isEnglishCopy ? 'Volume of the root note played on correct answer' : 'コード正解時に鳴るルート音の音量'}
            </p>
          </div>

          {/* 効果音音量設定 */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              {isEnglishCopy ? 'Sound Effects Volume' : '効果音音量'}: {Math.round(seVolume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={seVolume}
              onChange={(e) => handleSeVolumeChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-gray-400 mt-1">
              {isEnglishCopy ? 'Volume of magic and attack sound effects' : '魔法や攻撃の効果音の音量'}
            </p>
          </div>

          {/* BGM音量設定 */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              {isEnglishCopy ? 'BGM Volume' : 'BGM音量'}: {Math.round(localBgmVolume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={localBgmVolume}
              onChange={(e) => handleBgmVolumeChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-gray-400 mt-1">
              {isEnglishCopy ? 'Volume of background music' : '背景音楽の音量'}
            </p>
          </div>

          {/* 区切り線 */}
          <div className="border-t border-gray-600 pt-4">
            <h3 className="text-sm font-bold text-gray-300 mb-3">
              {isEnglishCopy ? 'Popup Display' : 'ポップアップ表示'}
            </h3>

            {/* オート選択ポップアップ */}
            <label className="flex items-center justify-between py-2 cursor-pointer group">
              <div className="flex-1">
                <div className="text-sm text-white group-hover:text-yellow-300 transition-colors">
                  {isEnglishCopy ? 'Auto-Select Notifications' : 'オート選択の通知'}
                </div>
                <div className="text-xs text-gray-400">
                  {isEnglishCopy
                    ? 'Show popup when auto-select picks a bonus'
                    : 'オート選択でボーナスを取得した際のポップアップ'}
                </div>
              </div>
              <div className="ml-3 relative">
                <input
                  type="checkbox"
                  checked={displaySettings.showAutoSelectPopup}
                  onChange={() => handleToggle('showAutoSelectPopup')}
                  className="sr-only"
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${
                  displaySettings.showAutoSelectPopup ? 'bg-yellow-500' : 'bg-gray-600'
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-0.5 ${
                    displaySettings.showAutoSelectPopup ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </div>
              </div>
            </label>

            {/* キャラ特有ボーナスポップアップ */}
            <label className="flex items-center justify-between py-2 cursor-pointer group">
              <div className="flex-1">
                <div className="text-sm text-white group-hover:text-yellow-300 transition-colors">
                  {isEnglishCopy ? 'Character Bonus Notifications' : 'キャラ特有ボーナスの通知'}
                </div>
                <div className="text-xs text-gray-400">
                  {isEnglishCopy
                    ? 'Show popup for Lv5 milestone bonuses'
                    : 'レベル5ごとのキャラ特有ボーナスのポップアップ'}
                </div>
              </div>
              <div className="ml-3 relative">
                <input
                  type="checkbox"
                  checked={displaySettings.showCharacterBonusPopup}
                  onChange={() => handleToggle('showCharacterBonusPopup')}
                  className="sr-only"
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${
                  displaySettings.showCharacterBonusPopup ? 'bg-yellow-500' : 'bg-gray-600'
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-0.5 ${
                    displaySettings.showCharacterBonusPopup ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
          >
            {isEnglishCopy ? 'Close' : '閉じる'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurvivalSettingsModal;
