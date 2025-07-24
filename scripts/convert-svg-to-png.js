const fs = require('fs');
const path = require('path');

// SVGファイルのリスト
const svgFiles = [
  'ドラキュラアイコン8.svg',
  '怪獣アイコン.svg',
  '死神アイコン1.svg',
  '海の怪物クラーケンのアイコン素材.svg',
  '狼男のイラスト4.svg',
  '魔王のアイコン素材.svg'
];

// 変換処理
async function convertSvgToPng() {
  const srcDir = path.join(__dirname, '../src/data');
  const destDir = path.join(__dirname, '../public/data');
  
  // 出力ディレクトリが存在しない場合は作成
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  for (const svgFile of svgFiles) {
    const svgPath = path.join(srcDir, svgFile);
    const pngFile = svgFile.replace('.svg', '.png');
    const pngPath = path.join(destDir, pngFile);
    
    if (fs.existsSync(svgPath)) {
      console.log(`Converting ${svgFile} to ${pngFile}...`);
      
      // 簡易的なSVG to PNG変換（実際の変換には外部ライブラリが必要）
      // ここではファイルの存在確認のみ
      if (fs.existsSync(pngPath)) {
        console.log(`✅ ${pngFile} already exists`);
      } else {
        console.log(`⚠️ ${pngFile} not found - manual conversion needed`);
      }
    } else {
      console.log(`❌ ${svgFile} not found in ${srcDir}`);
    }
  }
}

convertSvgToPng().catch(console.error); 