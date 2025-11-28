let wasm;

/**
 * @param {number} sample_rate
 */
export function init_pitch_detector(sample_rate) {
    wasm.init_pitch_detector(sample_rate);
}

/**
 * @returns {number}
 */
export function get_ring_buffer_ptr() {
    const ret = wasm.get_ring_buffer_ptr();
    return ret >>> 0;
}

/**
 * @returns {number}
 */
export function get_ring_buffer_size() {
    const ret = wasm.get_ring_buffer_size();
    return ret >>> 0;
}

/**
 * @returns {any}
 */
export function get_memory() {
    const ret = wasm.get_memory();
    return ret;
}

/**
 * リングバッファからYINバッファへコピーしてピッチ検出
 * @param {number} new_write_index
 * @returns {number}
 */
export function process_audio_block(new_write_index) {
    const ret = wasm.process_audio_block(new_write_index);
    return ret;
}

/**
 * 直接データからピッチ検出（analyze_pitch互換）
 * @param {number} ptr
 * @param {number} length
 * @param {number} sample_rate
 * @param {number} yin_threshold
 * @returns {number}
 */
export function analyze_pitch(ptr, length, sample_rate, yin_threshold) {
    const ret = wasm.analyze_pitch(ptr, length, sample_rate, yin_threshold);
    return ret;
}

/**
 * メモリ割り当て（互換性のため維持）
 * @param {number} size
 * @returns {number}
 */
export function alloc(size) {
    const ret = wasm.alloc(size);
    return ret >>> 0;
}

/**
 * メモリ解放（互換性のため維持）
 * @param {number} ptr
 * @param {number} size
 */
export function free(ptr, size) {
    wasm.free(ptr, size);
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbindgen_init_externref_table = function() {
        const table = wasm.__wbindgen_export_0;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
        ;
    };
    imports.wbg.__wbindgen_memory = function() {
        const ret = wasm.memory;
        return ret;
    };

    return imports;
}

function __wbg_init_memory(imports, memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('pitch_detector_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;
