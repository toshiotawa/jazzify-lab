/**
 * 1ブロック分の描画（ヘッダープレート + 踊り場 + 階段コネクタ + 末尾扉）
 * ブロック Tier に応じた装飾（提灯・封印魔法陣・浮遊パーティクル・境界アーチ）も統合。
 */

import React, { useMemo } from 'react';
import { BlockLayout, LANE_X, MAP_LOGICAL_WIDTH } from './descentLayout';
import { getBlockByKey } from './descentBlocks';
import { getBlockTheme, getBlockFilter } from './blockTheme';
import { SurvivalMapCategory, DEFAULT_SURVIVAL_MAP_CATEGORY } from '../SurvivalTypes';
import LandingPlatform from './parts/LandingPlatform';
import StairConnector from './parts/StairConnector';
import StageNode, { StageNodeState } from './parts/StageNode';
import BlockHeaderPlate from './parts/BlockHeaderPlate';
import BlockDoor from './parts/BlockDoor';
import BlockBossFigure from './parts/BlockBossFigure';
import BlockSeal from './parts/BlockSeal';
import BlockLantern from './parts/BlockLantern';
import FloatingEmber from './parts/FloatingEmber';
import BlockArch from './parts/BlockArch';

interface DescentBlockProps {
  layout: BlockLayout;
  scale: number;
  selectedStageNumber: number;
  clearedStages: ReadonlySet<number>;
  isStageUnlocked: (stageNumber: number) => boolean;
  onSelectStage: (stageNumber: number) => void;
  dim: boolean;
  blockLabel: string;
  blockLabelEn: string;
  isEnglishCopy: boolean;
  frontierStageNumber: number;
  mapWidthPx: number;
  isFrontierBlock: boolean;
  mapCategory?: SurvivalMapCategory;
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
  mapWidthPx,
  isFrontierBlock,
  mapCategory = DEFAULT_SURVIVAL_MAP_CATEGORY,
}) => {
  const block = getBlockByKey(layout.blockKey, mapCategory);
  const theme = getBlockTheme(layout.blockIndex);
  const blockFilter = getBlockFilter(layout.blockIndex);

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

  const depthLabel = isEnglishCopy
    ? `FLOOR ${layout.blockIndex + 1}`
    : `第${layout.blockIndex + 1}階層`;

  const headerXPx = LANE_X.C * scale;
  const headerYPx = layout.headerY * scale;
  const archYPx = headerYPx - Math.round(36 * scale);
  const lanternOffsetX = Math.round(150 * scale);
  const lanternYPx = headerYPx + Math.round(8 * scale);

  return (
    <div aria-label={`block-${isEnglishCopy ? blockLabelEn : blockLabel}`}>
      {isFrontierBlock && !dim && (
        <FloatingEmber
          startY={layout.startY}
          endY={layout.endY}
          widthPx={mapWidthPx}
          scale={scale}
          color={theme.lanternOuter}
          count={6}
        />
      )}

      <BlockArch
        xPx={headerXPx}
        yPx={archYPx}
        scale={scale}
        widthPx={MAP_LOGICAL_WIDTH * scale}
        theme={theme}
        cleared={doorOpened}
        dim={dim}
      />

      {connectors.map((c, i) => (
        <StairConnector
          key={`connector-${i}`}
          from={{ x: c.from.x, y: c.from.y }}
          to={{ x: c.to.x, y: c.to.y }}
          scale={scale}
          dim={dim}
          highlighted={!dim && c.highlighted}
          hueDeg={blockFilter.connectorHueDeg}
        />
      ))}

      <BlockLantern
        xPx={headerXPx - lanternOffsetX}
        yPx={lanternYPx}
        scale={scale}
        theme={theme}
        lit={!dim && (doorOpened || isFrontierBlock)}
        dim={dim}
        side="left"
      />
      <BlockLantern
        xPx={headerXPx + lanternOffsetX}
        yPx={lanternYPx}
        scale={scale}
        theme={theme}
        lit={!dim && (doorOpened || isFrontierBlock)}
        dim={dim}
        side="right"
      />

      <BlockHeaderPlate
        label={isEnglishCopy ? blockLabelEn : blockLabel}
        depthLabel={depthLabel}
        xPx={headerXPx}
        yPx={headerYPx}
        scale={scale}
        dim={dim}
        cleared={doorOpened}
        theme={theme}
      />

      <BlockDoor
        xPx={lastStage.x * scale}
        yPx={(lastStage.y - 10) * scale}
        scale={scale}
        opened={doorOpened}
        dim={dim}
        doorFilter={blockFilter.door}
      />
      <BlockBossFigure
        xPx={lastStage.x * scale}
        yPx={(lastStage.y - 8) * scale}
        scale={scale}
        blockKey={layout.blockKey}
        opened={doorOpened}
        dim={dim}
      />
      <BlockSeal
        xPx={lastStage.x * scale}
        yPx={(lastStage.y - 90) * scale}
        scale={scale}
        theme={theme}
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
          platformFilter={blockFilter.platform}
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
