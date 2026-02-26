/**
 * ファンタジーモード設定モーダル
 * MIDIデバイス選択とゲーム設定を管理
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { MidiDeviceSelector, AudioDeviceSelector } from '../ui/MidiDeviceManager';
import { devLog } from '@/utils/logger';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { useGameStore } from '@/stores/gameStore';
import type { DisplayLang } from '@/utils/display-note';

/** 鍵盤上の音名表示スタイル */
type KeyboardNoteNameStyle = 'off' | 'abc' | 'solfege';

interface FantasySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: (settings: FantasySettings) => void;
  midiDeviceId?: string | null;
  onMidiDeviceChange?: (deviceId: string | null) => void;
  isMidiConnected?: boolean;
  volume?: number;
  soundEffectVolume?: number;
  rootSoundVolume?: number;
  bgmVolume?: number;
  noteNameLang?: DisplayLang;
  simpleNoteName?: boolean;
  keyboardNoteNameStyle?: KeyboardNoteNameStyle;
  isDailyChallenge?: boolean;
  isPracticeMode?: boolean;
  showKeyboardGuide?: boolean;
}

interface FantasySettings {
  midiDeviceId: string | null;
  volume: number;
  soundEffectVolume: number;
  rootSoundVolume: number;
  bgmVolume: number;
  noteNameLang: DisplayLang;
  simpleNoteName: boolean;
  keyboardNoteNameStyle: KeyboardNoteNameStyle;
  showKeyboardGuide?: boolean;
}

