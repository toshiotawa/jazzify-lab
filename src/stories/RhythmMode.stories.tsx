import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RhythmGauge } from '../components/fantasy/RhythmGauge';
import { RhythmReady } from '../components/fantasy/RhythmReady';

// RhythmGaugeのストーリー
export default {
  title: 'Fantasy/RhythmMode/RhythmGauge',
  component: RhythmGauge,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
} as Meta<typeof RhythmGauge>;

type Story = StoryObj<typeof RhythmGauge>;

export const Default: Story = {
  args: {
    progress: 0.5,
    isJudgmentTiming: false,
    monsterPosition: { x: 200, y: 100 },
  },
};

export const AtJudgmentPoint: Story = {
  args: {
    progress: 0.8,
    isJudgmentTiming: false,
    monsterPosition: { x: 200, y: 100 },
  },
};

export const InJudgmentWindow: Story = {
  args: {
    progress: 0.8,
    isJudgmentTiming: true,
    monsterPosition: { x: 200, y: 100 },
  },
};

export const ProgressAnimation: Story = {
  args: {
    progress: 0,
    isJudgmentTiming: false,
    monsterPosition: { x: 200, y: 100 },
  },
  render: (args) => {
    const [progress, setProgress] = React.useState(0);
    
    React.useEffect(() => {
      const interval = setInterval(() => {
        setProgress((p) => (p >= 1 ? 0 : p + 0.01));
      }, 50);
      return () => clearInterval(interval);
    }, []);
    
    return <RhythmGauge {...args} progress={progress} />;
  },
};

// RhythmReadyのストーリー
export const ReadyCountdown: Meta<typeof RhythmReady> = {
  title: 'Fantasy/RhythmMode/RhythmReady',
  component: RhythmReady,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const Countdown3: StoryObj<typeof RhythmReady> = {
  args: {
    isReady: true,
    countdown: 3,
    showStartButton: false,
  },
};

export const Countdown2: StoryObj<typeof RhythmReady> = {
  args: {
    isReady: true,
    countdown: 2,
    showStartButton: false,
  },
};

export const Countdown1: StoryObj<typeof RhythmReady> = {
  args: {
    isReady: true,
    countdown: 1,
    showStartButton: false,
  },
};

export const Start: StoryObj<typeof RhythmReady> = {
  args: {
    isReady: true,
    countdown: 0,
    showStartButton: false,
  },
};

export const WithStartButton: StoryObj<typeof RhythmReady> = {
  args: {
    isReady: true,
    countdown: 3,
    showStartButton: true,
    onStart: () => console.log('Start clicked!'),
  },
};