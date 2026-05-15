const CDN_HOST = 'https://jazzify-cdn.com';

export const toCdnProxyUrl = (url: string): string => {
  if (url.startsWith(CDN_HOST)) {
    return `/cdn-proxy${url.slice(CDN_HOST.length)}`;
  }
  return url;
};
