import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/stores/toastStore';
import type {
  EarTrainingPhrase,
  EarTrainingPhraseChord,
  EarTrainingPhraseNote,
  EarTrainingStage,
} from '@/types';
import {
  createEarTrainingPhrase,
  createEarTrainingStage,
  deleteEarTrainingPhrase,
  deleteEarTrainingStage,
  fetchEarTrainingStages,
  replaceEarTrainingPhraseChords,
  replaceEarTrainingPhraseDemoLoops,
  replaceEarTrainingPhraseNotes,
  updateEarTrainingPhrase,
  updateEarTrainingStage,
} from '@/platform/supabaseEarTraining';
import { midiToPitchClass, noteNameToPitchClass } from '@/utils/earTrainingEngine';

type StageForm = Omit<EarTrainingStage, 'id' | 'created_at' | 'updated_at' | 'phrases'>;

type PhraseForm = Omit<EarTrainingPhrase, 'id' | 'stage_id' | 'created_at' | 'updated_at' | 'notes' | 'chords' | 'demo_loops'> & {
  notesText: string;
  chordsText: string;
  demoLoopsText: string;
};

const defaultStageForm: StageForm = {
  slug: '',
  title: '',
  title_en: '',
  description: '',
  description_en: '',
  bpm: 120,
  beats_per_measure: 4,
  beat_type: 4,
  loop_measures: 2,
  max_loops_per_phrase: 6,
  count_in_beats: 4,
  time_limit_sec: 120,
  player_hp: 100,
  enemy_hp: 100,
  per_correct_note_damage: 1,
  good_completion_damage: 8,
  great_completion_damage: 12,
  perfect_completion_damage: 16,
  miss_damage: 3,
  fail_damage: 10,
  perfect_max_misses: 0,
  great_max_misses: 2,
  background_theme: 'blue_club',
  is_active: true,
};

const defaultPhraseForm: PhraseForm = {
  order_index: 0,
  title: '',
  title_en: '',
  music_xml_url: '',
  audio_url: '',
  loop_duration_sec: 4,
  audio_duration_sec: 24,
  note_count: 0,
  notesText: '',
  chordsText: '',
  demoLoopsText: '1,3,5',
};

