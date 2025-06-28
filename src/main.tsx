import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { enableMapSet } from 'immer';
import * as Tone from 'tone';

// ImmerでMap/Setを使用できるようにする
enableMapSet();

// デバッグ情報を画面に表示する関数
const showDebugInfo = (message: string, isError = false) => {
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
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
      max-width: 300px;
      word-wrap: break-word;
    `;
    debugDiv.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    
    if (!document.getElementById('debug-info')) {
      document.body.appendChild(debugDiv);
    }
  }
  console.log(`🎵 ${message}`);
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

// エラー表示関数
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

// アプリケーションの初期化
const initializeApp = async () => {
  try {
    showDebugInfo('Starting initialization...');
    
    // 基本的な環境チェック
    if (!document.getElementById('root')) {
      throw new Error('Root element not found');
    }
    
    showDebugInfo('Root element found');
    
    // React の厳密モードを確認
    showDebugInfo('Creating React root...');
    const rootElement = document.getElementById('root')!;
    const root = ReactDOM.createRoot(rootElement);
    
    showDebugInfo('Rendering React app...');
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    showDebugInfo('React app rendered successfully');
    
    // Tone.js を window に公開
    (window as any).Tone = Tone;
    showDebugInfo('Tone.js attached to window');
    
    // 少し待ってからローディング画面を非表示
    setTimeout(() => {
      showDebugInfo('Hiding loading screen...');
      hideLoading();
      
      // デバッグ情報を数秒後に自動で削除
      setTimeout(() => {
        const debugDiv = document.getElementById('debug-info');
        if (debugDiv) {
          debugDiv.remove();
        }
      }, 5000);
    }, 1000);
    
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