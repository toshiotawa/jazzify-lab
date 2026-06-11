import React from 'react';
import { Link } from 'react-router-dom';
import { useMidiDevices } from '@/hooks/useMidiDevices';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

interface LpMidiDeviceSelectorProps {
  value: string | null;
  onChange: (deviceId: string | null) => void;
  className?: string;
}

export const LpMidiDeviceSelector: React.FC<LpMidiDeviceSelectorProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const { devices, isRefreshing, error, refreshDevices, selectNativeDevice, iosNative } = useMidiDevices();
  const en = shouldUseEnglishCopy();

  const handleDeviceChange = (newDeviceId: string | null) => {
    selectNativeDevice(newDeviceId);
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
        <label htmlFor="lp-midi-device-select" className="block text-xs text-blue-200 mb-1">
          {en ? 'Device' : '使用デバイス'}
        </label>
        <div className="flex gap-2">
          <select
            id="lp-midi-device-select"
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
            type="button"
            className="btn btn-xs btn-outline btn-blue"
            onClick={() => { void refreshDevices(); }}
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

        {error && !iosNative && (
          <div className="text-red-400 text-xs mt-2 p-2 bg-red-900 bg-opacity-30 rounded">
            {(() => {
              const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
              const isIOS = /iPad|iPhone|iPod/.test(ua)
                || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
              if (isIOS) {
                return en ? (
                  <div>
                    <div className="mb-1">❌ Web MIDI API is not available in iPhone/iPad browsers.</div>
                    <div className="mb-1">To use a MIDI keyboard, connect via USB in the Jazzify iOS app.</div>
                    <div>
                      <Link to="/help/ios-midi" className="underline text-blue-300">Connection guide</Link>
                      <span className="mx-1">/</span>
                      <Link to="/contact" className="underline text-blue-300">Contact</Link>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-1">❌ iPhone/iPad のブラウザでは Web MIDI API が利用できません。</div>
                    <div className="mb-1">MIDIキーボードは Jazzify iOSアプリからUSB接続してください。</div>
                    <div>
                      <Link to="/help/ios-midi" className="underline text-blue-300">接続方法はこちら</Link>
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
