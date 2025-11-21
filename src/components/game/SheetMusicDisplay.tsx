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
 */
const SheetMusicDisplay: React.FC<SheetMusicDisplayProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scoreWrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null); // プレイヘッドへの参照を追加
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

  // ドラッグ操作用の状態
  const [isDraggingMarker, setIsDraggingMarker] = useState<'A' | 'B' | null>(null);

  const { currentTime, isPlaying, notes, musicXml, settings, abRepeat } = useGameSelector((s) => ({
    currentTime: s.currentTime,
    isPlaying: s.isPlaying,
    notes: s.notes,
    musicXml: s.musicXml,
    settings: s.settings,
    abRepeat: s.abRepeat, // ループ情報を取得
  }));
  
  const { setABRepeatStart, setABRepeatEnd } = useGameActions(); // アクションを取得
  const shouldRenderSheet = settings.showSheetMusic;

  // 時間からX座標を取得するヘルパー
  const getXForTime = useCallback((time: number) => {
    const mapping = timeMappingRef.current;
    if (!mapping || mapping.length === 0) return 0;
    
    const timeMs = time * 1000;
    // 二分探索または近似値の検索
    let low = 0;
    let high = mapping.length - 1;
    let closestIndex = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (mapping[mid].timeMs <= timeMs) {
        closestIndex = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    
    // 補間計算（より滑らかな移動のため）
    const entry = mapping[closestIndex];
    const nextEntry = mapping[closestIndex + 1];
    
    if (entry && nextEntry) {
      const ratio = (timeMs - entry.timeMs) / (nextEntry.timeMs - entry.timeMs);
      return entry.xPosition + (nextEntry.xPosition - entry.xPosition) * ratio;
    }
    
    return entry ? entry.xPosition : 0;
  }, []);

  // X座標から時間を取得するヘルパー（ドラッグ用）
  const getTimeForX = useCallback((x: number) => {
    const mapping = timeMappingRef.current;
    if (!mapping || mapping.length === 0) return 0;

    // 最も近いX座標を探す
    let minDist = Infinity;
    let closestTimeMs = 0;

    // 単純な線形探索（要素数はそれほど多くないので十分高速）
    for (let i = 0; i < mapping.length; i++) {
      const dist = Math.abs(mapping[i].xPosition - x);
      if (dist < minDist) {
        minDist = dist;
        closestTimeMs = mapping[i].timeMs;
      }
    }
    return closestTimeMs / 1000;
  }, []);
  
  // OSMDの初期化とレンダリング
  const createTimeMapping = useCallback(() => {
    if (!osmdRef.current || !notes || notes.length === 0) {
      log.warn('タイムマッピング作成スキップ: OSMD未初期化またはノートデータなし');
      return;
    }

    const mapping: TimeMappingEntry[] = [];
    const graphicSheet = osmdRef.current.GraphicSheet;
    
    if (!graphicSheet || !graphicSheet.MusicPages || graphicSheet.MusicPages.length === 0) {
      log.warn('楽譜のグラフィック情報が取得できません');
      return;
    }

    let noteIndex = 0;
    let osmdPlayableNoteCount = 0;
    
    log.info(`📊 OSMD Note Extraction Starting: ${notes.length} JSON notes to match`);
    
    // 全ての音符を走査して演奏可能なノートのみを抽出
    const osmdPlayableNotes = [];
    let firstBeatX: number | null = null; // 最初の小節1拍目のX座標
    
    for (const page of graphicSheet.MusicPages) {
      for (const system of page.MusicSystems) {
        for (const staffLine of system.StaffLines) {
          for (const measure of staffLine.Measures) {
            for (const staffEntry of measure.staffEntries) {
              // 最初に見つかった StaffEntry のX座標（実質1小節目1拍目）を拾う
              const sePos = (staffEntry as any)?.PositionAndShape?.AbsolutePosition?.x;
              if (typeof sePos === 'number') {
                if (firstBeatX === null || sePos < firstBeatX) {
                  firstBeatX = sePos;
                }
              }
              
              for (const voice of staffEntry.graphicalVoiceEntries) {
                for (const graphicNote of voice.notes) {
                  // isRest() が true、または sourceNote がない場合は休符と見なす
                  if (!graphicNote.sourceNote || (graphicNote.sourceNote as any).isRest?.()) {
                    continue;
                  }
                  
                  // タイで結ばれた後続音符はスキップ (OSMDの公式な方法)
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
    
    osmdPlayableNoteCount = osmdPlayableNotes.length;

    // マッピングを作成
      const timingAdjustmentSec = (settings.timingAdjustment ?? 0) / 1000;
      for (const graphicNote of osmdPlayableNotes) {
                  if (noteIndex < notes.length) {
                    const note = notes[noteIndex];
                    // 音符の中心X座標を計算
                    const positionAndShape = graphicNote.PositionAndShape as any;
                    const noteHeadX = positionAndShape?.AbsolutePosition?.x;

                    if (noteHeadX !== undefined) {
                      let centerX = noteHeadX;
                      // BoundingBox が存在し、widthが定義されている場合のみ幅を考慮して中心を計算
                      if (positionAndShape?.BoundingBox?.width !== undefined) {
                        const noteHeadWidth = positionAndShape.BoundingBox.width;
                        centerX += noteHeadWidth / 2;
                      }

                        mapping.push({
                          timeMs: (note.time + timingAdjustmentSec) * 1000,
                          // 動的に計算したスケール係数を使用
                          xPosition: centerX * scaleFactorRef.current
                        });
                    }
                    noteIndex++;
      }
    }
    
    // 0ms → 1小節目1拍目（小節頭）のアンカーを先頭に追加
    if (firstBeatX !== null) {
      mapping.unshift({
        timeMs: 0,
        xPosition: firstBeatX * scaleFactorRef.current
      });
      log.info(`✅ 小節頭アンカー追加: 0ms → X=${firstBeatX * scaleFactorRef.current}px`);
    }
    
    // 曲の終わりの位置を推定して追加（スクロール余白のため）
    if (mapping.length > 0) {
      const last = mapping[mapping.length - 1];
      // 最後の音符から少し先を「終了地点」とする
      mapping.push({
        timeMs: last.timeMs + 2000, // +2秒
        xPosition: last.xPosition + 200 // +200px (概算)
      });
    }
    
    log.info(`📊 OSMD Note Extraction Summary:
    OSMD playable notes: ${osmdPlayableNoteCount}
    JSON notes count: ${notes.length}
    Mapped notes: ${mapping.length}
    Match status: ${osmdPlayableNoteCount === notes.length ? '✅ Perfect match!' : '❌ Mismatch!'}`);
    
    if (osmdPlayableNoteCount !== notes.length) {
      log.error(`ノート数の不一致: OSMD(${osmdPlayableNoteCount}) vs JSON(${notes.length}). プレイヘッドがずれる可能性があります。`);
    }
    
    timeMappingRef.current = mapping;
    mappingCursorRef.current = 0;
    lastRenderedIndexRef.current = -1;
    lastScrollXRef.current = 0;
    }, [notes, settings.timingAdjustment]);

  const loadAndRenderSheet = useCallback(async () => {
    if (!shouldRenderSheet) {
      if (osmdRef.current) {
        osmdRef.current.clear();
      }
      timeMappingRef.current = [];
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
      mappingCursorRef.current = 0;
    }
  }, [shouldRenderSheet]);

  // スクロールとプレイヘッド制御（修正版）
  useEffect(() => {
    const mapping = timeMappingRef.current;
    const scrollContainer = scrollContainerRef.current;
    const wrapper = scoreWrapperRef.current;
    const playhead = playheadRef.current;

    if (!shouldRenderSheet || mapping.length === 0 || !wrapper || !scrollContainer || !playhead) {
      prevTimeRef.current = currentTime;
      return;
    }

    // 現在時刻に対応するX座標を取得
    const targetX = getXForTime(currentTime);
    
    // プレイヘッドの固定位置（画面左からのオフセット）
    const playheadOffset = 120;
    
    // 目標とするスクロール位置（プレイヘッドが固定位置に来るように）
    const targetScrollX = Math.max(0, targetX - playheadOffset);
    
    // 実際にスクロール可能な最大幅
    const maxScrollX = scrollContainer.scrollWidth - scrollContainer.clientWidth;
    
    // 実際のスクロール位置（最大値を超えないように制限）
    const actualScrollX = Math.min(targetScrollX, maxScrollX);
    
    // スクロールが限界に達した場合、プレイヘッド自体を右に移動させる
    // プレイヘッドの表示位置 = 固定オフセット + (目標スクロール - 実際スクロール)
    const actualPlayheadLeft = playheadOffset + (targetScrollX - actualScrollX);

    // DOM更新
    if (isPlaying) {
      // 再生中は transform で滑らかに移動
      wrapper.style.transform = `translateX(-${actualScrollX}px)`;
      // scrollLeft は 0 に保つ（transformと競合させないため）
      if (scrollContainer.scrollLeft !== 0) scrollContainer.scrollLeft = 0;
    } else {
      // 停止中は scrollLeft で移動（手動スクロールと互換性を持たせるため）
      wrapper.style.transform = 'translateX(0px)';
      if (Math.abs(scrollContainer.scrollLeft - actualScrollX) > 1) {
        scrollContainer.scrollLeft = actualScrollX;
      }
    }

    // プレイヘッド位置の更新
    playhead.style.left = `${actualPlayheadLeft}px`;

    lastScrollXRef.current = actualScrollX;
    prevTimeRef.current = currentTime;

  }, [currentTime, isPlaying, shouldRenderSheet, getXForTime]);

  // ドラッグハンドラー
  const handleOverlayPointerDown = (e: React.PointerEvent, type: 'A' | 'B') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMarker(type);
    
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.setPointerCapture(e.pointerId);
    }
  };

  const handleOverlayPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingMarker || !scrollContainerRef.current) return;
    
    const rect = scrollContainerRef.current.getBoundingClientRect();
    // コンテナ内の相対X座標 + 現在のスクロール量 = 全体でのX座標
    // 再生中は transform でずれているので補正が必要
    const scrollX = isPlaying 
      ? lastScrollXRef.current 
      : scrollContainerRef.current.scrollLeft;
      
    const x = e.clientX - rect.left + scrollX;
    const time = getTimeForX(x);
    
    if (isDraggingMarker === 'A') {
      setABRepeatStart(time);
    } else {
      setABRepeatEnd(time);
    }
  };

  const handleOverlayPointerUp = (e: React.PointerEvent) => {
    if (isDraggingMarker && scrollContainerRef.current) {
      scrollContainerRef.current.releasePointerCapture(e.pointerId);
    }
    setIsDraggingMarker(null);
  };

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

  // ループマーカーの位置計算
  const loopAX = abRepeat.startTime !== null ? getXForTime(abRepeat.startTime) : null;
  const loopBX = abRepeat.endTime !== null ? getXForTime(abRepeat.endTime) : null;

  return (
    <div className={cn('relative', className)}>
      {/* プレイヘッド（赤い縦線） - 動的にleftを変更 */}
      <div 
        ref={playheadRef}
        className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 transition-none"
        style={{ left: '120px' }}
        aria-hidden="true"
      />

      <div 
        className={cn(
          "h-full bg-white text-black relative",
          isPlaying ? "overflow-hidden" : "overflow-x-auto overflow-y-hidden",
          "custom-sheet-scrollbar"
        )}
        ref={scrollContainerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onPointerMove={handleOverlayPointerMove}
        onPointerUp={handleOverlayPointerUp}
        style={{ touchAction: 'pan-y' }}
      >
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
          
          {/* 楽譜ラッパー */}
          <div 
            ref={scoreWrapperRef}
            className={cn(
              "h-full relative",
              !isPlaying ? "transition-transform duration-100 ease-out" : ""
            )}
            style={{ minWidth: '3000px' }}
          >
            <div ref={containerRef} className="h-full flex items-center" />

            {/* ループオーバーレイレイヤー（楽譜の上に表示、スクロールと一緒に動く） */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              {/* ループ範囲の塗りつぶし */}
              {loopAX !== null && loopBX !== null && (
                <div 
                  className={cn(
                    "absolute top-0 bottom-0 transition-colors",
                    abRepeat.enabled ? "bg-green-500/20" : "bg-gray-400/10"
                  )}
                  style={{ 
                    left: `${loopAX}px`, 
                    width: `${Math.max(0, loopBX - loopAX)}px` 
                  }}
                />
              )}

              {/* A地点マーカー */}
              {loopAX !== null && (
                <div 
                  className="absolute top-0 bottom-0 w-4 cursor-ew-resize pointer-events-auto group flex flex-col items-center"
                  style={{ left: `${loopAX - 8}px` }}
                  onPointerDown={(e) => handleOverlayPointerDown(e, 'A')}
                >
                  <div className="w-0.5 h-full bg-green-600 group-hover:w-1 group-hover:bg-green-500 transition-all shadow-sm" />
                  <div className="absolute top-0 bg-green-600 text-white text-[10px] px-1 rounded-b">A</div>
                </div>
              )}

              {/* B地点マーカー */}
              {loopBX !== null && (
                <div 
                  className="absolute top-0 bottom-0 w-4 cursor-ew-resize pointer-events-auto group flex flex-col items-center"
                  style={{ left: `${loopBX - 8}px` }}
                  onPointerDown={(e) => handleOverlayPointerDown(e, 'B')}
                >
                   <div className="w-0.5 h-full bg-red-600 group-hover:w-1 group-hover:bg-red-500 transition-all shadow-sm" />
                   <div className="absolute bottom-0 bg-red-600 text-white text-[10px] px-1 rounded-t">B</div>
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
