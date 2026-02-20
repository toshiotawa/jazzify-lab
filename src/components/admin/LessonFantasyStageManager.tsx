import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useToast } from '@/stores/toastStore';
import {
  FantasyStage as DbFantasyStage,
} from '@/types';
import {
  fetchLessonOnlyFantasyStages,
  fetchFantasyStageById,
  createFantasyStage,
  updateFantasyStage,
  deleteFantasyStage,
  UpsertFantasyStagePayload,
} from '@/platform/supabaseFantasyStages';
import { fetchFantasyBgmAssets, FantasyBgmAsset } from '@/platform/supabaseFantasyBgm';
import { convertMusicXmlToProgressionData } from '@/utils/musicXmlToProgression';

// モード型
type AdminStageMode = 'single' | 'progression_order' | 'progression_random' | 'progression_timing' | 'timing_combining';

// progression_timing 用の行
interface TimingRow {
  bar: number;
  beats: number;
  chord: string;
  inversion?: number | null;
  octave?: number | null;
  text?: string;
  type?: 'note';
}

// フォーム全体
interface StageFormValues {
  id?: string;
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
  note_interval_beats?: number | null;
  // コード入力
  allowed_chords: any[];
  chord_progression: any[];
  chord_progression_data: TimingRow[];
  // MusicXML（OSMD楽譜表示用）
  music_xml?: string | null;
  // アウフタクト
  is_auftakt: boolean;
}

const defaultValues: StageFormValues = {
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
  music_xml: null,
  bgm_url: '',
  mp3_url: '',
  is_auftakt: false,
};

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

