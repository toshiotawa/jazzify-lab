import React, { useEffect, useRef, useState, useCallback } from 'react';
import Vex from 'vexflow';
import { useGameSelector } from '@/stores/helpers';
import platform from '@/platform';
import { cn } from '@/utils/cn';
import { simplifyMusicXmlForDisplay } from '@/utils/musicXmlMapper';
import { parseMusicXmlForVexflow, type ParsedScore, type ParsedNoteKey, type ParsedMeasure } from '@/utils/vexflowScoreParser';
import { log } from '@/utils/logger';

interface SheetMusicDisplayProps {
  className?: string;
}

interface TimeMappingEntry {
  timeMs: number;
  xPosition: number;
}

const SCORE_LEFT_PADDING = 40;
const SCORE_RIGHT_PADDING = 80;
const MEASURE_SPACING = 24;
const STAFF_VERTICAL_PADDING = 20;
const MIN_MEASURE_WIDTH = 150;
const MAX_MEASURE_WIDTH = 420;
const BASE_MEASURE_WIDTH = 110;
const BEAT_UNIT_WIDTH = 20;
const COMPLEXITY_UNIT_WIDTH = 16;

const DURATION_BEAT_MAP: Record<string, number> = {
  w: 4,
  h: 2,
  q: 1,
  '8': 0.5,
  '16': 0.25,
  '32': 0.125,
  '64': 0.0625,
  '128': 0.03125,
  '256': 0.015625,
  '512': 0.0078125,
  '1024': 0.00390625,
  '1': 8
};

const VF = Vex.Flow;

interface NoteMeta {
  note: Vex.Flow.StaveNote;
  isPlayable: boolean;
}

/**
 * 楽譜表示コンポーネント
 * VexFlowを使用して横スクロール形式の楽譜を表示
 */
