import { useGameStore } from '@/stores/gameStore';
import type { InputMethod } from '@/types';
import { getSharedMidiAccess } from '@/utils/MidiController';
import { isIOSWebView } from '@/utils/iosbridge';

export interface AssignmentInputSnapshot {
  inputMethod: InputMethod;
  midiApiAvailable: boolean;
  midiDeviceCount: number;
  midiConnected: boolean;
}

const isVirtualNetworkDevice = (name: string): boolean =>
  /\bSession \d+$/i.test(name);

const countMidiInputDevices = (midiAccess: MIDIAccess): number => {
  let count = 0;
  midiAccess.inputs.forEach((input) => {
    if (isVirtualNetworkDevice(input.name ?? '')) return;
    count += 1;
  });
  return count;
};

export const isWebMidiApiAvailable = (): boolean => {
  if (typeof navigator === 'undefined') {
    return false;
  }
  if (isIOSWebView()) {
    return true;
  }
  const ua = navigator.userAgent;
  const isIOSBrowser = /iPad|iPhone|iPod/.test(ua)
    || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (isIOSBrowser) {
    return false;
  }
  return typeof navigator.requestMIDIAccess === 'function';
};

export const collectAssignmentInputSnapshot = async (): Promise<AssignmentInputSnapshot> => {
  const { settings } = useGameStore.getState();
  const inputMethod = settings.inputMethod;
  const midiApiAvailable = isWebMidiApiAvailable();

  if (inputMethod === 'voice') {
    return {
      inputMethod: 'voice',
      midiApiAvailable,
      midiDeviceCount: 0,
      midiConnected: false,
    };
  }

  if (!midiApiAvailable) {
    return {
      inputMethod: 'midi',
      midiApiAvailable: false,
      midiDeviceCount: 0,
      midiConnected: false,
    };
  }

  if (isIOSWebView()) {
    const selected = settings.selectedMidiDevice;
    return {
      inputMethod: 'midi',
      midiApiAvailable: true,
      midiDeviceCount: selected ? 1 : 0,
      midiConnected: selected != null && selected.length > 0,
    };
  }

  try {
    const midiAccess = await getSharedMidiAccess();
    const midiDeviceCount = countMidiInputDevices(midiAccess);
    const selected = settings.selectedMidiDevice;
    let midiConnected = false;
    if (selected) {
      const input = midiAccess.inputs.get(selected);
      midiConnected = input?.state === 'connected';
    }
    return {
      inputMethod: 'midi',
      midiApiAvailable: true,
      midiDeviceCount,
      midiConnected,
    };
  } catch {
    return {
      inputMethod: 'midi',
      midiApiAvailable: true,
      midiDeviceCount: 0,
      midiConnected: false,
    };
  }
};
