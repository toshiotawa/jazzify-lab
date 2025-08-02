/* tslint:disable */
/* eslint-disable */
export function alloc(size: number): number;
export function free(ptr: number, size: number): void;
export function get_memory(): unknown;
export function init_pitch_detector(sample_rate: number): void;
export function get_ring_buffer_ptr(): number;
export function get_ring_buffer_size(): number;
export function analyze_pitch(ptr: number, length: number, sample_rate: number, yin_threshold: number): number;
export function process_audio_block(new_write_index: number): number;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly alloc: (a: number) => number;
  readonly free: (a: number, b: number) => void;
  readonly get_memory: () => any;
  readonly init_pitch_detector: (a: number) => void;
  readonly get_ring_buffer_ptr: () => number;
  readonly get_ring_buffer_size: () => number;
  readonly analyze_pitch: (a: number, b: number, c: number, d: number) => number;
  readonly process_audio_block: (a: number) => number;
  readonly __wbindgen_export_0: WebAssembly.Table;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
