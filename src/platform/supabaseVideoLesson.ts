import { getSupabaseClient } from '@/platform/supabaseClient';
import type { VideoLessonStage } from '@/types';

const STAGE_SELECT = `
  id, slug, title, title_en, description, description_en,
  video_url, video_url_en, duration_sec, duration_en_sec,
  thumbnail_url, thumbnail_url_en, required_watch_ratio, is_active,
  created_at, updated_at
`;

const rowToStage = (row: Record<string, unknown>): VideoLessonStage | null => {
  const id = typeof row.id === 'string' ? row.id : '';
  const slug = typeof row.slug === 'string' ? row.slug : '';
  const title = typeof row.title === 'string' ? row.title : '';
  const videoUrl = typeof row.video_url === 'string' ? row.video_url : '';
  if (!id || !slug || !title || !videoUrl) {
    return null;
  }
  const requiredRaw = row.required_watch_ratio;
  const requiredWatchRatio =
    typeof requiredRaw === 'number' && Number.isFinite(requiredRaw)
      ? requiredRaw
      : typeof requiredRaw === 'string' && Number.isFinite(Number(requiredRaw))
        ? Number(requiredRaw)
        : 0.9;

  return {
    id,
    slug,
    title,
    title_en: typeof row.title_en === 'string' ? row.title_en : null,
    description: typeof row.description === 'string' ? row.description : null,
    description_en: typeof row.description_en === 'string' ? row.description_en : null,
    video_url: videoUrl,
    video_url_en: typeof row.video_url_en === 'string' ? row.video_url_en : null,
    duration_sec: typeof row.duration_sec === 'number' ? row.duration_sec : null,
    duration_en_sec: typeof row.duration_en_sec === 'number' ? row.duration_en_sec : null,
    thumbnail_url: typeof row.thumbnail_url === 'string' ? row.thumbnail_url : null,
    thumbnail_url_en: typeof row.thumbnail_url_en === 'string' ? row.thumbnail_url_en : null,
    required_watch_ratio: requiredWatchRatio,
    is_active: row.is_active !== false,
    created_at: typeof row.created_at === 'string' ? row.created_at : undefined,
    updated_at: typeof row.updated_at === 'string' ? row.updated_at : undefined,
  };
};

export const fetchVideoLessonStageById = async (
  id: string,
): Promise<VideoLessonStage | null> => {
  const trimmed = id.trim();
  if (!trimmed) return null;
  const { data, error } = await getSupabaseClient()
    .from('video_lesson_stages')
    .select(STAGE_SELECT)
    .eq('id', trimmed)
    .maybeSingle();

  if (error || !data || typeof data !== 'object') return null;
  return rowToStage(data as Record<string, unknown>);
};

export const fetchVideoLessonStagesForLessonAdmin = async (): Promise<VideoLessonStage[]> => {
  const { data, error } = await getSupabaseClient()
    .from('video_lesson_stages')
    .select(STAGE_SELECT)
    .order('slug');

  if (error || !data) return [];
  return data
    .map(r => rowToStage(r as Record<string, unknown>))
    .filter((s): s is VideoLessonStage => s !== null);
};

export interface UpsertVideoLessonStageInput {
  slug: string;
  title: string;
  title_en?: string | null;
  description?: string | null;
  description_en?: string | null;
  video_url: string;
  video_url_en?: string | null;
  duration_sec?: number | null;
  duration_en_sec?: number | null;
  thumbnail_url?: string | null;
  thumbnail_url_en?: string | null;
  required_watch_ratio?: number;
  is_active?: boolean;
}

export const createVideoLessonStage = async (
  input: UpsertVideoLessonStageInput,
): Promise<VideoLessonStage> => {
  const { data, error } = await getSupabaseClient()
    .from('video_lesson_stages')
    .insert({
      slug: input.slug.trim(),
      title: input.title.trim(),
      title_en: input.title_en?.trim() || null,
      description: input.description?.trim() || null,
      description_en: input.description_en?.trim() || null,
      video_url: input.video_url.trim(),
      video_url_en: input.video_url_en?.trim() || null,
      duration_sec: input.duration_sec ?? null,
      duration_en_sec: input.duration_en_sec ?? null,
      thumbnail_url: input.thumbnail_url?.trim() || null,
      thumbnail_url_en: input.thumbnail_url_en?.trim() || null,
      required_watch_ratio: input.required_watch_ratio ?? 0.9,
      is_active: input.is_active ?? true,
    })
    .select(STAGE_SELECT)
    .single();

  if (error || !data) {
    throw new Error(`動画視聴ステージの作成に失敗しました: ${error?.message ?? 'unknown'}`);
  }
  const stage = rowToStage(data as Record<string, unknown>);
  if (!stage) {
    throw new Error('動画視聴ステージの作成結果が不正です');
  }
  return stage;
};
