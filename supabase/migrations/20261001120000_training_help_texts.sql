-- Training: expanded page info and category descriptions
BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Page info (training overview)
-- ---------------------------------------------------------------------------
UPDATE public.training_ui_texts SET
  text_ja = $page_info_ja$1分間ドリル形式のトレーニングです。譜面を見て、素早く正確に演奏する力を鍛えます。

【練習モード / 本番モード】
練習モードは時間無制限で何度でも挑戦できます。スコアは記録されません。
本番モードは1分間です。正解数に応じてスコアとランクがつき、記録とランキングに反映されます。週3日目標や連続日数も、本番プレイのみが対象です。

【目標セット】
カテゴリごとに目標セットがあります。目標ランク以上を達成するとクリアです。対象楽器・対象レベルで整理されており、目標セット一覧からいつでも切り替えられます。

【ランク定義】
本番1分間の正解数がランクになります。スケール系は1問あたりの音数が多いため、基準値が半分です。

コード系（音符・音程・コード・ヴォイシング）
S: 60以上  A: 50以上  B: 40以上  C: 30以上  D: 20以上  E: 10以上  F: 10未満

スケール系
S: 30以上  A: 25以上  B: 20以上  C: 15以上  D: 10以上  E: 5以上  F: 5未満

【ランキング】
トレーニングごとの本番ベストスコアで順位を付けます。同点の場合は、先にそのスコアを出した人が上位です。

【記録（トレーニング別）】
トレーニングを選ぶと、月ごとの日別ベストスコアの推移を確認できます。

【記録（日別）】
カレンダーから日付を選ぶと、その日にプレイしたトレーニングの当日ベストを一覧できます。

【目標: 週3日】
日曜始まりの週で、本番をプレイした日が3日以上になると達成です。練習モードは含まれません。

【連続日数】
本番をプレイした日が何日続いているかを表示します。$page_info_ja$,
  text_en = $page_info_en$Training drills help you read the staff and play quickly and accurately.

【Practice / Production mode】
Practice mode has no time limit and can be retried as many times as you like. Scores are not recorded.
Production mode lasts one minute. Your score and rank are based on correct answers and are saved to records and rankings. The weekly 3-day goal and streak count only production plays.

【Goal sets】
Each category has a goal set. Clear it by reaching each training's target rank or higher. Goal sets are organized by target instrument and level, and you can switch between them at any time from the goal set list.

【Rank definitions】
Your rank is based on correct answers in a one-minute production run. Scale trainings use half the score thresholds because each question has more notes.

Chord-based (notes, intervals, chords, voicings)
S: 60+  A: 50+  B: 40+  C: 30+  D: 20+  E: 10+  F: below 10

Scale-based
S: 30+  A: 25+  B: 20+  C: 15+  D: 10+  E: 5+  F: below 5

【Rankings】
Rankings are based on each training's best production score. Ties go to whoever reached that score first.

【Records (by training)】
Select a training to view your daily best scores by month.

【Records (by day)】
Open the calendar and pick a date to see that day's best score for each training you played.

【Goal: 3 days per week】
Starting on Sunday, play production mode on 3 or more days in the week to reach the goal. Practice mode does not count.

【Streak】
Shows how many consecutive days you have played production mode.$page_info_en$,
  updated_at = now()
WHERE key = 'page_info';

