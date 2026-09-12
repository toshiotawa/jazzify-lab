export function parseDiscordCallbackStatus(input: {
  search: string;
  hash: string;
}): 'joined' | 'error' | null {
  const searchValue = new URLSearchParams(
    input.search.startsWith('?') ? input.search.slice(1) : input.search,
  ).get('discord');
  if (searchValue === 'joined' || searchValue === 'error') {
    return searchValue;
  }

  const hashBase = input.hash.split('?')[0];
  if (hashBase !== '#dashboard') {
    return null;
  }
  const queryIndex = input.hash.indexOf('?');
  if (queryIndex === -1) {
    return null;
  }
  const hashValue = new URLSearchParams(input.hash.slice(queryIndex + 1)).get('discord');
  if (hashValue === 'joined' || hashValue === 'error') {
    return hashValue;
  }
  return null;
}
