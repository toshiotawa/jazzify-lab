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
  yPosition: number;
  width: number;
  height: number;
}

/**
 * 楽譜表示コンポーネント
 * OSMDを使用して横スクロール形式の楽譜を表示
 */
const SheetMusicDisplay: React.FC<SheetMusicDisplayProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scoreWrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const highlightLayerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const lastRenderedIndexRef = useRef<number>(-1);
  const lastScrollLeftRef = useRef(0);
  const isProgrammaticScrollRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scaleFactorRef = useRef<number>(10); // デフォルトは以前のマジックナンバー
  
  // timeMappingはアニメーションループで使うため、useRefで状態の即時反映を保証
  const timeMappingRef = useRef<TimeMappingEntry[]>([]);
  const mappingCursorRef = useRef<number>(0);
  
  // ホイールスクロール制御用
  const [isHovered, setIsHovered] = useState(false);

  const updateHighlightOverlay = useCallback((entries: TimeMappingEntry[]) => {
    const layer = highlightLayerRef.current;
    if (!layer) {
      return;
    }
    const ensureNode = (): HTMLDivElement => {
      const node = document.createElement('div');
      node.style.position = 'absolute';
      node.style.pointerEvents = 'none';
      node.style.borderRadius = '9999px';
      node.style.background = 'rgba(239,68,68,0.45)';
      node.style.boxShadow = '0 8px 20px rgba(239,68,68,0.35)';
      node.style.transition = 'transform 80ms linear';
      layer.appendChild(node);
      return node;
    };
    while (layer.children.length < entries.length) {
      ensureNode();
    }
    while (layer.children.length > entries.length) {
      layer.removeChild(layer.lastChild!);
    }
    entries.forEach((entry, index) => {
      const node = layer.children[index] as HTMLDivElement;
      const width = Math.max(18, entry.width || 24);
      const height = Math.max(28, entry.height || 36);
      node.style.width = `${width}px`;
      node.style.height = `${height}px`;
      node.style.transform = `translate(${entry.xPosition - width / 2}px, ${entry.yPosition - height / 2}px)`;
    });
    layer.style.opacity = entries.length ? '1' : '0';
  }, []);
  
  const { currentTime, isPlaying, notes, musicXml, settings } = useGameSelector((s) => ({
    currentTime: s.currentTime,
    isPlaying: s.isPlaying,
    notes: s.notes,
    musicXml: s.musicXml,
    settings: s.settings, // 簡易表示設定を取得
  }));
  const shouldRenderSheet = settings.showSheetMusic;
  
  // const gameActions = useGameActions(); // 現在未使用
  
  // OSMDの初期化とレンダリング
  const loadAndRenderSheet = useCallback(async () => {
    if (!shouldRenderSheet) {
      if (osmdRef.current) {
        osmdRef.current.clear();
      }
      timeMappingRef.current = [];
      mappingCursorRef.current = 0;
        lastRenderedIndexRef.current = -1;
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
    notes,
    settings.simpleDisplayMode,
    settings.noteNameStyle,
    settings.sheetMusicChordsOnly,
    settings.transpose
  ]); // 簡易表示設定とトランスポーズを依存関係に追加

  // musicXmlが変更されたら楽譜を再読み込み・再レンダリング
  useEffect(() => {
    loadAndRenderSheet();
  }, [loadAndRenderSheet]);

  useEffect(() => {
    if (!shouldRenderSheet && osmdRef.current) {
      osmdRef.current.clear();
      timeMappingRef.current = [];
      mappingCursorRef.current = 0;
      updateHighlightOverlay([]);
    }
  }, [shouldRenderSheet, updateHighlightOverlay]);

  // 音符の時刻とX座標のマッピングを作成
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
    for (const page of graphicSheet.MusicPages) {
      for (const system of page.MusicSystems) {
        for (const staffLine of system.StaffLines) {
          for (const measure of staffLine.Measures) {
            for (const staffEntry of measure.staffEntries) {
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
                      timeMs: note.time * 1000 + settings.timingAdjustment,
                        // 動的に計算したスケール係数を使用
                      xPosition: centerX * scaleFactorRef.current,
                      yPosition: (positionAndShape?.AbsolutePosition?.y ?? 0) * scaleFactorRef.current,
                      width: (positionAndShape?.BoundingBox?.width ?? 16) * scaleFactorRef.current,
                      height: (positionAndShape?.BoundingBox?.height ?? 32) * scaleFactorRef.current
                      });
                    }
                    noteIndex++;
      }
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
  }, [notes, settings.timingAdjustment]);

  // 再生開始時に楽譜スクロールを強制的に左側にジャンプ
  useEffect(() => {
    if (isPlaying && scrollContainerRef.current) {
      // 再生開始時に即座にスクロール位置を0にリセット
      scrollContainerRef.current.scrollLeft = 0;
      log.info('🎵 楽譜スクロールを開始位置にリセット');
      lastScrollLeftRef.current = 0;
    }
  }, [isPlaying]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    const handleScroll = () => {
      if (isProgrammaticScrollRef.current) {
        return;
      }
      lastScrollLeftRef.current = container.scrollLeft;
    };
    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // currentTimeが変更されるたびにスクロール位置とハイライトを更新
  useEffect(() => {
    const mapping = timeMappingRef.current;
    const container = scrollContainerRef.current;
    if (!shouldRenderSheet || mapping.length === 0 || !container) {
      updateHighlightOverlay([]);
      return;
    }

    const adjustedCurrentTimeMs = currentTime * 1000 + settings.timingAdjustment;

    const findNextIndex = () => {
      let low = 0;
      let high = mapping.length - 1;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (mapping[mid].timeMs <= adjustedCurrentTimeMs) {
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      return Math.min(low, mapping.length - 1);
    };

    const nextIndex = findNextIndex();
    const activeIndex = Math.max(0, Math.min(nextIndex === 0 ? 0 : nextIndex - 1, mapping.length - 1));
    mappingCursorRef.current = activeIndex;

    const targetEntry = mapping[activeIndex] ?? mapping[mapping.length - 1];
    const playheadPosition = 120;
    const desiredScroll = Math.max(0, targetEntry.xPosition - playheadPosition);
    const contentWidth = scoreWrapperRef.current?.scrollWidth ?? container.scrollWidth;
    const maxScroll = Math.max(0, contentWidth - container.clientWidth);
    const clampedScroll = Math.min(desiredScroll, maxScroll);

    const needsIndexUpdate = activeIndex !== lastRenderedIndexRef.current;
    const needsScrollUpdate = Math.abs(clampedScroll - lastScrollLeftRef.current) > 0.5;

    if (isPlaying && needsScrollUpdate) {
      isProgrammaticScrollRef.current = true;
      container.scrollLeft = clampedScroll;
      lastScrollLeftRef.current = clampedScroll;
      requestAnimationFrame(() => {
        isProgrammaticScrollRef.current = false;
      });
    }

    if (needsIndexUpdate) {
      lastRenderedIndexRef.current = activeIndex;
    }

    const highlightWindow = 150;
    const highlightEntries: TimeMappingEntry[] = [];
    let backward = activeIndex;
    while (backward >= 0 && Math.abs(mapping[backward].timeMs - adjustedCurrentTimeMs) <= highlightWindow) {
      highlightEntries.push(mapping[backward]);
      backward -= 1;
    }
    let forward = activeIndex + 1;
    while (forward < mapping.length && Math.abs(mapping[forward].timeMs - adjustedCurrentTimeMs) <= highlightWindow) {
      highlightEntries.push(mapping[forward]);
      forward += 1;
    }
    updateHighlightOverlay(highlightEntries);
  }, [currentTime, isPlaying, shouldRenderSheet, settings.timingAdjustment, updateHighlightOverlay]);

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
            className="h-full relative"
            style={{ minWidth: '3000px' }}
          >
            <div 
              ref={highlightLayerRef}
              className="absolute inset-0 pointer-events-none"
            />
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
