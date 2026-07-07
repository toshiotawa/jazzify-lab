import { beforeEach, describe, expect, it, vi } from 'vitest';

import { collectAssignmentInputSnapshot } from '@/utils/analytics/assignmentInputSnapshot';
import { useGameStore } from '@/stores/gameStore';

const getSharedMidiAccessMock = vi.fn();

vi.mock('@/utils/MidiController', () => ({
  getSharedMidiAccess: () => getSharedMidiAccessMock(),
}));

vi.mock('@/utils/iosbridge', () => ({
  isIOSWebView: () => false,
}));

describe('assignmentInputSnapshot', () => {
  beforeEach(() => {
    getSharedMidiAccessMock.mockReset();
    useGameStore.getState().resetSettings();
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      configurable: true,
      value: undefined,
    });
  });

  it('voice 入力時は midi_connected を false にする', async () => {
    useGameStore.getState().updateSettings({ inputMethod: 'voice' });

    const snapshot = await collectAssignmentInputSnapshot();

    expect(snapshot).toEqual({
      inputMethod: 'voice',
      midiApiAvailable: false,
      midiDeviceCount: 0,
      midiConnected: false,
    });
  });

  it('MIDI API 非対応ブラウザでは midi_api_available=false', async () => {
    const snapshot = await collectAssignmentInputSnapshot();

    expect(snapshot.inputMethod).toBe('midi');
    expect(snapshot.midiApiAvailable).toBe(false);
    expect(snapshot.midiDeviceCount).toBe(0);
    expect(snapshot.midiConnected).toBe(false);
  });

  it('選択デバイスが接続済みなら midi_connected=true', async () => {
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      configurable: true,
      value: vi.fn(),
    });
    const inputs = new Map<string, MIDIInput>([
      ['device-1', { id: 'device-1', name: 'Keyboard', state: 'connected' } as MIDIInput],
    ]);
    getSharedMidiAccessMock.mockResolvedValue({ inputs } satisfies Pick<MIDIAccess, 'inputs'>);
    useGameStore.getState().updateSettings({ selectedMidiDevice: 'device-1' });

    const snapshot = await collectAssignmentInputSnapshot();

    expect(snapshot.midiApiAvailable).toBe(true);
    expect(snapshot.midiDeviceCount).toBe(1);
    expect(snapshot.midiConnected).toBe(true);
  });
});
