-- developer-full-v1: dialogue_only でジャ爺（partner）セリフを追加・speaker 明示

BEGIN;

UPDATE public.ear_training_tutorial_scripts
SET
  updated_at = now(),
  script = jsonb_set(
    jsonb_set(
      script,
      '{scenes,0,lines}',
      $dialogue0$
[
{"speaker":"player","ja":"耳コピバトル・チュートリアルへようこそ。","en":"Welcome to the ear training battle tutorial."},
{"speaker":"partner","ja":"ワシが付いとるから安心じゃ！","en":"I've got your back!"},
{"speaker":"player","ja":"まずはセリフだけのシーンです。","en":"This is a dialogue-only scene first."},
{"speaker":"partner","ja":"交互にセリフが出るようになったで。","en":"Lines now alternate between us."},
{"speaker":"player","ja":"ドラムループが流れています。","en":"A drum loop is playing."}
]
$dialogue0$::jsonb,
      true
    ),
    '{scenes,5,lines}',
    $dialogue5$
[
{"speaker":"player","ja":"お疲れさま。最後まで見るとクリアです。","en":"Well done. Finish to clear the lesson."},
{"speaker":"partner","ja":"よく頑張ったのう。","en":"You did great out there!"}
]
$dialogue5$::jsonb,
    true
  )
WHERE id = 'developer-full-v1';

COMMIT;
