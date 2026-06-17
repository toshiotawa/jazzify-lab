import { buildDrop2IIVIABADemoScript } from '@/components/survival/tutorial/buildDrop2IIVIABADemoScript';

const sqlEscape = (value: string): string => value.replace(/'/g, "''");
const scriptJson = `'${sqlEscape(JSON.stringify(buildDrop2IIVIABADemoScript()))}'::jsonb`;

process.stdout.write(`-- Block1 Quest1 (Key of C & F): Drop2 II-V-I ABA サバイバルデモプレイ台本
-- 音源: node scripts/build-drop2-iivi-aba-demo-bgm.mjs && node scripts/upload-drop2-iivi-aba-demo-r2.mjs
BEGIN;

UPDATE public.survival_tutorial_scripts
SET
  script = ${scriptJson},
  updated_at = now()
WHERE id = 'thvi-demo-b1-q1';

COMMIT;
`);
