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

// 12キー分のタイムマッピングキャッシュ
interface TimeMapCache {
  [offset: number]: {
    mapping: TimeMappingEntry[];
    sheetWidth: number;
  };
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
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderContainerRef = useRef<HTMLDivElement>(null); // オフスクリーンレンダリング用
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
    container: HTMLDivElement
  ): Promise<{ imageData: string; mapping: TimeMappingEntry[]; sheetWidth: number } | null> => {
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
      // MusicXML内のHarmony/コードシンボルを非表示（独自のオーバーレイを使用するため）
      // 型定義にはないがOSMDのEngravingRulesプロパティを使用
      (osmd as any).EngravingRules.RenderChordSymbols = false;
      await osmd.load(transposedXml);
      osmd.render();
      
      // canvasの内容を画像として取得
      const canvas = container.querySelector('canvas');
      if (!canvas) {
        osmd.clear();
        return null;
      }
      
      const dataUrl = canvas.toDataURL('image/png');
      
      // スケールファクターを計算
      const graphicSheet = osmd.GraphicSheet;
      const boundingBox = graphicSheet && (graphicSheet as any)?.BoundingBox;
      let scaleFactor = 10;
      
      if (boundingBox && boundingBox.width > 0) {
        const rectWidth = canvas.getBoundingClientRect().width || canvas.width;
        if (rectWidth > 0) {
          scaleFactor = rectWidth / boundingBox.width;
        }
      }
      
      // タイムマッピングを作成
      const mapping: TimeMappingEntry[] = [];
      const secPerMeasure = (60 / (bpm || 120)) * (timeSignature || 4);
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
      
      // 0ms → 最初の小節のアンカーを追加
      if (firstMeasureX !== null && mapping.length > 0) {
        if (mapping[0].timeMs !== 0) {
          mapping.unshift({
            timeMs: 0,
            xPosition: firstMeasureX * scaleFactor
          });
        }
      }
      
      // 楽譜の幅を取得
      const sheetWidth = container.scrollWidth || canvas.width;
      
      osmd.clear();
      return { imageData: dataUrl, mapping, sheetWidth };
    } catch (err) {
      devLog.debug(`⚠️ キー${offset}の楽譜レンダリングエラー:`, err);
      return null;
    }
  }, [bpm, timeSignature]);
  
  // 12キー分の楽譜を事前レンダリング
  const initializeAllSheets = useCallback(async () => {
    if (!musicXml || !renderContainerRef.current) {
      setError('楽譜データがありません');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const imageCache: SheetImageCache = {};
      const mapCache: TimeMapCache = {};
      
      // 12キー分すべてを同じ方法でレンダリング
      for (let offset = 0; offset < 12; offset++) {
        // レンダリング用コンテナをクリア
        if (renderContainerRef.current) {
          renderContainerRef.current.innerHTML = '';
        }
        
        const result = await renderSheetForOffset(musicXml, offset, renderContainerRef.current!);
        if (result) {
          imageCache[offset] = result.imageData;
          mapCache[offset] = {
            mapping: result.mapping,
            sheetWidth: result.sheetWidth
          };
          
          // オフセット0の場合、デフォルトの値を設定
          if (offset === 0) {
            sheetWidthRef.current = result.sheetWidth;
            timeMappingRef.current = result.mapping;
            scaleFactorRef.current = result.mapping.length > 1 
              ? (result.mapping[1].xPosition - result.mapping[0].xPosition) / ((60 / (bpm || 120)) * (timeSignature || 4) * 1000 / 1000)
              : 10;
          }
        }
        
        // 進捗ログ
        if (offset % 3 === 0) {
          devLog.debug(`🎹 楽譜レンダリング進捗: ${offset + 1}/12`);
        }
      }
      
      // ラッパー幅を更新（2つ分の楽譜 + パディング）
      // 最大の楽譜幅を使用
      const maxSheetWidth = Math.max(...Object.values(mapCache).map(m => m.sheetWidth), sheetWidthRef.current || width * 2);
      sheetWidthRef.current = mapCache[0]?.sheetWidth || maxSheetWidth;
      setWrapperWidth(maxSheetWidth * 2 + WRAPPER_SCROLL_PADDING_PX);
      
      setSheetImageCache(imageCache);
      setTimeMapCache(mapCache);
      setIsInitialized(true);
      
      console.log('✅ 12キー分の楽譜レンダリング完了', {
        imageCount: Object.keys(imageCache).length,
        mapCount: Object.keys(mapCache).length,
        widthVariation: Object.values(mapCache).map(m => m.sheetWidth)
      });
      
    } catch (err) {
      devLog.debug('❌ 楽譜初期化エラー:', err);
      setError(err instanceof Error ? err.message : '楽譜の処理中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [musicXml, width, renderSheetForOffset, bpm, timeSignature]);
  
  // musicXmlまたはloopInfoが変更されたら12キー分をレンダリング
  useEffect(() => {
    if (musicXml) {
      initializeAllSheets();
    }
   
  }, [musicXml]);
  
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
  
  // 現在のキーと次のキーの楽譜幅
  const currentSheetWidth = useMemo(() => {
    const offset = ((transposeOffset % 12) + 12) % 12;
    return timeMapCache[offset]?.sheetWidth || sheetWidthRef.current;
  }, [timeMapCache, transposeOffset]);
  
  const nextSheetWidth = useMemo(() => {
    const nextOffset = nextTransposeOffset !== undefined 
      ? ((nextTransposeOffset % 12) + 12) % 12
      : ((transposeOffset % 12) + 12) % 12;
    return timeMapCache[nextOffset]?.sheetWidth || sheetWidthRef.current;
  }, [timeMapCache, transposeOffset, nextTransposeOffset]);
  
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
      const currentOffset = ((transposeOffset % 12) + 12) % 12;
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
        
        {/* 楽譜ラッパー（2つの楽譜を並べる：現在のキー + 次のキー） */}
        <div 
          ref={scoreWrapperRef}
          className="h-full flex relative"
          style={{ 
            width: `${wrapperWidth}px`,
            willChange: 'transform'
          }}
        >
          {/* Harmonyマーカーオーバーレイは音符の上のコードネームと重複するため削除 */}
          
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
          
          {/* 2つ目の楽譜（次のキー、先読み表示用） */}
          {isInitialized && nextSheetImage && (
            <div 
              className="h-full flex items-center flex-shrink-0"
              style={{ 
                width: nextSheetWidth > 0 ? `${nextSheetWidth}px` : 'auto'
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
