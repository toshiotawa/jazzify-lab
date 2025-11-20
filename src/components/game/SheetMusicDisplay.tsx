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
  
  const PLAYHEAD_X = 120;
  
  // タップ状態管理
  const tapStateRef = useRef<{ x: number; y: number; t: number } | null>(null);
  
  // x→time, time→x の相互変換
  const xToTime = useCallback((x: number) => {
    const mapping = timeMappingRef.current;
    if (!mapping.length) return 0;
    // xに対する下限要素を二分探索
    let low = 0, high = mapping.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (mapping[mid].xPosition <= x) low = mid + 1;
      else high = mid - 1;
    }
    const i2 = Math.min(mapping.length - 1, Math.max(1, low));
    const i1 = i2 - 1;
    const m1 = mapping[i1], m2 = mapping[i2];
    const ratio = m2.xPosition === m1.xPosition ? 0 : (x - m1.xPosition) / (m2.xPosition - m1.xPosition);
    const t = (m1.timeMs + (m2.timeMs - m1.timeMs) * Math.min(1, Math.max(0, ratio))) / 1000;
    return Math.max(0, t);
  }, []);

  const timeToX = useCallback((tSec: number | null) => {
    if (tSec == null) return null;
    const tMs = tSec * 1000;
    const mapping = timeMappingRef.current;
    if (!mapping.length) return 0;
    let low = 0, high = mapping.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (mapping[mid].timeMs <= tMs) low = mid + 1;
      else high = mid - 1;
    }
    const i2 = Math.min(mapping.length - 1, Math.max(1, low));
    const i1 = i2 - 1;
    const m1 = mapping[i1], m2 = mapping[i2];
    const ratio = m2.timeMs === m1.timeMs ? 0 : (tMs - m1.timeMs) / (m2.timeMs - m1.timeMs);
    return m1.xPosition + (m2.xPosition - m1.xPosition) * Math.min(1, Math.max(0, ratio));
  }, []);
  
  const getContentXFromEvent = useCallback((clientX: number) => {
    // 画面内X → 楽譜内Xに変換（transform中/scroll中どちらでも lastScrollX を足せば整合）
    const sc = scrollContainerRef.current;
    if (!sc) return 0;
    const rect = sc.getBoundingClientRect();
    const localX = clientX - rect.left;
    return Math.max(0, lastScrollXRef.current + localX);
  }, []);
  
  const startDragMarker = useCallback((e: React.PointerEvent, which: 'a' | 'b') => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    (e.currentTarget as HTMLElement).style.touchAction = 'none';
    
    const onMove = (ev: PointerEvent) => {
      const contentX = getContentXFromEvent(ev.clientX);
      const t = xToTime(contentX);
      // A<=B制約
      if (which === 'a' && abRepeat.b != null && t > abRepeat.b) {
        gameActions.setABPoint('b', t);
      }
      if (which === 'b' && abRepeat.a != null && t < abRepeat.a) {
        gameActions.setABPoint('a', t);
      }
      gameActions.setABPoint(which, t);
    };
    const onUp = () => {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      (e.currentTarget as HTMLElement).style.touchAction = '';
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }, [xToTime, getContentXFromEvent, gameActions, abRepeat]);
  
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

  // 停止/再生の切り替え時に transform ↔ scrollLeft を切替
  useEffect(() => {
    if (!shouldRenderSheet || !scoreWrapperRef.current || !scrollContainerRef.current) return;
    if (!isPlaying) {
      // 停止に入ったら transform を解除して scrollLeft に引き継ぐ
      scoreWrapperRef.current.style.transform = '';
      scrollContainerRef.current.scrollLeft = lastScrollXRef.current;
    } else {
      // 再生に入ったら、現在の scrollLeft を transform の起点にする
      lastScrollXRef.current = scrollContainerRef.current.scrollLeft;
      scoreWrapperRef.current.style.transform = `translateX(-${lastScrollXRef.current}px)`;
    }
  }, [isPlaying, shouldRenderSheet]);

  // 停止中のホイール/ドラッグでの手動スクロールを lastScrollX に反映
  useEffect(() => {
    const sc = scrollContainerRef.current;
    if (!sc) return;
    const onScroll = () => {
      if (!isPlaying) {
        lastScrollXRef.current = sc.scrollLeft;
      }
    };
    sc.addEventListener('scroll', onScroll, { passive: true });
    return () => sc.removeEventListener('scroll', onScroll);
  }, [isPlaying]);

    // currentTime → 表示同期
    useEffect(() => {
      const mapping = timeMappingRef.current;
      if (!shouldRenderSheet || mapping.length === 0) {
        prevTimeRef.current = currentTime;
        return;
      }
      const currentTimeMs = currentTime * 1000;

      const findActiveIndex = () => {
        let low = 0, high = mapping.length - 1;
        while (low <= high) {
          const mid = (low + high) >> 1;
          if (mapping[mid].timeMs <= currentTimeMs) low = mid + 1;
          else high = mid - 1;
        }
        return low - 1;
      };

      const idx = Math.max(0, Math.min(findActiveIndex(), mapping.length - 1));
      const target = mapping[idx];
      const scrollX = Math.max(0, target.xPosition - PLAYHEAD_X);

      const seekingBack = currentTime < prevTimeRef.current - 0.1;
      const forceAtZero = currentTime < 0.02;

      if (isPlaying) {
        // 再生中は transform を更新（従来通り）
        const needsIndexUpdate = idx !== lastRenderedIndexRef.current;
        const needsScrollUpdate = Math.abs(scrollX - lastScrollXRef.current) > 0.5;
        if (needsIndexUpdate || seekingBack || forceAtZero || needsScrollUpdate) {
          if (scoreWrapperRef.current) {
            scoreWrapperRef.current.style.transform = `translateX(-${scrollX}px)`;
          }
          lastRenderedIndexRef.current = idx;
          lastScrollXRef.current = scrollX;
        }
      } else {
        // 停止中はスクロール位置を更新（transform解除中）
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = scrollX;
          lastScrollXRef.current = scrollX;
          lastRenderedIndexRef.current = idx;
        }
      }

      prevTimeRef.current = currentTime;
    }, [currentTime, isPlaying, shouldRenderSheet]);

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
        style={{ left: `${PLAYHEAD_X}px` }}
      />
      
      {/* プレイヘッド用のドラッグハンドル（3px幅、スマホで掴みやすく） */}
      <div
        className="absolute top-0 bottom-0 z-20"
        style={{ left: `${PLAYHEAD_X - 8}px`, width: '16px', cursor: 'ew-resize', touchAction: 'none' }}
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          const onMove = (ev: PointerEvent) => {
            const contentX = getContentXFromEvent(ev.clientX);
            const t = xToTime(contentX);
            gameActions.updateTime(t);
          };
          const onUp = () => {
            (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
          };
          window.addEventListener('pointermove', onMove);
          window.addEventListener('pointerup', onUp);
          window.addEventListener('pointercancel', onUp);
        }}
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
          {/* ABリピートの可視化 */}
          {abRepeat.enabled && (() => {
            const ax = timeToX(abRepeat.a);
            const bx = timeToX(abRepeat.b);
            const left = ax != null && bx != null ? Math.min(ax, bx) : null;
            const right = ax != null && bx != null ? Math.max(ax, bx) : null;
            return (
              <>
                {left != null && right != null && (
                  <div
                    className="absolute top-0 bottom-0 bg-blue-300/20 pointer-events-none"
                    style={{ left, width: right - left }}
                  />
                )}
                {ax != null && (
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-emerald-400 z-20 cursor-ew-resize"
                    style={{ left: ax }}
                    onPointerDown={(e) => startDragMarker(e, 'a')}
                  >
                    <div className="absolute -top-6 -left-2 text-xs bg-emerald-600 text-white px-1 rounded">A</div>
                  </div>
                )}
                {bx != null && (
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-sky-400 z-20 cursor-ew-resize"
                    style={{ left: bx }}
                    onPointerDown={(e) => startDragMarker(e, 'b')}
                  >
                    <div className="absolute -top-6 -left-2 text-xs bg-sky-600 text-white px-1 rounded">B</div>
                  </div>
                )}
              </>
            );
          })()}
          
          <div 
            ref={containerRef} 
            className="h-full flex items-center"
            onPointerDown={(e) => {
              const now = performance.now();
              tapStateRef.current = { x: e.clientX, y: e.clientY, t: now };
            }}
            onPointerUp={(e) => {
              const s = tapStateRef.current;
              tapStateRef.current = null;
              if (!s) return;
              const dx = Math.abs(e.clientX - s.x);
              const dy = Math.abs(e.clientY - s.y);
              const dt = performance.now() - s.t;
              // タップ判定（移動8px未満、時間300ms未満）
              if (dx < 8 && dy < 8 && dt < 300) {
                const contentX = getContentXFromEvent(e.clientX);
                const t = xToTime(contentX);
                gameActions.updateTime(t);
              }
            }}
          />
        </div>
      </div>
      
      {/* カスタムスクロールバー用のスタイル - CSS外部化により削除 */}
    </div>
  );
};

export default SheetMusicDisplay;