-- ---------------------------------------------------------------------------
-- 2) Category descriptions
-- ---------------------------------------------------------------------------
UPDATE public.training_categories SET
  description_ja = CASE slug
    WHEN 'intro' THEN '音符の読み方の基礎を身につけます。ト音記号・ヘ音記号、臨時記号ありなしの課題があります。移調楽器を選択している場合、その楽器のキーで表記されます。In C固定の課題の場合、コンサートキーでのみ表記となります。オクターブ違いの音も正解として判定されます。'
    WHEN 'interval' THEN '2度から7度まで、上行・下行の音程を譜面から素早く読み取る練習です。譜面上の音符（あるいは鍵盤上の薄い青色）を基準に、◯度上/下の音を正しく演奏できると正解です。オクターブ違いの音も正解として判定されます。'
    WHEN 'triad' THEN 'メジャー・マイナーなど3和音のコードを、転回形を指定せずに入力する練習です。どの構成音から弾いても構いません。' || E'\n' || '※音声入力の場合は構成音の下から順番に回答してください。'
    WHEN 'triad_inversion' THEN '3和音の基本形・転回形を指定どおりに入力する練習です。構成音の下から順番に回答します。'
    WHEN 'seventh' THEN '4和音のコードを、転回形を指定せずに入力する練習です。どの構成音から弾いても構いません。' || E'\n' || '※音声入力の場合は構成音の下から順番に回答してください。'
    WHEN 'seventh_inversion' THEN '4和音の基本形・転回形を指定どおりに入力する練習です。構成音の下から順番に回答します。'
    WHEN 'scale_basic' THEN 'メジャー・ナチュラルマイナーなど初級スケールの読み取り練習です。スケール構成音の下から順番に回答し、上行します。'
    WHEN 'scale_intermediate' THEN 'ドリアン・ミクソリディアンなど中級スケールの読み取り練習です。スケール構成音の下から順番に回答し、上行します。'
    WHEN 'scale_advanced' THEN 'オルタード、ディミニッシュなど、上級スケールの読み取り練習です。スケール構成音の下から順番に回答し、上行します。'
    WHEN 'tension_voicing' THEN 'テンションノートを含む4和音ヴォイシングの読み取り練習です。' || E'\n' || 'どの構成音から弾いても構いません。オクターブ違いの音も正解として判定されます。' || E'\n' || '※音声入力の場合は構成音の下から順番に回答してください。'
    WHEN 'tension_voicing_ab' THEN 'A/Bフォームのテンションヴォイシングを譜面から入力する練習です。構成音の下から順番に回答します。' || E'\n' || '3rdからヴォイシングを積むAフォームと、7thからヴォイシングを積むBフォームを練習します。'
    WHEN 'two_hand_voicing' THEN '両手で演奏するジャズヴォイシングの読み取り練習です。So Whatヴォイシング、4thヴォイシング、UST（Upper Structure Triad）などの上級ヴォイシングを練習します。' || E'\n' || '※音声入力の場合は構成音の下から順番に回答してください。'
    WHEN 'lh_voicing_progression' THEN 'II-V-I、ブルース、スタンダードなどの左手ヴォイシングを練習するモードです。' || E'\n' || '※音声入力の場合は構成音の下から順番に回答してください。' || E'\n' || 'In C固定（常にコンサートキーでのみ表記となります。）'
    WHEN 'two_hand_voicing_progression' THEN 'II-V-I、ブルース、スタンダードなどの両手ヴォイシングを練習するモードです。' || E'\n' || '※音声入力の場合は構成音の下から順番に回答してください。' || E'\n' || 'In C固定（常にコンサートキーでのみ表記となります。）'
    ELSE description_ja
  END,
  description_en = CASE slug
    WHEN 'intro' THEN 'Learn the basics of reading notes — treble and bass clefs, with and without accidentals. If you use a transposing instrument, notation follows that instrument''s key. In C-only trainings use concert pitch only. Notes in a different octave also count as correct.'
    WHEN 'interval' THEN 'Read intervals from 2nds through 7ths, ascending and descending, as quickly as you can. Use the note on the staff (or the pale blue key on the keyboard) as your reference and play the interval above or below. Notes in a different octave also count as correct.'
    WHEN 'triad' THEN 'Enter triads (major, minor, etc.) without specifying inversions. You may start on any chord tone.' || E'\n' || 'For voice input, answer from the lowest note upward.'
    WHEN 'triad_inversion' THEN 'Enter triads in the specified root position or inversion. Answer from the lowest note upward.'
    WHEN 'seventh' THEN 'Enter four-note chords without specifying inversions. You may start on any chord tone.' || E'\n' || 'For voice input, answer from the lowest note upward.'
    WHEN 'seventh_inversion' THEN 'Enter four-note chords in the specified root position or inversion. Answer from the lowest note upward.'
    WHEN 'scale_basic' THEN 'Read basic scales such as major and natural minor. Answer from the lowest scale tone upward.'
    WHEN 'scale_intermediate' THEN 'Read intermediate scales such as Dorian and Mixolydian. Answer from the lowest scale tone upward.'
    WHEN 'scale_advanced' THEN 'Read advanced scales such as altered and diminished. Answer from the lowest scale tone upward.'
    WHEN 'tension_voicing' THEN 'Read four-note voicings with tension notes.' || E'\n' || 'You may start on any chord tone. Notes in a different octave also count as correct.' || E'\n' || 'For voice input, answer from the lowest note upward.'
    WHEN 'tension_voicing_ab' THEN 'Enter A/B-form tension voicings from the staff. Answer from the lowest note upward.' || E'\n' || 'Practice A-form voicings built from the 3rd and B-form voicings built from the 7th.'
    WHEN 'two_hand_voicing' THEN 'Read two-hand jazz voicings such as So What, 4th voicings, and upper structure triads (UST).' || E'\n' || 'For voice input, answer from the lowest note upward.'
    WHEN 'lh_voicing_progression' THEN 'Practice left-hand voicings over II-V-I, blues, and standard progressions.' || E'\n' || 'For voice input, answer from the lowest note upward.' || E'\n' || 'In C only (always notated in concert pitch).'
    WHEN 'two_hand_voicing_progression' THEN 'Practice two-hand voicings over II-V-I, blues, and standard progressions.' || E'\n' || 'For voice input, answer from the lowest note upward.' || E'\n' || 'In C only (always notated in concert pitch).'
    ELSE description_en
  END,
  updated_at = now()
WHERE is_active IS TRUE;

-- ---------------------------------------------------------------------------
-- 3) Sync goal set descriptions from categories
-- ---------------------------------------------------------------------------
UPDATE public.training_goal_sets AS gs SET
  description_ja = tc.description_ja,
  description_en = tc.description_en,
  updated_at = now()
FROM public.training_categories AS tc
WHERE tc.slug = replace(gs.slug, 'goal-', '')
  AND tc.is_active IS TRUE;

COMMIT;
