import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect } from 'react';
import { RhythmTimingMarker, RhythmGaugeContainer } from './RhythmTimingMarker';

const meta = {
  title: 'Fantasy/RhythmTimingMarker',
  component: RhythmTimingMarker,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[600px] p-8 bg-gray-900 rounded-lg">
        <RhythmGaugeContainer>
          <Story />
        </RhythmGaugeContainer>
      </div>
    ),
  ],
} satisfies Meta<typeof RhythmTimingMarker>;

export default meta;
type Story = StoryObj<typeof meta>;

// アニメーション付きのデモコンポーネント
const AnimatedDemo = () => {
  const [gaugePercent, setGaugePercent] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [lastJudgment, setLastJudgment] = useState<'perfect' | 'good' | 'early' | 'late' | 'miss' | undefined>();

  useEffect(() => {
    const interval = setInterval(() => {
      setGaugePercent((prev) => {
        const next = (prev + 2) % 100;
        
        // 80%付近でアクティブ化
        setIsActive(Math.abs(next - 80) < 10);
        
        // 80%を通過したときに判定を表示
        if (prev < 80 && next >= 80) {
          const judgments: ('perfect' | 'good' | 'early' | 'late')[] = ['perfect', 'good', 'early', 'late'];
          const randomJudgment = judgments[Math.floor(Math.random() * judgments.length)];
          setLastJudgment(randomJudgment);
          
          // 0.5秒後に判定をクリア
          setTimeout(() => setLastJudgment(undefined), 500);
        }
        
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* ゲージの進行バー */}
      <div
        className="absolute top-0 left-0 bottom-0 bg-blue-600 bg-opacity-50 transition-all duration-100"
        style={{ width: `${gaugePercent}%` }}
      />
      
      <RhythmTimingMarker
        gaugePercent={gaugePercent}
        isActive={isActive}
        lastJudgment={lastJudgment}
      />
      
      {/* 現在のゲージ値表示 */}
      <div className="absolute top-full mt-2 left-0 text-white text-sm">
        Gauge: {gaugePercent.toFixed(0)}%
      </div>
    </>
  );
};

export const Default: Story = {
  args: {
    gaugePercent: 50,
    isActive: false,
  },
};

export const Active: Story = {
  args: {
    gaugePercent: 78,
    isActive: true,
  },
};

export const WithPerfectJudgment: Story = {
  args: {
    gaugePercent: 80,
    isActive: true,
    lastJudgment: 'perfect',
  },
};

export const WithGoodJudgment: Story = {
  args: {
    gaugePercent: 80,
    isActive: true,
    lastJudgment: 'good',
  },
};

export const WithEarlyJudgment: Story = {
  args: {
    gaugePercent: 75,
    isActive: false,
    lastJudgment: 'early',
  },
};

export const WithLateJudgment: Story = {
  args: {
    gaugePercent: 85,
    isActive: false,
    lastJudgment: 'late',
  },
};

export const WithMissJudgment: Story = {
  args: {
    gaugePercent: 95,
    isActive: false,
    lastJudgment: 'miss',
  },
};

export const Animated: Story = {
  render: () => <AnimatedDemo />,
};