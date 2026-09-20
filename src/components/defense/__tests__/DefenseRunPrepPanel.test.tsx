import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { DefenseRunPrepPanel } from '@/components/defense/DefenseRunPrepPanel';
import type { DefenseStage } from '@/game/defense/defenseTypes';

const stage: DefenseStage = {
  id: 'stage-1',
  slug: 'stage-1',
  stageNumber: 1,
  title: 'テストステージ',
  titleEn: 'Test Stage',
  bpm: 120,
  beatsPerBar: 4,
  audioRegistrationMode: 'single_source',
  audioUrl: null,
  progressionBars: null,
  phraseBars: 4,
  staffLayout: 'treble',
  attackTrigger: 'note',
  keyFifths: 0,
  requiredCompletionCount: 2,
  difficultyLevel: 3,
  surviveSeconds: 60,
  playerHp: 5,
  productionStaffHintMode: 'fade_15s',
  productionKeyboardHintMode: 'fade_15s',
  phrases: [],
  progressionChords: [],
};

describe('DefenseRunPrepPanel', () => {
  it('offers practice and performance starts without description text', () => {
    const onStartPractice = vi.fn();
    const onStartPerformance = vi.fn();

    render(
      <DefenseRunPrepPanel
        stage={stage}
        isEnglishCopy={false}
        onStartPractice={onStartPractice}
        onStartPerformance={onStartPerformance}
      />,
    );

    expect(screen.getByText('テストステージ')).toBeInTheDocument();
    expect(screen.queryByText(/譜面の音を順番に演奏すると/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '練習' }));
    fireEvent.click(screen.getByRole('button', { name: '本番' }));
    expect(onStartPractice).toHaveBeenCalledTimes(1);
    expect(onStartPerformance).toHaveBeenCalledTimes(1);
  });
});
