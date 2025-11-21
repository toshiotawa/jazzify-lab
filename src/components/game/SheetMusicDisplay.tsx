import React, { useEffect, useRef, useState, useCallback } from 'react';
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay';
import type { GraphicalNote } from 'opensheetmusicdisplay';
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
  const createTimeMapping = useCallback(() => {
    if (!osmdRef.current || !notes || notes.length === 0) {
      log.warn('タイムマッピング作成スキップ: OSMD未初期化またはノートデータなし');
      return;
    }

    const graphicSheet = osmdRef.current.GraphicSheet;
    if (!graphicSheet || !graphicSheet.MusicPages || graphicSheet.MusicPages.length === 0) {
      log.warn('楽譜のグラフィック情報が取得できません');
      return;
    }

    const STAFF_ENTRY_MERGE_EPSILON_PX = 2;
    const TIME_GROUP_THRESHOLD_MS = 1;

    const isPlayableNote = (graphicNote: GraphicalNote): boolean => {
      const sourceNote = graphicNote.sourceNote as {
        NoteTie?: { StartNote?: unknown };
        isRest?: () => boolean;
      };
      if (!sourceNote) {
        return false;
      }
      if (typeof sourceNote.isRest === 'function' && sourceNote.isRest()) {
        return false;
      }
      if (sourceNote.NoteTie && sourceNote.NoteTie.StartNote && sourceNote.NoteTie.StartNote !== sourceNote) {
        return false;
      }
      return true;
    };

    const extractStaffEntryCentersPx = (): number[] => {
      const centers: number[] = [];
      for (const page of graphicSheet.MusicPages ?? []) {
        for (const system of page.MusicSystems ?? []) {
          for (const staffLine of system.StaffLines ?? []) {
            for (const measure of staffLine.Measures ?? []) {
              for (const staffEntry of measure.staffEntries ?? []) {
                if (!staffEntry?.graphicalVoiceEntries?.length) {
                  continue;
                }
                const hasPlayableNote = staffEntry.graphicalVoiceEntries.some((voiceEntry) =>
                  voiceEntry.notes.some((note) => isPlayableNote(note))
                );
                if (!hasPlayableNote) {
                  continue;
                }
                const boundingBox = staffEntry.PositionAndShape as {
                  AbsolutePosition?: { x?: number };
                  Size?: { width?: number };
                } | undefined;
                const absoluteX = boundingBox?.AbsolutePosition?.x;
                if (typeof absoluteX !== 'number') {
                  continue;
                }
                const width = boundingBox?.Size?.width ?? 0;
                centers.push((absoluteX + width / 2) * scaleFactorRef.current);
              }
            }
          }
        }
      }
      return centers.sort((a, b) => a - b);
    };

    const mergeCenters = (centers: number[]): number[] => {
      const merged: number[] = [];
      for (const center of centers) {
        const lastIndex = merged.length - 1;
        if (lastIndex >= 0 && Math.abs(merged[lastIndex] - center) <= STAFF_ENTRY_MERGE_EPSILON_PX) {
          merged[lastIndex] = (merged[lastIndex] + center) / 2;
        } else {
          merged.push(center);
        }
      }
      return merged;
    };

    const groupNoteTimes = (noteTimesMs: number[]) => {
      const groupIndices: number[] = [];
      const groupTimesMs: number[] = [];
      const groupCounts: number[] = [];
      let currentGroupIndex = -1;
      let lastGroupTime = Number.NEGATIVE_INFINITY;

      noteTimesMs.forEach((timeMs) => {
        if (timeMs - lastGroupTime > TIME_GROUP_THRESHOLD_MS) {
          groupTimesMs.push(timeMs);
          groupCounts.push(1);
          currentGroupIndex += 1;
          lastGroupTime = timeMs;
        } else {
          const count = groupCounts[currentGroupIndex];
          groupTimesMs[currentGroupIndex] = (groupTimesMs[currentGroupIndex] * count + timeMs) / (count + 1);
          groupCounts[currentGroupIndex] = count + 1;
        }
        groupIndices.push(currentGroupIndex);
      });

      return { groupIndices, groupTimesMs };
    };

    const assignSlotsToGroups = (groupCount: number, slots: number[]): number[] => {
      if (groupCount === 0) {
        return [];
      }
      if (slots.length === 0) {
        return new Array(groupCount).fill(0);
      }

      const assignments = new Array(groupCount).fill(slots[slots.length - 1]);
      const pairCount = Math.min(groupCount, slots.length);

      for (let i = 0; i < pairCount; i += 1) {
        assignments[i] = slots[i];
      }

      if (pairCount < groupCount) {
        const fallbackStep = pairCount >= 2 ? slots[pairCount - 1] - slots[pairCount - 2] : 0;
        for (let i = pairCount; i < groupCount; i += 1) {
          assignments[i] = assignments[i - 1] + fallbackStep;
        }
      }

      return assignments;
    };

    const staffEntryCentersPx = mergeCenters(extractStaffEntryCentersPx());
    if (staffEntryCentersPx.length === 0) {
      log.warn('StaffEntryの座標が見つからなかったため、タイムマッピングを作成できません');
      return;
    }

    const timingAdjustmentSec = (settings.timingAdjustment ?? 0) / 1000;
    const noteTimesMs = notes.map((note) => (note.time + timingAdjustmentSec) * 1000);
    const { groupIndices, groupTimesMs } = groupNoteTimes(noteTimesMs);

    if (groupTimesMs.length === 0) {
      log.warn('ノート時刻のグルーピングに失敗しました');
      return;
    }

    const slotAssignments = assignSlotsToGroups(groupTimesMs.length, staffEntryCentersPx);

    if (staffEntryCentersPx.length !== groupTimesMs.length) {
      log.warn(
        `StaffEntry数(${staffEntryCentersPx.length})とノート時刻グループ数(${groupTimesMs.length})が一致しません。スクロールにズレが生じる可能性があります。`
      );
    }

    const mapping: TimeMappingEntry[] = noteTimesMs.map((timeMs, index) => {
      const groupIndex = groupIndices[index];
      const xPosition = slotAssignments[groupIndex] ?? slotAssignments[slotAssignments.length - 1] ?? 0;
      return {
        timeMs,
        xPosition: Math.max(0, xPosition)
      };
    });

    mapping.unshift({
      timeMs: 0,
      xPosition: Math.max(0, staffEntryCentersPx[0])
    });

    log.info(
      `📊 OSMDタイムマッピング作成完了: staff slots=${staffEntryCentersPx.length}, note groups=${groupTimesMs.length}`
    );

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

  // 再生状態に応じてtransform/scrollLeft方式を切り替え
  useEffect(() => {
    if (!shouldRenderSheet) {
      return;
    }
    const wrapper = scoreWrapperRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (!wrapper || !scrollContainer) {
      return;
    }
    if (isPlaying) {
      scrollContainer.scrollLeft = 0;
      wrapper.style.transform = `translateX(-${lastScrollXRef.current}px)`;
    } else {
      wrapper.style.transform = 'translateX(0px)';
      scrollContainer.scrollLeft = lastScrollXRef.current;
    }
  }, [isPlaying, shouldRenderSheet]);

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

        if (needsIndexUpdate || seekingBack || forceAtZero || (!isPlaying && needsScrollUpdate)) {
          const wrapper = scoreWrapperRef.current;
          const scrollContainer = scrollContainerRef.current;
          if (isPlaying) {
            if (wrapper) {
              wrapper.style.transform = `translateX(-${scrollX}px)`;
            }
            if (scrollContainer && Math.abs(scrollContainer.scrollLeft) > 0.5) {
              scrollContainer.scrollLeft = 0;
            }
          } else if (scrollContainer) {
            if (wrapper) {
              wrapper.style.transform = 'translateX(0px)';
            }
            if (Math.abs(scrollContainer.scrollLeft - scrollX) > 0.5) {
              scrollContainer.scrollLeft = scrollX;
            }
          }
          lastRenderedIndexRef.current = activeIndex;
          lastScrollXRef.current = scrollX;
        }

      prevTimeRef.current = currentTime;
    }, [currentTime, isPlaying, notes, shouldRenderSheet]);

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
    <div className={cn('relative', className)}>
      {/* プレイヘッド（赤い縦線） - スクロール位置に影響されないよう外側へ配置 */}
      <div 
        className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
        style={{ left: '120px' }}
        aria-hidden="true"
      />
      <div 
        className={cn(
          "h-full bg-white text-black",
          // 再生中は横スクロール無効、停止中は横スクロール有効
          isPlaying ? "overflow-hidden" : "overflow-x-auto overflow-y-hidden",
          // カスタムスクロールバースタイルを適用
          "custom-sheet-scrollbar"
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
                "h-full",
                // 停止中は手動スクロール時の移動を滑らかにする
                !isPlaying ? "transition-transform duration-100 ease-out" : ""
              )}
              style={{ 
                willChange: isPlaying ? 'transform' : 'auto',
                minWidth: '3000px' // 十分な幅を確保
              }}
            >
              <div 
                ref={containerRef} 
                className="h-full flex items-center"
              />
            </div>
          </div>
        </div>
      </div>
  );
};

export default SheetMusicDisplay;
