import { getSupabaseClient } from './supabaseClient';
import { DEFAULT_TITLE, type Title } from '../utils/titleConstants';

/**
 * ユーザーの現在の称号を取得
 * @param userId ユーザーID
 * @returns 現在の称号、取得失敗時はデフォルト称号
 */
export const getUserTitle = async (userId: string): Promise<Title> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('selected_title')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('称号取得エラー:', error);
      return DEFAULT_TITLE;
    }

    return (data?.selected_title as Title) || DEFAULT_TITLE;
  } catch (error) {
    console.error('称号取得エラー:', error);
    return DEFAULT_TITLE;
  }
};

/**
 * ユーザーの称号を更新
 * @param userId ユーザーID
 * @param title 新しい称号
 * @returns 更新成功時はtrue、失敗時はfalse
 */
export const updateUserTitle = async (userId: string, title: Title): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('profiles')
      .update({ selected_title: title })
      .eq('id', userId);

    if (error) {
      console.error('称号更新エラー:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('称号更新エラー:', error);
    return false;
  }
};

/**
 * 複数ユーザーの称号を一括取得
 * @param userIds ユーザーIDの配列
 * @returns ユーザーIDをキーとした称号のマップ
 */
export const getUserTitles = async (userIds: string[]): Promise<Record<string, Title>> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, selected_title')
      .in('id', userIds);

    if (error) {
      console.error('称号一括取得エラー:', error);
      return {};
    }

    const titleMap: Record<string, Title> = {};
    data?.forEach((profile: any) => {
      titleMap[profile.id] = (profile.selected_title as Title) || DEFAULT_TITLE;
    });

    return titleMap;
  } catch (error) {
    console.error('称号一括取得エラー:', error);
    return {};
  }
};

/**
 * プロフィール情報と一緒に称号を取得
 * @param userId ユーザーID
 * @returns プロフィール情報（称号含む）
 */
export const getProfileWithTitle = async (userId: string) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nickname, selected_title, level, total_xp, bio, twitter_handle')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('プロフィール取得エラー:', error);
      return null;
    }

    return {
      ...data,
      selected_title: (data?.selected_title as Title) || DEFAULT_TITLE,
    };
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return null;
  }
}; 