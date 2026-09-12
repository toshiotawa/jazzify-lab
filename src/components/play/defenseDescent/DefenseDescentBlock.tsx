import React, { useMemo } from 'react';
import { LANE_X, MAP_LOGICAL_WIDTH } from '@/components/survival/descent/descentLayout';
import { getBlockTheme, getBlockFilter } from '@/components/survival/descent/blockTheme';
import LandingPlatform from '@/components/survival/descent/parts/LandingPlatform';
import StairConnector from '@/components/survival/descent/parts/StairConnector';
import StageNode, { StageNodeState } from '@/components/survival/descent/parts/StageNode';
import BlockHeaderPlate from '@/components/survival/descent/parts/BlockHeaderPlate';
import BlockDoor from '@/components/survival/descent/parts/BlockDoor';
import BlockSeal from '@/components/survival/descent/parts/BlockSeal';
import BlockLantern from '@/components/survival/descent/parts/BlockLantern';
import FloatingEmber from '@/components/survival/descent/parts/FloatingEmber';
import BlockArch from '@/components/survival/descent/parts/BlockArch';
import type { PlayBlockLayout } from '@/components/play/defenseDescent/playDescentLayout';

interface DefenseDescentBlockProps {
  layout: PlayBlockLayout;
  scale: number;
  selectedNodeId: string | null;
  clearedNodeIds: ReadonlySet<string>;
  blockUnlocked: boolean;
  onSelectNode: (nodeId: string) => void;
  dim: boolean;
  isEnglishCopy: boolean;
  frontierNodeId: string | null;
  mapWidthPx: number;
  isFrontierBlock: boolean;
  hasNextBlock: boolean;
}

export const DefenseDescentBlock: React.FC<DefenseDescentBlockProps> = ({
  layout,
  scale,
  selectedNodeId,
  clearedNodeIds,
  blockUnlocked,
  onSelectNode,
  dim,
  isEnglishCopy,
  frontierNodeId,
  mapWidthPx,
  isFrontierBlock,
  hasNextBlock,
}) => {
  const theme = getBlockTheme(layout.blockIndex);
  const blockFilter = getBlockFilter(layout.blockIndex);

  const lastNode = layout.nodes[layout.nodes.length - 1];
  const stageNodes = layout.nodes.filter((n) => n.node.nodeKind === 'stage');
  const doorOpened = stageNodes.length > 0
    && stageNodes.every((n) => clearedNodeIds.has(n.nodeId));

  const connectors = useMemo(() => {
    const pairs: Array<{ from: { x: number; y: number }; to: { x: number; y: number }; highlighted: boolean }> = [];
    for (let i = 0; i < layout.nodes.length - 1; i += 1) {
      const a = layout.nodes[i];
      const b = layout.nodes[i + 1];
      const highlighted = clearedNodeIds.has(a.nodeId)
        && !clearedNodeIds.has(b.nodeId)
        && blockUnlocked;
      pairs.push({
        from: { x: a.x, y: a.y },
        to: { x: b.x, y: b.y },
        highlighted,
      });
    }
    return pairs;
  }, [layout.nodes, clearedNodeIds, blockUnlocked]);

  const depthLabel = isEnglishCopy
    ? `FLOOR ${layout.blockIndex + 1}`
    : `第${layout.blockIndex + 1}階層`;

  const headerXPx = LANE_X.C * scale;
  const headerYPx = layout.headerY * scale;
  const archYPx = headerYPx - Math.round(36 * scale);
  const lanternOffsetX = Math.round(150 * scale);
  const lanternYPx = headerYPx + Math.round(8 * scale);

  return (
    <div aria-label={`block-${isEnglishCopy ? layout.labelEn : layout.label}`}>
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
          key={`connector-${layout.blockKey}-${i}`}
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
        label={isEnglishCopy ? layout.labelEn : layout.label}
        depthLabel={depthLabel}
        xPx={headerXPx}
        yPx={headerYPx}
        scale={scale}
        dim={dim}
        cleared={doorOpened}
        theme={theme}
      />

      {hasNextBlock && lastNode && (
        <>
          <BlockDoor
            xPx={lastNode.x * scale}
            yPx={(lastNode.y - 10) * scale}
            scale={scale}
            opened={doorOpened}
            dim={dim}
            doorFilter={blockFilter.door}
          />
          <BlockSeal
            xPx={lastNode.x * scale}
            yPx={(lastNode.y - 90) * scale}
            scale={scale}
            theme={theme}
            opened={doorOpened}
            dim={dim}
          />
        </>
      )}

      {layout.nodes.map((nodePos) => (
        <LandingPlatform
          key={`plat-${nodePos.nodeId}`}
          type={nodePos.landingType}
          xPx={nodePos.x * scale}
          yPx={nodePos.y * scale}
          scale={scale}
          dim={dim}
          platformFilter={blockFilter.platform}
        />
      ))}

      {layout.nodes.map((nodePos) => {
        const cleared = clearedNodeIds.has(nodePos.nodeId);
        const nodeState: StageNodeState = !blockUnlocked
          ? 'locked'
          : cleared
            ? 'cleared'
            : 'unlocked';
        const isFrontierNode = !dim
          && nodePos.nodeId === frontierNodeId
          && blockUnlocked
          && !cleared;
        return (
          <StageNode
            key={`node-${nodePos.nodeId}`}
            stageNumber={0}
            displayLabel={nodePos.displayLabel}
            xPx={nodePos.x * scale}
            yPx={nodePos.y * scale}
            scale={scale}
            state={nodeState}
            selected={selectedNodeId === nodePos.nodeId && !dim}
            onSelect={() => { /* onActivate handles selection */ }}
            onActivate={() => onSelectNode(nodePos.nodeId)}
            dim={dim}
            isFrontier={isFrontierNode}
          />
        );
      })}
    </div>
  );
};

export const DefenseBlockDimVeil: React.FC<{
  layout: PlayBlockLayout;
  scale: number;
  widthPx: number;
}> = ({ layout, scale, widthPx }) => {
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

export default DefenseDescentBlock;
