/**
 * ファンタジーモード用楽譜表示コンポーネント
 * OSMDを使用してMusicXMLを正確に表示
 * Progression_Timing用の横スクロール形式楽譜
 * 
 * 楽譜は渡されたmusicXmlをそのまま1回だけレンダリングする。
 * 移調が必要な場合は呼び出し側で移調済みのmusicXmlを渡す。
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay';
import { cn } from '@/utils/cn';
import { bgmManager } from '@/utils/BGMManager';
import { devLog } from '@/utils/logger';
import { stripLyricsFromMusicXml, convertToRhythmNotation, convertMeasuresToRests } from '@/utils/musicXmlMapper';

type MeasureRange = [number, number];

interface SheetPreloadSection {
  musicXml: string;
  bpm: number;
  timeSignature: number;
  listenBars?: MeasureRange;
  useRhythmNotation?: boolean;
}

interface FantasySheetMusicDisplayProps {
  width: number;
  height: number;
  musicXml: string;
  bpm: number;
  timeSignature: number;
  measureCount: number;
  countInMeasures?: number;
  disablePreview?: boolean;
  simpleMode?: boolean;
  nextMusicXml?: string;
  nextBpm?: number;
  nextTimeSignature?: number;
  nextListenBars?: MeasureRange;
  nextUseRhythmNotation?: boolean;
  preloadSections?: SheetPreloadSection[];
  listenBars?: MeasureRange;
  useRhythmNotation?: boolean;
  className?: string;
  /** @deprecated 移調機能廃止済み。互換性のため残すが無視される */
  transposeOffset?: number;
  /** @deprecated */
  nextTransposeOffset?: number;
  /** @deprecated */
  nextSectionTransposeOffset?: number;
}

// ─── モジュールレベル永続キャッシュ（セクション間即時切り替え用） ───
interface SheetRenderResult {
  imageData: string;
  mapping: TimeMappingEntry[];
  sheetWidth: number;
}
const sheetRenderCache = new Map<string, SheetRenderResult>();

function getSheetCacheKey(
  xml: string, bpmVal: number, timeSigVal: number, simple: boolean,
  lBars?: [number, number], rhythm?: boolean
): string {
  let hash = 0;
  for (let i = 0; i < xml.length; i++) {
    hash = ((hash << 5) - hash + xml.charCodeAt(i)) | 0;
  }
  const lbKey = lBars ? `${lBars[0]}-${lBars[1]}` : '';
  return `${xml.length}_${hash}_${bpmVal}_${timeSigVal}_${simple}_${lbKey}_${!!rhythm}`;
}

const PLAYHEAD_POSITION_PX = 80;
const WRAPPER_SCROLL_PADDING_PX = 200;

interface TimeMappingEntry {
  timeMs: number;
  xPosition: number;
}

function areMeasureRangesEqual(a?: MeasureRange, b?: MeasureRange): boolean {
  if (a === b) return true;
  if (!a || !b) return !a && !b;
  return a[0] === b[0] && a[1] === b[1];
}

function arePreloadSectionsEqual(prev?: SheetPreloadSection[], next?: SheetPreloadSection[]): boolean {
  if (prev === next) return true;
  if (!prev || !next) return !prev && !next;
  if (prev.length !== next.length) return false;

  for (let i = 0; i < prev.length; i++) {
    const prevSection = prev[i];
    const nextSection = next[i];
    if (
      prevSection.musicXml !== nextSection.musicXml ||
      prevSection.bpm !== nextSection.bpm ||
      prevSection.timeSignature !== nextSection.timeSignature ||
      prevSection.useRhythmNotation !== nextSection.useRhythmNotation ||
      !areMeasureRangesEqual(prevSection.listenBars, nextSection.listenBars)
    ) {
      return false;
    }
  }

  return true;
}

