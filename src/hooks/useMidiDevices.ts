import { useState, useEffect, useCallback } from 'react';
import type { MidiDevice } from '@/types';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { isIOSWebView, requestNativeMIDIDevices, selectNativeMIDIDevice } from '@/utils/iosbridge';

let cachedMidiAccess: MIDIAccess | null = null;
let midiAccessPromise: Promise<MIDIAccess> | null = null;

const getMidiAccess = (): Promise<MIDIAccess> => {
  if (cachedMidiAccess) return Promise.resolve(cachedMidiAccess);
  if (midiAccessPromise) return midiAccessPromise;
  midiAccessPromise = navigator.requestMIDIAccess({ sysex: false }).then((access) => {
    cachedMidiAccess = access;
    return access;
  });
  return midiAccessPromise;
};

const isVirtualNetworkDevice = (name: string): boolean =>
  /\bSession \d+$/i.test(name);

const enumerateMidiDevices = (midiAccess: MIDIAccess): MidiDevice[] => {
  const deviceList: MidiDevice[] = [];
  midiAccess.inputs.forEach((input) => {
    if (isVirtualNetworkDevice(input.name ?? '')) return;
    deviceList.push({
      id: input.id,
      name: input.name || `Unknown Device (${input.id})`,
      manufacturer: input.manufacturer || '',
      connected: input.state === 'connected',
    });
  });
  return deviceList;
};

export const useMidiDevices = () => {
  const [devices, setDevices] = useState<MidiDevice[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iosNative = isIOSWebView();

  const refreshDevices = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      if (iosNative) {
        requestNativeMIDIDevices();
        setTimeout(() => setIsRefreshing(false), 500);
        return;
      }

      if (!navigator.requestMIDIAccess) {
        const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
        const isIOS = /iPad|iPhone|iPod/.test(ua)
          || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
        const enCopy = shouldUseEnglishCopy();
        const message = isIOS
          ? (enCopy
            ? 'Web MIDI API is not available in iPhone/iPad browsers. Use the Jazzify iOS app to connect a MIDI keyboard via USB.'
            : 'iPhone/iPad のブラウザでは Web MIDI API が利用できません。MIDIキーボードは Jazzify iOSアプリからUSB接続してください。')
          : 'Web MIDI API is not supported in this browser';
        throw new Error(message);
      }

      const midiAccess = await getMidiAccess();
      const deviceList = enumerateMidiDevices(midiAccess);
      setDevices(deviceList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setDevices([]);
    } finally {
      if (!iosNative) setIsRefreshing(false);
    }
  }, [iosNative]);

  useEffect(() => {
    if (!iosNative) return;

    window.onNativeMidiDevices = (nativeDevices) => {
      const deviceList: MidiDevice[] = nativeDevices
        .filter((d) => !isVirtualNetworkDevice(d.displayName ?? ''))
        .map((d) => ({
          id: String(d.uniqueID),
          name: d.displayName || `Unknown Device (${d.uniqueID})`,
          manufacturer: d.manufacturer || '',
          connected: true,
        }));
      setDevices(deviceList);
      setIsRefreshing(false);
    };

    window.onNativeMidiSelected = (uniqueID: number) => {
      const id = String(uniqueID);
      setCurrentDeviceId(id);
      setIsConnected(true);
    };

    requestNativeMIDIDevices();

    return () => {
      window.onNativeMidiDevices = undefined;
      window.onNativeMidiSelected = undefined;
    };
  }, [iosNative]);

  useEffect(() => {
    if (iosNative) return;
    if (!navigator.requestMIDIAccess) return;
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const init = async () => {
      try {
        const midiAccess = await getMidiAccess();
        if (cancelled) return;

        midiAccess.onstatechange = () => {
          if (!cancelled) {
            setDevices(enumerateMidiDevices(midiAccess));
          }
        };

        let attempt = 0;
        const reEnumerate = () => {
          if (cancelled) return;
          const list = enumerateMidiDevices(midiAccess);
          setDevices(list);
          if (list.length === 0 && attempt < 10) {
            attempt += 1;
            pollTimer = setTimeout(reEnumerate, 1500);
          }
        };
        reEnumerate();
      } catch {
        /* requestMIDIAccess 失敗時は refreshDevices に任せる */
      }
    };

    void init();

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [iosNative]);

  const selectNativeDevice = useCallback((deviceId: string | null) => {
    if (!iosNative) return;
    if (deviceId) {
      selectNativeMIDIDevice(Number(deviceId));
    }
  }, [iosNative]);

  return {
    devices,
    isConnected,
    currentDeviceId,
    isRefreshing,
    error,
    refreshDevices,
    setCurrentDeviceId,
    setIsConnected,
    selectNativeDevice,
    iosNative,
  };
};
