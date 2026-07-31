import type { DeviceOs } from '@/utils/analytics/deviceContext';

export type LpHeroCtaVariant = 'desktop' | 'ios' | 'mobileWeb';

/**
 * LP Hero の主CTA方針。
 * - desktop: デモ体験を主
 * - ios: App Store を主（ネイティブでやらせる）
 * - mobileWeb: Web登録を主（Android 等）
 */
export const resolveLpHeroCtaVariant = (
  isDesktopWidth: boolean,
  os: DeviceOs,
): LpHeroCtaVariant => {
  if (isDesktopWidth) {
    return 'desktop';
  }
  if (os === 'ios') {
    return 'ios';
  }
  return 'mobileWeb';
};
