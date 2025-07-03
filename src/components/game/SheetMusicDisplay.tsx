import React, { useEffect, useRef, useState, useCallback } from 'react';
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay';
import { useGameSelector, useGameActions } from '@/stores/helpers';
import platform from '@/platform';
import { useGameStore } from '@/stores/gameStore';

interface SheetMusicDisplayProps {
  className?: string;
}

interface TimeMappingEntry {
  timeMs: number;
  xPosition: number;
}

/**
 * 楽譜表示コンポーネント
 * OSMDを使用して横スクロール形式の楽譜を表示
 */
const SheetMusicDisplay: React.FC<SheetMusicDisplayProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scoreWrapperRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // timeMappingはアニメーションループで使うため、useRefで状態の即時反映を保証
  const timeMappingRef = useRef<TimeMappingEntry[]>([]);
  
  const { currentTime, isPlaying, notes, musicXml } = useGameSelector((s) => ({
    currentTime: s.currentTime,
    isPlaying: s.isPlaying,
    notes: s.notes,
    musicXml: s.musicXml,
  }));
  
  const gameActions = useGameActions();
  
  // OSMDの初期化とレンダリング
  const loadAndRenderSheet = useCallback(async () => {
    if (!containerRef.current || !musicXml) {
      // musicXmlがない場合はクリア
      osmdRef.current?.clear();
      timeMappingRef.current = [];
      setError(musicXml === '' ? '楽譜データがありません' : null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 既存のOSMDインスタンスをクリア
      if (!osmdRef.current) {
      const options: IOSMDOptions = {
        autoResize: true,
        backend: 'svg',
        drawTitle: false,
        drawComposer: false,
        drawLyricist: false,
        drawPartNames: false,
        drawingParameters: 'compacttight',
          renderSingleHorizontalStaffline: true,
          pageFormat: 'Endless',
          pageBackgroundColor: '#ffffff',
        defaultColorNotehead: '#000000',
        defaultColorStem: '#000000',
        defaultColorRest: '#000000',
        defaultColorLabel: '#000000',
        defaultColorTitle: '#000000'
      };
      osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, options);
      }
      
      await osmdRef.current.load(musicXml);
      osmdRef.current.render();
      
      // タイムマッピングを作成
      createTimeMapping();
      
      console.log('OSMD initialized and rendered successfully');
      
    } catch (err) {
      console.error('楽譜の読み込みまたはレンダリングエラー:', err);
      setError(err instanceof Error ? err.message : '楽譜の処理中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [musicXml]); // musicXmlが変更されたら再実行

  // musicXmlが変更されたら楽譜を再読み込み・再レンダリング
  useEffect(() => {
    loadAndRenderSheet();
  }, [loadAndRenderSheet]);

  // 音符の時刻とX座標のマッピングを作成
  const createTimeMapping = useCallback(() => {
    if (!osmdRef.current || !notes || notes.length === 0) {
      console.warn('タイムマッピング作成スキップ: OSMD未初期化またはノートデータなし');
      return;
    }

    const mapping: TimeMappingEntry[] = [];
    const graphicSheet = osmdRef.current.GraphicSheet;
    
    if (!graphicSheet || !graphicSheet.MusicPages || graphicSheet.MusicPages.length === 0) {
      console.warn('楽譜のグラフィック情報が取得できません');
      return;
    }

    let noteIndex = 0;
    let osmdPlayableNoteCount = 0;
    
    console.log(`📊 OSMD Note Extraction Starting: ${notes.length} JSON notes to match`);
    
    // 全ての音符を走査して演奏可能なノートのみを抽出
    const osmdPlayableNotes = [];
    for (const page of graphicSheet.MusicPages) {
      for (const system of page.MusicSystems) {
        for (const staffLine of system.StaffLines) {
          for (const measure of staffLine.Measures) {
            for (const staffEntry of measure.staffEntries) {
              for (const voice of staffEntry.graphicalVoiceEntries) {
                for (const graphicNote of voice.notes) {
                  // isRest() が true、または sourceNote がない場合は休符と見なす
                  if (!graphicNote.sourceNote || (graphicNote.sourceNote as any).isRest?.()) {
                    continue;
                  }
                  
                  // タイで結ばれた後続音符はスキップ (OSMDの公式な方法)
                  if (graphicNote.sourceNote.NoteTie && !graphicNote.sourceNote.NoteTie.StartNote) {
                    continue;
                  }
                  
                  osmdPlayableNotes.push(graphicNote);
                }
              }
            }
          }
        }
      }
    }
    
    osmdPlayableNoteCount = osmdPlayableNotes.length;

    // マッピングを作成
    for (const graphicNote of osmdPlayableNotes) {
                  if (noteIndex < notes.length) {
                    const note = notes[noteIndex];
                    const absX = graphicNote.PositionAndShape.AbsolutePosition.x;
                    
                    if (absX !== undefined) {
                      mapping.push({
                        timeMs: note.time * 1000, // 秒をミリ秒に変換
                        xPosition: absX * 10 // OSMDの単位系からピクセルへ変換（概算）
                      });
                    }
                    noteIndex++;
      }
    }
    
    console.log(`📊 OSMD Note Extraction Summary:
    OSMD playable notes: ${osmdPlayableNoteCount}
    JSON notes count: ${notes.length}
    Mapped notes: ${mapping.length}
    Match status: ${osmdPlayableNoteCount === notes.length ? '✅ Perfect match!' : '❌ Mismatch!'}`);
    
    if (osmdPlayableNoteCount !== notes.length) {
      console.error(`ノート数の不一致: OSMD(${osmdPlayableNoteCount}) vs JSON(${notes.length}). プレイヘッドがずれる可能性があります。`);
    }
    
    timeMappingRef.current = mapping; // refを更新
  }, [notes]);

  // スクロールアニメーション
  const updateScroll = useCallback(() => {
    const mapping = timeMappingRef.current;
    if (!scoreWrapperRef.current || mapping.length === 0) {
      if (isPlaying) {
        animationFrameRef.current = platform.requestAnimationFrame(updateScroll);
      }
      return;
    }
    
    const currentTimeMs = useGameStore.getState().currentTime * 1000;
    
    let targetX = 0;
    
    // 最初のノートより前の場合、または最後のノートを過ぎた場合を考慮
    if (currentTimeMs < mapping[0].timeMs) {
      targetX = 0; // 開始前は先頭に
    } else if (currentTimeMs > mapping[mapping.length - 1].timeMs) {
      targetX = mapping[mapping.length - 1].xPosition; // 終了後は末尾に
    } else {
      // 現在の再生時間に最も近いノート区間を見つける
      let currentSegmentIndex = -1;
      for (let i = 0; i < mapping.length - 1; i++) {
        if (currentTimeMs >= mapping[i].timeMs && currentTimeMs < mapping[i + 1].timeMs) {
          currentSegmentIndex = i;
          break;
        }
      }

      if (currentSegmentIndex !== -1) {
        const prevEntry = mapping[currentSegmentIndex];
        const nextEntry = mapping[currentSegmentIndex + 1];
        const segmentDuration = nextEntry.timeMs - prevEntry.timeMs;
        const timeIntoSegment = currentTimeMs - prevEntry.timeMs;
        const progress = segmentDuration > 0 ? timeIntoSegment / segmentDuration : 0;
        
        // 2点間のX座標を線形補間
        targetX = prevEntry.xPosition + (nextEntry.xPosition - prevEntry.xPosition) * progress;
      } else {
         // マッピングの最後の要素（楽曲終了時）
        targetX = mapping[mapping.length - 1].xPosition;
      }
    }
    
    const playheadPosition = 100;
    const scrollX = targetX - playheadPosition;
    
    scoreWrapperRef.current.style.transform = `translateX(-${scrollX}px)`;
    
    if (isPlaying) {
      animationFrameRef.current = platform.requestAnimationFrame(updateScroll);
    }
  }, [isPlaying]); // isPlayingのみに依存

  // 再生状態が変わったらアニメーションを開始/停止
  useEffect(() => {
    if (isPlaying) {
      if (animationFrameRef.current === null) {
        animationFrameRef.current = platform.requestAnimationFrame(updateScroll);
      }
    } else if (animationFrameRef.current) {
      platform.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    return () => {
      if (animationFrameRef.current) {
        platform.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, updateScroll]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (osmdRef.current) {
        osmdRef.current.clear();
      }
      if (animationFrameRef.current) {
        platform.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // シークや一時停止中もプレイヘッドを即座に更新
  useEffect(() => {
    if (!isPlaying) {
      updateScroll();
    }
  }, [currentTime, isPlaying, updateScroll]);

  return (
    <div className={`relative overflow-x-hidden overflow-y-hidden bg-white text-black ${className}`}>
      {/* プレイヘッド（赤い縦線） */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
        style={{ left: '100px' }}
      />
      
      {/* 楽譜コンテナ - 上部に余白を追加 */}
      <div className="relative h-full pt-8 pb-4">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="text-black">楽譜を読み込み中...</div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="text-red-600">エラー: {error}</div>
          </div>
        )}
        
        {(!musicXml && !isLoading) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-600">楽譜データがありません</div>
          </div>
        )}
        
        {/* OSMDレンダリング用コンテナ */}
        <div 
          ref={scoreWrapperRef}
          className="h-full transition-transform duration-100 ease-out"
          style={{ willChange: 'transform' }}
        >
          <div 
            ref={containerRef} 
            className="h-full flex items-center"
            style={{ minWidth: '3000px' }} // 十分な幅を確保
          />
        </div>
      </div>
    </div>
  );
};

export default SheetMusicDisplay;