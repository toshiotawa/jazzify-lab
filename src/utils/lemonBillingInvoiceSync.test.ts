import { addSubscriptionId } from '../../netlify/functions/lib/lemonBillingInvoiceSync';

// collectProviderSubscriptionIdsForUser は DB 依存のため、ID 収集ヘルパーのみ単体テスト
describe('collectProviderSubscriptionIdsForUser helpers', () => {
  it('adds string subscription ids to set', () => {
    const ids = new Set<string>();
    addSubscriptionId(ids, 2252912);
    addSubscriptionId(ids, '2252912');
    expect(ids.size).toBe(1);
    expect(ids.has('2252912')).toBe(true);
  });

  it('ignores empty values', () => {
    const ids = new Set<string>();
    addSubscriptionId(ids, null);
    addSubscriptionId(ids, '');
    addSubscriptionId(ids, undefined);
    expect(ids.size).toBe(0);
  });
});
