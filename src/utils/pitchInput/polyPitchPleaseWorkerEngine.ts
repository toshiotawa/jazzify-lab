/**
 * PitchPlease piano detector for the polyphonic Web Worker (non-Worklet path).
 */

import { PITCH_PLEASE_ASSET_BASE } from '@/utils/pitchLab/pitchPleaseLab';

export interface PolyPitchFrame {
  readonly probs: Float32Array | readonly number[];
  readonly t?: number;
}

export interface PolyPitchDetector {
  push(samples: Float32Array): PolyPitchFrame[];
}

export interface PolyPitchWorkerEngine {
  readonly detector: PolyPitchDetector;
  readonly kernelId: string;
  readonly inputRate: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null
);

type LoadModelFn = (
  model: 'piano',
  signal: AbortSignal | undefined,
  baseUrl: string,
) => Promise<{ manifest: unknown; weights: ArrayBuffer }>;

type ResolveKernelFn = (
  preference: 'auto',
  wasmFormat: 'bytes',
  signal: AbortSignal | undefined,
  baseUrl: string,
) => Promise<{
  choice: { id: string };
  impl: {
    createDetector: (
      weights: unknown,
      options: { inputRate: number; wasmModule: WebAssembly.Module | ArrayBuffer },
    ) => PolyPitchDetector;
    parseWeights: (manifest: unknown, weights: ArrayBuffer) => unknown;
  };
  wasm: WebAssembly.Module | ArrayBuffer;
}>;

const isLoadModelFn = (value: unknown): value is LoadModelFn => typeof value === 'function';

const isResolveKernelFn = (value: unknown): value is ResolveKernelFn => typeof value === 'function';

const loadVendorModules = async (baseUrl: string) => {
  const modelsUrl = `${baseUrl}engine/models.js`;
  const kernelUrl = `${baseUrl}engine/kernel-load.js`;
  const [modelsModule, kernelModule] = await Promise.all([
    import(/* @vite-ignore */ modelsUrl),
    import(/* @vite-ignore */ kernelUrl),
  ]);
  if (!isRecord(modelsModule) || !isLoadModelFn(modelsModule.loadModel)) {
    throw new Error('PitchPlease models.js が読み込めません');
  }
  if (!isRecord(kernelModule) || !isResolveKernelFn(kernelModule.resolveKernel)) {
    throw new Error('PitchPlease kernel-load.js が読み込めません');
  }
  return { loadModel: modelsModule.loadModel, resolveKernel: kernelModule.resolveKernel };
};

/** Loads the piano PitchPlease kernel and detector for 48 kHz PCM chunks. */
export const initPolyPitchWorkerEngine = async (
  inputRate = 48_000,
): Promise<PolyPitchWorkerEngine> => {
  const baseUrl = PITCH_PLEASE_ASSET_BASE;
  const { loadModel, resolveKernel } = await loadVendorModules(baseUrl);
  const [loaded, kernel] = await Promise.all([
    loadModel('piano', undefined, baseUrl),
    resolveKernel('auto', 'bytes', undefined, baseUrl),
  ]);
  const detector = kernel.impl.createDetector(
    kernel.impl.parseWeights(loaded.manifest, loaded.weights),
    { inputRate, wasmModule: kernel.wasm },
  );
  return { detector, kernelId: kernel.choice.id, inputRate };
};