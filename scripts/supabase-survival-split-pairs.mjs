/**
 * Split 20260515200000_survival_songs_idempotent_backfill_stages_16_30.sql
 * into MCP-friendly batches: survival_stage_blocks, then survival_stages ×2 stages,
 * then stage 30 + label UPDATEs + COMMIT (one file).
 * Output: scripts/_tmp_survival_chunks/pairs/*.mcp.json  (one-line JSON {"query":"..."})
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const migrationPath = path.join(
  repoRoot,
  "supabase/migrations/20260515200000_survival_songs_idempotent_backfill_stages_16_30.sql",
);
const outDir = path.join(repoRoot, "scripts/_tmp_survival_chunks/pairs");

const stageInsertFooter = `
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  chord_suffix = EXCLUDED.chord_suffix,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  root_pattern = EXCLUDED.root_pattern,
  root_pattern_name = EXCLUDED.root_pattern_name,
  root_pattern_name_en = EXCLUDED.root_pattern_name_en,
  block_key = EXCLUDED.block_key,
  is_mixed_stage = EXCLUDED.is_mixed_stage,
  mixed_group_key = EXCLUDED.mixed_group_key,
  chord_progression = EXCLUDED.chord_progression,
  updated_at = now();`;

const stageInsertHeader = `INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES
`;

function wrapTxn(body) {
  return `BEGIN;\n${body.trim()}\nCOMMIT;\n`;
}

function writeMcpJson(name, query) {
  const outPath = path.join(outDir, `${name}.mcp.json`);
  fs.writeFileSync(outPath, JSON.stringify({ query }), "utf8");
  const bytes = Buffer.byteLength(fs.readFileSync(outPath));
  return { outPath, bytes };
}

function main() {
  const src = fs.readFileSync(migrationPath, "utf8");
  const blocksStart = src.indexOf("INSERT INTO public.survival_stage_blocks");
  const blocksEnd = src.indexOf("INSERT INTO public.survival_stages", blocksStart);
  if (blocksStart < 0 || blocksEnd < 0) throw new Error("Could not locate block insert");
  const blocksSql = src.slice(blocksStart, blocksEnd).trim();

  const valuesNeedle = ") VALUES";
  const stInsert = src.indexOf("INSERT INTO public.survival_stages");
  const v0 = src.indexOf(valuesNeedle, stInsert);
  if (v0 < 0) throw new Error("VALUES not found");
  const valuesIdx = v0 + valuesNeedle.length;
  const onConflict = src.indexOf(
    "\nON CONFLICT (map_category, stage_number) DO UPDATE SET",
    valuesIdx,
  );
  if (onConflict < 0) throw new Error("ON CONFLICT not found");
  const rawValues = src.slice(valuesIdx, onConflict);

  const labelUpdatesStart = src.indexOf(
    "\nUPDATE public.survival_stages\nSET chord_display_name = 'Standards 2'",
    onConflict,
  );
  if (labelUpdatesStart < 0) throw new Error("UPDATE labels not found");
  const labelsEnd = src.indexOf("\nCOMMIT;", labelUpdatesStart);
  const labelsSql = src.slice(labelUpdatesStart, labelsEnd < 0 ? src.length : labelsEnd).trim();

  /** @type {{ num: number; line: string }[]} */
  const rows = [];
  const lines = rawValues.split(/\r?\n/).map((ln) => ln.trimEnd());
  for (const ln of lines) {
    const trimmed = ln.trim();
    const m = trimmed.match(/^\(['"]songs['"]\s*,\s*(\d+)\s*,/);
    if (m?.[1]) {
      rows.push({ num: Number(m[1]), line: trimmed });
    }
  }
  if (rows.length !== 15)
    throw new Error(`Expected 15 stage rows, parsed ${rows.length}`);

  fs.mkdirSync(outDir, { recursive: true });

  const results = [];

  results.push(writeMcpJson("00_blocks", wrapTxn(blocksSql)));

  for (let i = 0; i < 14; i += 2) {
    const a = rows[i];
    const b = rows[i + 1];
    const name = `${String(a.num).padStart(2, "0")}_${String(b.num).padStart(2, "0")}`;
    const tuples = `${a.line.replace(/,$/, "")},\n${b.line.replace(/,$/, "")}`;
    const chunk = `${stageInsertHeader}${tuples}${stageInsertFooter}`;
    results.push(writeMcpJson(`${name}`, wrapTxn(chunk)));
  }

  const last = rows[14];
  const tuples30 = last.line.replace(/,$/, "");
  const chunkLast = `${stageInsertHeader}${tuples30}${stageInsertFooter}\n\n${labelsSql}`;
  results.push(writeMcpJson("30_labels", wrapTxn(chunkLast)));

  for (const r of results)
    console.log(`${path.basename(r.outPath)}\t${r.bytes}`);
}

main();
