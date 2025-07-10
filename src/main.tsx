import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { enableMapSet } from 'immer';
import AuthGate from '@/components/auth/AuthGate';
import AccountModal from '@/components/ui/AccountModal';
import AdminDashboard from '@/components/admin/AdminDashboard';
import LevelRanking from '@/components/ranking/LevelRanking';
import DiaryModal from '@/components/diary/DiaryModal';

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
    padding: 12px 16px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 16px;
    z-index: 10000;
    max-width: 450px;
    word-wrap: break-word;
    white-space: pre-wrap;
    line-height: 1.5;
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
    root.render(
      <React.StrictMode>
        <AuthGate>
          <App />
          <AccountModal />
          <AdminDashboard />
          <LevelRanking />
          <DiaryModal />
        </AuthGate>
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

// DOMContentLoaded でアプリケーションを初期化
if (document.readyState === 'loading') {
  showDebugInfo('Waiting for DOM to load...');
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  showDebugInfo('DOM already loaded, initializing immediately...');
  initializeApp();
} 