const SheetMusicDisplay: React.FC<SheetMusicDisplayProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scoreWrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Vex.Flow.Renderer | null>(null);
  const scrollLoopRef = useRef<number | null>(null);
  const targetScrollXRef = useRef(0);
  const currentScrollXRef = useRef(0);
  const timeMappingRef = useRef<TimeMappingEntry[]>([]);
  const mappingCursorRef = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderWidth, setRenderWidth] = useState<number>(0);
  const [isHovered, setIsHovered] = useState(false);

  const { currentTime, isPlaying, notes, musicXml, settings } = useGameSelector((s) => ({
    currentTime: s.currentTime,
    isPlaying: s.isPlaying,
    notes: s.notes,
    musicXml: s.musicXml,
    settings: s.settings,
  }));
  const shouldRenderSheet = settings.showSheetMusic;

  const clearRenderer = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    rendererRef.current = null;
    setRenderWidth(0);
  }, []);

  const applyChordsOnlyMask = useCallback(() => {
    if (!settings.sheetMusicChordsOnly || !containerRef.current) {
      return;
    }

    const hiddenSelectors = [
      '.vf-notehead',
      '.vf-rest',
      '.vf-stem',
      '.vf-flag',
      '.vf-beam',
    ];

    hiddenSelectors.forEach((selector) => {
      containerRef.current
        ?.querySelectorAll<SVGElement>(selector)
        .forEach((element) => {
          element.style.opacity = '0';
        });
    });
  }, [settings.sheetMusicChordsOnly]);

  const createTimeMappingFromCenters = useCallback((centers: number[]) => {
    if (!notes || notes.length === 0 || centers.length === 0) {
      timeMappingRef.current = [];
      mappingCursorRef.current = 0;
      return;
    }

    const mapping: TimeMappingEntry[] = [];
    const count = Math.min(centers.length, notes.length);

    for (let i = 0; i < count; i += 1) {
      mapping.push({
        timeMs: notes[i].time * 1000,
        xPosition: centers[i],
      });
    }

    if (centers.length !== notes.length) {
      log.warn(`VexFlowノート数とJSONノート数が一致しません: VexFlow=${centers.length}, JSON=${notes.length}`);
    } else {
      log.info(`🎯 VexFlowノート数とJSONノート数が一致しました: ${centers.length}`);
    }

    timeMappingRef.current = mapping;
    mappingCursorRef.current = 0;
  }, [notes]);

  const renderScore = useCallback((score: ParsedScore): number[] => {
    if (!containerRef.current) {
      return [];
    }

    const measureWidths = score.measures.map((measure) => calculateMeasureWidth(measure));
    const contentWidth = measureWidths.reduce((sum, width) => sum + width, 0);
    const spacingWidth = Math.max(0, score.measures.length - 1) * MEASURE_SPACING;
    const totalWidth = Math.max(contentWidth + spacingWidth + SCORE_LEFT_PADDING + SCORE_RIGHT_PADDING, 1200);
    const height = 220;

    const renderer = new VF.Renderer(containerRef.current, VF.Renderer.Backends.SVG);
    rendererRef.current = renderer;
    renderer.resize(totalWidth, height);
    const context = renderer.getContext();
    context.setBackgroundFillStyle('#ffffff');
    context.setFillStyle('#000000');
    context.setStrokeStyle('#000000');

    const noteMetaList: NoteMeta[] = [];
    const ties: Vex.Flow.StaveTie[] = [];
    const pendingTies = new Map<string, { note: Vex.Flow.StaveNote; index: number }>();

    let currentX = SCORE_LEFT_PADDING;

    score.measures.forEach((measure, index) => {
      const staveWidth = measureWidths[index];
      const stave = new VF.Stave(currentX, STAFF_VERTICAL_PADDING, staveWidth);

      if (index === 0) {
        stave.addClef(measure.clef);
        stave.addTimeSignature(`${measure.timeSignature.beats}/${measure.timeSignature.beatType}`);
        stave.addKeySignature(measure.keySignature);
      }

      stave.setContext(context).draw();

      const voice = new VF.Voice({
        num_beats: measure.timeSignature.beats,
        beat_value: measure.timeSignature.beatType,
        resolution: VF.RESOLUTION,
      });
      voice.setStrict(false);
      voice.setMode(VF.Voice.Mode.SOFT);

      const vexNotes = measure.notes.map((note) => {
        const duration = note.isRest ? `${note.duration}r` : note.duration;
        const formattedKeys = formatKeys(note.keys);
        const staveNote = new VF.StaveNote({
          keys: formattedKeys.length > 0 ? formattedKeys : ['b/4'],
          duration,
          clef: measure.clef,
          auto_stem: true,
        });

        note.keys.forEach((key, idx) => {
          const accidental = getAccidentalSymbol(key.alter);
          if (accidental) {
            staveNote.addAccidental(idx, new VF.Accidental(accidental));
          }
        });

        for (let dotIndex = 0; dotIndex < note.dots; dotIndex += 1) {
          staveNote.addDotToAll();
        }

        noteMetaList.push({
          note: staveNote,
          isPlayable: !note.isRest && !(note.tieStop && !note.tieStart),
        });

        if (note.tieStart && !note.isRest) {
          note.keys.forEach((key, idx) => {
            pendingTies.set(createTieKey(key, note.voice), { note: staveNote, index: idx });
          });
        }

        if (note.tieStop && !note.isRest) {
          note.keys.forEach((key, idx) => {
            const tieKey = createTieKey(key, note.voice);
            const start = pendingTies.get(tieKey);
            if (start) {
              ties.push(new VF.StaveTie({
                first_note: start.note,
                last_note: staveNote,
                first_indices: [start.index],
                last_indices: [idx],
              }));
              pendingTies.delete(tieKey);
            }
          });
        }

        return staveNote;
      });

      voice.addTickables(vexNotes);
      new VF.Formatter().joinVoices([voice]).format([voice], Math.max(10, staveWidth - 24));
      voice.draw(context, stave);

      const beams = VF.Beam.generateBeams(vexNotes);
      beams.forEach((beam) => beam.setContext(context).draw());

      currentX += staveWidth + MEASURE_SPACING;
    });

    ties.forEach((tie) => tie.setContext(renderer.getContext()).draw());
    setRenderWidth(totalWidth);

    return noteMetaList
      .filter((meta) => meta.isPlayable)
      .map((meta) => {
        const bbox = meta.note.getBoundingBox();
        if (bbox) {
          return bbox.getX() + bbox.getW() / 2;
        }
        return meta.note.getAbsoluteX();
      });
  }, []);

  const loadAndRenderSheet = useCallback(() => {
    if (!shouldRenderSheet) {
      clearRenderer();
      timeMappingRef.current = [];
      mappingCursorRef.current = 0;
      return;
    }

    if (!containerRef.current || !musicXml) {
      clearRenderer();
      timeMappingRef.current = [];
      mappingCursorRef.current = 0;
      setError(musicXml === '' ? '楽譜データがありません' : null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      clearRenderer();

      const processedMusicXml = simplifyMusicXmlForDisplay(musicXml, {
        simpleDisplayMode: settings.simpleDisplayMode,
        noteNameStyle: settings.noteNameStyle,
        chordsOnly: settings.sheetMusicChordsOnly,
      });

      log.info(`🎼 VexFlow簡易表示: ${settings.simpleDisplayMode ? 'ON' : 'OFF'}, 音名スタイル: ${settings.noteNameStyle}`);

      const parsedScore = parseMusicXmlForVexflow(processedMusicXml);
      if (!parsedScore) {
        setError('楽譜データの解析に失敗しました');
        setIsLoading(false);
        return;
      }

      const playableCenters = renderScore(parsedScore);
      createTimeMappingFromCenters(playableCenters);
      applyChordsOnlyMask();

      log.info('✅ VexFlowでの描画とタイムマッピングが完了しました');
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
    clearRenderer,
    renderScore,
    createTimeMappingFromCenters,
    applyChordsOnlyMask,
  ]);

  // musicXmlが変更されたら楽譜を再読み込み・再レンダリング
  useEffect(() => {
    loadAndRenderSheet();
  }, [loadAndRenderSheet]);

  useEffect(() => {
    if (!shouldRenderSheet) {
      clearRenderer();
      timeMappingRef.current = [];
      mappingCursorRef.current = 0;
    }
  }, [shouldRenderSheet, clearRenderer]);

  // 再生開始時に楽譜スクロールを強制的に左側にジャンプ
  useEffect(() => {
    if (isPlaying && scrollContainerRef.current) {
      // 再生開始時に即座にスクロール位置を0にリセット
      scrollContainerRef.current.scrollLeft = 0;
      log.info('🎵 楽譜スクロールを開始位置にリセット');
    }
  }, [isPlaying]);

    // currentTimeが変更されるたびにスクロール目標位置を更新
    useEffect(() => {
      const mapping = timeMappingRef.current;
      if (!shouldRenderSheet || mapping.length === 0 || !scoreWrapperRef.current) {
        return;
      }

      const currentTimeMs = currentTime * 1000;

      const findCursorIndex = () => {
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
        return Math.min(low, mapping.length - 1);
      };

      const cursor = findCursorIndex();
      mappingCursorRef.current = cursor;

      const nextEntry = mapping[cursor] ?? mapping[mapping.length - 1];
      const prevEntry = cursor > 0 ? mapping[cursor - 1] : null;

      let targetX = nextEntry.xPosition;
      if (prevEntry) {
        const segmentDuration = nextEntry.timeMs - prevEntry.timeMs;
        if (segmentDuration > 0) {
          const timeIntoSegment = currentTimeMs - prevEntry.timeMs;
          const progress = Math.max(0, Math.min(1, timeIntoSegment / segmentDuration));
          targetX = prevEntry.xPosition + (nextEntry.xPosition - prevEntry.xPosition) * progress;
        }
      }

      const playheadPosition = 120;
      const scrollX = isPlaying ? Math.max(0, targetX - playheadPosition) : targetX - playheadPosition;

      targetScrollXRef.current = scrollX;

      if (!isPlaying && scoreWrapperRef.current) {
        currentScrollXRef.current = scrollX;
        scoreWrapperRef.current.style.transform = `translateX(-${scrollX}px)`;
      }
    }, [currentTime, isPlaying, shouldRenderSheet]);

    useEffect(() => {
      if (!shouldRenderSheet) {
        if (scrollLoopRef.current !== null) {
          platform.cancelAnimationFrame(scrollLoopRef.current);
          scrollLoopRef.current = null;
        }
        return;
      }

      if (!isPlaying) {
        if (scrollLoopRef.current !== null) {
          platform.cancelAnimationFrame(scrollLoopRef.current);
          scrollLoopRef.current = null;
        }
        if (scoreWrapperRef.current) {
          const target = targetScrollXRef.current;
          currentScrollXRef.current = target;
          scoreWrapperRef.current.style.transform = `translateX(-${target}px)`;
        }
        return;
      }

      const animate = () => {
        if (!scoreWrapperRef.current) {
          scrollLoopRef.current = null;
          return;
        }

        const target = targetScrollXRef.current;
        const current = currentScrollXRef.current;
        const delta = target - current;

        if (Math.abs(delta) < 0.4) {
          currentScrollXRef.current = target;
        } else {
          currentScrollXRef.current = current + delta * 0.2;
        }

        scoreWrapperRef.current.style.transform = `translateX(-${currentScrollXRef.current}px)`;
        scrollLoopRef.current = platform.requestAnimationFrame(animate);
      };

      if (scrollLoopRef.current === null) {
        scrollLoopRef.current = platform.requestAnimationFrame(animate);
      }

      return () => {
        if (scrollLoopRef.current !== null) {
          platform.cancelAnimationFrame(scrollLoopRef.current);
          scrollLoopRef.current = null;
        }
      };
    }, [isPlaying, shouldRenderSheet]);

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
      clearRenderer();
      if (scrollLoopRef.current) {
        platform.cancelAnimationFrame(scrollLoopRef.current);
        scrollLoopRef.current = null;
      }
    };
  }, [clearRenderer]);

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
          
          {/* VexFlowレンダリング用コンテナ */}
          <div 
            ref={scoreWrapperRef}
            className={cn(
              "h-full",
              // 停止中は手動スクロール時の移動を滑らかにする
              !isPlaying ? "transition-transform duration-100 ease-out" : ""
            )}
            style={{ 
              willChange: isPlaying ? 'transform' : 'auto',
              width: renderWidth ? `${renderWidth}px` : '3000px'
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

const ACCIDENTAL_MAP: Record<number, string> = {
  [-2]: 'bb',
  [-1]: 'b',
  0: '',
  1: '#',
  2: '##',
};

function getAccidentalSymbol(alter: number): string | null {
  if (alter === 0) {
    return null;
  }

  return ACCIDENTAL_MAP[alter] ?? null;
}

function formatKeys(keys: ParsedNoteKey[]): string[] {
  if (keys.length === 0) {
    return ['b/4'];
  }

  return keys.map((key) => {
    const accidental = ACCIDENTAL_MAP[key.alter] ?? '';
    return `${key.step.toLowerCase()}${accidental}/${key.octave}`;
  });
}

function createTieKey(key: ParsedNoteKey, voice: string): string {
  const accidental = ACCIDENTAL_MAP[key.alter] ?? '';
  return `${key.step}${accidental}${key.octave}_${voice}`;
}

function getBeatsFromDuration(duration: string): number {
  return DURATION_BEAT_MAP[duration] ?? 1;
}

function calculateMeasureWidth(measure: ParsedMeasure): number {
  const beatsInSignature = measure.timeSignature.beats || 4;
  const noteComplexity = measure.notes.reduce((sum, note) => sum + getBeatsFromDuration(note.duration), 0);
  const densityBonus = Math.max(0, measure.notes.length - beatsInSignature) * 0.2;
  const rawWidth =
    BASE_MEASURE_WIDTH +
    beatsInSignature * BEAT_UNIT_WIDTH +
    (noteComplexity + densityBonus) * COMPLEXITY_UNIT_WIDTH;
  return Math.max(MIN_MEASURE_WIDTH, Math.min(MAX_MEASURE_WIDTH, rawWidth));
}

export default SheetMusicDisplay;
