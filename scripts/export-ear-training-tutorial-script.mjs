#!/usr/bin/env node
/**
 * developer-full-v1 台本 JSON を stdout に出力（Supabase seed / iOS bundle 用）
 * `@/` 省略のため実行は `tsx` が必要。
 * Run: `npx tsx scripts/export-ear-training-tutorial-script.mjs > ios/…/ear-training-developer-full-v1.script.json`
 */
import { buildEarTrainingDeveloperFullV1Script } from '../src/components/earTraining/tutorial/buildEarTrainingDeveloperFullV1Script.ts';

const id = process.argv[2] ?? 'developer-full-v1';

if (id !== 'developer-full-v1') {
  console.error(`Unknown script id: ${id}`);
  process.exit(1);
}

console.log(JSON.stringify(buildEarTrainingDeveloperFullV1Script(), null, 2));
