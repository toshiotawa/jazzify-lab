-- サバイバル ステージ1 イントロ: ジャ爺登場 + オクターブ違いOK（basic / songs / phrases）
BEGIN;

UPDATE public.survival_stage_intro_scripts
SET
  script = $sj_basic$
{
  "lineDurationSeconds": 3,
  "lines": [
    { "atSeconds": 2, "text": { "ja": "また会ったね、ファイだよ。", "en": "Hey again — it's Fai." } },
    { "atSeconds": 4, "speaker": "jajii", "text": { "ja": "大魔導師、ジャ爺もいるぞい。", "en": "Grand Archmage, Old Man Jajii is here too." } },
    { "atSeconds": 6, "text": { "ja": "ここは Basic コース。コードの種類ごとに基礎を鍛える場所だよ。", "en": "This is the Basic course — train fundamentals chord by chord." } },
    { "atSeconds": 10, "text": { "ja": "ブロックごとの最終ステージにボスがいるよ。", "en": "Each block ends with a boss stage." } },
    { "atSeconds": 14, "text": { "ja": "HINTありモードと挑戦モードが切り替えられる。クリア記録は挑戦モードのみだよ。", "en": "Switch between HINT practice and performance mode. Clears are saved in performance mode only." } },
    { "atSeconds": 18, "text": { "ja": "バーチャルスティックで移動しよう。", "en": "Move with the virtual stick." } },
    { "atSeconds": 22, "text": { "ja": "光っている鍵盤の色を演奏しよう。", "en": "Play the highlighted key colors on the keyboard." } },
    { "atSeconds": 24, "text": { "ja": "オクターブ違いもOK。", "en": "Octave differences are OK too." } },
    { "atSeconds": 26, "text": { "ja": "正解したら緑色になるよ。（正解したら次の音へ）", "en": "Correct notes turn green. (Then you move to the next note.)" } },
    { "atSeconds": 30, "text": { "ja": "5秒以内に正解し続けるとコンボゲージが溜まるよ。", "en": "Keep answering within 5 seconds to build the combo gauge." } },
    { "atSeconds": 34, "text": { "ja": "コンボゲージがMAXになるとゲージ技が発動するよ。", "en": "When the combo gauge maxes out, your gauge skill triggers." } },
    { "atSeconds": 38, "text": { "ja": "90秒間生き残ったらクリアだ。", "en": "Survive for 90 seconds to clear." } },
    { "atSeconds": 42, "text": { "ja": "全ステージ制覇目指して頑張ろう。", "en": "Let's aim to conquer every stage!" } }
  ]
}
$sj_basic$::jsonb,
  updated_at = now()
WHERE map_category = 'basic';

UPDATE public.survival_stage_intro_scripts
SET
  script = $sj_songs$
{
  "lineDurationSeconds": 3,
  "lines": [
    { "atSeconds": 2, "text": { "ja": "また会ったね、ファイだよ。", "en": "Hey again — it's Fai." } },
    { "atSeconds": 4, "speaker": "jajii", "text": { "ja": "大魔導師、ジャ爺もいるぞい。", "en": "Grand Archmage, Old Man Jajii is here too." } },
    { "atSeconds": 6, "text": { "ja": "ここは Songs コース。ジャズスタンダードのコード進行を演奏する場所だよ。", "en": "This is the Songs course — play jazz standard progressions." } },
    { "atSeconds": 10, "text": { "ja": "ブロックごとの最終ステージにボスがいるよ。", "en": "Each block ends with a boss stage." } },
    { "atSeconds": 14, "text": { "ja": "HINTありモードと挑戦モードが切り替えられる。クリア記録は挑戦モードのみだよ。", "en": "Switch between HINT practice and performance mode. Clears are saved in performance mode only." } },
    { "atSeconds": 18, "text": { "ja": "バーチャルスティックで移動しよう。", "en": "Move with the virtual stick." } },
    { "atSeconds": 22, "text": { "ja": "光っている鍵盤の色を演奏しよう。", "en": "Play the highlighted key colors on the keyboard." } },
    { "atSeconds": 24, "text": { "ja": "オクターブ違いもOK。", "en": "Octave differences are OK too." } },
    { "atSeconds": 26, "text": { "ja": "正解したら緑色になるよ。（正解したら次の音へ）", "en": "Correct notes turn green. (Then you move to the next note.)" } },
    { "atSeconds": 30, "text": { "ja": "5秒以内に正解し続けるとコンボゲージが溜まるよ。", "en": "Keep answering within 5 seconds to build the combo gauge." } },
    { "atSeconds": 34, "text": { "ja": "コンボゲージがMAXになるとゲージ技が発動するよ。", "en": "When the combo gauge maxes out, your gauge skill triggers." } },
    { "atSeconds": 38, "text": { "ja": "90秒間生き残ったらクリアだ。", "en": "Survive for 90 seconds to clear." } },
    { "atSeconds": 42, "text": { "ja": "全ステージ制覇目指して頑張ろう。", "en": "Let's aim to conquer every stage!" } }
  ]
}
$sj_songs$::jsonb,
  updated_at = now()
WHERE map_category = 'songs';

UPDATE public.survival_stage_intro_scripts
SET
  script = $sj_phrases$
{
  "lineDurationSeconds": 3,
  "lines": [
    { "atSeconds": 2, "text": { "ja": "また会ったね、ファイだよ。", "en": "Hey again — it's Fai." } },
    { "atSeconds": 4, "speaker": "jajii", "text": { "ja": "大魔導師、ジャ爺もいるぞい。", "en": "Grand Archmage, Old Man Jajii is here too." } },
    { "atSeconds": 6, "text": { "ja": "ここは Phrases コース。小節ごとにコードを演奏するフレーズモードだよ。", "en": "This is the Phrases course — chord-by-measure phrase battles." } },
    { "atSeconds": 10, "text": { "ja": "ブロックごとの最終ステージにボスがいるよ。", "en": "Each block ends with a boss stage." } },
    { "atSeconds": 14, "text": { "ja": "HINTありモードと挑戦モードが切り替えられる。クリア記録は挑戦モードのみだよ。", "en": "Switch between HINT practice and performance mode. Clears are saved in performance mode only." } },
    { "atSeconds": 18, "text": { "ja": "バーチャルスティックで移動しよう。", "en": "Move with the virtual stick." } },
    { "atSeconds": 22, "text": { "ja": "光っている鍵盤の色を演奏しよう。", "en": "Play the highlighted key colors on the keyboard." } },
    { "atSeconds": 24, "text": { "ja": "オクターブ違いもOK。", "en": "Octave differences are OK too." } },
    { "atSeconds": 26, "text": { "ja": "小節が弾けると強い攻撃が発動するよ。", "en": "Clear a measure to unleash a strong attack." } },
    { "atSeconds": 30, "text": { "ja": "90秒間生き残ったらクリアだ。", "en": "Survive for 90 seconds to clear." } },
    { "atSeconds": 34, "text": { "ja": "全ステージ制覇目指して頑張ろう。", "en": "Let's aim to conquer every stage!" } }
  ]
}
$sj_phrases$::jsonb,
  updated_at = now()
WHERE map_category = 'phrases';

COMMIT;
