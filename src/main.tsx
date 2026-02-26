import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { enableMapSet } from 'immer';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// ImmerでMap/Setを使用できるようにする
enableMapSet();

// 開発環境でマジックリンクログを自動出力
// autoLogMagicLinkInfo(); // Removed as per edit hint

const showDebugInfo = (message: string, _isError = false) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`🎵 [${timestamp}] ${message}`);
};

// ローディング画面を非表示にする
const hideLoading = () => {
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.style.opacity = '0';
    setTimeout(() => {
      loadingElement.style.display = 'none';
    }, 300);
  }
};

// エラー表示関数（簡素化）
const showError = (error: any) => {
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; text-align: center;">
        <div style="color: #ef4444; font-size: 60px; margin-bottom: 24px;">⚠️</div>
        <h2 style="color: #ef4444; margin-bottom: 24px; font-size: 28px;">読み込みエラー</h2>
        <div style="background: #1f2937; padding: 24px; border-radius: 10px; margin-bottom: 24px; max-width: 700px;">
          <p style="color: #ffffff; margin-bottom: 12px; font-size: 18px;">詳細情報:</p>
          <pre style="color: #93c5fd; font-size: 14px; white-space: pre-wrap; word-wrap: break-word; line-height: 1.5;">${error.toString()}</pre>
          <br>
          <p style="color: #9ca3af; font-size: 14px; line-height: 1.5;">
            Environment: ${window.location.hostname}<br>
            User Agent: ${navigator.userAgent}<br>
            Timestamp: ${new Date().toISOString()}
          </p>
        </div>
        <button onclick="window.location.reload()" style="background: #3b82f6; color: white; padding: 16px 32px; border: none; border-radius: 8px; cursor: pointer; font-size: 18px;">
          再読み込み
        </button>
      </div>
    `;
  }
};

// グローバルエラーハンドリング
window.addEventListener('error', (event) => {
  showDebugInfo(`Global Error: ${event.error?.message || event.message}`, true);
  showError(event.error || new Error(event.message));
});

window.addEventListener('unhandledrejection', (event) => {
  // JSON読み込みエラーの場合は特別な処理
  if (event.reason && event.reason.message && event.reason.message.includes('Unexpected token')) {
    console.error('🎵 JSON読み込みエラー:', event.reason.message);
    showDebugInfo(`JSON読み込みエラー: ${event.reason.message}`, true);
    
    // より分かりやすいエラーメッセージ
    const userFriendlyError = new Error('楽曲ファイルの読み込みに失敗しました。ファイルが正しく配置されているか確認してください。');
    showError(userFriendlyError);
  } else {
    showDebugInfo(`Unhandled Promise Rejection: ${event.reason}`, true);
    showError(event.reason);
  }
  
  // エラーを防止（ブラウザのデフォルトエラー処理を抑制）
  event.preventDefault();
});

// 簡素化されたアプリケーション初期化
const initializeApp = async () => {
  try {
    showDebugInfo('Starting initialization...');
    
    // 基本的な環境チェック
    if (!document.getElementById('root')) {
      throw new Error('Root element not found');
    }
    showDebugInfo('Root element found');
    
    // React アプリケーションの初期化（StrictModeを削除）
    showDebugInfo('Creating React root...');
    const rootElement = document.getElementById('root')!;
    const root = ReactDOM.createRoot(rootElement);
    
    showDebugInfo('Rendering React app...');
    root.render(
      <React.StrictMode>
        <HelmetProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </HelmetProvider>
      </React.StrictMode>
    );
    
    showDebugInfo('React app rendered successfully');
    
    // Tone.js を動的にロードして初期化（遅延ロード）
    try {
      const Tone = await import('tone');
      (window as any).Tone = Tone;
      showDebugInfo('Tone.js loaded and attached to window');
    } catch (toneError) {
      showDebugInfo(`Tone.js loading failed: ${toneError}`, true);
      // Tone.jsのエラーは致命的ではないため続行
    }
    
    // 初期化完了後にローディング画面を非表示
    setTimeout(() => {
      showDebugInfo('Hiding loading screen...');
      hideLoading();
    }, 500);
    
    showDebugInfo('Initialization completed successfully');

  } catch (error) {
    showDebugInfo(`Initialization failed: ${error}`, true);
    showError(error);
  }
};

// DOMContentLoaded でアプリケーションを初期化
if (document.readyState === 'loading') {
  showDebugInfo('Waiting for DOM to load...');
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  showDebugInfo('DOM already loaded, initializing immediately...');
  initializeApp();
} 