import type { PersistedData } from '../types';
import { seed } from './seed';

/** 與離線版相同的 key，方便沿用 */
export const STORAGE_KEY = 'badminton-scheduler-v1';

const DEFAULT_PRICES = { normal: 250, discount: 200 };

export function isValidData(d: unknown): d is PersistedData {
  if (!d || typeof d !== 'object') return false;
  const x = d as Record<string, unknown>;
  return ['players', 'history', 'courts', 'queue', 'reservations'].every(k => Array.isArray(x[k]));
}

export function normalize(d: PersistedData): PersistedData {
  return { ...d, seq: Number(d.seq) || 0, prices: d.prices || DEFAULT_PRICES };
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
