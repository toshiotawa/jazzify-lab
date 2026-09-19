import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { DefenseNextStageLaunchModal } from '@/components/defense/DefenseNextStageLaunchModal';

describe('DefenseNextStageLaunchModal', () => {
  it('offers performance, practice, and close', () => {
    const onStartPerformance = vi.fn();
    const onStartPractice = vi.fn();
    const onClose = vi.fn();

    render(
      <DefenseNextStageLaunchModal
        stageTitle="フレーズ II"
        isEnglishCopy={false}
        onStartPerformance={onStartPerformance}
        onStartPractice={onStartPractice}
        onClose={onClose}
      />,
    );

    expect(screen.getByText('フレーズ II')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '本番' }));
    fireEvent.click(screen.getByRole('button', { name: '練習' }));
    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));
    expect(onStartPerformance).toHaveBeenCalledTimes(1);
    expect(onStartPractice).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
