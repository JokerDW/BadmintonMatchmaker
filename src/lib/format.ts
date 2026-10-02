export const pad = (n: number) => String(n).padStart(2, '0');

export const hm = (t: number) => {
  const d = new Date(t);
  return pad(d.getHours()) + ':' + pad(d.getMinutes());
};

export const mmss = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return pad(Math.floor(s / 60)) + ':' + pad(s % 60);
};

export const mins = (ms: number) => Math.max(0, Math.round(ms / 60000)) + ' 分';

export const money = (n: number) => '$' + Number(n || 0).toLocaleString();

export const todayLabel = (now: number) => {
  const d = new Date(now);
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} · ${hm(now)}`;
};

export const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'zh-Hant');
