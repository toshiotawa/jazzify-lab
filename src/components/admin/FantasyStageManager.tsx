import React, { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useToast } from '@/stores/toastStore';
import {
  FantasyStage as DbFantasyStage,
} from '@/types';
import {
  fetchFantasyModeStages,
  fetchFantasyStageById,
  createFantasyStage,
  updateFantasyStage,
  deleteFantasyStage,
  UpsertFantasyStagePayload,
} from '@/platform/supabaseFantasyStages';
import { FantasyStageSelector } from './FantasyStageSelector';
import { CHORD_TEMPLATES, ChordQuality } from '@/utils/chord-templates';

// モード型
type AdminStageMode = 'single' | 'progression_order' | 'progression_random' | 'progression_timing';

// progression_timing 用の行
interface TimingRow {
  bar: number;
  beats: number;
  chord: string;
  inversion?: number | null;
  octave?: number | null;
  text?: string; // Harmonyや任意のオーバーレイ文字列
  type?: 'note'; // 単音指定
}

// フォーム全体
interface StageFormValues {
  id?: string;
  stage_number: string;
  name: string;
  description?: string;
  mode: AdminStageMode;
  // 戦闘系
  max_hp: number;
  enemy_gauge_seconds: number;
  enemy_count: number;
  enemy_hp: number;
  min_damage: number;
  max_damage: number;
  simultaneous_monster_count: number;
  show_guide: boolean;
  // ルート音設定
  play_root_on_correct: boolean;
  // BGM/表示
  bpm?: number;
  measure_count?: number;
  time_signature?: number;
  count_in_measures?: number;
  bgm_url?: string | null;
  mp3_url?: string | null;
  // progression 共通
  note_interval_beats?: number | null; // order/random
  // コード入力
  allowed_chords: any[]; // string or {chord,inversion,octave}
  chord_progression: any[]; // for order
  chord_progression_data: TimingRow[]; // for timing
  // 新規: ステージ種別
  stage_tier: 'basic' | 'advanced';
  // 楽譜モード
  is_sheet_music_mode: boolean;
}

const defaultValues: StageFormValues = {
  stage_number: '',
  name: '',
  description: '',
  mode: 'single',
  max_hp: 5,
  enemy_gauge_seconds: 5,
  enemy_count: 1,
  enemy_hp: 5,
  min_damage: 1,
  max_damage: 1,
  simultaneous_monster_count: 1,
  show_guide: false,
  play_root_on_correct: true,
  bpm: 120,
  measure_count: 8,
  time_signature: 4,
  count_in_measures: 0,
  note_interval_beats: null,
  allowed_chords: [],
  chord_progression: [],
  chord_progression_data: [],
  bgm_url: '',
  mp3_url: '',
  stage_tier: 'basic',
  is_sheet_music_mode: false,
};

// 楽譜モード用の音名リスト（プレフィックス付き）
// 形式: {clef}_{noteName} (例: treble_C4, bass_C3)
const TREBLE_NOTES = [
  'treble_A3', 'treble_A#3', 'treble_Bb3', 'treble_B3',
  'treble_C4', 'treble_C#4', 'treble_Db4', 'treble_D4', 'treble_D#4', 'treble_Eb4', 'treble_E4', 'treble_F4', 'treble_F#4', 'treble_Gb4', 'treble_G4', 'treble_G#4', 'treble_Ab4',
  'treble_A4', 'treble_A#4', 'treble_Bb4', 'treble_B4',
  'treble_C5', 'treble_C#5', 'treble_Db5', 'treble_D5', 'treble_D#5', 'treble_Eb5', 'treble_E5', 'treble_F5', 'treble_F#5', 'treble_Gb5', 'treble_G5', 'treble_G#5', 'treble_Ab5',
  'treble_A5', 'treble_A#5', 'treble_Bb5', 'treble_B5',
  'treble_C6'
];

const BASS_NOTES = [
  'bass_C2', 'bass_C#2', 'bass_Db2', 'bass_D2', 'bass_D#2', 'bass_Eb2', 'bass_E2', 'bass_F2', 'bass_F#2', 'bass_Gb2', 'bass_G2', 'bass_G#2', 'bass_Ab2',
  'bass_A2', 'bass_A#2', 'bass_Bb2', 'bass_B2',
  'bass_C3', 'bass_C#3', 'bass_Db3', 'bass_D3', 'bass_D#3', 'bass_Eb3', 'bass_E3', 'bass_F3', 'bass_F#3', 'bass_Gb3', 'bass_G3', 'bass_G#3', 'bass_Ab3',
  'bass_A3', 'bass_A#3', 'bass_Bb3', 'bass_B3',
  'bass_C4', 'bass_C#4', 'bass_Db4', 'bass_D4', 'bass_D#4', 'bass_Eb4', 'bass_E4'
];

