/**
 * 新しいコードシステムのテストスクリプト
 */

// ESMモジュールとして実行するためのラッパー
async function testChordSystem() {
  try {
    // tonal のインポート
    const { transpose, note: parseNote } = await import('tonal');
    
    console.log('🎼 コードシステムテスト開始\n');
    
    // テスト1: 基本的な移調
    console.log('=== テスト1: 基本的な移調 ===');
    const testCases = [
      { root: 'C', interval: '3M', expected: 'E' },
      { root: 'D#', interval: '3M', expected: 'Fx' },
      { root: 'Gb', interval: '3M', expected: 'Bb' },
      { root: 'B', interval: '2m', expected: 'C' },
    ];
    
    for (const test of testCases) {
      const result = transpose(test.root, test.interval);
      console.log(`${test.root} + ${test.interval} = ${result} (期待値: ${test.expected})`);
      console.log(`  ✓ 正しい: ${result === test.expected ? '✅' : '❌'}`);
    }
    
    // テスト2: コード構成音の生成
    console.log('\n=== テスト2: コード構成音（D#7） ===');
    const root = 'D#4';
    const intervals = ['1P', '3M', '5P', '7m'];
    const notes = intervals.map(ivl => transpose(root, ivl));
    console.log(`D#7 = [${notes.join(', ')}]`);
    console.log('  期待値: [D#4, Fx4, A#4, C#5]');
    
    // テスト3: 簡易化
    console.log('\n=== テスト3: 簡易化（enharmonic） ===');
    const complexNotes = ['Fx', 'Gbb', 'B#', 'Cb'];
    for (const note of complexNotes) {
      const parsed = parseNote(note);
      console.log(`${note} → ${parsed.enharmonic || '(簡易化なし)'}`);
    }
    
    console.log('\n🎼 テスト完了');
    
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

// 実行
testChordSystem();