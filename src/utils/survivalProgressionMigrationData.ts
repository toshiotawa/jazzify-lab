/**
 * survival_stages.chord_progression を再生成するためのソースデータ。
 *
 * 既存マイグレーションに格納された chord_progression JSON をそのまま再掲し、
 * これに `voicing_names` と `key_fifths` を付与したマイグレーション SQL を生成する。
 *
 * - 5 II-V-I ステージは `inferred`（II→V→I 検出 + chroma 6→Gb）。
 * - 4 Blues ステージは `fixed`（曲の Home key を全コードに適用）。
 * - 6 Jazz Standards 1 ステージは `fixed`（曲の Home key を全コードに適用）。
 *
 * 実行時には使われない（CLI 専用）。
 */

import type { SurvivalProgressionStageMigrationInput } from './survivalProgressionMigrationGenerator';

/** II-V-I Part 1（key C, F, Bb, Eb の II-V-I を 2 周）。 */
const STAGE_1: SurvivalProgressionStageMigrationInput = {
  mapCategory: 'songs',
  stageNumber: 1,
  keyPolicy: { kind: 'inferred' },
  chordProgression: [
    { name: 'Dm7(9)', voicing: [53, 57, 60, 64] },
    { name: 'G7(9.13)', voicing: [53, 57, 59, 64] },
    { name: 'CM7(9)', voicing: [52, 55, 59, 62] },
    { name: 'Dm7(9)', voicing: [53, 57, 60, 64] },
    { name: 'G7(9.13)', voicing: [53, 57, 59, 64] },
    { name: 'CM7(9)', voicing: [52, 55, 59, 62] },
    { name: 'Gm7(9)', voicing: [53, 57, 58, 62] },
    { name: 'C7(9.13)', voicing: [52, 57, 58, 62] },
    { name: 'FM7(9)', voicing: [64, 67, 69, 72] },
    { name: 'Gm7(9)', voicing: [53, 57, 58, 62] },
    { name: 'C7(9.13)', voicing: [52, 57, 58, 62] },
    { name: 'FM7(9)', voicing: [64, 67, 69, 72] },
    { name: 'Cm7(9)', voicing: [51, 55, 58, 62] },
    { name: 'F7(9.13)', voicing: [51, 55, 57, 62] },
    { name: 'BbM7(9)', voicing: [62, 65, 69, 72] },
    { name: 'Cm7(9)', voicing: [51, 55, 58, 62] },
    { name: 'F7(9.13)', voicing: [51, 55, 57, 62] },
    { name: 'BbM7(9)', voicing: [62, 65, 69, 72] },
    { name: 'Fm7(9)', voicing: [63, 67, 68, 72] },
    { name: 'Bb7(9.13)', voicing: [62, 67, 68, 72] },
    { name: 'EbM7(9)', voicing: [50, 53, 55, 58] },
    { name: 'Fm7(9)', voicing: [63, 67, 68, 72] },
    { name: 'Bb7(9.13)', voicing: [62, 67, 68, 72] },
    { name: 'EbM7(9)', voicing: [50, 53, 55, 58] },
  ],
};

