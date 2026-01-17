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
  /** 移調量（半音、±6の範囲） */
  transposition?: number;
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
  transposition = 0,
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
  
  // 移調済みMusicXMLを計算
  const transposedMusicXml = useMemo(() => {
    if (!musicXml) return '';
    if (transposition === 0) return musicXml;
    
    try {
      const result = transposeMusicXml(musicXml, transposition);
      devLog.debug('🎼 MusicXML移調完了:', { transposition, semitones: transposition });
      return result;
    } catch (error) {
      devLog.debug('⚠️ MusicXML移調エラー:', error);
      return musicXml; // エラー時は元のMusicXMLを使用
    }
  }, [musicXml, transposition]);
  
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
      
      // 移調済みMusicXMLをロード
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
      
      // ラッパー幅を更新
      const measuredWidth = containerRef.current.scrollWidth || width * 2;
      setWrapperWidth(measuredWidth + WRAPPER_SCROLL_PADDING_PX);
      
      // タイムマッピングを作成
      createTimeMapping();
      
      devLog.debug('✅ ファンタジー楽譜OSMD初期化完了', { transposition });
      
    } catch (err) {
      devLog.debug('❌ 楽譜読み込みエラー:', err);
      setError(err instanceof Error ? err.message : '楽譜の処理中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [transposedMusicXml, width, createTimeMapping, transposition]);
  
  // musicXmlまたは移調量が変更されたら再レンダリング
  useEffect(() => {
    if (transposedMusicXml) {
      loadAndRenderSheet();
    }
  }, [loadAndRenderSheet, transposedMusicXml]);
  
  // 再生位置に同期してスクロール（ループ対応）
  useEffect(() => {
    if (!scoreWrapperRef.current) {
      return;
    }
    
    const { loopDuration } = loopInfo;
    let lastNormalizedTime = -1;
    
    const updateScroll = () => {
      // getCurrentMusicTime()はM1開始=0、カウントイン中は負の値を返す
      const currentTime = bgmManager.getCurrentMusicTime();
      const mapping = timeMappingRef.current;
      
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
      
      // 正規化された時間（ループ考慮）- currentTimeは既にM1開始=0基準
      const normalizedTime = ((currentTime % loopDuration) + loopDuration) % loopDuration;
      const currentTimeMs = normalizedTime * 1000;
      
      // ループ検出（時間が巻き戻った場合）
      const isLoopReset = lastNormalizedTime > 0 && normalizedTime < lastNormalizedTime - 0.5;
      lastNormalizedTime = normalizedTime;
      
      // 現在時刻に対応するX位置を補間で計算
      let xPosition = 0;
      const loopDurationMs = loopDuration * 1000;
      
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
        const firstEntry = mapping[0];
        // 最後の小節から楽譜終端まで進行
        const remainingTime = loopDurationMs - lastEntry.timeMs;
        if (remainingTime > 0) {
          const t = (currentTimeMs - lastEntry.timeMs) / remainingTime;
          // 楽譜の終端位置を推定（最後の小節幅分追加）
          const estimatedEndX = lastEntry.xPosition + (mapping.length > 1 
            ? (mapping[mapping.length - 1].xPosition - mapping[mapping.length - 2].xPosition)
            : 100);
          xPosition = lastEntry.xPosition + t * (estimatedEndX - lastEntry.xPosition);
        } else {
          xPosition = lastEntry.xPosition;
        }
      }
      
      const scrollX = Math.max(0, xPosition - PLAYHEAD_POSITION_PX);
      
      // ループリセット時は即座にスクロール位置をリセット
      if (isLoopReset) {
        if (scoreWrapperRef.current) {
          scoreWrapperRef.current.style.transition = 'none';
          scoreWrapperRef.current.style.transform = `translateX(-${scrollX}px)`;
          // 次フレームでtransitionを復活
          requestAnimationFrame(() => {
            if (scoreWrapperRef.current) {
              scoreWrapperRef.current.style.transition = '';
            }
          });
        }
        lastScrollXRef.current = scrollX;
      } else if (Math.abs(scrollX - lastScrollXRef.current) > 0.5) {
        // 通常のスクロール更新
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
      
      {/* Harmonyオーバーレイ */}
      {HarmonyOverlay}
      
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