function areFantasySheetMusicDisplayPropsEqual(
  prev: FantasySheetMusicDisplayProps,
  next: FantasySheetMusicDisplayProps
): boolean {
  return (
    prev.width === next.width &&
    prev.height === next.height &&
    prev.musicXml === next.musicXml &&
    prev.bpm === next.bpm &&
    prev.timeSignature === next.timeSignature &&
    prev.measureCount === next.measureCount &&
    prev.countInMeasures === next.countInMeasures &&
    prev.disablePreview === next.disablePreview &&
    prev.simpleMode === next.simpleMode &&
    prev.nextMusicXml === next.nextMusicXml &&
    prev.nextBpm === next.nextBpm &&
    prev.nextTimeSignature === next.nextTimeSignature &&
    prev.nextUseRhythmNotation === next.nextUseRhythmNotation &&
    prev.useRhythmNotation === next.useRhythmNotation &&
    prev.className === next.className &&
    areMeasureRangesEqual(prev.listenBars, next.listenBars) &&
    areMeasureRangesEqual(prev.nextListenBars, next.nextListenBars) &&
    arePreloadSectionsEqual(prev.preloadSections, next.preloadSections)
  );
}

const FantasySheetMusicDisplay: React.FC<FantasySheetMusicDisplayProps> = ({
  width,
  height,
  musicXml,
  bpm,
  timeSignature,
  measureCount,
  countInMeasures = 0,
  disablePreview = false,
  simpleMode = false,
  nextMusicXml,
  nextBpm,
  nextTimeSignature,
  nextListenBars,
  nextUseRhythmNotation,
  preloadSections,
  listenBars,
  useRhythmNotation = false,
  className
}) => {
  const renderContainerRef = useRef<HTMLDivElement>(null);
  const preRenderContainerRef = useRef<HTMLDivElement>(null);
  const preloadContainerRef = useRef<HTMLDivElement>(null);
  const preRenderGenRef = useRef(0);
  const scoreWrapperRef = useRef<HTMLDivElement>(null);
  const timeMappingRef = useRef<TimeMappingEntry[]>([]);
  const lastScrollXRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const sheetWidthRef = useRef<number>(0);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [sheetImage, setSheetImage] = useState<string | null>(null);
  const [sheetWidth, setSheetWidth] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [nextSectionResult, setNextSectionResult] = useState<SheetRenderResult | null>(null);
  
  const loopInfo = useMemo(() => {
    const secPerBeat = 60 / (bpm || 120);
    const secPerMeasure = secPerBeat * (timeSignature || 4);
    const loopDuration = (measureCount || 8) * secPerMeasure;
    return { secPerBeat, secPerMeasure, loopDuration };
  }, [bpm, timeSignature, measureCount]);
  
  const renderSheet = useCallback(async (
    xml: string,
    container: HTMLDivElement,
    useSimpleMode: boolean,
    overrideBpm?: number,
    overrideTimeSig?: number,
    overrideListenBars?: [number, number] | null,
    overrideRhythmNotation?: boolean | null
  ): Promise<SheetRenderResult | null> => {
    const effectiveBpm = overrideBpm ?? bpm ?? 120;
    const effectiveTimeSig = overrideTimeSig ?? timeSignature ?? 4;
    try {
      let displayXml = stripLyricsFromMusicXml(xml);

      const effectiveListenBars = overrideListenBars !== undefined ? overrideListenBars : listenBars;
      const effectiveRhythm = overrideRhythmNotation !== undefined ? overrideRhythmNotation : useRhythmNotation;
      if (effectiveListenBars || effectiveRhythm) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(displayXml, 'text/xml');
        if (effectiveListenBars) {
          convertMeasuresToRests(doc, effectiveListenBars[0], effectiveListenBars[1]);
        }
        if (effectiveRhythm) {
          convertToRhythmNotation(doc);
        }
        displayXml = new XMLSerializer().serializeToString(doc);
      }
      
      const options: IOSMDOptions = {
        autoResize: false,
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
        defaultColorRest: '#333333',
        defaultColorLabel: '#000000',
        defaultColorTitle: '#000000',
      };
      
      const osmd = new OpenSheetMusicDisplay(container, options);
      await osmd.load(displayXml);
      osmd.render();
      
      const canvas = container.querySelector('canvas');
      if (!canvas) {
        osmd.clear();
        return null;
      }
      
      const dataUrl = canvas.toDataURL('image/png');
      
      const graphicSheet = osmd.GraphicSheet;
      const boundingBox = graphicSheet && (graphicSheet as any)?.BoundingBox;
      let scaleFactor = 10;
      
      if (boundingBox && boundingBox.width > 0) {
        const rectWidth = canvas.getBoundingClientRect().width || canvas.width;
        if (rectWidth > 0) {
          scaleFactor = rectWidth / boundingBox.width;
        }
      }
      
      const mapping: TimeMappingEntry[] = [];
      const secPerMeasure = (60 / effectiveBpm) * effectiveTimeSig;
      let measureIndex = 0;
      let firstMeasureX: number | null = null;
      
      if (graphicSheet && graphicSheet.MusicPages && graphicSheet.MusicPages.length > 0) {
        for (const page of graphicSheet.MusicPages) {
          for (const system of page.MusicSystems) {
            for (const staffLine of system.StaffLines) {
              for (const measure of staffLine.Measures) {
                const measureX = (measure as any)?.PositionAndShape?.AbsolutePosition?.x;
                if (typeof measureX === 'number') {
                  if (firstMeasureX === null) {
                    firstMeasureX = measureX;
                  }
                  
                  const timeMs = (measureIndex - countInMeasures) * secPerMeasure * 1000;
                  mapping.push({
                    timeMs,
                    xPosition: measureX * scaleFactor
                  });
                  measureIndex++;
                }
              }
            }
          }
        }
      }
      
      if (countInMeasures === 0 && firstMeasureX !== null && mapping.length > 0) {
        if (mapping[0].timeMs !== 0) {
          mapping.unshift({
            timeMs: 0,
            xPosition: firstMeasureX * scaleFactor
          });
        }
      }
      
      const resultWidth = container.scrollWidth || canvas.width;
      
      osmd.clear();
      return { imageData: dataUrl, mapping, sheetWidth: resultWidth };
    } catch (err) {
      devLog.debug('⚠️ 楽譜レンダリングエラー:', err);
      return null;
    }
  }, [bpm, timeSignature, listenBars, useRhythmNotation, countInMeasures]);
  
  const initializeSheet = useCallback(async () => {
    if (!musicXml || !renderContainerRef.current) {
      setError('楽譜データがありません');
      return;
    }
    
    const cacheKey = getSheetCacheKey(musicXml, bpm || 120, timeSignature || 4, simpleMode, listenBars, useRhythmNotation);
    const cached = sheetRenderCache.get(cacheKey);
    if (cached) {
      sheetWidthRef.current = cached.sheetWidth;
      timeMappingRef.current = cached.mapping;
      setSheetImage(cached.imageData);
      setSheetWidth(cached.sheetWidth);
      setIsInitialized(true);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (renderContainerRef.current) {
        renderContainerRef.current.innerHTML = '';
      }
      
      const result = await renderSheet(musicXml, renderContainerRef.current!, simpleMode);
      if (result) {
        sheetWidthRef.current = result.sheetWidth;
        timeMappingRef.current = result.mapping;
        setSheetImage(result.imageData);
        setSheetWidth(result.sheetWidth);
        
        sheetRenderCache.set(cacheKey, result);
      }
      
      setIsInitialized(true);
    } catch (err) {
      devLog.debug('❌ 楽譜初期化エラー:', err);
      setError(err instanceof Error ? err.message : '楽譜の処理中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [musicXml, renderSheet, bpm, timeSignature, simpleMode, listenBars, useRhythmNotation]);
  
  useEffect(() => {
    if (musicXml) {
      initializeSheet();
    }
  }, [musicXml, initializeSheet]);
  
  useEffect(() => {
    if (!nextMusicXml) {
      setNextSectionResult(null);
      return;
    }
    const prBpm = nextBpm ?? bpm ?? 120;
    const prTimeSig = nextTimeSignature ?? timeSignature ?? 4;
    const nextLB = nextListenBars;
    const nextRhythm = nextUseRhythmNotation ?? false;
    const cacheKey = getSheetCacheKey(nextMusicXml, prBpm, prTimeSig, simpleMode, nextLB, nextRhythm);

    const cached = sheetRenderCache.get(cacheKey);
    if (cached) {
      setNextSectionResult(cached);
      return;
    }

    if (!preRenderContainerRef.current) return;

    const gen = ++preRenderGenRef.current;
    const xmlToRender = nextMusicXml;
    const container = preRenderContainerRef.current;

    (async () => {
      try {
        if (container) container.innerHTML = '';
        const result = await renderSheet(
          xmlToRender, container, simpleMode, prBpm, prTimeSig, nextLB ?? null, nextRhythm ?? null
        );
        if (gen !== preRenderGenRef.current) return;
        if (result) {
          sheetRenderCache.set(cacheKey, result);
          setNextSectionResult(result);
        }
      } catch {}
    })();
  }, [nextMusicXml, nextBpm, nextTimeSignature, nextListenBars, nextUseRhythmNotation, bpm, timeSignature, simpleMode, renderSheet]);
  
  const preloadGenRef = useRef(0);
  useEffect(() => {
    if (!preloadSections || preloadSections.length === 0) return;
    if (!preloadContainerRef.current) return;
    
    const uncached = preloadSections.filter(s => {
      const key = getSheetCacheKey(s.musicXml, s.bpm, s.timeSignature, simpleMode, s.listenBars, s.useRhythmNotation);
      return !sheetRenderCache.has(key);
    });
    if (uncached.length === 0) return;

    const gen = ++preloadGenRef.current;
    const container = preloadContainerRef.current;

    (async () => {
      for (const section of uncached) {
        if (gen !== preloadGenRef.current) return;
        const cacheKey = getSheetCacheKey(section.musicXml, section.bpm, section.timeSignature, simpleMode, section.listenBars, section.useRhythmNotation);
        if (sheetRenderCache.has(cacheKey)) continue;

        if (container) container.innerHTML = '';
        const result = await renderSheet(
          section.musicXml, container, simpleMode, section.bpm, section.timeSignature, section.listenBars ?? null, section.useRhythmNotation ?? null
        );
        if (gen !== preloadGenRef.current) return;
        if (result) {
          sheetRenderCache.set(cacheKey, result);
        }
      }
    })();
  }, [preloadSections, simpleMode, renderSheet]);
  
  const rightSheetImage = nextSectionResult?.imageData ?? (disablePreview ? null : sheetImage);
  const rightSheetWidth = nextSectionResult?.sheetWidth ?? (disablePreview ? 0 : sheetWidth);
  
  useEffect(() => {
    if (!scoreWrapperRef.current || !isInitialized) {
      return;
    }
    
    const { loopDuration } = loopInfo;
    
    const updateScroll = () => {
      const currentTime = bgmManager.getCurrentMusicTime();
      const mapping = timeMappingRef.current;
      const sw = sheetWidthRef.current;
      
      if (mapping.length === 0 || sw <= 0) {
        animationFrameRef.current = requestAnimationFrame(updateScroll);
        return;
      }
      
      if (currentTime < 0) {
        if (scoreWrapperRef.current) {
          scoreWrapperRef.current.style.transform = `translateX(0px)`;
        }
        lastScrollXRef.current = 0;
        animationFrameRef.current = requestAnimationFrame(updateScroll);
        return;
      }
      
      const currentTimeMs = currentTime * 1000;
      const loopDurationMs = loopDuration * 1000;
      
      let xPosition = 0;
      
      for (let i = 0; i < mapping.length - 1; i++) {
        if (currentTimeMs >= mapping[i].timeMs && currentTimeMs < mapping[i + 1].timeMs) {
          const t = (currentTimeMs - mapping[i].timeMs) / (mapping[i + 1].timeMs - mapping[i].timeMs);
          xPosition = mapping[i].xPosition + t * (mapping[i + 1].xPosition - mapping[i].xPosition);
          break;
        }
      }
      
      if (currentTimeMs >= mapping[mapping.length - 1].timeMs) {
        const lastEntry = mapping[mapping.length - 1];
        const remainingTime = loopDurationMs - lastEntry.timeMs;
        if (remainingTime > 0) {
          const t = (currentTimeMs - lastEntry.timeMs) / remainingTime;
          xPosition = lastEntry.xPosition + t * (sw - lastEntry.xPosition);
        } else {
          xPosition = lastEntry.xPosition;
        }
      }
      
      const scrollX = Math.max(0, xPosition - PLAYHEAD_POSITION_PX);
      
      if (Math.abs(scrollX - lastScrollXRef.current) > 0.5) {
        if (scoreWrapperRef.current) {
          scoreWrapperRef.current.style.transform = `translateX(-${scrollX}px)`;
        }
        lastScrollXRef.current = scrollX;
      }
      
      animationFrameRef.current = requestAnimationFrame(updateScroll);
    };
    
    animationFrameRef.current = requestAnimationFrame(updateScroll);
    
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [loopInfo, isInitialized]);
  
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  if (!musicXml) {
    return (
      <div 
        className={cn('flex items-center justify-center bg-white text-gray-500 text-sm', className)}
        style={{ width, height }}
      >
        楽譜データがありません
      </div>
    );
  }
  
  return (
    <div 
      className={cn('relative overflow-hidden bg-white rounded', className)}
      style={{ width, height }}
    >
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
        style={{ left: `${PLAYHEAD_POSITION_PX}px` }}
      />
      
      <div 
        className="h-full overflow-hidden"
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-30">
            <div className="text-gray-600 text-sm">楽譜を読み込み中...</div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-30">
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        )}
        
        <div 
          ref={scoreWrapperRef}
          className="h-full flex relative"
          style={{ 
            width: `${sheetWidth + rightSheetWidth + WRAPPER_SCROLL_PADDING_PX}px`,
            willChange: 'transform'
          }}
        >
          <div 
            className="h-full flex items-center fantasy-sheet-music flex-shrink-0"
            style={{
              display: isInitialized ? 'none' : 'flex',
              ['--osmd-background' as string]: 'transparent'
            }}
          />
          
          {isInitialized && sheetImage && (
            <div 
              className="h-full flex items-center flex-shrink-0"
              style={{ 
                width: sheetWidth > 0 ? `${sheetWidth}px` : 'auto'
              }}
            >
              <img 
                src={sheetImage} 
                alt="" 
                className="h-full object-contain"
                style={{ 
                  imageRendering: 'auto',
                  pointerEvents: 'none'
                }}
              />
            </div>
          )}
          
          {isInitialized && rightSheetImage && (
            <div 
              className="h-full flex items-center flex-shrink-0"
              style={{ 
                width: rightSheetWidth > 0 ? `${rightSheetWidth}px` : 'auto'
              }}
            >
              <img 
                src={rightSheetImage} 
                alt="" 
                className="h-full object-contain"
                style={{ 
                  imageRendering: 'auto',
                  pointerEvents: 'none'
                }}
              />
            </div>
          )}
        </div>
      </div>
      
      <div 
        ref={renderContainerRef}
        className="absolute fantasy-sheet-music"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          visibility: 'hidden',
          pointerEvents: 'none',
          ['--osmd-background' as string]: 'transparent'
        }}
      />
      <div 
        ref={preRenderContainerRef}
        className="absolute fantasy-sheet-music"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          visibility: 'hidden',
          pointerEvents: 'none',
          ['--osmd-background' as string]: 'transparent'
        }}
      />
      <div 
        ref={preloadContainerRef}
        className="absolute fantasy-sheet-music"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          visibility: 'hidden',
          pointerEvents: 'none',
          ['--osmd-background' as string]: 'transparent'
        }}
      />
    </div>
  );
};

const MemoizedFantasySheetMusicDisplay = React.memo(
  FantasySheetMusicDisplay,
  areFantasySheetMusicDisplayPropsEqual
);

MemoizedFantasySheetMusicDisplay.displayName = 'FantasySheetMusicDisplay';

export default MemoizedFantasySheetMusicDisplay;
