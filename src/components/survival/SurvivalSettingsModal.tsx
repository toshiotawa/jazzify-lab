/**
 * サバイバルモード設定モーダル
 * MIDIデバイス・音量・ポップアップ表示設定
 */

import React, { useState, useEffect } from 'react';
import { MidiDeviceSelector, AudioDeviceSelector } from '../ui/MidiDeviceManager';
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
  showLevelUpBonusPopup: boolean;
}

const DEFAULT_DISPLAY_SETTINGS: SurvivalDisplaySettings = {
  showAutoSelectPopup: true,
  showCharacterBonusPopup: true,
  showLevelUpBonusPopup: true,
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
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry, preferredLocale: profile?.preferred_locale });
  
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
          {/* 入力方式選択 */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              {isEnglishCopy ? 'Input Method' : '入力方式'}
            </label>
            <p className="text-xs text-gray-400 mb-3">
              {isEnglishCopy ? 'Choose MIDI (keyboard) or voice input (microphone).' : 'MIDI（キーボード）または音声入力（マイク）を選択できます。'}
            </p>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => updateSettings({ inputMethod: 'midi' })}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  settings.inputMethod === 'midi'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                🎹 MIDI
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ inputMethod: 'voice' })}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  settings.inputMethod === 'voice'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                🎤 {isEnglishCopy ? 'Voice' : '音声'}
              </button>
            </div>

            {settings.inputMethod === 'midi' && (
              <div className="bg-blue-900 bg-opacity-20 p-3 rounded-lg border border-blue-700 border-opacity-30">
                <h4 className="text-sm font-medium text-blue-200 mb-2">🎹 {isEnglishCopy ? 'MIDI Device' : 'MIDIデバイス'}</h4>
                <MidiDeviceSelector
                  value={midiDeviceId}
                  onChange={handleMidiDeviceChange}
                  className="w-full"
                />
                <div className="mt-1 text-xs text-gray-400">
                  {isMidiConnected ? (isEnglishCopy ? '✅ Connected' : '✅ 接続済み') : (isEnglishCopy ? '❌ Not connected' : '❌ 未接続')}
                </div>
              </div>
            )}

            {settings.inputMethod === 'voice' && (
              <div className="bg-purple-900 bg-opacity-20 p-3 rounded-lg border border-purple-700 border-opacity-30">
                <h4 className="text-sm font-medium text-purple-200 mb-2">🎤 {isEnglishCopy ? 'Voice Input Settings' : '音声入力設定'}</h4>
                <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 border-opacity-40 rounded p-2 mb-3">
                  <p className="text-xs text-yellow-300">
                    ⚠️ {isEnglishCopy
                      ? 'Single-note detection only. Chord detection is inaccurate.'
                      : '単音での読み取り専用です。和音の読み取りは不正確です。'}
                  </p>
                </div>
                <div className="bg-orange-900 bg-opacity-30 border border-orange-600 border-opacity-40 rounded p-2 mb-3">
                  <p className="text-xs text-orange-300">
                    🎵 {isEnglishCopy
                      ? 'This mode requires chord input. With voice input, you need to play notes one at a time. Simultaneous chord input is not possible.'
                      : 'このモードはコード（和音）入力が中心のため、音声入力では一音ずつ順番に鳴らして認識させる必要があります。同時押しのような操作はできません。'}
                  </p>
                </div>
                <div className="bg-purple-900 bg-opacity-30 border border-purple-600 border-opacity-40 rounded p-2 mb-3">
                  <p className="text-xs text-purple-300">
                    💡 {isEnglishCopy
                      ? 'Voice input has latency. We recommend shifting note timing to + (later) in timing adjustment.'
                      : '音声入力にはレイテンシがあるため、タイミング調整で+（遅く）方向にずらすことをおすすめします。'}
                  </p>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  {isEnglishCopy ? 'Detect pitch using a microphone. Works on iOS/Android.' : 'マイクを使用してピッチを検出します。iOS/Android対応。'}
                </p>
                <AudioDeviceSelector
                  value={settings.selectedAudioDevice}
                  onChange={(deviceId: string | null) => updateSettings({ selectedAudioDevice: deviceId })}
                />
                <div className="mt-3">
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    {isEnglishCopy ? 'Voice Recognition Sensitivity' : '音声認識の感度'}: {settings.voiceSensitivity}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={settings.voiceSensitivity}
                    onChange={(e) => updateSettings({ voiceSensitivity: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{isEnglishCopy ? 'Low (noise resistant)' : '低（ノイズ耐性）'}</span>
                    <span>{isEnglishCopy ? 'High (sensitive)' : '高（高感度）'}</span>
                  </div>
                </div>
              </div>
            )}
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
            <p className="text-xs text-gray-400 mt-1">
              {isEnglishCopy
                ? 'If the piano sound is delayed, set the volume to 0% and play audio from your own device or DAW.'
                : 'ピアノの音が遅れて聴こえる際は、ピアノ音量を0％にして、ご自身のデバイスもしくはDAWから音を鳴らしてください。'}
            </p>
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

            {/* レベルアップボーナス選択時の通知 */}
            <label className="flex items-center justify-between py-2 cursor-pointer group">
              <div className="flex-1">
                <div className="text-sm text-white group-hover:text-yellow-300 transition-colors">
                  {isEnglishCopy ? 'Level-Up Bonus Notifications' : 'レベルアップボーナスの通知'}
                </div>
                <div className="text-xs text-gray-400">
                  {isEnglishCopy
                    ? 'Show popup when you select a level-up bonus'
                    : 'レベルアップボーナスを選択した際のポップアップ'}
                </div>
              </div>
              <div className="ml-3 relative">
                <input
                  type="checkbox"
                  checked={displaySettings.showLevelUpBonusPopup}
                  onChange={() => handleToggle('showLevelUpBonusPopup')}
                  className="sr-only"
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${
                  displaySettings.showLevelUpBonusPopup ? 'bg-yellow-500' : 'bg-gray-600'
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-0.5 ${
                    displaySettings.showLevelUpBonusPopup ? 'translate-x-5' : 'translate-x-0.5'
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
