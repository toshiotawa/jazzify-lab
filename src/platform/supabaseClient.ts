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
    return { 
      data: cached.data, 
      error: null, 
      status: 200, 
      statusText: 'OK',
      count: null 
    };
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
 * @param tableName 監視するテーブル名
 * @param eventType 'INSERT' | 'UPDATE' | 'DELETE' | '*'
 * @param callback イベントコールバック
 */
export function subscribeRealtime<T>(
  channelName: string,
  tableName: string,
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  callback: (payload: any) => void,
) {
  const supabase = getSupabaseClient();
  const channel = supabase.channel(channelName);
  channel.on(
    'postgres_changes' as any,
    { event: eventType, schema: 'public', table: tableName },
    (payload: any) => {
      // キャッシュ無効化
      cache.clear();
      callback(payload);
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

// 特定のキャッシュキーをクリア（完全一致）
export function clearCacheByKey(key: string) {
  cache.delete(key);
}

// パターンに一致するキャッシュキーをクリア
export function clearCacheByPattern(pattern: string | RegExp) {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
    }
  }
}

// 特定のキャッシュキーを無効化（配列形式にも対応）
export function invalidateCacheKey(key: string | string[]) {
  const cacheKey = Array.isArray(key) ? key.join('::') : key;
  cache.delete(cacheKey);
} 