// すべての楽譜音名（treble + bass）
const ALL_SHEET_MUSIC_NOTES = [...TREBLE_NOTES, ...BASS_NOTES];

// 音名から表示用のラベルを取得（プレフィックスを除去）
const getNoteDisplayLabel = (note: string): string => {
  if (note.startsWith('treble_')) return note.replace('treble_', '');
  if (note.startsWith('bass_')) return note.replace('bass_', '');
  return note;
};

// クリック追加用のルート音リスト（16種類）
const CLICK_ADD_ROOTS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'Bb', 'B'] as const;

// インターバル表記を人間が読みやすい形式に変換
const formatInterval = (interval: string): string => {
  // 1P → R, 3M → M3, 3m → m3, 5P → P5, 7m → m7, 7M → M7, etc.
  if (interval === '1P') return 'R';
  const degree = interval.slice(0, -1);
  const quality = interval.slice(-1);
  const qualityMap: Record<string, string> = {
    'P': 'P',
    'M': 'M',
    'm': 'm',
    'A': 'A',
    'd': 'd',
  };
  return `${qualityMap[quality] || quality}${degree}`;
};

// コードクオリティからコード表記のサフィックスを取得
const QUALITY_TO_SUFFIX: Record<ChordQuality, string> = {
  'maj': '',
  'min': 'm',
  'aug': 'aug',
  'dim': 'dim',
  '7': '7',
  'maj7': 'M7',
  'm7': 'm7',
  'mM7': 'mM7',
  'dim7': 'dim7',
  'aug7': 'aug7',
  'm7b5': 'm7b5',
  '6': '6',
  'm6': 'm6',
  '9': '9',
  'm9': 'm9',
  'maj9': 'M9',
  '11': '11',
  'm11': 'm11',
  '13': '13',
  'm13': 'm13',
  'sus2': 'sus2',
  'sus4': 'sus4',
  '7sus4': '7sus4',
  'add9': 'add9',
  'madd9': 'madd9',
};

// クリック追加用コードタイプ定義
interface ClickAddChordType {
  label: string;
  suffix: string;
  isNote: boolean;
}

// CHORD_TEMPLATESから動的にクリック追加用リストを生成
const generateClickAddChordTypes = (): ClickAddChordType[] => {
  const types: ClickAddChordType[] = [
    // 単音は特別扱い
    { label: '単音 (type:note)', suffix: '', isNote: true },
  ];

  // CHORD_TEMPLATESの各エントリを変換
  for (const [quality, intervals] of Object.entries(CHORD_TEMPLATES)) {
    const suffix = QUALITY_TO_SUFFIX[quality as ChordQuality];
    const intervalLabel = intervals.map(formatInterval).join('.');
    const displayLabel = suffix ? `${suffix} (${intervalLabel})` : `(${intervalLabel})`;
    types.push({
      label: displayLabel,
      suffix,
      isNote: false,
    });
  }

  return types;
};

const CLICK_ADD_CHORD_TYPES = generateClickAddChordTypes();

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
    <h4 className="font-semibold mb-3">{title}</h4>
    {children}
  </div>
);

const SmallLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-xs text-gray-300 mb-1">{children}</label>
);

const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
);

const parseQuickChordInput = (text: string): string[] => {
  return text
    .split(/[,\s|]+/)
    .map(s => s.trim())
    .filter(Boolean);
};

