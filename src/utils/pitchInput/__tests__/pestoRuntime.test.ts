import { getPestoWasmThreadCount } from '../pestoRuntime';

describe('PESTO shared-memory capability', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('uses two threads in an isolated multi-core Worker', () => {
    vi.stubGlobal('crossOriginIsolated', true);
    vi.stubGlobal('navigator', { hardwareConcurrency: 4 });
    expect(getPestoWasmThreadCount()).toBe(2);
  });
  it.each([false, undefined])('uses one thread outside isolation (%s)', (isolated) => {
    vi.stubGlobal('crossOriginIsolated', isolated);
    vi.stubGlobal('navigator', { hardwareConcurrency: 4 });
    expect(getPestoWasmThreadCount()).toBe(1);
  });
  it('uses one thread without shared memory or on a single-core device', () => {
    vi.stubGlobal('crossOriginIsolated', true);
    vi.stubGlobal('navigator', { hardwareConcurrency: 1 });
    expect(getPestoWasmThreadCount()).toBe(1);
    vi.stubGlobal('navigator', { hardwareConcurrency: 4 });
    vi.stubGlobal('SharedArrayBuffer', undefined);
    expect(getPestoWasmThreadCount()).toBe(1);
  });
});
