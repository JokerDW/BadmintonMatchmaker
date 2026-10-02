import type { PersistedData, Prices } from '../types';
import { seed } from './seed';

/** 與離線版相同的 key，方便沿用 */
export const STORAGE_KEY = 'badminton-scheduler-v1';

export const DEFAULT_PRICES: Prices = { male: 250, female: 250, discountOff: 50 };

/** 相容舊格式 { normal, discount }：男女都用一般價，優惠改成「扣多少」 */
function normalizePrices(p: unknown): Prices {
  if (!p || typeof p !== 'object') return DEFAULT_PRICES;
  const x = p as Record<string, unknown>;
  const n = (v: unknown, fb: number) => (typeof v === 'number' && isFinite(v) ? v : fb);
  if ('male' in x || 'female' in x || 'discountOff' in x) {
    return { male: n(x.male, DEFAULT_PRICES.male), female: n(x.female, DEFAULT_PRICES.female), discountOff: n(x.discountOff, DEFAULT_PRICES.discountOff) };
  }
  const normal = n(x.normal, DEFAULT_PRICES.male);
  const discount = n(x.discount, normal - DEFAULT_PRICES.discountOff);
  return { male: normal, female: normal, discountOff: Math.max(0, normal - discount) };
}

export function isValidData(d: unknown): d is PersistedData {
  if (!d || typeof d !== 'object') return false;
  const x = d as Record<string, unknown>;
  return ['players', 'history', 'courts', 'queue', 'reservations'].every(k => Array.isArray(x[k]));
}

export function normalize(d: PersistedData): PersistedData {
  return { ...d, seq: Number(d.seq) || 0, prices: normalizePrices(d.prices) };
}

export function loadData(): PersistedData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (isValidData(d)) return normalize(d);
    }
  } catch {
    /* localStorage 不可用或資料損毀：改用示範資料 */
  }
  return seed();
}

export function saveData(d: PersistedData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {
    /* 無痕模式等情況寫入失敗時忽略 */
  }
}