/** II-V-I Part 2（key Ab, Db, Gb, B の II-V-I を 2 周）。Gb は -6（Gb 固定方針）。 */
const STAGE_2: SurvivalProgressionStageMigrationInput = {
  mapCategory: 'songs',
  stageNumber: 2,
  keyPolicy: { kind: 'inferred' },
  chordProgression: [
    { name: 'Bbm7(9)', voicing: [56, 60, 61, 65] },
    { name: 'Eb7(9.13)', voicing: [55, 60, 61, 65] },
    { name: 'AbM7(9)', voicing: [55, 58, 60, 63] },
    { name: 'Bbm7(9)', voicing: [56, 60, 61, 65] },
    { name: 'Eb7(9.13)', voicing: [55, 60, 61, 65] },
    { name: 'AbM7(9)', voicing: [55, 58, 60, 63] },
    { name: 'Ebm7(9)', voicing: [54, 58, 61, 65] },
    { name: 'Ab7(9.13)', voicing: [54, 58, 60, 65] },
    { name: 'DbM7(9)', voicing: [53, 56, 60, 63] },
    { name: 'Ebm7(9)', voicing: [54, 58, 61, 65] },
    { name: 'Ab7(9.13)', voicing: [54, 58, 60, 65] },
    { name: 'DbM7(9)', voicing: [53, 56, 60, 63] },
    { name: 'Abm7(9)', voicing: [54, 58, 59, 63] },
    { name: 'Db7(9.13)', voicing: [53, 58, 59, 63] },
    { name: 'GbM7(9)', voicing: [53, 56, 58, 61] },
    { name: 'Abm7(9)', voicing: [54, 58, 59, 63] },
    { name: 'Db7(9.13)', voicing: [53, 58, 59, 63] },
    { name: 'GbM7(9)', voicing: [53, 56, 58, 61] },
    { name: 'C#m7(9)', voicing: [52, 56, 59, 63] },
    { name: 'F#7(9.13)', voicing: [52, 56, 58, 63] },
    { name: 'BM7(9)', voicing: [51, 54, 58, 61] },
    { name: 'C#m7(9)', voicing: [52, 56, 59, 63] },
    { name: 'F#7(9.13)', voicing: [52, 56, 58, 63] },
    { name: 'BM7(9)', voicing: [51, 54, 58, 61] },
  ],
};

/** II-V-I Part 3（key E, A, D, G の II-V-I を 2 周）。 */
const STAGE_3: SurvivalProgressionStageMigrationInput = {
  mapCategory: 'songs',
  stageNumber: 3,
  keyPolicy: { kind: 'inferred' },
  chordProgression: [
    { name: 'F#m7(9)', voicing: [52, 56, 57, 61] },
    { name: 'B7(9.13)', voicing: [51, 56, 57, 61] },
    { name: 'EM7(9)', voicing: [63, 66, 68, 71] },
    { name: 'F#m7(9)', voicing: [52, 56, 57, 61] },
    { name: 'B7(9.13)', voicing: [51, 56, 57, 61] },
    { name: 'EM7(9)', voicing: [63, 66, 68, 71] },
    { name: 'Bm7(9)', voicing: [57, 61, 62, 66] },
    { name: 'E7(9.13)', voicing: [56, 61, 62, 66] },
    { name: 'AM7(9)', voicing: [56, 59, 61, 64] },
    { name: 'Bm7(9)', voicing: [57, 61, 62, 66] },
    { name: 'E7(9.13)', voicing: [56, 61, 62, 66] },
    { name: 'AM7(9)', voicing: [56, 59, 61, 64] },
    { name: 'Em7(9)', voicing: [55, 59, 62, 66] },
    { name: 'A7(9.13)', voicing: [55, 59, 61, 66] },
    { name: 'DM7(9)', voicing: [54, 57, 61, 64] },
    { name: 'Em7(9)', voicing: [55, 59, 62, 66] },
    { name: 'A7(9.13)', voicing: [55, 59, 61, 66] },
    { name: 'DM7(9)', voicing: [54, 57, 61, 64] },
    { name: 'Am7(9)', voicing: [55, 59, 60, 64] },
    { name: 'D7(9.13)', voicing: [54, 59, 60, 64] },
    { name: 'GM7(9)', voicing: [54, 57, 59, 62] },
    { name: 'Am7(9)', voicing: [55, 59, 60, 64] },
    { name: 'D7(9.13)', voicing: [54, 59, 60, 64] },
    { name: 'GM7(9)', voicing: [54, 57, 59, 62] },
  ],
};

