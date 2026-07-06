import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '@/stores/gameStore';

describe('useGameStore updateSettings', () => {
  beforeEach(() => {
    useGameStore.getState().resetSettings();
  });

  it('部分更新で selectedMidiDevice を維持する', () => {
    useGameStore.getState().updateSettings({ selectedMidiDevice: 'device-abc' });
    useGameStore.getState().updateSettings({ midiVolume: 0.4 });

    expect(useGameStore.getState().settings.selectedMidiDevice).toBe('device-abc');
    expect(useGameStore.getState().settings.midiVolume).toBe(0.4);
  });

  it('部分更新で inputMethod を維持する', () => {
    useGameStore.getState().updateSettings({ inputMethod: 'voice', selectedAudioDevice: 'mic-1' });
    useGameStore.getState().updateSettings({ soundEffectVolume: 0.5 });

    expect(useGameStore.getState().settings.inputMethod).toBe('voice');
    expect(useGameStore.getState().settings.selectedAudioDevice).toBe('mic-1');
    expect(useGameStore.getState().settings.soundEffectVolume).toBe(0.5);
  });
});
