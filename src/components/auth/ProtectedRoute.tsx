import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LoadingScreen from '@/components/ui/LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false
}) => {
  const { state } = useAuth();
  const location = useLocation();

  // 認証状態をチェック中
  if (state.loading) {
    return <LoadingScreen progress={0.5} message="認証状態を確認中..." />;
  }

  // 未認証の場合、ログインページにリダイレクト
  if (!state.user) {
    return (
      <Navigate
        to="/auth/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // 管理者権限が必要な場合の追加チェック
  if (requireAdmin) {
    // 管理者権限のチェック（is_adminフィールドで判定）
    const isAdmin = state.user.isAdmin;
    
    if (!isAdmin) {
      return (
        <Navigate
          to="/game"
          replace
        />
      );
    }
  }

  return <>{children}</>;
}; 