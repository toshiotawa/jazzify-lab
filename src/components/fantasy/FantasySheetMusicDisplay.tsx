/**
 * ファンタジーモード用楽譜表示コンポーネント
 * OSMDを使用してMusicXMLを正確に表示
 * Progression_Timing用の横スクロール形式楽譜
 * 
 * 12パターン楽譜方式：
 * - 初期化時に12キー分の楽譜画像を事前レンダリング
 * - 現在のキーと次のキーの楽譜を2つ並べて表示
 * - ループ境界での切り替えはゲームエンジンのtransposeOffset更新で自動的に行われる
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay';
import { cn } from '@/utils/cn';
import { bgmManager } from '@/utils/BGMManager';
import { devLog } from '@/utils/logger';
import { transposeMusicXml } from '@/utils/musicXmlTransposer';

interface FantasySheetMusicDisplayProps {
  width: number;
  height: number;
  musicXml: string;
  bpm: number;
  timeSignature: number;
  measureCount: number;
  /** カウントイン小節数（スクロール計算で考慮） */
  countInMeasures?: number;
  /** Harmonyデータ（chord_progression_dataのtext付きアイテム）*/
  harmonyMarkers?: Array<{ time: number; text: string }>;
  /** 現在の移調オフセット（半音数、0 ~ 11） */
  transposeOffset?: number;
  /** 次のループの移調オフセット（0 ~ 11） */
  nextTransposeOffset?: number;
  className?: string;
}

// プレイヘッドの位置（左端からのピクセル数）
const PLAYHEAD_POSITION_PX = 80;
// 右側のパディング
const WRAPPER_SCROLL_PADDING_PX = 200;

interface TimeMappingEntry {
  timeMs: number;
  xPosition: number;
}

// 12キー分の楽譜画像キャッシュ
interface SheetImageCache {
  [offset: number]: string; // offset (0-11) -> dataURL
}

interface SheetRenderMetrics {
  mapping: TimeMappingEntry[];
  width: number;
}

