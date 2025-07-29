import type { Meta, StoryObj } from '@storybook/react';
import { RhythmGameEngine } from './RhythmGameEngine';
import { testRhythmStages, testRhythmEventsRandom, testRhythmEventsProgression } from '@/data/testRhythmStages';
import { useState } from 'react';

const meta = {
  title: 'Fantasy/RhythmGameEngine',
  component: RhythmGameEngine,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RhythmGameEngine>;

export default meta;
type Story = StoryObj<typeof meta>;

// テスト用のラッパーコンポーネント
const RhythmGameEngineWrapper = ({ stage, rhythmEvents }: any) => {
  const [gameState, setGameState] = useState(null);
  const [inputNotes] = useState(new Set<number>());

  return (
    <div className="p-4 bg-gray-900 min-h-screen text-white">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2">Rhythm Game Engine Test</h2>
        <p className="text-gray-400">Stage: {stage.stage_number}</p>
        <p className="text-gray-400">Pattern: {stage.pattern_type}</p>
        <p className="text-gray-400">BPM: {stage.bpm}</p>
        <p className="text-gray-400">Time Signature: {stage.time_signature}/4</p>
      </div>
      
      {gameState && (
        <div className="mb-4 p-4 bg-gray-800 rounded">
          <h3 className="text-lg font-semibold mb-2">Game State:</h3>
          <pre className="text-sm">{JSON.stringify(gameState, null, 2)}</pre>
        </div>
      )}

      <button 
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
        onClick={() => window.dispatchEvent(new Event('rhythm-game-start'))}
      >
        Start Game
      </button>

      <RhythmGameEngine
        stage={stage}
        rhythmEvents={rhythmEvents}
        onGameStateChange={setGameState}
        onChordCorrect={(chord, timing, damage, defeated, enemyId) => {
          console.log('Chord correct:', { chord, timing, damage, defeated, enemyId });
        }}
        onChordIncorrect={(chord, lane) => {
          console.log('Chord incorrect:', { chord, lane });
        }}
        onGameComplete={(result, finalState) => {
          console.log('Game complete:', { result, finalState });
        }}
        onEnemyAttack={(enemyId) => {
          console.log('Enemy attack:', { enemyId });
        }}
        inputNotes={inputNotes}
        onStartBattle={() => {
          console.log('Battle started!');
        }}
        isGamePaused={false}
      />
    </div>
  );
};

export const RandomPattern: Story = {
  render: () => (
    <RhythmGameEngineWrapper 
      stage={testRhythmStages[0]} 
      rhythmEvents={testRhythmEventsRandom}
    />
  ),
};

export const ProgressionPattern4Beat: Story = {
  render: () => (
    <RhythmGameEngineWrapper 
      stage={testRhythmStages[1]} 
      rhythmEvents={testRhythmEventsProgression}
    />
  ),
};

export const ProgressionPattern3Beat: Story = {
  render: () => (
    <RhythmGameEngineWrapper 
      stage={testRhythmStages[2]} 
      rhythmEvents={testRhythmEventsProgression}
    />
  ),
};