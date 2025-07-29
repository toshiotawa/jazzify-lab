import { describe, it, expect, beforeEach } from 'vitest';
import { SyncMonitor } from '@/utils/SyncMonitor';

describe('SyncMonitor', () => {
  let syncMonitor: SyncMonitor;
  const gameStartTime = 1000;
  const musicStartTime = 1000;
  
  beforeEach(() => {
    syncMonitor = new SyncMonitor(gameStartTime, musicStartTime);
  });
  
  describe('checkSync', () => {
    it('detects when in sync', () => {
      // 音楽とゲームが同期している
      const audioTime = 2.0; // 2秒経過
      const gameTime = 3000; // 開始から2秒後
      
      const status = syncMonitor.checkSync(audioTime, gameTime, 120);
      
      expect(status.inSync).toBe(true);
      expect(status.drift).toBe(0);
      expect(status.correction).toBeUndefined();
    });
    
    it('detects drift when out of sync', () => {
      // 音楽が100ms遅れている
      const audioTime = 1.9; // 1.9秒
      const gameTime = 3000; // 2秒
      
      const status = syncMonitor.checkSync(audioTime, gameTime, 120);
      
      expect(status.inSync).toBe(false);
      expect(status.drift).toBe(100);
      expect(status.correction).toBe(-100); // ゲームを遅くする必要
    });
    
    it('allows small drift within tolerance', () => {
      // 30msのズレ（許容範囲内）
      const audioTime = 2.03;
      const gameTime = 3000;
      
      const status = syncMonitor.checkSync(audioTime, gameTime, 120);
      
      expect(status.inSync).toBe(true);
      expect(status.drift).toBe(30);
    });
  });
  
  describe('autoCorrect', () => {
    it('applies smooth correction', () => {
      const currentOffset = 0;
      const correction = 100;
      
      const newOffset = syncMonitor.autoCorrect(currentOffset, correction);
      
      expect(newOffset).toBe(10); // 100 * 0.1
    });
    
    it('applies custom smooth factor', () => {
      const currentOffset = 50;
      const correction = 200;
      
      const newOffset = syncMonitor.autoCorrect(currentOffset, correction, 0.25);
      
      expect(newOffset).toBe(100); // 50 + (200 * 0.25)
    });
  });
  
  describe('shouldCheckSync', () => {
    it('returns true after interval', () => {
      const firstTime = 5000;
      const secondTime = 6100; // 1.1秒後
      
      expect(syncMonitor.shouldCheckSync(firstTime)).toBe(true);
      expect(syncMonitor.shouldCheckSync(secondTime)).toBe(true);
    });
    
    it('returns false within interval', () => {
      const firstTime = 5000;
      const secondTime = 5500; // 0.5秒後
      
      expect(syncMonitor.shouldCheckSync(firstTime)).toBe(true);
      expect(syncMonitor.shouldCheckSync(secondTime)).toBe(false);
    });
  });
  
  describe('getDebugInfo', () => {
    it('provides correct debug information', () => {
      const audioTime = 2.5; // 2.5秒
      const gameTime = 3400; // 開始から2.4秒
      
      const debugInfo = syncMonitor.getDebugInfo(audioTime, gameTime);
      
      expect(debugInfo.musicTime).toBe(2500);
      expect(debugInfo.gameTime).toBe(2400);
      expect(debugInfo.drift).toBe(100);
      expect(debugInfo.status).toBe('DRIFT');
    });
    
    it('shows SYNC status when within tolerance', () => {
      const audioTime = 2.0;
      const gameTime = 3020; // 20msのズレ
      
      const debugInfo = syncMonitor.getDebugInfo(audioTime, gameTime);
      
      expect(debugInfo.drift).toBe(20);
      expect(debugInfo.status).toBe('SYNC');
    });
  });
});