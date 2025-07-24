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
 * 詳細なデバッグ情報をコンソールに出力
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
 * マジックリンクログイン処理の詳細ログ
 */
export function logMagicLinkLoginProcess(email: string, mode: 'signup' | 'login', redirectUrl: string): void {
  console.group('🔐 Magic Link ログイン処理開始');
  console.log('📧 メールアドレス:', email);
  console.log('🎯 モード:', mode);
  console.log('🔗 リダイレクトURL:', redirectUrl);
  console.log('🌐 現在のorigin:', typeof location !== 'undefined' ? location.origin : 'N/A');
  console.log('📱 User Agent:', navigator.userAgent);
  console.log('🔒 HTTPS:', location.protocol === 'https:');
  console.groupEnd();
}

/**
 * マジックリンクエラーの詳細ログ
 */
export function logMagicLinkError(error: any, context: string): void {
  console.group('❌ Magic Link エラー');
  console.log('🔍 エラーコンテキスト:', context);
  console.log('🚨 エラー詳細:', error);
  
  if (error instanceof Error) {
    console.log('📝 エラーメッセージ:', error.message);
    console.log('📚 エラースタック:', error.stack);
  }
  
  // URLパラメータの確認
  if (typeof location !== 'undefined') {
    console.log('🔗 現在のURL:', location.href);
    console.log('📋 URLパラメータ:', location.search);
    console.log('🔍 ハッシュ:', location.hash);
  }
  
  console.groupEnd();
}

/**
 * マジックリンク成功の詳細ログ
 */
export function logMagicLinkSuccess(email: string, session: any): void {
  console.group('✅ Magic Link ログイン成功');
  console.log('📧 メールアドレス:', email);
  console.log('👤 ユーザーID:', session?.user?.id);
  console.log('📅 セッション作成時刻:', session?.created_at);
  console.log('⏰ セッション有効期限:', session?.expires_at);
  console.log('🔗 アクセストークン:', session?.access_token ? '存在します' : 'なし');
  console.log('🔄 リフレッシュトークン:', session?.refresh_token ? '存在します' : 'なし');
  console.groupEnd();
}

/**
 * URLパラメータからマジックリンク情報を解析
 */
export function parseMagicLinkFromUrl(): {
  hasMagicLink: boolean;
  accessToken?: string;
  refreshToken?: string;
  type?: string;
  error?: string;
  tokenHash?: string;
} {
  if (typeof location === 'undefined') {
    return { hasMagicLink: false };
  }

  const urlParams = new URLSearchParams(location.search);
  const hashParams = new URLSearchParams(location.hash.substring(1));
  
  const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
  const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
  const type = urlParams.get('type') || hashParams.get('type');
  const error = urlParams.get('error') || hashParams.get('error');
  const tokenHash = urlParams.get('token_hash') || hashParams.get('token_hash');

  const hasMagicLink = !!(accessToken || refreshToken || type || tokenHash);

  console.group('🔍 URL マジックリンク解析');
  console.log('🔗 現在のURL:', location.href);
  console.log('📋 URLパラメータ:', Object.fromEntries(urlParams.entries()));
  console.log('🔍 ハッシュパラメータ:', Object.fromEntries(hashParams.entries()));
  console.log('🎯 マジックリンク検出:', hasMagicLink);
  console.log('🔑 アクセストークン:', accessToken ? '存在します' : 'なし');
  console.log('🔄 リフレッシュトークン:', refreshToken ? '存在します' : 'なし');
  console.log('🔐 トークンハッシュ:', tokenHash ? '存在します' : 'なし');
  console.log('📝 タイプ:', type);
  console.log('❌ エラー:', error);
  console.groupEnd();

  return {
    hasMagicLink,
    accessToken: accessToken || undefined,
    refreshToken: refreshToken || undefined,
    type: type || undefined,
    error: error || undefined,
    tokenHash: tokenHash || undefined,
  };
}

/**
 * 開発環境で自動的にログを出力
 */
export function autoLogMagicLinkInfo(): void {
  if (import.meta.env.DEV) {
    console.log('🚀 開発環境でマジックリンクログを有効化');
    
    // 設定情報を自動出力
    logMagicLinkDebugInfo();
    
    // URLからマジックリンク情報を解析
    const urlInfo = parseMagicLinkFromUrl();
    if (urlInfo.hasMagicLink) {
      console.log('🎯 ページ読み込み時にマジックリンクが検出されました');
    }
    
    // ブラウザ情報を出力
    console.group('🌐 ブラウザ情報');
    console.log('User Agent:', navigator.userAgent);
    console.log('プラットフォーム:', navigator.platform);
    console.log('言語:', navigator.language);
    console.log('Cookie有効:', navigator.cookieEnabled);
    console.log('オンライン:', navigator.onLine);
    console.groupEnd();
  }
}

/**
 * Supabase設定の確認結果を取得
 */
export async function checkSupabaseConfig(): Promise<{
  signupEnabled: boolean;
  emailSignupEnabled: boolean;
  otpSignupEnabled: boolean;
  siteUrl: string;
  redirectUrls: string[];
  authSettings: any;
}> {
  try {
    // Supabaseクライアントを取得
    const { getSupabaseClient } = await import('@/platform/supabaseClient');
    const supabase = getSupabaseClient();
    
    // 設定情報を取得（実際にはAPIで取得できないため、環境変数から推測）
    const siteUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const redirectUrl = import.meta.env.VITE_SUPABASE_REDIRECT_URL || '';
    
    // 実際の設定はSupabaseダッシュボードで確認が必要
    // ここではデフォルト値を返す
    return {
      signupEnabled: true, // デフォルトでは有効と仮定
      emailSignupEnabled: true, // デフォルトでは有効と仮定
      otpSignupEnabled: false, // OTPサインアップは通常無効
      siteUrl,
      redirectUrls: redirectUrl ? [redirectUrl] : [],
      authSettings: {
        // 実際の設定はSupabaseダッシュボードで確認
        emailConfirm: true,
        emailChangeConfirm: true,
        phoneConfirm: false,
        phoneChangeConfirm: false,
        magicLink: true,
        otp: true,
        otpSignup: false, // これが問題の原因
      },
    };
  } catch (error) {
    console.error('Supabase設定確認エラー:', error);
    return {
      signupEnabled: false,
      emailSignupEnabled: false,
      otpSignupEnabled: false,
      siteUrl: '',
      redirectUrls: [],
      authSettings: {},
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
  otpSignupDisabled: boolean;
} {
  const config = getMagicLinkConfig();
  const issues: string[] = [];
  const recommendations: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';
  let otpSignupDisabled = false;

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

  // OTPサインアップ無効の警告
  otpSignupDisabled = true; // 現在のエラーから推測
  if (otpSignupDisabled) {
    issues.push('OTPによるサインアップが無効になっています');
    recommendations.push('Supabaseダッシュボードで「Email OTP」のサインアップを有効にしてください');
    severity = 'high';
  }

  return {
    issues,
    recommendations,
    severity,
    otpSignupDisabled,
  };
} 