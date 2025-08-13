/**
 * ファンタジーゲームメイン画面
 * UI/UX要件に従ったゲーム画面の実装
 */

import React, { useState, useEffect, useCallback, useRef, useMemo, MutableRefObject } from 'react';
import { cn } from '@/utils/cn';
import { devLog } from '@/utils/logger';
import { MIDIController } from '@/utils/MidiController';
import { useGameStore } from '@/stores/gameStore';
import { bgmManager } from '@/utils/BGMManager';
import { useFantasyGameEngine, ChordDefinition, FantasyStage, FantasyGameState, MonsterState } from './FantasyGameEngine';
import { TaikoNote } from './TaikoNoteSystem';
import { PIXINotesRenderer, PIXINotesRendererInstance } from '../game/PIXINotesRenderer';
import { FantasyPIXIRenderer, FantasyPIXIInstance } from './FantasyPIXIRenderer';
import FantasySettingsModal from './FantasySettingsModal';
import type { DisplayOpts } from '@/utils/display-note';
import { toDisplayName } from '@/utils/display-note';
import { note as parseNote } from 'tonal';

interface FantasyGameScreenProps {
  stage: FantasyStage;
  autoStart?: boolean;        // ★ 追加
  onGameComplete: (result: 'clear' | 'gameover', score: number, correctAnswers: number, totalQuestions: number) => void;
  onBackToStageSelect: () => void;
  noteNameLang?: DisplayOpts['lang'];     // 音名表示言語
  simpleNoteName?: boolean;                // 簡易表記
  lessonMode?: boolean;                    // レッスンモード
}

// 不要な定数とインターフェースを削除（PIXI側で処理）