const LessonFantasyStageManager: React.FC = () => {
  const toast = useToast();
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState<DbFantasyStage[]>([]);
  const [bgmAssets, setBgmAssets] = useState<FantasyBgmAsset[]>([]);

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
    fetchLessonOnlyFantasyStages().then(setStages).catch(() => {});
    fetchFantasyBgmAssets().then(setBgmAssets).catch(() => {});
  }, []);

  // BGMを選択した際にテンポ情報を自動入力
  const handleBgmSelect = useCallback((bgmUrl: string) => {
    setValue('bgm_url', bgmUrl);
    // URLに一致するBGMアセットを探す
    const matchedBgm = bgmAssets.find(b => b.mp3_url === bgmUrl);
    if (matchedBgm) {
      // テンポ情報がある場合は自動入力
      if (matchedBgm.bpm) setValue('bpm', matchedBgm.bpm);
      if (matchedBgm.time_signature) setValue('time_signature', matchedBgm.time_signature);
      if (matchedBgm.measure_count) setValue('measure_count', matchedBgm.measure_count);
      if (matchedBgm.count_in_measures) setValue('count_in_measures', matchedBgm.count_in_measures);
      toast.success('BGMのテンポ情報を自動入力しました');
    }
  }, [bgmAssets, setValue, toast]);

  const loadStage = async (id: string) => {
    try {
      setLoading(true);
      const s = await fetchFantasyStageById(id);
      setSelectedStageId(id);
      const v: StageFormValues = {
        id: s.id,
        name: s.name,
        description: s.description || '',
        mode: (s.mode as AdminStageMode) || 'single',
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
        music_xml: (s as any).music_xml || null,
        is_auftakt: !!(s as any).is_auftakt,
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
      stage_number: null,  // レッスン専用ステージはステージ番号なし
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
      stage_tier: 'basic',  // レッスン専用は常にbasic
      usage_type: 'lesson',  // レッスン専用
      music_xml: v.music_xml || null,
      is_auftakt: v.is_auftakt,
    };

    // モードに応じた不要フィールドの削除
    if (v.mode === 'single') {
      delete base.chord_progression;
      delete base.chord_progression_data;
      delete base.note_interval_beats;
      // singleモードでもBGMを使用する場合はテンポ設定を保持する
      // bpm, measure_count, time_signature, count_in_measures は保持
    }
    if (v.mode === 'progression_order') {
      delete base.chord_progression_data;
    }
    if (v.mode === 'progression_random') {
      delete base.chord_progression;
      delete base.chord_progression_data;
    }
    if (v.mode === 'progression_timing' || v.mode === 'timing_combining') {
      delete base.note_interval_beats;
    }
    return base;
  };

  const onSubmit = async (v: StageFormValues) => {
    try {
      setLoading(true);
      // 簡易バリデーション
      if (!v.name.trim()) return toast.error('ステージ名は必須です');
      if (v.mode === 'single' && (!v.allowed_chords || v.allowed_chords.length === 0)) {
        return toast.error('singleモードでは許可コードを1つ以上追加してください');
      }
      if (v.mode === 'progression_order' && (!v.chord_progression || v.chord_progression.length === 0)) {
        return toast.error('順番モードではコード進行を1つ以上追加してください');
      }
      if ((v.mode === 'progression_order' || v.mode === 'progression_random' || v.mode === 'progression_timing' || v.mode === 'timing_combining')) {
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
      // リスト更新
      const refreshed = await fetchLessonOnlyFantasyStages();
      setStages(refreshed);
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
      const refreshed = await fetchLessonOnlyFantasyStages();
      setStages(refreshed);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '削除に失敗しました';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 複製機能
  const handleDuplicate = async () => {
    if (!selectedStageId) return;
    
    try {
      setLoading(true);
      const currentValues = watch();
      
      // IDを除外して複製用のデータを作成
      const duplicatePayload: UpsertFantasyStagePayload = {
        // IDは除外（新規作成として扱う）
        stage_number: null,  // レッスン専用ステージはステージ番号なし
        name: `${currentValues.name}（複製）`,
        description: currentValues.description,
        mode: currentValues.mode,
        max_hp: currentValues.max_hp,
        enemy_gauge_seconds: currentValues.enemy_gauge_seconds,
        enemy_count: currentValues.enemy_count,
        enemy_hp: currentValues.enemy_hp,
        min_damage: currentValues.min_damage,
        max_damage: currentValues.max_damage,
        simultaneous_monster_count: currentValues.simultaneous_monster_count,
        show_guide: currentValues.show_guide,
        play_root_on_correct: currentValues.play_root_on_correct,
        bpm: currentValues.bpm,
        measure_count: currentValues.measure_count,
        time_signature: currentValues.time_signature,
        count_in_measures: currentValues.count_in_measures,
        bgm_url: currentValues.bgm_url || null,
        mp3_url: currentValues.mp3_url || null,
        allowed_chords: currentValues.allowed_chords,
        chord_progression: currentValues.chord_progression,
        chord_progression_data: currentValues.chord_progression_data,
        note_interval_beats: currentValues.note_interval_beats ?? null,
        stage_tier: 'basic',  // レッスン専用は常にbasic
        usage_type: 'lesson',  // レッスン専用
        music_xml: currentValues.music_xml || null,
        is_auftakt: currentValues.is_auftakt,
      };
      
      // 新規ステージとして作成
      const created = await createFantasyStage(duplicatePayload);
      
      toast.success('課題を複製しました');
      
      // ステージリストを更新して複製したステージを選択
      const refreshed = await fetchLessonOnlyFantasyStages();
      setStages(refreshed);
      await loadStage(created.id);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '複製に失敗しました';
      toast.error(errorMessage);
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

  // ステージセレクター用のリスト
  const stageOptions = useMemo(() => {
    return stages.map(s => ({
      id: s.id,
      label: s.name,
    }));
  }, [stages]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-bold">レッスン用ファンタジー課題</h3>
        <span className="badge badge-info">レッスンモード専用</span>
      </div>
      <p className="text-sm text-gray-400">
        レッスンモードでのみ使用するファンタジータイプの課題を作成・管理できます。
        ステージ番号は自動的に空になり、ファンタジーモードのステージ選択画面には表示されません。
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左: ステージ選択 */}
        <div className="lg:col-span-1">
          <Section title="課題選択 / 新規作成">
            <div className="mb-4">
              <select
                className="select select-bordered w-full"
                value={selectedStageId || ''}
                onChange={(e) => {
                  const id = e.target.value;
                  if (id) {
                    loadStage(id);
                  } else {
                    setSelectedStageId(null);
                    reset(defaultValues);
                  }
                }}
              >
                <option value="">-- 課題を選択 --</option>
                {stageOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
            <button 
              className="btn btn-sm btn-outline w-full" 
              onClick={() => { setSelectedStageId(null); reset(defaultValues); }}
            >
              新規課題を作成
            </button>
            
            {stages.length === 0 && (
              <p className="text-xs text-gray-500 mt-3">
                まだレッスン専用の課題がありません。「新規課題を作成」から追加してください。
              </p>
            )}
          </Section>
        </div>

        {/* 右: 編集フォーム */}
        <div className="lg:col-span-2">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Section title="基本情報">
              <Row>
                <div className="md:col-span-2">
                  <SmallLabel>課題名 *</SmallLabel>
                  <input className="input input-bordered w-full" placeholder="例: Cメジャーコード練習" {...register('name', { required: true })} />
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

            {/* BGMテンポ設定（全モード共通） */}
            <Section title="BGM・テンポ設定">
              <p className="text-xs text-gray-400 mb-3">
                BGMを使用する場合、テンポ情報を設定してください。BGMアセットにテンポが登録されている場合は自動取得できます。
              </p>
              <Row>
                <div>
                  <SmallLabel>BPM {mode !== 'single' && '*'}</SmallLabel>
                  <input type="number" className="input input-bordered w-full" {...register('bpm', { valueAsNumber: true })} />
                </div>
                <div>
                  <SmallLabel>拍子 {mode !== 'single' && '*'}</SmallLabel>
                  <input type="number" className="input input-bordered w-full" {...register('time_signature', { valueAsNumber: true })} />
                </div>
                <div>
                  <SmallLabel>小節数（曲の長さ）</SmallLabel>
                  <input type="number" className="input input-bordered w-full" {...register('measure_count', { valueAsNumber: true })} />
                </div>
                <div>
                  <SmallLabel>カウントイン小節数</SmallLabel>
                  <input type="number" className="input input-bordered w-full" {...register('count_in_measures', { valueAsNumber: true })} />
                </div>
                <div>
                  <SmallLabel>アウフタクト（弱起）</SmallLabel>
                  <input type="checkbox" className="toggle toggle-primary" {...register('is_auftakt')} />
                  <p className="text-xs text-gray-400 mt-1">ONにするとカウントイン中にもノーツを配置</p>
                </div>
                {(mode === 'progression_order' || mode === 'progression_random') && (
                  <div>
                    <SmallLabel>出題拍間隔（note_interval_beats）</SmallLabel>
                    <input type="number" className="input input-bordered w-full" placeholder="省略時は拍子と同じ" {...register('note_interval_beats', { valueAsNumber: true })} />
                  </div>
                )}
              </Row>
            </Section>

            {/* コード入力: allowed_chords */}
            <Section title="許可コード（single / random 用）">
              <div className="space-y-3">
                {/* クイック複数追加 */}
                <div className="flex gap-2">
                  <input id="quickAllowedLesson" className="input input-bordered flex-1" placeholder="例: C Am F G7 | CM7 Dm7 G7"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const el = document.getElementById('quickAllowedLesson') as HTMLInputElement;
                        quickAddAllowed(el.value);
                        el.value = '';
                      }
                    }} />
                  <button type="button" className="btn" onClick={() => {
                    const el = document.getElementById('quickAllowedLesson') as HTMLInputElement;
                    quickAddAllowed(el.value);
                    el.value = '';
                  }}>一括追加</button>
                </div>

                {/* 1行ずつ追加（オプション: 転回形/オクターブ） */}
                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <SmallLabel>コード</SmallLabel>
                    <input id="allowedChord_one_lesson" className="input input-bordered w-40" placeholder="例: CM7" />
                  </div>
                  <div>
                    <SmallLabel>転回形</SmallLabel>
                    <input id="allowedChord_inv_lesson" type="number" className="input input-bordered w-24" placeholder="例: 0" />
                  </div>
                  <div>
                    <SmallLabel>オクターブ</SmallLabel>
                    <input id="allowedChord_oct_lesson" type="number" className="input input-bordered w-24" placeholder="例: 4" />
                  </div>
                  <button type="button" className="btn" onClick={() => {
                    const nameEl = document.getElementById('allowedChord_one_lesson') as HTMLInputElement;
                    const invEl = document.getElementById('allowedChord_inv_lesson') as HTMLInputElement;
                    const octEl = document.getElementById('allowedChord_oct_lesson') as HTMLInputElement;
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

            {/* progression_order 用コード進行 */}
            {mode === 'progression_order' && (
              <Section title="コード進行（順番）">
                <div className="space-y-3">
                  {/* クイック上書き */}
                  <div className="flex gap-2">
                    <input id="quickProgLesson" className="input input-bordered flex-1" placeholder="例: C Am F G | Dm G7 CM7"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const el = document.getElementById('quickProgLesson') as HTMLInputElement;
                          quickSetProgression(el.value);
                          el.value = '';
                        }
                      }} />
                    <button type="button" className="btn" onClick={() => {
                      const el = document.getElementById('quickProgLesson') as HTMLInputElement;
                      quickSetProgression(el.value);
                      el.value = '';
                    }}>一括設定</button>
                  </div>

                  {/* 1行ずつ追加 */}
                  <div className="flex flex-wrap items-end gap-2">
                    <div>
                      <SmallLabel>コード</SmallLabel>
                      <input id="prog_one_lesson" className="input input-bordered w-40" placeholder="例: CM7" />
                    </div>
                    <div>
                      <SmallLabel>転回形</SmallLabel>
                      <input id="prog_inv_lesson" type="number" className="input input-bordered w-24" placeholder="例: 0" />
                    </div>
                    <div>
                      <SmallLabel>オクターブ</SmallLabel>
                      <input id="prog_oct_lesson" type="number" className="input input-bordered w-24" placeholder="例: 4" />
                    </div>
                    <button type="button" className="btn" onClick={() => {
                      const nameEl = document.getElementById('prog_one_lesson') as HTMLInputElement;
                      const invEl = document.getElementById('prog_inv_lesson') as HTMLInputElement;
                      const octEl = document.getElementById('prog_oct_lesson') as HTMLInputElement;
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
                      id="musicxmlFileInputLesson"
                      type="file"
                      accept=".xml,.musicxml,application/xml,text/xml"
                      className="file-input file-input-bordered file-input-sm"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          const text = await f.text();
                          // 同タイミングのノーツをまとめて1つのノーツとして扱う
                          const items = convertMusicXmlToProgressionData(text, { groupSimultaneousNotes: true });
                          replaceTiming(items as any);
                          setValue('chord_progression_data', items as any);
                          // 元のMusicXMLも保存（OSMD楽譜表示用）
                          setValue('music_xml', text);
                          toast.success('MusicXML から progression を読み込みました（同時ノーツをグループ化）');
                        } catch (err: unknown) {
                          const errorMessage = err instanceof Error ? err.message : 'MusicXML の読み込みに失敗しました';
                          toast.error(errorMessage);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => {
                        const el = document.getElementById('musicxmlFileInputLesson') as HTMLInputElement | null;
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
              <div className="space-y-4">
                {/* BGMアセットから選択 */}
                <div>
                  <SmallLabel>BGMアセットから選択（テンポ情報自動入力）</SmallLabel>
                  <select
                    className="select select-bordered w-full"
                    value={watch('bgm_url') || ''}
                    onChange={(e) => handleBgmSelect(e.target.value)}
                  >
                    <option value="">-- 選択してください --</option>
                    {bgmAssets.map(bgm => (
                      <option key={bgm.id} value={bgm.mp3_url || ''}>
                        {bgm.name}
                        {bgm.bpm && ` (BPM: ${bgm.bpm})`}
                        {bgm.time_signature && ` (${bgm.time_signature}/4)`}
                        {bgm.measure_count && ` (${bgm.measure_count}小節)`}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    BGMを選択すると、テンポ設定が自動入力されます
                  </p>
                </div>
                <Row>
                  <div>
                    <SmallLabel>BGM URL（直接入力）</SmallLabel>
                    <input className="input input-bordered w-full" placeholder="FantasyBGMで取得したURLを貼り付け" {...register('bgm_url')} />
                  </div>
                  <div>
                    <SmallLabel>MP3 URL（予備）</SmallLabel>
                    <input className="input input-bordered w-full" {...register('mp3_url')} />
                  </div>
                </Row>
              </div>
            </Section>

            <div className="flex items-center gap-3">
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? '保存中...' : '保存'}</button>
              {selectedStageId && (
                <>
                  <button type="button" className="btn btn-secondary" onClick={handleDuplicate} disabled={loading}>複製</button>
                  <button type="button" className="btn btn-error" onClick={handleDelete} disabled={loading}>削除</button>
                </>
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

export default LessonFantasyStageManager;
