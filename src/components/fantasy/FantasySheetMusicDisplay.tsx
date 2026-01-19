/**
 * ファンタジーモード用楽譜表示コンポーネント
 * OSMDを使用してMusicXMLを正確に表示
 * Progression_Timing用の横スクロール形式楽譜
 * 
 * 無限スクロール対応：
 * - 楽譜を2つ並べて配置（オリジナル + クローン）
 * - ループ時にシームレスにスクロール
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
  /** 移調オフセット（半音数、-12 ~ +12） */
  transposeOffset?: number;
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
  countInMeasures = 0,
  harmonyMarkers = [],
  transposeOffset = 0,
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
  
  // 無限スクロール用：楽譜の実際の幅
  const sheetWidthRef = useRef<number>(0);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wrapperWidth, setWrapperWidth] = useState<number>(width * 3);
  // クローンした楽譜画像（無限スクロール用）
  const [clonedSheetImage, setClonedSheetImage] = useState<string | null>(null);
  
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
  
  // 移調済みMusicXMLをメモ化
  const transposedMusicXml = useMemo(() => {
    if (!musicXml || transposeOffset === 0) {
      return musicXml;
    }
    try {
      const transposed = transposeMusicXml(musicXml, transposeOffset);
      devLog.debug('🎹 楽譜を移調:', { offset: transposeOffset });
      return transposed;
    } catch (err) {
      devLog.debug('⚠️ 楽譜移調エラー:', err);
      return musicXml;
    }
  }, [musicXml, transposeOffset]);
  
  // OSMDの初期化とレンダリング
  const loadAndRenderSheet = useCallback(async () => {
    if (!containerRef.current || !transposedMusicXml) {
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
      // 白背景、黒い音符・記号
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
      
      osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, options);
      
      await osmdRef.current.load(transposedMusicXml);
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
      
      // 楽譜の実際の幅を取得
      const measuredWidth = containerRef.current.scrollWidth || width * 2;
      sheetWidthRef.current = measuredWidth;
      
      // ラッパー幅を更新（2つ分の楽譜 + パディング）
      setWrapperWidth(measuredWidth * 2 + WRAPPER_SCROLL_PADDING_PX);
      
      // タイムマッピングを作成
      createTimeMapping();
      
      // 無限スクロール用：canvasの内容を画像としてクローン
      const canvas = containerRef.current.querySelector('canvas');
      if (canvas) {
        try {
          const dataUrl = canvas.toDataURL('image/png');
          setClonedSheetImage(dataUrl);
          devLog.debug('✅ 楽譜画像クローン作成完了');
        } catch (err) {
          devLog.debug('⚠️ canvas画像クローン失敗:', err);
        }
      }
      
      devLog.debug('✅ ファンタジー楽譜OSMD初期化完了（無限スクロール対応）');
      
    } catch (err) {
      devLog.debug('❌ 楽譜読み込みエラー:', err);
      setError(err instanceof Error ? err.message : '楽譜の処理中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [transposedMusicXml, width, createTimeMapping]);
  
  // musicXmlまたはtransposeOffsetが変更されたら再レンダリング
  useEffect(() => {
    if (transposedMusicXml) {
      loadAndRenderSheet();
    }
  }, [loadAndRenderSheet, transposedMusicXml]);
  
  // 再生位置に同期してスクロール（無限スクロール対応）
  useEffect(() => {
    if (!scoreWrapperRef.current) {
      return;
    }
    
    const { loopDuration } = loopInfo;
    
    const updateScroll = () => {
      // getCurrentMusicTime()はM1開始=0、カウントイン中は負の値を返す
      const currentTime = bgmManager.getCurrentMusicTime();
      const mapping = timeMappingRef.current;
      const sheetWidth = sheetWidthRef.current;
      
      if (mapping.length === 0) {
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
      
      // ループを考慮しない絶対時間から位置を計算
      // 無限スクロールでは、時間の正規化をせず、継続的にスクロール
      const loopCount = Math.floor(currentTime / loopDuration);
      const normalizedTime = currentTime - (loopCount * loopDuration);
      const currentTimeMs = normalizedTime * 1000;
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
          const endX = sheetWidth > 0 ? sheetWidth : lastEntry.xPosition + 100;
          xPosition = lastEntry.xPosition + t * (endX - lastEntry.xPosition);
        } else {
          xPosition = lastEntry.xPosition;
        }
      }
      
      // 無限スクロール：ループカウントに基づいてオフセットを追加
      // ループごとに楽譜幅分だけ右にシフト（2つの楽譜を交互に表示）
      const loopOffset = (loopCount % 2) * sheetWidth;
      const absoluteScrollX = xPosition + loopOffset;
      
      // スクロール位置（プレイヘッド位置を考慮）
      const scrollX = Math.max(0, absoluteScrollX - PLAYHEAD_POSITION_PX);
      
      // 偶数ループ終了時に位置をリセット（シームレスなループ）
      // スクロール位置が2つ分の楽譜幅を超えそうになったら、最初にリセット
      if (scrollX > sheetWidth * 2 - PLAYHEAD_POSITION_PX * 2) {
        // リセットせず、継続（クローンがあるので見た目は連続）
      }
      
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
  
  // Harmonyマーカーの位置を計算（無限スクロール対応）
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
  }, [harmonyMarkers]);
  
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
            <div className="text-gray-600 text-sm">楽譜を読み込み中...</div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-30">
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        )}
        
        {/* 楽譜ラッパー（無限スクロール用に2つの楽譜を並べる） */}
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
          
          {/* OSMDレンダリング用コンテナ（1つ目の楽譜） */}
          <div 
            ref={containerRef}
            className="h-full flex items-center fantasy-sheet-music flex-shrink-0"
            style={{
              // OSMDのデフォルトスタイルを上書き
              ['--osmd-background' as string]: 'transparent'
            }}
          />
          
          {/* クローンした楽譜画像（2つ目の楽譜 - 無限スクロール用） */}
          {clonedSheetImage && (
            <div 
              className="h-full flex items-center flex-shrink-0"
              style={{ 
                width: sheetWidthRef.current > 0 ? `${sheetWidthRef.current}px` : 'auto'
              }}
            >
              <img 
                src={clonedSheetImage} 
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
    </div>
  );
};

export default FantasySheetMusicDisplay;
