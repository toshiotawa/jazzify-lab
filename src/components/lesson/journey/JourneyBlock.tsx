import React, { useMemo } from 'react';
import { JourneyBlockLayout, JourneyNode } from './journeyLayout';
import PathConnector from './parts/PathConnector';
import LessonNode, { LessonNodeState } from './parts/LessonNode';
import BlockBand from './parts/BlockBand';

interface JourneyBlockProps {
  block: JourneyBlockLayout;
  scale: number;
  logicalWidthPx: number;
  selectedLessonId: string | null;
  frontierLessonId: string | null;
  dim: boolean;
  /** 次ブロック先頭レッスン (このブロックの最後のレッスンから直接繋ぐ) */
  nextBlockFirstNode?: JourneyNode;
  /** 最終ブロックの最後のレッスンから繋ぐ goal ノード */
  goalNode?: JourneyNode;
  /** 帯表示位置 (最終ブロックではコース名と被らないようオフセット可) */
  bandTopOffsetPx?: number;
  /** 帯ラベルを表示するか */
  showBlockBand?: boolean;
  /** 英語UIかどうか。帯ラベルの主・副言語の並びに影響する */
  isEnglishCopy?: boolean;
  isLessonCleared: (lessonId: string) => boolean;
  isLessonUnlocked: (lessonId: string) => boolean;
  onSelectLesson: (lessonId: string) => void;
  lessonAriaLabel: (lessonId: string) => string;
}

export const JourneyBlock: React.FC<JourneyBlockProps> = ({
  block,
  scale,
  logicalWidthPx,
  selectedLessonId,
  frontierLessonId,
  dim,
  nextBlockFirstNode,
  goalNode,
  bandTopOffsetPx,
  showBlockBand = true,
  isEnglishCopy = false,
  isLessonCleared,
  isLessonUnlocked,
  onSelectLesson,
  lessonAriaLabel,
}) => {
  // 帯ラベル: 表示言語に応じて主・副を入れ替える。
  // - 英語UI: EN を主、JA を副 (EN 無指定なら JA のみ)
  // - 日本語UI: JA を主、EN を副
  const bandLabel = isEnglishCopy
    ? (block.blockNameEn && block.blockNameEn.length > 0 ? block.blockNameEn : block.blockName)
    : block.blockName;
  const bandSublabel = isEnglishCopy
    ? (block.blockNameEn && block.blockNameEn.length > 0 && block.blockNameEn !== block.blockName ? block.blockName : undefined)
    : (block.blockNameEn ?? undefined);
  const blockCleared = useMemo(
    () => block.lessonNodes.every(n => isLessonCleared(n.id)),
    [block.lessonNodes, isLessonCleared],
  );

  const connectors = useMemo(() => {
    const pairs: Array<{ from: JourneyNode; to: JourneyNode; state: 'cleared' | 'active' | 'locked' }> = [];
    // lesson → lesson
    for (let i = 0; i < block.lessonNodes.length - 1; i += 1) {
      const a = block.lessonNodes[i];
      const b = block.lessonNodes[i + 1];
      pairs.push({
        from: a,
        to: b,
        state: pathState(a.id, b.id, isLessonCleared, isLessonUnlocked),
      });
    }
    // 最終レッスン → 次ブロック先頭レッスン
    if (block.lessonNodes.length > 0 && nextBlockFirstNode) {
      const last = block.lessonNodes[block.lessonNodes.length - 1];
      pairs.push({
        from: last,
        to: nextBlockFirstNode,
        state: isLessonCleared(last.id)
          ? isLessonUnlocked(nextBlockFirstNode.id)
            ? isLessonCleared(nextBlockFirstNode.id)
              ? 'cleared'
              : 'active'
            : 'locked'
          : 'locked',
      });
    }
    // 最終ブロックの最終レッスン → goal
    if (block.lessonNodes.length > 0 && goalNode && !nextBlockFirstNode) {
      const last = block.lessonNodes[block.lessonNodes.length - 1];
      pairs.push({
        from: last,
        to: goalNode,
        state: blockCleared ? 'cleared' : isLessonCleared(last.id) ? 'active' : 'locked',
      });
    }
    return pairs;
  }, [
    block.lessonNodes,
    nextBlockFirstNode,
    goalNode,
    isLessonCleared,
    isLessonUnlocked,
    blockCleared,
  ]);

  const bandY = block.topY * scale + (bandTopOffsetPx ?? 28);

  return (
    <div aria-label={`journey-block-${block.blockNumber}`}>
      {showBlockBand && (
        <BlockBand
          widthPx={logicalWidthPx}
          yPx={bandY}
          scale={scale}
          label={bandLabel}
          sublabel={bandSublabel}
          theme={block.theme}
          dim={dim}
        />
      )}

      {connectors.map((pair, i) => (
        <PathConnector
          key={`c-${block.blockNumber}-${i}`}
          from={{ x: pair.from.x, y: pair.from.y }}
          to={{ x: pair.to.x, y: pair.to.y }}
          scale={scale}
          state={dim ? 'locked' : pair.state}
          theme={block.theme}
        />
      ))}

      {block.lessonNodes.map(node => {
        const cleared = isLessonCleared(node.id);
        const unlocked = isLessonUnlocked(node.id);
        const state: LessonNodeState = cleared ? 'cleared' : unlocked ? 'unlocked' : 'locked';
        const isFrontier = !dim && node.id === frontierLessonId;
        return (
          <LessonNode
            key={`n-${node.id}`}
            lessonId={node.id}
            number={node.number}
            xPx={node.x * scale}
            yPx={node.y * scale}
            scale={scale}
            state={state}
            selected={selectedLessonId === node.id && !dim}
            isFrontier={isFrontier}
            dim={dim}
            onSelect={onSelectLesson}
            ariaLabel={lessonAriaLabel(node.id)}
          />
        );
      })}
    </div>
  );
};

const pathState = (
  aId: string,
  bId: string,
  isCleared: (id: string) => boolean,
  isUnlocked: (id: string) => boolean,
): 'cleared' | 'active' | 'locked' => {
  if (isCleared(aId) && isCleared(bId)) return 'cleared';
  if (isCleared(aId) && isUnlocked(bId)) return 'active';
  return 'locked';
};

export default JourneyBlock;