/** II-V-I in All Key（12 keys 1 周）。 */
const STAGE_4: SurvivalProgressionStageMigrationInput = {
  mapCategory: 'songs',
  stageNumber: 4,
  keyPolicy: { kind: 'inferred' },
  chordProgression: [
    { name: 'Dm7(9)', voicing: [53, 57, 60, 64] },
    { name: 'G7(9.13)', voicing: [53, 57, 59, 64] },
    { name: 'CM7(9)', voicing: [52, 55, 59, 62] },
    { name: 'Gm7(9)', voicing: [53, 57, 58, 62] },
    { name: 'C7(9.13)', voicing: [52, 57, 58, 62] },
    { name: 'FM7(9)', voicing: [64, 67, 69, 72] },
    { name: 'Cm7(9)', voicing: [51, 55, 58, 62] },
    { name: 'F7(9.13)', voicing: [51, 55, 57, 62] },
    { name: 'BbM7(9)', voicing: [62, 65, 69, 72] },
    { name: 'Fm7(9)', voicing: [63, 67, 68, 72] },
    { name: 'Bb7(9.13)', voicing: [62, 67, 68, 72] },
    { name: 'EbM7(9)', voicing: [50, 53, 55, 58] },
    { name: 'Bbm7(9)', voicing: [56, 60, 61, 65] },
    { name: 'Eb7(9.13)', voicing: [55, 60, 61, 65] },
    { name: 'AbM7(9)', voicing: [55, 58, 60, 63] },
    { name: 'Ebm7(9)', voicing: [54, 58, 61, 65] },
    { name: 'Ab7(9.13)', voicing: [54, 58, 60, 65] },
    { name: 'DbM7(9)', voicing: [53, 56, 60, 63] },
    { name: 'Abm7(9)', voicing: [54, 58, 59, 63] },
    { name: 'Db7(9.13)', voicing: [53, 58, 59, 63] },
    { name: 'GbM7(9)', voicing: [53, 56, 58, 61] },
    { name: 'C#m7(9)', voicing: [52, 56, 59, 63] },
    { name: 'F#7(9.13)', voicing: [52, 56, 58, 63] },
    { name: 'BM7(9)', voicing: [51, 54, 58, 61] },
    { name: 'F#m7(9)', voicing: [52, 56, 57, 61] },
    { name: 'B7(9.13)', voicing: [51, 56, 57, 61] },
    { name: 'EM7(9)', voicing: [63, 66, 68, 71] },
    { name: 'Bm7(9)', voicing: [57, 61, 62, 66] },
    { name: 'E7(9.13)', voicing: [56, 61, 62, 66] },
    { name: 'AM7(9)', voicing: [56, 59, 61, 64] },
    { name: 'Em7(9)', voicing: [55, 59, 62, 66] },
    { name: 'A7(9.13)', voicing: [55, 59, 61, 66] },
    { name: 'DM7(9)', voicing: [54, 57, 61, 64] },
    { name: 'Am7(9)', voicing: [55, 59, 60, 64] },
    { name: 'D7(9.13)', voicing: [54, 59, 60, 64] },
    { name: 'GM7(9)', voicing: [54, 57, 59, 62] },
  ],
};

/** II-V-I in All Key Boss（STAGE_4 と同じ 12 keys 1 周）。 */
const STAGE_5: SurvivalProgressionStageMigrationInput = {
  ...STAGE_4,
  stageNumber: 5,
};

/** F Blues（home key F = -1） */
const STAGE_6: SurvivalProgressionStageMigrationInput = {
  mapCategory: 'songs',
  stageNumber: 6,
  keyPolicy: { kind: 'fixed', keyFifths: -1 },
  chordProgression: [
    { name: 'F7(9.13)', voicing: [51, 55, 57, 62] },
    { name: 'Bb7(9.13)', voicing: [62, 67, 68, 72] },
    { name: 'F7(9.13)', voicing: [51, 55, 57, 62] },
    { name: 'F7(9.13)', voicing: [51, 55, 57, 62] },
    { name: 'Bb7(9.13)', voicing: [62, 67, 68, 72] },
    { name: 'Bdim7', voicing: [53, 56, 59, 62] },
    { name: 'F7(9.13)', voicing: [51, 55, 57, 62] },
    { name: 'D7(b9.b13)', voicing: [54, 58, 60, 63] },
    { name: 'Gm7(9)', voicing: [53, 57, 58, 62] },
    { name: 'C7(9.13)', voicing: [52, 57, 58, 62] },
    { name: 'F7(9.13)', voicing: [51, 55, 57, 62] },
    { name: 'D7(b9.b13)', voicing: [54, 58, 60, 63] },
    { name: 'Gm7(9)', voicing: [53, 57, 58, 62] },
    { name: 'C7(9.13)', voicing: [52, 57, 58, 62] },
  ],
};

