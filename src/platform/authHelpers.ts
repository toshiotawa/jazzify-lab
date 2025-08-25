import { getCurrentUserIdCached } from '@/platform/supabaseClient';
import { useAuthStore } from '@/stores/authStore';

/**
 * 認証関連のユーティリティ
 * - まずZustandのAuthStoreを参照し、なければTTL付きキャッシュにフォールバック
 * - ネットワークを叩くauth.getUser()の直接呼び出しを避ける
 */

export async function getUserIdOrNull(): Promise<string | null> {
  try {
    const state = useAuthStore.getState();
    if (state?.user?.id) return state.user.id;
  } catch {}
  return await getCurrentUserIdCached();
}

export async function requireUserId(): Promise<string> {
  const uid = await getUserIdOrNull();
  if (!uid) throw new Error('ログインが必要です');
  return uid;
}

export function getAccessTokenOrNull(): string | null {
  try {
    const state = useAuthStore.getState();
    return state?.session?.access_token ?? null;
  } catch {
    return null;
  }
}


