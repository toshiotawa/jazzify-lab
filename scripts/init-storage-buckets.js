/**
 * Supabaseストレージバケット初期化スクリプト
 * 実行: node scripts/init-storage-buckets.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ VITE_SUPABASE_URLとSUPABASE_SERVICE_ROLE_KEYが必要です');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBuckets() {
  console.log('🚀 ストレージバケット初期化開始...');

  try {
    // 既存のバケットを確認
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ バケット一覧取得エラー:', listError);
      return;
    }

    const bucketName = 'song-files';
    const exists = buckets?.some(bucket => bucket.name === bucketName);

    if (exists) {
      console.log(`✅ ${bucketName}バケットは既に存在します`);
    } else {
      // バケットを作成
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['audio/mpeg', 'application/json', 'application/xml', 'text/xml']
      });

      if (createError) {
        console.error(`❌ ${bucketName}バケット作成エラー:`, createError);
      } else {
        console.log(`✅ ${bucketName}バケットを作成しました`);
      }
    }

    console.log('✨ ストレージバケット初期化完了');

  } catch (error) {
    console.error('❌ 初期化エラー:', error);
  }
}

// 実行
createBuckets(); 