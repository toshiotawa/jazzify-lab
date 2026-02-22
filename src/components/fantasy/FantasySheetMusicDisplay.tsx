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
import { stripLyricsFromMusicXml } from '@/utils/musicXmlMapper';
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
  /** 現在の移調オフセット（半音数、0 ~ 11） */
  transposeOffset?: number;
  /** 次のループの移調オフセット（0 ~ 11） */
  nextTransposeOffset?: number;
  /** 先読み譜面の表示を無効化 */
  disablePreview?: boolean;
  /** 簡易表示モード（ダブルシャープ/ダブルフラットを変換） */
  simpleMode?: boolean;
  /** 次セクションのmusicXml（結合モード: 右側に連続表示） */
  nextMusicXml?: string;
  /** 次セクションのBPM */
  nextBpm?: number;
  /** 次セクションの拍子 */
  nextTimeSignature?: number;
  /** 次セクションの移調オフセット（結合モード用、省略時はtransposeOffsetと同じ） */
  nextSectionTransposeOffset?: number;
  /** 結合モード: 全セクションの譜面データを事前レンダリング用に渡す */
  preloadSections?: Array<{ musicXml: string; bpm: number; timeSignature: number }>;
  className?: string;
}

// ─── モジュールレベル永続キャッシュ（セクション間即時切り替え用） ───
interface SheetRenderCacheEntry {
  images: SheetImageCache;
  timeMaps: TimeMapCache;
  maxSheetWidth: number;
}
const sheetRenderCache = new Map<string, SheetRenderCacheEntry>();

function getSheetCacheKey(xml: string, bpmVal: number, timeSigVal: number, simple: boolean): string {
  let hash = 0;
  for (let i = 0; i < xml.length; i++) {
    hash = ((hash << 5) - hash + xml.charCodeAt(i)) | 0;
  }
  return `${xml.length}_${hash}_${bpmVal}_${timeSigVal}_${simple}`;
}

// プレイヘッドの位置（左端からのピクセル数）
const PLAYHEAD_POSITION_PX = 80;
// 右側のパディング
const WRAPPER_SCROLL_PADDING_PX = 200;

interface TimeMappingEntry {
  timeMs: number;
  xPosition: number;
}

// 12キー分の楽譜画像キャッシュ（-5〜+6の範囲）
interface SheetImageCache {
  [offset: number]: string; // offset (-5〜+6) -> dataURL
}

// 12キー分のタイムマッピングキャッシュ（-5〜+6の範囲）
interface TimeMapCache {
  [offset: number]: {
    mapping: TimeMappingEntry[];
    sheetWidth: number;
  };
}

/**
 * transposeOffsetを-5〜+6の範囲に正規化
 * +6と-6は同じピッチクラス（Gb/F#）なので、どちらも+6として扱う
 * これにより、音源・ノーツ・楽譜すべてで統一された移調が適用される
 */
function normalizeOffsetToCache(offset: number): number {
  // まず0〜11に正規化
  let normalized = ((offset % 12) + 12) % 12;
  // 7〜11は-5〜-1に変換、0〜6はそのまま
  if (normalized > 6) {
    normalized = normalized - 12;
  }
  return normalized;
}

