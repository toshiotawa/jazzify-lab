import { renderHook, act } from '@testing-library/react';
import { useRhythmGameEngine } from '../RhythmGameEngine';
import { useRhythmStore } from '@/stores/rhythmStore';
import { FantasyStage } from '@/types';

// Mock the rhythm store
jest.mock('@/stores/rhythmStore');

// Mock the logger
jest.mock('@/utils/logger', () => ({
  devLog: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('useRhythmGameEngine', () => {
  let mockRhythmStore: any;
  let mockStage: FantasyStage;
  let mockCallbacks: any;

  beforeEach(() => {
    // Setup mock rhythm store
    mockRhythmStore = {
      initialize: jest.fn(),
      setChordProgressionData: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      checkTiming: jest.fn(),
      getCurrentChordTiming: jest.fn(),
      getMeasureDuration: jest.fn(() => 2000), // 2 seconds per measure
      getCurrentMeasureAndBeat: jest.fn(() => ({ measure: 1, beat: 1 })),
      currentTime: 0,
      isPlaying: false,
    };
    
    (useRhythmStore as jest.Mock).mockReturnValue(mockRhythmStore);

    // Setup mock stage
    mockStage = {
      id: 'test-stage',
      stageNumber: '4-1',
      name: 'Rhythm Cave',
      description: 'Test stage',
      maxHp: 100,
      enemyGaugeSeconds: 10,
      enemyCount: 4,
      enemyHp: 20,
      minDamage: 5,
      maxDamage: 10,
      mode: 'single',
      allowedChords: ['C', 'G', 'Am', 'F'],
      showSheetMusic: false,
      showGuide: false,
      monsterIcon: 'slime',
      simultaneousMonsterCount: 2,
      gameType: 'rhythm',
      rhythmPattern: 'random',
      bpm: 120,
      timeSignature: 4,
      measureCount: 8,
      loopMeasures: 8,
      mp3Url: 'test.mp3',
    };

    // Setup mock callbacks
    mockCallbacks = {
      onGameStateChange: jest.fn(),
      onChordCorrect: jest.fn(),
      onChordIncorrect: jest.fn(),
      onGameComplete: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Game initialization', () => {
    it('should initialize the game with correct parameters', () => {
      const { result } = renderHook(() => 
        useRhythmGameEngine(mockStage, mockCallbacks)
      );

      act(() => {
        result.current.startGame();
      });

      // Check rhythm store initialization
      expect(mockRhythmStore.initialize).toHaveBeenCalledWith(
        120, // BPM
        4,   // Time signature
        8,   // Measure count
        8    // Loop measures
      );

      // Check rhythm started
      expect(mockRhythmStore.start).toHaveBeenCalled();

      // Check game state
      expect(result.current.gameState.isGameActive).toBe(true);
      expect(result.current.gameState.playerHp).toBe(100);
      expect(result.current.gameState.activeMonsters.length).toBe(2);
    });

    it('should not start game if stage is null', () => {
      const { result } = renderHook(() => 
        useRhythmGameEngine(null, mockCallbacks)
      );

      act(() => {
        result.current.startGame();
      });

      expect(mockRhythmStore.initialize).not.toHaveBeenCalled();
      expect(result.current.gameState.isGameActive).toBe(false);
    });
  });

  describe('Chord progression pattern', () => {
    it('should set chord progression data for progression pattern', () => {
      const progressionStage = {
        ...mockStage,
        rhythmPattern: 'progression' as const,
        chordProgressionData: [
          { chord: 'C', measure: 1, beat: 1 },
          { chord: 'G', measure: 1, beat: 3 },
        ],
      };

      const { result } = renderHook(() => 
        useRhythmGameEngine(progressionStage, mockCallbacks)
      );

      act(() => {
        result.current.startGame();
      });

      expect(mockRhythmStore.setChordProgressionData).toHaveBeenCalledWith(
        progressionStage.chordProgressionData
      );
    });
  });

  describe('Note input handling', () => {
    it('should handle correct note input with perfect timing', () => {
      mockRhythmStore.checkTiming.mockReturnValue({
        timing: 'perfect',
        timeDiff: 50,
        chord: 'C',
      });

      const { result } = renderHook(() => 
        useRhythmGameEngine(mockStage, mockCallbacks)
      );

      act(() => {
        result.current.startGame();
      });

      const initialHp = result.current.gameState.activeMonsters[0].currentHp;

      act(() => {
        result.current.handleNoteInput(['C']);
      });

      // Check damage dealt
      const expectedDamage = 5 + 2; // base damage + perfect bonus
      expect(result.current.gameState.activeMonsters[0].currentHp).toBe(
        initialHp - expectedDamage
      );

      // Check callback
      expect(mockCallbacks.onChordCorrect).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'C' }),
        'perfect',
        expectedDamage,
        false, // not defeated
        expect.any(String)
      );
    });

    it('should handle miss timing', () => {
      mockRhythmStore.checkTiming.mockReturnValue({
        timing: 'miss',
        timeDiff: 300,
        chord: 'C',
      });

      const { result } = renderHook(() => 
        useRhythmGameEngine(mockStage, mockCallbacks)
      );

      act(() => {
        result.current.startGame();
      });

      const initialPlayerHp = result.current.gameState.playerHp;

      act(() => {
        result.current.handleNoteInput(['C']);
      });

      // Check player took damage
      expect(result.current.gameState.playerHp).toBeLessThan(initialPlayerHp);

      // Check callback
      expect(mockCallbacks.onChordIncorrect).toHaveBeenCalled();
    });
  });

  describe('Game completion', () => {
    it('should complete game when all monsters are defeated', () => {
      const { result } = renderHook(() => 
        useRhythmGameEngine({ ...mockStage, enemyCount: 1, simultaneousMonsterCount: 1 }, mockCallbacks)
      );

      act(() => {
        result.current.startGame();
      });

      mockRhythmStore.checkTiming.mockReturnValue({
        timing: 'perfect',
        timeDiff: 50,
        chord: mockStage.allowedChords[0],
      });

      // Deal enough damage to defeat the monster
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.handleNoteInput([mockStage.allowedChords[0]]);
        }
      });

      // Check game completion
      expect(mockCallbacks.onGameComplete).toHaveBeenCalledWith(
        'clear',
        expect.objectContaining({
          isGameOver: true,
          gameResult: 'clear',
        })
      );
    });

    it('should end game when player HP reaches 0', () => {
      const { result } = renderHook(() => 
        useRhythmGameEngine({ ...mockStage, maxHp: 10 }, mockCallbacks)
      );

      act(() => {
        result.current.startGame();
      });

      mockRhythmStore.checkTiming.mockReturnValue({
        timing: 'miss',
        timeDiff: 300,
        chord: 'C',
      });

      // Miss multiple times to deplete player HP
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.handleNoteInput(['Wrong']);
        }
      });

      // Check game over
      expect(mockCallbacks.onGameComplete).toHaveBeenCalledWith(
        'gameover',
        expect.objectContaining({
          isGameOver: true,
          gameResult: 'gameover',
          playerHp: 0,
        })
      );
    });
  });

  describe('Stop game', () => {
    it('should stop the rhythm and reset game state', () => {
      const { result } = renderHook(() => 
        useRhythmGameEngine(mockStage, mockCallbacks)
      );

      act(() => {
        result.current.startGame();
      });

      act(() => {
        result.current.stopGame();
      });

      expect(mockRhythmStore.stop).toHaveBeenCalled();
      expect(result.current.gameState.isGameActive).toBe(false);
    });
  });
});