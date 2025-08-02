/**
 * judgeWindow ユーティリティのテスト
 */

import { describe, it, expect } from 'vitest';
import { inWindow, getJudgeDetail } from '../judgeWindow';

describe('judgeWindow', () => {
  describe('inWindow', () => {
    it('判定ウィンドウ内（ジャスト）でtrueを返す', () => {
      const now = 1000;
      const target = 1000;
      expect(inWindow(now, target)).toBe(true);
    });

    it('判定ウィンドウ内（境界値+200ms）でtrueを返す', () => {
      const now = 1200;
      const target = 1000;
      expect(inWindow(now, target)).toBe(true);
    });

    it('判定ウィンドウ内（境界値-200ms）でtrueを返す', () => {
      const now = 800;
      const target = 1000;
      expect(inWindow(now, target)).toBe(true);
    });

    it('判定ウィンドウ外（+201ms）でfalseを返す', () => {
      const now = 1201;
      const target = 1000;
      expect(inWindow(now, target)).toBe(false);
    });

    it('判定ウィンドウ外（-201ms）でfalseを返す', () => {
      const now = 799;
      const target = 1000;
      expect(inWindow(now, target)).toBe(false);
    });

    it('カスタム幅で判定できる', () => {
      const now = 1150;
      const target = 1000;
      // デフォルト200msではtrue
      expect(inWindow(now, target)).toBe(true);
      // 100msではfalse
      expect(inWindow(now, target, 100)).toBe(false);
    });
  });

  describe('getJudgeDetail', () => {
    it('ジャストタイミングの詳細を返す', () => {
      const result = getJudgeDetail(1000, 1000);
      expect(result).toEqual({
        inWindow: true,
        diff: 0,
        early: false
      });
    });

    it('早押しの詳細を返す', () => {
      const result = getJudgeDetail(900, 1000);
      expect(result).toEqual({
        inWindow: true,
        diff: -100,
        early: true
      });
    });

    it('遅押しの詳細を返す', () => {
      const result = getJudgeDetail(1100, 1000);
      expect(result).toEqual({
        inWindow: true,
        diff: 100,
        early: false
      });
    });

    it('判定外（早すぎ）の詳細を返す', () => {
      const result = getJudgeDetail(700, 1000);
      expect(result).toEqual({
        inWindow: false,
        diff: -300,
        early: true
      });
    });

    it('判定外（遅すぎ）の詳細を返す', () => {
      const result = getJudgeDetail(1300, 1000);
      expect(result).toEqual({
        inWindow: false,
        diff: 300,
        early: false
      });
    });
  });
});