const FantasySheetMusicDisplay: React.FC<FantasySheetMusicDisplayProps> = ({
  width,
  height,
  musicXml,
  bpm,
  timeSignature,
  measureCount,
  countInMeasures = 0,
  transposeOffset = 0,
  nextTransposeOffset,
  disablePreview = false,
  simpleMode = false,
  nextMusicXml,
  nextBpm,
  nextTimeSignature,
  nextSectionTransposeOffset,
  preloadSections,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderContainerRef = useRef<HTMLDivElement>(null); // オフスクリーンレンダリング用
  const preRenderContainerRef = useRef<HTMLDivElement>(null); // 次セクション背景プリレンダリング用
  const preloadContainerRef = useRef<HTMLDivElement>(null); // preloadSections専用レンダリング用
  const preRenderGenRef = useRef(0); // プリレンダリング世代管理
  const scoreWrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const scaleFactorRef = useRef<number>(10);
  const timeMappingRef = useRef<TimeMappingEntry[]>([]);
  const lastScrollXRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  
  // 楽譜の実際の幅
  const sheetWidthRef = useRef<number>(0);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wrapperWidth, setWrapperWidth] = useState<number>(width * 3);
  
  // 12キー分の楽譜画像キャッシュ
  const [sheetImageCache, setSheetImageCache] = useState<SheetImageCache>({});
  // 12キー分のタイムマッピングキャッシュ
  const [timeMapCache, setTimeMapCache] = useState<TimeMapCache>({});
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 次セクション（結合モード）のプリレンダリング結果
  const [nextSectionCache, setNextSectionCache] = useState<SheetRenderCacheEntry | null>(null);
  
  // ループ情報を計算
  const loopInfo = useMemo(() => {
    const secPerBeat = 60 / (bpm || 120);
    const secPerMeasure = secPerBeat * (timeSignature || 4);
    const loopDuration = (measureCount || 8) * secPerMeasure;
    return { secPerBeat, secPerMeasure, loopDuration };
  }, [bpm, timeSignature, measureCount]);
  
  
  // 単一キーの楽譜をレンダリングして画像とタイムマッピングを取得
  const renderSheetForOffset = useCallback(async (
    xml: string,
    offset: number,
    container: HTMLDivElement,
    useSimpleMode: boolean,
    overrideBpm?: number,
    overrideTimeSig?: number
  ): Promise<{ imageData: string; mapping: TimeMappingEntry[]; sheetWidth: number } | null> => {
    const effectiveBpm = overrideBpm ?? bpm ?? 120;
    const effectiveTimeSig = overrideTimeSig ?? timeSignature ?? 4;
    try {
      const transposedXml = (offset !== 0 || useSimpleMode) ? transposeMusicXml(xml, offset, useSimpleMode) : xml;
      const displayXml = stripLyricsFromMusicXml(transposedXml);
      
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
      }
      
      if (firstMeasureX !== null && mapping.length > 0) {
        if (mapping[0].timeMs !== 0) {
          mapping.unshift({
            timeMs: 0,
            xPosition: firstMeasureX * scaleFactor
          });
        }
      }
      
      const sheetWidth = container.scrollWidth || canvas.width;
      
      osmd.clear();
      return { imageData: dataUrl, mapping, sheetWidth };
    } catch (err) {
      devLog.debug(`⚠️ キー${offset}の楽譜レンダリングエラー:`, err);
      return null;
    }
  }, [bpm, timeSignature]);
  
  // 12キー分の楽譜を事前レンダリング（-5〜+6の範囲）
  const initializeAllSheets = useCallback(async () => {
    if (!musicXml || !renderContainerRef.current) {
      setError('楽譜データがありません');
      return;
    }
    
    // 永続キャッシュチェック → ヒット時は即時スワップ（OSMDレンダリングをスキップ）
    const cacheKey = getSheetCacheKey(musicXml, bpm || 120, timeSignature || 4, simpleMode);
    const cached = sheetRenderCache.get(cacheKey);
    if (cached) {
      sheetWidthRef.current = cached.timeMaps[0]?.sheetWidth || cached.maxSheetWidth;
      timeMappingRef.current = cached.timeMaps[0]?.mapping || [];
      scaleFactorRef.current = (cached.timeMaps[0]?.mapping?.length ?? 0) > 1
        ? (cached.timeMaps[0].mapping[1].xPosition - cached.timeMaps[0].mapping[0].xPosition) / ((60 / (bpm || 120)) * (timeSignature || 4))
        : 10;
      setWrapperWidth(cached.maxSheetWidth * 2 + WRAPPER_SCROLL_PADDING_PX);
      setSheetImageCache(cached.images);
      setTimeMapCache(cached.timeMaps);
      setIsInitialized(true);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const imageCache: SheetImageCache = {};
      const mapCache: TimeMapCache = {};
      
      for (let i = 0; i < 12; i++) {
        const offset = i <= 6 ? i : i - 12;
        
        if (renderContainerRef.current) {
          renderContainerRef.current.innerHTML = '';
        }
        
        const result = await renderSheetForOffset(musicXml, offset, renderContainerRef.current!, simpleMode);
        if (result) {
          imageCache[offset] = result.imageData;
          mapCache[offset] = {
            mapping: result.mapping,
            sheetWidth: result.sheetWidth
          };
          
          if (offset === 0) {
            sheetWidthRef.current = result.sheetWidth;
            timeMappingRef.current = result.mapping;
            scaleFactorRef.current = result.mapping.length > 1 
              ? (result.mapping[1].xPosition - result.mapping[0].xPosition) / ((60 / (bpm || 120)) * (timeSignature || 4) * 1000 / 1000)
              : 10;
          }
        }
        
        if (i % 3 === 0) {
          devLog.debug(`🎹 楽譜レンダリング進捗: ${i + 1}/12 (offset: ${offset}, simpleMode: ${simpleMode})`);
        }
      }
      
      const maxSheetWidth = Math.max(...Object.values(mapCache).map(m => m.sheetWidth), sheetWidthRef.current || width * 2);
      sheetWidthRef.current = mapCache[0]?.sheetWidth || maxSheetWidth;
      setWrapperWidth(maxSheetWidth * 2 + WRAPPER_SCROLL_PADDING_PX);
      
      // 永続キャッシュに保存
      sheetRenderCache.set(cacheKey, { images: imageCache, timeMaps: mapCache, maxSheetWidth });
      
      setSheetImageCache(imageCache);
      setTimeMapCache(mapCache);
      setIsInitialized(true);
      
    } catch (err) {
      devLog.debug('❌ 楽譜初期化エラー:', err);
      setError(err instanceof Error ? err.message : '楽譜の処理中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [musicXml, width, renderSheetForOffset, bpm, timeSignature, simpleMode]);
  
  // musicXmlまたはloopInfoが変更されたら12キー分をレンダリング
  useEffect(() => {
    if (musicXml) {
      initializeAllSheets();
    }
  }, [musicXml, initializeAllSheets]);
  
  // 次セクションの楽譜を背景でプリレンダリング（結合モード: 右側に連続表示用）
  useEffect(() => {
    if (!nextMusicXml) {
      setNextSectionCache(null);
      return;
    }
    const prBpm = nextBpm ?? bpm ?? 120;
    const prTimeSig = nextTimeSignature ?? timeSignature ?? 4;
    const cacheKey = getSheetCacheKey(nextMusicXml, prBpm, prTimeSig, simpleMode);
    
    const cached = sheetRenderCache.get(cacheKey);
    if (cached) {
      setNextSectionCache(cached);
      return;
    }
    
    if (!preRenderContainerRef.current) return;
    
    const gen = ++preRenderGenRef.current;
    const xmlToRender = nextMusicXml;
    const container = preRenderContainerRef.current;
    
    (async () => {
      try {
        const imageCache: SheetImageCache = {};
        const mapCache: TimeMapCache = {};
        
        for (let i = 0; i < 12; i++) {
          if (gen !== preRenderGenRef.current) return;
          const offset = i <= 6 ? i : i - 12;
          if (container) container.innerHTML = '';
          const result = await renderSheetForOffset(xmlToRender, offset, container, simpleMode, prBpm, prTimeSig);
          if (result) {
            imageCache[offset] = result.imageData;
            mapCache[offset] = { mapping: result.mapping, sheetWidth: result.sheetWidth };
          }
        }
        
        if (gen !== preRenderGenRef.current) return;
        if (Object.keys(imageCache).length < 12) return;
        const maxSheetWidth = Math.max(...Object.values(mapCache).map(m => m.sheetWidth), 0);
        const entry: SheetRenderCacheEntry = { images: imageCache, timeMaps: mapCache, maxSheetWidth };
        sheetRenderCache.set(cacheKey, entry);
        setNextSectionCache(entry);
      } catch {}
    })();
  }, [nextMusicXml, nextBpm, nextTimeSignature, bpm, timeSignature, simpleMode, renderSheetForOffset]);
  
  // 結合モード: 全セクションの譜面を初期化時に一括で事前レンダリング
  // preRenderContainerRef とは別の専用コンテナで、次セクションプリレンダリングとのDOM競合を防ぐ
  const preloadGenRef = useRef(0);
  useEffect(() => {
    if (!preloadSections || preloadSections.length === 0) return;
    if (!preloadContainerRef.current) return;
    
    const uncached = preloadSections.filter(s => {
      const key = getSheetCacheKey(s.musicXml, s.bpm, s.timeSignature, simpleMode);
      return !sheetRenderCache.has(key);
    });
    if (uncached.length === 0) return;
    
    const gen = ++preloadGenRef.current;
    const container = preloadContainerRef.current;
    
    (async () => {
      for (const section of uncached) {
        if (gen !== preloadGenRef.current) return;
        const cacheKey = getSheetCacheKey(section.musicXml, section.bpm, section.timeSignature, simpleMode);
        if (sheetRenderCache.has(cacheKey)) continue;
        
        const imageCache: SheetImageCache = {};
        const mapCache: TimeMapCache = {};
        let allRendered = true;
        
        for (let i = 0; i < 12; i++) {
          if (gen !== preloadGenRef.current) return;
          const offset = i <= 6 ? i : i - 12;
          if (container) container.innerHTML = '';
          const result = await renderSheetForOffset(
            section.musicXml, offset, container, simpleMode, section.bpm, section.timeSignature
          );
          if (result) {
            imageCache[offset] = result.imageData;
            mapCache[offset] = { mapping: result.mapping, sheetWidth: result.sheetWidth };
          } else {
            allRendered = false;
          }
        }
        
        if (gen !== preloadGenRef.current) return;
        if (!allRendered) continue;
        const maxW = Math.max(...Object.values(mapCache).map(m => m.sheetWidth), 0);
        sheetRenderCache.set(cacheKey, { images: imageCache, timeMaps: mapCache, maxSheetWidth: maxW });
      }
    })();
  }, [preloadSections, simpleMode, renderSheetForOffset]);
  
  // 現在のキーと次のキーの楽譜画像
  const currentSheetImage = useMemo(() => {
    const offset = normalizeOffsetToCache(transposeOffset);
    return sheetImageCache[offset] || null;
  }, [sheetImageCache, transposeOffset]);
  
  const nextSheetImage = useMemo(() => {
    const nextOffset = normalizeOffsetToCache(
      nextTransposeOffset !== undefined ? nextTransposeOffset : transposeOffset
    );
    return sheetImageCache[nextOffset] || null;
  }, [sheetImageCache, transposeOffset, nextTransposeOffset]);
  
  // 現在のキーと次のキーの楽譜幅
  const currentSheetWidth = useMemo(() => {
    const offset = normalizeOffsetToCache(transposeOffset);
    return timeMapCache[offset]?.sheetWidth || sheetWidthRef.current;
  }, [timeMapCache, transposeOffset]);
  
  const nextSheetWidth = useMemo(() => {
    const nextOffset = normalizeOffsetToCache(
      nextTransposeOffset !== undefined ? nextTransposeOffset : transposeOffset
    );
    return timeMapCache[nextOffset]?.sheetWidth || sheetWidthRef.current;
  }, [timeMapCache, transposeOffset, nextTransposeOffset]);
  
  // 次セクション（結合モード）の画像と幅
  const nextSectionImage = useMemo(() => {
    if (!nextSectionCache) return null;
    const offset = normalizeOffsetToCache(nextSectionTransposeOffset ?? transposeOffset);
    return nextSectionCache.images[offset] ?? null;
  }, [nextSectionCache, nextSectionTransposeOffset, transposeOffset]);
  
  const nextSectionSheetWidth = useMemo(() => {
    if (!nextSectionCache) return 0;
    const offset = normalizeOffsetToCache(nextSectionTransposeOffset ?? transposeOffset);
    return nextSectionCache.timeMaps[offset]?.sheetWidth ?? nextSectionCache.maxSheetWidth;
  }, [nextSectionCache, nextSectionTransposeOffset, transposeOffset]);
  
  // 右側に表示する譜面を決定: 結合モード次セクション > 同一曲次キー
  const rightSheetImage = nextSectionImage ?? (disablePreview ? null : nextSheetImage);
  const rightSheetWidth = nextSectionImage ? nextSectionSheetWidth : (disablePreview ? 0 : nextSheetWidth);
  
  // 再生位置に同期してスクロール
  // getCurrentMusicTime()は0〜loopDurationに正規化された値を返す
  // スクロールは現在のキーに対応するタイムマッピングを使用して時刻→X位置を計算
  useEffect(() => {
    if (!scoreWrapperRef.current || !isInitialized) {
      return;
    }
    
    const { loopDuration } = loopInfo;
    
    const updateScroll = () => {
      // getCurrentMusicTime()はM1開始=0、カウントイン中は負の値を返す
      // ループ後は0〜loopDurationに正規化されている
      const currentTime = bgmManager.getCurrentMusicTime();
      
      // 現在のキーに対応するタイムマッピングを取得
      const currentOffset = normalizeOffsetToCache(transposeOffset);
      const currentMapData = timeMapCache[currentOffset];
      const mapping = currentMapData?.mapping || timeMappingRef.current;
      const sheetWidth = currentMapData?.sheetWidth || sheetWidthRef.current;
      
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
  }, [loopInfo, isInitialized, transposeOffset, timeMapCache]);
  
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
  
  // Harmonyマーカーは音符の上のコードネームと重複するため削除
  
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
        
        {/* 楽譜ラッパー（現在の楽譜 + 右側に次の楽譜を連続配置） */}
        <div 
          ref={scoreWrapperRef}
          className="h-full flex relative"
          style={{ 
            width: `${currentSheetWidth + rightSheetWidth + WRAPPER_SCROLL_PADDING_PX}px`,
            willChange: 'transform'
          }}
        >
          {/* OSMDレンダリング用コンテナ（初期レンダリング用、その後は非表示） */}
          <div 
            ref={containerRef}
            className="h-full flex items-center fantasy-sheet-music flex-shrink-0"
            style={{
              display: isInitialized ? 'none' : 'flex',
              ['--osmd-background' as string]: 'transparent'
            }}
          />
          
          {/* 1つ目の楽譜（現在のセクション/キー） */}
          {isInitialized && currentSheetImage && (
            <div 
              className="h-full flex items-center flex-shrink-0"
              style={{ 
                width: currentSheetWidth > 0 ? `${currentSheetWidth}px` : 'auto'
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
          
          {/* 2つ目の楽譜（次セクション or 次キーの先読み表示） */}
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
      {/* 次セクション背景プリレンダリング用コンテナ（表示されない） */}
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
      {/* preloadSections専用レンダリング用コンテナ（表示されない、preRenderContainerRefとのDOM競合を防ぐ） */}
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

export default FantasySheetMusicDisplay;
