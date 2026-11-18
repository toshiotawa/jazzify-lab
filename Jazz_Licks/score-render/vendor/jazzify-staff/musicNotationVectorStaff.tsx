/**
 * iOS `ChordVoicingStaffView.MusicNotationSymbol` と同じ幾何で、音部記号・変化記号を SVG パスで描く。
 * Safari の SMuFL／PUA→絵文字問題を避ける（foreignObject + Web フォントに依存しない）。
 */

import React from 'react';

/** staffSpacing（Web `ChordVoicingStaff` の SP と一致させる） */
export interface MusicNotationVectorCommonProps {
  readonly s: number;
  readonly stroke: string;
}

const strokeTreble = (s: number): number => Math.max(2, s * 0.18);

const strokeBassWidth = (s: number): number => Math.max(2, s * 0.2);

/** アンカー (0,0) = ト音譜の基準線（五線の第 4 線）。親で translate(clefLeftX, anchorLineY)。 */
export const MusicNotationVectorTrebleClef: React.FC<MusicNotationVectorCommonProps> = ({ s, stroke }) => {
  const cx = s * 0.1;
  const ay = 0;
  const w = strokeTreble(s);

  const spineD = [
    `M ${cx + s * 0.1} ${ay + s * 2.55}`,
    `C ${cx + s * 0.95} ${ay + s * 1.1} ${cx - s * 0.85} ${ay - s * 1.8} ${cx - s * 0.08} ${ay - s * 3.0}`,
    `C ${cx + s * 0.6} ${ay - s * 3.75} ${cx + s * 1.25} ${ay - s * 2.75} ${cx + s * 0.65} ${ay - s * 1.8}`,
    `C ${cx - s * 0.5} ${ay - s * 0.45} ${cx + s * 1.0} ${ay + s * 1.35} ${cx + s * 0.12} ${ay + s * 2.72}`,
    `C ${cx + s * 0.02} ${ay + s * 3.4} ${cx - s * 0.98} ${ay + s * 3.02} ${cx - s * 0.58} ${ay + s * 2.12}`,
  ].join(' ');

  const loopD = [
    `M ${cx + s * 1.02} ${ay - s * 0.46}`,
    `C ${cx + s * 0.42} ${ay - s * 1.32} ${cx - s * 0.78} ${ay - s * 1.05} ${cx - s * 0.85} ${ay - s * 0.12}`,
    `C ${cx - s * 1.22} ${ay + s * 0.84} ${cx + s * 0.2} ${ay + s * 1.22} ${cx + s * 0.78} ${ay + s * 0.55}`,
    `C ${cx + s * 1.2} ${ay + s * 0.22} ${cx + s * 1.28} ${ay - s * 0.18} ${cx + s * 1.02} ${ay - s * 0.46}`,
  ].join(' ');

  return (
    <g aria-hidden data-smufl-vector-glyph="treble-clef" fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth={w}>
      <path d={spineD} />
      <path d={loopD} />
    </g>
  );
};

/** アンカー (0,0) = ヘ音譜の基準線（五線の第 2 線）。親で translate(clefLeftX, anchorLineY)。 */
export const MusicNotationVectorBassClef: React.FC<MusicNotationVectorCommonProps> = ({ s, stroke }) => {
  const x = 0;
  const ay = 0;
  const w = strokeBassWidth(s);

  const mainD = [
    `M ${x + s * 0.32} ${ay - s * 0.78}`,
    `C ${x + s * 2.25} ${ay - s * 1.12} ${x + s * 2.7} ${ay + s * 0.82} ${x + s * 0.1} ${ay + s * 1.25}`,
    `C ${x + s * 1.24} ${ay + s * 0.38} ${x + s * 1.22} ${ay - s * 0.34} ${x + s * 0.34} ${ay - s * 0.12}`,
  ].join(' ');

  return (
    <g aria-hidden data-smufl-vector-glyph="bass-clef" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={mainD} fill="none" stroke={stroke} strokeWidth={w} />
      <ellipse cx={x + s * 0.26} cy={ay - s * 0.2} fill={stroke} rx={s * 0.16} ry={s * 0.16} stroke="none" />
      <ellipse cx={x + s * 2.79} cy={ay - s * 0.52} fill={stroke} rx={s * 0.14} ry={s * 0.14} stroke="none" />
      <ellipse cx={x + s * 2.79} cy={ay + s * 0.52} fill={stroke} rx={s * 0.14} ry={s * 0.14} stroke="none" />
    </g>
  );
};

