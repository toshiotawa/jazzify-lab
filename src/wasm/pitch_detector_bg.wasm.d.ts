/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export const get_ring_buffer_ptr: () => number;
export const get_ring_buffer_size: () => number;
export const get_memory: () => any;
export const process_audio_block: (a: number) => number;
export const analyze_pitch: (a: number, b: number, c: number, d: number) => number;
export const alloc: (a: number) => number;
export const free: (a: number, b: number) => void;
export const init_pitch_detector: (a: number) => void;
export const __wbindgen_export_0: WebAssembly.Table;
export const __wbindgen_start: () => void;
