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
  replaceEarTrainingStagePhrases,
  replaceEarTrainingPhraseChords,
  replaceEarTrainingPhraseDemoLoops,
  replaceEarTrainingPhraseNotes,
  updateEarTrainingPhrase,
  updateEarTrainingStage,
  type EarTrainingPhraseImportPayload,
} from '@/platform/supabaseEarTraining';
import { uploadEarTrainingMusicXml, uploadEarTrainingPhraseAudio } from '@/platform/r2Storage';
import { midiToPitchClass, noteNameToPitchClass } from '@/utils/earTrainingEngine';
import {
  buildEarTrainingChordVoicingDraftsFromMusicXml,
  buildEarTrainingPhraseDraftsFromMusicXml,
  createEarTrainingChordVoicingMusicXmlPreview,
  createEarTrainingMusicXmlPreview,
  scaleEarTrainingPhraseChordTimings,
  validateEarTrainingImportFileCount,
  type EarTrainingChordVoicingMusicXmlPreview,
  type EarTrainingMusicXmlPreview,
} from '@/utils/earTrainingMusicXmlImport';

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
  mode: 'phrase',
  chord_voicing_self_paced: false,
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
      (chord.voicing ?? []).join('|'),
      (chord.voicing_staves ?? []).join('|'),
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
  mode: stage.mode ?? 'phrase',
  chord_voicing_self_paced: stage.chord_voicing_self_paced ?? false,
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
      const [name, measure, beat, duration, start, end, voicing, voicingStaves] = line
        .split(',')
        .map(part => part.trim());
      const voicingArray = voicing
        ? voicing.split('|').map(value => value.trim()).filter(Boolean)
        : [];
      const voicingStavesArray = voicingStaves
        ? voicingStaves.split('|').map(value => Number(value.trim())).filter(value => Number.isFinite(value))
        : [];
      const validVoicing = voicingArray.length > 0 && voicingArray.length === voicingStavesArray.length;
      return {
        order_index: index,
        chord_name: name || 'C',
        measure_number: measure ? toNumber(measure, 1) : null,
        beat_offset: beat ? toNumber(beat, 0) : null,
        duration_beats: duration ? toNumber(duration, 4) : null,
        start_time_sec: start ? toNumber(start, 0) : null,
        end_time_sec: end ? toNumber(end, 0) : null,
        voicing: validVoicing ? voicingArray : null,
        voicing_staves: validVoicing ? voicingStavesArray : null,
      };
    });

const parseDemoLoops = (text: string): number[] =>
  text
    .split(',')
    .map(value => Number(value.trim()))
    .filter(value => Number.isInteger(value) && value >= 1 && value <= 16);

const roundSeconds = (value: number): number => Math.round(value * 1000) / 1000;

const getFileIdentity = (file: File): string => `${file.name}:${file.size}:${file.lastModified}`;

const sortAudioFiles = (files: File[]): File[] =>
  files.slice().sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

const getAudioDurationSec = (file: File): Promise<number> => new Promise(resolve => {
  const objectUrl = URL.createObjectURL(file);
  const audio = new Audio();
  const cleanup = () => {
    URL.revokeObjectURL(objectUrl);
  };

  audio.preload = 'metadata';
  audio.onloadedmetadata = () => {
    cleanup();
    resolve(Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0);
  };
  audio.onerror = () => {
    cleanup();
    resolve(0);
  };
  audio.src = objectUrl;
});

