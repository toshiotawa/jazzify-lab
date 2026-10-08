import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { VoiceEchoCancellationControl } from '../VoiceEchoCancellationControl';
import { VoiceInputChannelControl } from '../VoiceInputChannelControl';
import { useStandaloneNoteInput } from '@/hooks/useStandaloneNoteInput';
import { useGameStore } from '@/stores/gameStore';

const { connect, disconnect, destroy } = vi.hoisted(() => ({
  connect: vi.fn().mockResolvedValue(true),
  disconnect: vi.fn().mockResolvedValue(undefined),
  destroy: vi.fn(),
}));

vi.mock('@/utils/PitchInputController', () => ({
  PitchInputController: class {
    static isSupported() { return true; }
    static getLatencyStats() { return { inputLevelDb: null }; }
    connect = connect;
    disconnect = disconnect;
    destroy = destroy;
    setPitchStableFrames() {}
    setLowRegister() {}
    setSensitivity() {}
    setExpectedPitchMask() {}
    setExpectedPitchCandidates() {}
  },
}));
vi.mock('@/utils/MidiController', () => ({
  updateGlobalVolume: vi.fn(),
  MIDIController: class {
    setConnectionChangeCallback() {}
    setKeyHighlightCallback() {}
    initialize() {}
    disconnect() {}
    destroy() {}
  },
}));
vi.mock('@/utils/ensureBattlePianoAudio', () => ({ ensureBattlePianoAudio: async () => undefined }));
vi.mock('@/utils/iosbridge', () => ({ isIOSWebView: () => false }));

const InputSession = () => {
  useStandaloneNoteInput({ onNoteOn: () => undefined });
  return <><VoiceEchoCancellationControl isEnglishCopy={false} /><VoiceInputChannelControl isEnglishCopy={false} /></>;
};

describe('VoiceEchoCancellationControl with a microphone session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGameStore.getState().resetSettings();
    useGameStore.getState().updateSettings({ inputMethod: 'voice', selectedAudioDevice: 'external-mic' });
  });

  afterEach(() => {
    cleanup();
    useGameStore.getState().resetSettings();
  });

  it('reconnects with OFF and ON, retains the selection on remount, and does not reconnect for volume changes', async () => {
    const view = render(<InputSession />);
    await act(async () => { await Promise.resolve(); });
    await waitFor(() => expect(connect).toHaveBeenLastCalledWith('external-mic', true, 1));
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox', { name: 'エコーキャンセル' }));
    });
    await waitFor(() => expect(connect).toHaveBeenLastCalledWith('external-mic', false, 1));
    expect(connect).toHaveBeenCalledTimes(2);
    expect(useGameStore.getState().settings.voiceEchoCancellation).toBe(false);
    await act(async () => {
      useGameStore.getState().updateSettings({ midiVolume: 0.4 });
    });
    expect(connect).toHaveBeenCalledTimes(2);
    view.unmount();
    expect(destroy).toHaveBeenCalledOnce();
    render(<InputSession />);
    await act(async () => { await Promise.resolve(); });
    await waitFor(() => expect(connect).toHaveBeenCalledTimes(3));
    expect(connect).toHaveBeenLastCalledWith('external-mic', false, 1);
    expect(screen.getByRole('checkbox', { name: 'エコーキャンセル' })).not.toBeChecked();
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox', { name: 'エコーキャンセル' }));
    });
    await waitFor(() => expect(connect).toHaveBeenLastCalledWith('external-mic', true, 1));
    expect(connect).toHaveBeenCalledTimes(4);
  });

  it('reconnects on channel selection and keeps Input 2 on remount', async () => {
    const view = render(<InputSession />);
    await act(async () => { await Promise.resolve(); });
    await waitFor(() => expect(connect).toHaveBeenLastCalledWith('external-mic', true, 1));
    await act(async () => {
      fireEvent.change(screen.getByRole('combobox', { name: 'マイク入力チャンネル' }), { target: { value: '2' } });
    });
    await waitFor(() => expect(connect).toHaveBeenLastCalledWith('external-mic', true, 2));
    expect(connect).toHaveBeenCalledTimes(2);
    view.unmount();
    render(<InputSession />);
    await act(async () => { await Promise.resolve(); });
    await waitFor(() => expect(connect).toHaveBeenCalledTimes(3));
    expect(connect).toHaveBeenLastCalledWith('external-mic', true, 2);
    expect(screen.getByRole('combobox', { name: 'マイク入力チャンネル' })).toHaveValue('2');
  });
});
