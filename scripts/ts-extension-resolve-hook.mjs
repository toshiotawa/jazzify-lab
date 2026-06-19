/**
 * ESM resolve フック: 拡張子なしの相対 import に `.ts` を補完し、`@/` エイリアスを解決する。
 *
 * `--experimental-strip-types` で TS を直接実行する際、Node ESM は拡張子なし
 * 相対 specifier を解決しない。TS 側の import は tsc/Vite と整合させるため拡張子を
 * 付けないので、Node 実行時のみこのフックで `.ts` を補う。
 */
import { dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), '..');

const ALIASES = [
  ['@/components', resolvePath(ROOT, 'src/components')],
  ['@/stores', resolvePath(ROOT, 'src/stores')],
  ['@/engines', resolvePath(ROOT, 'src/engines')],
  ['@/systems', resolvePath(ROOT, 'src/systems')],
  ['@/platform', resolvePath(ROOT, 'src/platform')],
  ['@/data', resolvePath(ROOT, 'src/data')],
  ['@/types', resolvePath(ROOT, 'src/types')],
  ['@/utils', resolvePath(ROOT, 'src/utils')],
  ['@', resolvePath(ROOT, 'src')],
];

const resolveAlias = (specifier) => {
  for (const [alias, target] of ALIASES) {
    if (specifier === alias) {
      return target;
    }
    if (specifier.startsWith(`${alias}/`)) {
      return `${target}${specifier.slice(alias.length)}`;
    }
  }
  return null;
};

export async function resolve(specifier, context, nextResolve) {
  const aliasTarget = resolveAlias(specifier);
  if (aliasTarget) {
    try {
      return await nextResolve(`${aliasTarget}.ts`, context);
    } catch {
      try {
        return await nextResolve(aliasTarget, context);
      } catch {
        // フォールバックは元の specifier。
      }
    }
  }

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