/** Bb Blues（home key Bb = -2） */
const STAGE_7: SurvivalProgressionStageMigrationInput = {
  mapCategory: 'songs',
  stageNumber: 7,
  keyPolicy: { kind: 'fixed', keyFifths: -2 },
  chordProgression: [
    { name: 'Bb7(9.13)', voicing: [62, 67, 68, 72] },
    { name: 'Eb7(9.13)', voicing: [55, 60, 61, 65] },
    { name: 'Bb7(9.13)', voicing: [62, 67, 68, 72] },
    { name: 'Bb7(9.13)', voicing: [62, 67, 68, 72] },
    { name: 'Eb7(9.13)', voicing: [55, 60, 61, 65] },
    { name: 'Edim7', voicing: [52, 55, 58, 61] },
    { name: 'Bb7(9.13)', voicing: [62, 67, 68, 72] },
    { name: 'G7(b9.b13)', voicing: [53, 56, 59, 63] },
    { name: 'Cm7(9)', voicing: [51, 55, 58, 62] },
    { name: 'F7(9.13)', voicing: [51, 55, 57, 62] },
    { name: 'Bb7(9.13)', voicing: [62, 67, 68, 72] },
    { name: 'G7(b9.b13)', voicing: [53, 56, 59, 63] },
    { name: 'Cm7(9)', voicing: [51, 55, 58, 62] },
    { name: 'F7(9.13)', voicing: [51, 55, 57, 62] },
  ],
};

/** C Blues（home key C = 0） */
const STAGE_8: SurvivalProgressionStageMigrationInput = {
  mapCategory: 'songs',
  stageNumber: 8,
  keyPolicy: { kind: 'fixed', keyFifths: 0 },
  chordProgression: [
    { name: 'C7(9.13)', voicing: [52, 57, 58, 62] },
    { name: 'F7(9.13)', voicing: [51, 55, 57, 62] },
    { name: 'C7(9.13)', voicing: [52, 57, 58, 62] },
    { name: 'C7(9.13)', voicing: [52, 57, 58, 62] },
    { name: 'F7(9.13)', voicing: [51, 55, 57, 62] },
    { name: 'F#dim7', voicing: [54, 57, 60, 63] },
    { name: 'C7(9.13)', voicing: [52, 57, 58, 62] },
    { name: 'A7(b9.b13)', voicing: [55, 58, 61, 65] },
    { name: 'Dm7(9)', voicing: [53, 57, 60, 64] },
    { name: 'G7(9.13)', voicing: [53, 57, 59, 64] },
    { name: 'C7(9.13)', voicing: [52, 57, 58, 62] },
    { name: 'A7(b9.b13)', voicing: [55, 58, 61, 65] },
    { name: 'Dm7(9)', voicing: [53, 57, 60, 64] },
    { name: 'G7(9.13)', voicing: [53, 57, 59, 64] },
  ],
};

/** F Blues Boss（home key F = -1, STAGE_6 と同じ進行） */
const STAGE_9: SurvivalProgressionStageMigrationInput = {
  ...STAGE_6,
  stageNumber: 9,
};

