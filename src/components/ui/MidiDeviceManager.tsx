/**
 * MIDIデバイス管理コンポーネントとカスタムフック
 * リアルタイムデバイス検出・接続管理機能
 * 
 * AudioDeviceSelector: 音声入力デバイス選択コンポーネント
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { MidiDevice } from '@/types';
import { Link } from 'react-router-dom';
import { VoiceInputController } from '@/utils/VoiceInputController';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';

// MIDIAccess をキャッシュして複数回の requestMIDIAccess 呼び出しを避ける
let cachedMidiAccess: MIDIAccess | null = null;

const getMidiAccess = async (): Promise<MIDIAccess> => {
  if (cachedMidiAccess) return cachedMidiAccess;
  cachedMidiAccess = await navigator.requestMIDIAccess({ sysex: false });
  return cachedMidiAccess;
};

const enumerateMidiDevices = (midiAccess: MIDIAccess): MidiDevice[] => {
  const deviceList: MidiDevice[] = [];
  midiAccess.inputs.forEach((input) => {
    deviceList.push({
      id: input.id,
      name: input.name || `Unknown Device (${input.id})`,
      manufacturer: input.manufacturer || '',
      connected: input.state === 'connected'
    });
  });
  return deviceList;
};

// MIDIデバイス管理用カスタムフック
export const useMidiDevices = () => {
  const [devices, setDevices] = useState<MidiDevice[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MIDIデバイス一覧を取得（リトライ対応）
  const refreshDevices = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      if (!navigator.requestMIDIAccess) {
        const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
        const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && (navigator as any).maxTouchPoints > 1);
        const enCopy = shouldUseEnglishCopy();
        const message = isIOS
          ? (enCopy
              ? 'Web MIDI API is not available on iPhone/iPad Safari.'
              : 'iPhone/iPad では Safari 等で Web MIDI API が利用できません。')
          : 'Web MIDI API is not supported in this browser';
        throw new Error(message);
      }

      const midiAccess = await getMidiAccess();
      let deviceList = enumerateMidiDevices(midiAccess);

      // Web MIDI Browser (iOS) ではデバイス検出が遅延することがあるためリトライ
      if (deviceList.length === 0) {
        for (let attempt = 0; attempt < 3; attempt++) {
          await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
          cachedMidiAccess = null;
          const retryAccess = await getMidiAccess();
          deviceList = enumerateMidiDevices(retryAccess);
          if (deviceList.length > 0) break;
        }
      }

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

  // 初回ロード＋ユーザージェスチャー後の自動再スキャン
  useEffect(() => {
    let gestureCleanup: (() => void) | null = null;

    const initialScan = async () => {
      await refreshDevices();
    };

    initialScan().then(() => {
      // iOS Web MIDI Browser では requestMIDIAccess がユーザージェスチャー後でないと
      // デバイスを返さないことがあるため、0台の場合はインタラクション後に自動再スキャン
      const scheduleGestureRescan = () => {
        const handler = () => {
          cachedMidiAccess = null;
          refreshDevices();
          document.removeEventListener('click', handler);
          document.removeEventListener('touchend', handler);
        };
        document.addEventListener('click', handler, { once: true });
        document.addEventListener('touchend', handler, { once: true });
        gestureCleanup = () => {
          document.removeEventListener('click', handler);
          document.removeEventListener('touchend', handler);
        };
      };
      scheduleGestureRescan();
    });

    return () => {
      gestureCleanup?.();
    };
  }, [refreshDevices]);

  // MIDIデバイス状態変更の監視（キャッシュ済みMIDIAccessを再利用）
  useEffect(() => {
    let midiAccess: MIDIAccess | null = null;
    let cancelled = false;

    const setupMidiStateMonitoring = async () => {
      try {
        if (!navigator.requestMIDIAccess) return;
        midiAccess = await getMidiAccess();
        if (cancelled) return;
        
        midiAccess.onstatechange = () => {
          refreshDevices();
        };
      } catch (err) {
        console.warn('⚠️ MIDI state monitoring setup failed:', err);
      }
    };

    setupMidiStateMonitoring();

    return () => {
      cancelled = true;
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
  const profile = useAuthStore((s) => s.profile);
  const geoCountry = useGeoStore((s) => s.country);
  const en = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });

  const handleDeviceChange = (newDeviceId: string | null) => {
    if (newDeviceId && newDeviceId === value) {
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
      <div>
        <label htmlFor="midi-device-select" className="block text-xs text-blue-200 mb-1">
          {en ? 'Device' : '使用デバイス'}
        </label>
        <div className="flex gap-2">
          <select
            id="midi-device-select"
            value={value || ''}
            onChange={(e) => handleDeviceChange(e.target.value || null)}
            className="select select-bordered select-sm flex-1 bg-gray-800 text-white border-blue-600 lp-mobile-select"
            disabled={isRefreshing}
          >
            <option value="">{en ? 'None' : 'なし'}</option>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {`🎹 ${device.name}${!device.connected ? (en ? ' (disconnected)' : ' (切断)') : ''}`}
              </option>
            ))}
          </select>
          
          <button 
            className="btn btn-xs btn-outline btn-blue"
            onClick={refreshDevices}
            disabled={isRefreshing}
          >
            🔄 {en ? 'Rescan' : '再検出'}
          </button>
        </div>
      </div>

      <div className="text-xs text-blue-200 space-y-1">
        <div className="flex justify-between">
          <span>{en ? 'Devices found:' : '検出デバイス数:'}</span>
          <span className="font-mono">{devices.length}</span>
        </div>
        
        <div className="flex justify-between">
          <span>{en ? 'Status:' : '接続状態:'}</span>
          {value ? (
            <span className="text-green-400">{en ? '✅ Selected' : '✅ 選択済み'}</span>
          ) : (
            <span className="text-gray-400">{en ? 'None' : 'なし'}</span>
          )}
        </div>
        
        {error && (
          <div className="text-red-400 text-xs mt-2 p-2 bg-red-900 bg-opacity-30 rounded">
            {(() => {
              const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
              const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && (navigator as any).maxTouchPoints > 1);
              if (isIOS) {
                return en ? (
                  <div>
                    <div className="mb-1">❌ Web MIDI API is not available on iPhone/iPad Safari.</div>
                    <div className="mb-1">
                      {'Consider using '}
                      <a
                        href="https://apps.apple.com/us/app/web-midi-browser/id953846217?l"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-blue-300"
                      >
                        Web MIDI Browser
                      </a>
                      {' from the App Store.'}
                    </div>
                    <div>
                      <Link to="/help/ios-midi" className="underline text-blue-300">Learn more</Link>
                      <span className="mx-1">/</span>
                      <Link to="/contact" className="underline text-blue-300">Contact</Link>
                    </div>
                  </div>
                ) : (
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

// ===== Audio Device (Voice Input) =====

interface AudioDevice {
  deviceId: string;
  label: string;
}

// オーディオデバイス管理用カスタムフック
export const useAudioDevices = () => {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  // デバイス一覧を取得
  const refreshDevices = useCallback(async (options?: { requestPermission?: boolean }) => {
    setIsRefreshing(true);
    setError(null);

    try {
      if (!VoiceInputController.isSupported()) {
        setIsSupported(false);
        throw new Error(
          shouldUseEnglishCopy()
            ? 'Voice input is not supported in this browser'
            : '音声入力はこのブラウザでサポートされていません'
        );
      }

      // 一時的なコントローラーでデバイス一覧取得
      const tempController = new VoiceInputController({
        onNoteOn: () => {},
        onNoteOff: () => {}
      });

      const deviceList = await tempController.getAudioDevices({ requestPermission: options?.requestPermission });
      tempController.destroy();

      setDevices(deviceList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setDevices([]);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // 初回ロード時にデバイス一覧を取得
  useEffect(() => {
    if (VoiceInputController.isSupported()) {
      refreshDevices({ requestPermission: false });
    } else {
      setIsSupported(false);
      setError(
        shouldUseEnglishCopy()
          ? 'Voice input is not supported in this browser'
          : '音声入力はこのブラウザでサポートされていません'
      );
    }
  }, [refreshDevices]);

  // デバイス変更イベントの監視
  useEffect(() => {
    if (!navigator.mediaDevices) return;

    const handleDeviceChange = () => {
      console.log('🎤 Audio device change detected');
      refreshDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [refreshDevices]);

  return {
    devices,
    isRefreshing,
    error,
    isSupported,
    refreshDevices
  };
};

// 音声入力デバイス選択コンポーネント
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
  const { devices, isRefreshing, error, isSupported, refreshDevices } = useAudioDevices();
  const profile = useAuthStore((s) => s.profile);
  const geoCountry = useGeoStore((s) => s.country);
  const en = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });

  const handleDeviceChange = async (newDeviceId: string | null) => {
    if (!newDeviceId) {
      onChange(null);
      return;
    }

    if (!VoiceInputController.isPermissionGranted()) {
      const permissionOk = await VoiceInputController.requestMicrophonePermission(
        newDeviceId === 'default' ? undefined : newDeviceId
      );
      if (!permissionOk) {
        return;
      }
      void refreshDevices({ requestPermission: false });
    }

    if (newDeviceId && newDeviceId === value) {
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
      <div>
        <label htmlFor="audio-device-select" className="block text-xs text-purple-200 mb-1">
          {en ? 'Microphone' : 'マイクデバイス'}
        </label>
        <div className="flex gap-2">
          <select
            id="audio-device-select"
            value={value || ''}
            onChange={(e) => void handleDeviceChange(e.target.value || null)}
            className="select select-bordered select-sm flex-1 bg-gray-800 text-white border-purple-600 lp-mobile-select"
            disabled={isRefreshing || !isSupported}
          >
            <option value="">{en ? 'Disconnected (Mic OFF)' : '未接続（マイクOFF）'}</option>
            <option value="default">{en ? 'Default' : 'デフォルト'}</option>
            {devices
              .filter((device) => device.deviceId !== 'default' && device.deviceId !== '')
              .map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {`🎤 ${device.label}`}
                </option>
              ))}
          </select>

          <button
            className="btn btn-xs btn-outline btn-purple"
            onClick={() => {
              void refreshDevices({ requestPermission: true });
            }}
            disabled={isRefreshing || !isSupported}
          >
            🔄 {en ? 'Rescan' : '再検出'}
          </button>
        </div>
      </div>

      <div className="text-xs text-purple-200 space-y-1">
        <div className="flex justify-between">
          <span>{en ? 'Devices found:' : '検出デバイス数:'}</span>
          <span className="font-mono">{devices.length}</span>
        </div>

        <div className="flex justify-between">
          <span>{en ? 'Status:' : '接続状態:'}</span>
          {value ? (
            <span className="text-green-400">{en ? '✅ Selected' : '✅ 選択済み'}</span>
          ) : (
            <span className="text-gray-400">{en ? 'Disconnected' : '未接続'}</span>
          )}
        </div>

        {VoiceInputController.isIOS() && (
          <div className="text-yellow-400 text-xs mt-2 p-2 bg-yellow-900 bg-opacity-30 rounded">
            {en
              ? '📱 iOS: Microphone permission will be requested when you select a device.'
              : '📱 iOS環境: マイクは「デバイス選択時」に許可が求められます。'}
          </div>
        )}

        {error && (
          <div className="text-red-400 text-xs mt-2 p-2 bg-red-900 bg-opacity-30 rounded">
            ❌ {error}
          </div>
        )}
      </div>
    </div>
  );
};

// ===== Audio Output Device (Playback) =====

interface AudioOutputDevice {
  deviceId: string;
  label: string;
}

const isAudioOutputSelectionSupported = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  const maybeAudioContext = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (maybeAudioContext && 'setSinkId' in maybeAudioContext.prototype) {
    return true;
  }
  return false;
};

export const useAudioOutputDevices = () => {
  const [devices, setDevices] = useState<AudioOutputDevice[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshDevices = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        throw new Error(
          shouldUseEnglishCopy()
            ? 'Device enumeration is not supported in this browser'
            : 'このブラウザではデバイス一覧取得がサポートされていません'
        );
      }
      const list = await navigator.mediaDevices.enumerateDevices();
      const outputs = list
        .filter((device) => device.kind === 'audiooutput')
        .map((device, idx) => ({
          deviceId: device.deviceId,
          label: device.label || `Speaker ${idx + 1}`
        }));
      setDevices(outputs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setDevices([]);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refreshDevices();
  }, [refreshDevices]);

  useEffect(() => {
    if (!navigator.mediaDevices) return;
    const handleDeviceChange = () => {
      void refreshDevices();
    };
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [refreshDevices]);

  return {
    devices,
    isRefreshing,
    error,
    refreshDevices,
    isSupported: isAudioOutputSelectionSupported()
  };
};

interface AudioOutputDeviceSelectorProps {
  value: string | null;
  onChange: (deviceId: string | null) => void;
  className?: string;
}

export const AudioOutputDeviceSelector: React.FC<AudioOutputDeviceSelectorProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const { devices, isRefreshing, error, refreshDevices, isSupported } = useAudioOutputDevices();
  const profile = useAuthStore((s) => s.profile);
  const geoCountry = useGeoStore((s) => s.country);
  const en = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <label htmlFor="audio-output-device-select" className="block text-xs text-slate-200 mb-1">
          {en ? 'Output Device' : '出力デバイス'}
        </label>
        <div className="flex gap-2">
          <select
            id="audio-output-device-select"
            value={value || 'default'}
            onChange={(e) => onChange(e.target.value || null)}
            className="select select-bordered select-sm flex-1 bg-gray-800 text-white border-slate-600 lp-mobile-select"
            disabled={isRefreshing || !isSupported}
          >
            <option value="default">{en ? 'System Default' : 'システム既定'}</option>
            {devices
              .filter((d) => d.deviceId !== 'default')
              .map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {`🔈 ${device.label}`}
                </option>
              ))}
          </select>
          <button
            className="btn btn-xs btn-outline btn-slate"
            onClick={() => void refreshDevices()}
            disabled={isRefreshing}
          >
            🔄 {en ? 'Rescan' : '再検出'}
          </button>
        </div>
      </div>

      <div className="text-xs text-slate-200 space-y-1">
        <div className="flex justify-between">
          <span>{en ? 'Devices found:' : '検出デバイス数:'}</span>
          <span className="font-mono">{devices.length}</span>
        </div>
        <div className="flex justify-between">
          <span>{en ? 'Compatibility:' : '対応状況:'}</span>
          {isSupported ? (
            <span className="text-green-400">{en ? '✅ Supported' : '✅ 対応'}</span>
          ) : (
            <span className="text-gray-400">{en ? 'Not supported' : '未対応'}</span>
          )}
        </div>

        {!isSupported && (
          <div className="text-yellow-400 text-xs mt-2 p-2 bg-yellow-900 bg-opacity-30 rounded">
            {en
              ? 'Output device selection is not available in this browser (iOS Safari may not be supported).'
              : 'このブラウザでは出力デバイスの切り替えができません（iOS Safari は未対応の場合があります）。'}
          </div>
        )}

        {error && (
          <div className="text-red-400 text-xs mt-2 p-2 bg-red-900 bg-opacity-30 rounded">
            ❌ {error}
          </div>
        )}
      </div>
    </div>
  );
};