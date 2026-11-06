const KEY = 'ali110.theme';
const THEMES = ['light', 'dark'];

function stored() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export function getTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function apply(theme) {
  document.documentElement.dataset.theme = theme;
}

export function initTheme() {
  const saved = stored();
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  apply(THEMES.includes(saved) ? saved : prefersDark ? 'dark' : 'light');
}

export function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  apply(next);
  try { localStorage.setItem(KEY, next); } catch { /* not persisted */ }
  document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } }));
  return next;
}
