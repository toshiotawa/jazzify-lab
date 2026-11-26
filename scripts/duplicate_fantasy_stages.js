/**
 * Fantasy Stages 複製スクリプト
 * 
 * 使い方:
 *   1. .env または環境変数に以下を設定:
 *      - SUPABASE_URL (または VITE_SUPABASE_URL)
 *      - SUPABASE_SERVICE_ROLE_KEY
 *   2. 設定セクションで複製元・複製先を指定
 *   3. node scripts/duplicate_fantasy_stages.js を実行
 */

// ESModuleとCommonJSの両方に対応
const loadSupabase = async () => {
  try {
    // 動的インポートを試みる
    const { createClient } = await import('@supabase/supabase-js');
    return createClient;
  } catch {
    // CommonJS環境の場合
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@supabase/supabase-js');
    return createClient;
  }
};

// dotenv読み込み（存在する場合）
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config();
} catch {
  // dotenvがない場合はスキップ
}

// ======= 設定セクション =======
const CONFIG = {
  sourcePrefix: '2-',      // 複製元のプレフィックス (例: '2-')
  targetPrefix: '3-',      // 複製先のプレフィックス (例: '3-')
  sourceTier: 'basic',     // 複製元のstage_tier ('basic' or 'advanced')
  targetTier: 'basic',     // 複製先のstage_tier
  startNum: 1,             // 開始ステージ番号
  endNum: 10,              // 終了ステージ番号
  dryRun: true,            // true: 確認のみ、false: 実際に複製
};
// ================================

async function main() {
  const createClient = await loadSupabase();
  
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Error: SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('='.repeat(50));
  console.log('Fantasy Stages 複製スクリプト');
  console.log('='.repeat(50));
  console.log(`複製元: ${CONFIG.sourcePrefix}${CONFIG.startNum} 〜 ${CONFIG.sourcePrefix}${CONFIG.endNum} (tier: ${CONFIG.sourceTier})`);
  console.log(`複製先: ${CONFIG.targetPrefix}${CONFIG.startNum} 〜 ${CONFIG.targetPrefix}${CONFIG.endNum} (tier: ${CONFIG.targetTier})`);
  console.log(`モード: ${CONFIG.dryRun ? 'DRY RUN (確認のみ)' : '本番実行'}`);
  console.log('='.repeat(50));

  // 1. 複製元のステージを取得
  const stageNumbers = [];
  for (let i = CONFIG.startNum; i <= CONFIG.endNum; i++) {
    stageNumbers.push(`${CONFIG.sourcePrefix}${i}`);
  }

  const { data: sourceStages, error: fetchError } = await supabase
    .from('fantasy_stages')
    .select('*')
    .in('stage_number', stageNumbers)
    .eq('stage_tier', CONFIG.sourceTier)
    .order('stage_number');

  if (fetchError) {
    console.error('Error fetching source stages:', fetchError.message);
    process.exit(1);
  }

  if (!sourceStages || sourceStages.length === 0) {
    console.log('複製元のステージが見つかりません。');
    process.exit(0);
  }

  console.log(`\n複製元ステージ (${sourceStages.length}件):`);
  sourceStages.forEach(stage => {
    console.log(`  - ${stage.stage_number}: ${stage.name} (mode: ${stage.mode})`);
  });

  // 2. 複製先の既存ステージを確認
  const targetNumbers = stageNumbers.map(sn => 
    sn.replace(CONFIG.sourcePrefix, CONFIG.targetPrefix)
  );

  const { data: existingTargets } = await supabase
    .from('fantasy_stages')
    .select('stage_number')
    .in('stage_number', targetNumbers)
    .eq('stage_tier', CONFIG.targetTier);

  if (existingTargets && existingTargets.length > 0) {
    console.log(`\n⚠️  警告: 複製先に既存ステージがあります:`);
    existingTargets.forEach(s => console.log(`  - ${s.stage_number}`));
    
    if (!CONFIG.dryRun) {
      console.log('\n既存ステージをスキップして続行します。');
    }
  }

  // 3. 複製データを作成
  const duplicatedStages = sourceStages
    .filter(stage => {
      const newStageNumber = stage.stage_number.replace(CONFIG.sourcePrefix, CONFIG.targetPrefix);
      const exists = existingTargets?.some(e => e.stage_number === newStageNumber);
      if (exists) {
        console.log(`  スキップ: ${newStageNumber} (既存)`);
      }
      return !exists;
    })
    .map(stage => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, created_at, updated_at, ...rest } = stage;
      return {
        ...rest,
        stage_number: stage.stage_number.replace(CONFIG.sourcePrefix, CONFIG.targetPrefix),
        stage_tier: CONFIG.targetTier,
      };
    });

  if (duplicatedStages.length === 0) {
    console.log('\n複製するステージがありません。');
    process.exit(0);
  }

  console.log(`\n複製予定 (${duplicatedStages.length}件):`);
  duplicatedStages.forEach(stage => {
    console.log(`  + ${stage.stage_number}: ${stage.name}`);
  });

  // 4. DRY RUNの場合は終了
  if (CONFIG.dryRun) {
    console.log('\n--- DRY RUN 終了 ---');
    console.log('実際に複製するには CONFIG.dryRun を false に設定してください。');
    process.exit(0);
  }

  // 5. 複製実行
  console.log('\n複製を実行します...');
  const { data: insertedData, error: insertError } = await supabase
    .from('fantasy_stages')
    .insert(duplicatedStages)
    .select();

  if (insertError) {
    console.error('Error inserting stages:', insertError.message);
    process.exit(1);
  }

  console.log(`\n✅ ${insertedData.length}件のステージを複製しました:`);
  insertedData.forEach(stage => {
    console.log(`  - ${stage.stage_number}: ${stage.name} (id: ${stage.id})`);
  });
}

main().catch(console.error);
