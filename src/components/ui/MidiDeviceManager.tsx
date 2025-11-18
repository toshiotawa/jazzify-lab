/**
 * MIDIデバイス管理コンポーネントとカスタムフック
 * リアルタイムデバイス検出・接続管理機能
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { MidiDevice } from '@/types';
import { Link } from 'react-router-dom';

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
        const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
        const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && (navigator as any).maxTouchPoints > 1);
        const message = isIOS
          ? 'iPhone/iPad では Safari 等で Web MIDI API が利用できません。'
          : 'Web MIDI API is not supported in this browser';
        throw new Error(message);
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


  // デバイス選択時の処理を改善
  const handleDeviceChange = (newDeviceId: string | null) => {
    // 同じデバイスを選択した場合は一度切断してから再接続
    if (newDeviceId && newDeviceId === value) {
      console.log('🔄 同じデバイスが選択されました。再接続を試みます...');
      // 一度nullを設定してから再度設定することで再接続を強制
      onChange(null);
      setTimeout(() => {
        onChange(newDeviceId);
      }, 100);
    } else {
      onChange(newDeviceId);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* デバイス選択ドロップダウン */}
      <div>
        <label htmlFor="midi-device-select" className="block text-xs text-blue-200 mb-1">
          使用デバイス
        </label>
        <div className="flex gap-2">
          <select
            id="midi-device-select"
            value={value || ''}
            onChange={(e) => handleDeviceChange(e.target.value || null)}
            className="select select-bordered select-sm flex-1 bg-gray-800 text-white border-blue-600 lp-mobile-select"
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
            {(() => {
              const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
              const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && (navigator as any).maxTouchPoints > 1);
              if (isIOS) {
                return (
                  <div>
                    <div className="mb-1">❌ iPhone/iPad では Safari 等で Web MIDI API が利用できません。</div>
                    <div className="mb-1">
                      App Store の{' '}
                      <a
                        href="https://apps.apple.com/us/app/web-midi-browser/id953846217?l"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-blue-300"
                      >
                        Web MIDI Browser
                      </a>
                      {' '}のご利用をご検討ください。
                    </div>
                    <div>
                      <Link to="/help/ios-midi" className="underline text-blue-300">詳しくはこちら</Link>
                      <span className="mx-1">/</span>
                      <Link to="/contact" className="underline text-blue-300">お問い合わせ</Link>
                    </div>
                  </div>
                );
              }
              return (
                <div>❌ {error}</div>
              );
            })()}
          </div>
        )}
      </div>


    </div>
  );
};
