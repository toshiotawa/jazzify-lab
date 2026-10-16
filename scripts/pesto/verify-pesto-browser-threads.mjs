#!/usr/bin/env node
// Compare the emitted model on identical sampled piano PCM in real browser WASM.
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
const [manifestPath, outputPath] = process.argv.slice(2);
if (!manifestPath || !outputPath) throw new Error('Usage: <fixtures.json> <output.json>');
const { chromium } = await import(process.env.PESTO_PLAYWRIGHT_MODULE ?? 'playwright');
const dist = new URL('../../dist/', import.meta.url);
const ids = ['salamander-phrase-250', 'felt-phrase-250', 'salamander-repeat-200-0', 'felt-repeat-200-0'];
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const parts = [], hashes = {};
for (const id of ids) {
  const fixture = manifest.cases.find((item) => item.id === id);
  const bytes = await readFile(resolve(dirname(manifestPath), 'fixtures', basename(fixture.file)));
  hashes[id] = createHash('sha256').update(bytes).digest('hex');
  if (hashes[id] !== fixture.pcmSha256) throw new Error(`PCM checksum mismatch: ${id}`);
  parts.push(bytes.subarray(0, 48000 * 4 * 2)); // First two seconds of each clip.
}
const pcm = Buffer.concat(parts);
const harness = await build({ stdin: { contents: `
  import * as ort from 'onnxruntime-web/wasm';
  onmessage = async ({data}) => {
    try {
      ort.env.wasm.numThreads = data.threads;
      ort.env.wasm.wasmPaths = '/ort/';
      const model = await (await fetch('/models/pesto/pesto-mir1k-g7-48000-240-refill-compact-v2.onnx')).arrayBuffer();
      const session = await ort.InferenceSession.create(model, {executionProviders:['wasm']});
      const pcm = new Float32Array(data.pcm), cache = new Float32Array(3976), audio = new Float32Array(240);
      const feeds = {audio:new ort.Tensor('float32', audio, [1,240]),cache:new ort.Tensor('float32',cache,[1,3976])};
      const values = [], timings = []; let maxCacheDifference = 0;
      for (let i=0;i+240<=pcm.length;i+=240) {
        audio.set(pcm.subarray(i,i+240));
        const start=performance.now();
        const result=await session.run(feeds,['prediction','confidence','volume','cache_out']);
        if(i>=4800) timings.push(performance.now()-start);
        values.push(result.prediction.data[0],result.confidence.data[0],result.volume.data[0]);
        cache.set(result.cache_out.data);
        for(let j=0;j<cache.length;j++) {
          const source=i+240-cache.length+j;
          maxCacheDifference=Math.max(maxCacheDifference,Math.abs(cache[j]-(source<0?0:pcm[source])));
        }
        for (const tensor of Object.values(result)) tensor.dispose();
      }
      await session.release();
      timings.sort((a,b)=>a-b);
      postMessage({threads:ort.env.wasm.numThreads,isolated:crossOriginIsolated,values,maxCacheDifference,
        frames:values.length/3,p50:timings[Math.floor(timings.length*.5)],p95:timings[Math.floor(timings.length*.95)]});
    } catch(error) {postMessage({error:String(error)});}
  };`, resolveDir: process.cwd(), loader: 'js' }, bundle: true, format: 'esm', platform: 'browser', write: false });
const server = createServer(async (request, response) => {
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  response.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  try {
    const path = new URL(request.url, 'http://localhost').pathname;
    if (path === '/') { response.setHeader('Content-Type', 'text/html'); response.end('<!doctype html><title>PESTO threads verification</title>'); return; }
    if (path === '/harness.js') { response.setHeader('Content-Type', 'text/javascript'); response.end(harness.outputFiles[0].contents); return; }
    if (path === '/pcm.f32') { response.end(pcm); return; }
    const file = new URL(`.${path}`, dist);
    if (!file.href.startsWith(dist.href)) throw new Error('Invalid path');
    response.setHeader('Content-Type', ({ '.mjs': 'text/javascript', '.wasm': 'application/wasm' })[extname(file.pathname)] ?? 'application/octet-stream');
    response.end(await readFile(file));
  } catch { response.statusCode = 404; response.end(); }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({headless:true,executablePath:process.env.PESTO_CHROME_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  const results = [];
  for (const threads of [1, 2]) {
    const result = await page.evaluate(async (threads) => {
      const pcm = await (await fetch('/pcm.f32')).arrayBuffer();
      const worker = new Worker('/harness.js', {type:'module'});
      try {
        return await new Promise((done, reject) => {
          const timer = setTimeout(() => reject(new Error('Worker timeout')), 60000);
          worker.onerror = (event) => {clearTimeout(timer); reject(new Error(event.message));};
          worker.onmessage = ({data}) => {clearTimeout(timer); data.error ? reject(new Error(data.error)) : done(data);};
          worker.postMessage({threads,pcm},[pcm]);
        });
      } finally { worker.terminate(); }
    }, threads);
    results.push(result);
  }
  const maxDifference = [0, 0, 0];
  for (let i = 0; i < results[0].values.length; i += 1) {
    const difference = Math.abs(results[0].values[i] - results[1].values[i]);
    if (!Number.isFinite(difference)) throw new Error('Nonfinite output');
    maxDifference[i % 3] = Math.max(maxDifference[i % 3], difference);
  }
  if (results.some((r, i) => !r.isolated || r.threads !== i + 1 || r.maxCacheDifference !== 0 || r.frames !== results[0].frames)
      || maxDifference.some((v, i) => v > [0.001, 0.00001, 0.0001][i])) throw new Error(`Thread outputs differ: ${maxDifference}`);
  const output = { pcmSha256: hashes, maxDifference, results: results.map(({ values, ...result }) => result) };
  await writeFile(outputPath, JSON.stringify(output, null, 2) + '\n');
  process.stdout.write(JSON.stringify(output) + '\n');
} finally { await browser.close(); server.close(); }
