/**
 * サバイバルモード管理画面
 * 難易度別のコード設定を管理
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/stores/toastStore';
import {
  SurvivalDifficulty,
  SurvivalDifficultySettings,
  fetchSurvivalDifficultySettings,
  updateSurvivalDifficultySettings,
} from '@/platform/supabaseSurvival';
import { CHORD_TEMPLATES, ChordQuality } from '@/utils/chord-templates';

// コードクオリティからサフィックスを取得
const QUALITY_TO_SUFFIX: Record<ChordQuality, string> = {
  'single': '_note',
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
  'maj7_9': 'M7(9)',
  'm7_9': 'm7(9)',
  '7_9_6th': '7(9.6th)',
  '7_b9_b6th': '7(b9.b6th)',
  '6_9': '6(9)',
  'm6_9': 'm6(9)',
  '7_b9_6th': '7(b9.6th)',
  '7_s9_b6th': '7(#9.b6th)',
  'm7b5_11': 'm7(b5)(11)',
  'dimM7': 'dim(M7)',
};

// ルート音リスト
const ROOTS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'] as const;

// 難易度の色設定
const DIFFICULTY_COLORS: Record<SurvivalDifficulty, { bg: string; border: string }> = {
  veryeasy: { bg: 'bg-emerald-900/30', border: 'border-emerald-500' },
  easy: { bg: 'bg-green-900/30', border: 'border-green-600' },
  normal: { bg: 'bg-blue-900/30', border: 'border-blue-600' },
  hard: { bg: 'bg-orange-900/30', border: 'border-orange-600' },
  extreme: { bg: 'bg-red-900/30', border: 'border-red-600' },
};

// インターバルをフォーマット
const formatInterval = (interval: string): string => {
  if (interval === '1P') return 'R';
  const degree = interval.slice(0, -1);
  const quality = interval.slice(-1);
  const qualityMap: Record<string, string> = { 'P': 'P', 'M': 'M', 'm': 'm', 'A': 'A', 'd': 'd' };
  return `${qualityMap[quality] || quality}${degree}`;
};

// コードタイプを生成
interface ChordType {
  label: string;
  suffix: string;
  quality: ChordQuality;
}

const generateChordTypes = (): ChordType[] => {
  const types: ChordType[] = [];
  for (const [quality, intervals] of Object.entries(CHORD_TEMPLATES)) {
    const suffix = QUALITY_TO_SUFFIX[quality as ChordQuality];
    const intervalLabel = intervals.map(formatInterval).join('.');
    const displayLabel = suffix ? `${suffix} (${intervalLabel})` : `(${intervalLabel})`;
    types.push({
      label: displayLabel,
      suffix,
      quality: quality as ChordQuality,
    });
  }
  return types;
};

const CHORD_TYPES = generateChordTypes();

const SmallLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-xs text-gray-300 mb-1">{children}</label>
);

const SurvivalStageManager: React.FC = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SurvivalDifficultySettings[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<SurvivalDifficulty>('easy');
  
  // 現在選択中の難易度設定
  const currentSettings = settings.find(s => s.difficulty === selectedDifficulty);
  
  // 設定を読み込み（初回のみ）
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchSurvivalDifficultySettings();
        if (isMounted) {
          setSettings(data);
        }
      } catch (e) {
        if (isMounted) {
          const errorMessage = e instanceof Error ? e.message : '設定の読み込みに失敗しました';
          toast.error(errorMessage);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  // コードをトグル
  const toggleChord = useCallback((chordName: string) => {
    if (!currentSettings) return;
    
    setSettings(prev => prev.map(s => {
      if (s.difficulty !== selectedDifficulty) return s;
      
      const allowedChords = [...s.allowedChords];
      const index = allowedChords.indexOf(chordName);
      
      if (index >= 0) {
        allowedChords.splice(index, 1);
      } else {
        allowedChords.push(chordName);
      }
      
      return { ...s, allowedChords };
    }));
  }, [currentSettings, selectedDifficulty]);
  
  // コードタイプ全体をトグル
  const toggleChordType = useCallback((suffix: string, enable: boolean) => {
    if (!currentSettings) return;
    
    const chordsOfType = ROOTS.map(root => `${root}${suffix}`);
    
    setSettings(prev => prev.map(s => {
      if (s.difficulty !== selectedDifficulty) return s;
      
      let allowedChords = [...s.allowedChords];
      
      if (enable) {
        // 追加
        chordsOfType.forEach(chord => {
          if (!allowedChords.includes(chord)) {
            allowedChords.push(chord);
          }
        });
      } else {
        // 削除
        allowedChords = allowedChords.filter(c => !chordsOfType.includes(c));
      }
      
      return { ...s, allowedChords };
    }));
  }, [currentSettings, selectedDifficulty]);
  
  // 設定を保存
  const saveSettings = useCallback(async () => {
    if (!currentSettings) return;
    
    try {
      setSaving(true);
      await updateSurvivalDifficultySettings(selectedDifficulty, {
        allowedChords: currentSettings.allowedChords,
        displayName: currentSettings.displayName,
        description: currentSettings.description,
        enemySpawnRate: currentSettings.enemySpawnRate,
        enemySpawnCount: currentSettings.enemySpawnCount,
        enemyStatMultiplier: currentSettings.enemyStatMultiplier,
        expMultiplier: currentSettings.expMultiplier,
        itemDropRate: currentSettings.itemDropRate,
        bgmOddWaveUrl: currentSettings.bgmOddWaveUrl,
        bgmEvenWaveUrl: currentSettings.bgmEvenWaveUrl,
      });
      toast.success('設定を保存しました');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '保存に失敗しました';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  }, [currentSettings, selectedDifficulty, toast]);
  
  // 数値フィールドを更新
  const updateNumericField = useCallback((
    field: keyof Pick<SurvivalDifficultySettings, 'enemySpawnRate' | 'enemySpawnCount' | 'enemyStatMultiplier' | 'expMultiplier' | 'itemDropRate'>,
    value: number
  ) => {
    setSettings(prev => prev.map(s => {
      if (s.difficulty !== selectedDifficulty) return s;
      return { ...s, [field]: value };
    }));
  }, [selectedDifficulty]);
  
  // BGMフィールドを更新
  const updateBgmField = useCallback((
    field: 'bgmOddWaveUrl' | 'bgmEvenWaveUrl',
    value: string
  ) => {
    setSettings(prev => prev.map(s => {
      if (s.difficulty !== selectedDifficulty) return s;
      return { ...s, [field]: value || null };
    }));
  }, [selectedDifficulty]);
  
  if (loading) {
    return <div className="text-center text-gray-400 py-8">読み込み中...</div>;
  }
  
  const colors = DIFFICULTY_COLORS[selectedDifficulty];
  
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">サバイバルモード管理</h3>
      
      {/* 難易度選択タブ */}
      <div className="flex flex-wrap gap-2">
        {(['veryeasy', 'easy', 'normal', 'hard', 'extreme'] as const).map(diff => (
          <button
            key={diff}
            onClick={() => setSelectedDifficulty(diff)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedDifficulty === diff
                ? `${DIFFICULTY_COLORS[diff].bg} ${DIFFICULTY_COLORS[diff].border} border-2 text-white`
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            {diff === 'veryeasy' ? 'Very Easy' : diff.charAt(0).toUpperCase() + diff.slice(1)}
          </button>
        ))}
      </div>
      
      {currentSettings && (
        <div className={`rounded-xl p-6 ${colors.bg} border ${colors.border}`}>
          {/* 基本設定 */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-white mb-4">基本設定</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <SmallLabel>敵出現間隔（秒）</SmallLabel>
                <input
                  type="number"
                  step="0.5"
                  className="input input-bordered w-full bg-slate-700"
                  value={currentSettings.enemySpawnRate}
                  onChange={(e) => updateNumericField('enemySpawnRate', Number(e.target.value))}
                />
              </div>
              <div>
                <SmallLabel>1回の出現数</SmallLabel>
                <input
                  type="number"
                  className="input input-bordered w-full bg-slate-700"
                  value={currentSettings.enemySpawnCount}
                  onChange={(e) => updateNumericField('enemySpawnCount', Number(e.target.value))}
                />
              </div>
              <div>
                <SmallLabel>敵ステータス倍率</SmallLabel>
                <input
                  type="number"
                  step="0.1"
                  className="input input-bordered w-full bg-slate-700"
                  value={currentSettings.enemyStatMultiplier}
                  onChange={(e) => updateNumericField('enemyStatMultiplier', Number(e.target.value))}
                />
              </div>
              <div>
                <SmallLabel>経験値倍率</SmallLabel>
                <input
                  type="number"
                  step="0.5"
                  className="input input-bordered w-full bg-slate-700"
                  value={currentSettings.expMultiplier}
                  onChange={(e) => updateNumericField('expMultiplier', Number(e.target.value))}
                />
              </div>
              <div>
                <SmallLabel>アイテムドロップ率</SmallLabel>
                <input
                  type="number"
                  step="0.01"
                  className="input input-bordered w-full bg-slate-700"
                  value={currentSettings.itemDropRate}
                  onChange={(e) => updateNumericField('itemDropRate', Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          
          {/* BGM設定 */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-white mb-4">🎵 BGM設定（WAVE別）</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <SmallLabel>奇数WAVE BGM URL（WAVE 1, 3, 5...）</SmallLabel>
                <input
                  type="url"
                  placeholder="https://example.com/bgm-odd.mp3"
                  className="input input-bordered w-full bg-slate-700"
                  value={currentSettings.bgmOddWaveUrl || ''}
                  onChange={(e) => updateBgmField('bgmOddWaveUrl', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">MP3/OGG形式のURLを入力（ループ再生）</p>
              </div>
              <div>
                <SmallLabel>偶数WAVE BGM URL（WAVE 2, 4, 6...）</SmallLabel>
                <input
                  type="url"
                  placeholder="https://example.com/bgm-even.mp3"
                  className="input input-bordered w-full bg-slate-700"
                  value={currentSettings.bgmEvenWaveUrl || ''}
                  onChange={(e) => updateBgmField('bgmEvenWaveUrl', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">MP3/OGG形式のURLを入力（ループ再生）</p>
              </div>
            </div>
          </div>
          
          {/* 許可コード設定 */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">
              許可コード設定
              <span className="ml-2 text-sm font-normal text-gray-400">
                （選択中: {currentSettings.allowedChords.length}コード）
              </span>
            </h4>
            
            <div className="space-y-4">
              {CHORD_TYPES.map((chordType) => {
                const chordsOfType = ROOTS.map(root => `${root}${chordType.suffix}`);
                const selectedCount = chordsOfType.filter(c => currentSettings.allowedChords.includes(c)).length;
                const allSelected = selectedCount === chordsOfType.length;
                const someSelected = selectedCount > 0 && !allSelected;
                
                return (
                  <div key={chordType.quality} className="bg-slate-800/50 rounded-lg p-3">
                    {/* コードタイプヘッダー */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-300">{chordType.label}</span>
                        <span className="text-xs text-gray-500">({selectedCount}/{chordsOfType.length})</span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className={`btn btn-xs ${allSelected ? 'btn-success' : 'btn-outline'}`}
                          onClick={() => toggleChordType(chordType.suffix, true)}
                        >
                          全選択
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline"
                          onClick={() => toggleChordType(chordType.suffix, false)}
                        >
                          全解除
                        </button>
                      </div>
                    </div>
                    
                    {/* コードボタングリッド */}
                    <div className="grid grid-cols-6 md:grid-cols-9 lg:grid-cols-17 gap-1">
                      {ROOTS.map((root) => {
                        const chordName = `${root}${chordType.suffix}`;
                        const isSelected = currentSettings.allowedChords.includes(chordName);
                        
                        return (
                          <button
                            key={chordName}
                            type="button"
                            onClick={() => toggleChord(chordName)}
                            className={`
                              px-2 py-1.5 rounded text-xs font-medium transition-all
                              ${isSelected
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'bg-slate-700 text-gray-400 hover:bg-slate-600 hover:text-gray-200'
                              }
                            `}
                          >
                            {chordName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* 選択済みコード一覧 */}
          <div className="mt-6 p-4 bg-slate-900/50 rounded-lg">
            <SmallLabel>選択済みコード</SmallLabel>
            <div className="flex flex-wrap gap-2 mt-2">
              {currentSettings.allowedChords.length > 0 ? (
                currentSettings.allowedChords.map(chord => (
                  <span
                    key={chord}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600/30 text-blue-300 rounded text-xs"
                  >
                    {chord}
                    <button
                      type="button"
                      onClick={() => toggleChord(chord)}
                      className="hover:text-red-400"
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-gray-500 text-sm">コードが選択されていません</span>
              )}
            </div>
          </div>
          
          {/* 保存ボタン */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={saveSettings}
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? '保存中...' : '設定を保存'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurvivalStageManager;
