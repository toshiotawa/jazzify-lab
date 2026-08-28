import {
  createAutoRun01Map,
  createCodeRunMapById,
  DEFAULT_AUTO_RUN_MAP_ID,
  DEFAULT_MANUAL_RUN_MAP_ID,
  resolveCodeRunMapId,
} from './defaultCodeRunMap';

describe('defaultCodeRunMap', () => {
  it('resolves manual and auto map ids with fallbacks', () => {
    expect(resolveCodeRunMapId({}, false)).toBe(DEFAULT_MANUAL_RUN_MAP_ID);
    expect(resolveCodeRunMapId({}, true)).toBe(DEFAULT_AUTO_RUN_MAP_ID);
    expect(resolveCodeRunMapId({ runMapId: 'tutorial' }, false)).toBe('tutorial');
    expect(resolveCodeRunMapId({ autoRunMapId: 'custom_auto' }, true)).toBe('custom_auto');
  });

  it('builds bundled auto_run_01 fallback map', () => {
    const map = createAutoRun01Map();
    expect(map.id).toBe('auto_run_01');
    expect(map.worldWidth).toBeGreaterThan(960);
    expect(map.goalX).toBeGreaterThan(0);
  });

  it('registers auto_run_01 in map builders', () => {
    const map = createCodeRunMapById('auto_run_01');
    expect(map.id).toBe('auto_run_01');
  });
});
