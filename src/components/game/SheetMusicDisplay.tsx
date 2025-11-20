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
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const lastRenderedIndexRef = useRef<number>(-1);
  const lastScrollXRef = useRef(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scaleFactorRef = useRef<number>(10); // デフォルトは以前のマジックナンバー
  
  // timeMappingはアニメーションループで使うため、useRefで状態の即時反映を保証
  const timeMappingRef = useRef<TimeMappingEntry[]>([]);
  const mappingCursorRef = useRef<number>(0);
  
  // 前回時刻の保持用（巻き戻し検出用）
  const prevTimeRef = useRef(0);
  
  // ホイールスクロール制御用
  const [isHovered, setIsHovered] = useState(false);
  
  // ABリピートドラッグ用
  const [dragging, setDragging] = useState<null | 'start' | 'end'>(null);
  
  const { currentTime, isPlaying, notes, musicXml, settings } = useGameSelector((s) => ({
    currentTime: s.currentTime,
    isPlaying: s.isPlaying,
    notes: s.notes,
    musicXml: s.musicXml,
    settings: s.settings, // 簡易表示設定を取得
  }));
  const shouldRenderSheet = settings.showSheetMusic;
  
  const gameActions = useGameActions();
  
  // ABリピート状態を取得
  const { abRepeat } = useGameSelector((s) => ({
    abRepeat: s.abRepeat,
  }));
  
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
    
    log.info(`📊 OSMD Note Extraction Summary:
    OSMD playable notes: ${osmdPlayableNoteCount}
    JSON notes count: ${notes.length}
    Mapped notes: ${mapping.length}
    Match status: ${osmdPlayableNoteCount === notes.length ? '✅ Perfect match!' : '❌ Mismatch!'}`);
    
    if (osmdPlayableNoteCount !== notes.length) {
      log.error(`ノート数の不一致: OSMD(${osmdPlayableNoteCount}) vs JSON(${notes.length}). プレイヘッドがずれる可能性があります。`);
    }
    
    timeMappingRef.current = mapping; // refを更新
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
      const svgElement = containerRef.current.querySelector('svg');
      const boundingBox = (osmdRef.current.GraphicSheet as any).BoundingBox;

      if (svgElement && boundingBox && boundingBox.width > 0) {
        // レンダリングされたSVGの実際のピクセル幅とOSMDの内部的な幅からスケールを算出
        const svgWidth = svgElement.width.baseVal.value;
        const osmdWidth = boundingBox.width;
        scaleFactorRef.current = svgWidth / osmdWidth;
        log.info(`✅ OSMD scale factor calculated: ${scaleFactorRef.current} (SVG: ${svgWidth}px, BBox: ${osmdWidth})`);
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

  // 音符の時刻とX座標のマッピングを作成
    // 注: 以下のコードは transform 方式のスクロールでは効果が薄く、意図しないジャンプの原因になるためコメントアウト
    // useEffect(() => {
    //   if (isPlaying && scrollContainerRef.current) {
    //     scrollContainerRef.current.scrollLeft = 0;
    //     log.info('🎵 楽譜スクロールを開始位置にリセット');
    //   }
    // }, [isPlaying]);

    // currentTimeが変更されるたびにスクロール位置を更新（音符単位でジャンプ）
    useEffect(() => {
      const mapping = timeMappingRef.current;
      if (!shouldRenderSheet || mapping.length === 0 || !scoreWrapperRef.current) {
        prevTimeRef.current = currentTime; // 早期returnでも更新
        return;
      }

      // 🔸停止中は自動スクロールしない（手動スクロールだけ許可）
      if (!isPlaying) {
        prevTimeRef.current = currentTime;
        return;
      }

      const currentTimeMs = currentTime * 1000;

      // 修正箇所: インデックス検索ロジックの簡素化と修正
      const findActiveIndex = () => {
        let low = 0;
        let high = mapping.length - 1;
        
        // currentTimeMs 以下の最大の timeMs を持つインデックスを探す（UpperBound の変形）
        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          if (mapping[mid].timeMs <= currentTimeMs) {
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }
        // low は「次に演奏されるべき音符」のインデックスになっているため、
        // その1つ前が「現在演奏中の音符」となります。
        return low - 1;
      };

      // 計算されたインデックスを取得（範囲外ならクランプ）
      const rawIndex = findActiveIndex();
      const activeIndex = Math.max(0, Math.min(rawIndex, mapping.length - 1));

      mappingCursorRef.current = activeIndex;

      const targetEntry = mapping[activeIndex];
      const playheadPosition = 120;
      
      // targetEntryが存在しない場合のガード処理を追加
      if (!targetEntry) return;

      const scrollX = Math.max(0, targetEntry.xPosition - playheadPosition);

      const needsIndexUpdate = activeIndex !== lastRenderedIndexRef.current;
      const needsScrollUpdate = Math.abs(scrollX - lastScrollXRef.current) > 0.5;

      // 巻き戻しや0秒付近へジャンプした時は、再生中でも強制更新
      const prev = prevTimeRef.current;
      const seekingBack = currentTime < prev - 0.1; // 100ms以上の巻き戻し
      const forceAtZero = currentTime < 0.02;       // 0秒付近

      if ((needsIndexUpdate || seekingBack || forceAtZero || needsScrollUpdate) && scoreWrapperRef.current) {
        scoreWrapperRef.current.style.transform = `translateX(-${scrollX}px)`;
        lastRenderedIndexRef.current = activeIndex;
        lastScrollXRef.current = scrollX;
      }

      prevTimeRef.current = currentTime;
    }, [currentTime, isPlaying, notes, shouldRenderSheet]);
    
    // 🔸再生→停止時にtransformをscrollLeftに移す
    useEffect(() => {
      const container = scrollContainerRef.current;
      const wrapper = scoreWrapperRef.current;
      if (!container || !wrapper) return;

      if (!isPlaying) {
        // 🔸停止時: transform 分を scrollLeft に加算して、transform を 0 に戻す
        const autoScrollX = lastScrollXRef.current;
        if (autoScrollX !== 0) {
          container.scrollLeft = container.scrollLeft + autoScrollX;
          wrapper.style.transform = 'translateX(0px)';
          lastScrollXRef.current = 0;
        }
      } else {
        // 🔸再生開始時: 手動スクロールの影響をリセットして、自動スクロールに戻す
        container.scrollLeft = 0;
        wrapper.style.transform = 'translateX(0px)';
        lastRenderedIndexRef.current = -1;
        lastScrollXRef.current = 0;
      }
    }, [isPlaying]);

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

  // 🔸時間（秒）→ X座標（px）変換関数
  const getXFromTimeSec = useCallback((timeSec: number | null): number | null => {
    if (timeSec == null) return null;
    const mapping = timeMappingRef.current;
    if (!mapping.length) return null;

    const targetMs = timeSec * 1000;

    // timeMs <= targetMs の最大インデックスを探す
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

    const i = Math.max(0, Math.min(high, mapping.length - 1));
    const curr = mapping[i];
    const next = mapping[i + 1];

    if (!next || next.timeMs === curr.timeMs) {
      return curr.xPosition;
    }

    // 線形補間
    const ratio = (targetMs - curr.timeMs) / (next.timeMs - curr.timeMs);
    return curr.xPosition + (next.xPosition - curr.xPosition) * ratio;
  }, []);

  // 🔸X座標（px）→ 時間（秒）変換関数
  const getTimeSecFromX = useCallback((x: number): number | null => {
    const mapping = timeMappingRef.current;
    if (!mapping.length) return null;

    // xPosition <= x の最大インデックスを探す
    let low = 0;
    let high = mapping.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (mapping[mid].xPosition <= x) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const i = Math.max(0, Math.min(high, mapping.length - 1));
    const curr = mapping[i];
    const next = mapping[i + 1];

    if (!next || next.xPosition === curr.xPosition) {
      return curr.timeMs / 1000;
    }

    const ratio = (x - curr.xPosition) / (next.xPosition - curr.xPosition);
    const timeMs = curr.timeMs + (next.timeMs - curr.timeMs) * ratio;
    return timeMs / 1000;
  }, []);

  // 🔸ABリピートドラッグハンドラー
  const onHandlePointerDown = useCallback((type: 'start' | 'end') =>
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isPlaying) return; // 再生中はロック
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(type);
    }, [isPlaying]);

  // 🔸ABリピートドラッグ処理
  useEffect(() => {
    if (!dragging) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const xInView = e.clientX - rect.left;
      // 停止中は transform を 0 にしているので scrollLeft だけ考慮すればOK
      const osmdX = xInView + container.scrollLeft;
      const timeSec = getTimeSecFromX(osmdX);
      if (timeSec == null) return;

      if (dragging === 'start') {
        gameActions.setABRepeatStart(timeSec);
      } else {
        gameActions.setABRepeatEnd(timeSec);
      }
    };

    const handleUp = () => {
      setDragging(null);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [dragging, getTimeSecFromX, gameActions]);

  // 🔸楽譜タップでシーク
  const handleScoreClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!scrollContainerRef.current) return;

      // 再生中でもシークして良いなら isPlaying チェックは外す
      // ひとまず「停止中のみ」にする
      if (isPlaying) return;

      const container = scrollContainerRef.current;
      const rect = container.getBoundingClientRect();
      const xInView = e.clientX - rect.left;

      // 停止中は transform を解除しているので scrollLeft だけ考えればOK
      const osmdX = xInView + container.scrollLeft;
      const timeSec = getTimeSecFromX(osmdX);

      if (timeSec == null) return;

      // 念のため範囲をクリップ
      const safeTime = Math.max(0, timeSec);
      gameActions.seek(safeTime);
    },
    [isPlaying, gameActions, getTimeSecFromX]
  );

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

  return (
    <div 
      className={cn(
        "relative bg-white text-black",
        // 再生中は横スクロール無効、停止中は横スクロール有効
        isPlaying ? "overflow-hidden" : "overflow-x-auto overflow-y-hidden",
        // カスタムスクロールバースタイルを適用
        "custom-sheet-scrollbar",
        className
      )}
      ref={scrollContainerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        // WebKit系ブラウザ用のカスタムスクロールバー
        ...(!isPlaying && {
          '--scrollbar-width': '8px',
          '--scrollbar-track-color': '#f3f4f6',
          '--scrollbar-thumb-color': '#9ca3af',
          '--scrollbar-thumb-hover-color': '#6b7280'
        })
      } as React.CSSProperties}
    >
      {/* プレイヘッド（赤い縦線） */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
        style={{ left: '120px' }}
      />
      
      {/* 楽譜コンテナ - 上部に余白を追加 */}
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
        
        {/* OSMDレンダリング用コンテナ */}
          <div 
            ref={scoreWrapperRef}
            onClick={handleScoreClick}
            className={cn(
              "h-full relative",
              // 停止中は手動スクロール時の移動を滑らかにする
              !isPlaying ? "transition-transform duration-100 ease-out" : ""
            )}
            style={{ 
              willChange: isPlaying ? 'transform' : 'auto',
              minWidth: '3000px' // 十分な幅を確保
            }}
          >
          {/* 🔸ABリピート帯とライン */}
          {(() => {
            const aX = getXFromTimeSec(abRepeat.startTime);
            const bX = getXFromTimeSec(abRepeat.endTime);
            const left = aX != null && bX != null ? Math.min(aX, bX) : null;
            const width = aX != null && bX != null ? Math.abs(bX - aX) : null;
            
            return (
              <>
                {/* AB帯 */}
                {abRepeat.enabled && left != null && width != null && (
                  <div
                    className="absolute inset-y-4 bg-blue-400/15 pointer-events-none z-20"
                    style={{ left, width }}
                  />
                )}

                {/* A ライン */}
                {abRepeat.startTime != null && (
                  <>
                    <div
                      className="absolute inset-y-2 w-0.5 bg-blue-400 pointer-events-none z-20"
                      style={{ left: aX ?? 0 }}
                    />
                    {/* A ハンドル（ドラッグ可能） */}
                    {!isPlaying && (
                      <div
                        className="absolute top-1 bottom-1 w-3 -ml-1.5 bg-blue-500/80 rounded-full cursor-ew-resize z-30 hover:bg-blue-500"
                        style={{ left: aX ?? 0 }}
                        onPointerDown={onHandlePointerDown('start')}
                        title={`A地点: ${abRepeat.startTime.toFixed(2)}秒`}
                      />
                    )}
                  </>
                )}

                {/* B ライン */}
                {abRepeat.endTime != null && (
                  <>
                    <div
                      className="absolute inset-y-2 w-0.5 bg-blue-400 pointer-events-none z-20"
                      style={{ left: bX ?? 0 }}
                    />
                    {/* B ハンドル（ドラッグ可能） */}
                    {!isPlaying && (
                      <div
                        className="absolute top-1 bottom-1 w-3 -ml-1.5 bg-blue-500/80 rounded-full cursor-ew-resize z-30 hover:bg-blue-500"
                        style={{ left: bX ?? 0 }}
                        onPointerDown={onHandlePointerDown('end')}
                        title={`B地点: ${abRepeat.endTime.toFixed(2)}秒`}
                      />
                    )}
                  </>
                )}
              </>
            );
          })()}
          
          <div 
            ref={containerRef} 
            className="h-full flex items-center"
          />
        </div>
      </div>
      
      {/* カスタムスクロールバー用のスタイル - CSS外部化により削除 */}
    </div>
  );
};

export default SheetMusicDisplay;
