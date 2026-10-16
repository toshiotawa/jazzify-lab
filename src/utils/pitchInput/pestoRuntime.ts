/** Select once, before initializing ONNX Runtime in the Worker. */
export const getPestoWasmThreadCount = (): 1 | 2 => (
  typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated
    && typeof SharedArrayBuffer !== 'undefined'
    && typeof navigator !== 'undefined' && navigator.hardwareConcurrency >= 2
    ? 2 : 1
);
