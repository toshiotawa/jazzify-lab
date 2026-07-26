/**
 * smplr はサンプル名の `#` を `%23` にエンコードして fetch する。
 * Netlify はデプロイファイル名に `#` を許可しないため、self-host 時は `#` を `s` に
 * 置換している (例: `MF C#1.m4a` → `MF Cs1.m4a`)。fetch 直前の URL を同じ規則へ揃える。
 */
export const toNetlifySafePianoSampleUrl = (url: string): string => url.replace(/%23/g, 's');
