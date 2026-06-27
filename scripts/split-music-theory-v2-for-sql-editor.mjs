/**
 * 音楽理論初級 v2 マイグレーションを SQL Editor 用に 15 ファイルへ分割する。
 * 出力: supabase/patches/music_theory_beginner_v2_sql_editor/01.sql … 15.sql
 *
 * 実行: node scripts/split-music-theory-v2-for-sql-editor.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(
  root,
  "supabase/migrations/20260327120000_music_theory_beginner_v2_restructure.sql",
);
const outDir = path.join(
  root,
  "supabase/patches/music_theory_beginner_v2_sql_editor",
);

const N = 15;

let sql = fs.readFileSync(src, "utf8");
sql = sql.replace(/\nBEGIN;\s*\n/i, "\n").replace(/;\s*COMMIT;\s*$/i, "");

const parts = sql.split(/\n(?=INSERT INTO)/);
const header = parts[0];
const inserts = parts.slice(1);
const per = Math.ceil(inserts.length / N);

fs.mkdirSync(outDir, { recursive: true });

let idx = 0;
for (let i = 0; i < N; i++) {
  const slice = inserts.slice(idx, idx + per);
  idx += per;
  const body =
    i === 0
      ? header + "\n" + slice.map((s) => "\n" + s).join("")
      : slice.map((s) => s.replace(/^\n/, "")).join("\n");
  const name = `${String(i + 1).padStart(2, "0")}.sql`;
  fs.writeFileSync(path.join(outDir, name), body, "utf8");
}

const readme = `音楽理論初級コース v2（SQL Editor 手動適用用）
元: supabase/migrations/20260327120000_music_theory_beginner_v2_restructure.sql

実行順: 01.sql → 02.sql → … → 15.sql（同じ順で連続実行）
01 のみ DELETE / UPDATE コース含む。02 以降は INSERT のみ。

INSERT ステートメント数: ${inserts.length}（${N} 分割・各約 ${per} 件）
`;
fs.writeFileSync(path.join(outDir, "README.txt"), readme, "utf8");

console.log(`Wrote ${N} files to ${outDir}`);
console.log(`inserts=${inserts.length} per_chunk≈${per}`);
