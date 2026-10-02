import type { Gender, PersistedData } from '../types';

/** 第一次開啟時的示範資料 */
export function seed(): PersistedData {
  const now = Date.now();
  const m = 60000;
  const raw: [string, Gender, number, string?][] = [
    ['陳冠宇', '男', 4, 'p2'], ['林怡君', '女', 3, 'p1'], ['王子豪', '男', 5], ['張雅婷', '女', 2],
    ['李承翰', '男', 4, 'p6'], ['黃詩涵', '女', 4, 'p5'], ['吳柏翰', '男', 3], ['劉佳穎', '女', 3],
    ['蔡宗霖', '男', 2], ['楊欣怡', '女', 2], ['許家豪', '男', 5], ['鄭雅雯', '女', 4],
    ['謝明哲', '男', 1], ['郭品妤', '女', 1], ['洪志偉', '男', 3], ['曾子晴', '女', 2],
  ];
  return {
    players: raw.map((r, i) => ({ id: 'p' + (i + 1), name: r[0], gender: r[1], level: r[2], partner: r[3] || '' })),
    history: [
      { id: 'h1', court: 'A 場', a: ['p1', 'p2'], b: ['p5', 'p6'], start: now - 70 * m, end: now - 50 * m, resId: 'r2' },
      { id: 'h2', court: 'B 場', a: ['p3', 'p8'], b: ['p11', 'p7'], start: now - 66 * m, end: now - 44 * m, resId: null },
      { id: 'h3', court: 'A 場', a: ['p13', 'p16'], b: ['p14', 'p15'], start: now - 48 * m, end: now - 30 * m, resId: null },
    ],
    courts: [
      { id: 'c1', name: 'A 場', match: { a: ['p3', 'p4'], b: ['p7', 'p8'], start: now - 12 * m, resId: null } },
      { id: 'c2', name: 'B 場', match: null },
      { id: 'c3', name: 'C 場', match: null },
    ],
    queue: [{ id: 'q1', a: ['p11', 'p10'], b: ['p12', 'p9'], createdAt: now - 4 * m, resId: null }],
    reservations: [
      { id: 'r1', ids: ['p1', 'p2', 'p13', 'p14'], status: 'pending' },
      { id: 'r2', ids: ['p1', 'p2', 'p5', 'p6'], status: 'done' },
      { id: 'r3', ids: ['p5', 'p6', 'p15', 'p16'], status: 'pending' },
    ],
    seq: 10,
    prices: { male: 250, female: 250, discountOff: 50 },
  };
}
