import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * エラーバウンダリコンポーネント
 * アプリケーション全体のエラーをキャッチして適切に表示
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
    
    // エラー報告システムにログを送信（将来的に実装）
    // reportError(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // カスタムfallback UIが提供されている場合はそれを使用
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // デフォルトのエラー画面
      return (
        <div className="min-h-screen bg-gradient-game flex items-center justify-center p-4">
          <div className="bg-game-surface rounded-xl shadow-2xl border border-red-500 max-w-2xl w-full p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">🎵💥</div>
              <h1 className="text-2xl font-bold text-red-400 mb-4">
                予期しないエラーが発生しました
              </h1>
              <p className="text-gray-300 mb-6">
                申し訳ございません。アプリケーションでエラーが発生しました。
                <br />
                ページを再読み込みするか、しばらく経ってから再度お試しください。
              </p>
              
              {/* 開発環境でのエラー詳細 */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 p-4 bg-red-900 bg-opacity-50 rounded-lg text-left">
                  <summary className="cursor-pointer text-red-300 font-semibold mb-2">
                    エラー詳細（開発者向け）
                  </summary>
                  <div className="text-xs font-mono text-red-200 whitespace-pre-wrap overflow-auto max-h-64">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <br />
                      {this.state.error.stack}
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <br />
                        {this.state.errorInfo.componentStack}
                      </div>
                    )}
                  </div>
                </details>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <button
                  onClick={this.handleRetry}
                  className="btn btn-primary"
                >
                  再試行
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="btn btn-secondary"
                >
                  ページを再読み込み
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 