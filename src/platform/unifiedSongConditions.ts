import { getSupabaseClient } from './supabaseClient';

export interface UnifiedSongConditions {
  songId: string;
  contextType: 'mission' | 'lesson' | 'general';
  contextId: string | null;
  keyOffset: number;
  minSpeed: number;
  minRank: string;
  clearsRequired: number;
  notationSetting: string;
}

export interface SongWithConditions {
  id: string;
  title: string;
  artist: string | null;
  bpm: number | null;
  difficulty: number | null;
  data: unknown;
  conditions: UnifiedSongConditions;
}

/**
 * 統一的な楽曲条件を取得する
 * @param songId 楽曲ID
 * @param contextType コンテキストタイプ
 * @param contextId コンテキストID
 */
export async function getSongPlayConditions(
  songId: string,
  contextType: 'mission' | 'lesson' | 'general',
  contextId: string | null = null
): Promise<UnifiedSongConditions | null> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('song_play_conditions')
      .select('*')
      .eq('song_id', songId)
      .eq('context_type', contextType)
      .eq('context_id', contextId)
      .single();

    if (error) {
      // console.error('Error fetching song play conditions:', error);
      return null;
    }

    return {
      songId: data.song_id,
      contextType: data.context_type,
      contextId: data.context_id,
      keyOffset: data.key_offset,
      minSpeed: data.min_speed,
      minRank: data.min_rank,
      clearsRequired: data.clears_required,
      notationSetting: data.notation_setting,
    };
  } catch (error) {
    // console.error('Error fetching song play conditions:', error);
    return null;
  }
}

/**
 * 楽曲と条件を一緒に取得する
 * @param songId 楽曲ID
 * @param contextType コンテキストタイプ
 * @param contextId コンテキストID
 */
export async function getSongWithConditions(
  songId: string,
  contextType: 'mission' | 'lesson' | 'general',
  contextId: string | null = null
): Promise<SongWithConditions | null> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('song_play_conditions')
      .select(`
        *,
        songs (
          id,
          title,
          artist,
          bpm,
          difficulty,
          data
        )
      `)
      .eq('song_id', songId)
      .eq('context_type', contextType)
      .eq('context_id', contextId)
      .single();

    if (error) {
      // console.error('Error fetching song with conditions:', error);
      return null;
    }

    const song = data.songs;
    return {
      id: song.id,
      title: song.title,
      artist: song.artist,
      bpm: song.bpm,
      difficulty: song.difficulty,
      data: song.data,
      conditions: {
        songId: data.song_id,
        contextType: data.context_type,
        contextId: data.context_id,
        keyOffset: data.key_offset,
        minSpeed: data.min_speed,
        minRank: data.min_rank,
        clearsRequired: data.clears_required,
        notationSetting: data.notation_setting,
      },
    };
  } catch (error) {
    // console.error('Error fetching song with conditions:', error);
    return null;
  }
}

/**
 * 楽曲プレイ条件を作成・更新する
 * @param conditions 楽曲条件
 */
export async function upsertSongPlayConditions(
  conditions: UnifiedSongConditions
): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  try {
    const { error } = await supabase
      .from('song_play_conditions')
      .upsert({
        song_id: conditions.songId,
        context_type: conditions.contextType,
        context_id: conditions.contextId,
        key_offset: conditions.keyOffset,
        min_speed: conditions.minSpeed,
        min_rank: conditions.minRank,
        clears_required: conditions.clearsRequired,
        notation_setting: conditions.notationSetting,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'song_id,context_type,context_id'
      });

    if (error) {
      // console.error('Error upserting song play conditions:', error);
      return false;
    }

    return true;
  } catch (error) {
    // console.error('Error upserting song play conditions:', error);
    return false;
  }
}

/**
 * 既存のchallenge_tracksとlesson_songsからデータを移行する
 * @param dryRun 実際に実行するかテストするか
 */
export async function migrateLegacyConditions(dryRun: boolean = true): Promise<void> {
  const supabase = getSupabaseClient();
  
  try {
    // challenge_tracksからの移行
    const { data: challengeTracks, error: challengeError } = await supabase
      .from('challenge_tracks')
      .select('*');
    
    if (challengeError) {
      // console.error('Error fetching challenge tracks:', challengeError);
      return;
    }

    const missionConditions = challengeTracks.map(track => ({
      song_id: track.song_id,
      context_type: 'mission',
      context_id: track.challenge_id,
      key_offset: track.key_offset || 0,
      min_speed: track.min_speed || 1.0,
      min_rank: track.min_rank || 'B',
      clears_required: track.clears_required || 1,
      notation_setting: track.notation_setting || 'both',
    }));

    // lesson_songsからの移行
    const { data: lessonSongs, error: lessonError } = await supabase
      .from('lesson_songs')
      .select('*');
    
    if (lessonError) {
      // console.error('Error fetching lesson songs:', lessonError);
      return;
    }

    const lessonConditions = lessonSongs.map(lesson => {
      const clearConditions = lesson.clear_conditions || {};
      return {
        song_id: lesson.song_id,
        context_type: 'lesson',
        context_id: lesson.lesson_id,
        key_offset: clearConditions.key || 0,
        min_speed: clearConditions.speed || 1.0,
        min_rank: clearConditions.rank || 'B',
        clears_required: clearConditions.count || 1,
        notation_setting: clearConditions.notation_setting || 'both',
      };
    });

    const allConditions = [...missionConditions, ...lessonConditions];

    if (dryRun) {
      // console.log('Dry run - would migrate:', allConditions.length, 'conditions');
      // console.log('Mission conditions:', missionConditions.length);
      // console.log('Lesson conditions:', lessonConditions.length);
      return;
    }

    // 実際の移行処理
    const { error: insertError } = await supabase
      .from('song_play_conditions')
      .insert(allConditions);

    if (insertError) {
      // console.error('Error inserting migrated conditions:', insertError);
      return;
    }

    // console.log('Successfully migrated', allConditions.length, 'conditions');
  } catch (error) {
    // console.error('Error during migration:', error);
  }
}