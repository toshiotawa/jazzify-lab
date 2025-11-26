/**
 * 音声入力デバイス管理コンポーネントとカスタムフック
 * マイク入力によるピッチ検出用
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { AudioDevice } from '@/utils/AudioController';

// 音声デバイス管理用カスタムフック
export const useAudioDevices = () => {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // 音声デバイス一覧を取得
  const refreshDevices = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      // mediaDevices API の存在確認
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.enumerateDevices !== 'function') {
        throw new Error('このブラウザではマイク入力がサポートされていません');
      }

      // まずマイク許可を取得
      if (typeof navigator.mediaDevices.getUserMedia === 'function') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          setHasPermission(true);
        } catch (permError) {
          if (permError instanceof Error && permError.name === 'NotAllowedError') {
            setHasPermission(false);
            throw new Error('マイクの使用許可が必要です');
          }
          throw permError;
        }
      }

      // デバイス一覧を取得
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(device => device.kind === 'audioinput');
      
      // 重複排除
      const uniqueDevices = new Map<string, AudioDevice>();
      audioInputs.forEach(device => {
        if (device.deviceId) {
          const key = device.label || device.deviceId;
          if (!uniqueDevices.has(key)) {
            uniqueDevices.set(key, {
              id: device.deviceId,
              name: device.label || `マイク ${device.deviceId.slice(0, 4)}`,
              isDefault: device.deviceId === 'default'
            });
          }
        }
      });

      setDevices(Array.from(uniqueDevices.values()));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '音声デバイスの取得に失敗しました';
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

  // デバイス状態変更の監視
  useEffect(() => {
    if (navigator.mediaDevices && typeof navigator.mediaDevices.addEventListener === 'function') {
      navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
      };
    }
    return undefined;
  }, [refreshDevices]);

  return {
    devices,
    isConnected,
    currentDeviceId,
    isRefreshing,
    error,
    hasPermission,
    refreshDevices,
    setCurrentDeviceId,
    setIsConnected
  };
};

// 音声デバイス選択コンポーネント
interface AudioDeviceSelectorProps {
  value: string | null;
  onChange: (deviceId: string | null) => void;
  className?: string;
}

export const AudioDeviceSelector: React.FC<AudioDeviceSelectorProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const { devices, isRefreshing, error, hasPermission, refreshDevices } = useAudioDevices();

  return (
    <div className={`space-y-3 ${className}`}>
      {/* デバイス選択ドロップダウン */}
      <div>
        <label htmlFor="audio-device-select" className="block text-xs text-blue-200 mb-1">
          使用マイク
        </label>
        <div className="flex gap-2">
          <select
            id="audio-device-select"
            value={value || ''}
            onChange={(e) => onChange(e.target.value || null)}
            className="select select-bordered select-sm flex-1 bg-gray-800 text-white border-blue-600 lp-mobile-select"
            disabled={isRefreshing || hasPermission === false}
          >
            <option value="">なし</option>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {`🎤 ${device.name}${device.isDefault ? ' (デフォルト)' : ''}`}
              </option>
            ))}
          </select>
          
          <button 
            className="btn btn-xs btn-outline btn-blue"
            onClick={refreshDevices}
            disabled={isRefreshing}
            aria-label="マイクを再検出"
          >
            🔄 再検出
          </button>
        </div>
      </div>

      {/* デバイス情報表示 */}
      <div className="text-xs text-blue-200 space-y-1">
        <div className="flex justify-between">
          <span>検出マイク数:</span>
          <span className="font-mono">{devices.length} 個</span>
        </div>
        
        <div className="flex justify-between">
          <span>接続状態:</span>
          {value ? (
            <span className="text-green-400">✅ 選択済み</span>
          ) : (
            <span className="text-gray-400">なし</span>
          )}
        </div>
        
        {hasPermission === false && (
          <div className="text-amber-400 text-xs mt-2 p-2 bg-amber-900 bg-opacity-30 rounded">
            ⚠️ マイクの使用許可が必要です。ブラウザの設定でマイクへのアクセスを許可してください。
          </div>
        )}
        
        {error && hasPermission !== false && (
          <div className="text-red-400 text-xs mt-2 p-2 bg-red-900 bg-opacity-30 rounded">
            ❌ {error}
          </div>
        )}
      </div>

      {/* 使い方ヒント */}
      <div className="text-xs text-gray-400 mt-2">
        💡 ヒント: 楽器やボーカルの単音を認識します。静かな環境で使用してください。
      </div>
    </div>
  );
};

// 入力タイプ選択コンポーネント（MIDI/Audio切り替え）
interface InputTypeSelectorProps {
  value: 'midi' | 'audio';
  onChange: (type: 'midi' | 'audio') => void;
  className?: string;
}

export const InputTypeSelector: React.FC<InputTypeSelectorProps> = ({
  value,
  onChange,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <span className="block text-sm font-medium text-gray-300">
        入力方式
      </span>
      <div className="flex items-center space-x-4" role="radiogroup" aria-label="入力方式">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name="input-type"
            value="midi"
            checked={value === 'midi'}
            onChange={() => onChange('midi')}
            className="radio radio-sm radio-primary"
          />
          <span className="text-sm text-gray-300">🎹 MIDI入力</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name="input-type"
            value="audio"
            checked={value === 'audio'}
            onChange={() => onChange('audio')}
            className="radio radio-sm radio-primary"
          />
          <span className="text-sm text-gray-300">🎤 音声入力</span>
        </label>
      </div>
      <div className="text-xs text-gray-400">
        {value === 'midi' ? (
          'MIDIキーボードやMIDIコントローラーで入力'
        ) : (
          'マイクで楽器やボーカルの音を認識（単音のみ）'
        )}
      </div>
    </div>
  );
};