export interface MusicNotationVectorAccidentalProps extends MusicNotationVectorCommonProps {
  readonly alter: number;
}

/** 中心 (0,0)。親で translate(centerX, centerY)。 */
export const MusicNotationVectorAccidental: React.FC<MusicNotationVectorAccidentalProps> = ({ alter, s, stroke }) => {
  switch (alter) {
    case 2:
      return <MusicNotationVectorDoubleSharp s={s} stroke={stroke} />;
    case 1:
      return <MusicNotationVectorSharp s={s} stroke={stroke} />;
    case -1:
      return <MusicNotationVectorFlat s={s} stroke={stroke} />;
    case -2:
      return <MusicNotationVectorDoubleFlat s={s} stroke={stroke} />;
    case 0:
      return <MusicNotationVectorNatural s={s} stroke={stroke} />;
    default:
      return null;
  }
};

const MusicNotationVectorSharp: React.FC<MusicNotationVectorCommonProps> = ({ s, stroke }) => {
  const vert = Math.max(1.2, s * 0.13);
  const beam = Math.max(1.8, s * 0.2);
  const segs: readonly [number, number, number, number][] = [
    [-0.34, -1.15, -0.5, 1.15],
    [0.42, -1.2, 0.26, 1.1],
    [-0.86, -0.42, 0.82, -0.64],
    [-0.9, 0.46, 0.78, 0.24],
  ];
  return (
    <g aria-hidden data-smufl-vector-glyph="sharp" stroke={stroke}>
      {segs.map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          strokeLinecap={i < 2 ? 'round' : 'butt'}
          strokeWidth={i < 2 ? vert : beam}
          x1={s * x1}
          x2={s * x2}
          y1={s * y1}
          y2={s * y2}
        />
      ))}
    </g>
  );
};

const MusicNotationVectorNatural: React.FC<MusicNotationVectorCommonProps> = ({ s, stroke }) => {
  const miter = Math.max(1.4, s * 0.15);
  const beam = Math.max(1.7, s * 0.2);
  return (
    <g aria-hidden data-smufl-vector-glyph="natural" fill="none" stroke={stroke} strokeLinecap="butt" strokeLinejoin="miter">
      <line strokeWidth={miter} x1={s * -0.35} x2={s * -0.35} y1={s * -1.05} y2={s * 0.68} />
      <line strokeWidth={miter} x1={s * 0.38} x2={s * 0.38} y1={s * -0.68} y2={s * 1.05} />
      <line strokeWidth={beam} x1={s * -0.35} x2={s * 0.38} y1={s * -0.18} y2={s * -0.42} />
      <line strokeWidth={beam} x1={s * -0.35} x2={s * 0.38} y1={s * 0.58} y2={s * 0.34} />
    </g>
  );
};

const MusicNotationVectorFlat: React.FC<MusicNotationVectorCommonProps> = ({ s, stroke }) => {
  const w = Math.max(1.6, s * 0.16);
  const d = [
    `M ${s * -0.15} ${s * -1.65}`,
    `L ${s * -0.15} ${s * 0.49}`,
    `C ${s * 0.8} ${s * 0.12} ${s * 0.4} ${s * -0.61} ${s * -0.15} ${s * -0.48}`,
  ].join(' ');
  return (
    <g aria-hidden data-smufl-vector-glyph="flat" fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth={w}>
      <path d={d} />
    </g>
  );
};

const MusicNotationVectorDoubleSharp: React.FC<MusicNotationVectorCommonProps> = ({ s, stroke }) => {
  const w = Math.max(1.8, s * 0.2);
  return (
    <g aria-hidden data-smufl-vector-glyph="double-sharp" fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth={w}>
      <line x1={s * -0.58} x2={s * 0.58} y1={s * -0.58} y2={s * 0.58} />
      <line x1={s * 0.58} x2={s * -0.58} y1={s * -0.58} y2={s * 0.58} />
    </g>
  );
};

const MusicNotationVectorDoubleFlat: React.FC<MusicNotationVectorCommonProps> = ({ s, stroke }) => {
  const off = s * 0.36;
  return (
    <g aria-hidden data-smufl-vector-glyph="double-flat">
      <g transform={`translate(${-off}, 0)`}>
        <MusicNotationVectorFlat s={s} stroke={stroke} />
      </g>
      <g transform={`translate(${off}, 0)`}>
        <MusicNotationVectorFlat s={s} stroke={stroke} />
      </g>
    </g>
  );
};
