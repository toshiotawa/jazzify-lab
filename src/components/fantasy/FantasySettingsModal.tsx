/**
 * ファンタジーモード設定モーダル
 * MIDIデバイス選択とゲーム設定を管理
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { MidiDeviceSelector } from '../ui/MidiDeviceManager';
import { devLog } from '@/utils/logger';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import type { DisplayLang } from '@/utils/display-note';

interface FantasySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: (settings: FantasySettings) => void;
  midiDeviceId?: string | null;
  onMidiDeviceChange?: (deviceId: string | null) => void;
  isMidiConnected?: boolean;
  volume?: number; // ピアノ音量設定をpropsで受け取る
  soundEffectVolume?: number; // 効果音音量設定をpropsで受け取る
  noteNameLang?: DisplayLang; // 音名表示言語
  simpleNoteName?: boolean; // 簡易表記
}

interface FantasySettings {
  midiDeviceId: string | null;
  volume: number; // ピアノ音量
  soundEffectVolume: number; // 効果音音量
  showGuide: boolean;
  noteNameLang: DisplayLang; // 音名表示言語
  simpleNoteName: boolean; // 簡易表記
}

const FantasySettingsModal: React.FC<FantasySettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsChange,
  midiDeviceId = null,
  onMidiDeviceChange,
  isMidiConnected = false,
  volume = 0.8, // デフォルト80%音量
  soundEffectVolume = 0.8, // デフォルト80%効果音音量
  noteNameLang = 'en', // デフォルト英語表記
  simpleNoteName = false // デフォルト簡易表記OFF
}) => {
  const [settings, setSettings] = useState<FantasySettings>({
    midiDeviceId: midiDeviceId,
    volume: volume, // propsから受け取ったピアノ音量を使用
    soundEffectVolume: soundEffectVolume, // propsから受け取った効果音音量を使用
    showGuide: false,
    noteNameLang: noteNameLang,
    simpleNoteName: simpleNoteName
  });
  
  // propsのmidiDeviceIdが変更されたらsettingsも更新
  useEffect(() => {
    setSettings(prev => ({ ...prev, midiDeviceId: midiDeviceId }));
  }, [midiDeviceId]);
  
  // propsのvolumeが変更されたらsettingsも更新
  useEffect(() => {
    setSettings(prev => ({ ...prev, volume: volume }));
  }, [volume]);

  // propsのsoundEffectVolumeが変更されたらsettingsも更新
  useEffect(() => {
    setSettings(prev => ({ ...prev, soundEffectVolume: soundEffectVolume }));
  }, [soundEffectVolume]);

  // propsのnoteNameLangが変更されたらsettingsも更新
  useEffect(() => {
    setSettings(prev => ({ ...prev, noteNameLang: noteNameLang }));
  }, [noteNameLang]);

  // propsのsimpleNoteNameが変更されたらsettingsも更新
  useEffect(() => {
    setSettings(prev => ({ ...prev, simpleNoteName: simpleNoteName }));
  }, [simpleNoteName]);

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

  // 効果音音量変更ハンドラー
  const handleSoundEffectVolumeChange = (value: number) => {
    handleSettingChange('soundEffectVolume', value);
    // FantasySoundManagerの音量も即座に更新
    FantasySoundManager.setVolume(value);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose} // 画面外クリックで閉じる
    >
      <div 
        className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // モーダル内のクリックは伝播を止める
      >
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-gray-800 pb-2">
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

          {/* ピアノ音量設定 */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              ピアノ音量: {Math.round(settings.volume * 100)}%
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
              効果音音量: {Math.round(settings.soundEffectVolume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.soundEffectVolume}
              onChange={(e) => handleSoundEffectVolumeChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-gray-400 mt-1">
              魔法や敵の攻撃音の音量を調整できます
            </p>
          </div>

          {/* 音名表示設定 */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              ヒント音名表示言語
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="noteNameLang"
                  value="en"
                  checked={settings.noteNameLang === 'en'}
                  onChange={(e) => handleSettingChange('noteNameLang', e.target.value)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-white">英語 (C, D, E)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="noteNameLang"
                  value="solfege"
                  checked={settings.noteNameLang === 'solfege'}
                  onChange={(e) => handleSettingChange('noteNameLang', e.target.value)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-white">ドレミ</span>
              </label>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              ヒント表示の音名言語を切り替えます（コードネームは常に英語表記）
            </p>
          </div>

          {/* 簡易表記設定 */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.simpleNoteName}
                onChange={(e) => handleSettingChange('simpleNoteName', e.target.checked)}
                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-white">
                ヒント音名の簡易表記
              </span>
            </label>
            <p className="text-xs text-gray-400 mt-1">
              ヒント表示のダブルシャープ・ダブルフラットを基本音名に変換します（例: Fx → G）
            </p>
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