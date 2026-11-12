import type { EarTrainingStage } from '@/types';
import { buildChordOsmdRhythmTargetsWithMeta } from '@/utils/earTrainingCanonicalPhraseNotes';
import { collectChordOsmdMusicXmlAttacks, earTrainingOsmdUsesScoreTargets } from '@/utils/earTrainingChordOsmd';
import {
  fetchEarTrainingMidi,
  fetchEarTrainingMusicXml,
} from '@/utils/prefetchEarTrainingLobbyAssets';

/** ステージ1周ぶんの判定ターゲット数（全フレーズ合算）。バトル開始前に一度だけ呼ぶ。 */
export const countEarTrainingOsmdStageTargetsPerLoop = async (
  stage: EarTrainingStage,
): Promise<number> => {
  const phrases = (stage.phrases ?? [])
    .slice()
    .sort((a, b) => a.order_index - b.order_index);
  if (phrases.length === 0) {
    return 0;
  }

  const fromScore = earTrainingOsmdUsesScoreTargets(stage);
  let total = 0;

  for (const phrase of phrases) {
    const rawUrl = phrase.music_xml_url?.trim() ?? '';
    if (rawUrl.length === 0) {
      continue;
    }
    const xml = await fetchEarTrainingMusicXml(rawUrl);
    if (!xml) {
      continue;
    }
    const midiUrl = phrase.midi_url?.trim() ?? '';
    const midiData = midiUrl.length > 0 ? await fetchEarTrainingMidi(midiUrl) : null;
    const attacks = collectChordOsmdMusicXmlAttacks(xml);
    const built = buildChordOsmdRhythmTargetsWithMeta(
      phrase,
      stage.bpm,
      stage.beats_per_measure,
      attacks,
      fromScore,
      0,
      null,
      stage.is_swing === true,
      xml,
      midiData,
      phrase.audio_anchor_ms,
    );
    total += built.targets.length;
  }

  return total;
};
