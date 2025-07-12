/**
 * Supabaseストレージバケット作成スクリプト
 * 実行: node scripts/create-storage-bucket.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  console.error('\n.envファイルに以下を追加してください:');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createBucket() {
  console.log('🚀 song-filesバケットを作成中...');
  
  try {
    // バケットの存在確認
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ バケット一覧取得エラー:', listError);
      return;
    }
    
    console.log('📦 既存のバケット:', buckets?.map(b => b.name).join(', ') || 'なし');
    
    const exists = buckets?.some(bucket => bucket.name === 'song-files');
    
    if (exists) {
      console.log('✅ song-filesバケットは既に存在します');
      return;
    }
    
    // バケットを作成
    const { data, error } = await supabase.storage.createBucket('song-files', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: [
        'audio/mpeg',
        'audio/mp3',
        'application/json',
        'application/xml',
        'text/xml'
      ]
    });
    
    if (error) {
      console.error('❌ バケット作成エラー:', error);
      console.error('詳細:', error.message);
      
      if (error.message?.includes('already exists')) {
        console.log('ℹ️ バケットは既に存在しているようです');
      }
      return;
    }
    
    console.log('✅ song-filesバケットを作成しました');
    console.log('📋 設定:');
    console.log('  - 公開バケット: はい');
    console.log('  - 最大ファイルサイズ: 50MB');
    console.log('  - 許可されるファイルタイプ: MP3, JSON, XML');
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error);
  }
}

// 実行
createBucket(); 