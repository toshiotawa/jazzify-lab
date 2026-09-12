import {
  buildAppRedirectUrl,
  canStartDiscordLink,
  createDiscordOAuthState,
  resolveDiscordLinkClientFromState,
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

Deno.test('createDiscordOAuthState prefixes iOS state', () => {
  const state = createDiscordOAuthState('ios', 'abc');
  if (state !== 'ios.abc') {
    throw new Error(`unexpected ios state: ${state}`);
  }
});

Deno.test('createDiscordOAuthState keeps web state unprefixed', () => {
  const state = createDiscordOAuthState('web', 'abc');
  if (state !== 'abc') {
    throw new Error(`unexpected web state: ${state}`);
  }
});

Deno.test('resolveDiscordLinkClientFromState detects iOS prefix', () => {
  if (resolveDiscordLinkClientFromState('ios.abc') !== 'ios') {
    throw new Error('expected ios client');
  }
  if (resolveDiscordLinkClientFromState('abc') !== 'web') {
    throw new Error('expected web client');
  }
  if (resolveDiscordLinkClientFromState(null) !== 'web') {
    throw new Error('expected web client for null state');
  }
});

Deno.test('buildAppRedirectUrl uses dashboard path query for web', () => {
  const url = buildAppRedirectUrl('https://jazzify.jp/', 'joined');
  if (url !== 'https://jazzify.jp/main/dashboard?discord=joined') {
    throw new Error(`unexpected redirect url: ${url}`);
  }
});

Deno.test('buildAppRedirectUrl uses app callback scheme for iOS', () => {
  const url = buildAppRedirectUrl('https://jazzify.jp/', 'joined', 'ios');
  if (url !== 'jazzify://discord?status=joined') {
    throw new Error(`unexpected ios redirect url: ${url}`);
  }
});
