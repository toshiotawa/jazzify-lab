import { useEffect } from 'react';

const FONT_AWESOME_HREF = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
const JETBRAINS_MONO_HREF = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&display=swap';

const ensureStylesheet = (href: string, id: string): void => {
  if (typeof document === 'undefined' || document.getElementById(id)) {
    return;
  }
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
};

/** /main 用の外部 CSS をクリティカルパス後に読み込む */
export const useAppStylesheets = (enabled: boolean): void => {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const load = (): void => {
      ensureStylesheet(FONT_AWESOME_HREF, 'jazzify-font-awesome');
      ensureStylesheet(JETBRAINS_MONO_HREF, 'jazzify-jetbrains-mono');
    };

    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(load, { timeout: 4000 });
      return () => cancelIdleCallback(id);
    }

    const timeoutId = window.setTimeout(load, 1500);
    return () => window.clearTimeout(timeoutId);
  }, [enabled]);
};
