import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { TrainingGoalPage } from '@/components/training/TrainingGoalPage';
import type { TrainingGoalSet, TrainingRow } from '@/game/training/trainingTypes';

const makeTraining = (id: string, kind: TrainingRow['kind'], titleJa: string): TrainingRow => ({
  id,
  categoryId: 'cat-1',
  slug: id,
  titleJa,
  titleEn: titleJa,
  sortOrder: 1,
  kind,
  clefMode: 'instrument',
  useKeySignature: false,
  playRootOnCorrect: true,
  bgmUrl: '',
  config: {},
  isActive: true,
});

const makeGoalSet = (slug: string, trainingId: string): TrainingGoalSet => ({
  id: `goal-${slug}`,
  slug: `goal-${slug}`,
  titleJa: `${slug}をマスターしよう`,
  titleEn: `Master ${slug}`,
  descriptionJa: '説明文',
  descriptionEn: 'Description',
  targetInstrument: 'all',
  targetLevel: 'beginner',
  sortOrder: 1,
  isActive: true,
  items: [{ trainingId, targetRank: 'C', sortOrder: 1 }],
});

const baseProps = {
  stageNumber: 1,
  summaryByTrainingId: new Map(),
  isEnglish: false,
  onBack: vi.fn(),
  onSelectTraining: vi.fn(),
  onOpenRecords: vi.fn(),
  onLocked: vi.fn(),
  isTrainingLocked: () => false,
};

describe('TrainingGoalPage', () => {
  it('shows target rank with chord question count', () => {
    const training = makeTraining('t-chord', 'chord', 'メジャー');
    render(
      <TrainingGoalPage
        {...baseProps}
        goalSet={makeGoalSet('triad', training.id)}
        trainingById={new Map([[training.id, training]])}
      />,
    );

    expect(screen.getByText('目標ランク:')).toBeInTheDocument();
    expect(screen.getByText('C(30問)')).toBeInTheDocument();
  });

  it('shows target rank with scale question count', () => {
    const training = makeTraining('t-scale', 'scale', 'メジャースケール');
    render(
      <TrainingGoalPage
        {...baseProps}
        goalSet={makeGoalSet('scale_basic', training.id)}
        trainingById={new Map([[training.id, training]])}
      />,
    );

    expect(screen.getByText('C(15問)')).toBeInTheDocument();
  });
});
