import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { TrainingRunPrepPanel } from '@/components/training/TrainingRunPrepPanel';
import type { TrainingRow } from '@/game/training/trainingTypes';

const training: TrainingRow = {
  id: 'training-1',
  categoryId: 'cat-1',
  slug: 'dev-quest-only-note-reading-treble',
  titleJa: 'クエスト専用：音符の読み方(ト音記号)',
  titleEn: 'Quest-only: Note Reading (Treble)',
  sortOrder: 1,
  kind: 'note_reading',
  clefMode: 'instrument',
  useKeySignature: false,
  playRootOnCorrect: true,
  bgmUrl: 'https://example.com/loop.mp3',
  config: { clef: 'auto' },
  isActive: true,
};

describe('TrainingRunPrepPanel', () => {
  it('offers practice and performance starts', () => {
    const onStartPractice = vi.fn();
    const onStartPerformance = vi.fn();

    render(
      <TrainingRunPrepPanel
        training={training}
        isEnglish={false}
        onStartPractice={onStartPractice}
        onStartPerformance={onStartPerformance}
      />,
    );

    expect(screen.getByText('クエスト専用：音符の読み方(ト音記号)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '練習' }));
    fireEvent.click(screen.getByRole('button', { name: '本番' }));
    expect(onStartPractice).toHaveBeenCalledTimes(1);
    expect(onStartPerformance).toHaveBeenCalledTimes(1);
  });
});
