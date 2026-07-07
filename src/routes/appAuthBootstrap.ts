export const bootstrapAppAuth = async (): Promise<void> => {
  const [{ useAuthStore }, { useGeoStore }] = await Promise.all([
    import('@/stores/authStore'),
    import('@/stores/geoStore'),
  ]);

  await Promise.all([
    useGeoStore.getState().ensureCountry(),
    Promise.race([
      useAuthStore.getState().init(),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('Auth init timeout')), 5000),
      ),
    ]),
  ]);
};

export const prefetchProtectedAppRoute = (): void => {
  const idle = typeof requestIdleCallback === 'function'
    ? requestIdleCallback
    : (cb: () => void) => setTimeout(cb, 200);
  idle(() => {
    void import('@/routes/ProtectedAppRoute').catch(() => {});
  });
};
