import { useEffect, useRef, useState, useCallback } from 'react';
import { RhythmGameManager, RhythmGameCallbacks } from '@/rhythm/manager';
import { RhythmFantasyStage, RhythmQuestion } from '@/rhythm/generator';
import { MonsterGaugeUI } from './MonsterGaugeUI';
import FantasyPIXIRenderer, { FantasyPIXIInstance } from '../fantasy/FantasyPIXIRenderer';
import { PIXINotesRenderer, PIXINotesRendererInstance } from '../game/PIXINotesRenderer';
import { useFantasyGameEngine, MonsterState } from '../fantasy/FantasyGameEngine';
import { MIDIController } from '@/utils/MidiController';
import { cn } from '@/utils/cn';
import { devLog } from '@/utils/logger';
import { ActiveNote } from '@/types';

interface RhythmGameScreenProps {
  stage: RhythmFantasyStage;
  onGameComplete: (result: 'clear' | 'gameover', score: number, correctAnswers: number, totalQuestions: number) => void;
  onBackToStageSelect: () => void;
  noteNameLang?: 'en' | 'ja';
  simpleNoteName?: boolean;
  lessonMode?: boolean;
}

export default function RhythmGameScreen({
  stage,
  onGameComplete,
  onBackToStageSelect
}: RhythmGameScreenProps) {
  const managerRef = useRef<RhythmGameManager>();
  const pixiInstanceRef = useRef<FantasyPIXIInstance>();
  const notesRendererRef = useRef<PIXINotesRendererInstance>();
  const midiControllerRef = useRef<MIDIController | null>(null);
  
  const [gameStarted, setGameStarted] = useState(false);
  const [damageShake, setDamageShake] = useState(false);
  const [overlay, setOverlay] = useState<null | { text: string }>(null);
  const [activeMonsters, setActiveMonsters] = useState<(MonsterState & { rhythmQuestion?: RhythmQuestion })[]>([]);
  const [activeNotes] = useState<ActiveNote[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  
  // Ensure stage is valid for hook call
  const fantasyStage = stage ? {
    ...stage,
    stageNumber: stage.stage_number,
    maxHp: stage.max_hp,
    enemyGaugeSeconds: stage.enemy_gauge_seconds,
    enemyCount: stage.enemy_count,
    enemyHp: stage.enemy_hp,
    minDamage: stage.min_damage,
    maxDamage: stage.max_damage,
    allowedChords: stage.allowed_chords,
    chordProgression: stage.chord_progression,
    showSheetMusic: stage.show_sheet_music,
    showGuide: stage.show_guide,
    simultaneousMonsterCount: stage.simultaneous_monster_count || 1,
    monsterIcon: stage.monster_icon || 'dragon'
  } : null;
  
  // Initialize fantasy game engine
  const {
    gameState,
    initializeGame
  } = useFantasyGameEngine({
    stage: fantasyStage,
    onGameStateChange: (state) => {
      devLog.debug('Game state changed:', state);
    },
    onChordCorrect: (chord, isSpecial, damageDealt, defeated, monsterId) => {
      devLog.debug(`Chord correct: ${chord.id}, damage: ${damageDealt}, defeated: ${defeated}`);
      pixiInstanceRef.current?.triggerAttackSuccessOnMonster(monsterId, chord.id || '', isSpecial, damageDealt, defeated);
    },
    onChordIncorrect: (expectedChord, _inputNotes) => {
      devLog.debug(`Chord incorrect: expected ${expectedChord.id}`);
    },
    onGameComplete: (result, finalState) => {
      onGameComplete(result, finalState.score, finalState.correctAnswers, finalState.totalQuestions);
    },
    onEnemyAttack: (attackingMonsterId) => {
      devLog.debug(`Enemy attack from: ${attackingMonsterId}`);
      setDamageShake(true);
      setTimeout(() => setDamageShake(false), 500);
      // Use existing attack success method with 0 damage for animation
      pixiInstanceRef.current?.triggerAttackSuccessOnMonster(attackingMonsterId, 'enemy-attack', false, 0, false);
    }
  });
  
  // Create rhythm game callbacks
  const callbacks: RhythmGameCallbacks = {
    onAttackSuccess: (monsterId, chord, result) => {
      devLog.debug(`Rhythm hit: ${chord} (${result.timing})`);
      // The hit is already handled by the judge engine
      
      // Show timing feedback
      if (result.timing === 'perfect') {
        setOverlay({ text: 'PERFECT!' });
        setTimeout(() => setOverlay(null), 1000);
      }
    },
    onAttackFail: (monsterId, chord, _result) => {
      devLog.debug(`Rhythm miss: ${chord}`);
      // Trigger enemy attack animation
      pixiInstanceRef.current?.triggerAttackSuccessOnMonster(monsterId, 'miss', false, 0, false);
    },
    onQuestionSpawn: (question) => {
      devLog.debug(`Question spawned: ${question.chord} at measure ${question.measure}`);
      // Update monster with question
      setActiveMonsters(prev => {
        const monsters = [...prev];
        const index = (question.measure - 2) % monsters.length;
        if (monsters[index]) {
          monsters[index] = { ...monsters[index], rhythmQuestion: question };
        }
        return monsters;
      });
    },
    onAllEnemyDefeated: () => {
      devLog.debug('All enemies defeated!');
    }
  };
  
  // Initialize rhythm game manager
  useEffect(() => {
    if (gameStarted && stage.game_type === 'rhythm') {
      managerRef.current = new RhythmGameManager(stage, callbacks);
      managerRef.current.start().catch(console.error);
      
      return () => {
        managerRef.current?.dispose();
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted, stage]);
  
  // Initialize monsters
  useEffect(() => {
    if (gameState.activeMonsters) {
      setActiveMonsters(gameState.activeMonsters.map(m => ({ ...m })));
    }
  }, [gameState.activeMonsters]);
  
  // MIDI controller setup
  useEffect(() => {
    if (!midiControllerRef.current) {
      const controller = new MIDIController({
        onNoteOn: (note) => {
          managerRef.current?.handleNoteOn(note);
          handleRhythmNoteInput(note, 'midi');
        },
        onNoteOff: (note) => {
          managerRef.current?.handleNoteOff(note);
        }
      });
      midiControllerRef.current = controller;
    }
    
    return () => {
      midiControllerRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleRhythmNoteInput = useCallback((note: number, source?: 'mouse' | 'midi') => {
    if (source === 'mouse') {
      managerRef.current?.handleNoteOn(note);
      setTimeout(() => {
        managerRef.current?.handleNoteOff(note);
      }, 100);
    }
  }, []);
  
  const handleStartGame = () => {
    setGameStarted(true);
    if (fantasyStage) {
      initializeGame(fantasyStage);
    }
  };
  
  // Update current time for animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(prev => prev + 0.016); // 60 FPS
    }, 16);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-gray-900 to-black">
      {/* Game overlay effects */}
      {overlay && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="text-6xl font-bold text-yellow-400 animate-bounce">
            {overlay.text}
          </div>
        </div>
      )}
      
      {/* Start screen */}
      {!gameStarted && (
        <div className="absolute inset-0 flex items-center justify-center z-40 bg-black bg-opacity-75">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-4">リズムモード</h2>
            <p className="text-xl text-gray-300 mb-8">{stage.name}</p>
            <button
              onClick={handleStartGame}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xl font-bold transition-colors"
            >
              スタート
            </button>
          </div>
        </div>
      )}
      
      {/* Main game area */}
      <div className={cn(
        "flex-1 relative transition-all duration-100",
        damageShake && "animate-shake"
      )}>
        {/* Monster renderer */}
        <FantasyPIXIRenderer
          monsterIcon={stage.monster_icon || 'monster_01'}
          width={window.innerWidth}
          height={300}
          enemyGauge={0}
          onReady={(instance: FantasyPIXIInstance) => {
            pixiInstanceRef.current = instance;
          }}
        />
        
        {/* Rhythm gauge UI */}
        <MonsterGaugeUI monsters={activeMonsters} />
      </div>
      
      {/* Piano keyboard with note renderer */}
      <div className="relative h-48 bg-gray-800">
        <PIXINotesRenderer
          activeNotes={activeNotes}
          width={window.innerWidth}
          height={192}
          currentTime={currentTime}
          onReady={(renderer: PIXINotesRendererInstance | null) => {
            notesRendererRef.current = renderer || undefined;
          }}
        />
        
        {/* Keyboard overlay for input */}
        <div 
          role="button"
          tabIndex={0}
          className="absolute inset-0 cursor-pointer"
          onMouseDown={(e) => {
            // Calculate note from mouse position
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const noteWidth = rect.width / 88;
            const noteIndex = Math.floor(x / noteWidth);
            const note = 21 + noteIndex; // MIDI note 21 (A0) to 108 (C8)
            handleRhythmNoteInput(note, 'mouse');
          }}
          onKeyDown={(e) => {
            // Handle keyboard input
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              handleRhythmNoteInput(60, 'mouse'); // Middle C
            }
          }}
        />
      </div>
      
      {/* HUD */}
      <div className="absolute top-4 left-4 text-white">
        <div className="text-lg">HP: {gameState.playerHp} / {fantasyStage?.maxHp || 100}</div>
        <div className="text-lg">SP: {gameState.playerSp} / 5</div>
      </div>
      
      {/* Back button */}
      <button
        onClick={onBackToStageSelect}
        className="absolute top-4 right-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
      >
        戻る
      </button>
    </div>
  );
}