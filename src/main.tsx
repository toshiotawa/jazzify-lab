import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { enableMapSet } from 'immer';

// ImmerでMap/Setを使用できるようにする
enableMapSet();

// 本番環境でもデバッグ情報を表示する関数
const showDebugInfo = (message: string, isError = false) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`🎵 [${timestamp}] ${message}`);
  
  // 画面にも表示
  const debugDiv = document.getElementById('debug-info') || document.createElement('div');
  debugDiv.id = 'debug-info';
  debugDiv.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    background: ${isError ? '#ef4444' : '#3b82f6'};
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-family: monospace;
    font-size: 12px;
    z-index: 10000;
    max-width: 400px;
    word-wrap: break-word;
    white-space: pre-wrap;
  `;
  debugDiv.textContent = `${timestamp}: ${message}`;
  
  if (!document.getElementById('debug-info')) {
    document.body.appendChild(debugDiv);
  }
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
        <div style="color: #ef4444; font-size: 48px; margin-bottom: 20px;">⚠️</div>
        <h2 style="color: #ef4444; margin-bottom: 20px;">読み込みエラー</h2>
        <div style="background: #1f2937; padding: 20px; border-radius: 8px; margin-bottom: 20px; max-width: 600px;">
          <p style="color: #ffffff; margin-bottom: 10px;">詳細情報:</p>
          <pre style="color: #93c5fd; font-size: 12px; white-space: pre-wrap; word-wrap: break-word;">${error.toString()}</pre>
          <br>
          <p style="color: #9ca3af; font-size: 12px;">
            Environment: ${window.location.hostname}<br>
            User Agent: ${navigator.userAgent}<br>
            Timestamp: ${new Date().toISOString()}
          </p>
        </div>
        <button onclick="window.location.reload()" style="background: #3b82f6; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
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
  showDebugInfo(`Unhandled Promise Rejection: ${event.reason}`, true);
  showError(event.reason);
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
    root.render(<App />);
    
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
      
      // デバッグ情報を削除（本番では少し長めに表示）
      setTimeout(() => {
        const debugDiv = document.getElementById('debug-info');
        if (debugDiv) {
          debugDiv.remove();
        }
      }, 8000);
    }, 500);
    
    showDebugInfo('Initialization completed successfully');

  } catch (error) {
    showDebugInfo(`Initialization failed: ${error}`, true);
    showError(error);
  }
};

// vConsoleの初期化（開発環境またはdebugパラメータがある場合）
const isDebugMode = window.location.search.includes('debug=true') || 
                   window.location.hostname === 'localhost' ||
                   window.location.hostname === '127.0.0.1';

if (isDebugMode) {
  import('vconsole').then(({ default: VConsole }) => {
    new VConsole();
    console.log('🔧 vConsole initialized for mobile debugging');
  }).catch(err => {
    console.warn('Failed to load vConsole:', err);
  });
}

// Service Worker のアンレジスター（キャッシュ問題対策）
const unregisterServiceWorkers = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const unregisterPromises = registrations.map(registration => {
        console.log('🗑️ Unregistering service worker:', registration.scope);
        return registration.unregister();
      });
      await Promise.all(unregisterPromises);
      console.log('✅ All service workers unregistered');
      showDebugInfo('Service workers cleared for cache update');
    } catch (error) {
      console.warn('Failed to unregister service workers:', error);
    }
  }
};

// キャッシュクリア（開発/デバッグモード用）
const clearCaches = async () => {
  if ('caches' in window && isDebugMode) {
    try {
      const cacheNames = await caches.keys();
      const deletePromises = cacheNames.map(cacheName => {
        console.log('🗑️ Deleting cache:', cacheName);
        return caches.delete(cacheName);
      });
      await Promise.all(deletePromises);
      console.log('✅ All caches cleared');
      showDebugInfo('Browser caches cleared');
    } catch (error) {
      console.warn('Failed to clear caches:', error);
    }
  }
};

// デバッグモードでキャッシュ問題を解決
if (isDebugMode) {
  unregisterServiceWorkers();
  clearCaches();
}

// DOMContentLoaded でアプリケーションを初期化
if (document.readyState === 'loading') {
  showDebugInfo('Waiting for DOM to load...');
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  showDebugInfo('DOM already loaded, initializing immediately...');
  initializeApp();
} 