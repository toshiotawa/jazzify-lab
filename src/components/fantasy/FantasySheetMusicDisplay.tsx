/**
 * ファンタジーモード用楽譜表示コンポーネント
 * OSMDを使用してMusicXMLを正確に表示
 * Progression_Timing用の横スクロール形式楽譜
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay';
import { cn } from '@/utils/cn';
import { bgmManager } from '@/utils/BGMManager';
import { devLog } from '@/utils/logger';

interface FantasySheetMusicDisplayProps {
  width: number;
  height: number;
  musicXml: string;
  bpm: number;
  timeSignature: number;
  measureCount: number;
  /** Harmonyデータ（chord_progression_dataのtext付きアイテム）*/
  harmonyMarkers?: Array<{ time: number; text: string }>;
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

const FantasySheetMusicDisplay: React.FC<FantasySheetMusicDisplayProps> = ({
  width,
  height,
  musicXml,
  bpm,
  timeSignature,
  measureCount,
  harmonyMarkers = [],
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scoreWrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const scaleFactorRef = useRef<number>(10);
  const timeMappingRef = useRef<TimeMappingEntry[]>([]);
  const lastScrollXRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wrapperWidth, setWrapperWidth] = useState<number>(width * 3);
  
  // ループ情報を計算
  const loopInfo = useMemo(() => {
    const secPerBeat = 60 / (bpm || 120);
    const secPerMeasure = secPerBeat * (timeSignature || 4);
    const loopDuration = (measureCount || 8) * secPerMeasure;
    return { secPerBeat, secPerMeasure, loopDuration };
  }, [bpm, timeSignature, measureCount]);
  
  // タイムマッピングを作成
  const createTimeMapping = useCallback(() => {
    if (!osmdRef.current) {
      devLog.debug('⚠️ OSMD未初期化のためタイムマッピング作成スキップ');
      return;
    }
    
    const mapping: TimeMappingEntry[] = [];
    const graphicSheet = osmdRef.current.GraphicSheet;
    
    if (!graphicSheet || !graphicSheet.MusicPages || graphicSheet.MusicPages.length === 0) {
      devLog.debug('⚠️ 楽譜のグラフィック情報が取得できません');
      return;
    }
    
    const { secPerBeat, secPerMeasure } = loopInfo;
    let measureIndex = 0;
    let firstMeasureX: number | null = null;
    
    // 小節ごとのX座標を取得
    for (const page of graphicSheet.MusicPages) {
      for (const system of page.MusicSystems) {
        for (const staffLine of system.StaffLines) {
          for (const measure of staffLine.Measures) {
            const measureX = (measure as any)?.PositionAndShape?.AbsolutePosition?.x;
            if (typeof measureX === 'number') {
              if (firstMeasureX === null) {
                firstMeasureX = measureX;
              }
              
              // 小節の開始時間を計算
              const timeMs = measureIndex * secPerMeasure * 1000;
              mapping.push({
                timeMs,
                xPosition: measureX * scaleFactorRef.current
              });
              measureIndex++;
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
          xPosition: firstMeasureX * scaleFactorRef.current
        });
      }
    }
    
    timeMappingRef.current = mapping;
    devLog.debug('✅ タイムマッピング作成完了:', { entries: mapping.length });
  }, [loopInfo]);
  
  // OSMDの初期化とレンダリング
  const loadAndRenderSheet = useCallback(async () => {
    if (!containerRef.current || !musicXml) {
      setError('楽譜データがありません');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 既存のOSMDインスタンスをクリア
      if (osmdRef.current) {
        osmdRef.current.clear();
      }
      
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
        pageBackgroundColor: 'transparent',
        defaultColorNotehead: '#ffffff',
        defaultColorStem: '#ffffff',
        defaultColorRest: '#94a3b8',
        defaultColorLabel: '#fbbf24',
        defaultColorTitle: '#ffffff'
      };
      
      osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, options);
      
      await osmdRef.current.load(musicXml);
      osmdRef.current.render();
      
      // スケールファクターを計算
      const renderSurface = containerRef.current.querySelector('svg, canvas');
      const boundingBox = (osmdRef.current.GraphicSheet as any)?.BoundingBox;
      
      if (renderSurface && boundingBox && boundingBox.width > 0) {
        const rectWidth = renderSurface.getBoundingClientRect().width;
        let renderedWidth = rectWidth;
        if (!renderedWidth && renderSurface instanceof SVGSVGElement) {
          renderedWidth = renderSurface.width.baseVal.value;
        } else if (!renderedWidth && renderSurface instanceof HTMLCanvasElement) {
          renderedWidth = renderSurface.width;
        }
        
        if (renderedWidth > 0) {
          scaleFactorRef.current = renderedWidth / boundingBox.width;
          devLog.debug('✅ スケールファクター計算:', scaleFactorRef.current);
        }
      }
      
      // ラッパー幅を更新
      const measuredWidth = containerRef.current.scrollWidth || width * 2;
      setWrapperWidth(measuredWidth + WRAPPER_SCROLL_PADDING_PX);
      
      // タイムマッピングを作成
      createTimeMapping();
      
      devLog.debug('✅ ファンタジー楽譜OSMD初期化完了');
      
    } catch (err) {
      devLog.debug('❌ 楽譜読み込みエラー:', err);
      setError(err instanceof Error ? err.message : '楽譜の処理中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [musicXml, width, createTimeMapping]);
  
  // musicXmlが変更されたら再レンダリング
  useEffect(() => {
    if (musicXml) {
      loadAndRenderSheet();
    }
  }, [loadAndRenderSheet, musicXml]);
  
  // 再生位置に同期してスクロール
  useEffect(() => {
    if (!scoreWrapperRef.current || timeMappingRef.current.length === 0) {
      return;
    }
    
    const { loopDuration } = loopInfo;
    
    const updateScroll = () => {
      const currentTime = bgmManager.getCurrentMusicTime();
      const mapping = timeMappingRef.current;
      
      if (mapping.length === 0) {
        animationFrameRef.current = requestAnimationFrame(updateScroll);
        return;
      }
      
      // 正規化された時間（ループ考慮）
      const normalizedTime = ((currentTime % loopDuration) + loopDuration) % loopDuration;
      const currentTimeMs = normalizedTime * 1000;
      
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
      
      // 最後のエントリ以降の場合
      if (currentTimeMs >= mapping[mapping.length - 1].timeMs) {
        xPosition = mapping[mapping.length - 1].xPosition;
      }
      
      const scrollX = Math.max(0, xPosition - PLAYHEAD_POSITION_PX);
      
      // 変化がある場合のみ更新
      if (Math.abs(scrollX - lastScrollXRef.current) > 1) {
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
  }, [loopInfo]);
  
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
  
  // Harmonyマーカーのオーバーレイ表示
  const HarmonyOverlay = useMemo(() => {
    if (harmonyMarkers.length === 0 || timeMappingRef.current.length === 0) {
      return null;
    }
    
    const { loopDuration } = loopInfo;
    
    return (
      <div className="absolute top-0 left-0 w-full h-8 pointer-events-none z-10">
        {harmonyMarkers.map((marker, index) => {
          // マーカーの時間に対応するX位置を計算
          const timeMs = marker.time * 1000;
          const mapping = timeMappingRef.current;
          let xPosition = 0;
          
          for (let i = 0; i < mapping.length - 1; i++) {
            if (timeMs >= mapping[i].timeMs && timeMs < mapping[i + 1].timeMs) {
              const t = (timeMs - mapping[i].timeMs) / (mapping[i + 1].timeMs - mapping[i].timeMs);
              xPosition = mapping[i].xPosition + t * (mapping[i + 1].xPosition - mapping[i].xPosition);
              break;
            }
          }
          
          return (
            <span
              key={index}
              className="absolute text-yellow-400 font-bold text-sm whitespace-nowrap"
              style={{ left: `${xPosition}px`, top: '4px' }}
            >
              {marker.text}
            </span>
          );
        })}
      </div>
    );
  }, [harmonyMarkers, loopInfo]);
  
  if (!musicXml) {
    return (
      <div 
        className={cn('flex items-center justify-center bg-slate-900/80 text-gray-400 text-sm', className)}
        style={{ width, height }}
      >
        楽譜データがありません
      </div>
    );
  }
  
  return (
    <div 
      className={cn('relative overflow-hidden bg-slate-900/90 rounded', className)}
      style={{ width, height }}
    >
      {/* プレイヘッド（赤い縦線） */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
        style={{ left: `${PLAYHEAD_POSITION_PX}px` }}
      />
      
      {/* Harmonyオーバーレイ */}
      {HarmonyOverlay}
      
      {/* スクロールコンテナ */}
      <div 
        ref={scrollContainerRef}
        className="h-full overflow-hidden"
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-30">
            <div className="text-white text-sm">楽譜を読み込み中...</div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-30">
            <div className="text-red-400 text-sm">{error}</div>
          </div>
        )}
        
        {/* 楽譜ラッパー */}
        <div 
          ref={scoreWrapperRef}
          className="h-full"
          style={{ 
            width: `${wrapperWidth}px`,
            willChange: 'transform'
          }}
        >
          {/* OSMDレンダリング用コンテナ */}
          <div 
            ref={containerRef}
            className="h-full flex items-center fantasy-sheet-music"
            style={{
              // OSMDのデフォルトスタイルを上書き
              ['--osmd-background' as string]: 'transparent'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default FantasySheetMusicDisplay;
