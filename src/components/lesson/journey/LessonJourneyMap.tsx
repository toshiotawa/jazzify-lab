/**
 * レッスンモード「学びの旅マップ」
 * - コース詳細画面の本体。ブロック毎のレッスン数が可変でも破綻しないパラメトリック配置
 * - サバイバルの降下マップと対の「上昇型」: 下=スタート / 上=コースゴール
 * - PC/iPad >= 768px: 左リストパネル + 右マップ 二分割
 * - モバイル (<768px): マップ全面、ノードタップで下からシート
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { Course, Lesson } from '@/types';
import { lessonDisplayBlockName, lessonDisplayTitle } from '@/utils/lessonCopy';
import { courseDisplayTitle } from '@/utils/courseCopy';
import { LessonAccessGraph } from '@/utils/lessonAccess';
import { LessonRequirementProgress } from '@/platform/supabaseLessonRequirements';
import { LessonMapAudio, LESSON_MAP_BGM_URL } from '@/utils/LessonMapAudio';
import { getWindow } from '@/platform';
import {
  buildJourneyLayout,
  computeFrontierLessonId,
  JOURNEY_LOGICAL_WIDTH,
  JourneyLessonInput,
} from './journeyLayout';
import JourneyBlock from './JourneyBlock';
import JourneyBackground from './parts/JourneyBackground';
import JourneyCharacter from './parts/JourneyCharacter';
import CourseGoalNode from './parts/CourseGoalNode';
import BlockDimVeil from './parts/BlockDimVeil';
import BlockThemeOverlay from './parts/BlockThemeOverlay';
import LessonListPanel, { LessonListPanelItemState } from './parts/LessonListPanel';
import LessonDetailCard from './parts/LessonDetailCard';
import { useJourneyCamera } from './useJourneyCamera';

interface LessonJourneyMapProps {
  course: Course;
  lessons: Lesson[];
  accessGraph: LessonAccessGraph;
  requirementsProgress: Record<string, LessonRequirementProgress[]>;
  isEnglishCopy: boolean;
  onStartLesson: (lessonId: string) => void;
}

const VIEWPORT_FALLBACK_HEIGHT = 720;

const LessonJourneyMap: React.FC<LessonJourneyMapProps> = ({
  course,
  lessons,
  accessGraph,
  requirementsProgress,
  isEnglishCopy,
  onStartLesson,
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: JOURNEY_LOGICAL_WIDTH, height: VIEWPORT_FALLBACK_HEIGHT });
  const [isMobileLayout, setIsMobileLayout] = useState<boolean>(() => {
    return !getWindow().matchMedia('(min-width: 768px)').matches;
  });
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  const [soundMuted, setSoundMuted] = useState<boolean>(() => LessonMapAudio.isMuted());
  const [didInitialFocus, setDidInitialFocus] = useState(false);
  const [didMeasureViewport, setDidMeasureViewport] = useState(false);

  // --- Layout 計算 -------------------------------------------------------
  const journeyInputs = useMemo<JourneyLessonInput[]>(() => {
    return lessons.map((lesson, index) => ({
      id: lesson.id,
      blockNumber: lesson.block_number ?? 1,
      blockName: lessonDisplayBlockName(lesson, isEnglishCopy),
      blockNameEn: lesson.block_name_en ?? null,
      orderIndex: lesson.order_index,
      sourceIndex: index,
    }));
  }, [lessons, isEnglishCopy]);

  const layout = useMemo(
    () => buildJourneyLayout(journeyInputs, { isEnglish: isEnglishCopy }),
    [journeyInputs, isEnglishCopy],
  );

  const scale = Math.min(Math.max(0.7, viewport.width / JOURNEY_LOGICAL_WIDTH), 2.2);
  const mapWidthPx = JOURNEY_LOGICAL_WIDTH * scale;
  const mapHeightPx = layout.totalHeight * scale;
  const worldWidthPx = Math.max(mapWidthPx, viewport.width);

  // --- viewport 計測 -----------------------------------------------------
  useEffect(() => {
    const mq = getWindow().matchMedia('(min-width: 768px)');
    const update = (): void => setIsMobileLayout(!mq.matches);
    update();
    try {
      mq.addEventListener('change', update);
      return () => mq.removeEventListener('change', update);
    } catch {
      mq.addListener(update);
      return () => mq.removeListener(update);
    }
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = (): void => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setViewport({ width: rect.width, height: rect.height });
        setDidMeasureViewport(true);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // --- BGM --------------------------------------------------------------
  // アンマウント時の停止には猶予時間付きの stopBgm() を使うことで、
  // コース切替の unmount→remount の間に BGM が途切れるのを防ぐ。
  useEffect(() => {
    if (!LessonMapAudio.isMuted()) {
      void LessonMapAudio.playBgm(LESSON_MAP_BGM_URL).catch(() => { /* ignore autoplay fail */ });
    }
    return () => {
      LessonMapAudio.stopBgm();
    };
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const unlock = (): void => {
      void LessonMapAudio.unlock().catch(() => { /* ignore */ });
    };
    const onceOpts: AddEventListenerOptions = { once: true };
    el.addEventListener('pointerdown', unlock, onceOpts);
    el.addEventListener('touchstart', unlock, onceOpts);
    getWindow().addEventListener?.('keydown', unlock, onceOpts);
    return () => {
      try { el.removeEventListener('pointerdown', unlock); } catch { /* ignore */ }
      try { el.removeEventListener('touchstart', unlock); } catch { /* ignore */ }
      try { getWindow().removeEventListener?.('keydown', unlock); } catch { /* ignore */ }
    };
  }, []);

  const handleToggleSound = useCallback(() => {
    const next = LessonMapAudio.toggleMuted();
    setSoundMuted(next);
    if (!next) {
      void LessonMapAudio.unlock().catch(() => { /* ignore */ });
      void LessonMapAudio.playBgm(LESSON_MAP_BGM_URL).catch(() => { /* ignore */ });
    }
  }, []);

  // --- 状態ヘルパ --------------------------------------------------------
  const isLessonCleared = useCallback(
    (lessonId: string): boolean => accessGraph.lessonStates[lessonId]?.isCompleted ?? false,
    [accessGraph],
  );
  const isLessonUnlocked = useCallback(
    (lessonId: string): boolean => accessGraph.lessonStates[lessonId]?.isUnlocked ?? false,
    [accessGraph],
  );

  const frontierLessonId = useMemo(
    () => computeFrontierLessonId(journeyInputs, isLessonUnlocked, isLessonCleared),
    [journeyInputs, isLessonUnlocked, isLessonCleared],
  );

  const lessonsById = useMemo(() => {
    const map: Record<string, Lesson> = {};
    lessons.forEach(l => { map[l.id] = l; });
    return map;
  }, [lessons]);

  const nodeByLessonId = useMemo(() => {
    const map = new Map(layout.allNodes.filter(n => n.kind === 'lesson').map(n => [n.id, n]));
    return map;
  }, [layout]);

  const { cameraY, focusCamera, adjustCamera, setCamera } = useJourneyCamera({
    viewportHeight: viewport.height,
    scale,
    mapLogicalHeight: layout.totalHeight,
  });

  const visibleBlocks = useMemo(() => {
    if (layout.blocks.length === 0) return layout.blocks;
    const bufferLogical = Math.max(360, viewport.height / Math.max(scale, 0.1));
    const minY = Math.max(0, cameraY / scale - bufferLogical);
    const maxY = (cameraY + viewport.height) / scale + bufferLogical;
    return layout.blocks.filter(block => block.bottomY >= minY && block.topY <= maxY);
  }, [layout.blocks, cameraY, scale, viewport.height]);

  // 初期フォーカス: viewport 実計測後にフロンティア (= 現在地) を画面中央へ即座配置
  useEffect(() => {
    if (didInitialFocus) return;
    if (!didMeasureViewport) return;
    if (layout.blocks.length === 0) return;
    const targetNode = frontierLessonId ? nodeByLessonId.get(frontierLessonId) : null;
    const firstLessonY = layout.blocks[0].lessonNodes[0]?.y ?? layout.totalHeight;
    const y = targetNode ? targetNode.y : firstLessonY;
    const rawTargetPx = y * scale - viewport.height * 0.5;
    const totalPx = layout.totalHeight * scale;
    const maxCameraY = Math.max(0, totalPx - viewport.height);
    const clamped = Math.max(0, Math.min(maxCameraY, rawTargetPx));
    setCamera(clamped);
    setDidInitialFocus(true);
  }, [
    didInitialFocus,
    didMeasureViewport,
    frontierLessonId,
    layout,
    nodeByLessonId,
    scale,
    viewport.height,
    setCamera,
  ]);

  // --- 操作 --------------------------------------------------------------
  const handleSelectLesson = useCallback(
    (lessonId: string) => {
      setSelectedLessonId(lessonId);
      const node = nodeByLessonId.get(lessonId);
      if (node) focusCamera(node.y);
      if (isMobileLayout) {
        setIsMobileDetailOpen(true);
      }
    },
    [focusCamera, isMobileLayout, nodeByLessonId],
  );

  const handleCloseMobileDetail = useCallback(() => setIsMobileDetailOpen(false), []);

  const handleStart = useCallback(() => {
    if (!selectedLessonId) return;
    if (!isLessonUnlocked(selectedLessonId)) return;
    void LessonMapAudio.stopBgmImmediately();
    setIsMobileDetailOpen(false);
    onStartLesson(selectedLessonId);
  }, [selectedLessonId, isLessonUnlocked, onStartLesson]);

  // --- ドラッグ / ホイール --------------------------------------------
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    let dragging = false;
    let lastClientY = 0;
    let downClientY = 0;
    let movedDuringDrag = false;

    const onWheel = (e: WheelEvent): void => {
      e.preventDefault();
      adjustCamera(e.deltaY);
    };
    const onPointerDown = (e: PointerEvent): void => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('button,[role="button"]')) return;
      dragging = true;
      movedDuringDrag = false;
      lastClientY = e.clientY;
      downClientY = e.clientY;
      try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    };
    const onPointerMove = (e: PointerEvent): void => {
      if (!dragging) return;
      const dy = e.clientY - lastClientY;
      lastClientY = e.clientY;
      if (Math.abs(e.clientY - downClientY) > 4) movedDuringDrag = true;
      adjustCamera(-dy);
    };
    const onPointerUp = (e: PointerEvent): void => {
      if (!dragging) return;
      dragging = false;
      try { el.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
      if (movedDuringDrag) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
    };
  }, [adjustCamera]);

  // --- 派生情報 --------------------------------------------------------
  const selectedLesson = selectedLessonId ? lessonsById[selectedLessonId] : null;
  const selectedLessonState = useMemo(() => {
    if (!selectedLessonId) return null;
    const state = accessGraph.lessonStates[selectedLessonId];
    return state ?? { isUnlocked: false, isCompleted: false };
  }, [selectedLessonId, accessGraph]);

  const selectedLessonCompletionRate = useMemo(() => {
    if (!selectedLessonId) return 0;
    const reqs = requirementsProgress[selectedLessonId] ?? [];
    if (reqs.length === 0) return 0;
    return Math.round((reqs.filter(r => r.is_completed).length / reqs.length) * 100);
  }, [selectedLessonId, requirementsProgress]);

  const frontierNode = frontierLessonId ? nodeByLessonId.get(frontierLessonId) : null;
  const frontierFacing: 'left' | 'right' | 'center' = (() => {
    if (!frontierNode) return 'center';
    // フロンティアの「次のレッスン」を探して向き決定
    const block = layout.blocks[frontierNode.blockIndex];
    if (!block) return 'center';
    const indexInBlock = block.lessonNodes.findIndex(n => n.id === frontierNode.id);
    const nextBlock = layout.blocks[frontierNode.blockIndex + 1];
    const next = block.lessonNodes[indexInBlock + 1] ?? nextBlock?.lessonNodes[0] ?? layout.goal;
    if (!next) return 'center';
    if (next.x > frontierNode.x + 1) return 'right';
    if (next.x < frontierNode.x - 1) return 'left';
    return 'center';
  })();

  const accessibleBlockIndex = useMemo(() => {
    let idx = 0;
    for (const block of layout.blocks) {
      const blockNumber = block.blockNumber;
      const bs = accessGraph.blockStates[blockNumber];
      if (bs?.isUnlocked) {
        idx = Math.max(idx, block.blockIndex);
      }
    }
    return idx;
  }, [layout.blocks, accessGraph]);

  const panelStateByLessonId = useMemo<Record<string, LessonListPanelItemState>>(() => {
    const map: Record<string, LessonListPanelItemState> = {};
    lessons.forEach(lesson => {
      const s = accessGraph.lessonStates[lesson.id];
      map[lesson.id] = {
        isUnlocked: s?.isUnlocked ?? false,
        isCompleted: s?.isCompleted ?? false,
        isFrontier: lesson.id === frontierLessonId,
      };
    });
    return map;
  }, [lessons, accessGraph, frontierLessonId]);

  const blockNameByBlockNumber = useMemo<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    lessons.forEach(lesson => {
      const bn = lesson.block_number ?? 1;
      if (!map[bn]) {
        map[bn] = lessonDisplayBlockName(lesson, isEnglishCopy);
      }
    });
    return map;
  }, [lessons, isEnglishCopy]);

  const blockUnlockedByBlockNumber = useMemo<Record<number, boolean>>(() => {
    const map: Record<number, boolean> = {};
    Object.values(accessGraph.blockStates).forEach(bs => {
      map[bs.blockNumber] = bs.isUnlocked;
    });
    return map;
  }, [accessGraph]);

  const completedCount = useMemo(
    () => lessons.filter(l => accessGraph.lessonStates[l.id]?.isCompleted).length,
    [lessons, accessGraph],
  );

  const lessonAriaLabel = useCallback(
    (lessonId: string): string => {
      const lesson = lessonsById[lessonId];
      if (!lesson) return '';
      const state = accessGraph.lessonStates[lessonId];
      const statusLabel = state?.isCompleted
        ? isEnglishCopy ? 'cleared' : 'クリア済み'
        : state?.isUnlocked
          ? isEnglishCopy ? 'available' : '挑戦可能'
          : isEnglishCopy ? 'locked' : '未解放';
      return `${isEnglishCopy ? 'Quest' : 'クエスト'} ${lesson.order_index + 1}: ${lessonDisplayTitle(lesson, isEnglishCopy)} (${statusLabel})`;
    },
    [lessonsById, accessGraph, isEnglishCopy],
  );

  const allCleared = useMemo(
    () => lessons.length > 0 && lessons.every(l => accessGraph.lessonStates[l.id]?.isCompleted),
    [lessons, accessGraph],
  );

  const goalLabel = isEnglishCopy ? 'Course Goal' : 'コースゴール';

  return (
    <div className="relative w-full">
      <style>{`
        @keyframes journey-breath {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes journey-shadow {
          0%, 100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.4; transform: translateX(-50%) scale(0.85); }
        }
        @keyframes journey-frontier-pulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes journey-twinkle {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes journey-star-breath {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(1.55); opacity: 1; }
        }
        @keyframes journey-goal-breath {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.08); opacity: 1; }
        }
      `}</style>

      <div className="mx-auto grid w-full max-w-[1700px] grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_320px]">
        <div
          ref={viewportRef}
          className="relative overflow-hidden touch-none select-none rounded-2xl border border-violet-400/20"
          style={{
            width: '100%',
            height: isMobileLayout ? 'min(82vh, 100%)' : 'min(86vh, 960px)',
            boxShadow: 'inset 0 0 40px 2px rgba(0,0,0,0.32), 0 20px 60px rgba(0,0,0,0.35)',
            cursor: 'grab',
          }}
        >
          <div
            className="absolute left-0 top-0 will-change-transform"
            style={{
              width: worldWidthPx,
              height: mapHeightPx,
              transform: `translate3d(0, ${-cameraY}px, 0)`,
            }}
          >
            <JourneyBackground widthPx={worldWidthPx} heightPx={mapHeightPx} scale={scale} />

            <div
              className="absolute left-1/2 top-0"
              style={{
                width: mapWidthPx,
                height: mapHeightPx,
                transform: 'translateX(-50%)',
              }}
            >
              {visibleBlocks.map(block => {
                const dim = block.blockIndex > accessibleBlockIndex;
                return (
                  <BlockThemeOverlay
                    key={`theme-${block.blockNumber}`}
                    topY={block.topY}
                    bottomY={block.bottomY}
                    widthPx={mapWidthPx}
                    scale={scale}
                    theme={block.theme}
                    dim={dim}
                  />
                );
              })}

              {visibleBlocks.map(block => {
                const dim = block.blockIndex > accessibleBlockIndex;
                const nextBlock = layout.blocks[block.blockIndex + 1];
                const nextFirst = nextBlock?.lessonNodes[0];
                const isLast = block.blockIndex === layout.blocks.length - 1;
                return (
                  <JourneyBlock
                    key={block.blockNumber}
                    block={block}
                    scale={scale}
                    logicalWidthPx={mapWidthPx}
                    selectedLessonId={selectedLessonId}
                    frontierLessonId={frontierLessonId}
                    dim={dim}
                    nextBlockFirstNode={nextFirst}
                    goalNode={isLast ? layout.goal : undefined}
                    bandTopOffsetPx={isLast ? 64 : 28}
                    isEnglishCopy={isEnglishCopy}
                    isLessonCleared={isLessonCleared}
                    isLessonUnlocked={isLessonUnlocked}
                    onSelectLesson={handleSelectLesson}
                    lessonAriaLabel={lessonAriaLabel}
                  />
                );
              })}

              {visibleBlocks.map(block =>
                block.blockIndex > accessibleBlockIndex ? (
                  <BlockDimVeil
                    key={`veil-${block.blockNumber}`}
                    topY={block.topY}
                    bottomY={block.bottomY}
                    widthPx={mapWidthPx}
                    scale={scale}
                  />
                ) : null,
              )}

              <CourseGoalNode
                xPx={layout.goal.x * scale}
                yPx={layout.goal.y * scale}
                scale={scale}
                cleared={allCleared}
                label={courseDisplayTitle(course, isEnglishCopy)}
              />

              {frontierNode && (
                <JourneyCharacter
                  xPx={frontierNode.x * scale}
                  yPx={frontierNode.y * scale}
                  scale={scale}
                  facing={frontierFacing}
                />
              )}
              {!frontierNode && allCleared && (
                <JourneyCharacter
                  xPx={layout.goal.x * scale}
                  yPx={layout.goal.y * scale}
                  scale={scale}
                  facing="center"
                />
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleSound}
            onPointerDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
            aria-label={
              soundMuted
                ? isEnglishCopy
                  ? 'Unmute map sound'
                  : 'マップのサウンドをオンにする'
                : isEnglishCopy
                  ? 'Mute map sound'
                  : 'マップのサウンドをオフにする'
            }
            aria-pressed={!soundMuted}
            className="absolute bottom-3 right-3 z-30 flex items-center gap-2 rounded-full border border-violet-300/40 bg-black/55 px-3 py-2 text-xs font-semibold text-violet-100 backdrop-blur-sm transition-colors hover:bg-black/75 hover:border-violet-300/70 active:scale-95 sm:bottom-4 sm:right-4 sm:px-4 sm:py-2.5 sm:text-sm"
            style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.55)' }}
          >
            {soundMuted ? (
              <FaVolumeMute aria-hidden className="text-base sm:text-lg" />
            ) : (
              <FaVolumeUp aria-hidden className="text-base sm:text-lg" />
            )}
            <span className="tracking-wide">
              {soundMuted
                ? isEnglishCopy ? 'Sound OFF' : 'サウンド OFF'
                : isEnglishCopy ? 'Sound ON' : 'サウンド ON'}
            </span>
          </button>

          {/* デスクトップ: 右下詳細カード (選択時) */}
          {!isMobileLayout && selectedLesson && selectedLessonState && (
            <div
              className="absolute z-30 w-[320px] max-w-[90%]"
              style={{ right: 16, bottom: 72 }}
            >
              <LessonDetailCard
                isEnglishCopy={isEnglishCopy}
                lesson={selectedLesson}
                isUnlocked={selectedLessonState.isUnlocked}
                isCompleted={selectedLessonState.isCompleted}
                isFrontier={selectedLessonId === frontierLessonId}
                completionRate={selectedLessonCompletionRate}
                blockLabel={lessonDisplayBlockName(selectedLesson, isEnglishCopy)}
                onStart={handleStart}
                onClose={() => setSelectedLessonId(null)}
                layout="card"
              />
            </div>
          )}
        </div>

        <div className="hidden md:block md:h-[min(86vh,960px)]">
          <LessonListPanel
            isEnglishCopy={isEnglishCopy}
            lessons={lessons}
            selectedLessonId={selectedLessonId}
            stateByLessonId={panelStateByLessonId}
            blockNameByBlockNumber={blockNameByBlockNumber}
            blockUnlockedByBlockNumber={blockUnlockedByBlockNumber}
            completedCount={completedCount}
            totalCount={lessons.length}
            onSelect={handleSelectLesson}
          />
        </div>
      </div>

      {/* モバイル詳細シート */}
      {isMobileLayout && isMobileDetailOpen && selectedLesson && selectedLessonState && (
        <div className="fixed inset-0 z-40 flex items-end md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label={isEnglishCopy ? 'Close lesson detail' : 'レッスン詳細を閉じる'}
            className="absolute inset-0 bg-black/70"
            onClick={handleCloseMobileDetail}
          />
          <div className="relative z-10 w-full">
            <div className="mx-auto max-w-xl p-3">
              <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-white/25" />
              <LessonDetailCard
                isEnglishCopy={isEnglishCopy}
                lesson={selectedLesson}
                isUnlocked={selectedLessonState.isUnlocked}
                isCompleted={selectedLessonState.isCompleted}
                isFrontier={selectedLessonId === frontierLessonId}
                completionRate={selectedLessonCompletionRate}
                blockLabel={lessonDisplayBlockName(selectedLesson, isEnglishCopy)}
                onStart={handleStart}
                onClose={handleCloseMobileDetail}
                layout="sheet"
              />
            </div>
          </div>
        </div>
      )}
      {/* 空配列やロード中の表示用にゴール名を HTML aria-live でアナウンスする余白 */}
      <span className="sr-only" aria-live="polite">{goalLabel}</span>
    </div>
  );
};

export default LessonJourneyMap;
