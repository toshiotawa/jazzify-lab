interface NetworkConnectionInfo {
  saveData?: boolean;
  effectiveType?: string;
}

const isNetworkConnectionInfo = (value: unknown): value is NetworkConnectionInfo => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  if ('saveData' in record && typeof record.saveData !== 'boolean') {
    return false;
  }
  if ('effectiveType' in record && typeof record.effectiveType !== 'string') {
    return false;
  }
  return true;
};

const getNetworkConnection = (): NetworkConnectionInfo | undefined => {
  if (typeof navigator === 'undefined') {
    return undefined;
  }
  const raw: unknown = Reflect.get(navigator, 'connection');
  return isNetworkConnectionInfo(raw) ? raw : undefined;
};

/** バックグラウンド prefetch を許可する回線か（低速・セーブデータ時は抑制） */
export const shouldAllowBulkPrefetch = (): boolean => {
  const connection = getNetworkConnection();
  if (connection?.saveData) {
    return false;
  }
  const effectiveType = connection?.effectiveType;
  if (effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g') {
    return false;
  }
  return true;
};
