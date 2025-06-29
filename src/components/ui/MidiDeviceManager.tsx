/**
 * MIDIデバイス管理コンポーネントとカスタムフック
 * リアルタイムデバイス検出・接続管理機能
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { MidiDevice } from '@/types';

// MIDIデバイス管理用カスタムフック
export const useMidiDevices = () => {
  const [devices, setDevices] = useState<MidiDevice[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MIDIデバイス一覧を取得
  const refreshDevices = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      // Web MIDI API の存在確認
      if (!navigator.requestMIDIAccess) {
        throw new Error('Web MIDI API is not supported in this browser');
      }

      // MIDI アクセス要求
      const midiAccess = await navigator.requestMIDIAccess();
      
      // デバイス一覧を構築
      const deviceList: MidiDevice[] = [];
      midiAccess.inputs.forEach((input) => {
        deviceList.push({
          id: input.id,
          name: input.name || `Unknown Device (${input.id})`,
          manufacturer: input.manufacturer || '',
          connected: input.state === 'connected'
        });
      });

      setDevices(deviceList);
      console.log(`🎹 Found ${deviceList.length} MIDI devices:`, deviceList);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ MIDI device refresh failed:', err);
      setDevices([]);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // 初回ロード時にデバイス一覧を取得
  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  // MIDIデバイス状態変更の監視
  useEffect(() => {
    let midiAccess: MIDIAccess | null = null;

    const setupMidiStateMonitoring = async () => {
      try {
        midiAccess = await navigator.requestMIDIAccess();
        
        // デバイス状態変更時に一覧を更新
        midiAccess.onstatechange = (event) => {
          console.log('🎹 MIDI device state changed:', event);
          refreshDevices();
        };
      } catch (err) {
        console.warn('⚠️ MIDI state monitoring setup failed:', err);
      }
    };

    setupMidiStateMonitoring();

    return () => {
      if (midiAccess) {
        midiAccess.onstatechange = null;
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
    setIsConnected
  };
};

// MIDIデバイス選択コンポーネント
interface MidiDeviceSelectorProps {
  value: string | null;
  onChange: (deviceId: string | null) => void;
  className?: string;
}

export const MidiDeviceSelector: React.FC<MidiDeviceSelectorProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const { devices, isRefreshing, error, refreshDevices } = useMidiDevices();

  return (
    <div className={`space-y-3 ${className}`}>
      {/* デバイス選択ドロップダウン */}
      <div>
        <label className="block text-xs text-blue-200 mb-1">
          使用デバイス
        </label>
        <div className="flex gap-2">
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value || null)}
            className="select select-bordered select-sm flex-1 bg-gray-800 text-white border-blue-600"
            disabled={isRefreshing}
          >
            <option value="">なし</option>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {`🎹 ${device.name}${!device.connected ? ' (切断)' : ''}`}
              </option>
            ))}
          </select>
          
          <button 
            className="btn btn-xs btn-outline btn-blue"
            onClick={refreshDevices}
            disabled={isRefreshing}
          >
            {isRefreshing ? '🔄' : '🔄'} 再検出
          </button>
        </div>
      </div>

      {/* デバイス情報表示 */}
      <div className="text-xs text-blue-200 space-y-1">
        <div className="flex justify-between">
          <span>検出デバイス数:</span>
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
        
        {error && (
          <div className="text-red-400 text-xs mt-2 p-2 bg-red-900 bg-opacity-30 rounded">
            ❌ {error}
          </div>
        )}
      </div>


    </div>
  );
};

export default MidiDeviceSelector; 