import React, { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { RhythmPattern, RhythmCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { basicPatterns } from '@/data/rhythmPatterns/basic';
import { jazzPatterns } from '@/data/rhythmPatterns/jazz';
import { latinPatterns } from '@/data/rhythmPatterns/latin';

interface RhythmPatternSelectorProps {
  onSelectPattern: () => void;
}

/**
 * リズムパターン選択コンポーネント
 */
const RhythmPatternSelector: React.FC<RhythmPatternSelectorProps> = ({ onSelectPattern }) => {
  const loadRhythmPattern = useGameStore((state) => state.loadRhythmPattern);
  const [selectedCategory, setSelectedCategory] = useState<RhythmCategory>('basic');

  // パターンをカテゴリごとに整理
  const patternsByCategory: Record<RhythmCategory, RhythmPattern[]> = {
    basic: basicPatterns,
    jazz: jazzPatterns,
    latin: latinPatterns,
    funk: [], // TODO: ファンクパターンを追加
    rock: [], // TODO: ロックパターンを追加
    blues: [], // TODO: ブルースパターンを追加
    custom: [], // TODO: カスタムパターン機能を実装
  };

  const handleSelectPattern = (pattern: RhythmPattern) => {
    loadRhythmPattern(pattern);
    onSelectPattern();
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'bg-green-500';
    if (difficulty <= 3) return 'bg-yellow-500';
    if (difficulty <= 4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getDifficultyLabel = (difficulty: number) => {
    const labels = ['初級', '初中級', '中級', '上級', 'エキスパート'];
    return labels[difficulty - 1] || '不明';
  };

  const categories: { value: RhythmCategory; label: string; icon: string }[] = [
    { value: 'basic', label: '基本', icon: '📚' },
    { value: 'jazz', label: 'ジャズ', icon: '🎷' },
    { value: 'latin', label: 'ラテン', icon: '🥁' },
    { value: 'funk', label: 'ファンク', icon: '🎸' },
    { value: 'rock', label: 'ロック', icon: '🎵' },
    { value: 'blues', label: 'ブルース', icon: '🎺' },
  ];

  return (
    <div className="rhythm-pattern-selector h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">リズムパターンを選択</h3>
        <p className="text-gray-400">練習したいリズムパターンを選んでください</p>
      </div>

      <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as RhythmCategory)}>
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 mb-6">
          {categories.map((category) => (
            <TabsTrigger key={category.value} value={category.value} className="flex items-center gap-1">
              <span className="text-lg">{category.icon}</span>
              <span className="hidden sm:inline">{category.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.value} value={category.value} className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patternsByCategory[category.value].map((pattern) => (
                <Card
                  key={pattern.id}
                  className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                  onClick={() => handleSelectPattern(pattern)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{pattern.name}</CardTitle>
                      <Badge className={cn('text-xs', getDifficultyColor(pattern.difficulty))}>
                        {getDifficultyLabel(pattern.difficulty)}
                      </Badge>
                    </div>
                    <CardDescription>{pattern.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{pattern.bpm} BPM</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        <span>
                          {pattern.timeSignature.numerator}/{pattern.timeSignature.denominator}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span>{pattern.notes.length} ノーツ</span>
                      </div>
                    </div>

                    {/* プレビュー（簡易的なビート表示） */}
                    <div className="mt-3 h-8 bg-gray-900 rounded flex items-center px-2 gap-1">
                      {Array.from({ length: Math.min(16, pattern.notes.length) }).map((_, index) => {
                        const note = pattern.notes[index];
                        if (!note) return null;
                        return (
                          <div
                            key={index}
                            className={cn(
                              'w-1.5 h-4 rounded-sm',
                              note.accent ? 'bg-red-500' : 'bg-gray-600',
                              note.ghost && 'opacity-50'
                            )}
                            style={{
                              height: `${(note.velocity / 127) * 100}%`,
                            }}
                          />
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {patternsByCategory[category.value].length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>このカテゴリのパターンは準備中です</p>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default RhythmPatternSelector;