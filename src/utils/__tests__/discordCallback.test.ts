import { parseDiscordCallbackStatus } from '@/utils/discordCallback';

describe('parseDiscordCallbackStatus', () => {
  it('reads discord status from path search', () => {
    expect(parseDiscordCallbackStatus({
      search: '?discord=joined',
      hash: '',
    })).toBe('joined');
  });

  it('reads discord status from legacy dashboard hash', () => {
    expect(parseDiscordCallbackStatus({
      search: '',
      hash: '#dashboard?discord=error',
    })).toBe('error');
  });

  it('prefers search over hash', () => {
    expect(parseDiscordCallbackStatus({
      search: '?discord=joined',
      hash: '#dashboard?discord=error',
    })).toBe('joined');
  });

  it('returns null when discord status is absent', () => {
    expect(parseDiscordCallbackStatus({
      search: '',
      hash: '#dashboard',
    })).toBeNull();
  });
});
