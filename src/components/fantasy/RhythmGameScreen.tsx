/**
 * リズムゲーム画面
 * コードが右から左に流れるリズムゲームの表示を担当
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { usePianoStore } from '@/stores/pianoStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Button } from '@/components/ui/button';
import { Piano } from '@/components/Piano';
import { RhythmGameEngine, type RhythmGameState, type RhythmStage, type ChordNote } from './RhythmGameEngine';
import { devLog } from '@/utils/logger';

interface RhythmGameScreenProps {
  stage: RhythmStage;
  onBackToMenu: () => void;
  onGameEnd: (result: 'clear' | 'gameover', score: number) => void;
}

export const RhythmGameScreen: React.FC<RhythmGameScreenProps> = ({
  stage,
  onBackToMenu,
  onGameEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const [gameState, setGameState] = useState<RhythmGameState | null>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  
  const { playingChordIds } = usePianoStore();
  const { settings } = useSettingsStore();

  // Canvas描画
  const draw = useCallback((ctx: CanvasRenderingContext2D, state: RhythmGameState) => {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;

    // 背景のクリア
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // レーンの描画
    const laneY = height / 2;
    const laneHeight = 100;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, laneY - laneHeight / 2, width, laneHeight);

    // 判定ラインの描画
    const judgmentLineX = 100;
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(judgmentLineX, laneY - laneHeight);
    ctx.lineTo(judgmentLineX, laneY + laneHeight);
    ctx.stroke();

    // 判定ウィンドウの可視化（デバッグ用）
    if (settings.isDevelopment) {
      ctx.fillStyle = 'rgba(255, 107, 107, 0.1)';
      ctx.fillRect(judgmentLineX - 20, laneY - laneHeight / 2, 40, laneHeight);
    }

    // カウントイン表示
    if (state.isCountIn) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '48px bold sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('READY...', width / 2, height / 2);
      return;
    }

    // コードノートの描画
    state.chordNotes.forEach(note => {
      if (note.hit || note.missed) return;

      const noteX = judgmentLineX + (note.position / 1000) * (width - judgmentLineX - 100);
      const noteWidth = 80;
      const noteHeight = 60;
      const noteY = laneY - noteHeight / 2;

      // ノートの背景
      ctx.fillStyle = '#4ecdc4';
      ctx.fillRect(noteX - noteWidth / 2, noteY, noteWidth, noteHeight);

      // ノートの枠線
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(noteX - noteWidth / 2, noteY, noteWidth, noteHeight);

      // コード名
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px bold sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(note.chord.displayName, noteX, laneY);
    });

    // ゲーム情報の表示
    // スコア
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px bold sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`SCORE: ${state.score}`, 20, 20);

    // コンボ
    if (state.combo > 0) {
      ctx.fillStyle = '#ffd93d';
      ctx.font = '32px bold sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${state.combo} COMBO`, width / 2, height - 100);
    }

    // HP表示
    const hpBarWidth = 300;
    const hpBarHeight = 20;
    const hpBarX = width - hpBarWidth - 20;
    const hpBarY = 20;
    const hpPercentage = state.playerHp / (stage.maxHp || 100);

    // HPバーの背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);

    // HPバー
    ctx.fillStyle = hpPercentage > 0.3 ? '#4ecdc4' : '#ff6b6b';
    ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpPercentage, hpBarHeight);

    // HPバーの枠線
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);

    // HP数値
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`HP: ${state.playerHp}/${stage.maxHp}`, hpBarX - 10, hpBarY);

    // 判定結果の表示（最新のヒット時のみ）
    const recentHit = state.chordNotes.find(n => n.hit);
    if (recentHit) {
      const timeSinceHit = Date.now() - recentHit.targetTime;
      if (timeSinceHit < 1000) {
        const alpha = 1 - timeSinceHit / 1000;
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.font = '36px bold sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const judgment = state.perfectCount > 0 ? 'PERFECT!' : 
                        state.greatCount > 0 ? 'GREAT!' : 
                        state.goodCount > 0 ? 'GOOD!' : '';
        
        if (judgment) {
          ctx.fillText(judgment, width / 2, height / 2 - 100);
        }
      }
    }
  }, [stage, settings]);

  // アニメーションループ
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (ctx && gameState && gameState.isGameActive) {
      draw(ctx, gameState);
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [gameState, draw]);

  // Canvas のリサイズ処理
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // アニメーションの開始/停止
  useEffect(() => {
    if (isGameStarted && gameState) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isGameStarted, gameState, animate]);

  // ゲーム開始
  const handleStartGame = () => {
    setIsGameStarted(true);
  };

  // ゲーム終了処理
  const handleGameEnd = useCallback((result: 'clear' | 'gameover', score: number) => {
    setIsGameStarted(false);
    onGameEnd(result, score);
  }, [onGameEnd]);

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 bg-gray-800">
        <Button
          variant="ghost"
          onClick={onBackToMenu}
          className="text-white hover:bg-gray-700"
        >
          ← メニューに戻る
        </Button>
        <h2 className="text-2xl font-bold text-white">
          {stage.name} - リズムモード
        </h2>
        <div className="w-32" /> {/* スペーサー */}
      </div>

      {/* ゲーム画面 */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* ゲーム開始前のオーバーレイ */}
        {!isGameStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-white mb-4">
                {stage.name}
              </h3>
              <p className="text-lg text-gray-300 mb-8">
                リズムタイプ: {stage.chordProgressionData ? 'コード進行' : 'ランダム'}
              </p>
              <Button
                size="lg"
                onClick={handleStartGame}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-xl"
              >
                ゲームスタート
              </Button>
            </div>
          </div>
        )}

        {/* ゲームオーバー/クリア画面 */}
        {gameState && gameState.gameResult && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="text-center p-8 bg-gray-800 rounded-lg">
              <h3 className="text-4xl font-bold mb-4">
                {gameState.gameResult === 'clear' ? (
                  <span className="text-yellow-400">STAGE CLEAR!</span>
                ) : (
                  <span className="text-red-400">GAME OVER</span>
                )}
              </h3>
              
              <div className="text-white text-xl space-y-2 mb-6">
                <p>スコア: {gameState.score}</p>
                <p>最大コンボ: {gameState.maxCombo}</p>
                <div className="mt-4 space-y-1">
                  <p>Perfect: {gameState.perfectCount}</p>
                  <p>Great: {gameState.greatCount}</p>
                  <p>Good: {gameState.goodCount}</p>
                  <p>Miss: {gameState.missCount}</p>
                </div>
              </div>

              <Button
                size="lg"
                onClick={() => handleGameEnd(gameState.gameResult!, gameState.score)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                結果を確認
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ピアノ */}
      <div className="h-64 bg-gray-800 border-t border-gray-700">
        <Piano />
      </div>

      {/* ゲームエンジン（非表示） */}
      {isGameStarted && (
        <RhythmGameEngine
          stage={stage}
          onGameStateChange={setGameState}
          playingChordIds={playingChordIds}
          onGameEnd={handleGameEnd}
        />
      )}
    </div>
  );
};