type HeadersLike = Record<string, string | undefined>;

const ensureAbsoluteUrl = (value: string | undefined | null): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed.replace(/^\/+/, '')}`;

  try {
    const url = new URL(candidate);
    return url.origin;
  } catch {
    return null;
  }
};

const getHeader = (headers: HeadersLike, key: string): string | undefined => {
  const lowerKey = key.toLowerCase();
  const upperKey = lowerKey.toUpperCase();
  return headers[lowerKey] ?? headers[upperKey] ?? headers[key];
};

export const resolveSiteUrl = (headers: HeadersLike): string | null => {
  const envCandidates = [
    process.env.SITE_URL,
    process.env.URL,
    process.env.DEPLOY_URL,
  ];

  for (const candidate of envCandidates) {
    const normalized = ensureAbsoluteUrl(candidate);
    if (normalized) {
      return normalized;
    }
  }

  const originHeader = getHeader(headers, 'origin') ?? getHeader(headers, 'referer');
  const originFromHeaders = ensureAbsoluteUrl(originHeader);
  if (originFromHeaders) {
    return originFromHeaders;
  }

  const proto = getHeader(headers, 'x-forwarded-proto') ?? 'https';
  const hostHeader = getHeader(headers, 'x-forwarded-host') ?? getHeader(headers, 'host');
  if (hostHeader) {
    const candidateHost = /^https?:\/\//i.test(hostHeader)
      ? hostHeader
      : `${proto}://${hostHeader}`;
    const normalizedHost = ensureAbsoluteUrl(candidateHost);
    if (normalizedHost) {
      return normalizedHost;
    }
  }

  return null;
};

