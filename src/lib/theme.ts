import { useEffect, useState } from 'react';

export type ThemePref = 'system' | 'light' | 'dark';

/** 主題偏好只跟這台裝置有關，不放進備份資料 */
const KEY = 'badminton-theme';
const THEME_COLORS = { light: '#f3f2f2', dark: '#1c1b1a' } as const;
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

export function readThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch { /* ignore */ }
  return 'system';
}

/** 把偏好換算成實際主題，寫到 <html data-theme> 與網址列顏色 */
export function applyTheme(pref: ThemePref) {
  const effective = pref === 'system' ? (media().matches ? 'dark' : 'light') : pref;
  document.documentElement.dataset.theme = effective;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[effective]);
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(readThemePref);

  useEffect(() => {
    applyTheme(pref);
    try { localStorage.setItem(KEY, pref); } catch { /* ignore */ }
    if (pref !== 'system') return;
    // 跟隨系統時，系統切換深淺色要即時反應
    const m = media();
    const onChange = () => applyTheme('system');
    m.addEventListener('change', onChange);
    return () => m.removeEventListener('change', onChange);
  }, [pref]);

  return [pref, setPref] as const;
}