/** Leaves（home key Bb = -2） */
const STAGE_10: SurvivalProgressionStageMigrationInput = {
  mapCategory: 'songs',
  stageNumber: 10,
  keyPolicy: { kind: 'fixed', keyFifths: -2 },
  chordProgression: [
    { name: 'Cm7(9)', voicing: [51, 55, 58, 62] },
    { name: 'F7(9.13)', voicing: [51, 55, 57, 62] },
    { name: 'BbM7(9)', voicing: [62, 65, 69, 72] },
    { name: 'EbM7(9)', voicing: [50, 53, 55, 58] },
    { name: 'Am7(b5)', voicing: [55, 59, 60, 63] },
    { name: 'D7(b9.b13)', voicing: [54, 58, 60, 63] },
    { name: 'Gm7(9)', voicing: [53, 57, 58, 62] },
    { name: 'G7(b9.b13)', voicing: [53, 56, 59, 63] },
    { name: 'Cm7(9)', voicing: [51, 55, 58, 62] },
    { name: 'F7(9.13)', voicing: [51, 55, 57, 62] },
    { name: 'BbM7(9)', voicing: [62, 65, 69, 72] },
    { name: 'EbM7(9)', voicing: [50, 53, 55, 58] },
    { name: 'Am7(b5)', voicing: [55, 59, 60, 63] },
    { name: 'D7(b9.b13)', voicing: [54, 58, 60, 63] },
    { name: 'Gm7(9)', voicing: [53, 57, 58, 62] },
    { name: 'Gm6(9)', voicing: [52, 57, 58, 62] },
    { name: 'Am7(b5)', voicing: [55, 59, 60, 63] },
    { name: 'D7(b9.b13)', voicing: [54, 58, 60, 63] },
    { name: 'Gm7(9)', voicing: [53, 57, 58, 62] },
    { name: 'G7(b9.b13)', voicing: [53, 56, 59, 63] },
    { name: 'Cm7(9)', voicing: [51, 55, 58, 62] },
    { name: 'F7(9.13)', voicing: [51, 55, 57, 62] },
    { name: 'BbM7(9)', voicing: [62, 65, 69, 72] },
    { name: 'EbM7(9)', voicing: [50, 53, 55, 58] },
    { name: 'Am7(b5)', voicing: [55, 59, 60, 63] },
    { name: 'D7(b9.b13)', voicing: [54, 58, 60, 63] },
    { name: 'Gm7(9)', voicing: [53, 57, 58, 62] },
    { name: 'Gb7(9)', voicing: [52, 56, 58, 61] },
    { name: 'Fm7(9)', voicing: [63, 67, 68, 72] },
    { name: 'Bb7(9.13)', voicing: [62, 67, 68, 72] },
    { name: 'Eb7(9.13)', voicing: [55, 60, 61, 65] },
    { name: 'D7(b9.b13)', voicing: [54, 58, 60, 63] },
    { name: 'Gm7(9)', voicing: [53, 57, 58, 62] },
    { name: 'G7(b9.b13)', voicing: [53, 56, 59, 63] },
  ],
};

/** Moon（home key C = 0） */
const STAGE_11: SurvivalProgressionStageMigrationInput = {
  mapCategory: 'songs',
  stageNumber: 11,
  keyPolicy: { kind: 'fixed', keyFifths: 0 },
  chordProgression: [
    { name: 'Am7(9)', voicing: [55, 59, 60, 64] },
    { name: 'Dm7(9)', voicing: [53, 57, 60, 64] },
    { name: 'G7(9.13)', voicing: [53, 57, 59, 64] },
    { name: 'CM7(9)', voicing: [52, 55, 59, 62] },
    { name: 'C7(9.13)', voicing: [52, 57, 58, 62] },
    { name: 'FM7(9)', voicing: [64, 67, 69, 72] },
    { name: 'Bm7(b5)', voicing: [57, 61, 62, 65] },
    { name: 'E7(b9.b13)', voicing: [56, 60, 62, 65] },
    { name: 'Am7(9)', voicing: [55, 59, 60, 64] },
    { name: 'A7(b9.b13)', voicing: [55, 58, 61, 65] },
    { name: 'Dm7(9)', voicing: [53, 57, 60, 64] },
    { name: 'G7(9.13)', voicing: [53, 57, 59, 64] },
    { name: 'CM7(9)', voicing: [52, 55, 59, 62] },
    { name: 'A7(b9.b13)', voicing: [55, 58, 61, 65] },
    { name: 'Dm7(9)', voicing: [53, 57, 60, 64] },
    { name: 'G7(9.13)', voicing: [53, 57, 59, 64] },
    { name: 'CM7(9)', voicing: [52, 55, 59, 62] },
    { name: 'Bm7(b5)', voicing: [57, 61, 62, 65] },
    { name: 'E7(b9.b13)', voicing: [56, 60, 62, 65] },
    { name: 'Am7(9)', voicing: [55, 59, 60, 64] },
    { name: 'Dm7(9)', voicing: [53, 57, 60, 64] },
    { name: 'G7(9.13)', voicing: [53, 57, 59, 64] },
    { name: 'CM7(9)', voicing: [52, 55, 59, 62] },
    { name: 'C7(9.13)', voicing: [52, 57, 58, 62] },
    { name: 'FM7(9)', voicing: [64, 67, 69, 72] },
    { name: 'Bm7(b5)', voicing: [57, 61, 62, 65] },
    { name: 'E7(b9.b13)', voicing: [56, 60, 62, 65] },
    { name: 'Am7(9)', voicing: [55, 59, 60, 64] },
    { name: 'A7(b9.b13)', voicing: [55, 58, 61, 65] },
    { name: 'Dm7(9)', voicing: [53, 57, 60, 64] },
    { name: 'D#dim7', voicing: [51, 54, 57, 60] },
    { name: 'Em7', voicing: [55, 59, 62, 66] },
    { name: 'A7(b9.b13)', voicing: [55, 58, 61, 65] },
    { name: 'Dm7(9)', voicing: [53, 57, 60, 64] },
    { name: 'G7(9.13)', voicing: [53, 57, 59, 64] },
    { name: 'CM7(9)', voicing: [52, 55, 59, 62] },
    { name: 'Bm7(b5)', voicing: [57, 61, 62, 65] },
    { name: 'E7(b9.b13)', voicing: [56, 60, 62, 65] },
  ],
};

