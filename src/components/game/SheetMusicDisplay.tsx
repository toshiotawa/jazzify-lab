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
  
  // ドラッグ状態管理
  const pointerDragRef = useRef<{
    mode: 'sheet' | 'markerA' | 'markerB' | 'playhead';
    pointerId: number;
    startXPiece: number;
    moved: boolean;
  } | null>(null);
  
  const { currentTime, isPlaying, notes, musicXml, settings, abRepeat, currentSong } = useGameSelector((s) => ({
    currentTime: s.currentTime,
    isPlaying: s.isPlaying,
    notes: s.notes,
    musicXml: s.musicXml,
    settings: s.settings,
    abRepeat: s.abRepeat,
    currentSong: s.currentSong,
  }));
  const shouldRenderSheet = settings.showSheetMusic;
  
  const { seek, setABRepeatStart, setABRepeatEnd } = useGameActions();
  
  // 時刻(sec) → 楽譜上のX座標(px)
  const getXForTime = useCallback((timeSec: number): number | null => {
    const mapping = timeMappingRef.current;
    if (!mapping.length) return null;

    const timingAdjustmentSec = (settings.timingAdjustment ?? 0) / 1000;
    const targetMs = (timeSec + timingAdjustmentSec) * 1000;

    let low = 0;
    let high = mapping.length - 1;

    // targetMs 以下の最大 timeMs を持つエントリを探す
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (mapping[mid].timeMs <= targetMs) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const index = Math.max(0, Math.min(low - 1, mapping.length - 1));
    return mapping[index]?.xPosition ?? null;
  }, [settings.timingAdjustment]);

  // 楽譜上のX座標(px) → 時刻(sec)
  const getTimeForX = useCallback((xPiece: number): number | null => {
    const mapping = timeMappingRef.current;
    if (!mapping.length) return null;

    let low = 0;
    let high = mapping.length - 1;

    while (low <= high) {
      const mid = (low + high) >> 1;
      if (mapping[mid].xPosition <= xPiece) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const right = Math.min(low, mapping.length - 1);
    const left = Math.max(0, right - 1);

    let timeMs: number;
    if (left === right) {
      timeMs = mapping[left].timeMs;
    } else {
      // 線形補間でより滑らかに
      const xL = mapping[left].xPosition;
      const xR = mapping[right].xPosition;
      const tL = mapping[left].timeMs;
      const tR = mapping[right].timeMs;
      const ratio = xR === xL ? 0 : (xPiece - xL) / (xR - xL);
      timeMs = tL + (tR - tL) * ratio;
    }

    const timingAdjustmentSec = (settings.timingAdjustment ?? 0) / 1000;
    const timeSecWithAdj = timeMs / 1000;
    const originalTimeSec = timeSecWithAdj - timingAdjustmentSec;

    const duration = currentSong?.duration;
    const clamped =
      duration != null
        ? Math.max(0, Math.min(originalTimeSec, duration))
        : Math.max(0, originalTimeSec);

    return clamped;
  }, [settings.timingAdjustment, currentSong?.duration]);

  // クライアント座標(clientX) → 楽譜上のX座標(px)
  const clientXToPieceX = useCallback((clientX: number): number | null => {
    const container = scrollContainerRef.current;
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    const xViewport = clientX - rect.left;
    const xPiece = xViewport + container.scrollLeft;

    return xPiece;
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
      if (!shouldRenderSheet || mapping.length === 0 || !scrollContainerRef.current) {
        prevTimeRef.current = currentTime; // 早期returnでも更新
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

      // transform ではなく、外側コンテナの scrollLeft を更新する
      if ((needsIndexUpdate || seekingBack || forceAtZero || (!isPlaying && needsScrollUpdate)) && scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = scrollX;
        lastRenderedIndexRef.current = activeIndex;
        lastScrollXRef.current = scrollX;
      }

      prevTimeRef.current = currentTime;
    }, [currentTime, isPlaying, notes, shouldRenderSheet]);

    // ホイールスクロール制御（再生中のみ無効化）
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // 再生中のみスクロールを無効化
      if (isPlaying) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
      
      return () => {
        scrollContainer.removeEventListener('wheel', handleWheel);
      };
    }
  }, [isPlaying]);

  // ポインタイベントハンドラ
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!shouldRenderSheet) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return; // 右クリック等は無視

    const target = e.target as HTMLElement;
    let mode: 'sheet' | 'markerA' | 'markerB' | 'playhead' = 'sheet';

    if (target.dataset.marker === 'A') {
      mode = 'markerA';
    } else if (target.dataset.marker === 'B') {
      mode = 'markerB';
    } else if (target.dataset.playhead === '1') {
      mode = 'playhead';
    }

    // マーカー／プレイヘッドをドラッグする時はスクロールを止めたい
    if (mode !== 'sheet') {
      e.preventDefault();
    }

    const xPiece = clientXToPieceX(e.clientX);
    if (xPiece == null) return;

    pointerDragRef.current = {
      mode,
      pointerId: e.pointerId,
      startXPiece: xPiece,
      moved: false
    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [shouldRenderSheet, clientXToPieceX]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = pointerDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const xPiece = clientXToPieceX(e.clientX);
    if (xPiece == null) return;

    const dx = Math.abs(xPiece - drag.startXPiece);
    if (dx > 5) {
      drag.moved = true;
    }

    if (!drag.moved) return; // 少し動くまではドラッグ扱いにしない

    const newTime = getTimeForX(xPiece);
    if (newTime == null) return;

    switch (drag.mode) {
      case 'markerA':
        setABRepeatStart(newTime);
        break;
      case 'markerB':
        setABRepeatEnd(newTime);
        break;
      case 'playhead':
        seek(newTime);
        break;
      case 'sheet':
      default:
        // シートそのもののドラッグはスクロール操作として扱いたいので何もしない
        break;
    }
  }, [clientXToPieceX, getTimeForX, setABRepeatStart, setABRepeatEnd, seek]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = pointerDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);

    const wasMoved = drag.moved;
    const mode = drag.mode;
    const xPiece = clientXToPieceX(e.clientX);

    pointerDragRef.current = null;

    // ドラッグ完了時は move 中にすでに更新されているので何もしない
    if (wasMoved || xPiece == null) return;

    // 動かなかった場合＝タップ（クリック）として扱う
    const newTime = getTimeForX(xPiece);
    if (newTime == null) return;

    switch (mode) {
      case 'sheet':
        // シートの空白タップ → プレイヘッドをその位置へ
        seek(newTime);
        break;
      case 'markerA':
        setABRepeatStart(newTime);
        break;
      case 'markerB':
        setABRepeatEnd(newTime);
        break;
      case 'playhead':
        seek(newTime);
        break;
    }
  }, [clientXToPieceX, getTimeForX, seek, setABRepeatStart, setABRepeatEnd]);

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

  // ABリピートのX座標を計算
  const hasTimeMapping = timeMappingRef.current.length > 0;
  let abStartX: number | null = null;
  let abEndX: number | null = null;

  if (hasTimeMapping) {
    if (abRepeat.startTime != null) {
      abStartX = getXForTime(abRepeat.startTime);
    }
    if (abRepeat.endTime != null) {
      abEndX = getXForTime(abRepeat.endTime);
    }
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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
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
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 cursor-ew-resize"
        style={{ left: '120px' }}
        data-playhead="1"
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
            className="h-full relative"
            style={{ 
              minWidth: '3000px' // 十分な幅を確保
            }}
          >
          {/* ABリピート範囲のハイライト */}
          {abStartX != null && abEndX != null && abEndX > abStartX && (
            <div
              className="absolute top-0 bottom-0 bg-green-200/20 pointer-events-none z-5"
              style={{ left: abStartX, width: abEndX - abStartX }}
            />
          )}

          {/* A地点マーカー */}
          {abStartX != null && (
            <div
              data-marker="A"
              className="absolute top-0 bottom-0 w-1 bg-green-400 z-10 cursor-ew-resize"
              style={{ left: abStartX }}
            />
          )}

          {/* B地点マーカー */}
          {abEndX != null && (
            <div
              data-marker="B"
              className="absolute top-0 bottom-0 w-1 bg-red-400 z-10 cursor-ew-resize"
              style={{ left: abEndX }}
            />
          )}

          {/* OSMD本体 */}
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
