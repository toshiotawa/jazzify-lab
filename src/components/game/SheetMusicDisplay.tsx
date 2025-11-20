import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay';
import { useGameSelector, useGameActions } from '@/stores/helpers';
import { cn } from '@/utils/cn';
import { simplifyMusicXmlForDisplay } from '@/utils/musicXmlMapper';
import { log } from '@/utils/logger';
import { MdLoop } from 'react-icons/md';

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
 * 
 * 機能追加・修正:
 * 1. 停止中の自由なスクロール
 * 2. ABリピートの可視化とドラッグ操作
 * 3. 譜面タッチによるシーク（補間によるスムーズな操作）
 * 4. ヘッドのテキストを「PLAY」に変更
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
  const scaleFactorRef = useRef<number>(10);
  
  // timeMappingはアニメーションループで使うため、useRefで状態の即時反映を保証
  const timeMappingRef = useRef<TimeMappingEntry[]>([]);
  const mappingCursorRef = useRef<number>(0);
  
  // 前回時刻の保持用（巻き戻し検出用）
  const prevTimeRef = useRef(0);
  
  // インタラクション制御用
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);
  const dragTypeRef = useRef<'scroll' | 'loopA' | 'loopB' | 'playhead' | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // ストアから状態を取得
  const { currentTime, isPlaying, notes, musicXml, settings, abRepeat } = useGameSelector((s) => ({
    currentTime: s.currentTime,
    isPlaying: s.isPlaying,
    notes: s.notes,
    musicXml: s.musicXml,
    settings: s.settings,
    abRepeat: s.abRepeat,
  }));
  const shouldRenderSheet = settings.showSheetMusic;
  
  const gameActions = useGameActions(); 

  // X座標から時刻を取得するヘルパー関数（線形補間あり）
  // 要件3: 離散的ではなく滑らかに取得
  const getTimeFromX = useCallback((targetX: number): number => {
    const mapping = timeMappingRef.current;
    if (!mapping || mapping.length === 0) return 0;

    // 範囲外の処理
    if (targetX <= mapping[0].xPosition) return mapping[0].timeMs / 1000;
    if (targetX >= mapping[mapping.length - 1].xPosition) return mapping[mapping.length - 1].timeMs / 1000;

    // 二分探索で左側のインデックスを探す
    let low = 0;
    let high = mapping.length - 1;
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (mapping[mid].xPosition <= targetX) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    
    const leftIndex = Math.max(0, low - 1);
    const rightIndex = Math.min(mapping.length - 1, leftIndex + 1);
    
    const left = mapping[leftIndex];
    const right = mapping[rightIndex];

    // 完全一致または端の場合
    if (leftIndex === rightIndex || left.xPosition === right.xPosition) {
      return left.timeMs / 1000;
    }

    // 線形補間計算
    const ratio = (targetX - left.xPosition) / (right.xPosition - left.xPosition);
    const interpolatedTimeMs = left.timeMs + ratio * (right.timeMs - left.timeMs);

    return interpolatedTimeMs / 1000;
  }, []);

  // 時刻からX座標を取得するヘルパー関数（線形補間あり）
  // 要件3: 離散的ではなく滑らかに取得
  const getXFromTime = useCallback((targetTimeSec: number): number => {
    const mapping = timeMappingRef.current;
    if (!mapping || mapping.length === 0) return 0;
    
    const targetMs = targetTimeSec * 1000;

    // 範囲外の処理
    if (targetMs <= mapping[0].timeMs) return mapping[0].xPosition;
    if (targetMs >= mapping[mapping.length - 1].timeMs) return mapping[mapping.length - 1].xPosition;

    // 二分探索で左側のインデックスを探す
    let low = 0;
    let high = mapping.length - 1;
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (mapping[mid].timeMs <= targetMs) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    const leftIndex = Math.max(0, low - 1);
    const rightIndex = Math.min(mapping.length - 1, leftIndex + 1);

    const left = mapping[leftIndex];
    const right = mapping[rightIndex];

    // 完全一致または端の場合
    if (leftIndex === rightIndex || left.timeMs === right.timeMs) {
      return left.xPosition;
    }

    // 線形補間計算
    const ratio = (targetMs - left.timeMs) / (right.timeMs - left.timeMs);
    const interpolatedX = left.xPosition + ratio * (right.xPosition - left.xPosition);

    return interpolatedX;
  }, []);

  // OSMDの初期化とレンダリング (既存ロジック維持)
  const createTimeMapping = useCallback(() => {
    if (!osmdRef.current || !notes || notes.length === 0) {
      return;
    }

    const mapping: TimeMappingEntry[] = [];
    const graphicSheet = osmdRef.current.GraphicSheet;
    
    if (!graphicSheet || !graphicSheet.MusicPages || graphicSheet.MusicPages.length === 0) {
      return;
    }

    let noteIndex = 0;
    const osmdPlayableNotes = [];
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
                  if (!graphicNote.sourceNote || (graphicNote.sourceNote as any).isRest?.()) {
                    continue;
                  }
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
    
    const timingAdjustmentSec = (settings.timingAdjustment ?? 0) / 1000;
    for (const graphicNote of osmdPlayableNotes) {
      if (noteIndex < notes.length) {
        const note = notes[noteIndex];
        const positionAndShape = graphicNote.PositionAndShape as any;
        const noteHeadX = positionAndShape?.AbsolutePosition?.x;

        if (noteHeadX !== undefined) {
          let centerX = noteHeadX;
          if (positionAndShape?.BoundingBox?.width !== undefined) {
            const noteHeadWidth = positionAndShape.BoundingBox.width;
            centerX += noteHeadWidth / 2;
          }

          mapping.push({
            timeMs: (note.time + timingAdjustmentSec) * 1000,
            xPosition: centerX * scaleFactorRef.current
          });
        }
        noteIndex++;
      }
    }
    
    if (firstBeatX !== null) {
      mapping.unshift({
        timeMs: 0,
        xPosition: firstBeatX * scaleFactorRef.current
      });
    }
    
    timeMappingRef.current = mapping;
    mappingCursorRef.current = 0;
    lastRenderedIndexRef.current = -1;
    lastScrollXRef.current = 0;
  }, [notes, settings.timingAdjustment]);

  const loadAndRenderSheet = useCallback(async () => {
    if (!shouldRenderSheet) {
      if (osmdRef.current) osmdRef.current.clear();
      timeMappingRef.current = [];
      return;
    }

    if (!containerRef.current || !musicXml) {
      if (osmdRef.current) osmdRef.current.clear();
      timeMappingRef.current = [];
      setError(musicXml === '' ? '楽譜データがありません' : null);
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
      
      await osmdRef.current.load(processedMusicXml);
      osmdRef.current.render();

      if (settings.sheetMusicChordsOnly) {
        const noteEls = containerRef.current.querySelectorAll('[class*=notehead], [class*=rest], [class*=stem]');
        noteEls.forEach(el => {
          (el as HTMLElement).style.display = 'none';
        });
      }
      
      const svgElement = containerRef.current.querySelector('svg');
      const boundingBox = (osmdRef.current.GraphicSheet as any).BoundingBox;

      if (svgElement && boundingBox && boundingBox.width > 0) {
        const svgWidth = svgElement.width.baseVal.value;
        const osmdWidth = boundingBox.width;
        scaleFactorRef.current = svgWidth / osmdWidth;
      } else {
        scaleFactorRef.current = 10;
      }
      
      createTimeMapping();
      lastRenderedIndexRef.current = -1;
      lastScrollXRef.current = 0;
      
    } catch (err) {
      log.error('楽譜の読み込みまたはレンダリングエラー:', err);
      setError(err instanceof Error ? err.message : '楽譜の処理中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [shouldRenderSheet, musicXml, settings.simpleDisplayMode, settings.noteNameStyle, settings.sheetMusicChordsOnly, settings.transpose, createTimeMapping]);

  useEffect(() => {
    loadAndRenderSheet();
  }, [loadAndRenderSheet]);

  useEffect(() => {
    if (!shouldRenderSheet && osmdRef.current) {
      osmdRef.current.clear();
      timeMappingRef.current = [];
    }
  }, [shouldRenderSheet]);

  // ----------------------------------------------------------------
  // スクロール制御ロジックの刷新
  // ----------------------------------------------------------------

  // 再生状態が切り替わった時の処理
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const scoreWrapper = scoreWrapperRef.current;

    if (!scrollContainer || !scoreWrapper) return;

    if (!isPlaying) {
      // 停止時: Transformを解除し、ScrollLeftに値を移す（ネイティブスクロール有効化）
      const currentTransformX = lastScrollXRef.current;
      scoreWrapper.style.transform = 'none';
      scrollContainer.scrollLeft = currentTransformX;
      log.info(`⏸️ 停止: ScrollLeftを ${currentTransformX}px に設定し自由スクロールを有効化`);
    } else {
      // 再生開始時: 
      // 1. ★重要: まず現在のcurrentTimeに基づいてTransformを即座に適用する
      // これにより、scrollLeftが0になった瞬間に譜面が先頭に戻って見えるのを防ぐ
      const currentX = getXFromTime(currentTime);
      const playheadOffset = 120;
      const targetX = Math.max(0, currentX - playheadOffset);
      
      scoreWrapper.style.transform = `translateX(-${targetX}px)`;
      lastScrollXRef.current = targetX;
      
      // 2. その後、ScrollLeftを0に戻し、Transform制御モードへ移行
      scrollContainer.scrollLeft = 0;
      log.info(`▶️ 再生: Transformを ${targetX}px に初期設定し、ScrollLeftを0にリセット`);
    }
    // currentTimeは依存配列に入れない（再生開始の一瞬だけこのロジックを適用したいため）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, getXFromTime]);

  // 停止中のスクロール同期（シークバー操作用 - 要件3）
  useEffect(() => {
    if (isPlaying || !shouldRenderSheet || timeMappingRef.current.length === 0 || !scrollContainerRef.current) {
      return;
    }

    const playheadOffset = 120;
    const targetX = getXFromTime(currentTime);
    const targetScrollX = Math.max(0, targetX - playheadOffset);
    
    // 微小なズレは無視してDOM更新を減らす（パフォーマンス対策）
    if (Math.abs(scrollContainerRef.current.scrollLeft - targetScrollX) > 0.5) {
      scrollContainerRef.current.scrollLeft = targetScrollX;
      lastScrollXRef.current = targetScrollX;
    }
  }, [currentTime, isPlaying, shouldRenderSheet, getXFromTime]);

  // 再生中のスクロール同期 (Animation Loop)
  useEffect(() => {
    const mapping = timeMappingRef.current;
    if (!shouldRenderSheet || mapping.length === 0 || !scoreWrapperRef.current) {
      prevTimeRef.current = currentTime;
      return;
    }

    // 停止中は上記のuseEffectで制御するためリターン
    if (!isPlaying) {
      prevTimeRef.current = currentTime;
      return;
    }

    const currentTimeMs = currentTime * 1000;
    const playheadOffset = 120; // 画面左端からのオフセット

    // インデックス検索
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

    const activeIndex = Math.max(0, Math.min(findActiveIndex(), mapping.length - 1));
    mappingCursorRef.current = activeIndex;

    const targetEntry = mapping[activeIndex];
    if (!targetEntry) return;

    // 目標のスクロール位置
    const targetScrollX = Math.max(0, targetEntry.xPosition - playheadOffset);
    
    // 差分更新
    const needsScrollUpdate = Math.abs(targetScrollX - lastScrollXRef.current) > 0.5;
    const prev = prevTimeRef.current;
    const seekingBack = currentTime < prev - 0.1;
    const forceAtZero = currentTime < 0.02;

    if (scoreWrapperRef.current && (needsScrollUpdate || seekingBack || forceAtZero)) {
      // 再生中は transform で動かす (GPU加速)
      scoreWrapperRef.current.style.transform = `translateX(-${targetScrollX}px)`;
      lastScrollXRef.current = targetScrollX;
    }

    prevTimeRef.current = currentTime;
  }, [currentTime, isPlaying, shouldRenderSheet]);

  // ----------------------------------------------------------------
  // インタラクション制御 (ドラッグ、シーク、ABリピート)
  // ----------------------------------------------------------------

  // 座標計算ヘルパー
  const getScoreXFromEvent = (clientX: number) => {
    if (!scrollContainerRef.current || !scoreWrapperRef.current) return 0;
    const containerRect = scrollContainerRef.current.getBoundingClientRect();
    const relativeX = clientX - containerRect.left;
    
    if (isPlaying) {
      // 再生中: transform分を加算
      return relativeX + lastScrollXRef.current;
    } else {
      // 停止中: scrollLeft分を加算
      return relativeX + scrollContainerRef.current.scrollLeft;
    }
  };

  const handlePointerDown = (e: React.PointerEvent, type: 'scroll' | 'loopA' | 'loopB' | 'playhead') => {
    // 再生中はスクロール操作などを制限（誤操作防止）
    if (isPlaying && type === 'scroll') return;

    isDraggingRef.current = true;
    dragTypeRef.current = type;
    dragStartXRef.current = e.clientX;
    
    if (scrollContainerRef.current) {
      dragStartScrollLeftRef.current = scrollContainerRef.current.scrollLeft;
    }

    // テキスト選択防止
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - dragStartXRef.current;

    if (dragTypeRef.current === 'scroll' && scrollContainerRef.current && !isPlaying) {
      // スクロール操作 (停止中のみ)
      scrollContainerRef.current.scrollLeft = dragStartScrollLeftRef.current - deltaX;
    } else if (dragTypeRef.current === 'loopA' || dragTypeRef.current === 'loopB') {
      // ABリピートポイントの移動
      const scoreX = getScoreXFromEvent(e.clientX);
      const time = getTimeFromX(scoreX);
      
      if (dragTypeRef.current === 'loopA') {
        // AポイントはBポイントより前である必要あり
        if (abRepeat.endTime === null || time < abRepeat.endTime) {
          gameActions.setABRepeatStart(time);
        }
      } else {
        // BポイントはAポイントより後である必要あり
        if (abRepeat.startTime === null || time > abRepeat.startTime) {
          gameActions.setABRepeatEnd(time);
        }
      }
    } else if (dragTypeRef.current === 'playhead') {
      // プレイヘッドのドラッグ（要件3: 譜面も連動）
      const scoreX = getScoreXFromEvent(e.clientX);
      const time = getTimeFromX(scoreX);
      gameActions.updateTime(time);
      gameActions.seek(time);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    // タップ判定 (移動量が少ない場合)
    const moveDist = Math.abs(e.clientX - dragStartXRef.current);
    const isTap = moveDist < 5;

    if (isTap && dragTypeRef.current === 'scroll') {
      // 譜面背景をタップした場合 -> その位置へシーク
      const scoreX = getScoreXFromEvent(e.clientX);
      const time = getTimeFromX(scoreX);
      
      log.info(`👆 譜面タップ: シーク ${time.toFixed(2)}s (X:${scoreX.toFixed(0)})`);
      gameActions.updateTime(time);
      gameActions.seek(time);
    }

    isDraggingRef.current = false;
    dragTypeRef.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // ホイールスクロール制御 (停止中のみ許可)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isPlaying) {
        e.preventDefault();
      }
      // 停止中はデフォルトのスクロール動作を許可
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
      return () => scrollContainer.removeEventListener('wheel', handleWheel);
    }
  }, [isPlaying]);

  // ABリピートマーカーのX座標計算
  const loopAX = useMemo(() => abRepeat.startTime !== null ? getXFromTime(abRepeat.startTime) : null, [abRepeat.startTime, getXFromTime]);
  const loopBX = useMemo(() => abRepeat.endTime !== null ? getXFromTime(abRepeat.endTime) : null, [abRepeat.endTime, getXFromTime]);
  
  // プレイヘッドの現在位置X座標（停止中の表示用）
  const currentPlayheadX = useMemo(() => getXFromTime(currentTime), [currentTime, getXFromTime]);

  if (!shouldRenderSheet) {
    return (
      <div className={cn('flex items-center justify-center bg-slate-900 text-gray-400', className)}>
        楽譜表示はオフになっています
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "relative bg-white text-black select-none",
        // 再生中はスクロールバーを隠すか操作不能にするが、停止中はauto
        isPlaying ? "overflow-hidden" : "overflow-x-auto overflow-y-hidden",
        "custom-sheet-scrollbar",
        className
      )}
      ref={scrollContainerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      // コンテナ全体でのポインターイベント（スクロール・シーク用）
      onPointerDown={(e) => handlePointerDown(e, 'scroll')}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ touchAction: 'none' }} // ブラウザのデフォルトタッチ動作を無効化
    >
      {/* 固定位置のプレイヘッド（再生中用） - 赤い縦線 */}
      {isPlaying && (
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
          style={{ left: '120px' }}
        />
      )}
      
      <div className="relative h-full pt-8 pb-4" style={{ minWidth: '100%' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
            <div className="text-black">楽譜を読み込み中...</div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
            <div className="text-red-600">エラー: {error}</div>
          </div>
        )}

        {/* 楽譜コンテンツラッパー */}
        <div 
          ref={scoreWrapperRef}
          className="h-full relative"
          style={{ 
            willChange: isPlaying ? 'transform' : 'auto',
            minWidth: '3000px',
            transformOrigin: 'left center'
          }}
        >
          {/* OSMDレンダリング先 */}
          <div ref={containerRef} className="h-full flex items-center" />

          {/* オーバーレイヤー (マーカー等) */}
          <div className="absolute inset-0 pointer-events-none">
            
            {/* 停止中のプレイヘッド表示 (譜面上に追従) */}
            {!isPlaying && (
              <div 
                className="absolute top-0 bottom-0 w-1 bg-red-500 z-20 cursor-ew-resize pointer-events-auto hover:w-2 transition-all opacity-70"
                style={{ left: `${currentPlayheadX}px` }}
                onPointerDown={(e) => {
                  e.stopPropagation(); // 親のスクロール開始を防ぐ
                  handlePointerDown(e, 'playhead');
                }}
                title="再生位置 (ドラッグで移動)"
              >
                {/* 要件2: Head -> PLAY に変更 */}
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-1 rounded font-bold">
                  PLAY
                </div>
              </div>
            )}

            {/* ABリピート区間のハイライト (要件4: 塗りつぶし、ループON時は濃く) */}
            {loopAX !== null && loopBX !== null && (
              <div 
                className={cn(
                  "absolute top-0 bottom-0 pointer-events-none transition-colors duration-300",
                  abRepeat.enabled ? "bg-green-500/20" : "bg-blue-400/10"
                )}
                style={{ left: `${loopAX}px`, width: `${Math.max(0, loopBX - loopAX)}px` }}
              />
            )}

            {/* ABリピート: Aマーカー */}
            {loopAX !== null && (
              <div 
                className="absolute top-0 bottom-0 w-1 bg-blue-500 z-20 cursor-ew-resize pointer-events-auto hover:w-2 transition-all"
                style={{ left: `${loopAX}px` }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handlePointerDown(e, 'loopA');
                }}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 rounded font-bold">
                  A
                </div>
              </div>
            )}

            {/* ABリピート: Bマーカー */}
            {loopBX !== null && (
              <div 
                className="absolute top-0 bottom-0 w-1 bg-green-500 z-20 cursor-ew-resize pointer-events-auto hover:w-2 transition-all"
                style={{ left: `${loopBX}px` }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handlePointerDown(e, 'loopB');
                }}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 rounded font-bold">
                  B
                </div>
              </div>
            )}

            {/* ループON/OFFボタン (要件4: B地点の左側に) */}
            {loopBX !== null && (
              <button
                className={cn(
                  "absolute top-2 z-30 pointer-events-auto p-1 rounded-full shadow-sm transition-all hover:scale-110",
                  abRepeat.enabled 
                    ? "bg-green-500 text-white" 
                    : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                )}
                style={{ left: `${loopBX - 28}px` }} // B地点の少し左
                onClick={(e) => {
                  e.stopPropagation();
                  gameActions.toggleABRepeat();
                }}
                title={abRepeat.enabled ? "ループOFF" : "ループON"}
              >
                <MdLoop size={14} />
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default SheetMusicDisplay;
