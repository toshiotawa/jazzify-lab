import React, { useEffect, useRef, useState, useCallback } from 'react';
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay';
import { useGameSelector, useGameActions } from '@/stores/helpers';
import platform from '@/platform';
import { useGameStore } from '@/stores/gameStore';
import { cn } from '@/utils/cn';
import { simplifyMusicXmlForDisplay } from '@/utils/musicXmlMapper';
import { log } from '@/utils/logger';

interface SheetMusicDisplayProps {
  className?: string;
}

interface TimeMappingEntry {
  timeMs: number;
  xPosition: number;
}

interface MeasureMappingEntry {
  measure: number;
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scaleFactorRef = useRef<number>(10); // デフォルトは以前のマジックナンバー
  
  // timeMappingはアニメーションループで使うため、useRefで状態の即時反映を保証
  const timeMappingRef = useRef<TimeMappingEntry[]>([]);
  const measureMappingRef = useRef<MeasureMappingEntry[]>([]);
  const currentMeasureRef = useRef<number | null>(null);
  
  // ホイールスクロール制御用
  const [isHovered, setIsHovered] = useState(false);
  
  const { currentTime, isPlaying, notes, musicXml, settings } = useGameSelector((s) => ({
    currentTime: s.currentTime,
    isPlaying: s.isPlaying,
    notes: s.notes,
    musicXml: s.musicXml,
    settings: s.settings, // 簡易表示設定を取得
  }));
  
  // const gameActions = useGameActions(); // 現在未使用
  
