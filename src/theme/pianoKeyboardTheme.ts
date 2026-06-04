/**
 * 全モード共通の象牙鍵盤パレット（Web Canvas / iOS Swift と hex を揃える）。
 * iOS 対応: ios/Jazzify/Main/PianoKeyboardTheme.swift
 */
export const pianoKeyboardTheme = {
  whiteKeyGradientTop: '#EBE4D0',
  whiteKeyGradientMid: '#D9CEB0',
  whiteKeyGradientBottom: '#C4B896',
  whiteKeyBase: '#D9CEB0',
  whiteKeyPressed: '#C9BC98',
  blackKeyGradientTop: '#1A1814',
  blackKeyGradientMid: '#121010',
  blackKeyGradientBottom: '#0A0908',
  blackKeyBase: '#121010',
  pianoBaseBand: '#0A0908',
  keySeparatorStroke: 'rgba(50, 42, 30, 0.45)',
  whiteKeyHighlightGloss: 'rgba(235, 228, 208, 0.35)',
  whiteKeySideShadow: 'rgba(50, 42, 30, 0.18)',
  blackKeyGloss: 'rgba(235, 228, 208, 0.12)',
  blackKeySideHighlight: 'rgba(235, 228, 208, 0.08)',
  blackKeyBottomShadow: 'rgba(0, 0, 0, 0.45)',
  blackKeyStroke: 'rgba(0, 0, 0, 0.65)',
  noteNameLabel: 'rgba(85, 75, 58, 0.85)',
} as const;
