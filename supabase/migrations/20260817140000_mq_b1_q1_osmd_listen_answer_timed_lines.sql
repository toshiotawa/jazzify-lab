-- mq-b1-q1-osmd-v1: 聴く／返す timedLines を小節 2〜25 まで手動定義（24 行）
BEGIN;

UPDATE public.ear_training_tutorial_scripts
SET
  script = jsonb_set(
    script,
    '{scenes,3,timedLines}',
    $json$[{"at":{"loop":0,"measure":2,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":3,"beat":1},"text":{"ja":"返す（ドとソ）","en":"Answer (Do & Sol)"}},{"at":{"loop":0,"measure":4,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":5,"beat":1},"text":{"ja":"返す（ドとソ）","en":"Answer (Do & Sol)"}},{"at":{"loop":0,"measure":6,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":7,"beat":1},"text":{"ja":"返す（ドとソ）","en":"Answer (Do & Sol)"}},{"at":{"loop":0,"measure":8,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":9,"beat":1},"text":{"ja":"返す（ドとソ）","en":"Answer (Do & Sol)"}},{"at":{"loop":0,"measure":10,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":11,"beat":1},"text":{"ja":"返す（ドとソ）","en":"Answer (Do & Sol)"}},{"at":{"loop":0,"measure":12,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":13,"beat":1},"text":{"ja":"返す（ドとソ）","en":"Answer (Do & Sol)"}},{"at":{"loop":0,"measure":14,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":15,"beat":1},"text":{"ja":"返す（ドとソ）","en":"Answer (Do & Sol)"}},{"at":{"loop":0,"measure":16,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":17,"beat":1},"text":{"ja":"返す（ドとソ）","en":"Answer (Do & Sol)"}},{"at":{"loop":0,"measure":18,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":19,"beat":1},"text":{"ja":"返す（ドとソ）","en":"Answer (Do & Sol)"}},{"at":{"loop":0,"measure":20,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":21,"beat":1},"text":{"ja":"返す（ドとソ）","en":"Answer (Do & Sol)"}},{"at":{"loop":0,"measure":22,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":23,"beat":1},"text":{"ja":"返す（ドとソ）","en":"Answer (Do & Sol)"}},{"at":{"loop":0,"measure":24,"beat":1},"text":{"ja":"聴く","en":"Listen"}},{"at":{"loop":0,"measure":25,"beat":1},"text":{"ja":"返す（ドとソ）","en":"Answer (Do & Sol)"}}]$json$::jsonb
  ),
  updated_at = now()
WHERE id = 'mq-b1-q1-osmd-v1';

COMMIT;
