import {
  listTwoHandVoicingMinusOneTargets,
  twoHandVoicingMinusOneCdnUrl,
} from '@/utils/twoHandVoicingMinusOneSchedule';

export const generateTwoHandVoicingMinusOneMigrationSql = (): string => {
  const targets = listTwoHandVoicingMinusOneTargets();
  const lines: string[] = [
    '-- 両手ヴォイシング chord_voicing マイナスワン audio_url 一括適用',
    '-- phrase_chords / 課題定義は変更しない',
    '',
  ];

  for (const target of targets) {
    const audioUrl = twoHandVoicingMinusOneCdnUrl(target.outputFileName);
    lines.push(
      'UPDATE public.ear_training_phrases p',
      'SET',
      `  audio_url = '${audioUrl}',`,
      '  updated_at = now()',
      'FROM public.ear_training_stages s',
      'WHERE p.stage_id = s.id',
      `  AND s.slug = '${target.stageSlug}'`,
      `  AND p.order_index = ${target.phraseOrderIndex};`,
      '',
    );
  }

  return `${lines.join('\n')}\n`;
};
