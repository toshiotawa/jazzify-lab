/**
 * ファンタジーモード設定モーダル
 * MIDIデバイス選択とゲーム設定を管理
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { MidiDeviceSelector } from '../ui/MidiDeviceManager';
import { MIDIController } from '@/utils/MidiController';
import { devLog } from '@/utils/logger';

interface FantasySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: (settings: FantasySettings) => void;
}

interface FantasySettings {
  midiDeviceId: string | null;
  volume: number;
  showGuide: boolean;
}

const FantasySettingsModal: React.FC<FantasySettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<FantasySettings>({
    midiDeviceId: null,
    volume: 0.8,
    showGuide: false
  });
  
  const [midiController, setMidiController] = useState<MIDIController | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // MIDIコントローラーの初期化
  useEffect(() => {
    if (isOpen) {
      const controller = new MIDIController({
        onNoteOn: (note: number, velocity?: number) => {
          devLog.debug('🎹 MIDI Note On:', { note, velocity });
        },
        onNoteOff: (note: number) => {
          devLog.debug('🎹 MIDI Note Off:', { note });
        }
      });

      controller.setConnectionChangeCallback((connected: boolean) => {
        setIsConnected(connected);
        devLog.debug('🎹 MIDI接続状態変更:', { connected });
      });

      setMidiController(controller);

      // 初期化
      controller.initialize().catch(error => {
        devLog.debug('❌ MIDI初期化エラー:', error);
      });

      return () => {
        controller.destroy();
      };
    }
  }, [isOpen]);

  // 設定変更ハンドラー
  const handleSettingChange = (key: keyof FantasySettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  // MIDIデバイス変更ハンドラー
  const handleMidiDeviceChange = (deviceId: string | null) => {
    if (midiController) {
      if (deviceId) {
        midiController.connectDevice(deviceId);
      } else {
        midiController.disconnect();
      }
    }
    handleSettingChange('midiDeviceId', deviceId);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
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
              {isConnected ? '✅ 接続済み' : '❌ 未接続'}
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