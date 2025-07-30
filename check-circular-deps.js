/**
 * 循環参照チェックスクリプト
 * madgeを使用してプロジェクト内の循環参照を検出
 */

import madge from 'madge';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkCircularDependencies() {
  console.log('🔍 循環参照をチェック中...\n');

  try {
    const result = await madge('./src', {
      baseDir: __dirname,
      fileExtensions: ['ts', 'tsx'],
      excludeRegExp: [
        /\.test\./,
        /\.spec\./,
        /\.stories\./,
        /node_modules/
      ],
      tsConfig: path.join(__dirname, 'tsconfig.json')
    });

    const circular = result.circular();

    if (circular.length === 0) {
      console.log('✅ 循環参照は見つかりませんでした！');
      process.exit(0);
    } else {
      console.error('❌ 循環参照が見つかりました:\n');
      circular.forEach((cycle, index) => {
        console.error(`循環 ${index + 1}:`);
        cycle.forEach((file, fileIndex) => {
          const arrow = fileIndex === cycle.length - 1 ? '↩' : '→';
          console.error(`  ${file} ${arrow}`);
        });
        console.error('');
      });

      // 詳細な依存関係グラフを出力
      console.log('\n📊 詳細な依存関係:');
      const dependencies = result.obj();
      circular.forEach(cycle => {
        cycle.forEach(file => {
          console.log(`\n${file} が依存しているファイル:`);
          dependencies[file]?.forEach(dep => {
            console.log(`  - ${dep}`);
          });
        });
      });

      process.exit(1);
    }
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

checkCircularDependencies();