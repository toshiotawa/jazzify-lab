import { fireEvent, render, screen } from '@testing-library/react';
import { VoicePitchEngineControl } from '../VoicePitchEngineControl';
import { useGameStore } from '@/stores/gameStore';

describe('VoicePitchEngineControl', () => {
  afterEach(() => useGameStore.getState().updateSettings({ voicePitchEngine: 'pesto' }));

  it('defaults to PESTO, persists Pitchy, and restores the choice when reopened', () => {
    useGameStore.getState().updateSettings({ voicePitchEngine: undefined });
    const first = render(<VoicePitchEngineControl isEnglishCopy={false} />);
    expect(screen.getByRole('combobox', { name: '音程の認識方式' })).toHaveValue('pesto');
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'pitchy' } });
    expect(useGameStore.getState().settings.voicePitchEngine).toBe('pitchy');
    expect(JSON.parse(localStorage.getItem('gameSettings') ?? '{}').voicePitchEngine).toBe('pitchy');
    expect(screen.getByText(/解析窓は約85ms/)).toBeInTheDocument();
    first.unmount();
    render(<VoicePitchEngineControl isEnglishCopy />);
    expect(screen.getByRole('combobox', { name: 'Pitch detection' })).toHaveValue('pitchy');
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'pesto' } });
    expect(screen.queryByText(/85ms/)).not.toBeInTheDocument();
  });
});
