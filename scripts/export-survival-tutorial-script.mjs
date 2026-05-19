#!/usr/bin/env node
/**
 * onboarding-v1 v2 台本 JSON を stdout に出力（Supabase seed / iOS bundle 用）
 * Usage: node --experimental-strip-types ./scripts/export-survival-tutorial-script.mjs onboarding-v1
 */
import { buildOnboardingV1Script } from '../src/components/survival/tutorial/buildOnboardingV1Script.ts';

const id = process.argv[2] ?? 'onboarding-v1';

if (id !== 'onboarding-v1') {
  console.error(`Unknown script id: ${id}`);
  process.exit(1);
}

console.log(JSON.stringify(buildOnboardingV1Script(), null, 2));
