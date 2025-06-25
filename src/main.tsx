import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { enableMapSet } from 'immer';
import * as Tone from 'tone';

// ImmerでMap/Setを使用できるようにする
enableMapSet();

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

// アプリケーションの初期化
const initializeApp = async () => {
  try {
    // 必要な初期化処理があればここに追加
    console.log('🎵 Jazz Learning Game initializing...');
    
    // React アプリをマウント
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Root element not found');
    }
    
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    // ローディング画面を非表示
    hideLoading();
    
    console.log('🎵 Jazz Learning Game initialized successfully');

    // Tone.js を window に公開
    (window as any).Tone = Tone;
  } catch (error) {
    console.error('Failed to initialize app:', error);
    
    // エラー表示
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.innerHTML = `
        <div class="loading-spinner" style="border-color: #ef4444; border-top-color: transparent;"></div>
        <div class="loading-text" style="color: #ef4444;">
          アプリケーションの読み込みに失敗しました<br/>
          <small style="font-size: 0.9rem; margin-top: 0.5rem; display: block;">
            ページを再読み込みしてください
          </small>
        </div>
      `;
    }
  }
};

// DOMContentLoaded でアプリケーションを初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
} 