import React, { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { DEFAULT_DRUM_PADS } from '@/types';

/**
 * リズムノーツレンダラー（PIXI.js統合予定）
 * 現在は仮実装
 */
const RhythmNotesRenderer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { pattern, isPlaying, settings } = useGameStore((state) => ({
    pattern: state.rhythmState.pattern,
    isPlaying: state.isPlaying,
    settings: state.rhythmState.settings,
  }));

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // TODO: PIXI.js統合
    // - RhythmNotesRendererクラスの実装
    // - ノーツ降下アニメーション
    // - 判定ライン表示
    // - ヒットエフェクト

    console.log('RhythmNotesRenderer: TODO - Implement PIXI.js integration');

    return () => {
      // クリーンアップ
    };
  }, []);

  // 仮の表示
  return (
    <div ref={containerRef} className="rhythm-notes-renderer h-full relative bg-gray-900/20">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      
      {/* 判定ライン（仮表示） */}
      <div className="absolute bottom-32 left-0 right-0 h-1 bg-white/20" />
      
      {/* レーン区切り線（仮表示） */}
      <div className="absolute inset-0 flex justify-center">
        <div className="flex gap-24">
          {DEFAULT_DRUM_PADS.map((pad) => (
            <div
              key={pad.index}
              className="w-px h-full bg-gray-700/30"
              style={{
                backgroundColor: `${pad.color}20`,
              }}
            />
          ))}
        </div>
      </div>

      {/* プレースホルダーメッセージ */}
      {!pattern && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500 text-lg">パターンを選択してください</p>
        </div>
      )}
      
      {pattern && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-400 text-lg">再生ボタンを押して開始</p>
        </div>
      )}
    </div>
  );
};

export default RhythmNotesRenderer;