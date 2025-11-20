import React, { useEffect, useRef, useState, useCallback } from 'react';
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay';
import { useGameSelector, useGameActions } from '@/stores/helpers';
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
 * Phase 3.5: インタラクティブ機能（スクロール、ABリピート操作、シーク）の追加
 */
const SheetMusicDisplay: React.FC<SheetMusicDisplayProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scaleFactorRef = useRef<number>(10);
  
  const timeMappingRef = useRef<TimeMappingEntry[]>([]);
  
  const { currentTime, isPlaying, notes, musicXml, settings, abRepeat } = useGameSelector((s) => ({
    currentTime: s.currentTime,
    isPlaying: s.isPlaying,
    notes: s.notes,
    musicXml: s.musicXml,
    settings: s.settings,
    abRepeat: s.abRepeat
  }));
  
  const { seek, setABRepeatStart, setABRepeatEnd } = useGameActions();
  const shouldRenderSheet = settings.showSheetMusic;

  // ============================================================================
  // 座標変換ヘルパー
  // ============================================================================

  // 時間(秒) -> X座標(px) の変換 (線形補間)
  const timeToX = useCallback((time: number): number => {
    const mapping = timeMappingRef.current;
    if (mapping.length === 0) return 0;
    
    const timeMs = time * 1000;
    
    // 範囲外の処理
    if (timeMs <= mapping[0].timeMs) return mapping[0].xPosition;
    if (timeMs >= mapping[mapping.length - 1].timeMs) return mapping[mapping.length - 1].xPosition;

    // 二分探索で区間を探す
    let low = 0, high = mapping.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (mapping[mid].timeMs < timeMs) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    
    const index = Math.max(0, high);
    const p1 = mapping[index];
    const p2 = mapping[index + 1];

    if (!p2) return p1.xPosition;

    // 線形補間
    const ratio = (timeMs - p1.timeMs) / (p2.timeMs - p1.timeMs);
    return p1.xPosition + (p2.xPosition - p1.xPosition) * ratio;
  }, []);

  // X座標(px) -> 時間(秒) の変換 (線形補間)
  const xToTime = useCallback((x: number): number => {
    const mapping = timeMappingRef.current;
    if (mapping.length === 0) return 0;

    // 範囲外
    if (x <= mapping[0].xPosition) return mapping[0].timeMs / 1000;
    if (x >= mapping[mapping.length - 1].xPosition) return mapping[mapping.length - 1].timeMs / 1000;

    // 線形探索 (X座標は単調増加と仮定)
    // 頻繁に呼ばれるドラッグ時は二分探索の方が良いが、要素数が数千程度ならループでも許容範囲
    // ここでは簡易的にループで実装
    for (let i = 0; i < mapping.length - 1; i++) {
      const p1 = mapping[i];
      const p2 = mapping[i + 1];
      if (x >= p1.xPosition && x <= p2.xPosition) {
        const ratio = (x - p1.xPosition) / (p2.xPosition - p1.xPosition);
        const timeMs = p1.timeMs + (p2.timeMs - p1.timeMs) * ratio;
        return timeMs / 1000;
      }
    }
    return 0;
  }, []);

  // ============================================================================
  // OSMD 初期化 & マッピング作成
  // ============================================================================

  const createTimeMapping = useCallback(() => {
    if (!osmdRef.current || !notes || notes.length === 0) return;

    const mapping: TimeMappingEntry[] = [];
    const graphicSheet = osmdRef.current.GraphicSheet;
    
    if (!graphicSheet) return;

    // OSMDから描画された音符情報を抽出
    const osmdNotes: { x: number; width: number }[] = [];
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
                  if (!graphicNote.sourceNote || (graphicNote.sourceNote as any).isRest?.()) continue;
                  if (graphicNote.sourceNote.NoteTie && !graphicNote.sourceNote.NoteTie.StartNote) continue;

                  const pos = graphicNote.PositionAndShape as any;
                  if (pos?.AbsolutePosition?.x !== undefined) {
                    osmdNotes.push({
                      x: pos.AbsolutePosition.x,
                      width: pos.BoundingBox?.width || 0
                    });
                  }
                }
              }
            }
          }
        }
      }
    }

    // JSONのnotesとOSMDの描画位置をマッピング
    const timingAdjustmentSec = (settings.timingAdjustment ?? 0) / 1000;
    let noteIndex = 0;

    for (const on of osmdNotes) {
      if (noteIndex < notes.length) {
        const note = notes[noteIndex];
        const centerX = on.x + (on.width / 2);
        
        mapping.push({
          timeMs: (note.time + timingAdjustmentSec) * 1000,
          xPosition: centerX * scaleFactorRef.current
        });
        noteIndex++;
      }
    }

    // 先頭(0秒)のアンカー追加
    if (firstBeatX !== null) {
      mapping.unshift({
        timeMs: 0,
        xPosition: firstBeatX * scaleFactorRef.current
      });
    }
    
    // 末尾のアンカー追加（スクロール余白用）
    if (mapping.length > 0) {
      const last = mapping[mapping.length - 1];
      mapping.push({
        timeMs: last.timeMs + 5000, // +5秒
        xPosition: last.xPosition + 500 // +500px (概算)
      });
    }

    timeMappingRef.current = mapping;
  }, [notes, settings.timingAdjustment]);

  // 楽譜ロード処理
  const loadAndRenderSheet = useCallback(async () => {
    if (!shouldRenderSheet || !containerRef.current || !musicXml) {
      if (osmdRef.current) osmdRef.current.clear();
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
        backend: 'svg',
        drawTitle: false,
        drawingParameters: 'compacttight',
        renderSingleHorizontalStaffline: true,
        pageFormat: 'Endless', // 横スクロールモード
      };
      
      osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, options);
      await osmdRef.current.load(processedMusicXml);
      osmdRef.current.render();

      // スケール計算
      const svgElement = containerRef.current.querySelector('svg');
      const boundingBox = (osmdRef.current.GraphicSheet as any).BoundingBox;
      if (svgElement && boundingBox && boundingBox.width > 0) {
        scaleFactorRef.current = svgElement.width.baseVal.value / boundingBox.width;
      } else {
        scaleFactorRef.current = 10;
      }

      createTimeMapping();
      
      // コードのみ表示対応
      if (settings.sheetMusicChordsOnly) {
        const noteEls = containerRef.current.querySelectorAll('[class*=notehead], [class*=rest], [class*=stem]');
        noteEls.forEach(el => (el as HTMLElement).style.display = 'none');
      }

    } catch (err) {
      log.error('楽譜レンダリングエラー:', err);
      setError('楽譜の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [shouldRenderSheet, musicXml, settings, createTimeMapping]);

  useEffect(() => {
    loadAndRenderSheet();
  }, [loadAndRenderSheet]);


  // ============================================================================
  // スクロール制御
  // ============================================================================

  // 再生中の自動スクロール
  useEffect(() => {
    if (!isPlaying || !scrollContainerRef.current) return;

    let animationFrameId: number;

    const updateScroll = () => {
      if (!scrollContainerRef.current) return;
      
      // 現在時刻に対応するX座標を取得
      const targetX = timeToX(currentTime);
      
      // プレイヘッド位置オフセット (画面左端から120pxの位置に現在時刻が来るように)
      const OFFSET_X = 120; 
      const scrollX = Math.max(0, targetX - OFFSET_X);
      
      scrollContainerRef.current.scrollLeft = scrollX;
      
      animationFrameId = requestAnimationFrame(updateScroll);
    };

    updateScroll();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, currentTime, timeToX]);


  // ============================================================================
  // インタラクション (ドラッグ & クリック)
  // ============================================================================

  // 汎用ドラッグハンドラー
  const handleDrag = (
    e: React.PointerEvent, 
    onDrag: (newX: number) => void, 
    onEnd?: () => void
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    const container = scrollContainerRef.current;
    if (!container) return;
    
    // コンテナの矩形情報
    const rect = container.getBoundingClientRect();
    
    const onPointerMove = (moveEvent: PointerEvent) => {
      // コンテナ内での相対X座標 (スクロール量込み)
      const relativeX = moveEvent.clientX - rect.left + container.scrollLeft;
      const clampedX = Math.max(0, Math.min(relativeX, container.scrollWidth));
      onDrag(clampedX);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      if (onEnd) onEnd();
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // プレイヘッドのドラッグ
  const onPlayheadDragStart = (e: React.PointerEvent) => {
    // ドラッグ中は一時停止推奨（音のスクラブ再生がない場合）
    // ここではシークのみ行う
    handleDrag(e, (newX) => {
      const newTime = xToTime(newX);
      seek(newTime);
    });
  };

  // A地点のドラッグ
  const onAMarkerDragStart = (e: React.PointerEvent) => {
    handleDrag(e, (newX) => {
      const newTime = xToTime(newX);
      // B地点を超えないように制限
      if (abRepeat.endTime !== null && newTime >= abRepeat.endTime) return;
      setABRepeatStart(newTime);
    });
  };

  // B地点のドラッグ
  const onBMarkerDragStart = (e: React.PointerEvent) => {
    handleDrag(e, (newX) => {
      const newTime = xToTime(newX);
      // A地点より前に行かないように制限
      if (abRepeat.startTime !== null && newTime <= abRepeat.startTime) return;
      setABRepeatEnd(newTime);
    });
  };

  // 背景クリック（シーク）
  const onBackgroundClick = (e: React.MouseEvent) => {
    // ドラッグ操作と区別するため、マウスダウン位置などを判定しても良いが、
    // ここではシンプルにクリックで移動。
    // ※親要素のスクロールと干渉しないよう注意
    const container = scrollContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left + container.scrollLeft;
    const newTime = xToTime(clickX);
    seek(newTime);
  };


  // ============================================================================
  // レンダリング
  // ============================================================================

  if (!shouldRenderSheet) {
    return (
      <div className={cn('flex items-center justify-center bg-slate-900 text-gray-400', className)}>
        楽譜表示はオフになっています
      </div>
    );
  }

  // 座標計算
  const playheadX = timeToX(currentTime);
  const markerAX = abRepeat.startTime !== null ? timeToX(abRepeat.startTime) : null;
  const markerBX = abRepeat.endTime !== null ? timeToX(abRepeat.endTime) : null;

  return (
    <div className={cn("relative bg-white text-black h-full group", className)}>
      
      {/* ローディング / エラー表示 */}
      {(isLoading || error || (!musicXml && !isLoading)) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80">
          <div className="text-gray-600">
            {isLoading ? '楽譜を読み込み中...' : error ? `エラー: ${error}` : '楽譜データがありません'}
          </div>
        </div>
      )}

      {/* スクロールコンテナ */}
      <div 
        ref={scrollContainerRef}
        className={cn(
          "h-full overflow-x-auto overflow-y-hidden relative select-none custom-sheet-scrollbar",
          // 再生中はスクロールバーを隠すなどのスタイル調整が可能
          isPlaying ? "cursor-none" : "cursor-grab active:cursor-grabbing"
        )}
        style={{
           // ネイティブスクロールを有効にするため transform は使用しない
           willChange: 'scroll-position'
        }}
        onClick={onBackgroundClick} // 背景タップでシーク
      >
        {/* 楽譜コンテンツラッパー */}
        <div className="relative min-w-max h-full">
          
          {/* OSMD レンダリング先 */}
          <div ref={containerRef} className="h-full inline-block align-top pointer-events-none" />

          {/* オーバーレイレイヤー (マーカー、プレイヘッド) */}
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            
            {/* ABリピート範囲のハイライト */}
            {markerAX !== null && markerBX !== null && (
              <div 
                className="absolute top-0 bottom-0 bg-blue-500/10 border-x border-blue-500/30"
                style={{ 
                  left: markerAX, 
                  width: markerBX - markerAX 
                }}
              />
            )}

            {/* Aマーカー */}
            {markerAX !== null && (
              <div 
                className="absolute top-0 bottom-0 w-4 -ml-2 cursor-col-resize group/marker pointer-events-auto flex flex-col items-center"
                style={{ left: markerAX }}
                onPointerDown={onAMarkerDragStart}
                onClick={(e) => e.stopPropagation()} // シークイベント伝播防止
              >
                <div className="w-0.5 h-full bg-green-500 group-hover/marker:w-1 transition-all" />
                <div className="absolute top-0 bg-green-500 text-white text-[10px] px-1 rounded-b shadow-sm">A</div>
              </div>
            )}

            {/* Bマーカー */}
            {markerBX !== null && (
              <div 
                className="absolute top-0 bottom-0 w-4 -ml-2 cursor-col-resize group/marker pointer-events-auto flex flex-col items-center"
                style={{ left: markerBX }}
                onPointerDown={onBMarkerDragStart}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-0.5 h-full bg-red-500 group-hover/marker:w-1 transition-all" />
                <div className="absolute top-0 bg-red-500 text-white text-[10px] px-1 rounded-b shadow-sm">B</div>
              </div>
            )}

            {/* プレイヘッド (再生位置) */}
            <div 
              className="absolute top-0 bottom-0 w-6 -ml-3 cursor-ew-resize z-20 pointer-events-auto flex justify-center group/playhead"
              style={{ left: playheadX }}
              onPointerDown={onPlayheadDragStart}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 視覚的な線 */}
              <div className="w-0.5 h-full bg-red-600 shadow-[0_0_4px_rgba(255,0,0,0.5)] group-hover/playhead:w-1 transition-all" />
              {/* ハンドル (上部) */}
              <div className="absolute top-0 w-3 h-3 bg-red-600 rotate-45 -mt-1.5 shadow-sm" />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SheetMusicDisplay;
