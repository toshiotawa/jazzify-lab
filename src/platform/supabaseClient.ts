import { createClient, SupabaseClient, PostgrestResponse } from '@supabase/supabase-js';

/**
 * Supabase クライアントのシングルトンラッパー。
 * - クエリ結果キャッシュ (メモリ内 / 最低限の TTL 制御)
 * - Realtime サブスクリプション登録ヘルパー
 * - fetchWithCache でキャッシュ利用しつつ API 呼び出し
 *
 * NOTE: 共有キャッシュはページリロードで消えるため、再検証が必要な長期データには SWR 等との併用を推奨
 */

// .env 変数は Vite では import.meta.env に注入される
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase URL / ANON KEY が設定されていません。 .env ファイルを確認してください。');
}

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      // Realtime WS URL 自動推論、キャッシュ制御ヘッダー追加など調整可
      realtime: {
        params: {
          eventsPerSecond: 20, // 帯域制御
        },
      },
      global: {
        headers: {
          'X-Client-Info': 'jazzgame-v1',
        },
      },
    });
  }
  return client;
}

// メモリキャッシュ実装
interface CacheEntry<T> {
  data: T;
  expires: number; // epoch ms
}

const DEFAULT_TTL = 1000 * 30; // 30 秒
const cache: Map<string, CacheEntry<any>> = new Map();

/**
 * クエリを実行し、結果を TTL 付きでキャッシュする
 * @param cacheKey ユニークキー (テーブル名 + クエリパラメータなど)
 * @param executor Supabase 呼び出しを返すコールバック
 * @param ttl キャッシュ有効期限 (ms)
 */
export async function fetchWithCache<T>(
  cacheKey: string,
  executor: () => Promise<PostgrestResponse<T>>, // 実クエリ
  ttl: number = DEFAULT_TTL,
): Promise<PostgrestResponse<T>> {
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > now) {
    return { data: cached.data, error: null, status: 200, count: null }; // 型上 status 固定
  }

  const res = await executor();
  if (!res.error) {
    cache.set(cacheKey, { data: res.data, expires: now + ttl });
  }
  return res;
}

/**
 * Realtime サブスクリプション簡易ヘルパー
 * @param channelName Supabase チャンネル名
 * @param eventType 'INSERT' | 'UPDATE' | 'DELETE' | '*'
 * @param callback イベントコールバック
 */
export function subscribeRealtime<T>(
  channelName: string,
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  callback: (payload: T) => void,
) {
  const supabase = getSupabaseClient();
  const channel = supabase.channel(channelName);
  channel.on(
    'postgres_changes',
    { event: eventType, schema: 'public' },
    payload => {
      // キャッシュ無効化
      cache.clear();
      callback(payload as T);
    },
  );
  channel.subscribe();
  return () => {
    channel.unsubscribe();
  };
}

// キャッシュクリア手動用
export function clearSupabaseCache() {
  cache.clear();
} 