  // OSMDの初期化とレンダリング
  const loadAndRenderSheet = useCallback(async () => {
    if (!containerRef.current || !musicXml) {
      // musicXmlがない場合はクリア
      if (osmdRef.current) {
        osmdRef.current.clear();
      }
      timeMappingRef.current = [];
        measureMappingRef.current = [];
        currentMeasureRef.current = null;
      setError(musicXml === '' ? '楽譜データがありません' : null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 既存のOSMDインスタンスをクリア（移調時の即時反映のため）
      if (osmdRef.current) {
        osmdRef.current.clear();
      }
      
      // 🎯 簡易表示設定に基づいてMusicXMLを前処理
      const processedMusicXml = simplifyMusicXmlForDisplay(musicXml, {
        simpleDisplayMode: settings.simpleDisplayMode,
        noteNameStyle: settings.noteNameStyle,
        chordsOnly: settings.sheetMusicChordsOnly
      });
      
      log.info(`🎼 OSMD簡易表示: ${settings.simpleDisplayMode ? 'ON' : 'OFF'}, 音名スタイル: ${settings.noteNameStyle}`);
      
      // OSMDインスタンスを毎回新規作成（移調時の確実な反映のため）
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
      
      // 前処理されたMusicXMLを使用
      await osmdRef.current.load(processedMusicXml);
      osmdRef.current.render();

      if (settings.sheetMusicChordsOnly) {
        const noteEls = containerRef.current.querySelectorAll('[class*=notehead], [class*=rest], [class*=stem]');
        noteEls.forEach(el => {
          (el as HTMLElement).style.display = 'none';
        });
      }
      
      // レンダリング後に正確なスケールファクターを計算
      const svgElement = containerRef.current.querySelector('svg');
      const boundingBox = (osmdRef.current.GraphicSheet as any).BoundingBox;

      if (svgElement && boundingBox && boundingBox.width > 0) {
        // レンダリングされたSVGの実際のピクセル幅とOSMDの内部的な幅からスケールを算出
        const svgWidth = svgElement.width.baseVal.value;
        const osmdWidth = boundingBox.width;
        scaleFactorRef.current = svgWidth / osmdWidth;
        log.info(`✅ OSMD scale factor calculated: ${scaleFactorRef.current} (SVG: ${svgWidth}px, BBox: ${osmdWidth})`);
      } else {
        log.warn('⚠️ Could not calculate OSMD scale factor, falling back to default 10.');
        scaleFactorRef.current = 10;
      }
      
      // タイムマッピングを作成
      createTimeMapping();
        currentMeasureRef.current = null;
      
      log.info(`✅ OSMD initialized and rendered successfully - transpose reflected`);
      
    } catch (err) {
      log.error('楽譜の読み込みまたはレンダリングエラー:', err);
      setError(err instanceof Error ? err.message : '楽譜の処理中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [
    musicXml,
    notes,
    settings.simpleDisplayMode,
    settings.noteNameStyle,
    settings.sheetMusicChordsOnly,
    settings.transpose
  ]); // 簡易表示設定とトランスポーズを依存関係に追加

  // musicXmlが変更されたら楽譜を再読み込み・再レンダリング
  useEffect(() => {
    loadAndRenderSheet();
  }, [loadAndRenderSheet]);

  // 音符の時刻とX座標のマッピングを作成
  const createTimeMapping = useCallback(() => {
    if (!osmdRef.current || !notes || notes.length === 0) {
      log.warn('タイムマッピング作成スキップ: OSMD未初期化またはノートデータなし');
      return;
    }

    const mapping: TimeMappingEntry[] = [];
    const measureMapping: MeasureMappingEntry[] = [];
    const graphicSheet = osmdRef.current.GraphicSheet;
    
    if (!graphicSheet || !graphicSheet.MusicPages || graphicSheet.MusicPages.length === 0) {
      log.warn('楽譜のグラフィック情報が取得できません');
      return;
    }

    let noteIndex = 0;
    let osmdPlayableNoteCount = 0;
    let lastMeasureNumber: number | null = null;
    
    log.info(`📊 OSMD Note Extraction Starting: ${notes.length} JSON notes to match`);
    
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

                    const xPosition = centerX * scaleFactorRef.current;
                    mapping.push({
                      timeMs: note.time * 1000, // 秒をミリ秒に変換
                      xPosition
                    });

                    const parentMeasure = (graphicNote as any).ParentMeasure ?? (graphicNote as any).parentMeasure ?? (graphicNote.sourceNote as any)?.ParentMeasure ?? (graphicNote.sourceNote as any)?.parentMeasure;
                    const measureNumber = parentMeasure?.measureNumber ?? parentMeasure?.MeasureNumber ?? null;
                    if (measureNumber !== null && measureNumber !== undefined && measureNumber !== lastMeasureNumber) {
                      const measurePos = parentMeasure?.PositionAndShape?.AbsolutePosition?.x ?? parentMeasure?.positionAndShape?.AbsolutePosition?.x;
                      const measureX = (measurePos !== undefined ? measurePos : centerX) * scaleFactorRef.current;
                      measureMapping.push({
                        measure: measureNumber,
                        timeMs: note.time * 1000,
                        xPosition: measureX
                      });
                      lastMeasureNumber = measureNumber;
                    }
                    }
                    noteIndex++;
      }
    }
    
    log.info(`📊 OSMD Note Extraction Summary:
    OSMD playable notes: ${osmdPlayableNoteCount}
    JSON notes count: ${notes.length}
    Mapped notes: ${mapping.length}
    Match status: ${osmdPlayableNoteCount === notes.length ? '✅ Perfect match!' : '❌ Mismatch!'}`);
    
    if (osmdPlayableNoteCount !== notes.length) {
      log.error(`ノート数の不一致: OSMD(${osmdPlayableNoteCount}) vs JSON(${notes.length}). プレイヘッドがずれる可能性があります。`);
    }
    
    timeMappingRef.current = mapping; // refを更新
    measureMappingRef.current = measureMapping;
  }, [notes]);

