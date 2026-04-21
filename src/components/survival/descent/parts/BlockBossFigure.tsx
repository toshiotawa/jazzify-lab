/**
 * ブロック末尾の扉前に立つボス（シルエット）。
 * ブロックキーごとに A/B/C のボスグラフィックを切り替え、
 * クリア済み・dim 状態では非表示、未クリア時は扉前にうっすら描画する。
 */

import React from 'react';
import { BlockKey } from '../../SurvivalStageDefinitions';
import { getBossTypeForBlock } from '../../SurvivalStageDefinitions';
import { BOSS_SPRITE_PATH } from '../../boss/SurvivalBossTypes';

interface BlockBossFigureProps {
  xPx: number;
  yPx: number;
  scale: number;
  blockKey: BlockKey;
  opened?: boolean;
  dim?: boolean;
}

const LOGICAL_SIZE = 110;

export const BlockBossFigure: React.FC<BlockBossFigureProps> = ({
  xPx,
  yPx,
  scale,
  blockKey,
  opened,
  dim,
}) => {
  if (opened) return null;
  const bossType = getBossTypeForBlock(blockKey);
  const sizePx = LOGICAL_SIZE * scale;
  const src = BOSS_SPRITE_PATH[bossType];
  const opacity = dim ? 0.18 : 0.55;
  const filter = dim
    ? 'brightness(0.4) saturate(0.3) blur(1.2px)'
    : 'brightness(0.85) saturate(0.85) drop-shadow(0 6px 12px rgba(0,0,0,0.55))';
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: xPx - sizePx / 2,
        top: yPx - sizePx,
        width: sizePx,
        height: sizePx,
        backgroundImage: `url('${src}')`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center bottom',
        opacity,
        filter,
        transition: 'opacity 300ms ease, filter 300ms ease',
        zIndex: 2,
      }}
    />
  );
};

export default BlockBossFigure;
