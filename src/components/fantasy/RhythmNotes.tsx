/**
 * リズムノーツ表示コンポーネント
 * 右から左に流れる横長長方形のノーツを表示
 */

import React, { useEffect, useRef } from 'react';
import { RhythmNote, NOTE_SPEED, JUDGMENT_LINE_POSITION } from '@/types/rhythm';
import { toDisplayChordName, type DisplayOpts } from '@/utils/display-note';
import './RhythmNotes.css';

interface RhythmNotesProps {
  notes: RhythmNote[];
  bpm: number;
  timeSignature: number;
  displayOpts?: DisplayOpts;
}

const RhythmNotes: React.FC<RhythmNotesProps> = ({
  notes,
  bpm: _bpm,
  timeSignature: _timeSignature,
  displayOpts
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const animate = () => {
      const currentTime = performance.now();
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.offsetWidth;
      const judgmentLineX = containerWidth * JUDGMENT_LINE_POSITION;

      // ノーツの位置を更新
      notes.forEach(note => {
        const noteElement = document.getElementById(`note-${note.id}`);
        if (!noteElement || note.judged) return;

        // ノーツが判定ラインに到達するまでの時間
        const timeUntilJudgment = note.targetTime - currentTime;
        
        // 位置を計算（判定ラインからの距離）
        const distanceFromJudgmentLine = (timeUntilJudgment / 1000) * (containerWidth / NOTE_SPEED);
        const x = judgmentLineX + distanceFromJudgmentLine;

        // ノーツの位置を更新
        noteElement.style.transform = `translateX(${x}px)`;

        // 画面外に出たノーツは非表示
        if (x < -100) {
          noteElement.style.display = 'none';
        } else {
          noteElement.style.display = 'block';
        }
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [notes]);

  return (
    <div className="rhythm-notes-container" ref={containerRef}>
      {/* 判定ライン */}
      <div 
        className="judgment-line"
        style={{ left: `${JUDGMENT_LINE_POSITION * 100}%` }}
      />
      
      {/* レーン（ガイドライン） */}
      <div className="rhythm-lane" />
      
      {/* ノーツ */}
      {notes.map(note => (
        <div
          key={note.id}
          id={`note-${note.id}`}
          className={`rhythm-note ${note.judged ? 'judged' : ''}`}
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        >
          <span className="chord-name">
            {displayOpts ? toDisplayChordName(note.chord, displayOpts) : note.chord}
          </span>
        </div>
      ))}
    </div>
  );
};

export default RhythmNotes;