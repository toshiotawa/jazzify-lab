import React, { useEffect, useRef, useState, useCallback } from 'react';
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay';
import { useGameSelector } from '@/stores/helpers';
import { cn } from '@/utils/cn';
import { simplifyMusicXmlForDisplay } from '@/utils/musicXmlMapper';
import { log } from '@/utils/logger';

interface SheetMusicDisplayProps {
  className?: string;
}

interface TimeMappingEntry {
  timeMs: number;
  xPosition: number;
  element?: SVGGraphicsElement | null;
}

const PLAYHEAD_OFFSET = 120;
const NOTE_BASE_CLASS = 'sheet-note';
const NOTE_ACTIVE_CLASS = 'sheet-note-active';

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
  const scaleFactorRef = useRef<number>(10);
  const timeMappingRef = useRef<TimeMappingEntry[]>([]);
  const noteElementsRef = useRef<SVGGraphicsElement[]>([]);
  const highlightIndexRef = useRef<number | null>(null);
  const scrollTargetRef = useRef(0);
  const isProgrammaticScrollRef = useRef(false);
  const isAutoFollowEnabledRef = useRef(true);
  const [isAutoFollowEnabled, setIsAutoFollowEnabled] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const { currentTime, isPlaying, notes, musicXml, settings } = useGameSelector((s) => ({
    currentTime: s.currentTime,
    isPlaying: s.isPlaying,
    notes: s.notes,
    musicXml: s.musicXml,
    settings: s.settings,
  }));

  const shouldRenderSheet = settings.showSheetMusic;

  const clearNoteDecorations = useCallback(() => {
    noteElementsRef.current.forEach((el) => {
      el.classList.remove(NOTE_BASE_CLASS);
      el.classList.remove(NOTE_ACTIVE_CLASS);
    });
    noteElementsRef.current = [];
    highlightIndexRef.current = null;
  }, []);

  const getNoteElement = useCallback((graphicNote: any): SVGGraphicsElement | null => {
    if (graphicNote && typeof graphicNote.getSVGElement === 'function') {
      try {
        return graphicNote.getSVGElement() ?? null;
      } catch (err) {
        log.warn('⚠️ SVG要素の取得に失敗しました', err);
        return null;
      }
    }
    return null;
  }, []);

  const createTimeMapping = useCallback(() => {
    if (!osmdRef.current || !notes || notes.length === 0) {
      log.warn('タイムマッピング作成スキップ: OSMD未初期化またはノートデータなし');
      timeMappingRef.current = [];
      highlightIndexRef.current = null;
      clearNoteDecorations();
      return;
    }

    const mapping: TimeMappingEntry[] = [];
    const graphicSheet = osmdRef.current.GraphicSheet;

    if (!graphicSheet || !graphicSheet.MusicPages || graphicSheet.MusicPages.length === 0) {
      log.warn('楽譜のグラフィック情報が取得できません');
      timeMappingRef.current = [];
      clearNoteDecorations();
      return;
    }

    let noteIndex = 0;
    const osmdPlayableNotes: any[] = [];

    clearNoteDecorations();

    for (const page of graphicSheet.MusicPages) {
      for (const system of page.MusicSystems) {
        for (const staffLine of system.StaffLines) {
          for (const measure of staffLine.Measures) {
            for (const staffEntry of measure.staffEntries) {
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

    for (const graphicNote of osmdPlayableNotes) {
      if (noteIndex >= notes.length) {
        break;
      }
      const note = notes[noteIndex];
      const positionAndShape = graphicNote.PositionAndShape as any;
      const noteHeadX = positionAndShape?.AbsolutePosition?.x;
      if (noteHeadX === undefined) {
        noteIndex += 1;
        continue;
      }
      let centerX = noteHeadX;
      if (positionAndShape?.BoundingBox?.width !== undefined) {
        centerX += positionAndShape.BoundingBox.width / 2;
      }
      const element = getNoteElement(graphicNote);
      if (element) {
        element.classList.add(NOTE_BASE_CLASS);
        element.classList.remove(NOTE_ACTIVE_CLASS);
      }
      mapping.push({
        timeMs: note.time * 1000,
        xPosition: centerX * scaleFactorRef.current,
        element,
      });
      noteIndex += 1;
    }

    timeMappingRef.current = mapping;
    noteElementsRef.current = mapping
      .map((entry) => entry.element)
      .filter((el): el is SVGGraphicsElement => Boolean(el));
    highlightIndexRef.current = null;
    scrollTargetRef.current = 0;
    log.info(`📊 OSMD Note Extraction Summary: ${mapping.length} mapped notes`);
  }, [notes, clearNoteDecorations, getNoteElement]);

  const loadAndRenderSheet = useCallback(async () => {
    if (!shouldRenderSheet) {
      if (osmdRef.current) {
        osmdRef.current.clear();
      }
      timeMappingRef.current = [];
      clearNoteDecorations();
      return;
    }

    if (!containerRef.current || !musicXml) {
      if (osmdRef.current) {
        osmdRef.current.clear();
      }
      timeMappingRef.current = [];
      clearNoteDecorations();
      setError(musicXml === '' ? '楽譜データがありません' : null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (osmdRef.current) {
        osmdRef.current.clear();
      }

      const processedMusicXml = simplifyMusicXmlForDisplay(musicXml, {
        simpleDisplayMode: settings.simpleDisplayMode,
        noteNameStyle: settings.noteNameStyle,
        chordsOnly: settings.sheetMusicChordsOnly,
      });

      log.info(`🎼 OSMD簡易表示: ${settings.simpleDisplayMode ? 'ON' : 'OFF'}, 音名スタイル: ${settings.noteNameStyle}`);

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
        defaultColorTitle: '#000000',
      };

      osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, options);
      await osmdRef.current.load(processedMusicXml);
      osmdRef.current.render();

      if (settings.sheetMusicChordsOnly) {
        const noteEls = containerRef.current.querySelectorAll('[class*=notehead], [class*=rest], [class*=stem]');
        noteEls.forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });
      }

      const svgElement = containerRef.current.querySelector('svg');
      const boundingBox = (osmdRef.current.GraphicSheet as any).BoundingBox;
      if (svgElement && boundingBox && boundingBox.width > 0) {
        const svgWidth = svgElement.width.baseVal.value;
        const osmdWidth = boundingBox.width;
        scaleFactorRef.current = svgWidth / osmdWidth;
        log.info(`✅ OSMD scale factor calculated: ${scaleFactorRef.current}`);
      } else {
        scaleFactorRef.current = 10;
        log.warn('⚠️ Could not calculate OSMD scale factor, falling back to default 10.');
      }

      isAutoFollowEnabledRef.current = true;
      setIsAutoFollowEnabled(true);
      scrollContainerRef.current?.scrollTo({ left: 0 });
      createTimeMapping();
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
    createTimeMapping,
    clearNoteDecorations,
  ]);

  useEffect(() => {
    loadAndRenderSheet();
  }, [loadAndRenderSheet]);

  useEffect(() => {
    if (!shouldRenderSheet && osmdRef.current) {
      osmdRef.current.clear();
      timeMappingRef.current = [];
      clearNoteDecorations();
    }
  }, [shouldRenderSheet, clearNoteDecorations]);

  const updateHighlight = useCallback((nextIndex: number | null) => {
    if (highlightIndexRef.current === nextIndex) {
      return;
    }
    const prevIndex = highlightIndexRef.current;
    if (prevIndex !== null) {
      timeMappingRef.current[prevIndex]?.element?.classList.remove(NOTE_ACTIVE_CLASS);
    }
    highlightIndexRef.current = nextIndex;
    if (nextIndex !== null) {
      timeMappingRef.current[nextIndex]?.element?.classList.add(NOTE_ACTIVE_CLASS);
    }
  }, []);

  const applyAutoScroll = useCallback(
    (target: number) => {
      const container = scrollContainerRef.current;
      if (!container) {
        return;
      }
      const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
      const clamped = Math.max(0, Math.min(target, maxScroll));
      scrollTargetRef.current = clamped;
      isProgrammaticScrollRef.current = true;
      container.scrollTo({ left: clamped, behavior: isPlaying ? 'auto' : 'smooth' });
      requestAnimationFrame(() => {
        isProgrammaticScrollRef.current = false;
      });
    },
    [isPlaying]
  );

  const disableAutoFollow = useCallback(() => {
    if (!isAutoFollowEnabledRef.current) {
      return;
    }
    isAutoFollowEnabledRef.current = false;
    setIsAutoFollowEnabled(false);
  }, []);

  const enableAutoFollow = useCallback(() => {
    if (isAutoFollowEnabledRef.current) {
      return;
    }
    isAutoFollowEnabledRef.current = true;
    setIsAutoFollowEnabled(true);
    applyAutoScroll(scrollTargetRef.current);
  }, [applyAutoScroll]);

  const handleManualScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) {
      return;
    }
    if (isPlaying) {
      disableAutoFollow();
    }
  }, [disableAutoFollow, isPlaying]);

  const handleFollowToggle = useCallback(() => {
    if (isAutoFollowEnabledRef.current) {
      disableAutoFollow();
    } else {
      enableAutoFollow();
    }
  }, [disableAutoFollow, enableAutoFollow]);

  useEffect(() => {
    const mapping = timeMappingRef.current;
    if (!shouldRenderSheet || mapping.length === 0) {
      updateHighlight(null);
      return;
    }

    const timingAdjustmentSec = (settings.timingAdjustment ?? 0) / 1000;
    const effectiveTimeMs = Math.max(0, (currentTime - timingAdjustmentSec) * 1000);

    const findNextIndex = () => {
      let low = 0;
      let high = mapping.length - 1;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (mapping[mid].timeMs <= effectiveTimeMs) {
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      return Math.min(low, mapping.length - 1);
    };

    const nextIndex = findNextIndex();
    const isBeyondLast = effectiveTimeMs >= mapping[mapping.length - 1].timeMs;
    const activeIndex = isBeyondLast ? mapping.length - 1 : Math.max(0, nextIndex === 0 ? 0 : nextIndex - 1);
    updateHighlight(activeIndex);

    if (isAutoFollowEnabledRef.current) {
      const targetEntry = mapping[activeIndex];
      if (targetEntry) {
        const desiredScroll = Math.max(0, targetEntry.xPosition - PLAYHEAD_OFFSET);
        applyAutoScroll(desiredScroll);
      }
    }
  }, [
    currentTime,
    isPlaying,
    settings.timingAdjustment,
    shouldRenderSheet,
    updateHighlight,
    applyAutoScroll,
  ]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!isHovered) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      return true;
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        scrollContainer.removeEventListener('wheel', handleWheel);
      };
    }
  }, [isHovered]);

  useEffect(() => {
    return () => {
      if (osmdRef.current) {
        osmdRef.current.clear();
      }
      clearNoteDecorations();
    };
  }, [clearNoteDecorations]);

  if (!shouldRenderSheet) {
    return (
      <div
        className={cn('flex items-center justify-center bg-slate-900 text-gray-400', className)}
        aria-label="楽譜表示オフ"
      >
        楽譜表示はオフになっています
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative bg-white text-black overflow-x-auto overflow-y-hidden custom-sheet-scrollbar',
        className
      )}
      ref={scrollContainerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onScroll={handleManualScroll}
      style={
        {
          '--scrollbar-width': '8px',
          '--scrollbar-track-color': '#f3f4f6',
          '--scrollbar-thumb-color': '#9ca3af',
          '--scrollbar-thumb-hover-color': '#6b7280',
        } as React.CSSProperties
      }
    >
      <div className="absolute top-3 right-3 z-20">
        <button
          type="button"
          onClick={handleFollowToggle}
          aria-pressed={isAutoFollowEnabled}
          className={cn(
            'px-3 py-1 text-xs font-semibold rounded-full border transition-colors',
            isAutoFollowEnabled
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-gray-100 text-gray-600 border-gray-300'
          )}
          title="楽譜の自動追従を切り替え"
        >
          譜面追従: {isAutoFollowEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

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

        <div ref={scoreWrapperRef} className="h-full" style={{ minWidth: '3000px' }}>
          <div ref={containerRef} className="h-full flex items-center" />
        </div>
      </div>
    </div>
  );
};

export default SheetMusicDisplay;
