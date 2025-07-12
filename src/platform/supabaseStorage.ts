import { getSupabaseClient } from '@/platform/supabaseClient';

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const supabase = getSupabaseClient();
  const ext = file.type.includes('png') ? 'png' : 'jpg';
  const path = `${userId}.${ext}`;
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

// 曲ファイルアップロード用の定数
const SONG_FILES_BUCKET = 'song-files';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// バケットの作成（初回のみ必要）
export async function createSongFilesBucket() {
  const supabase = getSupabaseClient();
  
  try {
    // バケットが存在するか確認
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(bucket => bucket.name === SONG_FILES_BUCKET);
    
    if (!exists) {
      // バケットを作成（publicバケットとして作成）
      const { error } = await supabase.storage.createBucket(SONG_FILES_BUCKET, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE
      });
      
      if (error) {
        console.error('バケット作成エラー:', error);
        throw error;
      }
      
      console.log('song-filesバケットを作成しました');
    }
  } catch (error) {
    console.error('バケット確認/作成エラー:', error);
  }
}

// 曲ファイルのアップロード
export async function uploadSongFile(
  file: File, 
  songId: string, 
  fileType: 'audio' | 'xml' | 'json'
): Promise<string> {
  const supabase = getSupabaseClient();
  
  // ファイルタイプに応じた拡張子を決定
  let ext: string;
  switch (fileType) {
    case 'audio':
      ext = 'mp3';
      break;
    case 'xml':
      ext = 'xml';
      break;
    case 'json':
      ext = 'json';
      break;
  }
  
  // ファイルパス（songId/type.ext形式）
  const path = `${songId}/${fileType}.${ext}`;
  
  // アップロード
  const { error } = await supabase.storage
    .from(SONG_FILES_BUCKET)
    .upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: true // 既存ファイルがあれば上書き
    });
  
  if (error) {
    console.error(`${fileType}ファイルアップロードエラー:`, error);
    throw error;
  }
  
  // 公開URLを取得
  const { data } = supabase.storage
    .from(SONG_FILES_BUCKET)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

// 曲ファイルの削除
export async function deleteSongFiles(songId: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  // 該当する曲のファイルをすべて削除
  const files = [
    `${songId}/audio.mp3`,
    `${songId}/xml.xml`,
    `${songId}/json.json`
  ];
  
  const { error } = await supabase.storage
    .from(SONG_FILES_BUCKET)
    .remove(files);
  
  if (error) {
    console.error('ファイル削除エラー:', error);
    throw error;
  }
} 