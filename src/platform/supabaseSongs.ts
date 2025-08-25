import { getSupabaseClient, fetchWithCache, clearSupabaseCache } from '@/platform/supabaseClient';
import { requireUserId } from '@/platform/authHelpers';
import { uploadSongFile, deleteSongFiles } from '@/platform/r2Storage';

export type SongUsageType = 'general' | 'lesson';

export interface Song {
  id: string;
  title: string;
  artist?: string;
  bpm?: number; // 使用しない
  difficulty?: number; // 使用しない
  json_data?: any; // 旧data フィールド（インライン JSON用）
  audio_url?: string;
  xml_url?: string;
  json_url?: string;
  min_rank: 'free' | 'standard' | 'standard_global' | 'premium' | 'platinum';
  is_public: boolean;
  usage_type: SongUsageType;
  created_by: string;
}

export interface SongFiles {
  audioFile?: File;
  xmlFile?: File; 
  jsonFile?: File;
}

export async function fetchSongs(usageType?: SongUsageType): Promise<Song[]> {
  const key = `songs:${usageType || 'all'}`;
  const { data, error } = await fetchWithCache(
    key,
    async () => {
      let query = getSupabaseClient().from('songs').select('*').order('created_at', { ascending: false });
      if (usageType) {
        query = query.eq('usage_type', usageType);
      }
      return query;
    },
    1000 * 60,
  );
  if (error) throw error;
  return data as Song[];
}

export async function fetchSong(id: string): Promise<Song | null> {
  const { data, error } = await getSupabaseClient()
    .from('songs')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Song;
}

export async function addSongWithFiles(
  song: Omit<Song, 'id' | 'is_public' | 'audio_url' | 'xml_url' | 'json_url' | 'created_by' | 'json_data'>,
  files: SongFiles
): Promise<Song> {
  const supabase = getSupabaseClient();
  
  // ユーザー認証を確認
  const userId = await requireUserId();
  
  console.log('addSongWithFiles開始:', song);
  console.log('認証ユーザーID:', userId);
  
  // JSONファイルの内容を読み込んで検証
  let jsonData = null;
  if (files.jsonFile) {
    try {
      const text = await files.jsonFile.text();
      jsonData = JSON.parse(text);
      console.log('JSONファイル解析成功:', jsonData);
    } catch (e) {
      console.error('JSONファイル解析エラー:', e);
      throw new Error('JSONファイルの形式が不正です');
    }
  }
  
  // 1. まず曲レコードを作成（ファイルURL無しで）
  const insertData = {
    ...song,
    is_public: true,
    // json_dataフィールドにJSONの内容を保存（ファイルがある場合）
    json_data: jsonData,
    created_by: userId // マイグレーション完了により使用可能
  };
  
  console.log('データベースに挿入するデータ:', insertData);
  
  const { data: newSong, error: songError } = await supabase
    .from('songs')
    .insert(insertData)
    .select()
    .single();
  
  if (songError) {
    console.error('データベース挿入エラー:', songError);
    throw songError;
  }
  
  console.log('データベース挿入成功:', newSong);
  
  // 2. ファイルをアップロード
  const urls: { audio_url?: string; xml_url?: string; json_url?: string } = {};
  
  try {
    if (files.audioFile) {
      console.log('音声ファイルアップロード開始');
      urls.audio_url = await uploadSongFile(files.audioFile, newSong.id, 'audio');
      console.log('音声ファイルアップロード成功:', urls.audio_url);
    }
    
    if (files.xmlFile) {
      console.log('XMLファイルアップロード開始');
      urls.xml_url = await uploadSongFile(files.xmlFile, newSong.id, 'xml');
      console.log('XMLファイルアップロード成功:', urls.xml_url);
    }
    
    if (files.jsonFile) {
      console.log('JSONファイルアップロード開始');
      urls.json_url = await uploadSongFile(files.jsonFile, newSong.id, 'json');
      console.log('JSONファイルアップロード成功:', urls.json_url);
    }
    
    // 3. URLを更新
    if (Object.keys(urls).length > 0) {
      console.log('URLを更新:', urls);
      const { data: updatedSong, error: updateError } = await supabase
        .from('songs')
        .update(urls)
        .eq('id', newSong.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('URL更新エラー:', updateError);
        throw updateError;
      }
      
      clearSupabaseCache();
      return updatedSong;
    }
    
    clearSupabaseCache();
    return newSong;
    
  } catch (error) {
    console.error('ファイルアップロードエラー:', error);
    // ファイルアップロードに失敗した場合、曲レコードも削除
    await deleteSong(newSong.id);
    throw error;
  }
}

// 旧APIとの互換性のため残す
export async function addSong(song: Omit<Song, 'id' | 'is_public' | 'created_by'>): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await requireUserId();

  await supabase
    .from('songs')
    .insert({ ...song, is_public: true, created_by: userId });
  clearSupabaseCache();
}

export async function updateSong(id: string, updates: Partial<Omit<Song, 'id' | 'created_by'>>, files?: SongFiles): Promise<Song> {
  const supabase = getSupabaseClient();
  
  // ユーザー認証を確認
  const userId = await requireUserId();
  
  console.log('updateSong実行 - ユーザーID:', userId);
  
  // ファイルがある場合はアップロード
  const urls: { audio_url?: string; xml_url?: string; json_url?: string } = {};
  
  if (files) {
    if (files.audioFile) {
      urls.audio_url = await uploadSongFile(files.audioFile, id, 'audio');
    }
    
    if (files.xmlFile) {
      urls.xml_url = await uploadSongFile(files.xmlFile, id, 'xml');
    }
    
    if (files.jsonFile) {
      urls.json_url = await uploadSongFile(files.jsonFile, id, 'json');
    }
  }
  
  // データベースを更新
  const { data, error } = await supabase
    .from('songs')
    .update({ ...updates, ...urls })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  clearSupabaseCache();
  return data;
}

export async function deleteSong(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  // ユーザー認証を確認
  const userId = await requireUserId();
  
  console.log('deleteSong実行 - ユーザーID:', userId);
  
  // ストレージからファイルを削除
  await deleteSongFiles(id);
  
  // データベースから削除
  await supabase
    .from('songs')
    .delete()
    .eq('id', id);
    
  clearSupabaseCache();
}

const rankOrder = ['free', 'standard', 'standard_global', 'premium', 'platinum'] as const;
export type MembershipRank = typeof rankOrder[number];

export function rankAllowed(userRank: MembershipRank, songRank: MembershipRank) {
  return rankOrder.indexOf(userRank) >= rankOrder.indexOf(songRank);
}

export async function fetchAccessibleSongs(userRank: MembershipRank, usageType?: SongUsageType): Promise<Song[]> {
  const all = await fetchSongs(usageType);
  return all.filter(s => rankAllowed(userRank, s.min_rank as MembershipRank));
} 