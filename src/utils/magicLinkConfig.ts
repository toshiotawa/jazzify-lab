/**
 * Magic Link設定の検証とデバッグ用ユーティリティ
 */

export interface MagicLinkConfig {
  redirectUrl: string | null;
  currentOrigin: string;
  isConfigured: boolean;
  isValidUrl: boolean;
  protocol: string;
  hostname: string;
  port: string;
}

/**
 * Magic Link設定の詳細情報を取得
 */
export function getMagicLinkConfig(): MagicLinkConfig {
  const envRedirectUrl = import.meta.env.VITE_SUPABASE_REDIRECT_URL;
  const currentOrigin = typeof location !== 'undefined' ? location.origin : '';
  
  let redirectUrl: string | null = null;
  let isValidUrl = false;
  let protocol = '';
  let hostname = '';
  let port = '';

  if (envRedirectUrl) {
    try {
      const url = new URL(envRedirectUrl);
      redirectUrl = envRedirectUrl;
      isValidUrl = true;
      protocol = url.protocol;
      hostname = url.hostname;
      port = url.port;
    } catch (error) {
      console.warn('Invalid VITE_SUPABASE_REDIRECT_URL:', envRedirectUrl);
    }
  }

  return {
    redirectUrl,
    currentOrigin,
    isConfigured: !!envRedirectUrl,
    isValidUrl,
    protocol,
    hostname,
    port,
  };
}

/**
 * Magic Link設定の検証結果を取得
 */
export function validateMagicLinkConfig(): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} {
  const config = getMagicLinkConfig();
  const issues: string[] = [];
  const recommendations: string[] = [];

  // 環境変数が設定されているかチェック
  if (!config.isConfigured) {
    issues.push('環境変数 VITE_SUPABASE_REDIRECT_URL が設定されていません');
    recommendations.push('VITE_SUPABASE_REDIRECT_URL を設定してください');
  }

  // URLが有効かチェック
  if (config.isConfigured && !config.isValidUrl) {
    issues.push('VITE_SUPABASE_REDIRECT_URL が無効なURL形式です');
    recommendations.push('有効なURL形式で設定してください（例: https://example.com）');
  }

  // プロトコルが適切かチェック
  if (config.isValidUrl) {
    if (config.protocol !== 'https:' && config.hostname !== 'localhost') {
      issues.push('HTTPSプロトコルまたはlocalhostが必要です');
      recommendations.push('HTTPSまたはlocalhostを使用してください');
    }
  }

  // 現在のoriginとの一致をチェック
  if (config.isValidUrl && config.redirectUrl !== config.currentOrigin) {
    recommendations.push('リダイレクトURLと現在のoriginが異なります。Supabase設定と一致しているか確認してください');
  }

  return {
    isValid: issues.length === 0,
    issues,
    recommendations,
  };
}

/**
 * デバッグ情報をコンソールに出力
 */
export function logMagicLinkDebugInfo(): void {
  const config = getMagicLinkConfig();
  const validation = validateMagicLinkConfig();

  console.group('🔍 Magic Link 設定デバッグ情報');
  console.log('設定情報:', config);
  console.log('検証結果:', validation);
  
  if (validation.issues.length > 0) {
    console.warn('⚠️ 問題点:', validation.issues);
  }
  
  if (validation.recommendations.length > 0) {
    console.info('💡 推奨事項:', validation.recommendations);
  }
  
  console.groupEnd();
}

/**
 * Supabase設定の確認結果を取得
 */
export async function checkSupabaseConfig(): Promise<{
  signupEnabled: boolean;
  emailSignupEnabled: boolean;
  siteUrl: string;
  redirectUrls: string[];
}> {
  try {
    // Supabaseクライアントを取得
    const { getSupabaseClient } = await import('@/platform/supabaseClient');
    const supabase = getSupabaseClient();
    
    // 設定情報を取得（実際にはAPIで取得できないため、環境変数から推測）
    const siteUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const redirectUrl = import.meta.env.VITE_SUPABASE_REDIRECT_URL || '';
    
    return {
      signupEnabled: true, // デフォルトでは有効と仮定
      emailSignupEnabled: true, // デフォルトでは有効と仮定
      siteUrl,
      redirectUrls: redirectUrl ? [redirectUrl] : [],
    };
  } catch (error) {
    console.error('Supabase設定確認エラー:', error);
    return {
      signupEnabled: false,
      emailSignupEnabled: false,
      siteUrl: '',
      redirectUrls: [],
    };
  }
}

/**
 * 設定問題の診断と推奨事項を取得
 */
export function diagnoseMagicLinkIssues(): {
  issues: string[];
  recommendations: string[];
  severity: 'low' | 'medium' | 'high';
} {
  const config = getMagicLinkConfig();
  const issues: string[] = [];
  const recommendations: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';

  // 環境変数の問題
  if (!config.isConfigured) {
    issues.push('環境変数 VITE_SUPABASE_REDIRECT_URL が設定されていません');
    recommendations.push('VITE_SUPABASE_REDIRECT_URL を設定してください');
    severity = 'high';
  }

  // URL形式の問題
  if (config.isConfigured && !config.isValidUrl) {
    issues.push('VITE_SUPABASE_REDIRECT_URL が無効なURL形式です');
    recommendations.push('有効なURL形式で設定してください（例: https://example.com）');
    severity = 'high';
  }

  // プロトコルの問題
  if (config.isValidUrl) {
    if (config.protocol !== 'https:' && config.hostname !== 'localhost') {
      issues.push('HTTPSプロトコルまたはlocalhostが必要です');
      recommendations.push('HTTPSまたはlocalhostを使用してください');
      severity = 'medium';
    }
  }

  // リダイレクトURLの不一致
  if (config.isValidUrl && config.redirectUrl !== config.currentOrigin) {
    issues.push('リダイレクトURLと現在のoriginが異なります');
    recommendations.push('Supabase設定とリダイレクトURLを一致させてください');
    severity = 'medium';
  }

  return {
    issues,
    recommendations,
    severity,
  };
} 