import React, { useMemo } from 'react';
import { LANE_X } from '@/components/survival/descent/descentLayout';
import StairConnector from '@/components/survival/descent/parts/StairConnector';
import StageNode, { type StageNodeState } from '@/components/survival/descent/parts/StageNode';
import CodeRunIslandPlatform from '@/components/play/codeRunMap/parts/CodeRunIslandPlatform';
import CodeRunWorldSign from '@/components/play/codeRunMap/parts/CodeRunWorldSign';
import { getCodeRunMapTheme } from '@/utils/codeRunMapTheme';
import type { PlayBlockLayout } from '@/components/play/defenseDescent/playDescentLayout';

interface CodeRunDescentBlockProps {
  layout: PlayBlockLayout;
  scale: number;
  selectedNodeId: string | null;
  clearedNodeIds: ReadonlySet<string>;
  blockUnlocked: boolean;
  onSelectNode: (nodeId: string) => void;
  dim: boolean;
  isEnglishCopy: boolean;
  frontierNodeId: string | null;
  hasNextBlock: boolean;
}

export const CodeRunDescentBlock: React.FC<CodeRunDescentBlockProps> = ({
  layout,
  scale,
  selectedNodeId,
  clearedNodeIds,
  blockUnlocked,
  onSelectNode,
  dim,
  isEnglishCopy,
  frontierNodeId,
  hasNextBlock,
}) => {
  const theme = getCodeRunMapTheme(layout.blockIndex);

  const lastNode = layout.nodes[layout.nodes.length - 1];
  const stageNodes = layout.nodes.filter((n) => n.node.nodeKind === 'stage');
  const blockCleared = stageNodes.length > 0
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

  const worldLabel = isEnglishCopy
    ? `WORLD ${layout.blockIndex + 1}`
    : `WORLD ${layout.blockIndex + 1}`;
  const blockLabel = isEnglishCopy ? layout.labelEn : layout.label;

  const headerXPx = LANE_X.C * scale;
  const headerYPx = layout.headerY * scale;

  return (
    <div aria-label={`block-${blockLabel}`}>
      {connectors.map((c, i) => (
        <StairConnector
          key={`connector-${layout.blockKey}-${i}`}
          from={{ x: c.from.x, y: c.from.y }}
          to={{ x: c.to.x, y: c.to.y }}
          scale={scale}
          dim={dim}
          highlighted={!dim && c.highlighted}
          hueDeg={theme.connectorHueDeg}
          mainStroke="rgba(255,248,235,0.95)"
          innerStroke="rgba(255,255,255,0.85)"
          glowColor="rgba(255,240,210,0.35)"
          highlightedMainStroke="rgba(255,210,80,1)"
          highlightedInnerStroke="rgba(255,248,210,0.95)"
          highlightedGlowColor="rgba(255,200,60,0.85)"
        />
      ))}

      <CodeRunWorldSign
        worldLabel={worldLabel}
        blockLabel={blockLabel}
        xPx={headerXPx}
        yPx={headerYPx}
        scale={scale}
        dim={dim}
        theme={theme}
      />

      {hasNextBlock && lastNode && blockCleared && (
        <div
          aria-hidden
          className="pointer-events-none absolute flex items-center justify-center font-bold text-white"
          style={{
            left: lastNode.x * scale - Math.round(14 * scale),
            top: (lastNode.y - 52) * scale,
            width: Math.round(28 * scale),
            height: Math.round(28 * scale),
            fontSize: Math.max(10, 14 * scale),
            background: 'linear-gradient(to bottom, #fbbf24, #d97706)',
            borderRadius: '50%',
            border: '2px solid #fff8dc',
            boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
            zIndex: 12,
            opacity: dim ? 0.4 : 1,
          }}
        >
          →
        </div>
      )}

      {layout.nodes.map((nodePos) => (
        <CodeRunIslandPlatform
          key={`island-${nodePos.nodeId}`}
          type={nodePos.landingType}
          biome={theme.biome}
          xPx={nodePos.x * scale}
          yPx={nodePos.y * scale}
          scale={scale}
          dim={dim}
          islandFilter={theme.islandFilter}
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

export const CodeRunBlockDimVeil: React.FC<{
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
          'linear-gradient(to bottom, rgba(255,255,255,0.15) 0%, rgba(200,210,230,0.45) 55%, rgba(160,170,190,0.65) 100%)',
        backdropFilter: 'blur(1px)',
        zIndex: 40,
      }}
    />
  );
};

export default CodeRunDescentBlock;