const toNumber = (value: string, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const serializeNotes = (notes: EarTrainingPhraseNote[] | undefined): string =>
  (notes ?? [])
    .slice()
    .sort((a, b) => a.note_index - b.note_index)
    .map(note => [
      note.note_name,
      note.pitch_midi,
      note.measure_number ?? '',
      note.beat_offset ?? '',
    ].join(','))
    .join('\n');

const serializeChords = (chords: EarTrainingPhraseChord[] | undefined): string =>
  (chords ?? [])
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .map(chord => [
      chord.chord_name,
      chord.measure_number ?? '',
      chord.beat_offset ?? '',
      chord.duration_beats ?? '',
      chord.start_time_sec ?? '',
      chord.end_time_sec ?? '',
    ].join(','))
    .join('\n');

const phraseToForm = (phrase: EarTrainingPhrase): PhraseForm => ({
  order_index: phrase.order_index,
  title: phrase.title ?? '',
  title_en: phrase.title_en ?? '',
  music_xml_url: phrase.music_xml_url ?? '',
  audio_url: phrase.audio_url,
  loop_duration_sec: phrase.loop_duration_sec,
  audio_duration_sec: phrase.audio_duration_sec,
  note_count: phrase.note_count,
  notesText: serializeNotes(phrase.notes),
  chordsText: serializeChords(phrase.chords),
  demoLoopsText: (phrase.demo_loops ?? [])
    .slice()
    .sort((a, b) => a.loop_number - b.loop_number)
    .map(loop => String(loop.loop_number))
    .join(','),
});

const stageToForm = (stage: EarTrainingStage): StageForm => ({
  slug: stage.slug,
  title: stage.title,
  title_en: stage.title_en ?? '',
  description: stage.description ?? '',
  description_en: stage.description_en ?? '',
  bpm: stage.bpm,
  beats_per_measure: stage.beats_per_measure,
  beat_type: stage.beat_type,
  loop_measures: stage.loop_measures,
  max_loops_per_phrase: stage.max_loops_per_phrase,
  count_in_beats: stage.count_in_beats,
  time_limit_sec: stage.time_limit_sec,
  player_hp: stage.player_hp,
  enemy_hp: stage.enemy_hp,
  per_correct_note_damage: stage.per_correct_note_damage,
  good_completion_damage: stage.good_completion_damage,
  great_completion_damage: stage.great_completion_damage,
  perfect_completion_damage: stage.perfect_completion_damage,
  miss_damage: stage.miss_damage,
  fail_damage: stage.fail_damage,
  perfect_max_misses: stage.perfect_max_misses,
  great_max_misses: stage.great_max_misses,
  background_theme: stage.background_theme,
  is_active: stage.is_active,
});

const parseNotes = (text: string): Omit<EarTrainingPhraseNote, 'id' | 'phrase_id' | 'created_at'>[] =>
  text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [rawName, rawMidi, rawMeasure, rawBeat] = line.split(',').map(part => part.trim());
      const pitchMidi = toNumber(rawMidi ?? '', 60);
      const noteName = rawName || 'C4';
      return {
        note_index: index,
        pitch_midi: pitchMidi,
        pitch_class: noteNameToPitchClass(noteName) ?? midiToPitchClass(pitchMidi),
        note_name: noteName,
        octave: Math.floor(pitchMidi / 12) - 1,
        measure_number: rawMeasure ? toNumber(rawMeasure, 1) : null,
        beat_offset: rawBeat ? toNumber(rawBeat, 0) : null,
        tied_from_previous: false,
      };
    });

const parseChords = (text: string): Omit<EarTrainingPhraseChord, 'id' | 'phrase_id' | 'created_at'>[] =>
  text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [name, measure, beat, duration, start, end] = line.split(',').map(part => part.trim());
      return {
        order_index: index,
        chord_name: name || 'C',
        measure_number: measure ? toNumber(measure, 1) : null,
        beat_offset: beat ? toNumber(beat, 0) : null,
        duration_beats: duration ? toNumber(duration, 4) : null,
        start_time_sec: start ? toNumber(start, 0) : null,
        end_time_sec: end ? toNumber(end, 0) : null,
      };
    });

const parseDemoLoops = (text: string): number[] =>
  text
    .split(',')
    .map(value => Number(value.trim()))
    .filter(value => Number.isInteger(value) && value >= 1 && value <= 16);

