/**
 * 1ブロック分の描画（ヘッダープレート + 踊り場 + 階段コネクタ + 末尾扉）
 */

import React, { useMemo } from 'react';
import { BlockLayout, LANE_X } from './descentLayout';
import { getBlockByKey } from './descentBlocks';
import LandingPlatform from './parts/LandingPlatform';
import StairConnector from './parts/StairConnector';
import StageNode, { StageNodeState } from './parts/StageNode';
import BlockHeaderPlate from './parts/BlockHeaderPlate';
import BlockDoor from './parts/BlockDoor';

interface DescentBlockProps {
  layout: BlockLayout;
  scale: number;
  selectedStageNumber: number;
  clearedStages: ReadonlySet<number>;
  isStageUnlocked: (stageNumber: number) => boolean;
  onSelectStage: (stageNumber: number) => void;
  /** このブロックを暗転表示する(未解放ブロック) */
  dim: boolean;
  /** ブロック識別用 aria-label に使う */
  blockLabel: string;
  blockLabelEn: string;
  isEnglishCopy: boolean;
  /** このブロックが最前線（キャラがいるブロック）か */
  isFrontier: boolean;
  /** 現在キャラがいるステージ番号（フロンティア表示用） */
  frontierStageNumber: number;
}

export const DescentBlock: React.FC<DescentBlockProps> = ({
  layout,
  scale,
  selectedStageNumber,
  clearedStages,
  isStageUnlocked,
  onSelectStage,
  dim,
  blockLabel,
  blockLabelEn,
  isEnglishCopy,
  frontierStageNumber,
}) => {
  const block = getBlockByKey(layout.blockKey);

  const lastStage = layout.stages[layout.stages.length - 1];
  const doorOpened = block ? block.stageNumbers.every(n => clearedStages.has(n)) : false;

  const connectors = useMemo(() => {
    const pairs: Array<{ from: { x: number; y: number }; to: { x: number; y: number }; highlighted: boolean }> = [];
    for (let i = 0; i < layout.stages.length - 1; i++) {
      const a = layout.stages[i];
      const b = layout.stages[i + 1];
      const highlighted = clearedStages.has(a.stageNumber) && !clearedStages.has(b.stageNumber) && isStageUnlocked(b.stageNumber);
      pairs.push({
        from: { x: a.x, y: a.y },
        to: { x: b.x, y: b.y },
        highlighted,
      });
    }
    return pairs;
  }, [layout.stages, clearedStages, isStageUnlocked]);

  return (
    <div aria-label={`block-${isEnglishCopy ? blockLabelEn : blockLabel}`}>
      {connectors.map((c, i) => (
        <StairConnector
          key={`connector-${i}`}
          from={{ x: c.from.x, y: c.from.y }}
          to={{ x: c.to.x, y: c.to.y }}
          scale={scale}
          dim={dim}
          highlighted={!dim && c.highlighted}
        />
      ))}

      <BlockHeaderPlate
        label={isEnglishCopy ? blockLabelEn : blockLabel}
        xPx={LANE_X.C * scale}
        yPx={layout.headerY * scale}
        scale={scale}
        dim={dim}
        cleared={doorOpened}
      />

      <BlockDoor
        xPx={lastStage.x * scale}
        yPx={(lastStage.y - 60) * scale}
        scale={scale}
        opened={doorOpened}
        dim={dim}
      />

      {layout.stages.map(stage => (
        <LandingPlatform
          key={`plat-${stage.stageNumber}`}
          type={stage.landingType}
          xPx={stage.x * scale}
          yPx={stage.y * scale}
          scale={scale}
          dim={dim}
        />
      ))}

      {layout.stages.map(stage => {
        const unlocked = isStageUnlocked(stage.stageNumber);
        const cleared = clearedStages.has(stage.stageNumber);
        const nodeState: StageNodeState = cleared ? 'cleared' : unlocked ? 'unlocked' : 'locked';
        const isFrontierNode = !dim && stage.stageNumber === frontierStageNumber && unlocked && !cleared;
        return (
          <StageNode
            key={`node-${stage.stageNumber}`}
            stageNumber={stage.stageNumber}
            xPx={stage.x * scale}
            yPx={stage.y * scale}
            scale={scale}
            state={nodeState}
            selected={selectedStageNumber === stage.stageNumber && !dim}
            onSelect={onSelectStage}
            dim={dim}
            isFrontier={isFrontierNode}
          />
        );
      })}
    </div>
  );
};

/** ブロック全体を暗幕で覆うオーバーレイ（未解放ブロック視覚化） */
export const BlockDimVeil: React.FC<{ layout: BlockLayout; scale: number; widthPx: number }> = ({ layout, scale, widthPx }) => {
  const heightPx = (layout.endY - layout.startY) * scale;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: 0,
        top: layout.startY * scale,
        width: widthPx,
        height: heightPx,
        background:
          'linear-gradient(to bottom, rgba(4,4,10,0.55) 0%, rgba(2,2,8,0.85) 45%, rgba(0,0,4,0.95) 100%)',
        backdropFilter: 'blur(1.5px)',
        zIndex: 40,
      }}
    />
  );
};

export default DescentBlock;
