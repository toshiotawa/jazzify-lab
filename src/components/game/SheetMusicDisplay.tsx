import React, { useEffect, useRef, useState, useCallback } from 'react';
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay';
import { useGameSelector, useGameActions } from '@/stores/helpers';
import platform from '@/platform';
import { useGameStore } from '@/stores/gameStore';
import { cn } from '@/utils/cn';

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
  const scaleFactorRef = useRef<number>(10); // デフォルトは以前のマジックナンバー
  
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
      
      // レンダリング後に正確なスケールファクターを計算
      const svgElement = containerRef.current.querySelector('svg');
      const boundingBox = (osmdRef.current.GraphicSheet as any).BoundingBox;

      if (svgElement && boundingBox && boundingBox.width > 0) {
        // レンダリングされたSVGの実際のピクセル幅とOSMDの内部的な幅からスケールを算出
        const svgWidth = svgElement.width.baseVal.value;
        const osmdWidth = boundingBox.width;
        scaleFactorRef.current = svgWidth / osmdWidth;
        console.log(`✅ OSMD scale factor calculated: ${scaleFactorRef.current} (SVG: ${svgWidth}px, BBox: ${osmdWidth})`);
      } else {
        console.warn('⚠️ Could not calculate OSMD scale factor, falling back to default 10.');
        scaleFactorRef.current = 10;
      }
      
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
                    // 音符の中心X座標を計算
                    const positionAndShape = graphicNote.PositionAndShape as any;
                    const noteHeadX = positionAndShape?.AbsolutePosition?.x;

                    if (noteHeadX !== undefined) {
                      let centerX = noteHeadX;
                      // BoundingBox が存在し、widthが定義されている場合のみ幅を考慮して中心を計算
                      if (positionAndShape?.BoundingBox?.width !== undefined) {
                        const noteHeadWidth = positionAndShape.BoundingBox.width;
                        centerX += noteHeadWidth / 2;
                      }

                      mapping.push({
                        timeMs: note.time * 1000, // 秒をミリ秒に変換
                        // 動的に計算したスケール係数を使用
                        xPosition: centerX * scaleFactorRef.current
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

  // isPlaying状態がfalseになったときにアニメーションフレームをキャンセルする副作用
  useEffect(() => {
    if (!isPlaying && animationFrameRef.current) {
      platform.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [isPlaying]);

  // currentTimeが変更されるたびにスクロール位置を更新
  // これが唯一のUI更新トリガーとなり、古いループを置き換える
  useEffect(() => {
    if (isPlaying && scoreWrapperRef.current) {
      const mapping = timeMappingRef.current;
      if (mapping.length === 0) return;

      const currentTimeMs = currentTime * 1000;
      let targetX = 0;

      // 1. 現在の再生時間の直後にあるノートのエントリを探す
      const nextEntryIndex = mapping.findIndex(entry => entry.timeMs > currentTimeMs);

      if (nextEntryIndex === -1) {
        // 2. 最後のノートを過ぎた場合：最後のノート位置に固定
        targetX = mapping.length > 0 ? mapping[mapping.length - 1].xPosition : 0;
      } else if (nextEntryIndex === 0) {
        // 3. 最初のノートより前の場合：曲の開始(x=0)から最初のノートまでを補間
        const nextEntry = mapping[0];
        if (nextEntry.timeMs > 0) {
          const progress = currentTimeMs / nextEntry.timeMs;
          targetX = nextEntry.xPosition * progress;
        } else {
          targetX = 0; // 最初のノートが時刻0なら位置も0
        }
      } else {
        // 4. 2つのノートの間の場合：線形補間
        const prevEntry = mapping[nextEntryIndex - 1];
        const nextEntry = mapping[nextEntryIndex];
        
        const segmentDuration = nextEntry.timeMs - prevEntry.timeMs;
        const timeIntoSegment = currentTimeMs - prevEntry.timeMs;
        const progress = segmentDuration > 0 ? timeIntoSegment / segmentDuration : 0;
        
        targetX = prevEntry.xPosition + (nextEntry.xPosition - prevEntry.xPosition) * progress;
      }
      
      const playheadPosition = 100; // プレイヘッドの画面上のX座標 (px)
      const scrollX = Math.max(0, targetX - playheadPosition);
      
      scoreWrapperRef.current.style.transform = `translateX(-${scrollX}px)`;
    }
    // notesの変更はtimeMappingRefの更新をトリガーするが、このeffectの再実行は不要な場合がある。
    // しかし、マッピングが更新された直後のフレームで正しい位置に描画するために含めておく。
  }, [currentTime, isPlaying, notes]); 

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