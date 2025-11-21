import React, { useEffect, useRef, useState, useCallback } from 'react';
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay';
import { useGameSelector } from '@/stores/helpers';
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

/**
 * 楽譜表示コンポーネント
 * OSMDを使用して横スクロール形式の楽譜を表示
 */
const SheetMusicDisplay: React.FC<SheetMusicDisplayProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scoreWrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const lastRenderedIndexRef = useRef<number>(-1);
  const lastScrollXRef = useRef(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scaleFactorRef = useRef<number>(10);
  
  const timeMappingRef = useRef<TimeMappingEntry[]>([]);
  const mappingCursorRef = useRef<number>(0);
  const prevTimeRef = useRef(0);
  
  const [isHovered, setIsHovered] = useState(false);
  
  const { currentTime, isPlaying, notes, musicXml, settings, abRepeat, mode } = useGameSelector((s) => ({
    currentTime: s.currentTime,
    isPlaying: s.isPlaying,
    notes: s.notes,
    musicXml: s.musicXml,
    settings: s.settings,
    abRepeat: s.abRepeat,
    mode: s.mode
  }));
  
  const shouldRenderSheet = settings.showSheetMusic;
  const isPracticeMode = mode === 'practice';

  // 指定された時間に対応するX座標を取得するヘルパー関数
  const getXPositionForTime = useCallback((targetTime: number): number | null => {
    const mapping = timeMappingRef.current;
    if (mapping.length === 0) return null;

    const targetTimeMs = targetTime * 1000;

    // マッピングの範囲外（開始前）
    if (targetTimeMs <= mapping[0].timeMs) {
      return mapping[0].xPosition;
    }

    // マッピングの範囲外（終了後）
    const lastEntry = mapping[mapping.length - 1];
    if (targetTimeMs >= lastEntry.timeMs) {
      // 最後の2点間の速度を使って外挿するか、最後の点に固定するか。
      // ここでは簡易的に、最後のノート以降も一定の幅があると仮定して返す（または最後の位置）
      // OSMDの描画幅がわかればそこまでスクロールさせたい
      return lastEntry.xPosition + (targetTimeMs - lastEntry.timeMs) * 0.1; // 簡易的な外挿
    }

    // 二分探索で直前のインデックスを探す
    let low = 0;
    let high = mapping.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (mapping[mid].timeMs <= targetTimeMs) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    
    const indexPrev = Math.max(0, low - 1);
    const indexNext = Math.min(mapping.length - 1, indexPrev + 1);

    const prev = mapping[indexPrev];
    const next = mapping[indexNext];

    if (prev.timeMs === next.timeMs) return prev.xPosition;

    // 線形補間
    const ratio = (targetTimeMs - prev.timeMs) / (next.timeMs - prev.timeMs);
    return prev.xPosition + (next.xPosition - prev.xPosition) * ratio;
  }, []);

  // タイムマッピング作成
  const createTimeMapping = useCallback(() => {
    if (!osmdRef.current || !notes || notes.length === 0) {
      return;
    }

    const mapping: TimeMappingEntry[] = [];
    const graphicSheet = osmdRef.current.GraphicSheet;
    
    if (!graphicSheet || !graphicSheet.MusicPages || graphicSheet.MusicPages.length === 0) {
      return;
    }

    let noteIndex = 0;
    const osmdPlayableNotes = [];
    let firstBeatX: number | null = null;
    
    for (const page of graphicSheet.MusicPages) {
      for (const system of page.MusicSystems) {
        for (const staffLine of system.StaffLines) {
          for (const measure of staffLine.Measures) {
            for (const staffEntry of measure.staffEntries) {
              const sePos = (staffEntry as any)?.PositionAndShape?.AbsolutePosition?.x;
              if (typeof sePos === 'number') {
                if (firstBeatX === null || sePos < firstBeatX) {
                  firstBeatX = sePos;
                }
              }
              for (const voice of staffEntry.graphicalVoiceEntries) {
                for (const graphicNote of voice.notes) {
                  if (!graphicNote.sourceNote || (graphicNote.sourceNote as any).isRest?.()) {
                    continue;
                  }
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
    
    const timingAdjustmentSec = (settings.timingAdjustment ?? 0) / 1000;
    for (const graphicNote of osmdPlayableNotes) {
      if (noteIndex < notes.length) {
        const note = notes[noteIndex];
        const positionAndShape = graphicNote.PositionAndShape as any;
        const noteHeadX = positionAndShape?.AbsolutePosition?.x;

        if (noteHeadX !== undefined) {
          let centerX = noteHeadX;
          if (positionAndShape?.BoundingBox?.width !== undefined) {
            const noteHeadWidth = positionAndShape.BoundingBox.width;
            centerX += noteHeadWidth / 2;
          }

          mapping.push({
            timeMs: (note.time + timingAdjustmentSec) * 1000,
            xPosition: centerX * scaleFactorRef.current
          });
        }
        noteIndex++;
      }
    }
    
    if (firstBeatX !== null) {
      mapping.unshift({
        timeMs: 0,
        xPosition: firstBeatX * scaleFactorRef.current
      });
    }
    
    timeMappingRef.current = mapping;
    mappingCursorRef.current = 0;
    lastRenderedIndexRef.current = -1;
    lastScrollXRef.current = 0;
  }, [notes, settings.timingAdjustment]);

  const loadAndRenderSheet = useCallback(async () => {
    if (!shouldRenderSheet) {
      if (osmdRef.current) osmdRef.current.clear();
      timeMappingRef.current = [];
      return;
    }

    if (!containerRef.current || !musicXml) {
      if (osmdRef.current) osmdRef.current.clear();
      timeMappingRef.current = [];
      setError(musicXml === '' ? '楽譜データがありません' : null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (osmdRef.current) osmdRef.current.clear();
      
      const processedMusicXml = simplifyMusicXmlForDisplay(musicXml, {
        simpleDisplayMode: settings.simpleDisplayMode,
        noteNameStyle: settings.noteNameStyle,
        chordsOnly: settings.sheetMusicChordsOnly
      });
      
      const options: IOSMDOptions = {
        autoResize: true,
        backend: 'canvas',
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
      await osmdRef.current.load(processedMusicXml);
      osmdRef.current.render();

      if (settings.sheetMusicChordsOnly) {
        const noteEls = containerRef.current.querySelectorAll('[class*=notehead], [class*=rest], [class*=stem]');
        noteEls.forEach(el => { (el as HTMLElement).style.display = 'none'; });
      }
      
      const renderSurface = containerRef.current.querySelector('svg, canvas');
      const boundingBox = (osmdRef.current.GraphicSheet as any).BoundingBox;

      if (renderSurface && boundingBox && boundingBox.width > 0) {
        const rectWidth = renderSurface.getBoundingClientRect().width;
        let renderedWidth = rectWidth;
        if (!renderedWidth && renderSurface instanceof SVGSVGElement) {
          renderedWidth = renderSurface.width.baseVal.value;
        } else if (!renderedWidth && renderSurface instanceof HTMLCanvasElement) {
          renderedWidth = renderSurface.width;
        }

        if (renderedWidth > 0) {
          const osmdWidth = boundingBox.width;
          scaleFactorRef.current = renderedWidth / osmdWidth;
        } else {
          scaleFactorRef.current = 10;
        }
      } else {
        scaleFactorRef.current = 10;
      }
      
      createTimeMapping();
      
    } catch (err) {
      log.error('楽譜の読み込みまたはレンダリングエラー:', err);
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [shouldRenderSheet, musicXml, settings.simpleDisplayMode, settings.noteNameStyle, settings.sheetMusicChordsOnly, settings.transpose, createTimeMapping]);

  useEffect(() => {
    if (shouldRenderSheet) createTimeMapping();
  }, [createTimeMapping, shouldRenderSheet]);

  useEffect(() => {
    loadAndRenderSheet();
  }, [loadAndRenderSheet]);

  useEffect(() => {
    if (!shouldRenderSheet && osmdRef.current) {
      osmdRef.current.clear();
      timeMappingRef.current = [];
    }
  }, [shouldRenderSheet]);

  // スクロール位置の更新
  useEffect(() => {
    if (!shouldRenderSheet || !scoreWrapperRef.current) {
      prevTimeRef.current = currentTime;
      return;
    }

    // getXPositionForTime を使って現在位置を計算（マッピング外も考慮）
    const targetX = getXPositionForTime(currentTime);

    if (targetX !== null) {
      const playheadPosition = 120;
      const scrollX = Math.max(0, targetX - playheadPosition);
      
      // スクロール更新が必要か判定（前回位置との差分や、再生状態の変化など）
      const needsScrollUpdate = Math.abs(scrollX - lastScrollXRef.current) > 0.5;
      const seekingBack = currentTime < prevTimeRef.current - 0.1;
      const forceAtZero = currentTime < 0.02;

      if (needsScrollUpdate || seekingBack || forceAtZero || (!isPlaying && needsScrollUpdate)) {
        const wrapper = scoreWrapperRef.current;
        const scrollContainer = scrollContainerRef.current;
        
        if (isPlaying) {
          if (wrapper) {
            wrapper.style.transform = `translateX(-${scrollX}px)`;
          }
          if (scrollContainer && Math.abs(scrollContainer.scrollLeft) > 0.5) {
            scrollContainer.scrollLeft = 0;
          }
        } else if (scrollContainer) {
          if (wrapper) {
            wrapper.style.transform = 'translateX(0px)';
          }
          // 停止中は scrollLeft を直接操作
          if (Math.abs(scrollContainer.scrollLeft - scrollX) > 0.5) {
            scrollContainer.scrollLeft = scrollX;
          }
        }
        lastScrollXRef.current = scrollX;
      }
    }

    prevTimeRef.current = currentTime;
  }, [currentTime, isPlaying, shouldRenderSheet, getXPositionForTime]);

  // ホイールスクロール制御
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!isHovered || isPlaying) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
      return () => scrollContainer.removeEventListener('wheel', handleWheel);
    }
  }, [isHovered, isPlaying]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (osmdRef.current) osmdRef.current.clear();
    };
  }, []);

  // ABループ位置の計算
  const loopAX = abRepeat.startTime !== null ? getXPositionForTime(abRepeat.startTime) : null;
  const loopBX = abRepeat.endTime !== null ? getXPositionForTime(abRepeat.endTime) : null;

  if (!shouldRenderSheet) {
    return (
      <div className={cn('flex items-center justify-center bg-slate-900 text-gray-400', className)}>
        楽譜表示はオフになっています
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* プレイヘッド */}
      <div 
        className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
        style={{ left: '120px' }}
      />
      
      <div 
        className={cn(
          "h-full bg-white text-black",
          isPlaying ? "overflow-hidden" : "overflow-x-auto overflow-y-hidden",
          "custom-sheet-scrollbar"
        )}
        ref={scrollContainerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          ...(!isPlaying && {
            '--scrollbar-width': '8px',
            '--scrollbar-track-color': '#f3f4f6',
            '--scrollbar-thumb-color': '#9ca3af',
            '--scrollbar-thumb-hover-color': '#6b7280'
          })
        } as React.CSSProperties}
      >
        <div className="relative h-full pt-8 pb-4">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-20">
              <div className="text-black">楽譜を読み込み中...</div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-20">
              <div className="text-red-600">エラー: {error}</div>
            </div>
          )}
          
          <div 
            ref={scoreWrapperRef}
            className={cn("h-full", !isPlaying ? "transition-transform duration-100 ease-out" : "")}
            style={{ willChange: isPlaying ? 'transform' : 'auto', minWidth: '3000px' }}
          >
            {/* OSMDレンダリング領域 */}
            <div ref={containerRef} className="h-full flex items-center relative">
              {/* ABループマーカーのオーバーレイ表示 (OSMDの上に表示) */}
              {isPracticeMode && (loopAX !== null || loopBX !== null) && (
                <div className="absolute inset-0 pointer-events-none z-0">
                  {/* A地点 */}
                  {loopAX !== null && (
                    <div 
                      className="absolute top-0 bottom-0 border-l-2 border-green-400" 
                      style={{ left: `${loopAX}px` }}
                    >
                      <div className="absolute -top-4 -left-2 bg-green-400 text-white text-[10px] px-1 rounded">A</div>
                    </div>
                  )}
                  {/* B地点 */}
                  {loopBX !== null && (
                    <div 
                      className="absolute top-0 bottom-0 border-l-2 border-red-400" 
                      style={{ left: `${loopBX}px` }}
                    >
                      <div className="absolute -top-4 -left-2 bg-red-400 text-white text-[10px] px-1 rounded">B</div>
                    </div>
                  )}
                  {/* 範囲塗りつぶし */}
                  {loopAX !== null && loopBX !== null && (
                    <div 
                      className={`absolute top-0 bottom-0 ${abRepeat.enabled ? 'bg-green-200 opacity-30' : 'bg-gray-200 opacity-20'}`}
                      style={{ 
                        left: `${loopAX}px`, 
                        width: `${Math.max(0, loopBX - loopAX)}px` 
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SheetMusicDisplay;
