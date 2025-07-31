/**
 * FantasyGameMode リズムモード認識テスト
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { FantasyGameMode } from '../FantasyGameMode';
import type { FantasyStage } from '../FantasyGameEngine';

// モックコンポーネント
jest.mock('../FantasyGameScreen', () => ({
  FantasyGameScreen: () => <div data-testid="quiz-mode">クイズモード</div>
}));

jest.mock('../../rhythm/RhythmFantasyGame', () => ({
  RhythmFantasyGame: () => <div data-testid="rhythm-mode">リズムモード</div>
}));

// Zustandストアのモック
jest.mock('../../../stores/rhythmStore', () => ({
  useRhythmStore: () => ({
    score: 100,
    defeatedEnemies: 5
  })
}));

// その他の依存関係をモック
jest.mock('../../../utils/MidiController', () => ({
  MIDIController: jest.fn()
}));

jest.mock('../../rhythm/AudioManager', () => ({
  AudioManager: () => null
}));

jest.mock('../../rhythm/RhythmEngine', () => ({
  RhythmEngine: () => null
}));

jest.mock('../../rhythm/RhythmGameUI', () => ({
  RhythmGameUI: () => null
}));

describe('FantasyGameMode', () => {
  const mockProps = {
    autoStart: false,
    onGameComplete: jest.fn(),
    onBackToStageSelect: jest.fn(),
    noteNameLang: 'en' as const,
    simpleNoteName: false,
    lessonMode: false,
  };

  const baseStage: FantasyStage = {
    id: 'test-stage',
    stageNumber: '1-1',
    name: 'テストステージ',
    description: 'テスト用ステージ',
    maxHp: 5,
    enemyGaugeSeconds: 4,
    enemyCount: 10,
    enemyHp: 1,
    minDamage: 1,
    maxDamage: 1,
    mode: 'single',
    allowedChords: ['C', 'G', 'Am', 'F'],
    showSheetMusic: true,
    showGuide: true,
    monsterIcon: 'fa-dragon',
    simultaneousMonsterCount: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // console.logをモック
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('gameType が "rhythm" の場合、リズムモードとして認識される', () => {
    const rhythmStage: FantasyStage = {
      ...baseStage,
      gameType: 'rhythm',
      rhythmPattern: 'random',
      bpm: 120,
      timeSignature: 4,
      loopMeasures: 8,
      mp3Url: '/demo-1.mp3',
    };

    render(<FantasyGameMode stage={rhythmStage} {...mockProps} />);
    
    // リズムモードコンポーネントが表示されることを確認
    expect(screen.getByTestId('rhythm-mode')).toBeInTheDocument();
    expect(screen.queryByTestId('quiz-mode')).not.toBeInTheDocument();

    // コンソールログでリズムモード認識を確認
    expect(console.log).toHaveBeenCalledWith('FantasyGameMode - Stage data:', {
      stageGameType: 'rhythm',
      extendedGameType: 'rhythm',
      stageName: 'テストステージ'
    });
    expect(console.log).toHaveBeenCalledWith('リズムモードとして認識されました');
  });

  it('gameType が "quiz" の場合、クイズモードとして認識される', () => {
    const quizStage: FantasyStage = {
      ...baseStage,
      gameType: 'quiz',
    };

    render(<FantasyGameMode stage={quizStage} {...mockProps} />);
    
    // クイズモードコンポーネントが表示されることを確認
    expect(screen.getByTestId('quiz-mode')).toBeInTheDocument();
    expect(screen.queryByTestId('rhythm-mode')).not.toBeInTheDocument();

    // コンソールログでクイズモード認識を確認
    expect(console.log).toHaveBeenCalledWith('クイズモードとして認識されました');
  });

  it('gameType が未設定の場合、デフォルトでクイズモードとして認識される', () => {
    const defaultStage: FantasyStage = {
      ...baseStage,
      // gameType を意図的に設定しない
    };

    render(<FantasyGameMode stage={defaultStage} {...mockProps} />);
    
    // クイズモードコンポーネントが表示されることを確認
    expect(screen.getByTestId('quiz-mode')).toBeInTheDocument();
    expect(screen.queryByTestId('rhythm-mode')).not.toBeInTheDocument();

    // デフォルト値として'quiz'が設定されることを確認
    expect(console.log).toHaveBeenCalledWith('FantasyGameMode - Stage data:', {
      stageGameType: undefined,
      extendedGameType: 'quiz',
      stageName: 'テストステージ'
    });
  });

  it('プログレッションパターンのリズムモードが正しく認識される', () => {
    const progressionStage: FantasyStage = {
      ...baseStage,
      gameType: 'rhythm',
      rhythmPattern: 'progression',
      bpm: 100,
      timeSignature: 4,
      loopMeasures: 4,
      chordProgressionData: [
        { chord: 'C', measure: 1, beat: 1 },
        { chord: 'G', measure: 1, beat: 3 },
      ],
    };

    render(<FantasyGameMode stage={progressionStage} {...mockProps} />);
    
    // リズムモードコンポーネントが表示されることを確認
    expect(screen.getByTestId('rhythm-mode')).toBeInTheDocument();
    
    // プログレッションパターンとして認識されることを確認
    expect(console.log).toHaveBeenCalledWith('FantasyGameMode - Stage data:', {
      stageGameType: 'rhythm',
      extendedGameType: 'rhythm',
      stageName: 'テストステージ'
    });
  });

  it('拡張ステージデータが正しく変換される', () => {
    const rhythmStage: FantasyStage = {
      ...baseStage,
      gameType: 'rhythm',
      rhythmPattern: 'random',
      bpm: 140,
      timeSignature: 3,
      loopMeasures: 16,
      measureCount: 12,
      mp3Url: '/custom-music.mp3',
    };

    render(<FantasyGameMode stage={rhythmStage} {...mockProps} />);
    
    // リズムモードとして認識される
    expect(screen.getByTestId('rhythm-mode')).toBeInTheDocument();
    
    // 拡張データが正しく設定される
    expect(console.log).toHaveBeenCalledWith('FantasyGameMode - Stage data:', 
      expect.objectContaining({
        stageGameType: 'rhythm',
        extendedGameType: 'rhythm',
      })
    );
  });
});