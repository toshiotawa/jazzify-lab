/**
 * 🎯 ノーツ降下軽量化スクリプト
 * パフォーマンス改善のための設定変更
 */

console.log('🎯 ノーツ降下軽量化を開始します...');

// 軽量化設定の適用
const optimizations = {
  // フレームレート制限
  targetFPS: 30,
  
  // 同時表示ノーツ数制限
  maxActiveNotes: 15,
  
  // エフェクト軽減
  reduceEffects: true,
  
  // ピアノ高さ縮小
  pianoHeight: 60,
  
  // ノーツスピード調整
  notesSpeed: 0.8,
  
  // ビューポート高さ縮小
  viewportHeight: 500
};

console.log('適用される軽量化設定:', optimizations);

// LocalStorageに設定を保存（ブラウザで実行時）
if (typeof localStorage !== 'undefined') {
  try {
    const currentSettings = JSON.parse(localStorage.getItem('gameSettings') || '{}');
    const newSettings = { ...currentSettings, ...optimizations, performanceMode: 'lightweight' };
    localStorage.setItem('gameSettings', JSON.stringify(newSettings));
    console.log('✅ 軽量化設定をLocalStorageに保存しました');
  } catch (error) {
    console.error('❌ LocalStorage保存エラー:', error);
  }
}

// 軽量化のヒント
console.log(`
🎯 ノーツ降下軽量化のヒント:

1. フレームレート: 60FPS → 30FPSに制限
2. 同時表示ノーツ: 最大15個に制限
3. エフェクト: パーティクルエフェクト軽減
4. ピアノ高さ: 80px → 60pxに縮小
5. ノーツスピード: 1.0 → 0.8に調整

これらの設定により、ノーツ降下のパフォーマンスが改善されます。
設定画面で手動調整も可能です。
`);

// Node.js環境での実行
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { optimizations };
} 