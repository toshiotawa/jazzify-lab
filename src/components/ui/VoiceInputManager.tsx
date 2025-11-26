/**
 * 音声入力デバイス管理コンポーネントとカスタムフック
 * マイクからのリアルタイムピッチ検出機能
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceInputController } from '@/utils/VoiceInputController';
import type { VoiceInputSettings, InputMode } from '@/types';

interface AudioDevice {
  id: string;
  name: string;
}

// 音声入力デバイス管理用カスタムフック
export const useVoiceInputDevices = () => {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<VoiceInputController | null>(null);

  // マイクデバイス一覧を取得
  const refreshDevices = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      // getUserMedia の存在確認
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('マイク入力がサポートされていません。ブラウザの設定を確認してください。');
      }

      // 権限を取得するために一時的にメディアを要求
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        tempStream.getTracks().forEach(track => track.stop());
      } catch (permError) {
        throw new Error('マイクへのアクセスが許可されていません。ブラウザの設定を確認してください。');
      }

      // デバイス一覧を取得
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          id: device.deviceId,
          name: device.label || `マイク ${device.deviceId.slice(0, 4)}`
        }));

      setDevices(audioInputs);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setError(errorMessage);
      setDevices([]);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // 初回ロード時にデバイス一覧を取得
  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  // デバイス変更の監視
  useEffect(() => {
    const handleDeviceChange = () => {
      refreshDevices();
    };

    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }

    return () => {
      if (navigator.mediaDevices?.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
    };
  }, [refreshDevices]);

  return {
    devices,
    isConnected,
    currentDeviceId,
    isRefreshing,
    error,
    refreshDevices,
    setCurrentDeviceId,
    setIsConnected,
    controllerRef
  };
};

// 入力モード選択コンポーネント
interface InputModeSelectorProps {
  value: InputMode;
  onChange: (mode: InputMode) => void;
  className?: string;
}

export const InputModeSelector: React.FC<InputModeSelectorProps> = ({
  value,
  onChange,
  className = ''
}) => {
  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => onChange('midi')}
        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          value === 'midi'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        🎹 MIDI
      </button>
      <button
        type="button"
        onClick={() => onChange('voice')}
        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          value === 'voice'
            ? 'bg-green-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        🎤 音声
      </button>
    </div>
  );
};

// 音声入力デバイス選択コンポーネント
interface VoiceInputSelectorProps {
  settings: VoiceInputSettings;
  onChange: (settings: Partial<VoiceInputSettings>) => void;
  className?: string;
}

export const VoiceInputSelector: React.FC<VoiceInputSelectorProps> = ({
  settings,
  onChange,
  className = ''
}) => {
  const { devices, isRefreshing, error, refreshDevices } = useVoiceInputDevices();

  const handleDeviceChange = (deviceId: string | null) => {
    onChange({ selectedDeviceId: deviceId });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* デバイス選択ドロップダウン */}
      <div>
        <label htmlFor="voice-device-select" className="block text-xs text-green-200 mb-1">
          使用マイク
        </label>
        <div className="flex gap-2">
          <select
            id="voice-device-select"
            value={settings.selectedDeviceId || ''}
            onChange={(e) => handleDeviceChange(e.target.value || null)}
            className="select select-bordered select-sm flex-1 bg-gray-800 text-white border-green-600 lp-mobile-select"
            disabled={isRefreshing}
          >
            <option value="">なし</option>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                🎤 {device.name}
              </option>
            ))}
          </select>
          
          <button 
            type="button"
            className="btn btn-xs btn-outline border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
            onClick={refreshDevices}
            disabled={isRefreshing}
          >
            🔄 再検出
          </button>
        </div>
      </div>

      {/* ノイズゲート設定 */}
      <div>
        <label className="block text-xs text-green-200 mb-1">
          ノイズゲート: {Math.round(settings.noiseGateThreshold * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="0.2"
          step="0.01"
          value={settings.noiseGateThreshold}
          onChange={(e) => onChange({ noiseGateThreshold: parseFloat(e.target.value) })}
          className="w-full accent-green-500"
        />
        <p className="text-xs text-gray-400 mt-1">
          値を上げると周囲の雑音に反応しにくくなります
        </p>
      </div>

      {/* デバイス情報表示 */}
      <div className="text-xs text-green-200 space-y-1">
        <div className="flex justify-between">
          <span>検出デバイス数:</span>
          <span className="font-mono">{devices.length} 個</span>
        </div>
        
        <div className="flex justify-between">
          <span>接続状態:</span>
          {settings.selectedDeviceId ? (
            <span className="text-green-400">✅ 選択済み</span>
          ) : (
            <span className="text-gray-400">なし</span>
          )}
        </div>
        
        {error && (
          <div className="text-red-400 text-xs mt-2 p-2 bg-red-900 bg-opacity-30 rounded">
            ❌ {error}
          </div>
        )}
      </div>

      {/* 注意事項 */}
      <div className="text-xs text-gray-400 bg-gray-800 bg-opacity-50 p-2 rounded">
        <p className="font-medium text-gray-300 mb-1">📌 音声入力について</p>
        <ul className="list-disc list-inside space-y-1">
          <li>単音のピッチ検出に最適化されています</li>
          <li>ピアノ/ギターの音やボーカルを認識できます</li>
          <li>静かな環境での使用をお勧めします</li>
        </ul>
      </div>
    </div>
  );
};

// 入力設定パネルコンポーネント（MIDI + Voice 統合）
interface InputSettingsPanelProps {
  inputMode: InputMode;
  voiceSettings: VoiceInputSettings;
  midiDeviceId: string | null;
  onInputModeChange: (mode: InputMode) => void;
  onVoiceSettingsChange: (settings: Partial<VoiceInputSettings>) => void;
  onMidiDeviceChange: (deviceId: string | null) => void;
  className?: string;
}

export const InputSettingsPanel: React.FC<InputSettingsPanelProps> = ({
  inputMode,
  voiceSettings,
  midiDeviceId,
  onInputModeChange,
  onVoiceSettingsChange,
  onMidiDeviceChange,
  className = ''
}) => {
  // MidiDeviceSelector を動的インポート
  const [MidiDeviceSelector, setMidiDeviceSelector] = useState<React.ComponentType<{
    value: string | null;
    onChange: (deviceId: string | null) => void;
    className?: string;
  }> | null>(null);

  useEffect(() => {
    import('./MidiDeviceManager').then(module => {
      setMidiDeviceSelector(() => module.MidiDeviceSelector);
    });
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 入力モード選択 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          入力モード
        </label>
        <InputModeSelector value={inputMode} onChange={onInputModeChange} />
      </div>

      {/* MIDI設定 */}
      {inputMode === 'midi' && MidiDeviceSelector && (
        <div className="bg-blue-900 bg-opacity-20 p-4 rounded-lg border border-blue-700 border-opacity-30">
          <h4 className="text-sm font-medium text-blue-200 mb-3">🎹 MIDI デバイス設定</h4>
          <MidiDeviceSelector
            value={midiDeviceId}
            onChange={onMidiDeviceChange}
          />
        </div>
      )}

      {/* 音声入力設定 */}
      {inputMode === 'voice' && (
        <div className="bg-green-900 bg-opacity-20 p-4 rounded-lg border border-green-700 border-opacity-30">
          <h4 className="text-sm font-medium text-green-200 mb-3">🎤 音声入力設定</h4>
          <VoiceInputSelector
            settings={voiceSettings}
            onChange={onVoiceSettingsChange}
          />
        </div>
      )}
    </div>
  );
};

export default VoiceInputSelector;
