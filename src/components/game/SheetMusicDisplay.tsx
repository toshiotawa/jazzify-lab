import React, { useEffect, useRef, useState, useCallback } from 'react';
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay';
import { useGameSelector } from '@/stores/helpers';
import { cn } from '@/utils/cn';
import { simplifyMusicXmlForDisplay, buildMeasureTimeMap, type MeasureTimeInfo } from '@/utils/musicXmlMapper';
import { log } from '@/utils/logger';

interface SheetMusicDisplayProps {
  className?: string;
}

interface TimeMappingEntry {
  timeMs: number;
  xPosition: number;
}

interface MeasureLayoutEntry {
  measureNumber: number;
  startX: number;
  width: number;
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
  const scaleFactorRef = useRef<number>(10); // デフォルトは以前のマジックナンバー
  
  // timeMappingはアニメーションループで使うため、useRefで状態の即時反映を保証
  const timeMappingRef = useRef<TimeMappingEntry[]>([]);
  const measureTimingRef = useRef<MeasureTimeInfo[]>([]);
  const measureLayoutRef = useRef<Map<number, MeasureLayoutEntry>>(new Map());
  const mappingCursorRef = useRef<number>(0);
  
  // 前回時刻の保持用（巻き戻し検出用）
  const prevTimeRef = useRef(0);
  
  // ホイールスクロール制御用
  const [isHovered, setIsHovered] = useState(false);
  
  const { currentTime, isPlaying, notes, musicXml, settings } = useGameSelector((s) => ({
    currentTime: s.currentTime,
    isPlaying: s.isPlaying,
    notes: s.notes,
    musicXml: s.musicXml,
    settings: s.settings, // 簡易表示設定を取得
  }));
  const shouldRenderSheet = settings.showSheetMusic;
  
  // const gameActions = useGameActions(); // 現在未使用

  const collectMeasureLayouts = useCallback((graphicSheet: any): Map<number, MeasureLayoutEntry> => {
    const layoutMap = new Map<number, MeasureLayoutEntry>();
    if (!graphicSheet) {
      return layoutMap;
    }

    const recordLayout = (measure: any) => {
      if (!measure) {
        return;
      }
      const measureNumber =
        measure?.MeasureNumber ??
        measure?.parentSourceMeasure?.MeasureNumber ??
        measure?.ParentSourceMeasure?.MeasureNumber;
      if (typeof measureNumber !== 'number' || layoutMap.has(measureNumber)) {
        return;
      }
      const absoluteX =
        measure?.PositionAndShape?.AbsolutePosition?.x ??
        measure?.BoundingBox?.AbsolutePosition?.x;
      const width =
        measure?.PositionAndShape?.Size?.width ??
        measure?.BoundingBox?.Size?.width;
      if (typeof absoluteX !== 'number' || typeof width !== 'number') {
        return;
      }
      layoutMap.set(measureNumber, {
        measureNumber,
        startX: absoluteX * scaleFactorRef.current,
        width: width * scaleFactorRef.current
      });
    };

    const primaryStaffMeasures = Array.isArray(graphicSheet?.MeasureList?.[0])
      ? graphicSheet.MeasureList[0]
      : null;

    if (Array.isArray(primaryStaffMeasures) && primaryStaffMeasures.length > 0) {
      primaryStaffMeasures.forEach(recordLayout);
      return layoutMap;
    }

    const pages = graphicSheet?.MusicPages ?? [];
    for (const page of pages) {
      for (const system of page?.MusicSystems ?? []) {
        for (const staffLine of system?.StaffLines ?? []) {
          for (const measure of staffLine?.Measures ?? []) {
            recordLayout(measure);
          }
        }
      }
    }

    return layoutMap;
  }, []);

