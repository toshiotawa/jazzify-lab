import { getSupabaseClient, fetchWithCache, clearSupabaseCache } from '@/platform/supabaseClient';
import { uploadSongFile, deleteSongFiles } from '@/platform/supabaseStorage';

export interface Song {
  id: string;
  title: string;
  artist?: string;
  bpm?: number;
  difficulty?: number;
  json_data?: any; // 旧data フィールド（インラインJSON用）
  audio_url?: string;
  xml_url?: string;
  json_url?: string;
  min_rank: 'free' | 'standard' | 'premium' | 'platinum';
  is_public: boolean;
}

export interface SongFiles {
  audioFile?: File;
  xmlFile?: File; 
  jsonFile?: File;
}

export async function fetchSongs(): Promise<Song[]> {
  const key = 'songs:all';
  const { data, error } = await fetchWithCache(
    key, 
    async () => await getSupabaseClient().from('songs').select('*').order('created_at', { ascending: false }),
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
  song: Omit<Song, 'id' | 'is_public' | 'audio_url' | 'xml_url' | 'json_url'>, 
  files: SongFiles
): Promise<Song> {
  const supabase = getSupabaseClient();
  
  // 1. まず曲レコードを作成（ファイルURL無しで）
  const { data: newSong, error: songError } = await supabase
    .from('songs')
    .insert({
      ...song,
      is_public: true,
      // json_dataは後で設定（jsonFileがある場合）
      json_data: files.jsonFile ? null : song.json_data
    })
    .select()
    .single();
  
  if (songError) throw songError;
  
  // 2. ファイルをアップロード
  const urls: { audio_url?: string; xml_url?: string; json_url?: string } = {};
  
  try {
    if (files.audioFile) {
      urls.audio_url = await uploadSongFile(files.audioFile, newSong.id, 'audio');
    }
    
    if (files.xmlFile) {
      urls.xml_url = await uploadSongFile(files.xmlFile, newSong.id, 'xml');
    }
    
    if (files.jsonFile) {
      urls.json_url = await uploadSongFile(files.jsonFile, newSong.id, 'json');
    }
    
    // 3. URLを更新
    if (Object.keys(urls).length > 0) {
      const { data: updatedSong, error: updateError } = await supabase
        .from('songs')
        .update(urls)
        .eq('id', newSong.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      clearSupabaseCache();
      return updatedSong;
    }
    
    clearSupabaseCache();
    return newSong;
    
  } catch (error) {
    // ファイルアップロードに失敗した場合、曲レコードも削除
    await deleteSong(newSong.id);
    throw error;
  }
}

// 旧APIとの互換性のため残す
export async function addSong(song: Omit<Song, 'id' | 'is_public'>): Promise<void> {
  await getSupabaseClient()
    .from('songs')
    .insert({ ...song, is_public: true });
  clearSupabaseCache();
}

export async function updateSong(id: string, updates: Partial<Song>, files?: SongFiles): Promise<Song> {
  const supabase = getSupabaseClient();
  
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
  // ストレージからファイルを削除
  await deleteSongFiles(id);
  
  // データベースから削除
  await getSupabaseClient()
    .from('songs')
    .delete()
    .eq('id', id);
    
  clearSupabaseCache();
}

const rankOrder = ['free', 'standard', 'premium', 'platinum'] as const;
export type MembershipRank = typeof rankOrder[number];

export function rankAllowed(userRank: MembershipRank, songRank: MembershipRank) {
  return rankOrder.indexOf(userRank) >= rankOrder.indexOf(songRank);
}

export async function fetchAccessibleSongs(userRank: MembershipRank): Promise<Song[]> {
  const all = await fetchSongs();
  return all.filter(s => rankAllowed(userRank, s.min_rank as MembershipRank));
} 