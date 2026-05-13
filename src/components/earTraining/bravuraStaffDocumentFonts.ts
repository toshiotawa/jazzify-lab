/**
 * Bravura — SIL OFL（smufl.org/fonts）。SVG `<text>` 用 SMuFL。
 *
 * Safari は SVG の `<defs>` 内 `@font-face` だけでは `<text>` に Bravura が適用されず、
 * PUA が絵文字フォントにフォールバックすることがある。そのためドキュメントにも `@font-face` を登録する。
 * `public/fonts/Bravura.woff2` は `import.meta.env.BASE_URL` に合わせる（サブディレクトリ配備対応）。
 */
export const BRAVURA_WOFF2_PUBLIC_HREF: string = (() => {
  const base = import.meta.env.BASE_URL;
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}fonts/Bravura.woff2`;
})();

const buildDocumentFontFaceBlock = (): string => {
  const href = BRAVURA_WOFF2_PUBLIC_HREF;
  return [
    `@font-face{font-family:Bravura;src:url("${href}") format("woff2");font-display:block;font-weight:normal;font-style:normal;}`,
    `@font-face{font-family:BravuraSMuFL;src:url("${href}") format("woff2");font-display:block;font-weight:normal;font-style:normal;unicode-range:U+E000-U+F8FF;}`,
    `@font-face{font-family:BravuraSvgStaff;src:url("${href}") format("woff2");font-display:block;font-weight:normal;font-style:normal;unicode-range:U+E000-U+F8FF;}`,
  ].join('');
};

const STYLE_ELEMENT_ID = 'bravura-staff-font-faces-document';

if (typeof document !== 'undefined' && document.getElementById(STYLE_ELEMENT_ID) === null) {
  const el = document.createElement('style');
  el.id = STYLE_ELEMENT_ID;
  el.textContent = buildDocumentFontFaceBlock();
  document.head.appendChild(el);
}