const FantasySheetMusicDisplay: React.FC<FantasySheetMusicDisplayProps> = ({
  width,
  height,
  musicXml,
  bpm,
  timeSignature,
  measureCount,
  countInMeasures = 0,
  harmonyMarkers = [],
  transposeOffset = 0,
  nextTransposeOffset,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderContainerRef = useRef<HTMLDivElement>(null); // オフスクリーンレンダリング用
  const scoreWrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const timeMappingRef = useRef<TimeMappingEntry[]>([]);
  const sheetMetricsRef = useRef<Record<number, SheetRenderMetrics>>({});
  const lastScrollXRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  
  // 楽譜の実際の幅
  const sheetWidthRef = useRef<number>(0);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wrapperWidth, setWrapperWidth] = useState<number>(width * 3);
  
  // 12キー分の楽譜画像キャッシュ
  const [sheetImageCache, setSheetImageCache] = useState<SheetImageCache>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [mappingVersion, setMappingVersion] = useState(0);
  
  // ループ情報を計算
  const loopInfo = useMemo(() => {
    const secPerBeat = 60 / (bpm || 120);
    const secPerMeasure = secPerBeat * (timeSignature || 4);
    const loopDuration = (measureCount || 8) * secPerMeasure;
    return { secPerBeat, secPerMeasure, loopDuration };
  }, [bpm, timeSignature, measureCount]);
  
  const buildTimeMapping = useCallback((
    graphicSheet: OpenSheetMusicDisplay['GraphicSheet'] | null | undefined,
    scaleFactor: number
  ): TimeMappingEntry[] => {
    if (!graphicSheet || !graphicSheet.MusicPages || graphicSheet.MusicPages.length === 0) {
      return [];
    }
    
    const mapping: TimeMappingEntry[] = [];
    const { secPerMeasure } = loopInfo;
    let measureIndex = 0;
    let firstMeasureX: number | null = null;
    
    // 小節ごとのX座標を取得
    for (const page of graphicSheet.MusicPages) {
      for (const system of page.MusicSystems) {
        for (const staffLine of system.StaffLines) {
          for (const measure of staffLine.Measures) {
            const measureX = measure.PositionAndShape?.AbsolutePosition?.x;
            if (typeof measureX === 'number') {
              if (firstMeasureX === null) {
                firstMeasureX = measureX;
              }
              
              // 小節の開始時間を計算
              const timeMs = measureIndex * secPerMeasure * 1000;
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
    
    // 0ms → 最初の小節のアンカーを追加
    if (firstMeasureX !== null && mapping.length > 0 && mapping[0].timeMs !== 0) {
      mapping.unshift({
        timeMs: 0,
        xPosition: firstMeasureX * scaleFactor
      });
    }
    
    return mapping;
  }, [loopInfo]);
  
  const getScaleFactor = useCallback((
    renderSurface: Element | null,
    graphicSheet: OpenSheetMusicDisplay['GraphicSheet'] | null | undefined
  ): number => {
    if (!renderSurface || !graphicSheet || !graphicSheet.BoundingBox || graphicSheet.BoundingBox.width <= 0) {
      return 1;
    }
    
    let renderedWidth = renderSurface.getBoundingClientRect().width;
    if (!renderedWidth && renderSurface instanceof SVGSVGElement) {
      renderedWidth = renderSurface.width.baseVal.value;
    } else if (!renderedWidth && renderSurface instanceof HTMLCanvasElement) {
      renderedWidth = renderSurface.width;
    }
    
    if (renderedWidth > 0) {
      return renderedWidth / graphicSheet.BoundingBox.width;
    }
    
    return 1;
  }, []);
  
  const getRenderedWidth = useCallback((
    container: HTMLDivElement,
    fallbackWidth: number
  ): number => {
    const measuredWidth = container.scrollWidth;
    if (measuredWidth > 0) {
      return measuredWidth;
    }
    
    const renderSurface = container.querySelector('svg, canvas');
    if (renderSurface) {
      const rectWidth = renderSurface.getBoundingClientRect().width;
      if (rectWidth > 0) {
        return rectWidth;
      }
      if (renderSurface instanceof SVGSVGElement && renderSurface.width.baseVal.value > 0) {
        return renderSurface.width.baseVal.value;
      }
      if (renderSurface instanceof HTMLCanvasElement && renderSurface.width > 0) {
        return renderSurface.width;
      }
    }
    
    return fallbackWidth;
  }, []);
  
  // 単一キーの楽譜をレンダリングして画像を取得
  const renderSheetForOffset = useCallback(async (
    xml: string,
    offset: number,
    container: HTMLDivElement
  ): Promise<{ imageData: string; mapping: TimeMappingEntry[]; width: number } | null> => {
    try {
      // 移調を適用
      const transposedXml = offset !== 0 ? transposeMusicXml(xml, offset) : xml;
      
      // OSMDオプション設定
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
      await osmd.load(transposedXml);
      osmd.render();
      
      const renderSurface = container.querySelector('svg, canvas');
      const scaleFactor = getScaleFactor(renderSurface, osmd.GraphicSheet);
      const mapping = buildTimeMapping(osmd.GraphicSheet, scaleFactor);
      const measuredWidth = getRenderedWidth(container, width * 2);
      
      // canvasの内容を画像として取得
      const canvas = container.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        osmd.clear();
        return { imageData: dataUrl, mapping, width: measuredWidth };
      }
      osmd.clear();
      return null;
    } catch (err) {
      devLog.debug(`⚠️ キー${offset}の楽譜レンダリングエラー:`, err);
      return null;
    }
  }, [buildTimeMapping, getRenderedWidth, getScaleFactor, width]);
  
  // 12キー分の楽譜を事前レンダリング
  const initializeAllSheets = useCallback(async () => {
    if (!musicXml || !renderContainerRef.current) {
      setError('楽譜データがありません');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const cache: SheetImageCache = {};
      sheetMetricsRef.current = {};
      
      // まずオフセット0（元のキー）をレンダリングしてタイムマッピングを作成
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
      
      // コンテナをリセット
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      
      osmdRef.current = new OpenSheetMusicDisplay(containerRef.current!, options);
      await osmdRef.current.load(musicXml);
      osmdRef.current.render();
      
      const renderSurface = containerRef.current!.querySelector('svg, canvas');
      const scaleFactor = getScaleFactor(renderSurface, osmdRef.current.GraphicSheet);
      const measuredWidth = getRenderedWidth(containerRef.current!, width * 2);
      const mapping = buildTimeMapping(osmdRef.current.GraphicSheet, scaleFactor);
      sheetWidthRef.current = measuredWidth;
      timeMappingRef.current = mapping;
      
      sheetMetricsRef.current[0] = { mapping, width: measuredWidth };
      
      // オフセット0の画像を取得
      const canvas0 = containerRef.current!.querySelector('canvas');
      if (canvas0) {
        cache[0] = canvas0.toDataURL('image/png');
      }
      
      // 残りの11キー分をレンダリング
      for (let offset = 1; offset < 12; offset++) {
        // レンダリング用コンテナをクリア
        if (renderContainerRef.current) {
          renderContainerRef.current.innerHTML = '';
        }
        
        const renderResult = await renderSheetForOffset(musicXml, offset, renderContainerRef.current!);
        if (renderResult) {
          cache[offset] = renderResult.imageData;
          sheetMetricsRef.current[offset] = {
            mapping: renderResult.mapping,
            width: renderResult.width
          };
        }
        
        // 進捗ログ
        if (offset % 4 === 0) {
          devLog.debug(`🎹 楽譜レンダリング進捗: ${offset}/11`);
        }
      }
      
      setSheetImageCache(cache);
      setIsInitialized(true);
      
      console.log('✅ 12キー分の楽譜レンダリング完了', Object.keys(cache).length);
      
    } catch (err) {
      devLog.debug('❌ 楽譜初期化エラー:', err);
      setError(err instanceof Error ? err.message : '楽譜の処理中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [buildTimeMapping, getRenderedWidth, getScaleFactor, musicXml, renderSheetForOffset, width]);
  
  // musicXmlが変更されたら12キー分をレンダリング
  useEffect(() => {
    if (musicXml) {
      initializeAllSheets();
    }
  }, [musicXml, initializeAllSheets]);
  
  // 現在のキーと次のキーの楽譜画像
  const currentSheetImage = useMemo(() => {
    const offset = ((transposeOffset % 12) + 12) % 12;
    return sheetImageCache[offset] || null;
  }, [sheetImageCache, transposeOffset]);
  
  const nextSheetImage = useMemo(() => {
    const nextOffset = nextTransposeOffset !== undefined 
      ? ((nextTransposeOffset % 12) + 12) % 12
      : ((transposeOffset % 12) + 12) % 12;
    return sheetImageCache[nextOffset] || null;
  }, [sheetImageCache, transposeOffset, nextTransposeOffset]);
  
  // 現在のキーに対応するタイムマッピングと幅を反映
  useEffect(() => {
    if (!isInitialized) {
      return;
    }
    
    const normalizedOffset = ((transposeOffset % 12) + 12) % 12;
    const metrics = sheetMetricsRef.current[normalizedOffset] ?? sheetMetricsRef.current[0];
    if (!metrics) {
      return;
    }
    
    timeMappingRef.current = metrics.mapping;
    sheetWidthRef.current = metrics.width;
    setWrapperWidth(metrics.width * 2 + WRAPPER_SCROLL_PADDING_PX);
    setMappingVersion((prev) => prev + 1);
  }, [isInitialized, transposeOffset]);
  
  // 再生位置に同期してスクロール
  // getCurrentMusicTime()は0〜loopDurationに正規化された値を返す
  // スクロールは単純に時刻→X位置の変換のみ
  useEffect(() => {
    if (!scoreWrapperRef.current || !isInitialized) {
      return;
    }
    
    const { loopDuration } = loopInfo;
    
    const updateScroll = () => {
      // getCurrentMusicTime()はM1開始=0、カウントイン中は負の値を返す
      // ループ後は0〜loopDurationに正規化されている
      const currentTime = bgmManager.getCurrentMusicTime();
      const mapping = timeMappingRef.current;
      const sheetWidth = sheetWidthRef.current;
      
      if (mapping.length === 0 || sheetWidth <= 0) {
        animationFrameRef.current = requestAnimationFrame(updateScroll);
        return;
      }
      
      // カウントイン中（負の値）は楽譜を先頭位置に保持
      if (currentTime < 0) {
        if (scoreWrapperRef.current) {
          scoreWrapperRef.current.style.transform = `translateX(0px)`;
        }
        lastScrollXRef.current = 0;
        animationFrameRef.current = requestAnimationFrame(updateScroll);
        return;
      }
      
      // 正規化された時刻をミリ秒に変換
      const currentTimeMs = currentTime * 1000;
      const loopDurationMs = loopDuration * 1000;
      
      // 現在時刻に対応するX位置を補間で計算
      let xPosition = 0;
      
      for (let i = 0; i < mapping.length - 1; i++) {
        if (currentTimeMs >= mapping[i].timeMs && currentTimeMs < mapping[i + 1].timeMs) {
          // 線形補間
          const t = (currentTimeMs - mapping[i].timeMs) / (mapping[i + 1].timeMs - mapping[i].timeMs);
          xPosition = mapping[i].xPosition + t * (mapping[i + 1].xPosition - mapping[i].xPosition);
          break;
        }
      }
      
      // 最後のエントリ以降の場合（ループ終端に向かって補間）
      if (currentTimeMs >= mapping[mapping.length - 1].timeMs) {
        const lastEntry = mapping[mapping.length - 1];
        // 最後の小節から楽譜終端まで進行
        const remainingTime = loopDurationMs - lastEntry.timeMs;
        if (remainingTime > 0) {
          const t = (currentTimeMs - lastEntry.timeMs) / remainingTime;
          // 楽譜の終端位置（sheetWidthを使用）
          xPosition = lastEntry.xPosition + t * (sheetWidth - lastEntry.xPosition);
        } else {
          xPosition = lastEntry.xPosition;
        }
      }
      
      // スクロール位置を計算（プレイヘッド位置を考慮）
      const scrollX = Math.max(0, xPosition - PLAYHEAD_POSITION_PX);
      
      // スムーズなスクロール更新
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
  
  // クリーンアップ
  useEffect(() => {
    return () => {
      if (osmdRef.current) {
        osmdRef.current.clear();
      }
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Harmonyマーカーの位置を計算
  const harmonyMarkerPositions = useMemo(() => {
    if (harmonyMarkers.length === 0 || timeMappingRef.current.length === 0) {
      return [];
    }
    
    const mapping = timeMappingRef.current;
    const positions: Array<{ text: string; xPosition: number }> = [];
    
    for (const marker of harmonyMarkers) {
      const timeMs = marker.time * 1000;
      let xPosition = 0;
      
      for (let i = 0; i < mapping.length - 1; i++) {
        if (timeMs >= mapping[i].timeMs && timeMs < mapping[i + 1].timeMs) {
          const t = (timeMs - mapping[i].timeMs) / (mapping[i + 1].timeMs - mapping[i].timeMs);
          xPosition = mapping[i].xPosition + t * (mapping[i + 1].xPosition - mapping[i].xPosition);
          break;
        }
      }
      
      positions.push({ text: marker.text, xPosition });
    }
    
    return positions;
  }, [harmonyMarkers, mappingVersion]);
  
  // Harmonyマーカーのレンダリング（1つの楽譜分）
  const renderHarmonyMarkers = useCallback((offset: number, keyPrefix: string) => {
    return harmonyMarkerPositions.map((marker, index) => (
      <span
        key={`${keyPrefix}-${index}`}
        className="absolute text-yellow-400 font-bold text-sm whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
        style={{ left: `${marker.xPosition + offset}px`, top: '4px' }}
      >
        {marker.text}
      </span>
    ));
  }, [harmonyMarkerPositions]);
  
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
      {/* プレイヘッド（赤い縦線） */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
        style={{ left: `${PLAYHEAD_POSITION_PX}px` }}
      />
      
      {/* スクロールコンテナ */}
      <div 
        ref={scrollContainerRef}
        className="h-full overflow-hidden"
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-30">
            <div className="text-gray-600 text-sm">楽譜を読み込み中（12キー分レンダリング中）...</div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-30">
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        )}
        
        {/* 楽譜ラッパー（2つの楽譜を並べる：現在のキー + 次のキー） */}
        <div 
          ref={scoreWrapperRef}
          className="h-full flex relative"
          style={{ 
            width: `${wrapperWidth}px`,
            willChange: 'transform'
          }}
        >
          {/* Harmonyマーカーオーバーレイ（楽譜と一緒にスクロール） */}
          {harmonyMarkerPositions.length > 0 && (
            <div className="absolute top-0 left-0 h-8 pointer-events-none z-10" style={{ width: `${wrapperWidth}px` }}>
              {/* 1つ目の楽譜用マーカー */}
              {renderHarmonyMarkers(0, 'first')}
              {/* 2つ目の楽譜用マーカー */}
              {sheetWidthRef.current > 0 && renderHarmonyMarkers(sheetWidthRef.current, 'second')}
            </div>
          )}
          
          {/* OSMDレンダリング用コンテナ（初期レンダリング用、その後は非表示） */}
          <div 
            ref={containerRef}
            className="h-full flex items-center fantasy-sheet-music flex-shrink-0"
            style={{
              display: isInitialized ? 'none' : 'flex',
              ['--osmd-background' as string]: 'transparent'
            }}
          />
          
          {/* 1つ目の楽譜（現在のキー） */}
          {isInitialized && currentSheetImage && (
            <div 
              className="h-full flex items-center flex-shrink-0"
              style={{ 
                width: sheetWidthRef.current > 0 ? `${sheetWidthRef.current}px` : 'auto'
              }}
            >
              <img 
                src={currentSheetImage} 
                alt="" 
                className="h-full object-contain"
                style={{ 
                  imageRendering: 'auto',
                  pointerEvents: 'none'
                }}
              />
            </div>
          )}
          
          {/* 2つ目の楽譜（次のキー、先読み表示用） */}
          {isInitialized && nextSheetImage && (
            <div 
              className="h-full flex items-center flex-shrink-0"
              style={{ 
                width: sheetWidthRef.current > 0 ? `${sheetWidthRef.current}px` : 'auto'
              }}
            >
              <img 
                src={nextSheetImage} 
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
      
      {/* オフスクリーンのレンダリング用コンテナ（表示されない） */}
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
    </div>
  );
};

export default FantasySheetMusicDisplay;
