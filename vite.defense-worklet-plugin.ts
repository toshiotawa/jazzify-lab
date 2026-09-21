import { build as esbuildBuild } from 'esbuild';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import type { Plugin, ViteDevServer } from 'vite';

const pluginDir = dirname(fileURLToPath(import.meta.url));
const workletEntry = resolve(
  pluginDir,
  'src/game/defense/audio/defenseSeparateTracksProcessor.entry.ts',
);
const virtualId = 'virtual:defense-separate-tracks-processor-url';
const resolvedVirtualId = `\0${virtualId}`;
const devPublicPath = '/__defense-separate-tracks-processor.js';

const bundleWorklet = async (): Promise<string> => {
  const result = await esbuildBuild({
    absWorkingDir: pluginDir,
    entryPoints: [workletEntry],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
    minify: true,
    sourcemap: false,
    legalComments: 'none',
  });
  const text = result.outputFiles[0]?.text ?? '';
  if (text.length === 0) {
    throw new Error('Failed to bundle defense separate-tracks worklet');
  }
  return text;
};

export const defenseSeparateTracksWorkletPlugin = (): Plugin => {
  let command: 'build' | 'serve' = 'serve';
  let base = '/';
  let emittedRef: string | undefined;
  const urlPlaceholder = '__DEFENSE_SEPARATE_TRACKS_PROCESSOR_URL__';

  return {
    name: 'defense-separate-tracks-worklet',
    configResolved(config) {
      command = config.command;
      base = config.base;
    },
    resolveId(id) {
      if (id === virtualId) {
        return resolvedVirtualId;
      }
      return null;
    },
    async buildStart() {
      this.addWatchFile(workletEntry);
      this.addWatchFile(resolve(pluginDir, 'src/game/defense/defenseSeparateTracksMix.ts'));
      this.addWatchFile(resolve(pluginDir, 'src/game/defense/defenseSeparateTracksTransport.ts'));
      if (command !== 'build') {
        return;
      }
      const source = await bundleWorklet();
      emittedRef = this.emitFile({
        type: 'asset',
        name: 'defense-separate-tracks-processor.js',
        source,
      });
    },
    load(id) {
      if (id !== resolvedVirtualId) {
        return null;
      }
      if (command === 'serve') {
        return `export default ${JSON.stringify(devPublicPath)};`;
      }
      return `export default ${JSON.stringify(urlPlaceholder)};`;
    },
    generateBundle(_options, bundle) {
      if (!emittedRef) {
        return;
      }
      const fileName = this.getFileName(emittedRef);
      const prefix = base.endsWith('/') ? base : `${base}/`;
      const url = `${prefix}${fileName}`;
      const from = JSON.stringify(urlPlaceholder);
      const to = JSON.stringify(url);
      for (const item of Object.values(bundle)) {
        if (item.type === 'chunk' && item.code.includes(urlPlaceholder)) {
          item.code = item.code.replaceAll(from, to);
        }
      }
    },
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];
        if (url !== devPublicPath) {
          next();
          return;
        }
        void bundleWorklet()
          .then((source) => {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            res.end(source);
          })
          .catch((error: unknown) => {
            next(error);
          });
      });
    },
  };
};