  const buildLegacyTimeMapping = useCallback((graphicSheet: any): TimeMappingEntry[] => {
    if (!graphicSheet || !notes || notes.length === 0) {
      log.warn('タイムマップ構築スキップ: OSMDグラフィックまたはノートが不足しています');
      return [];
    }

    const playableNotes: any[] = [];
    let firstBeatX: number | null = null;
    let noteIndex = 0;

    const pages = graphicSheet?.MusicPages ?? [];
    for (const page of pages) {
      for (const system of page?.MusicSystems ?? []) {
        for (const staffLine of system?.StaffLines ?? []) {
          for (const measure of staffLine?.Measures ?? []) {
            for (const staffEntry of measure?.staffEntries ?? []) {
              const sePos = (staffEntry as any)?.PositionAndShape?.AbsolutePosition?.x;
              if (typeof sePos === 'number') {
                if (firstBeatX === null || sePos < firstBeatX) {
                  firstBeatX = sePos;
                }
              }

              for (const voice of staffEntry?.graphicalVoiceEntries ?? []) {
                for (const graphicNote of voice?.notes ?? []) {
                  if (!graphicNote?.sourceNote || (graphicNote.sourceNote as any).isRest?.()) {
                    continue;
                  }
                  if (graphicNote.sourceNote.NoteTie && !graphicNote.sourceNote.NoteTie.StartNote) {
                    continue;
                  }
                  playableNotes.push(graphicNote);
                }
              }
            }
          }
        }
      }
    }

    const mapping: TimeMappingEntry[] = [];
    const timingAdjustmentSec = (settings.timingAdjustment ?? 0) / 1000;

    for (const graphicNote of playableNotes) {
      if (noteIndex >= notes.length) {
        break;
      }
      const note = notes[noteIndex];
      const positionAndShape = graphicNote.PositionAndShape as any;
      const noteHeadX = positionAndShape?.AbsolutePosition?.x;
      if (typeof noteHeadX !== 'number') {
        noteIndex++;
        continue;
      }
      let centerX = noteHeadX;
      if (positionAndShape?.BoundingBox?.width !== undefined) {
        centerX += positionAndShape.BoundingBox.width / 2;
      }
      mapping.push({
        timeMs: (note.time + timingAdjustmentSec) * 1000,
        xPosition: centerX * scaleFactorRef.current
      });
      noteIndex++;
    }

    if (firstBeatX !== null) {
      mapping.unshift({
        timeMs: 0,
        xPosition: firstBeatX * scaleFactorRef.current
      });
    }

    if (playableNotes.length !== notes.length) {
      log.warn(`ノート数の不一致: OSMD(${playableNotes.length}) vs JSON(${notes.length})。フォールバックマッピングを使用します。`);
    }

    log.info(`📊 Legacy OSMDマッピング生成: OSMD=${playableNotes.length}, JSON=${notes.length}, Mapping=${mapping.length}`);
    return mapping;
  }, [notes, settings.timingAdjustment]);
  
  // OSMDの初期化とレンダリング
  const createTimeMapping = useCallback(() => {
    if (!osmdRef.current || !notes || notes.length === 0) {
      log.warn('タイムマッピング作成スキップ: OSMD未初期化またはノートデータなし');
      timeMappingRef.current = [];
      measureTimingRef.current = [];
      measureLayoutRef.current = new Map();
      mappingCursorRef.current = 0;
      lastRenderedIndexRef.current = -1;
      lastScrollXRef.current = 0;
      return;
    }

    const graphicSheet = osmdRef.current.GraphicSheet;
    measureLayoutRef.current = collectMeasureLayouts(graphicSheet);

    if (musicXml) {
      try {
        const parsedDoc = new DOMParser().parseFromString(musicXml, 'application/xml');
        const parseError = parsedDoc.querySelector('parsererror');
        if (parseError) {
          log.warn(`MusicXML解析エラー: ${parseError.textContent}`);
          measureTimingRef.current = [];
        } else {
          const measureTimings = buildMeasureTimeMap(parsedDoc, notes);
          measureTimingRef.current = measureTimings;
          log.info(`📐 小節タイムマップ生成: ${measureTimings.length}件`);
        }
      } catch (error) {
        log.error('MusicXML解析に失敗しました:', error);
        measureTimingRef.current = [];
      }
    } else {
      measureTimingRef.current = [];
    }

    const fallbackMapping = buildLegacyTimeMapping(graphicSheet);
    timeMappingRef.current = fallbackMapping;
    mappingCursorRef.current = 0;
    lastRenderedIndexRef.current = -1;
    lastScrollXRef.current = 0;

    log.info(`🧭 タイムマップ更新: measures=${measureTimingRef.current.length}, layouts=${measureLayoutRef.current.size}, fallbackNotes=${fallbackMapping.length}`);
  }, [buildLegacyTimeMapping, collectMeasureLayouts, musicXml, notes]);

