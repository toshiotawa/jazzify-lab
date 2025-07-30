import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RhythmGauge } from '../RhythmGauge';

describe('RhythmGauge', () => {
  it('renders without crashing', () => {
    render(
      <RhythmGauge
        progress={0.5}
        isJudgmentTiming={false}
        monsterPosition={{ x: 0, y: 0 }}
      />
    );
    
    // ゲージバーが表示されることを確認
    const gaugeBar = screen.getByTestId('rhythm-gauge-bar');
    expect(gaugeBar).toBeInTheDocument();
  });

  it('shows progress correctly', () => {
    const { rerender } = render(
      <RhythmGauge
        progress={0.3}
        isJudgmentTiming={false}
        monsterPosition={{ x: 0, y: 0 }}
      />
    );
    
    let progressBar = screen.getByTestId('rhythm-gauge-progress');
    expect(progressBar).toHaveStyle({ width: '30%' });
    
    // プログレスを更新
    rerender(
      <RhythmGauge
        progress={0.8}
        isJudgmentTiming={false}
        monsterPosition={{ x: 0, y: 0 }}
      />
    );
    
    progressBar = screen.getByTestId('rhythm-gauge-progress');
    expect(progressBar).toHaveStyle({ width: '80%' });
  });

  it('shows judgment marker at 80%', () => {
    render(
      <RhythmGauge
        progress={0.5}
        isJudgmentTiming={false}
        monsterPosition={{ x: 0, y: 0 }}
      />
    );
    
    const marker = screen.getByTestId('rhythm-gauge-marker');
    expect(marker).toBeInTheDocument();
    expect(marker).toHaveStyle({ left: '80%' });
  });

  it('applies pulse animation when in judgment timing', () => {
    const { rerender } = render(
      <RhythmGauge
        progress={0.8}
        isJudgmentTiming={false}
        monsterPosition={{ x: 0, y: 0 }}
      />
    );
    
    let marker = screen.getByTestId('rhythm-gauge-marker');
    expect(marker).not.toHaveClass('animate-pulse');
    
    // 判定タイミングに変更
    rerender(
      <RhythmGauge
        progress={0.8}
        isJudgmentTiming={true}
        monsterPosition={{ x: 0, y: 0 }}
      />
    );
    
    marker = screen.getByTestId('rhythm-gauge-marker');
    expect(marker).toHaveClass('animate-pulse');
  });
});