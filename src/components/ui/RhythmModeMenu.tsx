'use client'

import { useState, useEffect } from 'react'
import { Music, Heart, Zap, Star, Trophy, Clock, Sparkles } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Label } from '@/components/ui/Label'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Separator } from '@/components/ui/Separator'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'
import type { RhythmDifficulty, TimeSignature } from '@/types/rhythm'
import { getTimeSignatureDefaults } from '@/utils/rhythmMode/timeSignatureDefaults'

interface RhythmModeMenuProps {
  difficulty: RhythmDifficulty
  onDifficultyChange: (difficulty: RhythmDifficulty) => void
  timeSignature: TimeSignature
  onTimeSignatureChange: (timeSignature: TimeSignature) => void
  bpm: number
  onBpmChange: (bpm: number) => void
  disabled?: boolean
}

const difficultyConfig = {
  easy: {
    label: 'かんたん',
    icon: Heart,
    color: 'text-green-500 dark:text-green-400',
    bgColor: 'bg-green-500/10 dark:bg-green-400/10',
    borderColor: 'border-green-500/20 dark:border-green-400/20',
    description: '基本的なリズムパターン',
    patterns: ['4分音符', '2分音符'],
    noteCount: '2-4音',
    speed: 'ゆっくり'
  },
  normal: {
    label: 'ふつう',
    icon: Star,
    color: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-500/10 dark:bg-blue-400/10',
    borderColor: 'border-blue-500/20 dark:border-blue-400/20',
    description: '標準的なリズムパターン',
    patterns: ['4分音符', '8分音符', 'シンコペーション'],
    noteCount: '4-8音',
    speed: 'ふつう'
  },
  hard: {
    label: 'むずかしい',
    icon: Zap,
    color: 'text-purple-500 dark:text-purple-400',
    bgColor: 'bg-purple-500/10 dark:bg-purple-400/10',
    borderColor: 'border-purple-500/20 dark:border-purple-400/20',
    description: '複雑なリズムパターン',
    patterns: ['8分音符', '16分音符', '3連符'],
    noteCount: '8-16音',
    speed: 'はやい'
  },
  expert: {
    label: 'エキスパート',
    icon: Trophy,
    color: 'text-red-500 dark:text-red-400',
    bgColor: 'bg-red-500/10 dark:bg-red-400/10',
    borderColor: 'border-red-500/20 dark:border-red-400/20',
    description: '高度なリズムパターン',
    patterns: ['16分音符', '32分音符', 'ポリリズム'],
    noteCount: '16音以上',
    speed: 'とてもはやい'
  }
}

export function RhythmModeMenu({
  difficulty,
  onDifficultyChange,
  timeSignature,
  onTimeSignatureChange,
  bpm,
  onBpmChange,
  disabled = false
}: RhythmModeMenuProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const config = difficultyConfig[difficulty]
  const Icon = config.icon

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Music className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">リズムモード設定</h3>
        </div>

        {/* 難易度選択 */}
        <div className="space-y-3">
          <Label>難易度</Label>
          <Select
            value={difficulty}
            onValueChange={(value) => onDifficultyChange(value as RhythmDifficulty)}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(difficultyConfig) as RhythmDifficulty[]).map((level) => {
                const levelConfig = difficultyConfig[level]
                const LevelIcon = levelConfig.icon
                return (
                  <SelectItem key={level} value={level}>
                    <div className="flex items-center gap-2">
                      <LevelIcon className={cn('h-4 w-4', levelConfig.color)} />
                      <span>{levelConfig.label}</span>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          {/* 難易度の詳細表示 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={difficulty}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={cn('border', config.borderColor)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn('p-2 rounded-lg', config.bgColor)}>
                      <Icon className={cn('h-5 w-5', config.color)} />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{config.label}</span>
                        <Badge variant="secondary" className="text-xs">
                          {config.noteCount}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {config.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {config.patterns.map((pattern) => (
                          <Badge
                            key={pattern}
                            variant="outline"
                            className="text-xs"
                          >
                            {pattern}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        <Separator />

        {/* 拍子設定 */}
        <div className="space-y-3">
          <Label>拍子</Label>
          <Select
            value={timeSignature}
            onValueChange={(value) => onTimeSignatureChange(value as TimeSignature)}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4/4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>4/4 (標準)</span>
                </div>
              </SelectItem>
              <SelectItem value="3/4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>3/4 (ワルツ)</span>
                </div>
              </SelectItem>
              <SelectItem value="6/8">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>6/8 (複合拍子)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* BPM設定 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>テンポ (BPM)</Label>
            <Badge variant="secondary" className="text-xs">
              {bpm} BPM
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="60"
              max="180"
              value={bpm}
              onChange={(e) => onBpmChange(Number(e.target.value))}
              disabled={disabled}
              className="flex-1"
            />
            <Sparkles className={cn(
              'h-4 w-4 transition-all',
              bpm > 140 ? 'text-yellow-500 animate-pulse' : 'text-muted-foreground'
            )} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>ゆっくり</span>
            <span>ふつう</span>
            <span>はやい</span>
          </div>
        </div>
      </div>
    </div>
  )
}