const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase設定（環境変数から取得推奨）
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://tfjubyqveoivwfmqeoij.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service Roleキーが必要

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY環境変数を設定してください');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backupTable(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*');

  if (error) {
    console.error(`Error backing up ${tableName}:`, error);
    return null;
  }

  return data;
}

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups', `backup_${timestamp}`);
  
  // バックアップディレクトリを作成
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // バックアップするテーブル一覧
  const tables = [
    'profiles',
    'songs',
    'challenges',
    'challenge_tracks',
    'challenge_progress',
    'courses',
    'lessons',
    'lesson_tracks',
    'diaries',
    'diary_comments',
    'diary_likes',
    'track_clears',
    'xp_history',
    'user_lesson_progress',
    'announcements',
    'user_song_stats'
  ];

  console.log(`バックアップ開始: ${timestamp}`);

  for (const table of tables) {
    console.log(`バックアップ中: ${table}`);
    const data = await backupTable(table);
    
    if (data) {
      const filePath = path.join(backupDir, `${table}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`✓ ${table}: ${data.length}件のレコード`);
    }
  }

  console.log(`\nバックアップ完了: ${backupDir}`);
}

// 実行
backupDatabase().catch(console.error); 