/** Part of Me（home key C = 0） */
const STAGE_12: SurvivalProgressionStageMigrationInput = {
  mapCategory: 'songs',
  stageNumber: 12,
  keyPolicy: { kind: 'fixed', keyFifths: 0 },
  chordProgression: [
    { name: 'C6(9)', voicing: [52, 55, 57, 62] },
    { name: 'C6(9)', voicing: [52, 55, 57, 62] },
    { name: 'E7(b9.b13)', voicing: [56, 60, 62, 65] },
    { name: 'E7(b9.b13)', voicing: [56, 60, 62, 65] },
    { name: 'A7(b9.b13)', voicing: [55, 58, 61, 65] },
    { name: 'A7(b9.b13)', voicing: [55, 58, 61, 65] },
    { name: 'Dm7(9)', voicing: [53, 57, 60, 64] },
    { name: 'Dm7(9)', voicing: [53, 57, 60, 64] },
    { name: 'Bm7(b5)', voicing: [57, 61, 62, 65] },
    { name: 'E7(b9.b13)', voicing: [56, 60, 62, 65] },
    { name: 'Am7(9)', voicing: [55, 59, 60, 64] },
    { name: 'Am7(9)', voicing: [55, 59, 60, 64] },
    { name: 'D7(9.13)', voicing: [54, 59, 60, 64] },
    { name: 'D7(9.13)', voicing: [54, 59, 60, 64] },
    { name: 'Dm7(9)', voicing: [53, 57, 60, 64] },
    { name: 'G7(9.13)', voicing: [53, 57, 59, 64] },
    { name: 'C6(9)', voicing: [52, 55, 57, 62] },
    { name: 'C6(9)', voicing: [52, 55, 57, 62] },
    { name: 'E7(b9.b13)', voicing: [56, 60, 62, 65] },
    { name: 'E7(b9.b13)', voicing: [56, 60, 62, 65] },
    { name: 'A7(b9.b13)', voicing: [55, 58, 61, 65] },
    { name: 'A7(b9.b13)', voicing: [55, 58, 61, 65] },
    { name: 'Dm7(9)', voicing: [53, 57, 60, 64] },
    { name: 'Dm7(9)', voicing: [53, 57, 60, 64] },
    { name: 'FM7(9)', voicing: [64, 67, 69, 72] },
    { name: 'Fm6(9)', voicing: [62, 67, 68, 72] },
    { name: 'Em7', voicing: [55, 59, 62, 66] },
    { name: 'A7(b9.b13)', voicing: [55, 58, 61, 65] },
    { name: 'Dm7(9)', voicing: [53, 57, 60, 64] },
    { name: 'G7(9.13)', voicing: [53, 57, 59, 64] },
    { name: 'C6(9)', voicing: [52, 55, 57, 62] },
    { name: 'A7(b9.b13)', voicing: [55, 58, 61, 65] },
    { name: 'Dm7(9)', voicing: [53, 57, 60, 64] },
    { name: 'G7(9.13)', voicing: [53, 57, 59, 64] },
  ],
};

