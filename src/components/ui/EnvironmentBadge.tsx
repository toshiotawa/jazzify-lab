import React from 'react';
import { getEnvironment, getEnvConfig } from '@/utils/environment';

export const EnvironmentBadge: React.FC = () => {
  const env = getEnvironment();
  const config = getEnvConfig();
  
  // 本番環境または表示しない設定の場合は非表示
  if (!config.showEnvBadge || env === 'production') {
    return null;
  }
  
  const getBadgeStyles = () => {
    switch (env) {
      case 'staging':
        return {
          backgroundColor: '#ff9800',
          color: '#fff',
          label: 'STAGING'
        };
      case 'development':
        return {
          backgroundColor: '#4caf50',
          color: '#fff',
          label: 'DEV'
        };
      default:
        // getEnvironment() の戻り値が増えた場合の安全策（現状は到達しない）
        {
          const _exhaustive: never = env;
          return {
            backgroundColor: '#666',
            color: '#fff',
            label: 'UNKNOWN'
          };
        }
    }
  };
  
  const { backgroundColor, color, label } = getBadgeStyles();
  
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '8px 16px',
        backgroundColor,
        color,
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        zIndex: 9999,
        pointerEvents: 'none',
        userSelect: 'none'
      }}
    >
      {label}
    </div>
  );
};