  // isPlaying状態がfalseになったときにアニメーションフレームをキャンセルする副作用
  useEffect(() => {
    if (!isPlaying && animationFrameRef.current) {
      platform.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [isPlaying]);

  // 再生開始時に楽譜スクロールを強制的に左側にジャンプ
  useEffect(() => {
    if (isPlaying && scrollContainerRef.current) {
      // 再生開始時に即座にスクロール位置を0にリセット
      scrollContainerRef.current.scrollLeft = 0;
      log.info('🎵 楽譜スクロールを開始位置にリセット');
    }
  }, [isPlaying]);

  // currentTimeが変更されるたびにスクロール位置を更新
  // 停止時・再生時に関わらず、プレイヘッドの位置を更新
  useEffect(() => {
    if (scoreWrapperRef.current) {
      const measureMapping = measureMappingRef.current;
      const mapping = timeMappingRef.current;
      const currentTimeMs = currentTime * 1000;
      const playheadPosition = 120;

      if (measureMapping.length > 0) {
        let targetEntry = measureMapping[0];
        for (let i = 0; i < measureMapping.length; i++) {
          if (measureMapping[i].timeMs <= currentTimeMs) {
            targetEntry = measureMapping[i];
          } else {
            break;
          }
        }

        if (currentMeasureRef.current === targetEntry.measure && isPlaying) {
          return;
        }
        currentMeasureRef.current = targetEntry.measure;

        const scrollX = Math.max(0, targetEntry.xPosition - playheadPosition);
        if (isPlaying) {
          scoreWrapperRef.current.style.transition = 'transform 0.2s ease-out';
          scoreWrapperRef.current.style.transform = `translateX(-${scrollX}px)`;
        } else {
          scoreWrapperRef.current.style.transition = 'none';
          scoreWrapperRef.current.style.transform = `translateX(-${scrollX}px)`;
          requestAnimationFrame(() => {
            if (scoreWrapperRef.current) {
              scoreWrapperRef.current.style.transition = '';
            }
          });
        }
        return;
      }

      if (mapping.length === 0) return;

      let targetX = 0;
      const nextEntryIndex = mapping.findIndex(entry => entry.timeMs > currentTimeMs);

      if (nextEntryIndex === -1) {
        targetX = mapping.length > 0 ? mapping[mapping.length - 1].xPosition : 0;
      } else if (nextEntryIndex === 0) {
        const nextEntry = mapping[0];
        if (nextEntry.timeMs > 0) {
          const progress = currentTimeMs / nextEntry.timeMs;
          targetX = nextEntry.xPosition * progress;
        } else {
          targetX = 0;
        }
      } else {
        const prevEntry = mapping[nextEntryIndex - 1];
        const nextEntry = mapping[nextEntryIndex];
        const segmentDuration = nextEntry.timeMs - prevEntry.timeMs;
        const timeIntoSegment = currentTimeMs - prevEntry.timeMs;
        const progress = segmentDuration > 0 ? timeIntoSegment / segmentDuration : 0;
        targetX = prevEntry.xPosition + (nextEntry.xPosition - prevEntry.xPosition) * progress;
      }

      const scrollX = isPlaying
        ? Math.max(0, targetX - playheadPosition)
        : targetX - playheadPosition;

      if (isPlaying) {
        scoreWrapperRef.current.style.transform = `translateX(-${scrollX}px)`;
      } else {
        scoreWrapperRef.current.style.transition = 'none';
        scoreWrapperRef.current.style.transform = `translateX(-${scrollX}px)`;
        requestAnimationFrame(() => {
          if (scoreWrapperRef.current) {
            scoreWrapperRef.current.style.transition = '';
          }
        });
      }
    }
    // notesの変更はtimeMappingRefの更新をトリガーするが、このeffectの再実行は不要な場合がある。
    // しかし、マッピングが更新された直後のフレームで正しい位置に描画するために含めておく。
  }, [currentTime, isPlaying, notes]);

  // ホイールスクロール制御
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // 楽譜エリアにマウスがホバーしていない、または再生中の場合はスクロールを無効化
      if (!isHovered || isPlaying) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
      
      return () => {
        scrollContainer.removeEventListener('wheel', handleWheel);
      };
    }
  }, [isHovered, isPlaying]);

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
    <div 
      className={cn(
        "relative bg-white text-black",
        // 再生中は横スクロール無効、停止中は横スクロール有効
        isPlaying ? "overflow-hidden" : "overflow-x-auto overflow-y-hidden",
        // カスタムスクロールバースタイルを適用
        "custom-sheet-scrollbar",
        className
      )}
      ref={scrollContainerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        // WebKit系ブラウザ用のカスタムスクロールバー
        ...(!isPlaying && {
          '--scrollbar-width': '8px',
          '--scrollbar-track-color': '#f3f4f6',
          '--scrollbar-thumb-color': '#9ca3af',
          '--scrollbar-thumb-hover-color': '#6b7280'
        })
      } as React.CSSProperties}
    >
      {/* プレイヘッド（赤い縦線） */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
        style={{ left: '120px' }}
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
          className={cn(
            "h-full",
            // 再生中は自動スクロールでアニメーション、停止中は手動スクロール用
            isPlaying ? "transition-transform duration-100 ease-out" : ""
          )}
          style={{ 
            willChange: isPlaying ? 'transform' : 'auto',
            minWidth: '3000px' // 十分な幅を確保
          }}
        >
          <div 
            ref={containerRef} 
            className="h-full flex items-center"
          />
        </div>
      </div>
      
      {/* カスタムスクロールバー用のスタイル - CSS外部化により削除 */}
    </div>
  );
};

export default SheetMusicDisplay;