const FantasyGameScreen: React.FC<FantasyGameScreenProps> = ({
  stage,
  autoStart = false, // ★ 追加
  onGameComplete,
  onBackToStageSelect,
  noteNameLang = 'en',
  simpleNoteName = false,
  lessonMode = false
}) => {
  // useGameStoreの使用を削除（ファンタジーモードでは不要）
  
  // エフェクト状態
  const [damageShake, setDamageShake] = useState(false);
  const [overlay, setOverlay] = useState<null | { text:string }>(null); // ★★★ add
  const [heartFlash, setHeartFlash] = useState(false); // ハートフラッシュ効果
  
  // 設定モーダル状態
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // 設定状態を管理（初期値はstageから取得）
  // showGuideはstage.showGuideを直接使用（状態管理しない）
  const [currentNoteNameLang, setCurrentNoteNameLang] = useState<DisplayOpts['lang']>(noteNameLang);
  const [currentSimpleNoteName, setCurrentSimpleNoteName] = useState(simpleNoteName);
  
  // 魔法名表示状態
  const [magicName, setMagicName] = useState<{ monsterId: string; name: string; isSpecial: boolean } | null>(null);
  
  // 時間管理 - BGMManagerから取得
  const [currentBeat, setCurrentBeat] = useState(1);
  const [currentMeasure, setCurrentMeasure] = useState(1);
  const [isReady, setIsReady] = useState(true);
  const readyStartTimeRef = useRef<number>(performance.now());
  
  // コンポーネントマウント時にReady開始時刻を記録
  useEffect(() => {
    readyStartTimeRef.current = performance.now();
  }, []);
  
  // BGMManagerからタイミング情報を定期的に取得
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBeat(bgmManager.getCurrentBeat());
      setCurrentMeasure(bgmManager.getCurrentMeasure());
      // Ready状態は2秒後に自動的に解除
      if (isReady && performance.now() - readyStartTimeRef.current > 2000) {
        setIsReady(false);
      }
    }, 50); // 50ms間隔で更新
    
    return () => clearInterval(interval);
  }, [isReady]);
  
  // ★★★ 修正箇所 ★★★
  // ローカルのuseStateからgameStoreに切り替え
  const { settings, updateSettings } = useGameStore();
  const midiControllerRef = useRef<MIDIController | null>(null);
  const [isMidiConnected, setIsMidiConnected] = useState(false);
  
  // ★★★ 追加: モンスターエリアの幅管理 ★★★
  const [monsterAreaWidth, setMonsterAreaWidth] = useState<number>(window.innerWidth);
  const monsterAreaRef = useRef<HTMLDivElement>(null);
  // スマホ横画面でのモンスターエリア高さを動的に調整
  const [monsterAreaHeight, setMonsterAreaHeight] = useState<number>(200);
  
  /* Ready → Start 判定 */
  // isReadyはローカルstateで管理済み
  
  // ★★★ 追加: モンスターエリアのサイズ監視 ★★★
  useEffect(() => {
    const update = () => {
      if (monsterAreaRef.current) {
        setMonsterAreaWidth(monsterAreaRef.current.clientWidth);
        // 端末の向き・サイズに応じて高さを決定
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const isLandscape = vw > vh;
        const isMobile = vw < 900; // タブレット未満をモバイル扱い
        if (isMobile && isLandscape) {
          // 横画面ではUIを圧縮し、描画コンテナを拡大
          // 画面高の約48%を上限に、最大280pxまで拡大
          const h = Math.min(280, Math.max(200, Math.floor(vh * 0.48)));
          setMonsterAreaHeight(h);
        } else {
          // 縦 or デスクトップは従来相当
          const h = Math.min(220, Math.max(180, Math.floor(vh * 0.30)));
          setMonsterAreaHeight(h);
        }
      }
    };
    update(); // 初期化時
    const ro = new ResizeObserver(update); // 動的リサイズ
    if (monsterAreaRef.current) {
      ro.observe(monsterAreaRef.current);
    }
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);
  
  // Ready 終了時に BGM 再生
  useEffect(() => {
    if (!isReady) {
      bgmManager.play(
        stage.bgmUrl ?? '/demo-1.mp3',
        stage.bpm || 120,
        stage.timeSignature || 4,
        stage.measureCount ?? 8,
        stage.countInMeasures ?? 0,
        settings.bgmVolume ?? 0.7
      );
    }
    return () => bgmManager.stop();
  }, [isReady, stage, settings.bgmVolume]);
  
  // ★★★ 追加: 各モンスターのゲージDOM要素を保持するマップ ★★★
  const gaugeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  // ノート入力のハンドリング用ref
  const handleNoteInputRef = useRef<(note: number, source?: 'mouse' | 'midi') => void>();
  
  // 再生中のノートを追跡
  const activeNotesRef = useRef<Set<number>>(new Set());
  
  // MIDIControllerの初期化と管理
  useEffect(() => {
    // MIDIControllerのインスタンスを作成（一度だけ）
    if (!midiControllerRef.current) {
      const controller = new MIDIController({
        onNoteOn: (note: number, velocity?: number) => {
          devLog.debug('🎹 MIDI Note On:', { note, velocity });
          if (handleNoteInputRef.current) {
            handleNoteInputRef.current(note, 'midi'); // MIDI経由として指定
          }
        },
        onNoteOff: (note: number) => {
          devLog.debug('🎹 MIDI Note Off:', { note });
        },
        playMidiSound: true // 通常プレイと同様に共通音声システムを有効化
      });
      
      controller.setConnectionChangeCallback((connected: boolean) => {
        setIsMidiConnected(connected);
        devLog.debug('🎹 MIDI接続状態変更:', { connected });
      });
      
      midiControllerRef.current = controller;
      
      // 初期化
      controller.initialize().then(() => {
        devLog.debug('✅ ファンタジーモードMIDIController初期化完了');
        
        // ★★★ デフォルト音量設定を追加 ★★★
        // ファンタジーモード開始時にデフォルト音量（80%）を設定
        import('@/utils/MidiController').then(({ updateGlobalVolume, initializeAudioSystem }) => {
          // 音声システムを初期化
          initializeAudioSystem().then(() => {
            updateGlobalVolume(0.8); // デフォルト80%音量
            devLog.debug('🎵 ファンタジーモード初期音量設定: 80%');
            
            // FantasySoundManagerの初期化
            import('@/utils/FantasySoundManager')
              .then(async (mod) => {
                const FSM = (mod as any).FantasySoundManager ?? mod.default;
                await FSM?.init(
                  settings.soundEffectVolume ?? 0.8,
                  settings.rootSoundVolume ?? 0.5,
                  stage?.playRootOnCorrect !== false
                );
                FSM?.enableRootSound(stage?.playRootOnCorrect !== false);
                devLog.debug('🔊 ファンタジーモード効果音初期化完了');
              })
              .catch(err => console.error('Failed to import/init FantasySoundManager:', err));
          }).catch(error => {
            console.error('Audio system initialization failed:', error);
          });
        }).catch(error => {
          console.error('MidiController import failed:', error);
        });
        
        // gameStoreのデバイスIDを使用するため、ローカルストレージからの読み込みは不要
        // 接続処理は下のuseEffectに任せる。
      }).catch(error => {
        devLog.debug('❌ MIDI初期化エラー:', error);
      });
    }
    
    // クリーンアップ
    return () => {
      if (midiControllerRef.current) {
        midiControllerRef.current.destroy();
        midiControllerRef.current = null;
      }
    };
  }, []); // 空の依存配列で一度だけ実行
  
  // ★★★ 修正箇所 ★★★
  // gameStoreのデバイスIDを監視して接続/切断
  useEffect(() => {
    const connect = async () => {
      const deviceId = settings.selectedMidiDevice;
      if (midiControllerRef.current && deviceId) {
        const success = await midiControllerRef.current.connectDevice(deviceId);
        if (success) {
          devLog.debug('✅ MIDIデバイス接続成功:', deviceId);
        }
      } else if (midiControllerRef.current && !deviceId) {
        midiControllerRef.current.disconnect();
      }
    };
    connect();
  }, [settings.selectedMidiDevice]);

  // ステージ変更時にMIDI接続を確認・復元
  useEffect(() => {
    const restoreMidiConnection = async () => {
      if (midiControllerRef.current && midiControllerRef.current.getCurrentDeviceId()) {
        const isRestored = await midiControllerRef.current.checkAndRestoreConnection();
        if (isRestored) {
          devLog.debug('✅ ステージ変更後のMIDI接続を復元しました');
        }
      }
    };

    // コンポーネントが表示されたときに接続復元を試みる
    const timer = setTimeout(restoreMidiConnection, 100);
    return () => clearTimeout(timer);
  }, [stage]); // stageが変更されたときに実行
  
  // ステージ設定に応じてルート音を有効/無効にする
  useEffect(() => {
    let cancelled = false;
    const apply = async () => {
      try {
        const mod = await import('@/utils/FantasySoundManager');
        const FSM = (mod as any).FantasySoundManager ?? mod.default;
        // 明示的に false のときのみ無効化。未指定(undefined)は有効のまま
        FSM?.enableRootSound(stage?.playRootOnCorrect !== false);
      } catch {}
      if (cancelled) return;
    };
    apply();
    return () => { cancelled = true; };
  }, [stage?.playRootOnCorrect]);
  
  // PIXI.js レンダラー
  const [pixiRenderer, setPixiRenderer] = useState<PIXINotesRendererInstance | null>(null);
  const pianoScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = pianoScrollRef.current;
    if (!container) return;

    const centerC4 = () => {
      const contentWidth = container.scrollWidth;
      const viewportWidth = container.clientWidth;
      if (!contentWidth || !viewportWidth) return;
      if (contentWidth <= viewportWidth) return;
      const TOTAL_WHITE_KEYS = 52;
      const C4_WHITE_INDEX = 23; // A0=0 ... C4=23
      const whiteKeyWidth = contentWidth / TOTAL_WHITE_KEYS;
      const c4CenterX = (C4_WHITE_INDEX + 0.5) * whiteKeyWidth;
      const desiredScroll = Math.max(0, Math.min(contentWidth - viewportWidth, c4CenterX - viewportWidth / 2));
      container.scrollLeft = desiredScroll;
    };

    const raf = requestAnimationFrame(centerC4);
    const handleResize = () => requestAnimationFrame(centerC4);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
    };
  }, [pianoScrollRef]);
  const [fantasyPixiInstance, setFantasyPixiInstance] = useState<FantasyPIXIInstance | null>(null);
  const isTaikoModeRef = useRef(false);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [gameAreaSize, setGameAreaSize] = useState({ width: 1000, height: 120 }); // ファンタジーモード用に高さを大幅に縮小
  
  // ゲームエンジン コールバック
  const handleGameStateChange = useCallback((state: FantasyGameState) => {
    devLog.debug('🎮 ファンタジーゲーム状態更新:', {
      currentQuestion: state.currentQuestionIndex + 1,
      totalQuestions: state.totalQuestions,
      playerHp: state.playerHp,
      enemyGauge: state.enemyGauge.toFixed(1),
      isGameActive: state.isGameActive,
      currentChord: state.currentChordTarget?.displayName,
      score: state.score,
      correctAnswers: state.correctAnswers
    });
  }, []);
  
  // ▼▼▼ 変更点 ▼▼▼
  // monsterId を受け取り、新しいPIXIメソッドを呼び出す
  const handleChordCorrect = useCallback(async (chord: ChordDefinition, isSpecial: boolean, damageDealt: number, defeated: boolean, monsterId: string) => {
    devLog.debug('✅ 正解:', { name: chord.displayName, special: isSpecial, damage: damageDealt, defeated: defeated, monsterId });
    
    if (fantasyPixiInstance) {
      fantasyPixiInstance.triggerAttackSuccessOnMonster(monsterId, chord.displayName, isSpecial, damageDealt, defeated);
      // 太鼓progressionモード時は判定ライン上に小さなヒットエフェクトを表示
      if (isTaikoModeRef.current) {
        const pos = fantasyPixiInstance.getJudgeLinePosition();
        fantasyPixiInstance.createNoteHitEffect(pos.x, pos.y, true);
      }
    }

    // ルート音を再生（非同期対応）
    const allowRootSound = stage?.playRootOnCorrect === true;
    if (allowRootSound) {
      try {
        const mod = await import('@/utils/FantasySoundManager');
        const FSM = (mod as any).FantasySoundManager ?? mod.default;
        // スラッシュコード対応: 分母があればそれをルートとして鳴らす
        const id = chord.id || chord.displayName || chord.root;
        let bassToPlay = chord.root;
        if (typeof id === 'string' && id.includes('/')) {
          const parts = id.split('/');
          if (parts[1]) bassToPlay = parts[1];
        }
        await FSM?.playRootNote(bassToPlay);
      } catch (error) {
        console.error('Failed to play root note:', error);
      }
    }
  }, [fantasyPixiInstance, stage?.playRootOnCorrect]);
  // ▲▲▲ ここまで ▲▲▲
  
  const handleChordIncorrect = useCallback((expectedChord: ChordDefinition, inputNotes: number[]) => {
    devLog.debug('🎵 まだ構成音が足りません:', { expected: expectedChord.displayName, input: inputNotes });
    
    // 不正解エフェクトは削除（音の積み重ね方式のため）
    // setShowIncorrectEffect(true);
    // setTimeout(() => setShowIncorrectEffect(false), 500);
    
  }, []);
  
  const handleEnemyAttack = useCallback(async (attackingMonsterId?: string) => {
    console.log('🔥 handleEnemyAttack called with monsterId:', attackingMonsterId);
    devLog.debug('💥 敵の攻撃!', { attackingMonsterId });
    
    // 敵の攻撃音を再生（single クイズモードのみ）
          try {
        if (stage.mode === 'single') {
          const mod = await import('@/utils/FantasySoundManager');
          const FSM = (mod as any).FantasySoundManager ?? mod.default;
          FSM?.playEnemyAttack();
        }
      } catch (error) {
      console.error('Failed to play enemy attack sound:', error);
    }
    
    // confetti削除 - 何もしない
    
    // ダメージ時の画面振動
    setDamageShake(true);
    setTimeout(() => setDamageShake(false), 500);
    
    // ハートフラッシュ効果
    setHeartFlash(true);
    setTimeout(() => setHeartFlash(false), 150);
    
  }, [stage.mode]);
  
  const handleGameCompleteCallback = useCallback((result: 'clear' | 'gameover', finalState: FantasyGameState) => {
    const text = result === 'clear' ? 'Stage Clear' : 'Game Over';
    setOverlay({ text });                 // ★★★ add
    setTimeout(() => {
      setOverlay(null);                   // オーバーレイを消す
      onGameComplete(
        result,
        finalState.score,
        finalState.correctAnswers,
        finalState.totalQuestions
      );
    }, 2000);                             // 2 秒待ってから結果画面へ
  }, [onGameComplete]);
  
  // ★【最重要修正】 ゲームエンジンには、UIの状態を含まない初期stageを一度だけ渡す
  // これでガイドをON/OFFしてもゲームはリセットされなくなる
  const {
    gameState,
    handleNoteInput: engineHandleNoteInput,
    initializeGame,
    stopGame,
    getCurrentEnemy,
    proceedToNextEnemy,
    imageTexturesRef, // 追加: プリロードされたテクスチャへの参照
    ENEMY_LIST
  } = useFantasyGameEngine({
    stage: null, // ★★★ change
    onGameStateChange: handleGameStateChange,
    onChordCorrect: handleChordCorrect,
    onChordIncorrect: handleChordIncorrect,
    onGameComplete: handleGameCompleteCallback,
    onEnemyAttack: handleEnemyAttack,
    displayOpts: { lang: 'en', simple: false }, // コードネーム表示は常に英語、簡易表記OFF
    isReady
  });
  
  // 現在の敵情報を取得
  const currentEnemy = getCurrentEnemy(gameState.currentEnemyIndex);
  
  // MIDI/音声入力のハンドリング
  const handleNoteInputBridge = useCallback(async (note: number, source: 'mouse' | 'midi' = 'mouse') => {
    // iOS/Safari 対策: 最初のユーザー操作でオーディオを解放
    try { await (window as any).Tone?.start?.(); } catch {}

    // マウスクリック時のみ重複チェック（MIDI経由ではスキップしない）
    if (source === 'mouse' && activeNotesRef.current.has(note)) {
      devLog.debug('🎵 Note already playing, skipping:', note);
      return;
    }
    
    // クリック時にも音声を再生（MidiControllerの共通音声システムを使用）
    try {
      const { playNote } = await import('@/utils/MidiController');
      await playNote(note, 80); // velocity 80で再生
      activeNotesRef.current.add(note);
      devLog.debug('🎵 Played note via click:', note);
    } catch (error) {
      console.error('Failed to play note:', error);
    }
    
    // ファンタジーゲームエンジンにのみ送信
    engineHandleNoteInput(note);
  }, [engineHandleNoteInput]);
  
  // handleNoteInputBridgeが定義された後にRefを更新
  useEffect(() => {
    handleNoteInputRef.current = handleNoteInputBridge;
  }, [handleNoteInputBridge]);
  
  // PIXI.jsレンダラーの準備完了ハンドラー
  const handlePixiReady = useCallback((renderer: PIXINotesRendererInstance | null) => {
    devLog.debug('🎮 handlePixiReady called', { hasRenderer: !!renderer });
    setPixiRenderer(renderer);
    
    if (renderer) {
      // ファンタジーモード用の設定を適用
      const screenWidth = window.innerWidth;
      
      // Piano.tsと同じ白鍵幅計算方法を使用
      const minNote = 21; // A0
      const maxNote = 108; // C8
      let totalWhiteKeys = 0;
      
      // 黒鍵判定関数
      const isBlackKey = (midiNote: number): boolean => {
        const noteInOctave = midiNote % 12;
        return [1, 3, 6, 8, 10].includes(noteInOctave);
      };
      
      // 白鍵の総数を計算
      for (let note = minNote; note <= maxNote; note++) {
        if (!isBlackKey(note)) {
          totalWhiteKeys++;
        }
      }
      
      // 画面幅に基づいて白鍵幅を計算
      const whiteKeyWidth = screenWidth / totalWhiteKeys;
      const dynamicNoteWidth = Math.max(whiteKeyWidth - 2, 16); // 最小16px
      
      renderer.updateSettings({
        noteNameStyle: 'abc',
        simpleDisplayMode: true, // シンプル表示モードを有効
        pianoHeight: 120, // ファンタジーモード用に大幅に縮小
        noteHeight: 16, // 音符の高さも縮小
        noteWidth: dynamicNoteWidth,
        transpose: 0,
        transposingInstrument: 'concert_pitch',
        practiceGuide: stage.showGuide ? 'key' : 'off', // ガイド表示設定に基づく
        showHitLine: false, // ヒットラインを非表示
        viewportHeight: 120, // pianoHeightと同じ値に設定してノーツ下降部分を完全に非表示
        timingAdjustment: 0,
        effects: {
          glow: true,
          particles: false,
          trails: false
        }
      });
      
      // キーボードのクリックイベントを接続
      devLog.debug('🎹 Setting key callbacks for Fantasy mode...');
      renderer.setKeyCallbacks(
        (note: number) => {
          devLog.debug('🎹 Fantasy mode key press:', note);
          handleNoteInputBridge(note, 'mouse'); // マウスクリックとして扱う
        },
        async (note: number) => {
          devLog.debug('🎹 Fantasy mode key release:', note);
          // マウスリリース時に音を止める
          try {
            const { stopNote } = await import('@/utils/MidiController');
            stopNote(note);
            activeNotesRef.current.delete(note);
            devLog.debug('🎵 Stopped note via release:', note);
          } catch (error) {
            console.error('Failed to stop note:', error);
          }
        }
      );
      devLog.debug('✅ Key callbacks set successfully');
      
              // MIDIControllerにキーハイライト機能を設定（通常プレイと同様の処理）
        if (midiControllerRef.current) {
          midiControllerRef.current.setKeyHighlightCallback((note: number, active: boolean) => {
            renderer.highlightKey(note, active);
            // アクティブ(ノートオン)時に即時エフェクトを発火
            if (active) {
              renderer.triggerKeyPressEffect(note);
            }
          });
          
          devLog.debug('✅ ファンタジーモードMIDIController ↔ PIXIレンダラー連携完了');
        }
      
      devLog.debug('🎮 PIXI.js ファンタジーモード準備完了:', {
        screenWidth,
        totalWhiteKeys,
        whiteKeyWidth: whiteKeyWidth.toFixed(2),
        noteWidth: dynamicNoteWidth.toFixed(2),
        showGuide: stage.showGuide
      });
    }
  }, [handleNoteInputBridge, stage.showGuide]);

  // ファンタジーPIXIレンダラーの準備完了ハンドラー
  const handleFantasyPixiReady = useCallback((instance: FantasyPIXIInstance) => {
    devLog.debug('🎨 FantasyPIXIインスタンス準備完了');
    setFantasyPixiInstance(instance);
    // 初期状態の太鼓モードを設定
    instance.updateTaikoMode(gameState.isTaikoMode);
    isTaikoModeRef.current = gameState.isTaikoMode;
  }, [gameState.isTaikoMode]);
  
  // 魔法名表示ハンドラー
  const handleShowMagicName = useCallback((name: string, isSpecial: boolean, monsterId: string) => {
    setMagicName({ monsterId, name, isSpecial });
    // 500ms後に自動的に非表示
    setTimeout(() => {
      setMagicName(null);
    }, 500);
  }, []);
  
  // モンスター撃破時のコールバック（状態機械対応）
  const handleMonsterDefeated = useCallback(() => {
    devLog.debug('SCREEN: PIXIからモンスター消滅完了通知を受信しました。');
    // アニメーションが終わったので、エンジンに次の敵へ進むよう命令する
    proceedToNextEnemy();
  }, [proceedToNextEnemy]);
  
  // FontAwesome使用のため削除済み
  
  // ゲームエリアのリサイズ対応
  useEffect(() => {
    if (!gameAreaRef.current) return;

    const updateSize = () => {
      if (!gameAreaRef.current) return;
      const rect = gameAreaRef.current.getBoundingClientRect();
      const newSize = {
        width: Math.max(rect.width || window.innerWidth, window.innerWidth), // 画面幅を基準に設定
        height: 120 // ★★★ 高さを120pxに固定 ★★★
      };
      setGameAreaSize(newSize);
      
      devLog.debug('🎮 ゲームエリアサイズ更新:', newSize);
    };

    // 初回サイズ取得
    updateSize();

    // ResizeObserver でコンテナサイズ変化を監視
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(updateSize);
    });
    
    observer.observe(gameAreaRef.current);

    return () => observer.disconnect();
  }, []);

  // 敵が変更された時にモンスタースプライトを更新（状態機械対応）
  useEffect(() => {
    if (fantasyPixiInstance && currentEnemy) {
      // 状態機械のガード処理により、適切なタイミングでのみモンスターが生成される
      // 遅延処理は不要になった（状態機械が適切なタイミングを制御）
      fantasyPixiInstance.createMonsterSprite(currentEnemy.icon);
      devLog.debug('🔄 モンスタースプライト更新要求:', { 
        monster: currentEnemy.icon,
        enemyIndex: gameState.currentEnemyIndex
      });
    }
  }, [fantasyPixiInstance, currentEnemy, gameState.currentEnemyIndex]);
  
  // 太鼓モードの切り替えを監視
  useEffect(() => {
    if (fantasyPixiInstance) {
      fantasyPixiInstance.updateTaikoMode(gameState.isTaikoMode);
      isTaikoModeRef.current = gameState.isTaikoMode;
    }
  }, [fantasyPixiInstance, gameState.isTaikoMode]);
  
  // 太鼓の達人モードのノーツ表示更新（最適化版）
  useEffect(() => {
    if (!fantasyPixiInstance || !gameState.isTaikoMode || gameState.taikoNotes.length === 0) return;
    
    let animationId: number;
    let lastUpdateTime = 0;
    const updateInterval = 1000 / 60; // 60fps
    
    // ループ情報を事前計算
    const stage = gameState.currentStage!;
          const secPerMeasure = (60 / (stage.bpm || 120)) * (stage.timeSignature || 4);
          const loopDuration = (stage.measureCount || 8) * secPerMeasure;
    
    const updateTaikoNotes = (timestamp: number) => {
      // フレームレート制御
      if (timestamp - lastUpdateTime < updateInterval) {
        animationId = requestAnimationFrame(updateTaikoNotes);
        return;
      }
      lastUpdateTime = timestamp;
      
      const currentTime = bgmManager.getCurrentMusicTime();
      const judgeLinePos = fantasyPixiInstance.getJudgeLinePosition();
      const lookAheadTime = 4; // 4秒先まで表示
      const noteSpeed = 400; // ピクセル/秒
      const previewWindow = 2 * secPerMeasure; // 次ループのプレビューは2小節分
      
      // カウントイン中は複数ノーツを先行表示
      if (currentTime < 0) {
        const notesToDisplay: Array<{id: string, chord: string, x: number}> = [];
        const maxPreCountNotes = 6;
        for (let i = 0; i < gameState.taikoNotes.length; i++) {
          const note = gameState.taikoNotes[i];
          const timeUntilHit = note.hitTime - currentTime; // currentTime は負値
          if (timeUntilHit > lookAheadTime) break;
          if (timeUntilHit >= -0.5) {
            const x = judgeLinePos.x + timeUntilHit * noteSpeed;
            notesToDisplay.push({ id: note.id, chord: note.chord.displayName, x });
            if (notesToDisplay.length >= maxPreCountNotes) break;
          }
        }
        fantasyPixiInstance.updateTaikoNotes(notesToDisplay);
        animationId = requestAnimationFrame(updateTaikoNotes);
        return;
      }
      
      // 表示するノーツを収集
      const notesToDisplay: Array<{id: string, chord: string, x: number}> = [];
      
      // 現在の時間（カウントイン中は負値）をループ内0..Tへ正規化
      const normalizedTime = ((currentTime % loopDuration) + loopDuration) % loopDuration;
      
      // 通常のノーツ（現在ループのみ表示）
      gameState.taikoNotes.forEach((note, index) => {
        // 2週目以降は全てのノーツを表示対象とする
        const loopCount = Math.floor(currentTime / loopDuration);

        // ヒット済みノーツは現在ループでは表示しない（次ループのプレビューには表示される）
        if (note.isHit) return;

        // 既にこのループで消化済みのインデックスは表示しない（復活防止）
        if (index < gameState.currentNoteIndex) return;

        // 現在ループ基準の時間差
        const timeUntilHit = note.hitTime - normalizedTime;

        // 判定ライン左側（過去）は描画しない
        const lowerBound = 0;

        // 表示範囲内のノーツ（現在ループのみ）
        if (timeUntilHit >= lowerBound && timeUntilHit <= lookAheadTime) {
          const x = judgeLinePos.x + timeUntilHit * noteSpeed;
          notesToDisplay.push({
            id: note.id,
            chord: note.chord.displayName,
            x
          });
        }
      });
      
      // すでに通常ノーツで表示予定のベースID集合（プレビューと重複させない）
      const displayedBaseIds = new Set(notesToDisplay.map(n => n.id));
      
      // 直前に消化したノーツのインデックス（復活させない）
      const lastCompletedIndex = gameState.taikoNotes.length > 0
        ? (gameState.currentNoteIndex - 1 + gameState.taikoNotes.length) % gameState.taikoNotes.length
        : -1;
      
      // ループ対応：次ループは「2小節分だけ」先読みし、判定ライン右側のみ表示
      const timeToLoop = loopDuration - normalizedTime;
      if (timeToLoop < previewWindow && gameState.taikoNotes.length > 0) {
        for (let i = 0; i < gameState.taikoNotes.length; i++) {
          const note = gameState.taikoNotes[i];

          // 直前に消化したノーツはプレビューで復活させない
          if (i === lastCompletedIndex) continue;
          // すでに通常ノーツで表示しているものは重複させない
          if (displayedBaseIds.has(note.id)) continue;

          const virtualHitTime = note.hitTime + loopDuration;
          const timeUntilHit = virtualHitTime - normalizedTime;

          // 現在より過去とみなせるものは描画しない
          if (timeUntilHit <= 0) continue;
          // 2小節分だけに制限
          if (timeUntilHit > previewWindow) break;

          const x = judgeLinePos.x + timeUntilHit * noteSpeed;
          notesToDisplay.push({
            id: `${note.id}_loop`,
            chord: note.chord.displayName,
            x
          });
        }
      }
      
      // PIXIレンダラーに更新を送信
      fantasyPixiInstance.updateTaikoNotes(notesToDisplay);
      
      animationId = requestAnimationFrame(updateTaikoNotes);
    };
    
    // 初回実行
    animationId = requestAnimationFrame(updateTaikoNotes);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [gameState.isTaikoMode, gameState.taikoNotes, gameState.currentNoteIndex, fantasyPixiInstance, gameState.currentStage]);
  
  // 設定変更時にPIXIレンダラーを更新（鍵盤ハイライトは条件付きで有効）
  useEffect(() => {
    if (!pixiRenderer) return;
    const canGuide = stage.showGuide && gameState.simultaneousMonsterCount === 1;
    pixiRenderer.updateSettings({ practiceGuide: canGuide ? 'key' : 'off' });
    devLog.debug('🎮 PIXIレンダラー設定更新:', { practiceGuide: canGuide ? 'key' : 'off', showGuide: stage.showGuide, simCount: gameState.simultaneousMonsterCount, mode: stage.mode });
  }, [pixiRenderer, stage.showGuide, gameState.simultaneousMonsterCount, stage.mode]);

  // 問題が変わったタイミングでハイライトを確実にリセット
  useEffect(() => {
    if (!pixiRenderer) return;
    // progression/single 共通：押下中のオレンジは保持。ガイドのみクリア。
    (pixiRenderer as any).setGuideHighlightsByMidiNotes?.([]);
  }, [pixiRenderer, gameState.currentChordTarget, gameState.currentNoteIndex]);

  // ガイド用ハイライト更新（showGuideが有効かつ同時出現数=1のときのみ）
  useEffect(() => {
    if (!pixiRenderer) return;
    const canGuide = stage.showGuide && gameState.simultaneousMonsterCount === 1;
    const setGuideMidi = (midiNotes: number[]) => {
      (pixiRenderer as any).setGuideHighlightsByMidiNotes?.(midiNotes);
    };
    if (!canGuide) {
      // ガイドだけ消す（演奏中オレンジは維持）
      setGuideMidi([]);
      return;
    }
    const targetMonster = gameState.activeMonsters?.[0];
    const chord = targetMonster?.chordTarget || gameState.currentChordTarget;
    if (!chord) {
      setGuideMidi([]);
      return;
    }
    // 差分適用のみ（オレンジは残る）
    setGuideMidi(chord.notes as number[]);
  }, [pixiRenderer, stage.showGuide, gameState.simultaneousMonsterCount, gameState.activeMonsters, gameState.currentChordTarget]);
  
  // HPハート表示（プレイヤーと敵の両方を赤色のハートで表示）
  const renderHearts = useCallback((hp: number, maxHp: number, isPlayer: boolean = true) => {
    if (maxHp >= 6) {
      return (
        <span className={cn(
          "text-2xl text-red-500 font-bold transition-all duration-300",
          heartFlash && isPlayer ? "animate-pulse brightness-150" : ""
        )}>
          ♥×{hp}
        </span>
      );                                    // ★★★ add
    }
    
    const hearts = [];
    // HP表示のデバッグログを追加
    devLog.debug(`💖 ${isPlayer ? 'プレイヤー' : '敵'}HP表示:`, { current: hp, max: maxHp });
    
    for (let i = 0; i < maxHp; i++) {
      hearts.push(
        <span key={i} className={cn(
          "text-2xl transition-all duration-300 drop-shadow-sm",
          i < hp 
            ? "text-red-500" // プレイヤーも敵も赤いハート
            : "text-gray-400", // 空のハートは薄いグレー
          heartFlash && isPlayer && i < hp ? "animate-pulse brightness-150" : ""
        )}>
          {i < hp ? "♥" : "♡"}
        </span>
      );
    }
    return hearts;
  }, [heartFlash]);
  
  // 敵のゲージ表示（黄色系）
  const renderEnemyGauge = useCallback(() => {
    return (
      <div className="w-48 h-6 bg-gray-700 border-2 border-gray-600 rounded-full mt-2 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-yellow-500 to-orange-400 rounded-full transition-all duration-200 ease-out"
          style={{ 
            width: `${Math.min(gameState.enemyGauge, 100)}%`,
            boxShadow: gameState.enemyGauge > 80 ? '0 0 10px rgba(245, 158, 11, 0.6)' : 'none'
          }}
        />
      </div>
    );
  }, [gameState.enemyGauge]);
  
  // NEXTコード表示（コード進行モード用）
  const getNextChord = useCallback(() => {
    if (!stage.mode.startsWith('progression') || !stage.chordProgression) return null;
    const nextIndex = (gameState.currentQuestionIndex + 1) % stage.chordProgression.length;
    const spec = stage.chordProgression[nextIndex] as any;
    return typeof spec === 'string' ? spec : spec?.chord ?? '';
  }, [stage.mode, stage.chordProgression, gameState.currentQuestionIndex]);
  
  // SPゲージ表示
  const renderSpGauge = useCallback((sp: number) => {
    const spBlocks = [];
    for (let i = 0; i < 5; i++) {
      spBlocks.push(
        <div
          key={i}
          className={cn(
            "w-10 h-3 rounded transition-all duration-300",
            i < sp ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.7)]' : 'bg-gray-600'
          )}
        />
      );
    }
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm font-bold text-yellow-300">SP</span>
        {spBlocks}
      </div>
    );
  }, []);
  
  // ★ マウント時 autoStart なら即開始
  useEffect(() => {
    if (autoStart) {
      initializeGame({
        ...stage,
        // 互換性：Supabaseのカラム note_interval_beats を noteIntervalBeats にマップ（存在する場合）
        noteIntervalBeats: (stage as any).note_interval_beats ?? (stage as any).noteIntervalBeats
      } as any);
    }
  }, [autoStart, initializeGame, stage]);

  // ゲーム開始前画面（オーバーレイ表示中は表示しない）
  if (!overlay && !gameState.isCompleting && (!gameState.isGameActive || !gameState.currentChordTarget)) {
    devLog.debug('🎮 ゲーム開始前画面表示:', { 
      isGameActive: gameState.isGameActive,
      hasCurrentChord: !!gameState.currentChordTarget,
      stageName: stage.name,
      hasOverlay: !!overlay
    });
    
    return (
      <div className="min-h-screen bg-black flex items-center justify-center fantasy-game-screen">
        <div className="text-white text-center">
          <div className="text-6xl mb-6">🎮</div>
          <h2 className="text-3xl font-bold mb-4">
            {stage?.name ?? 'タイトル取得失敗'}
          </h2>
          <p className="text-gray-200 mb-8">
            {stage?.description ?? '説明テキストを取得できませんでした'}
          </p>
          <button
            onClick={() => {
              devLog.debug('🎮 ゲーム開始ボタンクリック');
              initializeGame({
                ...stage,
                // 互換性：Supabaseのカラム note_interval_beats を noteIntervalBeats にマップ（存在する場合）
                noteIntervalBeats: (stage as any).note_interval_beats ?? (stage as any).noteIntervalBeats
              } as any);
            }}
            className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold text-xl rounded-lg shadow-lg transform hover:scale-105 transition-all"
          >
            Start
          </button>
          
          {/* デバッグ情報 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 bg-black bg-opacity-50 text-white text-xs p-3 rounded">
              <div>ゲーム状態: {gameState.isGameActive ? 'アクティブ' : '非アクティブ'}</div>
              <div>現在のコード: {gameState.currentChordTarget?.displayName || 'なし'}</div>
              <div>許可コード数: {stage.allowedChords?.length || 0}</div>
              {stage.mode === 'single' && <div>敵ゲージ秒数: {stage.enemyGaugeSeconds}</div>}
              <div>オーバーレイ: {overlay ? '表示中' : 'なし'}</div>
              <div>完了処理中: {gameState.isCompleting ? 'はい' : 'いいえ'}</div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn(
      "h-screen bg-black text-white relative overflow-hidden select-none flex flex-col fantasy-game-screen"
    )}>
      {/* ===== ヘッダー ===== */}
      <div className="relative z-30 p-1 text-white flex-shrink-0" style={{ minHeight: '40px' }}>
        <div className="flex items-center justify-between">
          {/* 左: Measure/Beat 表示 */}
          <div className="text-sm text-yellow-300 font-dotgothic16">
            <>{bgmManager.getIsCountIn() ? 'Measure /' : `Measure ${currentMeasure}`} - B {currentBeat}</>
          </div>
          {/* 中: ステージ情報とモンスター数（残り） */}
          <div className="flex items-center space-x-4">
            <div className="text-sm font-bold">
              Stage {stage.stageNumber}
            </div>
            <div className="text-xs text-gray-300">
              モンスター数: {Math.max(0, (gameState.totalEnemies || stage.enemyCount || 0) - (gameState.enemiesDefeated || 0))}
            </div>
          </div>
          {/* 右: 戻る/設定ボタン */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onBackToStageSelect}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium transition-colors"
            >
              ステージ選択に戻る
            </button>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs font-medium transition-colors"
            >
              ⚙️ 設定
            </button>
          </div>
        </div>
      </div>
      
      {/* ===== メインゲームエリア ===== */}
      <div className="flex-grow flex flex-col justify-center px-2 py-1 text-white text-center relative z-20" style={{ minHeight: '200px' }}>
        {/* ★★★ このエリアは削除します ★★★ */}
        {/* <div className="mb-1 text-center">
          ... (古いヒント表示エリア) ...
        </div>
        */}
        
        {/* ===== モンスター＋エフェクト描画エリア ===== */}
        <div className="mb-2 text-center relative w-full">
          <div
            ref={monsterAreaRef}
            className="relative w-full bg-black bg-opacity-20 rounded-lg overflow-hidden"
            style={{ height: `${monsterAreaHeight}px` }}
          >
            {/* 魔法名表示 - モンスターカード内に移動 */}
            <FantasyPIXIRenderer
              width={Math.max(monsterAreaWidth, 1)}   // 0 を渡さない
              height={monsterAreaHeight}
              monsterIcon={currentEnemy.icon}
    
              enemyGauge={gameState.enemyGauge}
              onReady={handleFantasyPixiReady}
              onMonsterDefeated={handleMonsterDefeated}
              onShowMagicName={handleShowMagicName}
              className="w-full h-full"
              activeMonsters={gameState.activeMonsters}
              imageTexturesRef={imageTexturesRef}
            />
          </div>
          
          {/* モンスターの UI オーバーレイ */}
          <div className="mt-2">
            {gameState.activeMonsters && gameState.activeMonsters.length > 0 ? (
              // ★★★ 修正点: flexboxで中央揃え、gap-0で隣接 ★★★
              <div
                className="flex justify-center items-start w-full mx-auto gap-0"
                style={{
                  // スマホ横画面ではUIエリアを圧縮
                  height: (window.innerWidth > window.innerHeight && window.innerWidth < 900)
                    ? 'min(80px,16vw)'
                    : 'min(120px,22vw)'
                }}
              >
                {gameState.activeMonsters
                  .sort((a, b) => a.position.localeCompare(b.position)) // 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'順でソート
                  .map((monster) => {
                    // モンスター数に応じて幅を動的に計算
                    const monsterCount = gameState.activeMonsters.length;
                    let widthPercent: string;
                    let maxWidth: string;
                    
                    // モバイル判定（768px未満）
                    const isMobile = window.innerWidth < 768;
                    
                    if (isMobile) {
                      // モバイルの場合
                      if (monsterCount <= 3) {
                        widthPercent = '30%';
                        maxWidth = '120px';
                      } else if (monsterCount <= 5) {
                        widthPercent = '18%';
                        maxWidth = '80px';
                      } else {
                        // 6体以上
                        widthPercent = '12%';
                        maxWidth = '60px';
                      }
                    } else {
                      // デスクトップの場合
                      if (monsterCount <= 3) {
                        widthPercent = '30%';
                        maxWidth = '220px';
                      } else if (monsterCount <= 5) {
                        widthPercent = '18%';
                        maxWidth = '150px';
                      } else {
                        // 6体以上
                        widthPercent = '12%';
                        maxWidth = '120px';
                      }
                    }
                    
                    return (
                      <div 
                        key={monster.id}
                        // ★★★ 修正点: flexアイテムとして定義、幅を設定 ★★★
                        className="flex-shrink-0 flex flex-col items-center"
                        style={{ width: widthPercent, maxWidth }} // 動的に幅を設定
                      >
                      {/* 太鼓の達人モードでは敵の下に何も表示しない */}
                      {!gameState.isTaikoMode && (
                        <>
                          {/* 通常モードの表示 */}
                          <div className={`text-yellow-300 font-bold text-center mb-1 truncate w-full ${
                            monsterCount > 5 ? 'text-sm' : monsterCount > 3 ? 'text-base' : 'text-xl'
                          }`}>
                            {monster.chordTarget.displayName}
                          </div>
                          
                          {/* ヒント表示 */}
                          <div className={`mt-1 font-medium h-6 text-center ${
                            monsterCount > 5 ? 'text-xs' : 'text-sm'
                          }`}>
                          {monster.chordTarget.noteNames.map((noteName, index) => {
                            // 表示オプションを定義
                            const displayOpts: DisplayOpts = { lang: currentNoteNameLang, simple: currentSimpleNoteName };
                            // 表示用の音名に変換
                            const displayNoteName = toDisplayName(noteName, displayOpts);
                            
                            // 正解判定用にMIDI番号を計算 (tonal.jsを使用)
                            const noteObj = parseNote(noteName + '4'); // オクターブはダミー
                            const noteMod12 = noteObj.midi !== null ? noteObj.midi % 12 : -1;
                            
                            const isCorrect = monster.correctNotes.includes(noteMod12);

                            if (!stage.showGuide && !isCorrect) {
                              return (
                                <span
                                  key={index}
                                  className={`mx-0.5 opacity-0 ${monsterCount > 5 ? '' : 'text-xs'}`}
                                  style={monsterCount > 5 ? { fontSize: '10px' } : undefined}
                                >
                                  ?
                                </span>
                              );
                            }
                            return (
                                                              <span
                                  key={index}
                                  className={`mx-0.5 ${monsterCount > 5 ? '' : 'text-xs'} ${isCorrect ? 'text-green-400 font-bold' : 'text-gray-300'}`}
                                  style={monsterCount > 5 ? { fontSize: '10px' } : undefined}
                                >
                                  {displayNoteName}
                                  {isCorrect && '✓'}
                                </span>
                            );
                          })}
                          </div>
                        </>
                      )}
                      
                      {/* 魔法名表示 */}
                      {magicName && magicName.monsterId === monster.id && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                          {/* ▼▼▼ 変更点 ▼▼▼ */}
                          <div className={`font-bold font-dotgothic16 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] opacity-75 text-sm ${
                            magicName.isSpecial ? 'text-yellow-300' : 'text-white'
                          }`}>
                          {/* ▲▲▲ ここまで ▲▲▲ */}
                            {magicName.name}
                          </div>
                        </div>
                      )}
                      
                      {/* 行動ゲージ (singleモードのみ表示) */}
                      {stage.mode === 'single' && (
                        <div 
                          ref={el => {
                            if (el) gaugeRefs.current.set(monster.id, el);
                          }}
                          className="w-full h-2 bg-gray-700 border border-gray-600 rounded-full overflow-hidden relative mb-1"
                        >
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-purple-700 transition-all duration-100"
                            style={{ width: `${monster.gauge}%` }}
                          />
                        </div>
                      )}
                      
                      {/* HPゲージ */}
                      {(() => {
                        const isLandscape = window.innerWidth > window.innerHeight;
                        // 横画面のモバイルではUI圧縮中だが、バーは従来より大きめに
                        const gaugeHeightClass = (isMobile && isLandscape)
                          ? (monsterCount > 5 ? 'h-4' : 'h-5')
                          : (monsterCount > 5 ? 'h-5' : 'h-6');
                        const textSizeClass = (isMobile && isLandscape)
                          ? (monsterCount > 5 ? 'text-xs' : 'text-sm')
                          : (monsterCount > 5 ? 'text-sm' : 'text-base');
                        return (
                          <div className={cn("w-full bg-gray-700 rounded-full overflow-hidden relative border-2 border-gray-600", gaugeHeightClass)}>
                            <div
                              className="h-full bg-gradient-to-r from-red-500 to-red-700 transition-all duration-300"
                              style={{ width: `${(monster.currentHp / monster.maxHp) * 100}%` }}
                            />
                            <div className={cn("absolute inset-0 flex items-center justify-center font-bold text-white drop-shadow", textSizeClass)}>
                              {monster.currentHp}/{monster.maxHp}
                            </div>
                          </div>
                        );
                                             })()}
                     </div>
                     );
                   })}
              </div>
            ) : null}
            
            {/* プレイヤーのHP表示とSPゲージ */}
          </div>
        </div>
        
        {/* NEXTコード表示（固定進行モードのみ、サイズを縮小） */}
        {stage.mode === 'progression_order' && getNextChord() && (
          <div className="mb-1 text-right">
            <div className="text-white text-xs">NEXT:</div>
            <div className="text-blue-300 text-sm font-bold">
              {getNextChord()}
            </div>
          </div>
        )}
      </div>
      
      {/* HP・SPゲージを固定配置 */}
      <div className="absolute left-2 bottom-2 z-50
                  pointer-events-none bg-black/40 rounded px-2 py-1">
        <div className="flex space-x-0.5">
          {renderHearts(gameState.playerHp, stage.maxHp)}
        </div>
      </div>
      <div className="absolute right-2 bottom-2 z-50
                  pointer-events-none bg-black/40 rounded px-2 py-1">
        {renderSpGauge(gameState.playerSp)}
      </div>
      
      {/* ===== ピアノ鍵盤エリア ===== */}
      <div 
        ref={gameAreaRef}
        className="relative mx-2 mb-1 bg-black bg-opacity-20 rounded-lg overflow-hidden flex-shrink-0 w-full"
        style={{ height: '120px' }} // ★★★ 高さを120pxに固定 ★★★
      >
        {(() => {
          // スクロール判定ロジック（GameEngine.tsxと同様）
          const VISIBLE_WHITE_KEYS = 14; // モバイル表示時の可視白鍵数
          const TOTAL_WHITE_KEYS = 52; // 88鍵中の白鍵数
          const gameAreaWidth = gameAreaRef.current?.clientWidth || window.innerWidth;
          const adjustedThreshold = 1100; // PC判定のしきい値
          
          let pixiWidth: number;
          let needsScroll: boolean;
          
          if (gameAreaWidth >= adjustedThreshold) {
            // PC等、画面が十分広い → 88鍵全表示（スクロール不要）
            pixiWidth = gameAreaWidth;
            needsScroll = false;
          } else {
            // モバイル等、画面が狭い → 横スクロール表示
            const whiteKeyWidth = gameAreaWidth / VISIBLE_WHITE_KEYS;
            pixiWidth = Math.ceil(TOTAL_WHITE_KEYS * whiteKeyWidth);
            needsScroll = true;
          }
          
          if (needsScroll) {
            // スクロールが必要な場合
            return (
              <div 
                className="absolute inset-0 overflow-x-auto overflow-y-hidden touch-pan-x custom-game-scrollbar" 
                style={{ 
                  WebkitOverflowScrolling: 'touch',
                  scrollSnapType: 'x proximity',
                  scrollBehavior: 'smooth',
                  width: '100%',
                  touchAction: 'pan-x', // 横スクロールのみを許可
                  overscrollBehavior: 'contain' // スクロールの境界を制限
                }}
                ref={pianoScrollRef}
              >
                <PIXINotesRenderer
                  activeNotes={[]}
                  width={pixiWidth}
                  height={120} // ★★★ 高さを120に固定 ★★★
                  currentTime={0}
                  onReady={handlePixiReady}
                  className="w-full h-full"
                />
              </div>
            );
          } else {
            // スクロールが不要な場合（全画面表示）
            return (
              <div className="absolute inset-0 overflow-hidden">
                <PIXINotesRenderer
                  activeNotes={[]}
                  width={pixiWidth}
                  height={120} // ★★★ 高さを120に固定 ★★★
                  currentTime={0}
                  onReady={handlePixiReady}
                  className="w-full h-full"
                />
              </div>
            );
          }
        })()}
        
        {/* 入力中のノーツ表示 */}
        
      </div>
      
      {/* エフェクト表示は削除 - PIXI側で処理 */}
      
      {/* デバッグ情報（FPSモニター削除済み） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-70 text-white text-xs p-2 rounded z-40">
          <div>Q: {gameState.currentQuestionIndex + 1}/{gameState.totalQuestions}</div>
          <div>HP: {gameState.playerHp}/{stage.maxHp}</div>
          {stage.mode === 'single' && <div>ゲージ: {gameState.enemyGauge.toFixed(1)}%</div>}
          <div>スコア: {gameState.score}</div>
          <div>正解数: {gameState.correctAnswers}</div>
          <div>現在のコード: {gameState.currentChordTarget?.displayName || 'なし'}</div>
          <div>SP: {gameState.playerSp}</div>
          
          {/* ゲージ強制満タンテストボタン */}
          <button
            onClick={() => {
              devLog.debug('⚡ ゲージ強制満タンテスト実行');
              // ゲージを100にして敵攻撃をトリガー
              handleEnemyAttack();
            }}
            className="mt-2 px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-xs"
          >
            敵攻撃テスト
          </button>
        </div>
      )}
      
      {/* 設定モーダル */}
      <FantasySettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSettingsChange={(settings) => {
          devLog.debug('⚙️ ファンタジー設定変更:', settings);
          // setShowGuide(settings.showGuide); // この行を削除
          setCurrentNoteNameLang(settings.noteNameLang);
          setCurrentSimpleNoteName(settings.simpleNoteName);
          
          // ★★★ 音量更新処理を追加 ★★★
          // ピアノ音量設定が変更されたら、グローバル音量を更新
          if (settings.volume !== undefined) {
            // gameStoreの音量設定も更新
            updateSettings({ midiVolume: settings.volume });
            
            // グローバル音量を更新
            import('@/utils/MidiController').then(({ updateGlobalVolume }) => {
              updateGlobalVolume(settings.volume);
              devLog.debug(`🎵 ファンタジーモードのピアノ音量を更新: ${settings.volume}`);
            }).catch(error => {
              console.error('MidiController import failed:', error);
            });
          }
          
          // 効果音音量設定が変更されたら、gameStoreを更新
          if (settings.soundEffectVolume !== undefined) {
            updateSettings({ soundEffectVolume: settings.soundEffectVolume });
            devLog.debug(`🔊 ファンタジーモードの効果音音量を更新: ${settings.soundEffectVolume}`);
            
            // FantasySoundManagerの音量も即座に更新
            import('@/utils/FantasySoundManager')
              .then((mod) => {
                const FSM = (mod as any).FantasySoundManager ?? mod.default;
                FSM?.setVolume(settings.soundEffectVolume);
              })
              .catch(error => {
                console.error('Failed to update FantasySoundManager volume:', error);
              });
          }
        }}
        // gameStoreの値を渡す
        midiDeviceId={settings.selectedMidiDevice}
        volume={settings.midiVolume} // gameStoreのMIDI音量を渡す
        soundEffectVolume={settings.soundEffectVolume} // gameStoreの効果音音量を渡す
        noteNameLang={currentNoteNameLang}
        simpleNoteName={currentSimpleNoteName}
        // gameStoreを更新するコールバックを渡す
        onMidiDeviceChange={(deviceId) => updateSettings({ selectedMidiDevice: deviceId })}
        isMidiConnected={isMidiConnected}
      />
      
      {/* オーバーレイ表示 */}           {/* ★★★ add */}
      {overlay && (
        <div className="absolute inset-0 flex items-center justify-center z-[9999] pointer-events-none">
          <span className="font-dotgothic16 text-6xl text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
            {overlay.text}
          </span>
        </div>
      )}
      
      {/* Ready オーバーレイ */}
      {isReady && (
        <div className="absolute inset-0 flex items-center justify-center z-[9998] bg-black/60">
          <span className="font-dotgothic16 text-7xl text-white animate-pulse">
            Ready
          </span>
        </div>
      )}
    </div>
  );
};

export default FantasyGameScreen;