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
          eventsPerSecond: 5, // 最適化: 20 → 5 に削減（80%削減）
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

// 認証ユーザーIDの簡易TTLキャッシュ
let cachedUserId: string | null = null;
let cachedUserIdExpiresAt = 0;
const USER_ID_TTL_MS = 1000 * 60 * 5; // 5分

export async function getCurrentUserIdCached(): Promise<string | null> {
  const now = Date.now();
  if (cachedUserId && cachedUserIdExpiresAt > now) return cachedUserId;
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  cachedUserId = user?.id ?? null;
  cachedUserIdExpiresAt = now + USER_ID_TTL_MS;
  return cachedUserId;
}

export function invalidateCachedUserId(): void {
  cachedUserId = null;
  cachedUserIdExpiresAt = 0;
}

// メモリキャッシュ実装
interface CacheEntry<T> {
  data: T;
  expires: number; // epoch ms
}

// 最適化: キャッシュTTLを調整
const DEFAULT_TTL = 1000 * 600; // 600 秒（10分）に延長
const cache: Map<string, CacheEntry<unknown>> = new Map();

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
 * Realtime サブスクリプション簡易ヘルパー（最適化版）
 * @param channelName Supabase チャンネル名
 * @param tableName 監視するテーブル名
 * @param eventType 'INSERT' | 'UPDATE' | 'DELETE' | '*'
 * @param callback イベントコールバック
 * @param options 追加オプション
 */
export function subscribeRealtime<T = Record<string, unknown>>(
  channelName: string,
  tableName: string,
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  callback: (payload: {
    eventType: string;
    new: T;
    old: T;
  }) => void,
  options?: {
    clearCache?: boolean; // キャッシュクリアの有無（デフォルト: false）
    filter?: string; // フィルタ条件
  }
) {
  const supabase = getSupabaseClient();
  const channel = supabase.channel(channelName);
  
  const eventConfig = { 
    event: eventType, 
    schema: 'public', 
    table: tableName,
    ...(options?.filter && { filter: options.filter })
  };
  
  channel.on(
    'postgres_changes',
    eventConfig,
    (payload) => {
      // 最適化: キャッシュクリアは必要な場合のみ
      if (options?.clearCache !== false) {
        clearCacheByPattern(`.*${tableName}.*`);
      }
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

// Realtimeサブスクリプション管理用
const activeSubscriptions = new Set<string>();

// パフォーマンス監視用
let realtimeCallCount = 0;
let lastCallTime = 0;

/**
 * Realtimeサブスクリプションの重複を防ぐヘルパー
 * @param channelName チャンネル名
 * @param callback サブスクリプション作成コールバック
 */
export function subscribeRealtimeOnce<T = Record<string, unknown>>(
  channelName: string,
  tableName: string,
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  callback: (payload: {
    eventType: string;
    new: T;
    old: T;
  }) => void,
  options?: {
    clearCache?: boolean;
    filter?: string;
  }
) {
  // 既に同じチャンネルがアクティブな場合は何もしない
  if (activeSubscriptions.has(channelName)) {
    log.debug(`Realtime subscription ${channelName} already active, skipping...`);
    return () => {}; // 空のクリーンアップ関数
  }

  activeSubscriptions.add(channelName);
  console.log(`Starting realtime subscription: ${channelName}`);

  const unsubscribe = subscribeRealtime(channelName, tableName, eventType, callback, options);

  return () => {
    activeSubscriptions.delete(channelName);
    console.log(`Stopping realtime subscription: ${channelName}`);
    unsubscribe();
  };
}

/**
 * アクティブなサブスクリプション数を取得
 */
export function getActiveSubscriptionCount(): number {
  return activeSubscriptions.size;
}

/**
 * すべてのアクティブなサブスクリプションをクリア
 */
export function clearAllSubscriptions(): void {
  activeSubscriptions.clear();
  console.log('All realtime subscriptions cleared');
}

/**
 * Realtimeパフォーマンス統計を取得
 */
export function getRealtimeStats() {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  
  return {
    activeSubscriptions: activeSubscriptions.size,
    subscriptionNames: Array.from(activeSubscriptions),
    totalCalls: realtimeCallCount,
    timeSinceLastCall,
    cacheSize: cache.size
  };
}

/**
 * Realtimeコールを記録（デバッグ用）
 */
export function recordRealtimeCall(channelName: string) {
  realtimeCallCount++;
  lastCallTime = Date.now();
  
  // 開発環境でのみログ出力
  if (import.meta.env.DEV) {
    console.log(`Realtime call #${realtimeCallCount}: ${channelName}`);
  }
} 