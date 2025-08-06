import { getSupabaseClient } from '@/platform/supabaseClient';
import { 
  uploadAvatarToR2, 
  uploadDiaryImageToR2, 
  uploadSongFileToR2,
  deleteAvatarFromR2,
  deleteDiaryImageFromR2,
  deleteSongFilesFromR2
} from '@/platform/r2Storage';

// Avatar upload function - now uses R2
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  // Upload to R2 instead of Supabase
  return uploadAvatarToR2(file, userId);
}

// 曲ファイルアップロード用の定数
const SONG_FILES_BUCKET = 'song-files';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// 日記画像アップロード用の定数
const DIARY_IMAGES_BUCKET = 'diary-images';
const MAX_DIARY_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB

// バケットの作成（初回のみ必要）- R2では不要なのでダミー実装
export async function createSongFilesBucket() {
  // R2 buckets are created manually through Cloudflare dashboard
  // This function is kept for compatibility
  console.log('Using R2 bucket - no need to create');
}

// 曲ファイルのアップロード - now uses R2
export async function uploadSongFile(
  file: File, 
  songId: string, 
  fileType: 'audio' | 'xml' | 'json'
): Promise<string> {
  // Upload to R2 instead of Supabase
  return uploadSongFileToR2(file, songId, fileType);
}

// 曲ファイルの削除 - now uses R2
export async function deleteSongFiles(songId: string): Promise<void> {
  // Delete from R2 instead of Supabase
  return deleteSongFilesFromR2(songId);
}

// 日記画像用バケットの作成 - R2では不要なのでダミー実装
export async function createDiaryImagesBucket() {
  // R2 buckets are created manually through Cloudflare dashboard
  // This function is kept for compatibility
  console.log('Using R2 bucket - no need to create');
}

// 日記画像のアップロード - now uses R2
export async function uploadDiaryImage(file: File, userId: string, diaryId: string): Promise<string> {
  // Upload to R2 instead of Supabase
  return uploadDiaryImageToR2(file, userId, diaryId);
}

// 日記画像の削除 - now uses R2
export async function deleteDiaryImage(userId: string, diaryId: string): Promise<void> {
  // Delete from R2 instead of Supabase
  return deleteDiaryImageFromR2(userId, diaryId);
}

// Legacy Supabase storage functions below (kept for potential migration needs)
// These are not used anymore but kept for reference

async function uploadAvatarToSupabase(file: File, userId: string): Promise<string> {
  const supabase = getSupabaseClient();
  const ext = file.type.includes('png') ? 'png' : 'jpg';
  const path = `${userId}.${ext}`;
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

async function uploadSongFileToSupabase(
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

async function deleteSongFilesFromSupabase(songId: string): Promise<void> {
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

async function uploadDiaryImageToSupabase(file: File, userId: string, diaryId: string): Promise<string> {
  const supabase = getSupabaseClient();
  
  // ファイルパス（userId/diaryId.webp形式）
  const ext = file.name.split('.').pop() || 'webp';
  const path = `${userId}/${diaryId}.${ext}`;
  
  // アップロード
  const { error } = await supabase.storage
    .from(DIARY_IMAGES_BUCKET)
    .upload(path, file, {
      contentType: file.type || 'image/webp',
      upsert: true // 既存ファイルがあれば上書き
    });
  
  if (error) {
    console.error('日記画像アップロードエラー:', error);
    throw error;
  }
  
  // 公開URLを取得
  const { data } = supabase.storage
    .from(DIARY_IMAGES_BUCKET)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

async function deleteDiaryImageFromSupabase(userId: string, diaryId: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  // 画像を削除（拡張子を問わず削除）
  const possiblePaths = [
    `${userId}/${diaryId}.webp`,
    `${userId}/${diaryId}.jpg`,
    `${userId}/${diaryId}.jpeg`,
    `${userId}/${diaryId}.png`
  ];
  
  const { error } = await supabase.storage
    .from(DIARY_IMAGES_BUCKET)
    .remove(possiblePaths);
  
  if (error) {
    console.error('日記画像削除エラー:', error);
    throw error;
  }
} 