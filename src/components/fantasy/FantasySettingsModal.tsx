/**
 * ファンタジーモード設定モーダル
 * MIDIデバイス選択とゲーム設定を管理
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { MidiDeviceSelector } from '../ui/MidiDeviceManager';
import { devLog } from '@/utils/logger';

interface FantasySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: (settings: FantasySettings) => void;
  midiDeviceId?: string | null;
  onMidiDeviceChange?: (deviceId: string | null) => void;
  isMidiConnected?: boolean;
  volume?: number; // 音量設定をpropsで受け取る
}

interface FantasySettings {
  midiDeviceId: string | null;
  volume: number;
  showGuide: boolean;
  effectVolume: number; // 効果音音量
}

const FantasySettingsModal: React.FC<FantasySettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsChange,
  midiDeviceId = null,
  onMidiDeviceChange,
  isMidiConnected = false,
  volume = 0.8 // デフォルト80%音量
}) => {
  const [settings, setSettings] = useState<FantasySettings>({
    midiDeviceId: midiDeviceId,
    volume: volume, // propsから受け取った音量を使用
    showGuide: false,
    effectVolume: 0.8 // デフォルト80%の効果音音量
  });
  
  // propsのmidiDeviceIdが変更されたらsettingsも更新
  useEffect(() => {
    setSettings(prev => ({ ...prev, midiDeviceId: midiDeviceId }));
  }, [midiDeviceId]);
  
  // propsのvolumeが変更されたらsettingsも更新
  useEffect(() => {
    setSettings(prev => ({ ...prev, volume: volume }));
  }, [volume]);

  // 設定変更ハンドラー
  const handleSettingChange = (key: keyof FantasySettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  // MIDIデバイス変更ハンドラー
  const handleMidiDeviceChange = (deviceId: string | null) => {
    handleSettingChange('midiDeviceId', deviceId);
    onMidiDeviceChange?.(deviceId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">ファンタジーモード設定</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* MIDIデバイス設定 */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              MIDIデバイス
            </label>
            <MidiDeviceSelector
              value={settings.midiDeviceId}
              onChange={handleMidiDeviceChange}
              className="w-full"
            />
            <div className="mt-1 text-xs text-gray-400">
              {isMidiConnected ? '✅ 接続済み' : '❌ 未接続'}
            </div>
          </div>

          {/* 音量設定 */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              音量: {Math.round(settings.volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.volume}
              onChange={(e) => handleSettingChange('volume', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* 効果音音量設定 */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              効果音音量: {Math.round(settings.effectVolume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.effectVolume}
              onChange={(e) => handleSettingChange('effectVolume', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* ガイド表示設定 */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.showGuide}
                onChange={(e) => handleSettingChange('showGuide', e.target.checked)}
                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-white">
                ガイド表示（鍵盤ハイライト）
              </span>
            </label>
            <p className="text-xs text-gray-400 mt-1">
              出題コードの鍵盤がハイライト表示されます
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default FantasySettingsModal; 