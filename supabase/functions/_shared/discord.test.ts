import {
  buildAppRedirectUrl,
  canStartDiscordLink,
  resolveGuildId,
  shouldKickFromDiscord,
} from './discord.ts';

Deno.test('resolveGuildId returns EN guild for en locale', () => {
  const guildId = resolveGuildId('en', { guildIdJa: '111', guildIdEn: '222' });
  if (guildId !== '222') {
    throw new Error(`expected 222, got ${guildId}`);
  }
});

Deno.test('resolveGuildId returns JA guild for ja locale', () => {
  const guildId = resolveGuildId('ja', { guildIdJa: '111', guildIdEn: '222' });
  if (guildId !== '111') {
    throw new Error(`expected 111, got ${guildId}`);
  }
});

Deno.test('shouldKickFromDiscord kicks free non-admin users', () => {
  if (!shouldKickFromDiscord({ rank: 'free', isAdmin: false })) {
    throw new Error('expected free user to be kicked');
  }
});

Deno.test('shouldKickFromDiscord keeps paid users', () => {
  if (shouldKickFromDiscord({ rank: 'premium', isAdmin: false })) {
    throw new Error('expected premium user to remain');
  }
  if (shouldKickFromDiscord({ rank: 'coaching', isAdmin: false })) {
    throw new Error('expected coaching user to remain');
  }
});

Deno.test('shouldKickFromDiscord keeps admins even when free', () => {
  if (shouldKickFromDiscord({ rank: 'free', isAdmin: true })) {
    throw new Error('expected admin to remain');
  }
});

Deno.test('canStartDiscordLink allows paid and admin users', () => {
  if (!canStartDiscordLink('premium', false)) {
    throw new Error('expected premium user to start link');
  }
  if (!canStartDiscordLink('free', true)) {
    throw new Error('expected admin to start link');
  }
  if (canStartDiscordLink('free', false)) {
    throw new Error('expected free user to be blocked');
  }
});

Deno.test('buildAppRedirectUrl appends dashboard hash query', () => {
  const url = buildAppRedirectUrl('https://jazzify.jp/', 'joined');
  if (url !== 'https://jazzify.jp/#dashboard?discord=joined') {
    throw new Error(`unexpected redirect url: ${url}`);
  }
});
