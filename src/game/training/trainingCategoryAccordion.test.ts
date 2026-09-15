import { resolveCollapsedTrainingCategoryIds } from '@/game/training/trainingCategoryAccordion';

const categories = [
  { id: 'intro', trainingIds: ['t1', 't2'] },
  { id: 'interval', trainingIds: ['t3'] },
  { id: 'chord', trainingIds: ['t4', 't5'] },
] as const;

describe('resolveCollapsedTrainingCategoryIds', () => {
  it('collapses every category when no goal and no last played', () => {
    const collapsed = resolveCollapsedTrainingCategoryIds(categories, [], null);
    expect([...collapsed].sort()).toEqual(['chord', 'interval', 'intro']);
  });

  it('keeps only goal categories open by default', () => {
    const collapsed = resolveCollapsedTrainingCategoryIds(categories, ['t1', 't2'], null);
    expect([...collapsed].sort()).toEqual(['chord', 'interval']);
  });

  it('keeps every category that contains a goal training', () => {
    const collapsed = resolveCollapsedTrainingCategoryIds(categories, ['t2', 't4'], null);
    expect([...collapsed]).toEqual(['interval']);
  });

  it('opens only the last-played category when returning from training', () => {
    const collapsed = resolveCollapsedTrainingCategoryIds(categories, ['t1'], 't3');
    expect([...collapsed].sort()).toEqual(['chord', 'intro']);
  });

  it('falls back to the goal category when last-played training is unknown', () => {
    const collapsed = resolveCollapsedTrainingCategoryIds(categories, ['t5'], 'missing');
    expect([...collapsed].sort()).toEqual(['interval', 'intro']);
  });
});
