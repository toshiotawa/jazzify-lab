export const installDvhViewport = (): (() => void) => {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const setDvh = (): void => {
    const vv = window.visualViewport;
    const vals = [window.innerHeight, document.documentElement.clientHeight];
    if (vv) vals.push(vv.height);
    document.documentElement.style.setProperty('--dvh', `${Math.min(...vals)}px`);
  };

  setDvh();
  window.addEventListener('resize', setDvh, { passive: true });
  const vv = window.visualViewport;
  if (vv) {
    vv.addEventListener('resize', setDvh, { passive: true });
    vv.addEventListener('scroll', setDvh, { passive: true });
  }

  return () => {
    window.removeEventListener('resize', setDvh);
    if (vv) {
      vv.removeEventListener('resize', setDvh);
      vv.removeEventListener('scroll', setDvh);
    }
    document.documentElement.style.removeProperty('--dvh');
  };
};
