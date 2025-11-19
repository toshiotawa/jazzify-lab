export const isIOS = (): boolean => {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent || navigator.vendor || '';
  const iOSDevice = /iPad|iPhone|iPod/.test(userAgent);
  const macTouchDevice = navigator.platform === 'MacIntel' && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1;

  return iOSDevice || macTouchDevice;
};