const EarTrainingStageManager: React.FC = () => {
  const toast = useToast();
  const [stages, setStages] = useState<EarTrainingStage[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [editingPhraseId, setEditingPhraseId] = useState<string | null>(null);
  const [stageForm, setStageForm] = useState<StageForm>(defaultStageForm);
  const [phraseForm, setPhraseForm] = useState<PhraseForm>(defaultPhraseForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedStage = useMemo(
    () => stages.find(stage => stage.id === selectedStageId) ?? null,
    [selectedStageId, stages],
  );

  const selectedPhrase = useMemo(
    () => selectedStage?.phrases?.find(phrase => phrase.id === editingPhraseId) ?? null,
    [editingPhraseId, selectedStage],
  );

  const loadStages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEarTrainingStages({ includeInactive: true, forceRefresh: true });
      setStages(data);
      if (!selectedStageId && data.length > 0) {
        setSelectedStageId(data[0].id);
        setStageForm(stageToForm(data[0]));
      }
    } catch {
      toast.error('耳コピステージの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [selectedStageId, toast]);

  useEffect(() => {
    void loadStages();
  }, [loadStages]);

  useEffect(() => {
    if (!selectedPhrase) {
      setPhraseForm(defaultPhraseForm);
      return;
    }
    setPhraseForm(phraseToForm(selectedPhrase));
  }, [selectedPhrase]);

  const selectStage = (stage: EarTrainingStage) => {
    setSelectedStageId(stage.id);
    setEditingPhraseId(null);
    setStageForm(stageToForm(stage));
  };

  const saveStage = async () => {
    if (!stageForm.slug.trim() || !stageForm.title.trim()) {
      toast.error('slugとタイトルは必須です');
      return;
    }

    setSaving(true);
    try {
      if (selectedStage) {
        await updateEarTrainingStage(selectedStage.id, stageForm);
        toast.success('ステージを更新しました');
      } else {
        const created = await createEarTrainingStage(stageForm);
        setSelectedStageId(created.id);
        toast.success('ステージを作成しました');
      }
      await loadStages();
    } catch {
      toast.error('ステージの保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const removeStage = async () => {
    if (!selectedStage || !confirm('この耳コピステージを削除しますか？')) {
      return;
    }
    setSaving(true);
    try {
      await deleteEarTrainingStage(selectedStage.id);
      setSelectedStageId(null);
      setStageForm(defaultStageForm);
      toast.success('ステージを削除しました');
      await loadStages();
    } catch {
      toast.error('ステージの削除に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const savePhrase = async () => {
    if (!selectedStage) {
      toast.error('先にステージを選択してください');
      return;
    }
    if (!phraseForm.audio_url.trim()) {
      toast.error('フレーズ音源URLは必須です');
      return;
    }

    setSaving(true);
    try {
      const noteRows = parseNotes(phraseForm.notesText);
      const phrasePayload = {
        order_index: phraseForm.order_index,
        title: phraseForm.title || null,
        title_en: phraseForm.title_en || null,
        music_xml_url: phraseForm.music_xml_url || null,
        audio_url: phraseForm.audio_url,
        loop_duration_sec: phraseForm.loop_duration_sec,
        audio_duration_sec: phraseForm.audio_duration_sec,
        note_count: noteRows.length,
      };
      const phrase = selectedPhrase
        ? await updateEarTrainingPhrase(selectedPhrase.id, phrasePayload)
        : await createEarTrainingPhrase({ ...phrasePayload, stage_id: selectedStage.id });

      await Promise.all([
        replaceEarTrainingPhraseNotes(phrase.id, noteRows),
        replaceEarTrainingPhraseChords(phrase.id, parseChords(phraseForm.chordsText)),
        replaceEarTrainingPhraseDemoLoops(phrase.id, parseDemoLoops(phraseForm.demoLoopsText)),
      ]);

      toast.success('フレーズを保存しました');
      setEditingPhraseId(phrase.id);
      await loadStages();
    } catch {
      toast.error('フレーズの保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const removePhrase = async () => {
    if (!selectedPhrase || !confirm('このフレーズを削除しますか？')) {
      return;
    }
    setSaving(true);
    try {
      await deleteEarTrainingPhrase(selectedPhrase.id);
      setEditingPhraseId(null);
      setPhraseForm(defaultPhraseForm);
      toast.success('フレーズを削除しました');
      await loadStages();
    } catch {
      toast.error('フレーズの削除に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-300">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">耳コピバトル管理</h1>
          <p className="text-sm text-gray-400">ステージ、フレーズ音源、判定ノート、コード表示を編集します。</p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            setSelectedStageId(null);
            setEditingPhraseId(null);
            setStageForm(defaultStageForm);
            setPhraseForm(defaultPhraseForm);
          }}
        >
          新規ステージ
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="space-y-2 rounded-xl bg-slate-800 p-3">
          {stages.map(stage => (
            <button
              key={stage.id}
              type="button"
              onClick={() => selectStage(stage)}
              className={`w-full rounded-lg p-3 text-left ${selectedStageId === stage.id ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
            >
              <div className="font-semibold">{stage.title}</div>
              <div className="text-xs text-gray-300">{stage.slug}</div>
            </button>
          ))}
          {stages.length === 0 && <div className="p-3 text-sm text-gray-400">未登録です</div>}
        </aside>

        <div className="space-y-6">
          <section className="rounded-xl bg-slate-800 p-4">
            <h2 className="mb-4 text-lg font-bold">ステージ設定</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Input label="slug" value={stageForm.slug} onChange={value => setStageForm(prev => ({ ...prev, slug: value }))} />
              <Input label="タイトル" value={stageForm.title} onChange={value => setStageForm(prev => ({ ...prev, title: value }))} />
              <Input label="英語タイトル" value={stageForm.title_en ?? ''} onChange={value => setStageForm(prev => ({ ...prev, title_en: value }))} />
              <Input label="背景テーマ" value={stageForm.background_theme} onChange={value => setStageForm(prev => ({ ...prev, background_theme: value }))} />
              <NumberInput label="BPM" value={stageForm.bpm} onChange={value => setStageForm(prev => ({ ...prev, bpm: value }))} />
              <NumberInput label="拍/小節" value={stageForm.beats_per_measure} onChange={value => setStageForm(prev => ({ ...prev, beats_per_measure: value }))} />
              <NumberInput label="ループ小節数" value={stageForm.loop_measures} onChange={value => setStageForm(prev => ({ ...prev, loop_measures: value }))} />
              <NumberInput label="制限時間(秒)" value={stageForm.time_limit_sec} onChange={value => setStageForm(prev => ({ ...prev, time_limit_sec: value }))} />
              <NumberInput label="プレイヤーHP" value={stageForm.player_hp} onChange={value => setStageForm(prev => ({ ...prev, player_hp: value }))} />
              <NumberInput label="敵HP" value={stageForm.enemy_hp} onChange={value => setStageForm(prev => ({ ...prev, enemy_hp: value }))} />
              <NumberInput label="1音ダメージ" value={stageForm.per_correct_note_damage} onChange={value => setStageForm(prev => ({ ...prev, per_correct_note_damage: value }))} />
              <NumberInput label="ミスダメージ" value={stageForm.miss_damage} onChange={value => setStageForm(prev => ({ ...prev, miss_damage: value }))} />
              <NumberInput label="Good完成" value={stageForm.good_completion_damage} onChange={value => setStageForm(prev => ({ ...prev, good_completion_damage: value }))} />
              <NumberInput label="Great完成" value={stageForm.great_completion_damage} onChange={value => setStageForm(prev => ({ ...prev, great_completion_damage: value }))} />
              <NumberInput label="Perfect完成" value={stageForm.perfect_completion_damage} onChange={value => setStageForm(prev => ({ ...prev, perfect_completion_damage: value }))} />
              <NumberInput label="Fail被ダメージ" value={stageForm.fail_damage} onChange={value => setStageForm(prev => ({ ...prev, fail_damage: value }))} />
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <TextArea label="説明" value={stageForm.description ?? ''} onChange={value => setStageForm(prev => ({ ...prev, description: value }))} />
              <TextArea label="英語説明" value={stageForm.description_en ?? ''} onChange={value => setStageForm(prev => ({ ...prev, description_en: value }))} />
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="checkbox checkbox-primary checkbox-sm"
                checked={stageForm.is_active}
                onChange={event => setStageForm(prev => ({ ...prev, is_active: event.target.checked }))}
              />
              公開する
            </label>
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn btn-primary btn-sm" disabled={saving} onClick={saveStage}>
                {selectedStage ? 'ステージ更新' : 'ステージ作成'}
              </button>
              {selectedStage && (
                <button type="button" className="btn btn-error btn-sm" disabled={saving} onClick={removeStage}>
                  削除
                </button>
              )}
            </div>
          </section>

          {selectedStage && (
            <section className="rounded-xl bg-slate-800 p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold">フレーズ</h2>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setEditingPhraseId(null);
                    setPhraseForm({
                      ...defaultPhraseForm,
                      order_index: selectedStage.phrases?.length ?? 0,
                    });
                  }}
                >
                  新規フレーズ
                </button>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {(selectedStage.phrases ?? []).map(phrase => (
                  <button
                    key={phrase.id}
                    type="button"
                    className={`btn btn-sm ${editingPhraseId === phrase.id ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setEditingPhraseId(phrase.id)}
                  >
                    Phrase {phrase.order_index + 1}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <NumberInput label="順序" value={phraseForm.order_index} onChange={value => setPhraseForm(prev => ({ ...prev, order_index: value }))} />
                <Input label="タイトル" value={phraseForm.title ?? ''} onChange={value => setPhraseForm(prev => ({ ...prev, title: value }))} />
                <NumberInput label="loopDuration秒" value={phraseForm.loop_duration_sec} onChange={value => setPhraseForm(prev => ({ ...prev, loop_duration_sec: value }))} />
                <NumberInput label="audioDuration秒" value={phraseForm.audio_duration_sec} onChange={value => setPhraseForm(prev => ({ ...prev, audio_duration_sec: value }))} />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Input label="mp3 URL" value={phraseForm.audio_url} onChange={value => setPhraseForm(prev => ({ ...prev, audio_url: value }))} />
                <Input label="MusicXML URL" value={phraseForm.music_xml_url ?? ''} onChange={value => setPhraseForm(prev => ({ ...prev, music_xml_url: value }))} />
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-3">
                <TextArea
                  label="ノート: noteName,midi,measure,beat"
                  rows={8}
                  value={phraseForm.notesText}
                  onChange={value => setPhraseForm(prev => ({ ...prev, notesText: value }))}
                />
                <TextArea
                  label="コード: chord,measure,beat,duration,start,end"
                  rows={8}
                  value={phraseForm.chordsText}
                  onChange={value => setPhraseForm(prev => ({ ...prev, chordsText: value }))}
                />
                <TextArea
                  label="模範ループ: 1,3,5"
                  rows={8}
                  value={phraseForm.demoLoopsText}
                  onChange={value => setPhraseForm(prev => ({ ...prev, demoLoopsText: value }))}
                />
              </div>
              <div className="mt-4 flex gap-2">
                <button type="button" className="btn btn-primary btn-sm" disabled={saving} onClick={savePhrase}>
                  {selectedPhrase ? 'フレーズ更新' : 'フレーズ追加'}
                </button>
                {selectedPhrase && (
                  <button type="button" className="btn btn-error btn-sm" disabled={saving} onClick={removePhrase}>
                    フレーズ削除
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

const Input: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({ label, value, onChange }) => (
  <label className="block text-sm">
    <span className="mb-1 block text-gray-300">{label}</span>
    <input
      type="text"
      className="input input-bordered input-sm w-full bg-slate-900"
      value={value}
      onChange={event => onChange(event.target.value)}
    />
  </label>
);

const NumberInput: React.FC<{ label: string; value: number; onChange: (value: number) => void }> = ({ label, value, onChange }) => (
  <label className="block text-sm">
    <span className="mb-1 block text-gray-300">{label}</span>
    <input
      type="number"
      className="input input-bordered input-sm w-full bg-slate-900"
      value={value}
      onChange={event => onChange(Number(event.target.value))}
    />
  </label>
);

const TextArea: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}> = ({ label, value, onChange, rows = 3 }) => (
  <label className="block text-sm">
    <span className="mb-1 block text-gray-300">{label}</span>
    <textarea
      className="textarea textarea-bordered w-full bg-slate-900 font-mono text-xs"
      rows={rows}
      value={value}
      onChange={event => onChange(event.target.value)}
    />
  </label>
);

export default EarTrainingStageManager;
