/**
 * マイク（オーディオ入力）デバイス選択コンポーネント
 */

import React, { useState, useEffect, useCallback } from 'react';
import { log } from '@/utils/logger';

interface AudioInputDeviceSelectorProps {
  value: string | null;
  onChange: (deviceId: string | null) => void;
  disabled?: boolean;
}

export const AudioInputDeviceSelector: React.FC<AudioInputDeviceSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  // デバイス一覧を取得
  const refreshDevices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // まず権限があるか確認
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      if (permissionStatus.state === 'denied') {
        setError('マイクへのアクセスが拒否されています。ブラウザの設定を確認してください。');
        setHasPermission(false);
        setIsLoading(false);
        return;
      }
      
      // 権限がまだ付与されていない場合は、ユーザーに確認を促す
      if (permissionStatus.state === 'prompt') {
        // デバイスリストを取得するために一時的にマイクをリクエスト
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          setHasPermission(true);
        } catch (permError) {
          log.warn('⚠️ マイク権限リクエストが拒否されました:', permError);
          setError('マイクへのアクセスを許可してください');
          setHasPermission(false);
          setIsLoading(false);
          return;
        }
      } else {
        setHasPermission(true);
      }
      
      // デバイス一覧を取得
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(d => d.kind === 'audioinput');
      
      setDevices(audioInputs);
      log.info(`🎤 ${audioInputs.length}個のオーディオ入力デバイスを検出`);
      
    } catch (err) {
      log.error('❌ デバイス一覧の取得に失敗:', err);
      setError('デバイス一覧の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初回マウント時とデバイス変更時にリフレッシュ
  useEffect(() => {
    refreshDevices();
    
    // デバイス変更を監視
    const handleDeviceChange = () => {
      log.info('🔄 デバイス構成が変更されました');
      refreshDevices();
    };
    
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [refreshDevices]);

  // デバイス選択ハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    onChange(selectedValue === '' ? null : selectedValue);
  };

  // 権限リクエストボタンハンドラ
  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      setError(null);
      await refreshDevices();
    } catch (err) {
      log.error('❌ マイク権限リクエストに失敗:', err);
      setError('マイクへのアクセスが拒否されました');
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasPermission) {
    return (
      <div className="space-y-2">
        <div className="text-xs text-gray-400">
          マイク入力を使用するには、ブラウザでマイクへのアクセスを許可する必要があります。
        </div>
        {error && (
          <div className="text-xs text-red-400">{error}</div>
        )}
        <button
          onClick={handleRequestPermission}
          disabled={isLoading}
          className="btn btn-sm btn-outline btn-primary"
        >
          {isLoading ? '確認中...' : '🎤 マイクへのアクセスを許可'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <select
          value={value || ''}
          onChange={handleChange}
          disabled={disabled || isLoading}
          className="select select-bordered select-sm w-full max-w-xs bg-gray-800 text-white border-gray-600"
        >
          <option value="">デフォルトマイク</option>
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `マイク (${device.deviceId.slice(0, 8)}...)`}
            </option>
          ))}
        </select>
        
        <button
          onClick={refreshDevices}
          disabled={isLoading}
          className="btn btn-sm btn-ghost"
          title="デバイス一覧を更新"
        >
          🔄
        </button>
      </div>
      
      {error && (
        <div className="text-xs text-red-400">{error}</div>
      )}
      
      {devices.length === 0 && !error && !isLoading && (
        <div className="text-xs text-yellow-400">
          マイクデバイスが見つかりません
        </div>
      )}
      
      <div className="text-xs text-gray-400">
        {isLoading ? '読み込み中...' : `${devices.length}個のマイクデバイスを検出`}
      </div>
    </div>
  );
};

export default AudioInputDeviceSelector;
