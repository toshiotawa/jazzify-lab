import React, { useEffect, useRef, useState, useCallback } from 'react';
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay';
import { useGameSelector } from '@/stores/helpers';
import { cn } from '@/utils/cn';
import { simplifyMusicXmlForDisplay } from '@/utils/musicXmlMapper';
import { log } from '@/utils/logger';

interface SheetMusicDisplayProps {
  className?: string;
}

const PLAYHEAD_OFFSET_PX = 120;
const AUTO_SCROLL_RESET_DELAY = 1200;
const HIGHLIGHT_LOOKAHEAD_MS = 80;
const HIGHLIGHT_LAG_MS = 120;
const NOTE_HIGHLIGHT_COLOR = '#ef4444';
const NOTE_HIGHLIGHT_STROKE = '#dc2626';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scaleFactorRef = useRef<number>(10); // デフォルトは以前のマジックナンバー
  
  // timeMappingはアニメーションループで使うため、useRefで状態の即時反映を保証
  const timeMappingRef = useRef<TimeMappingEntry[]>([]);
  const mappingCursorRef = useRef<number>(0);
  const noteElementsRef = useRef<SVGGraphicsElement[]>([]);
  const noteOriginalStylesRef = useRef<Array<{ fill: string | null; stroke: string | null }>>([]);
  const highlightedNoteIndicesRef = useRef<Set<number>>(new Set());
  const userScrollLockRef = useRef(false);
  const scrollUnlockTimerRef = useRef<number | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  
  const { currentTime, isPlaying, notes, musicXml, settings } = useGameSelector((s) => ({
    currentTime: s.currentTime,
    isPlaying: s.isPlaying,
    notes: s.notes,
    musicXml: s.musicXml,
    settings: s.settings, // 簡易表示設定を取得
  }));
  const shouldRenderSheet = settings.showSheetMusic;
  
  const restoreNoteColor = useCallback((index: number) => {
    const element = noteElementsRef.current[index];
    if (!element) {
      return;
    }
    const originals = noteOriginalStylesRef.current[index];
    if (originals?.fill) {
      element.setAttribute('fill', originals.fill);
    } else {
      element.removeAttribute('fill');
    }
    if (originals?.stroke) {
      element.setAttribute('stroke', originals.stroke);
    } else {
      element.removeAttribute('stroke');
    }
  }, []);

  const applyHighlightToIndex = useCallback((index: number) => {
    const element = noteElementsRef.current[index];
    if (!element) {
      return;
    }
    element.setAttribute('fill', NOTE_HIGHLIGHT_COLOR);
    element.setAttribute('stroke', NOTE_HIGHLIGHT_STROKE);
  }, []);

  const clearNoteHighlights = useCallback(() => {
    highlightedNoteIndicesRef.current.forEach((index) => {
      restoreNoteColor(index);
    });
    highlightedNoteIndicesRef.current.clear();
  }, [restoreNoteColor]);

  const updateHighlightedNotes = useCallback((indices: number[]) => {
    const nextSet = new Set(indices);
    const prevSet = highlightedNoteIndicesRef.current;
    prevSet.forEach((index) => {
      if (!nextSet.has(index)) {
        restoreNoteColor(index);
      }
    });
    nextSet.forEach((index) => {
      if (!prevSet.has(index)) {
        applyHighlightToIndex(index);
      }
    });
    highlightedNoteIndicesRef.current = nextSet;
  }, [applyHighlightToIndex, restoreNoteColor]);

  const cacheNoteElements = useCallback(() => {
    if (!containerRef.current) {
      noteElementsRef.current = [];
      noteOriginalStylesRef.current = [];
      clearNoteHighlights();
      return;
    }
    let nodeList = containerRef.current.querySelectorAll<SVGGraphicsElement>('path.vf-notehead');
    if (nodeList.length === 0) {
      nodeList = containerRef.current.querySelectorAll<SVGGraphicsElement>('g.vf-notehead');
    }
    noteElementsRef.current = Array.from(nodeList);
    noteOriginalStylesRef.current = noteElementsRef.current.map((element) => ({
      fill: element.getAttribute('fill'),
      stroke: element.getAttribute('stroke')
    }));
    clearNoteHighlights();
  }, [clearNoteHighlights]);

  // OSMDの初期化とレンダリング
  const loadAndRenderSheet = useCallback(async () => {
    if (!shouldRenderSheet) {
      if (osmdRef.current) {
        osmdRef.current.clear();
      }
      timeMappingRef.current = [];
      mappingCursorRef.current = 0;
        noteElementsRef.current = [];
        noteOriginalStylesRef.current = [];
        clearNoteHighlights();
      return;
    }

    if (!containerRef.current || !musicXml) {
      // musicXmlがない場合はクリア
      if (osmdRef.current) {
        osmdRef.current.clear();
      }
      timeMappingRef.current = [];
      mappingCursorRef.current = 0;
        noteElementsRef.current = [];
        noteOriginalStylesRef.current = [];
        clearNoteHighlights();
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
            cacheNoteElements();
            userScrollLockRef.current = false;
            updateHighlightedNotes([]);
        
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
    settings.transpose,
    cacheNoteElements,
    updateHighlightedNotes
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
    }
  }, [shouldRenderSheet]);

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
                        timeMs: note.time * 1000, // 秒をミリ秒に変換
                        // 動的に計算したスケール係数を使用
                        xPosition: centerX * scaleFactorRef.current
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
    userScrollLockRef.current = false;
    updateHighlightedNotes([]);
    }, [notes, updateHighlightedNotes]);

  const syncVisualState = useCallback(
    (options?: { forceScroll?: boolean }) => {
      if (!shouldRenderSheet) {
        updateHighlightedNotes([]);
        return;
      }
      const mapping = timeMappingRef.current;
      if (mapping.length === 0) {
        updateHighlightedNotes([]);
        return;
      }
      const container = scrollContainerRef.current;
      if (!container) {
        return;
      }
      const adjustedTimeMs = currentTime * 1000 + settings.timingAdjustment;
      const normalizedTime = Math.max(0, adjustedTimeMs);
      let low = 0;
      let high = mapping.length - 1;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (mapping[mid].timeMs <= normalizedTime) {
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      const activeIndex = Math.max(0, Math.min(low === 0 ? 0 : low - 1, mapping.length - 1));
      mappingCursorRef.current = activeIndex;

      const highlightIndices: number[] = [];
      highlightIndices.push(activeIndex);
      let left = activeIndex - 1;
      while (left >= 0 && normalizedTime - mapping[left].timeMs <= HIGHLIGHT_LAG_MS) {
        highlightIndices.push(left);
        left -= 1;
      }
      let right = activeIndex + 1;
      while (right < mapping.length && mapping[right].timeMs - normalizedTime <= HIGHLIGHT_LOOKAHEAD_MS) {
        highlightIndices.push(right);
        right += 1;
      }
      updateHighlightedNotes(highlightIndices);

      if (userScrollLockRef.current && !options?.forceScroll) {
        return;
      }
      const targetEntry = mapping[activeIndex] ?? mapping[mapping.length - 1];
      const desiredScroll = Math.max(0, targetEntry.xPosition - PLAYHEAD_OFFSET_PX);
      const containerWidth = container.clientWidth;
      const maxScroll = Math.max(0, container.scrollWidth - containerWidth);
      const clampedScroll = Math.min(desiredScroll, maxScroll);
      if (Math.abs(container.scrollLeft - clampedScroll) > 0.5) {
        isProgrammaticScrollRef.current = true;
        container.scrollTo({
          left: clampedScroll,
          behavior: isPlaying ? 'auto' : 'smooth'
        });
        requestAnimationFrame(() => {
          isProgrammaticScrollRef.current = false;
        });
      }
    },
    [currentTime, shouldRenderSheet, isPlaying, settings.timingAdjustment, updateHighlightedNotes]
  );

  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) {
      return;
    }
    userScrollLockRef.current = true;
    if (scrollUnlockTimerRef.current) {
      window.clearTimeout(scrollUnlockTimerRef.current);
    }
    scrollUnlockTimerRef.current = window.setTimeout(() => {
      userScrollLockRef.current = false;
    }, AUTO_SCROLL_RESET_DELAY);
  }, []);

  useEffect(() => {
    syncVisualState();
  }, [currentTime, syncVisualState]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    userScrollLockRef.current = false;
    syncVisualState({ forceScroll: true });
  }, [isPlaying, syncVisualState]);

  // クリーンアップ
    useEffect(() => {
      return () => {
        if (scrollUnlockTimerRef.current) {
          window.clearTimeout(scrollUnlockTimerRef.current);
        }
        clearNoteHighlights();
        noteElementsRef.current = [];
        noteOriginalStylesRef.current = [];
        if (osmdRef.current) {
          osmdRef.current.clear();
        }
      };
    }, [clearNoteHighlights]);

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
        "relative bg-white text-black overflow-x-auto overflow-y-hidden",
        // カスタムスクロールバースタイルを適用
        "custom-sheet-scrollbar",
        className
      )}
      ref={scrollContainerRef}
      onScroll={handleScroll}
      style={{
        // WebKit系ブラウザ用のカスタムスクロールバー
        '--scrollbar-width': '8px',
        '--scrollbar-track-color': '#f3f4f6',
        '--scrollbar-thumb-color': '#9ca3af',
        '--scrollbar-thumb-hover-color': '#6b7280'
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
              className="h-full"
            style={{ 
                minWidth: 'max-content'
            }}
          >
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