const EarTrainingStageManager: React.FC = () => {
  const toast = useToast();
  const [stages, setStages] = useState<EarTrainingStage[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [editingPhraseId, setEditingPhraseId] = useState<string | null>(null);
  const [stageForm, setStageForm] = useState<StageForm>(defaultStageForm);
  const [phraseForm, setPhraseForm] = useState<PhraseForm>(defaultPhraseForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importPhraseMeasures, setImportPhraseMeasures] = useState(defaultStageForm.loop_measures);
  const [importMusicXmlFile, setImportMusicXmlFile] = useState<File | null>(null);
  const [importMusicXmlText, setImportMusicXmlText] = useState('');
  const [importAudioFiles, setImportAudioFiles] = useState<File[]>([]);
  const [importPreview, setImportPreview] = useState<EarTrainingMusicXmlPreview | EarTrainingChordVoicingMusicXmlPreview | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

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
      const data = await fetchEarTrainingStages({ includeInactive: true, includeDemo: true, forceRefresh: true });
      setStages(data);
      if (!selectedStageId && data.length > 0) {
        setSelectedStageId(data[0].id);
        setStageForm(stageToForm(data[0]));
      }
    } catch {
      toast.error('バトルモードステージの読み込みに失敗しました');
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

  useEffect(() => {
    if (!selectedStage) {
      return;
    }
    setImportPhraseMeasures(selectedStage.loop_measures);
  }, [selectedStage]);

  useEffect(() => {
    if (!importMusicXmlText.trim()) {
      setImportPreview(null);
      setImportError(null);
      return;
    }

    try {
      const preview = stageForm.mode === 'chord_voicing'
        ? createEarTrainingChordVoicingMusicXmlPreview(importMusicXmlText, importPhraseMeasures)
        : createEarTrainingMusicXmlPreview(importMusicXmlText, importPhraseMeasures);
      setImportPreview(preview);
      setImportError(null);
    } catch (error) {
      setImportPreview(null);
      setImportError(error instanceof Error ? error.message : 'MusicXMLの解析に失敗しました');
    }
  }, [importMusicXmlText, importPhraseMeasures, stageForm.mode]);

  const selectStage = (stage: EarTrainingStage) => {
    setSelectedStageId(stage.id);
    setEditingPhraseId(null);
    setStageForm(stageToForm(stage));
  };

  const handleMusicXmlFileChange = async (file: File | null) => {
    setImportMusicXmlFile(file);
    if (!file) {
      setImportMusicXmlText('');
      return;
    }
    if (!/\.(xml|musicxml)$/i.test(file.name)) {
      toast.error('MusicXMLは.xmlまたは.musicxmlを選択してください');
      setImportMusicXmlFile(null);
      setImportMusicXmlText('');
      return;
    }
    setImportMusicXmlText(await file.text());
  };

  const handleAudioFilesChange = (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? [])
      .filter(file => /\.mp3$/i.test(file.name) || file.type === 'audio/mpeg')
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    setImportAudioFiles(prev => {
      const fileMap = new Map(prev.map(file => [getFileIdentity(file), file]));
      selectedFiles.forEach(file => fileMap.set(getFileIdentity(file), file));
      return sortAudioFiles(Array.from(fileMap.values()));
    });
  };

  const removeAudioFileAt = (index: number) => {
    setImportAudioFiles(prev => prev.filter((_, fileIndex) => fileIndex !== index));
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
    if (!selectedStage || !confirm('このバトルモードステージを削除しますか？')) {
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

  const importPhrasesFromFiles = async () => {
    if (!selectedStage) {
      toast.error('先にステージを選択してください');
      return;
    }
    if (!importMusicXmlFile || !importMusicXmlText.trim()) {
      toast.error('MusicXMLファイルを選択してください');
      return;
    }
    if (!importPreview) {
      toast.error(importError ?? 'MusicXMLを確認してください');
      return;
    }
    try {
      validateEarTrainingImportFileCount(importPreview, importAudioFiles.length);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'mp3ファイル数が一致しません');
      return;
    }
    if ((selectedStage.phrases?.length ?? 0) > 0 && !confirm('既存フレーズを削除して作り直します。よろしいですか？')) {
      return;
    }

    setImporting(true);
    try {
      const musicXmlUrl = await uploadEarTrainingMusicXml(importMusicXmlFile, selectedStage.id);
      const phrasePayloads: EarTrainingPhraseImportPayload[] = [];

      if (selectedStage.mode === 'chord_voicing') {
        const phraseDrafts = buildEarTrainingChordVoicingDraftsFromMusicXml(importMusicXmlText, {
          phraseMeasures: importPhraseMeasures,
          bpm: selectedStage.bpm,
          beatsPerMeasure: selectedStage.beats_per_measure,
        });
        for (const draft of phraseDrafts) {
          const audioFile = importAudioFiles[draft.orderIndex];
          const audioUrl = await uploadEarTrainingPhraseAudio(audioFile, selectedStage.id, draft.orderIndex);
          const audioDurationSec = await getAudioDurationSec(audioFile);
          const phraseMeasureCount = draft.endMeasure - draft.startMeasure + 1;
          const fallbackLoopDurationSec = (60 / selectedStage.bpm) * selectedStage.beats_per_measure * phraseMeasureCount;
          const resolvedAudioDurationSec = audioDurationSec > 0
            ? audioDurationSec
            : fallbackLoopDurationSec * selectedStage.max_loops_per_phrase;
          const loopDurationSec = audioDurationSec > 0
            ? audioDurationSec / selectedStage.max_loops_per_phrase
            : fallbackLoopDurationSec;
          const normalizedChords = scaleEarTrainingPhraseChordTimings(
            draft.chords,
            loopDurationSec,
            fallbackLoopDurationSec,
          );

          phrasePayloads.push({
            order_index: draft.orderIndex,
            title: `Phrase ${draft.orderIndex + 1}`,
            title_en: null,
            music_xml_url: musicXmlUrl,
            audio_url: audioUrl,
            loop_duration_sec: roundSeconds(loopDurationSec),
            audio_duration_sec: roundSeconds(resolvedAudioDurationSec),
            note_count: 0,
            notes: [],
            chords: normalizedChords.map((chord, index) => ({
              ...chord,
              voicing: draft.chords[index].voicing,
              voicing_staves: draft.chords[index].voicing_staves,
            })),
            demoLoopNumbers: [1, 3, 5],
          });
        }
      } else {
        const phraseDrafts = buildEarTrainingPhraseDraftsFromMusicXml(importMusicXmlText, {
          phraseMeasures: importPhraseMeasures,
          bpm: selectedStage.bpm,
          beatsPerMeasure: selectedStage.beats_per_measure,
        });
        for (const draft of phraseDrafts) {
          const audioFile = importAudioFiles[draft.orderIndex];
          const audioUrl = await uploadEarTrainingPhraseAudio(audioFile, selectedStage.id, draft.orderIndex);
          const audioDurationSec = await getAudioDurationSec(audioFile);
          const phraseMeasureCount = draft.endMeasure - draft.startMeasure + 1;
          const fallbackLoopDurationSec = (60 / selectedStage.bpm) * selectedStage.beats_per_measure * phraseMeasureCount;
          const resolvedAudioDurationSec = audioDurationSec > 0
            ? audioDurationSec
            : fallbackLoopDurationSec * selectedStage.max_loops_per_phrase;
          const loopDurationSec = audioDurationSec > 0
            ? audioDurationSec / selectedStage.max_loops_per_phrase
            : fallbackLoopDurationSec;
          const normalizedChords = scaleEarTrainingPhraseChordTimings(
            draft.chords,
            loopDurationSec,
            fallbackLoopDurationSec,
          );

          phrasePayloads.push({
            order_index: draft.orderIndex,
            title: `Phrase ${draft.orderIndex + 1}`,
            title_en: null,
            music_xml_url: musicXmlUrl,
            audio_url: audioUrl,
            loop_duration_sec: roundSeconds(loopDurationSec),
            audio_duration_sec: roundSeconds(resolvedAudioDurationSec),
            note_count: draft.noteCount,
            notes: draft.notes,
            chords: normalizedChords,
            demoLoopNumbers: [1, 3, 5],
          });
        }
      }

      await replaceEarTrainingStagePhrases(selectedStage.id, phrasePayloads);
      setEditingPhraseId(null);
      toast.success(`${phrasePayloads.length}フレーズを生成しました`);
      await loadStages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '一括アップロードに失敗しました');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-300">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">バトルモード管理</h1>
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
              <label className="block text-sm">
                <span className="mb-1 block text-gray-300">モード</span>
                <select
                  className="select select-bordered select-sm w-full bg-slate-900"
                  value={stageForm.mode}
                  onChange={event => setStageForm(prev => ({ ...prev, mode: event.target.value === 'chord_voicing' ? 'chord_voicing' : 'phrase' }))}
                >
                  <option value="phrase">バトルモード (phrase)</option>
                  <option value="chord_voicing">バトルモード (chord_voicing)</option>
                </select>
              </label>
              {stageForm.mode === 'chord_voicing' && (
                <label className="col-span-full flex items-center gap-2 text-sm md:col-span-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-sm"
                    checked={Boolean(stageForm.chord_voicing_self_paced)}
                    onChange={event => setStageForm(prev => ({
                      ...prev,
                      chord_voicing_self_paced: event.target.checked,
                    }))}
                  />
                  セルフペース進行（時間で進めず正解で次へ・無音・カウントインなし）
                </label>
              )}
              <NumberInput label="BPM" value={stageForm.bpm} onChange={value => setStageForm(prev => ({ ...prev, bpm: value }))} />
              <NumberInput label="拍/小節" value={stageForm.beats_per_measure} onChange={value => setStageForm(prev => ({ ...prev, beats_per_measure: value }))} />
              <NumberInput label="拍子分母" value={stageForm.beat_type} onChange={value => setStageForm(prev => ({ ...prev, beat_type: value }))} />
              <NumberInput label="ループ小節数" value={stageForm.loop_measures} onChange={value => setStageForm(prev => ({ ...prev, loop_measures: value }))} />
              <NumberInput label="最大ループ数" value={stageForm.max_loops_per_phrase} onChange={value => setStageForm(prev => ({ ...prev, max_loops_per_phrase: value }))} />
              <NumberInput label="カウントイン拍数" value={stageForm.count_in_beats} onChange={value => setStageForm(prev => ({ ...prev, count_in_beats: value }))} />
              <NumberInput label="制限時間(秒)" value={stageForm.time_limit_sec} onChange={value => setStageForm(prev => ({ ...prev, time_limit_sec: value }))} />
              <NumberInput label="プレイヤーHP" value={stageForm.player_hp} onChange={value => setStageForm(prev => ({ ...prev, player_hp: value }))} />
              <NumberInput label="敵HP" value={stageForm.enemy_hp} onChange={value => setStageForm(prev => ({ ...prev, enemy_hp: value }))} />
              <NumberInput label="1音ダメージ" value={stageForm.per_correct_note_damage} onChange={value => setStageForm(prev => ({ ...prev, per_correct_note_damage: value }))} />
              <NumberInput label="ミスダメージ" value={stageForm.miss_damage} onChange={value => setStageForm(prev => ({ ...prev, miss_damage: value }))} />
              <NumberInput label="Good完成" value={stageForm.good_completion_damage} onChange={value => setStageForm(prev => ({ ...prev, good_completion_damage: value }))} />
              <NumberInput label="Great完成" value={stageForm.great_completion_damage} onChange={value => setStageForm(prev => ({ ...prev, great_completion_damage: value }))} />
              <NumberInput label="Perfect完成" value={stageForm.perfect_completion_damage} onChange={value => setStageForm(prev => ({ ...prev, perfect_completion_damage: value }))} />
              <NumberInput label="Fail被ダメージ" value={stageForm.fail_damage} onChange={value => setStageForm(prev => ({ ...prev, fail_damage: value }))} />
              <NumberInput label="Perfect最大ミス" value={stageForm.perfect_max_misses} onChange={value => setStageForm(prev => ({ ...prev, perfect_max_misses: value }))} />
              <NumberInput label="Great最大ミス" value={stageForm.great_max_misses} onChange={value => setStageForm(prev => ({ ...prev, great_max_misses: value }))} />
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
            <>
              <section className="rounded-xl bg-slate-800 p-4">
                <h2 className="mb-2 text-lg font-bold">一括生成アップロード</h2>
                <p className="mb-4 text-sm text-gray-400">
                  MusicXMLを1つ、mp3をフレーズ数分アップロードします。MusicXMLは指定小節数ごとに分割され、既存フレーズは置き換えられます。
                </p>
                <div className="grid gap-3 lg:grid-cols-3">
                  <NumberInput
                    label="1フレーズの小節数"
                    value={importPhraseMeasures}
                    onChange={value => setImportPhraseMeasures(Math.max(1, Math.floor(value)))}
                  />
                  <label className="block text-sm">
                    <span className="mb-1 block text-gray-300">MusicXML 1ファイル</span>
                    <input
                      type="file"
                      accept=".xml,.musicxml,application/xml,text/xml"
                      className="file-input file-input-bordered file-input-sm w-full bg-slate-900"
                      onChange={event => void handleMusicXmlFileChange(event.target.files?.[0] ?? null)}
                    />
                    {importMusicXmlFile && <span className="mt-1 block text-xs text-gray-400">{importMusicXmlFile.name}</span>}
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-gray-300">mp3ファイルを追加（フレーズ分）</span>
                    <input
                      type="file"
                      accept=".mp3,audio/mpeg"
                      multiple={true}
                      className="file-input file-input-bordered file-input-sm w-full bg-slate-900"
                      onChange={event => {
                        handleAudioFilesChange(event.target.files);
                        event.currentTarget.value = '';
                      }}
                    />
                    <span className="mt-1 block text-xs text-gray-400">
                      複数選択、または何回かに分けて追加できます。ファイル名順でPhrase 1から割り当てます。
                    </span>
                  </label>
                </div>

                {importAudioFiles.length > 0 && (
                  <div className="mt-4 rounded-lg bg-slate-900 p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-200">選択済みmp3: {importAudioFiles.length}個</span>
                      <button
                        type="button"
                        className="btn btn-outline btn-xs"
                        onClick={() => setImportAudioFiles([])}
                      >
                        クリア
                      </button>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                      {importAudioFiles.map((file, index) => (
                        <div key={getFileIdentity(file)} className="flex items-center justify-between gap-2 rounded bg-slate-800 px-2 py-1 text-xs text-gray-200">
                          <span className="min-w-0 truncate">Phrase {index + 1}: {file.name}</span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs shrink-0"
                            onClick={() => removeAudioFileAt(index)}
                          >
                            削除
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {importError && (
                  <div className="alert alert-error mt-4 py-2 text-sm">
                    {importError}
                  </div>
                )}

                {importPreview && (
                  <div className="mt-4 rounded-lg bg-slate-900 p-3 text-sm">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-200">
                      <span>総小節数: {importPreview.totalMeasures}</span>
                      <span>生成フレーズ数: {importPreview.phraseCount}</span>
                      <span className={importAudioFiles.length === importPreview.phraseCount ? 'text-green-300' : 'text-yellow-300'}>
                        選択mp3: {importAudioFiles.length} / {importPreview.phraseCount}
                      </span>
                    </div>
                    {selectedStage?.mode === 'chord_voicing' && 'hasMultipleStaves' in importPreview && !importPreview.hasMultipleStaves && (
                      <div className="mt-2 rounded bg-yellow-900/40 px-2 py-1 text-xs text-yellow-200">
                        この MusicXML には &lt;staff&gt; 情報が1種類のみです。全ノートをト音譜表として扱います。
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {importPreview.ranges.map(range => (
                        <span key={range.orderIndex} className="rounded bg-slate-700 px-2 py-1 text-xs text-gray-200">
                          Phrase {range.orderIndex + 1}: {range.startMeasure}-{range.endMeasure}小節
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn-secondary btn-sm mt-4"
                  disabled={importing || saving || !importPreview || importAudioFiles.length !== importPreview.phraseCount}
                  onClick={importPhrasesFromFiles}
                >
                  {importing ? '生成中...' : 'アップロードしてフレーズ生成'}
                </button>
              </section>

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
                  label={selectedStage?.mode === 'chord_voicing'
                    ? 'コード: chord,measure,beat,duration,start,end,voicing(D4|F#4|A4|C5),staves(1|1|1|1)'
                    : 'コード: chord,measure,beat,duration,start,end'}
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
            </>
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
