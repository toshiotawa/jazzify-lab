/**
 * サバイバルモード設定モーダル
 * MIDIデバイス選択と音量設定のみ
 */

import React, { useState, useEffect } from 'react';
import { MidiDeviceSelector } from '../ui/MidiDeviceManager';
import { bgmManager } from '@/utils/BGMManager';
import { updateGlobalVolume } from '@/utils/MidiController';
import { useGameStore } from '@/stores/gameStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';

interface SurvivalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMidiConnected?: boolean;
}

const SurvivalSettingsModal: React.FC<SurvivalSettingsModalProps> = ({
  isOpen,
  onClose,
  isMidiConnected = false,
}) => {
  const { settings, updateSettings } = useGameStore();
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });
  
  const [midiDeviceId, setMidiDeviceId] = useState<string | null>(settings.selectedMidiDevice ?? null);
  const [volume, setVolume] = useState<number>(settings.midiVolume ?? 0.8);
  
  // propsのmidiDeviceIdが変更されたら更新
  useEffect(() => {
    setMidiDeviceId(settings.selectedMidiDevice ?? null);
  }, [settings.selectedMidiDevice]);
  
  // propsのvolumeが変更されたら更新
  useEffect(() => {
    setVolume(settings.midiVolume ?? 0.8);
  }, [settings.midiVolume]);

  // MIDIデバイス変更ハンドラー
  const handleMidiDeviceChange = (deviceId: string | null) => {
    setMidiDeviceId(deviceId);
    updateSettings({ selectedMidiDevice: deviceId });
  };

  // 音量変更ハンドラー
  const handleVolumeChange = (value: number) => {
    setVolume(value);
    updateSettings({ midiVolume: value });
    updateGlobalVolume(value);
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
