import {
  buildSurvivalPhrasesFromLessonCompositeConfig,
  lessonSongHasInlineComposite,
  parseNoteNameToMidi,
  resolveCompositeDamageOverrides,
  resolveSurvivalLessonRuntime,
} from './survivalLessonConfig';
import type { SurvivalLessonCompositeConfig } from '@/types';
import * as survivalStageDefs from '@/components/survival/SurvivalStageDefinitions';
import { STAGE_PLAYER_MAX_HP, STAGE_TIME_LIMIT_SECONDS, STAGE_KILL_QUOTA } from '@/components/survival/SurvivalStageDefinitions';
import { COMPOSITE_PHRASE_NOTE_DAMAGE } from '@/utils/compositePhraseDamage';

import { describe, expect, it, vi } from 'vitest';

describe('survivalLessonConfig', () => {
  describe('parseNoteNameToMidi', () => {
    it('parses C4 and Eb3', () => {
      expect(parseNoteNameToMidi('C4')).toBe(60);
      expect(parseNoteNameToMidi('Eb3')).toBe(51);
    });

    it('returns null for invalid input', () => {
      expect(parseNoteNameToMidi('')).toBeNull();
      expect(parseNoteNameToMidi('not-a-note')).toBeNull();
    });
  });

  describe('buildSurvivalPhrasesFromLessonCompositeConfig', () => {
    const config: SurvivalLessonCompositeConfig = {
      bossType: 'B',
      keyFifths: 0,
      phrases: [
        {
          title: 'P1',
          chords: [{ chordName: 'Dm7', noteNames: ['D4', 'F4'] }],
        },
        {
          title: 'P2',
          chords: [{ chordName: 'G7', noteNames: ['G3', 'B3'] }],
        },
      ],
    };

    it('builds two phrase definitions with correct pitch classes', () => {
      const phrases = buildSurvivalPhrasesFromLessonCompositeConfig(config, 'abc');
      expect(phrases).toHaveLength(2);
      expect(phrases[0].chords[0].notes[0].pitchClass).toBe(2);
      expect(phrases[1].chords[0].notes[0].pitchClass).toBe(7);
    });

    it('requires at least two phrases for inline composite flag', () => {
      expect(lessonSongHasInlineComposite(config)).toBe(true);
      expect(lessonSongHasInlineComposite({ phrases: [config.phrases[0]] })).toBe(false);
    });
  });

  describe('resolveSurvivalLessonRuntime', () => {
    const baseStage = {
      stageNumber: 1,
      mapCategory: 'basic' as const,
      stageType: 'random' as const,
      blockKey: 'test',
      difficulty: 'easy' as const,
      name: 'T',
      nameEn: 'T',
      chordSuffix: '',
      chordDisplayName: '',
      chordDisplayNameEn: '',
      rootPattern: null,
      rootPatternName: '',
      rootPatternNameEn: '',
      allowedChords: [],
    };

    const baseConfig = {
      difficulty: 'easy' as const,
      displayName: 'Easy',
      description: '',
      descriptionEn: '',
      allowedChords: [],
      enemySpawnRate: 1,
      enemySpawnCount: 1,
      enemyStatMultiplier: 1,
      expMultiplier: 1,
      itemDropRate: 1,
      bgmUrl: 'https://default.bgm',
    };

    it('uses overrides when set for random stage', () => {
      const runtime = resolveSurvivalLessonRuntime(
        {
          playerMaxHp: 1200,
          timeLimitSec: 45,
          killQuota: 30,
          enemyStatMultiplier: 0.5,
          playerStatMultiplier: 2,
          bgmUrl: 'https://custom.bgm',
        },
        {
          stageDefinition: baseStage,
          baseConfig,
          isBossStage: false,
          isPhraseMode: false,
          isCompositeBoss: false,
          isFirstBlockBoss: false,
        },
      );
      expect(runtime.playerMaxHp).toBe(1200);
      expect(runtime.timeLimitSec).toBe(45);
      expect(runtime.killQuota).toBe(30);
      expect(runtime.enemyStatMultiplier).toBe(0.5);
      expect(runtime.playerStatMultiplier).toBe(2);
      expect(runtime.bgmUrl).toBe('https://custom.bgm');
    });

    it('falls back to defaults when overrides empty', () => {
      const runtime = resolveSurvivalLessonRuntime(
        null,
        {
          stageDefinition: baseStage,
          baseConfig,
          isBossStage: false,
          isPhraseMode: false,
          isCompositeBoss: false,
          isFirstBlockBoss: false,
        },
      );
      expect(runtime.playerMaxHp).toBe(STAGE_PLAYER_MAX_HP);
      expect(runtime.timeLimitSec).toBe(STAGE_TIME_LIMIT_SECONDS);
      expect(runtime.killQuota).toBe(STAGE_KILL_QUOTA);
    });

    it('uses survival_stage_blocks-derived defaults via resolveBlock helpers', () => {
      vi.spyOn(survivalStageDefs, 'survivalStageDbBalanceFor').mockReturnValue({
        playerMaxHp: 501,
        killQuota: 11,
      });
      const runtime = resolveSurvivalLessonRuntime(
        null,
        {
          stageDefinition: baseStage,
          baseConfig,
          isBossStage: false,
          isPhraseMode: false,
          isCompositeBoss: false,
          isFirstBlockBoss: false,
        },
      );
      expect(runtime.playerMaxHp).toBe(501);
      expect(runtime.killQuota).toBe(11);
    });

    it('lesson override wins when block DB exposes defaults', () => {
      vi.spyOn(survivalStageDefs, 'survivalStageDbBalanceFor').mockReturnValue({
        playerMaxHp: 501,
        killQuota: 11,
      });
      const runtime = resolveSurvivalLessonRuntime(
        { playerMaxHp: 910, killQuota: 33 },
        {
          stageDefinition: baseStage,
          baseConfig,
          isBossStage: false,
          isPhraseMode: false,
          isCompositeBoss: false,
          isFirstBlockBoss: false,
        },
      );
      expect(runtime.playerMaxHp).toBe(910);
      expect(runtime.killQuota).toBe(33);
    });

    it('resolves composite damage overrides', () => {
      const dmg = resolveCompositeDamageOverrides({ note: 100 });
      expect(dmg.note).toBe(100);
      expect(dmg.measureRange).toBe(COMPOSITE_PHRASE_NOTE_DAMAGE);
    });
  });
});