/** My Eyes（home key F = -1） */
const STAGE_13: SurvivalProgressionStageMigrationInput = {
  mapCategory: 'songs',
  stageNumber: 13,
  keyPolicy: { kind: 'fixed', keyFifths: -1 },
  chordProgression: [
    { name: 'FM7(9)', voicing: [64, 67, 69, 72] },
    { name: 'FM7(9)', voicing: [64, 67, 69, 72] },
    { name: 'Em7(b5)', voicing: [55, 58, 62, 66] },
    { name: 'A7(b9.b13)', voicing: [55, 58, 61, 65] },
    { name: 'Dm7(9)', voicing: [53, 57, 60, 64] },
    { name: 'G7(9.13)', voicing: [53, 57, 59, 64] },
    { name: 'Cm7(9)', voicing: [51, 55, 58, 62] },
    { name: 'F7(9.13)', voicing: [51, 55, 57, 62] },
    { name: 'BbM7(9)', voicing: [62, 65, 69, 72] },
    { name: 'Eb7(9.13)', voicing: [55, 60, 61, 65] },
    { name: 'FM7(9)', voicing: [64, 67, 69, 72] },
    { name: 'FM7(9)', voicing: [64, 67, 69, 72] },
    { name: 'Bm7(b5)', voicing: [57, 61, 62, 65] },
    { name: 'E7(b9.b13)', voicing: [56, 60, 62, 65] },
    { name: 'Am7(9)', voicing: [55, 59, 60, 64] },
    { name: 'Ab7(9)', voicing: [54, 58, 60, 63] },
    { name: 'Gm7(9)', voicing: [53, 57, 58, 62] },
    { name: 'C7(9.13)', voicing: [52, 57, 58, 62] },
  ],
};

/** Roses（home key F = -1） */
const STAGE_14: SurvivalProgressionStageMigrationInput = {
  mapCategory: 'songs',
  stageNumber: 14,
  keyPolicy: { kind: 'fixed', keyFifths: -1 },
  chordProgression: [
    { name: 'FM7(9)', voicing: [64, 67, 69, 72] },
    { name: 'Eb7(9.13)', voicing: [55, 60, 61, 65] },
    { name: 'Am7(b5)', voicing: [55, 59, 60, 63] },
    { name: 'D7(b9.b13)', voicing: [54, 58, 60, 63] },
    { name: 'Gm7(9)', voicing: [53, 57, 58, 62] },
    { name: 'Gm7(9)', voicing: [53, 57, 58, 62] },
    { name: 'Eb7(9.13)', voicing: [55, 60, 61, 65] },
    { name: 'Eb7(9.13)', voicing: [55, 60, 61, 65] },
    { name: 'Am7', voicing: [55, 59, 60, 64] },
    { name: 'Dm7(9)', voicing: [53, 57, 60, 64] },
    { name: 'Gm7(9)', voicing: [53, 57, 58, 62] },
    { name: 'Gm7(9)', voicing: [53, 57, 58, 62] },
    { name: 'Em7(b5)', voicing: [55, 58, 62, 66] },
    { name: 'A7(b9.b13)', voicing: [55, 58, 61, 65] },
    { name: 'Dm7(9)', voicing: [53, 57, 60, 64] },
    { name: 'G7(9.13)', voicing: [53, 57, 59, 64] },
    { name: 'Gm7(9)', voicing: [53, 57, 58, 62] },
    { name: 'C7(9.13)', voicing: [52, 57, 58, 62] },
  ],
};

/** Leaves Boss（home key Bb = -2, STAGE_10 と同じ進行） */
const STAGE_15: SurvivalProgressionStageMigrationInput = {
  ...STAGE_10,
  stageNumber: 15,
};

export const SURVIVAL_PROGRESSION_MIGRATION_INPUTS: readonly SurvivalProgressionStageMigrationInput[] = [
  STAGE_1, STAGE_2, STAGE_3, STAGE_4, STAGE_5,
  STAGE_6, STAGE_7, STAGE_8, STAGE_9,
  STAGE_10, STAGE_11, STAGE_12, STAGE_13, STAGE_14, STAGE_15,
];
