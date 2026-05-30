/** Web / iOS 共通のクエストジングル相対パス（public ルート基準） */
export const QUEST_COMPLETE_JINGLE_RELATIVE = 'attack_icons/クエスト完了.mp3';
export const QUEST_PRE_COMPLETE_JINGLE_RELATIVE = 'attack_icons/課題完了前 クリアモーダル.mp3';

export function buildPublicAssetUrl(baseUrl: string, relativePath: string): string {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const encoded = relativePath.split('/').map((segment) => encodeURIComponent(segment)).join('/');
  return `${normalizedBase}${encoded}`;
}