const FantasySettingsModal: React.FC<FantasySettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsChange,
  midiDeviceId = null,
  onMidiDeviceChange,
  isMidiConnected = false,
  volume = 0.8,
  soundEffectVolume = 0.8,
  rootSoundVolume = 0.7,
  bgmVolume = 0.7,
  noteNameLang = 'en',
  simpleNoteName = false,
  keyboardNoteNameStyle = 'abc',
  isDailyChallenge = false,
  isPracticeMode = false,
  showKeyboardGuide = false
}) => {
  const { settings: gameSettings, updateSettings: updateGameSettings } = useGameStore();
  
  const [settings, setSettings] = useState<FantasySettings>({
    midiDeviceId: midiDeviceId,
    volume: volume,
    soundEffectVolume: soundEffectVolume,
    rootSoundVolume: rootSoundVolume,
    bgmVolume: bgmVolume,
    noteNameLang: noteNameLang,
    simpleNoteName: simpleNoteName,
    keyboardNoteNameStyle: keyboardNoteNameStyle,
    showKeyboardGuide: showKeyboardGuide
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

  // propsのrootSoundVolumeが変更されたらsettingsも更新
  useEffect(() => {
    setSettings(prev => ({ ...prev, rootSoundVolume: rootSoundVolume }));
  }, [rootSoundVolume]);

  // propsのbgmVolumeが変更されたらsettingsも更新
  useEffect(() => {
    setSettings(prev => ({ ...prev, bgmVolume: bgmVolume }));
  }, [bgmVolume]);

  // propsのnoteNameLangが変更されたらsettingsも更新
  useEffect(() => {
    setSettings(prev => ({ ...prev, noteNameLang: noteNameLang }));
  }, [noteNameLang]);

  // propsのsimpleNoteNameが変更されたらsettingsも更新
  useEffect(() => {
    setSettings(prev => ({ ...prev, simpleNoteName: simpleNoteName }));
  }, [simpleNoteName]);

  // propsのkeyboardNoteNameStyleが変更されたらsettingsも更新
  useEffect(() => {
    setSettings(prev => ({ ...prev, keyboardNoteNameStyle: keyboardNoteNameStyle }));
  }, [keyboardNoteNameStyle]);

  // propsのshowKeyboardGuideが変更されたらsettingsも更新
  useEffect(() => {
    setSettings(prev => ({ ...prev, showKeyboardGuide: showKeyboardGuide }));
  }, [showKeyboardGuide]);

  // 設定変更ハンドラー
  const handleSettingChange = (key: keyof FantasySettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
    
    // BGM音量即時反映
    if (key === 'bgmVolume') {
      import('@/utils/BGMManager').then(({ bgmManager }) =>
        bgmManager.setVolume(value)
      );
    }
  };

  // MIDIデバイス変更ハンドラー
  const handleMidiDeviceChange = (deviceId: string | null) => {
    handleSettingChange('midiDeviceId', deviceId);
    onMidiDeviceChange?.(deviceId);
  };

  // 効果音音量変更ハンドラー
  const handleSoundEffectVolumeChange = (value: number) => {
    handleSettingChange('soundEffectVolume', value);
    FantasySoundManager.setVolume(value);
  };

  // ルート音量変更ハンドラー
  const handleRootSoundVolumeChange = (value: number) => {
    handleSettingChange('rootSoundVolume', value);
    FantasySoundManager.setRootVolume(value);
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
          <h2 className="text-xl font-bold text-white">
            {isDailyChallenge ? 'デイリーチャレンジ設定' : 'ファンタジーモード設定'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* 入力方式選択 */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              入力方式
            </label>
            <p className="text-xs text-gray-400 mb-3">
              MIDI（キーボード）または音声入力（マイク）を選択できます。
            </p>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => updateGameSettings({ inputMethod: 'midi' })}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  gameSettings.inputMethod === 'midi'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                🎹 MIDI
              </button>
              <button
                type="button"
                onClick={() => updateGameSettings({ inputMethod: 'voice' })}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  gameSettings.inputMethod === 'voice'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                🎤 音声
              </button>
            </div>

            {gameSettings.inputMethod === 'midi' && (
              <div className="bg-blue-900 bg-opacity-20 p-3 rounded-lg border border-blue-700 border-opacity-30">
                <h4 className="text-sm font-medium text-blue-200 mb-2">🎹 MIDIデバイス</h4>
                <MidiDeviceSelector
                  value={settings.midiDeviceId}
                  onChange={handleMidiDeviceChange}
                  className="w-full"
                />
                <div className="mt-1 text-xs text-gray-400">
                  {isMidiConnected ? '✅ 接続済み' : '❌ 未接続'}
                </div>
              </div>
            )}

            {gameSettings.inputMethod === 'voice' && (
              <div className="bg-purple-900 bg-opacity-20 p-3 rounded-lg border border-purple-700 border-opacity-30">
                <h4 className="text-sm font-medium text-purple-200 mb-2">🎤 音声入力設定</h4>
                <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 border-opacity-40 rounded p-2 mb-3">
                  <p className="text-xs text-yellow-300">
                    ⚠️ 単音での読み取り専用です。和音の読み取りは不正確です。
                  </p>
                </div>
                <div className="bg-orange-900 bg-opacity-30 border border-orange-600 border-opacity-40 rounded p-2 mb-3">
                  <p className="text-xs text-orange-300">
                    🎵 このモードはコード（和音）入力が中心のため、音声入力では一音ずつ順番に鳴らして認識させる必要があります。同時押しのような操作はできません。
                  </p>
                </div>
                <div className="bg-purple-900 bg-opacity-30 border border-purple-600 border-opacity-40 rounded p-2 mb-3">
                  <p className="text-xs text-purple-300">
                    💡 音声入力にはレイテンシがあるため、タイミング調整で+（遅く）方向にずらすことをおすすめします。
                  </p>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  マイクを使用してピッチを検出します。iOS/Android対応。
                </p>
                <AudioDeviceSelector
                  value={gameSettings.selectedAudioDevice}
                  onChange={(deviceId: string | null) => updateGameSettings({ selectedAudioDevice: deviceId })}
                />
                <div className="mt-3">
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    音声認識の感度: {gameSettings.voiceSensitivity}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={gameSettings.voiceSensitivity}
                    onChange={(e) => updateGameSettings({ voiceSensitivity: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>低（ノイズ耐性）</span>
                    <span>高（高感度）</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ピアノ音量設定 */}
          <div>
            <label className="block text.sm font-medium text-white mb-2">
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
            <p className="text-xs text-gray-400 mt-1">
              ピアノの音が遅れて聴こえる際は、ピアノ音量を0％にして、ご自身のデバイスもしくはDAWから音を鳴らしてください。
            </p>
          </div>

          {/* 正解時ルート音量設定 */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              正解時ルート音量: {Math.round(settings.rootSoundVolume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.rootSoundVolume}
              onChange={(e) => handleRootSoundVolumeChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-gray-400 mt-1">
              コード正解時に鳴るルート音の音量を調整できます
            </p>
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

          {/* BGM音量 */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              BGM音量: {Math.round(settings.bgmVolume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.bgmVolume}
              onChange={(e) =>
                handleSettingChange('bgmVolume', parseFloat(e.target.value))
              }
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-gray-400 mt-1">
              背景音楽の音量を調整できます
            </p>
          </div>

          {/* タイミング調整 */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              表示タイミング調整 (判定も同期): {gameSettings.timingAdjustment > 0 ? '+' : ''}{gameSettings.timingAdjustment}ms
            </label>
            <div className="text-xs text-gray-400 mb-2">
              ノーツの表示位置と判定タイミングを調整します（早く: -, 遅く: +）
            </div>
            {gameSettings.inputMethod === 'voice' && (
              <div className="bg-purple-900 bg-opacity-30 border border-purple-600 border-opacity-40 rounded p-2 mb-2">
                <p className="text-xs text-purple-300">
                  🎤 音声入力使用中: マイクのレイテンシを補正するため、+（遅く）方向への調整をおすすめします。
                </p>
              </div>
            )}
            <input
              type="range"
              min="-400"
              max="400"
              step="1"
              value={gameSettings.timingAdjustment}
              onChange={(e) => updateGameSettings({ timingAdjustment: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>-400ms (早く)</span>
              <span>0ms</span>
              <span>+400ms (遅く)</span>
            </div>
          </div>

          {/* 鍵盤上にガイドを表示（練習モード時のみ表示・変更可能） */}
          {isPracticeMode && (
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.showKeyboardGuide}
                  onChange={(e) => handleSettingChange('showKeyboardGuide', e.target.checked)}
                  className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-white">
                  鍵盤上にガイドを表示
                </span>
              </label>
              <p className="text-xs text-gray-400 mt-1">
                練習モード時のみ、押すべき鍵盤をハイライト表示します
              </p>
            </div>
          )}

          {/* 鍵盤上の音名表示設定 */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              鍵盤上の音名表示
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="keyboardNoteNameStyle"
                  value="abc"
                  checked={settings.keyboardNoteNameStyle === 'abc'}
                  onChange={(e) => handleSettingChange('keyboardNoteNameStyle', e.target.value)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-white">英語 (C, D, E)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="keyboardNoteNameStyle"
                  value="solfege"
                  checked={settings.keyboardNoteNameStyle === 'solfege'}
                  onChange={(e) => handleSettingChange('keyboardNoteNameStyle', e.target.value)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-white">ドレミ</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="keyboardNoteNameStyle"
                  value="off"
                  checked={settings.keyboardNoteNameStyle === 'off'}
                  onChange={(e) => handleSettingChange('keyboardNoteNameStyle', e.target.value)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-white">OFF</span>
              </label>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              鍵盤に表示される音名のスタイルを切り替えます
            </p>
          </div>

          {/* 音名表示設定（デイリーチャレンジ以外で表示） */}
          {!isDailyChallenge && (
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
          )}

          {/* 簡易表記設定（デイリーチャレンジ以外で表示） */}
          {!isDailyChallenge && (
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
          )}
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