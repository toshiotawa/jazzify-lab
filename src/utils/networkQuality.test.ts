import { shouldAllowBulkPrefetch } from '@/utils/networkQuality';

describe('shouldAllowBulkPrefetch', () => {
  const originalConnection = Reflect.get(navigator, 'connection');

  afterEach(() => {
    if (originalConnection === undefined) {
      Reflect.deleteProperty(navigator, 'connection');
    } else {
      Reflect.set(navigator, 'connection', originalConnection);
    }
  });

  it('returns false when saveData is enabled', () => {
    Reflect.set(navigator, 'connection', { saveData: true, effectiveType: '4g' });
    expect(shouldAllowBulkPrefetch()).toBe(false);
  });

  it('returns false on slow effectiveType', () => {
    Reflect.set(navigator, 'connection', { effectiveType: '2g' });
    expect(shouldAllowBulkPrefetch()).toBe(false);
  });

  it('returns true on 4g without saveData', () => {
    Reflect.set(navigator, 'connection', { effectiveType: '4g', saveData: false });
    expect(shouldAllowBulkPrefetch()).toBe(true);
  });
});
