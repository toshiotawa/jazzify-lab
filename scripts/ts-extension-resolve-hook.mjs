/**
 * ESM resolve フック: 拡張子なしの相対 import に `.ts` を補完する。
 *
 * `--experimental-strip-types` で TS を直接実行する際、Node ESM は拡張子なし
 * 相対 specifier を解決しない。TS 側の import は tsc/Vite と整合させるため拡張子を
 * 付けないので、Node 実行時のみこのフックで `.ts` を補う。
 */
export async function resolve(specifier, context, nextResolve) {
  const isRelative = specifier.startsWith('./') || specifier.startsWith('../');
  const hasExtension = /\.[a-zA-Z0-9]+$/.test(specifier);
  if (isRelative && !hasExtension) {
    try {
      return await nextResolve(`${specifier}.ts`, context);
    } catch {
      // フォールバックは元の specifier。
    }
  }
  return nextResolve(specifier, context);
}