const FantasyStageManager: React.FC = () => {
  const toast = useToast();
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState<DbFantasyStage[]>([]);

  const { register, handleSubmit, reset, watch, setValue, control } = useForm<StageFormValues>({
    defaultValues,
  });
  const mode = watch('mode');

  // コード配列用の可変フィールド
  const {
    fields: allowedChordFields,
    append: appendAllowedChord,
    remove: removeAllowedChord,
    replace: replaceAllowedChords,
  } = useFieldArray({ name: 'allowed_chords', control });

  const {
    fields: progressionFields,
    append: appendProgression,
    remove: removeProgression,
    replace: replaceProgression,
  } = useFieldArray({ name: 'chord_progression', control });

  const {
    fields: timingRows,
    append: appendTiming,
    remove: removeTiming,
    replace: replaceTiming,
  } = useFieldArray({ name: 'chord_progression_data', control });

  useEffect(() => {
    fetchFantasyModeStages().then(setStages).catch(() => {});
  }, []);

  const loadStage = async (id: string) => {
    try {
      setLoading(true);
      const s = await fetchFantasyStageById(id);
      setSelectedStageId(id);
      const v: StageFormValues = {
        id: s.id,
        stage_number: s.stage_number ?? '',  // nullの場合は空文字列
        name: s.name,
        description: s.description || '',
        mode: (s.mode as any) || 'single',
        max_hp: s.max_hp,
        enemy_gauge_seconds: s.enemy_gauge_seconds,
        enemy_count: s.enemy_count,
        enemy_hp: s.enemy_hp,
        min_damage: s.min_damage,
        max_damage: s.max_damage,
        simultaneous_monster_count: s.simultaneous_monster_count || 1,
        show_guide: !!s.show_guide,
        play_root_on_correct: (s as any).play_root_on_correct ?? true,
        bpm: (s as any).bpm || 120,
        measure_count: (s as any).measure_count || 8,
        time_signature: (s as any).time_signature || 4,
        count_in_measures: (s as any).count_in_measures || 0,
        bgm_url: (s as any).bgm_url || (s as any).mp3_url || '',
        mp3_url: (s as any).mp3_url || '',
        note_interval_beats: (s as any).note_interval_beats ?? null,
        allowed_chords: Array.isArray(s.allowed_chords) ? s.allowed_chords : [],
        chord_progression: (Array.isArray(s.chord_progression) ? s.chord_progression : []) as any[],
        chord_progression_data: (s as any).chord_progression_data || [],
        stage_tier: (s as any).stage_tier || 'basic',
        is_sheet_music_mode: !!(s as any).is_sheet_music_mode,
      };
      reset(v);
    } catch (e: any) {
      toast.error(e?.message || 'ステージ読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const toPayload = (v: StageFormValues): UpsertFantasyStagePayload => {
    const base: UpsertFantasyStagePayload = {
      id: v.id,
      stage_number: v.stage_number,
      name: v.name,
      description: v.description,
      mode: v.mode,
      max_hp: v.max_hp,
      enemy_gauge_seconds: v.enemy_gauge_seconds,
      enemy_count: v.enemy_count,
      enemy_hp: v.enemy_hp,
      min_damage: v.min_damage,
      max_damage: v.max_damage,
      simultaneous_monster_count: v.simultaneous_monster_count,
      show_guide: v.show_guide,
      play_root_on_correct: v.play_root_on_correct,
      bpm: v.bpm,
      measure_count: v.measure_count,
      time_signature: v.time_signature,
      count_in_measures: v.count_in_measures,
      bgm_url: v.bgm_url || null,
      mp3_url: v.mp3_url || null,
      allowed_chords: v.allowed_chords,
      chord_progression: v.chord_progression,
      chord_progression_data: v.chord_progression_data,
      note_interval_beats: v.note_interval_beats ?? null,
      stage_tier: v.stage_tier,
      usage_type: 'fantasy',  // ファンタジーモード専用
      is_sheet_music_mode: v.is_sheet_music_mode,
    };

    // モードに応じた不要フィールドの削除
    if (v.mode === 'single') {
      delete base.chord_progression;
      delete base.chord_progression_data;
      delete base.note_interval_beats;
      delete base.measure_count;
      delete base.time_signature;
      delete base.count_in_measures;
      delete base.bpm; // single ではテンポ不要
    }
    if (v.mode === 'progression_order') {
      delete base.chord_progression_data;
    }
    if (v.mode === 'progression_random') {
      delete base.chord_progression; // プールは allowed_chords を使用
      delete base.chord_progression_data;
    }
    if (v.mode === 'progression_timing') {
      delete base.note_interval_beats;
    }
    return base;
  };

  const onSubmit = async (v: StageFormValues) => {
    try {
      setLoading(true);
      // 簡易バリデーション
      if (!v.stage_number.trim()) return toast.error('ステージ番号は必須です');
      if (!v.name.trim()) return toast.error('ステージ名は必須です');
      if (v.mode === 'single' && (!v.allowed_chords || v.allowed_chords.length === 0)) {
        return toast.error('singleモードでは許可コードを1つ以上追加してください');
      }
      if (v.mode === 'progression_order' && (!v.chord_progression || v.chord_progression.length === 0)) {
        return toast.error('順番モードではコード進行を1つ以上追加してください');
      }
      if ((v.mode === 'progression_order' || v.mode === 'progression_random' || v.mode === 'progression_timing')) {
        if (!v.bpm || !v.time_signature) {
          return toast.error('リズム系モードでは BPM と 拍子 は必須です');
        }
      }

      const payload = toPayload(v);
      if (v.id) {
        const updated = await updateFantasyStage(v.id, payload);
        toast.success('ステージを更新しました');
        await loadStage(updated.id);
      } else {
        const created = await createFantasyStage(payload);
        toast.success('ステージを作成しました');
        setStages(prev => [created as any, ...prev]);
        await loadStage(created.id);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || '保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStageId) return;
    if (!confirm('このステージを削除しますか？')) return;
    try {
      setLoading(true);
      await deleteFantasyStage(selectedStageId);
      toast.success('削除しました');
      setSelectedStageId(null);
      reset(defaultValues);
      const refreshed = await fetchFantasyModeStages();
      setStages(refreshed);
    } catch (e: any) {
      toast.error(e?.message || '削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const quickAddAllowed = (text: string) => {
    const items = parseQuickChordInput(text);
    if (!items.length) return;
    replaceAllowedChords([...(allowedChordFields as any[]), ...items]);
    setValue('allowed_chords', [...(allowedChordFields as any[]), ...items]);
  };

  const quickSetProgression = (text: string) => {
    const items = parseQuickChordInput(text);
    replaceProgression(items);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">ファンタジーステージ管理</h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左: ステージ選択 */}
        <div className="lg:col-span-1">
          <Section title="ステージ選択 / 新規作成">
            <div className="mb-4">
              <FantasyStageSelector
                selectedStageId={selectedStageId}
                onStageSelect={(id) => loadStage(id)}
              />
            </div>
            <button className="btn btn-sm btn-outline w-full" onClick={() => { setSelectedStageId(null); reset(defaultValues); }}>新規ステージ</button>
          </Section>
        </div>

        {/* 右: 編集フォーム */}
        <div className="lg:col-span-2">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Section title="基本情報">
              <Row>
                <div>
                  <SmallLabel>ステージ番号 *</SmallLabel>
                  <input className="input input-bordered w-full" placeholder="例: 1-1" {...register('stage_number', { required: true })} />
                </div>
                <div>
                  <SmallLabel>ステージ名 *</SmallLabel>
                  <input className="input input-bordered w-full" placeholder="例: はじまりの森" {...register('name', { required: true })} />
                </div>
                <div className="md:col-span-2">
                  <SmallLabel>説明</SmallLabel>
                  <input className="input input-bordered w-full" placeholder="説明 (任意)" {...register('description')} />
                </div>
                <div>
                  <SmallLabel>モード *</SmallLabel>
                  <select className="select select-bordered w-full" {...register('mode', { required: true })}>
                    <option value="single">single（単体）</option>
                    <option value="progression_order">progression_order（順番）</option>
                    <option value="progression_random">progression_random（ランダム）</option>
                    <option value="progression_timing">progression_timing（カスタム）</option>
                  </select>
                </div>
                <div>
                  <SmallLabel>ガイド表示</SmallLabel>
                  <input type="checkbox" className="toggle toggle-primary" {...register('show_guide')} />
                </div>
                <div>
                  <SmallLabel>正解時にルート音を鳴らす</SmallLabel>
                  <input type="checkbox" className="toggle toggle-primary" {...register('play_root_on_correct')} />
                </div>
                <div>
                  <SmallLabel>ステージ種別 *</SmallLabel>
                  <select className="select select-bordered w-full" {...register('stage_tier', { required: true })}>
                    <option value="basic">Basic</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </Row>
            </Section>

            <Section title="戦闘設定">
              <Row>
                <div>
                  <SmallLabel>プレイヤー最大HP</SmallLabel>
                  <input type="number" className="input input-bordered w-full" {...register('max_hp', { valueAsNumber: true })} />
                </div>
                <div>
                  <SmallLabel>敵行動ゲージ秒（single）</SmallLabel>
                  <input type="number" step="0.1" className="input input-bordered w-full" {...register('enemy_gauge_seconds', { valueAsNumber: true })} />
                </div>
                <div>
                  <SmallLabel>同時出現数</SmallLabel>
                  <input type="number" className="input input-bordered w-full" {...register('simultaneous_monster_count', { valueAsNumber: true })} />
                </div>
                <div>
                  <SmallLabel>敵数</SmallLabel>
                  <input type="number" className="input input-bordered w-full" {...register('enemy_count', { valueAsNumber: true })} />
                </div>
                <div>
                  <SmallLabel>敵HP</SmallLabel>
                  <input type="number" className="input input-bordered w-full" {...register('enemy_hp', { valueAsNumber: true })} />
                </div>
                <div>
                  <SmallLabel>最小ダメージ</SmallLabel>
                  <input type="number" className="input input-bordered w-full" {...register('min_damage', { valueAsNumber: true })} />
                </div>
                <div>
                  <SmallLabel>最大ダメージ</SmallLabel>
                  <input type="number" className="input input-bordered w-full" {...register('max_damage', { valueAsNumber: true })} />
                </div>
              </Row>
            </Section>

            {/* 楽譜モード設定（singleモード用） */}
            {mode === 'single' && (
              <Section title="楽譜モード設定">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <SmallLabel>楽譜モードを有効にする</SmallLabel>
                    <input type="checkbox" className="toggle toggle-primary" {...register('is_sheet_music_mode')} />
                  </div>
                  
                  {watch('is_sheet_music_mode') && (
                    <div className="mt-4 space-y-4">
                      <p className="text-xs text-gray-400">
                        出題する音名を選択してください。ト音記号とヘ音記号を混ぜて出題できます。
                      </p>
                      
                      {/* ト音記号セクション */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <SmallLabel>🎼 ト音記号（Treble）</SmallLabel>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              className="btn btn-xs"
                              onClick={() => {
                                const currentValues = watch('allowed_chords') || [];
                                const newValues = [...new Set([...currentValues, ...TREBLE_NOTES])];
                                setValue('allowed_chords', newValues);
                                replaceAllowedChords(newValues as any[]);
                              }}
                            >
                              全選択
                            </button>
                            <button
                              type="button"
                              className="btn btn-xs btn-outline"
                              onClick={() => {
                                const currentValues = watch('allowed_chords') || [];
                                const newValues = currentValues.filter((c: any) => !String(c).startsWith('treble_'));
                                setValue('allowed_chords', newValues);
                                replaceAllowedChords(newValues as any[]);
                              }}
                            >
                              解除
                            </button>
                          </div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1">
                            {TREBLE_NOTES.map((noteName) => {
                              const currentChords = watch('allowed_chords') || [];
                              const isChecked = currentChords.some(
                                (chord: any) => String(chord) === noteName
                              );
                              return (
                                <label
                                  key={noteName}
                                  className={`
                                    flex items-center justify-center p-1.5 rounded cursor-pointer text-xs
                                    border transition-all
                                    ${isChecked ? 'bg-blue-500/30 border-blue-400 text-white' : 'bg-slate-800 border-slate-600 hover:border-slate-500'}
                                  `}
                                >
                                  <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const currentValues = watch('allowed_chords') || [];
                                      if (e.target.checked) {
                                        const newValues = [...currentValues, noteName];
                                        setValue('allowed_chords', newValues);
                                        replaceAllowedChords(newValues as any[]);
                                      } else {
                                        const newValues = currentValues.filter((c: any) => String(c) !== noteName);
                                        setValue('allowed_chords', newValues);
                                        replaceAllowedChords(newValues as any[]);
                                      }
                                    }}
                                  />
                                  {getNoteDisplayLabel(noteName)}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      
                      {/* ヘ音記号セクション */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <SmallLabel>🎼 ヘ音記号（Bass）</SmallLabel>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              className="btn btn-xs"
                              onClick={() => {
                                const currentValues = watch('allowed_chords') || [];
                                const newValues = [...new Set([...currentValues, ...BASS_NOTES])];
                                setValue('allowed_chords', newValues);
                                replaceAllowedChords(newValues as any[]);
                              }}
                            >
                              全選択
                            </button>
                            <button
                              type="button"
                              className="btn btn-xs btn-outline"
                              onClick={() => {
                                const currentValues = watch('allowed_chords') || [];
                                const newValues = currentValues.filter((c: any) => !String(c).startsWith('bass_'));
                                setValue('allowed_chords', newValues);
                                replaceAllowedChords(newValues as any[]);
                              }}
                            >
                              解除
                            </button>
                          </div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1">
                            {BASS_NOTES.map((noteName) => {
                              const currentChords = watch('allowed_chords') || [];
                              const isChecked = currentChords.some(
                                (chord: any) => String(chord) === noteName
                              );
                              return (
                                <label
                                  key={noteName}
                                  className={`
                                    flex items-center justify-center p-1.5 rounded cursor-pointer text-xs
                                    border transition-all
                                    ${isChecked ? 'bg-amber-500/30 border-amber-400 text-white' : 'bg-slate-800 border-slate-600 hover:border-slate-500'}
                                  `}
                                >
                                  <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const currentValues = watch('allowed_chords') || [];
                                      if (e.target.checked) {
                                        const newValues = [...currentValues, noteName];
                                        setValue('allowed_chords', newValues);
                                        replaceAllowedChords(newValues as any[]);
                                      } else {
                                        const newValues = currentValues.filter((c: any) => String(c) !== noteName);
                                        setValue('allowed_chords', newValues);
                                        replaceAllowedChords(newValues as any[]);
                                      }
                                    }}
                                  />
                                  {getNoteDisplayLabel(noteName)}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      
                      {/* 一括操作ボタン */}
                      <div className="flex gap-2 pt-2 border-t border-slate-700">
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => {
                            setValue('allowed_chords', ALL_SHEET_MUSIC_NOTES);
                            replaceAllowedChords(ALL_SHEET_MUSIC_NOTES as any[]);
                          }}
                        >
                          すべて選択
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => {
                            setValue('allowed_chords', []);
                            replaceAllowedChords([]);
                          }}
                        >
                          すべて解除
                        </button>
                        <span className="text-xs text-gray-400 ml-auto self-center">
                          選択中: {(watch('allowed_chords') || []).length} 音
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* progression 共通（テンポ系） */}
            {(mode === 'progression_order' || mode === 'progression_random' || mode === 'progression_timing') && (
              <Section title="テンポ・譜割設定（リズム系モード）">
                <Row>
                  <div>
                    <SmallLabel>BPM *</SmallLabel>
                    <input type="number" className="input input-bordered w-full" {...register('bpm', { valueAsNumber: true })} />
                  </div>
                  <div>
                    <SmallLabel>拍子 *</SmallLabel>
                    <input type="number" className="input input-bordered w-full" {...register('time_signature', { valueAsNumber: true })} />
                  </div>
                  {(mode === 'progression_order' || mode === 'progression_random') && (
                    <div>
                      <SmallLabel>出題拍間隔（note_interval_beats）</SmallLabel>
                      <input type="number" className="input input-bordered w-full" placeholder="省略時は拍子と同じ" {...register('note_interval_beats', { valueAsNumber: true })} />
                    </div>
                  )}
                  {(mode === 'progression_order' || mode === 'progression_random') && (
                    <div>
                      <SmallLabel>小節数</SmallLabel>
                      <input type="number" className="input input-bordered w-full" {...register('measure_count', { valueAsNumber: true })} />
                    </div>
                  )}
                  <div>
                    <SmallLabel>カウントイン小節数</SmallLabel>
                    <input type="number" className="input input-bordered w-full" {...register('count_in_measures', { valueAsNumber: true })} />
                  </div>
                </Row>
              </Section>
            )}

            {/* コード入力: allowed_chords（楽譜モードでない場合のみ通常表示） */}
            {!(mode === 'single' && watch('is_sheet_music_mode')) && (
            <Section title="許可コード（single / random 用）">
              <div className="space-y-3">
                {/* クイック複数追加 */}
                <div className="flex gap-2">
                  <input id="quickAllowed" className="input input-bordered flex-1" placeholder="例: C Am F G7 | CM7 Dm7 G7"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const el = document.getElementById('quickAllowed') as HTMLInputElement;
                        quickAddAllowed(el.value);
                        el.value = '';
                      }
                    }} />
                  <button type="button" className="btn" onClick={() => {
                    const el = document.getElementById('quickAllowed') as HTMLInputElement;
                    quickAddAllowed(el.value);
                    el.value = '';
                  }}>一括追加</button>
                </div>

                {/* 1行ずつ追加（オプション: 転回形/オクターブ） */}
                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <SmallLabel>コード</SmallLabel>
                    <input id="allowedChord_one" className="input input-bordered w-40" placeholder="例: CM7" />
                  </div>
                  <div>
                    <SmallLabel>転回形</SmallLabel>
                    <input id="allowedChord_inv" type="number" className="input input-bordered w-24" placeholder="例: 0" />
                  </div>
                  <div>
                    <SmallLabel>オクターブ</SmallLabel>
                    <input id="allowedChord_oct" type="number" className="input input-bordered w-24" placeholder="例: 4" />
                  </div>
                  <button type="button" className="btn" onClick={() => {
                    const nameEl = document.getElementById('allowedChord_one') as HTMLInputElement;
                    const invEl = document.getElementById('allowedChord_inv') as HTMLInputElement;
                    const octEl = document.getElementById('allowedChord_oct') as HTMLInputElement;
                    const chord = (nameEl.value || '').trim();
                    if (!chord) return;
                    const inv = invEl.value ? Number(invEl.value) : null;
                    const oct = octEl.value ? Number(octEl.value) : null;
                    const spec = (inv != null || oct != null) ? { chord, inversion: inv, octave: oct } : chord;
                    appendAllowedChord(spec as any);
                    nameEl.value = '';
                    invEl.value = '';
                    octEl.value = '';
                  }}>1行追加</button>
                </div>

                {/* クリック追加セクション */}
                <div className="border border-slate-600 rounded-lg p-3 space-y-3">
                  <SmallLabel>クリック追加（転回形:0, オクターブ:4）</SmallLabel>
                  {CLICK_ADD_CHORD_TYPES.map((chordType) => (
                    <div key={chordType.label} className="space-y-1">
                      <div className="text-xs text-gray-400">{chordType.label}</div>
                      <div className="flex flex-wrap gap-1">
                        {CLICK_ADD_ROOTS.map((root) => {
                          const chordName = `${root}${chordType.suffix}`;
                          return (
                            <button
                              key={`${chordType.label}-${root}`}
                              type="button"
                              className="btn btn-xs btn-outline hover:btn-primary"
                              onClick={() => {
                                const spec = chordType.isNote
                                  ? { chord: chordName, inversion: 0, octave: 4, type: 'note' as const }
                                  : { chord: chordName, inversion: 0, octave: 4 };
                                appendAllowedChord(spec as any);
                              }}
                            >
                              {chordName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {allowedChordFields.map((f, idx) => (
                    <div key={(f as any).id || idx} className="badge badge-lg gap-2 bg-slate-700">
                      <span>{typeof f === 'string' ? f : (f as any).chord || JSON.stringify(f)}</span>
                      <button type="button" className="btn btn-xs" onClick={() => removeAllowedChord(idx)}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
            )}

            {/* progression_order 用コード進行 */}
            {mode === 'progression_order' && (
              <Section title="コード進行（順番）">
                <div className="space-y-3">
                  {/* クイック上書き */}
                  <div className="flex gap-2">
                    <input id="quickProg" className="input input-bordered flex-1" placeholder="例: C Am F G | Dm G7 CM7"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const el = document.getElementById('quickProg') as HTMLInputElement;
                          quickSetProgression(el.value);
                          el.value = '';
                        }
                      }} />
                    <button type="button" className="btn" onClick={() => {
                      const el = document.getElementById('quickProg') as HTMLInputElement;
                      quickSetProgression(el.value);
                      el.value = '';
                    }}>一括設定</button>
                  </div>

                  {/* 1行ずつ追加 */}
                  <div className="flex flex-wrap items-end gap-2">
                    <div>
                      <SmallLabel>コード</SmallLabel>
                      <input id="prog_one" className="input input-bordered w-40" placeholder="例: CM7" />
                    </div>
                    <div>
                      <SmallLabel>転回形</SmallLabel>
                      <input id="prog_inv" type="number" className="input input-bordered w-24" placeholder="例: 0" />
                    </div>
                    <div>
                      <SmallLabel>オクターブ</SmallLabel>
                      <input id="prog_oct" type="number" className="input input-bordered w-24" placeholder="例: 4" />
                    </div>
                    <button type="button" className="btn" onClick={() => {
                      const nameEl = document.getElementById('prog_one') as HTMLInputElement;
                      const invEl = document.getElementById('prog_inv') as HTMLInputElement;
                      const octEl = document.getElementById('prog_oct') as HTMLInputElement;
                      const chord = (nameEl.value || '').trim();
                      if (!chord) return;
                      const inv = invEl.value ? Number(invEl.value) : null;
                      const oct = octEl.value ? Number(octEl.value) : null;
                      const spec = (inv != null || oct != null) ? { chord, inversion: inv, octave: oct } : chord;
                      appendProgression(spec as any);
                      nameEl.value = '';
                      invEl.value = '';
                      octEl.value = '';
                    }}>1行追加</button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {progressionFields.map((f, idx) => (
                      <div key={(f as any).id || idx} className="badge badge-lg gap-2 bg-slate-700">
                        <span>{typeof f === 'string' ? f : (f as any).chord || JSON.stringify(f)}</span>
                        <button type="button" className="btn btn-xs" onClick={() => removeProgression(idx)}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>
            )}

            {/* progression_timing 用 */}
            {mode === 'progression_timing' && (
              <Section title="カスタム配置（小節・拍）">
                <div className="space-y-2">
                  {/* MusicXML アップロード→JSON 変換 */}
                  <div className="flex items-center gap-2">
                    <input
                      id="musicxmlFileInput"
                      type="file"
                      accept=".xml,.musicxml,application/xml,text/xml"
                      className="file-input file-input-bordered file-input-sm"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          const text = await f.text();
                          const mod = await import('@/utils/musicXmlToProgression');
                          const items = mod.convertMusicXmlToProgressionData(text);
                          replaceTiming(items as any);
                          setValue('chord_progression_data', items as any);
                          toast.success('MusicXML から progression を読み込みました');
                        } catch (err: any) {
                          console.error(err);
                          toast.error('MusicXML の読み込みに失敗しました');
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => {
                        const el = document.getElementById('musicxmlFileInput') as HTMLInputElement | null;
                        el?.click();
                      }}
                    >MusicXML から読み込み</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                      <thead>
                        <tr>
                          <th>小節</th>
                          <th>拍</th>
                          <th>コード</th>
                          <th>転回形</th>
                          <th>オクターブ</th>
                          <th>text</th>
                          <th>type</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {timingRows.map((row, idx) => (
                          <tr key={row.id}>
                            <td>
                              <input type="number" className="input input-bordered w-24" {...register(`chord_progression_data.${idx}.bar` as const, { valueAsNumber: true })} />
                            </td>
                            <td>
                              <input type="number" step="0.25" className="input input-bordered w-24" {...register(`chord_progression_data.${idx}.beats` as const, { valueAsNumber: true })} />
                            </td>
                            <td>
                              <input className="input input-bordered w-40" placeholder="例: CM7, F#m7" {...register(`chord_progression_data.${idx}.chord` as const)} />
                            </td>
                            <td>
                              <input type="number" className="input input-bordered w-24" placeholder="例: 0" {...register(`chord_progression_data.${idx}.inversion` as const, { valueAsNumber: true })} />
                            </td>
                            <td>
                              <input type="number" className="input input-bordered w-24" placeholder="例: 3" {...register(`chord_progression_data.${idx}.octave` as const, { valueAsNumber: true })} />
                            </td>
                            <td>
                              <input className="input input-bordered w-40" placeholder="Harmony/N.C.等の表示用テキスト" {...register(`chord_progression_data.${idx}.text` as const)} />
                            </td>
                            <td>
                              <select className="select select-bordered select-sm" {...register(`chord_progression_data.${idx}.type` as const)}>
                                <option value="">code</option>
                                <option value="note">note</option>
                              </select>
                            </td>
                            <td>
                              <button type="button" className="btn btn-xs btn-error" onClick={() => removeTiming(idx)}>削除</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button type="button" className="btn btn-sm" onClick={() => appendTiming({ bar: 1, beats: 1, chord: 'C', inversion: 0, octave: 4 })}>行を追加</button>
                </div>
              </Section>
            )}

            <Section title="BGM / メディア">
              <Row>
                <div>
                  <SmallLabel>BGM URL</SmallLabel>
                  <input className="input input-bordered w-full" placeholder="FantasyBGMで取得したURLを貼り付け" {...register('bgm_url')} />
                </div>
                <div>
                  <SmallLabel>MP3 URL（予備）</SmallLabel>
                  <input className="input input-bordered w-full" {...register('mp3_url')} />
                </div>
              </Row>
            </Section>

            <div className="flex items-center gap-3">
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? '保存中...' : '保存'}</button>
              {selectedStageId && (
                <button type="button" className="btn btn-error" onClick={handleDelete} disabled={loading}>削除</button>
              )}
            </div>

            {/* デバッグ: JSONプレビュー */}
            <details className="mt-2">
              <summary className="cursor-pointer">保存プレビュー</summary>
              <pre className="text-xs whitespace-pre-wrap break-all bg-slate-900 p-2 rounded">
                {JSON.stringify(toPayload(watch() as any), null, 2)}
              </pre>
            </details>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FantasyStageManager;