  const loadAndRenderSheet = useCallback(async () => {
      if (!shouldRenderSheet) {
        if (osmdRef.current) {
          osmdRef.current.clear();
        }
        timeMappingRef.current = [];
        measureTimingRef.current = [];
        measureLayoutRef.current = new Map();
        mappingCursorRef.current = 0;
        lastRenderedIndexRef.current = -1;
        lastScrollXRef.current = 0;
        return;
      }

      if (!containerRef.current || !musicXml) {
        // musicXmlがない場合はクリア
        if (osmdRef.current) {
          osmdRef.current.clear();
        }
        timeMappingRef.current = [];
        measureTimingRef.current = [];
        measureLayoutRef.current = new Map();
        mappingCursorRef.current = 0;
        lastRenderedIndexRef.current = -1;
        lastScrollXRef.current = 0;
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
        const renderSurface = containerRef.current.querySelector('svg, canvas');
        const boundingBox = (osmdRef.current.GraphicSheet as any).BoundingBox;

        if (renderSurface && boundingBox && boundingBox.width > 0) {
          // SVG/Canvas いずれのバックエンドでも実際の描画幅を取得
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
            log.info(`✅ OSMD scale factor calculated: ${scaleFactorRef.current} (Rendered: ${renderedWidth}px, BBox: ${osmdWidth})`);
          } else {
            log.warn('⚠️ Could not determine rendered width, falling back to default 10.');
            scaleFactorRef.current = 10;
          }
        } else {
          log.warn('⚠️ Could not calculate OSMD scale factor, falling back to default 10.');
          scaleFactorRef.current = 10;
        }
      
          // タイムマッピングを作成
            createTimeMapping();
          lastRenderedIndexRef.current = -1;
          lastScrollXRef.current = 0;
      
      log.info(`✅ OSMD initialized and rendered successfully - transpose reflected`);
      
    } catch (err) {
      log.error('楽譜の読み込みまたはレンダリングエラー:', err);
      setError(err instanceof Error ? err.message : '楽譜の処理中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
      }, [
        shouldRenderSheet,
      musicXml,
      settings.simpleDisplayMode,
      settings.noteNameStyle,
      settings.sheetMusicChordsOnly,
        settings.transpose,
        createTimeMapping
    ]); // 簡易表示設定とトランスポーズを依存関係に追加

    useEffect(() => {
      if (!shouldRenderSheet) {
        return;
      }
      createTimeMapping();
    }, [createTimeMapping, shouldRenderSheet]);

  // musicXmlが変更されたら楽譜を再読み込み・再レンダリング
  useEffect(() => {
    loadAndRenderSheet();
  }, [loadAndRenderSheet]);

  useEffect(() => {
    if (!shouldRenderSheet && osmdRef.current) {
      osmdRef.current.clear();
      timeMappingRef.current = [];
        measureTimingRef.current = [];
        measureLayoutRef.current = new Map();
      mappingCursorRef.current = 0;
        lastRenderedIndexRef.current = -1;
        lastScrollXRef.current = 0;
    }
  }, [shouldRenderSheet]);

  // 再生状態に応じてtransform/scrollLeft方式を切り替え
  useEffect(() => {
    if (!shouldRenderSheet) {
      return;
    }
    const wrapper = scoreWrapperRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (!wrapper || !scrollContainer) {
      return;
    }
    if (isPlaying) {
      scrollContainer.scrollLeft = 0;
      wrapper.style.transform = `translateX(-${lastScrollXRef.current}px)`;
    } else {
      wrapper.style.transform = 'translateX(0px)';
      scrollContainer.scrollLeft = lastScrollXRef.current;
    }
  }, [isPlaying, shouldRenderSheet]);

  // 音符の時刻とX座標のマッピングを作成
    // 注: 以下のコードは transform 方式のスクロールでは効果が薄く、意図しないジャンプの原因になるためコメントアウト
    // useEffect(() => {
    //   if (isPlaying && scrollContainerRef.current) {
    //     scrollContainerRef.current.scrollLeft = 0;
    //     log.info('🎵 楽譜スクロールを開始位置にリセット');
    //   }
    // }, [isPlaying]);

    // currentTimeが変更されるたびにスクロール位置を更新
    useEffect(() => {
      if (!shouldRenderSheet || !scoreWrapperRef.current) {
        prevTimeRef.current = currentTime;
        return;
      }

      const playheadPosition = 120;
      const timingAdjustmentSec = (settings.timingAdjustment ?? 0) / 1000;
      const adjustedTime = currentTime - timingAdjustmentSec;

      const measureEntries = measureTimingRef.current;
      const layoutMap = measureLayoutRef.current;

      const locateMeasureIndex = (timeSec: number, entries: MeasureTimeInfo[]): number => {
        if (entries.length === 0) {
          return -1;
        }
        let low = 0;
        let high = entries.length - 1;
        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          const entry = entries[mid];
          const start = entry.startTime;
          const end = entry.startTime + entry.duration;
          if (timeSec < start) {
            high = mid - 1;
          } else if (timeSec >= end) {
            low = mid + 1;
          } else {
            return mid;
          }
        }
        return Math.min(Math.max(high, 0), entries.length - 1);
      };

      let activeIndex = -1;
      let scrollX: number | null = null;

      if (measureEntries.length > 0 && layoutMap.size > 0) {
        const measureIndex = locateMeasureIndex(adjustedTime, measureEntries);
        const measureInfo = measureIndex >= 0 ? measureEntries[measureIndex] : null;
        const layout = measureInfo ? layoutMap.get(measureInfo.measureNumber) : undefined;
        if (measureInfo && layout) {
          const relativeRaw = measureInfo.duration > 0 ? (adjustedTime - measureInfo.startTime) / measureInfo.duration : 0;
          const relative = Math.max(0, Math.min(1, Number.isFinite(relativeRaw) ? relativeRaw : 0));
          const absoluteX = layout.startX + layout.width * relative;
          scrollX = Math.max(0, absoluteX - playheadPosition);
          activeIndex = measureIndex;
        }
      }

      if (scrollX === null) {
        const mapping = timeMappingRef.current;
        if (mapping.length === 0) {
          prevTimeRef.current = currentTime;
          return;
        }
        const currentTimeMs = currentTime * 1000;
        const findActiveIndex = () => {
          let low = 0;
          let high = mapping.length - 1;
          while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            if (mapping[mid].timeMs <= currentTimeMs) {
              low = mid + 1;
            } else {
              high = mid - 1;
            }
          }
          return low - 1;
        };
        const rawIndex = findActiveIndex();
        activeIndex = Math.max(0, Math.min(rawIndex, mapping.length - 1));
        const targetEntry = mapping[activeIndex];
        if (!targetEntry) {
          prevTimeRef.current = currentTime;
          return;
        }
        scrollX = Math.max(0, targetEntry.xPosition - playheadPosition);
      }

      if (scrollX === null) {
        prevTimeRef.current = currentTime;
        return;
      }

      mappingCursorRef.current = activeIndex;

      const needsIndexUpdate = activeIndex !== lastRenderedIndexRef.current;
      const needsScrollUpdate = Math.abs(scrollX - lastScrollXRef.current) > 0.5;

      const prev = prevTimeRef.current;
      const seekingBack = currentTime < prev - 0.1;
      const forceAtZero = currentTime < 0.02;

      const wrapper = scoreWrapperRef.current;
      const scrollContainer = scrollContainerRef.current;

      if (needsIndexUpdate || seekingBack || forceAtZero || (!isPlaying && needsScrollUpdate)) {
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
          if (Math.abs(scrollContainer.scrollLeft - scrollX) > 0.5) {
            scrollContainer.scrollLeft = scrollX;
          }
        }
        lastRenderedIndexRef.current = activeIndex;
        lastScrollXRef.current = scrollX;
      }

      prevTimeRef.current = currentTime;
    }, [currentTime, isPlaying, notes, shouldRenderSheet, settings.timingAdjustment]);

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
      };
    }, []);

    if (!shouldRenderSheet) {
      return (
        <div
          className={cn(
            'flex items-center justify-center bg-slate-900 text-gray-400',
            className
          )}
          aria-label="楽譜表示オフ"
        >
          楽譜表示はオフになっています
        </div>
      );
    }

  return (
    <div className={cn('relative', className)}>
      {/* プレイヘッド（赤い縦線） - スクロール位置に影響されないよう外側へ配置 */}
      <div 
        className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
        style={{ left: '120px' }}
        aria-hidden="true"
      />
      <div 
        className={cn(
          "h-full bg-white text-black",
          // 再生中は横スクロール無効、停止中は横スクロール有効
          isPlaying ? "overflow-hidden" : "overflow-x-auto overflow-y-hidden",
          // カスタムスクロールバースタイルを適用
          "custom-sheet-scrollbar"
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
                // 停止中は手動スクロール時の移動を滑らかにする
                !isPlaying ? "transition-transform duration-100 ease-out" : ""
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
        </div>
      </div>
  );
};

export default SheetMusicDisplay;
