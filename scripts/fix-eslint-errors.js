#!/usr/bin/env node

/**
 * ESLint自動修正スクリプト
 * TypeScriptプロジェクトのESLintエラーを自動的に修正
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// 修正対象のディレクトリ
const TARGET_DIRS = ['src', 'netlify/functions'];
const ROOT_FILES = ['MidiController.ts', 'Piano.ts'];

// ログヘルパー
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  warn: (msg) => console.warn(`⚠️  ${msg}`)
};

// ファイルの内容を読み込む
async function readFile(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    log.error(`Failed to read ${filePath}: ${error.message}`);
    return null;
  }
}

// ファイルに内容を書き込む
async function writeFile(filePath, content) {
  try {
    await fs.writeFile(filePath, content, 'utf8');
    log.success(`Updated ${filePath}`);
  } catch (error) {
    log.error(`Failed to write ${filePath}: ${error.message}`);
  }
}

// TypeScriptファイルのanyタイプを修正
async function fixAnyTypes(filePath) {
  let content = await readFile(filePath);
  if (!content) return;

  let changed = false;
  const originalContent = content;

  // any型の一般的なパターンを修正
  const replacements = [
    // 関数パラメータのany
    { from: /:\s*any\[\]/g, to: ': unknown[]' },
    { from: /:\s*any\)/g, to: ': unknown)' },
    { from: /:\s*any,/g, to: ': unknown,' },
    { from: /:\s*any;/g, to: ': unknown;' },
    { from: /:\s*any\s*=/g, to: ': unknown =' },
    { from: /:\s*any\s*\|/g, to: ': unknown |' },
    { from: /\|\s*any/g, to: '| unknown' },
    // Recordタイプ
    { from: /Record<string,\s*any>/g, to: 'Record<string, unknown>' },
    { from: /Map<string,\s*any>/g, to: 'Map<string, unknown>' },
    // 配列
    { from: /Array<any>/g, to: 'Array<unknown>' },
    // as any キャスト
    { from: /as\s+any/g, to: 'as unknown' }
  ];

  for (const { from, to } of replacements) {
    const newContent = content.replace(from, to);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  }

  if (changed) {
    await writeFile(filePath, content);
  }
}

// console.logをloggerに置き換える
async function replaceConsoleLog(filePath) {
  let content = await readFile(filePath);
  if (!content) return;

  let changed = false;
  const originalContent = content;

  // loggerのインポートを追加（まだない場合）
  if (!content.includes("import { log }") && !content.includes('import log')) {
    const importRegex = /^(import\s+.*?;?\s*\n)+/m;
    const match = content.match(importRegex);
    if (match) {
      const lastImportEnd = match.index + match[0].length;
      content = content.slice(0, lastImportEnd) + 
                "import { log } from '@/utils/logger';\n" + 
                content.slice(lastImportEnd);
      changed = true;
    }
  }

  // console.log/warn/errorをlog.debug/warn/errorに置き換え
  const consoleReplacements = [
    { from: /console\.log\(/g, to: 'log.debug(' },
    { from: /console\.info\(/g, to: 'log.info(' },
    { from: /console\.warn\(/g, to: 'log.warn(' },
    { from: /console\.error\(/g, to: 'log.error(' }
  ];

  for (const { from, to } of consoleReplacements) {
    const newContent = content.replace(from, to);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  }

  if (changed) {
    await writeFile(filePath, content);
  }
}

// 未使用の変数を削除またはアンダースコアプレフィックスを追加
async function fixUnusedVars(filePath) {
  let content = await readFile(filePath);
  if (!content) return;

  let changed = false;

  // 未使用のimportを削除
  const unusedImportPatterns = [
    /import\s+{\s*([^}]*?)\s*}\s+from\s+['"][^'"]+['"]\s*;?\s*\n/g
  ];

  // 関数パラメータで未使用のものにアンダースコアを追加
  // これは複雑なので、ESLintの--fixオプションに任せる

  if (changed) {
    await writeFile(filePath, content);
  }
}

// labelタグにhtmlFor属性を追加
async function fixLabelAccessibility(filePath) {
  let content = await readFile(filePath);
  if (!content) return;

  let changed = false;
  let idCounter = 1;

  // <label>タグを見つけて、対応するinput/select/textareaを探す
  content = content.replace(
    /<label([^>]*?)>([\s\S]*?)<\/label>\s*<(input|select|textarea)([^>]*?)>/g,
    (match, labelAttrs, labelContent, inputType, inputAttrs) => {
      // すでにhtmlForがある場合はスキップ
      if (labelAttrs.includes('htmlFor=')) {
        return match;
      }

      // inputにidがあるか確認
      const idMatch = inputAttrs.match(/id=["']([^"']+)["']/);
      let inputId;
      
      if (idMatch) {
        inputId = idMatch[1];
      } else {
        // idがない場合は生成
        inputId = `field-${Date.now()}-${idCounter++}`;
        inputAttrs = ` id="${inputId}"${inputAttrs}`;
        changed = true;
      }

      // labelにhtmlForを追加
      labelAttrs = ` htmlFor="${inputId}"${labelAttrs}`;
      changed = true;

      return `<label${labelAttrs}>${labelContent}</label>\n<${inputType}${inputAttrs}>`;
    }
  );

  if (changed) {
    await writeFile(filePath, content);
  }
}

// TypeScriptファイルを処理
async function processTypeScriptFile(filePath) {
  log.info(`Processing ${filePath}...`);
  
  // ファイルがTypeScript/TSXファイルか確認
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
    return;
  }

  // 各種修正を適用
  await fixAnyTypes(filePath);
  await replaceConsoleLog(filePath);
  await fixUnusedVars(filePath);
  
  if (filePath.endsWith('.tsx')) {
    await fixLabelAccessibility(filePath);
  }
}

// ディレクトリを再帰的に処理
async function processDirectory(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // node_modulesなどは除外
        if (!['node_modules', 'dist', '.git', 'coverage'].includes(entry.name)) {
          await processDirectory(fullPath);
        }
      } else if (entry.isFile()) {
        await processTypeScriptFile(fullPath);
      }
    }
  } catch (error) {
    log.error(`Failed to process directory ${dirPath}: ${error.message}`);
  }
}

// ESLintの自動修正を実行
async function runESLintFix() {
  log.info('Running ESLint auto-fix...');
  
  try {
    const { stdout, stderr } = await execAsync('npx eslint . --ext ts,tsx --fix --max-warnings 0');
    if (stdout) log.info(stdout);
    if (stderr) log.warn(stderr);
    log.success('ESLint auto-fix completed');
  } catch (error) {
    // ESLintはエラーがあると非ゼロで終了するが、それは想定内
    log.warn('ESLint auto-fix completed with some remaining issues');
  }
}

// ts-pruneを実行
async function runTsPrune() {
  log.info('Running ts-prune to find unused exports...');
  
  try {
    const { stdout } = await execAsync('npx ts-prune --project tsconfig.json');
    if (stdout) {
      await fs.writeFile('ts-prune-report.txt', stdout, 'utf8');
      log.success('ts-prune report saved to ts-prune-report.txt');
    }
  } catch (error) {
    log.error(`ts-prune failed: ${error.message}`);
  }
}

// メイン処理
async function main() {
  log.info('Starting ESLint error fix process...');
  
  // 1. カスタム修正を適用
  for (const dir of TARGET_DIRS) {
    await processDirectory(dir);
  }
  
  for (const file of ROOT_FILES) {
    if (await fs.access(file).then(() => true).catch(() => false)) {
      await processTypeScriptFile(file);
    }
  }
  
  // 2. ESLintの自動修正を実行
  await runESLintFix();
  
  // 3. ts-pruneを実行
  await runTsPrune();
  
  log.success('ESLint error fix process completed!');
  log.info('Please run "npm run lint" to check remaining issues');
}

// エラーハンドリング
process.on('unhandledRejection', (error) => {
  log.error(`Unhandled rejection: ${error}`);
  process.exit(1);
});

// スクリプトを実行
main().catch((error) => {
  log.error(`Script failed: ${error.message}`);
  process.exit(1);
});