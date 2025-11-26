/**
 * Type definitions for pitchfinder
 * Based on pitchfinder v2.3.2
 */

declare module 'pitchfinder' {
  export interface YINConfig {
    threshold?: number;
    sampleRate?: number;
    probabilityThreshold?: number;
  }

  export interface AMDFConfig {
    sampleRate?: number;
    minFrequency?: number;
    maxFrequency?: number;
    ratio?: number;
    sensitivity?: number;
  }

  export interface ACF2PlusConfig {
    sampleRate?: number;
  }

  export interface DynamicWaveletConfig {
    sampleRate?: number;
  }

  export interface MacleodConfig {
    sampleRate?: number;
    bufferSize?: number;
    cutoff?: number;
    smallCutoff?: number;
    lowerPitchCutoff?: number;
  }

  export type PitchDetector = (buffer: Float32Array) => number | null;

  export function YIN(config?: YINConfig): PitchDetector;
  export function AMDF(config?: AMDFConfig): PitchDetector;
  export function ACF2PLUS(config?: ACF2PlusConfig): PitchDetector;
  export function DynamicWavelet(config?: DynamicWaveletConfig): PitchDetector;
  export function Macleod(config?: MacleodConfig): PitchDetector;

  const Pitchfinder: {
    YIN: typeof YIN;
    AMDF: typeof AMDF;
    ACF2PLUS: typeof ACF2PLUS;
    DynamicWavelet: typeof DynamicWavelet;
    Macleod: typeof Macleod;
  };

  export default Pitchfinder;
}
