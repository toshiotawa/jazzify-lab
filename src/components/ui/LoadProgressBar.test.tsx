import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import LoadProgressBar from '@/components/ui/LoadProgressBar';
import { clampLoadProgress } from '@/utils/clampLoadProgress';

describe('clampLoadProgress', () => {
  it('0–1 にクランプする', () => {
    expect(clampLoadProgress(-0.2)).toBe(0);
    expect(clampLoadProgress(0.5)).toBe(0.5);
    expect(clampLoadProgress(1.4)).toBe(1);
  });
});

describe('LoadProgressBar', () => {
  it('確定モードでは aria-valuenow を設定する', () => {
    render(<LoadProgressBar value={0.45} showPercent />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('45');
    expect(screen.getByText('45%')).toBeTruthy();
  });

  it('不定モードでは aria-valuenow を設定しない', () => {
    render(<LoadProgressBar />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBeNull();
    expect(bar.getAttribute('aria-busy')).toBe('true');
  });
});
