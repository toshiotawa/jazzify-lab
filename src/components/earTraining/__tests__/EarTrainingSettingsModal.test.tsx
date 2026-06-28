import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import EarTrainingSettingsModal from '../EarTrainingSettingsModal';

vi.mock('@/stores/gameStore', () => ({
  useGameStore: () => ({
    settings: {
      masterVolume: 1,
      musicVolume: 0.7,
      midiVolume: 1,
      soundEffectVolume: 1,
    },
    updateSettings: vi.fn(),
  }),
}));

vi.mock('@/components/ui/MidiDeviceManager', () => ({
  MidiDeviceSelector: () => <div data-testid="midi-selector" />,
}));

describe('EarTrainingSettingsModal tutorial scope', () => {
  it('hides practice run mode and playback sections in tutorial scope', () => {
    render(
      <EarTrainingSettingsModal
        isOpen
        isEnglishCopy={false}
        scope="tutorial"
        onClose={() => undefined}
        onRestartFromBeginning={() => undefined}
        midiDeviceId={null}
        onMidiDeviceChange={() => undefined}
        isMidiConnected={false}
        practiceRunMode={{
          practiceMode: false,
          onApplyPracticeModeAndRestart: () => undefined,
        }}
        practiceSpeed={{
          practiceMode: true,
          appliedSpeedPercent: 100,
          onApplyAndRestart: () => undefined,
        }}
      />,
    );

    expect(screen.queryByText('練習 / 本番')).not.toBeInTheDocument();
    expect(screen.queryByText('速度変更')).not.toBeInTheDocument();
    expect(screen.getByText('最初からやり直す')).toBeInTheDocument();
    expect(screen.getByTestId('midi-selector')).toBeInTheDocument();
  });
});
