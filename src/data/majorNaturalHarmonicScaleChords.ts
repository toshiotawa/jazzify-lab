/**
 * メジャー / ナチュラルマイナー / ハーモニックマイナーの allowed_chords 用 ID 群。
 * チャーチモード7種（_ionian … _locrian）とは別のサフィックスで定義する（同音でも名称・IDを分離）。
 *
 * 解決は `parseScaleName` + `SCALE_ALIASES`（chord-utils / FantasyGameEngine.getChordDefinition）に委ねる。
 */

import { ALL_17_ROOTS } from '@/utils/chord-templates';

/** メジャースケール（C_major — C_ionian とは別ID） */
export const SCALE_SUFFIX_MAJOR = '_major' as const;

/** ナチュラルマイナー（C_natural_minor — C_aeolian とは別ID） */
export const SCALE_SUFFIX_NATURAL_MINOR = '_natural_minor' as const;

/** ハーモニックマイナー */
export const SCALE_SUFFIX_HARMONIC_MINOR = '_harmonic_minor' as const;

/** チャーチモード7種のサフィックス（参照用。本モジュールの3種とは別グループ） */
export const CHURCH_MODE_SCALE_SUFFIXES = [
  '_ionian',
  '_dorian',
  '_phrygian',
  '_lydian',
  '_mixolydian',
  '_aeolian',
  '_locrian',
] as const;

/** メジャー / ナチュラルマイナー / ハーモニックマイナーの3サフィックス */
export const MAJOR_NATURAL_HARMONIC_SCALE_SUFFIXES = [
  SCALE_SUFFIX_MAJOR,
  SCALE_SUFFIX_NATURAL_MINOR,
  SCALE_SUFFIX_HARMONIC_MINOR,
] as const;

const mapRoots = (suffix: string): string[] => ALL_17_ROOTS.map((root) => `${root}${suffix}`);

/** 全17ルート × メジャースケール */
export const ALL_MAJOR_SCALE_CHORD_IDS: readonly string[] = mapRoots(SCALE_SUFFIX_MAJOR);

/** 全17ルート × ナチュラルマイナー */
export const ALL_NATURAL_MINOR_SCALE_CHORD_IDS: readonly string[] = mapRoots(SCALE_SUFFIX_NATURAL_MINOR);

/** 全17ルート × ハーモニックマイナー */
export const ALL_HARMONIC_MINOR_SCALE_CHORD_IDS: readonly string[] = mapRoots(SCALE_SUFFIX_HARMONIC_MINOR);

/** 上記3種を結合（allowed_chords にそのまま展開可能） */
export const ALL_MAJOR_NATURAL_HARMONIC_SCALE_CHORD_IDS: readonly string[] = [
  ...ALL_MAJOR_SCALE_CHORD_IDS,
  ...ALL_NATURAL_MINOR_SCALE_CHORD_IDS,
  ...ALL_HARMONIC_MINOR_SCALE_CHORD_IDS,
];
