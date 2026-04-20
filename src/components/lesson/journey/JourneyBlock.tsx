import React, { useMemo } from 'react';
import { JourneyBlockLayout, JourneyNode } from './journeyLayout';
import PathConnector from './parts/PathConnector';
import LessonNode, { LessonNodeState } from './parts/LessonNode';
import MilestoneNode from './parts/MilestoneNode';
import BlockBand from './parts/BlockBand';

interface JourneyBlockProps {
  block: JourneyBlockLayout;
  scale: number;
  logicalWidthPx: number;
  selectedLessonId: string | null;
  frontierLessonId: string | null;
  dim: boolean;
  isEnglishCopy: boolean;
  /** 次ブロック先頭レッスンとのブロック間接続用 (このブロックの milestone から次ブロック先頭へ) */
  nextBlockFirstNode?: JourneyNode;
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
  isEnglishCopy,
  nextBlockFirstNode,
  isLessonCleared,
  isLessonUnlocked,
  onSelectLesson,
  lessonAriaLabel,
}) => {
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
    // last lesson → milestone
    if (block.lessonNodes.length > 0) {
      const last = block.lessonNodes[block.lessonNodes.length - 1];
      pairs.push({
        from: last,
        to: block.milestone,
        state: isLessonCleared(last.id)
          ? blockCleared
            ? 'cleared'
            : 'active'
          : 'locked',
      });
    }
    // milestone → next block first lesson
    if (nextBlockFirstNode) {
      pairs.push({
        from: block.milestone,
        to: nextBlockFirstNode,
        state: blockCleared ? 'active' : 'locked',
      });
    }
    return pairs;
  }, [block.lessonNodes, block.milestone, nextBlockFirstNode, isLessonCleared, isLessonUnlocked, blockCleared]);

  return (
    <div aria-label={`journey-block-${block.blockNumber}`}>
      <BlockBand
        widthPx={logicalWidthPx}
        yPx={block.topY * scale + 28}
        scale={scale}
        label={block.blockName}
        sublabel={block.blockNameEn ?? undefined}
        accent={block.accent}
        dim={dim}
      />

      {connectors.map((pair, i) => (
        <PathConnector
          key={`c-${block.blockNumber}-${i}`}
          from={{ x: pair.from.x * scale, y: pair.from.y * scale }}
          to={{ x: pair.to.x * scale, y: pair.to.y * scale }}
          scale={scale}
          state={dim ? 'locked' : pair.state}
          accent={block.accent}
        />
      ))}

      <MilestoneNode
        xPx={block.milestone.x * scale}
        yPx={block.milestone.y * scale}
        scale={scale}
        cleared={blockCleared}
        dim={dim}
        label={block.blockName}
        sublabel={isEnglishCopy ? 'Milestone' : 'まとめ'}
        accent={block.accent}
      />

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
