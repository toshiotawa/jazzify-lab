#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 Running pre-build checks...\n');

let hasErrors = false;

// 1. package-lock.jsonのチェック
console.log('📦 Checking package-lock.json sync...');
try {
  execSync('npm ci --dry-run', { stdio: 'pipe' });
  console.log('✅ package-lock.json is in sync with package.json\n');
} catch (error) {
  console.error('❌ package-lock.json is out of sync!');
  console.error('   Run "npm install" to update it.\n');
  hasErrors = true;
}

// 2. TypeScriptの型チェック
console.log('🔤 Running TypeScript type check...');
try {
  execSync('npm run type-check', { stdio: 'pipe' });
  console.log('✅ TypeScript types are valid\n');
} catch (error) {
  console.error('❌ TypeScript type errors found!');
  console.error('   Run "npm run type-check" to see details.\n');
  hasErrors = true;
}

// 3. ESLintチェック
console.log('🧹 Running ESLint...');
try {
  execSync('npm run lint', { stdio: 'pipe' });
  console.log('✅ No linting errors found\n');
} catch (error) {
  console.error('❌ ESLint errors found!');
  console.error('   Run "npm run lint" to see details.\n');
  hasErrors = true;
}

// 4. 必須ファイルの存在チェック
console.log('📄 Checking required files...');
const requiredFiles = [
  'src/main.tsx',
  'index.html',
  'vite.config.ts',
  'tsconfig.json',
  'package.json',
  'package-lock.json'
];

const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.resolve(file)));
if (missingFiles.length === 0) {
  console.log('✅ All required files exist\n');
} else {
  console.error('❌ Missing required files:');
  missingFiles.forEach(file => console.error(`   - ${file}`));
  console.log('');
  hasErrors = true;
}

// 5. 環境変数チェック（ビルド時に必要なもの）
console.log('🔐 Checking environment variables...');
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length === 0) {
  console.log('✅ All required environment variables are set\n');
} else {
  console.warn('⚠️  Missing environment variables:');
  missingEnvVars.forEach(envVar => console.warn(`   - ${envVar}`));
  console.warn('   Build may fail or app may not work properly.\n');
}

// 6. 依存関係の脆弱性チェック
console.log('🛡️  Checking for security vulnerabilities...');
try {
  const auditResult = execSync('npm audit --json', { stdio: 'pipe' }).toString();
  const audit = JSON.parse(auditResult);
  
  if (audit.metadata.vulnerabilities.high > 0 || audit.metadata.vulnerabilities.critical > 0) {
    console.warn(`⚠️  Found ${audit.metadata.vulnerabilities.high} high and ${audit.metadata.vulnerabilities.critical} critical vulnerabilities`);
    console.warn('   Run "npm audit" for details.\n');
  } else {
    console.log('✅ No high or critical vulnerabilities found\n');
  }
} catch (error) {
  console.warn('⚠️  Could not check vulnerabilities\n');
}

// 結果表示
if (hasErrors) {
  console.error('\n❌ Pre-build checks failed! Please fix the errors above before building.');
  process.exit(1);
} else {
  console.log('\n✅ All pre-build checks passed! Ready to build.');
  process.exit(0);
}