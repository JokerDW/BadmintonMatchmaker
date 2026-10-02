import type { Gender, PersistedData, Player, Prices, Teams } from '../types';

export type PlayerMap = Record<string, Player>;

export const toMap = (players: Player[]): PlayerMap =>
  Object.fromEntries(players.map(p => [p.id, p]));

/**
 * 四人分隊：若有綁定的搭檔組合，就讓他們同隊；
 * 否則依程度排序，1+4 對 2+3 讓兩隊實力平均。
 */
export function makeTeams(ids: string[], P: PlayerMap): Teams {
  for (let i = 0; i < 4; i++)
    for (let j = i + 1; j < 4; j++) {
      if (P[ids[i]] && P[ids[i]].partner === ids[j]) {
        return { a: [ids[i], ids[j]], b: ids.filter((_, k) => k !== i && k !== j) };
      }
    }
  const s = [...ids].sort((x, y) => (P[y]?.level || 0) - (P[x]?.level || 0));
  return { a: [s[0], s[3]], b: [s[1], s[2]] };
}

export interface Status {
  /** 已在預備區的球員 */
  queued: Set<string>;
  /** 正在場上：球員 id → 場地名稱 */
  playing: Record<string, string>;
  /** 今日已完成場次 */
  games: Record<string, number>;
}

export function computeStatus(d: Pick<PersistedData, 'queue' | 'courts' | 'history'>): Status {
  const queued = new Set<string>();
  const playing: Record<string, string> = {};
  const games: Record<string, number> = {};
  d.queue.forEach(q => [...q.a, ...q.b].forEach(id => queued.add(id)));
  d.courts.forEach(c => c.match && [...c.match.a, ...c.match.b].forEach(id => (playing[id] = c.name)));
  d.history.forEach(h => [...h.a, ...h.b].forEach(id => (games[id] = (games[id] || 0) + 1)));
  return { queued, playing, games };
}

export interface ImportRow {
  name: string;
  gender: Gender;
  level: number;
}

/**
 * 批次匯入格式：
 *   單獨一行「男」/「女」(可加 生/性、冒號) 作為分組標題
 *   其下每行「姓名 程度」，也可在同一行寫性別。
 * 已存在的姓名會略過。
 */
export function parseImport(text: string, existingNames: Iterable<string>): ImportRow[] {
  const existing = new Set(existingNames);
  const out: ImportRow[] = [];
  let section: Gender = '男';
  text.split(/\r?\n/).forEach(line => {
    const parts = line.split(/[,，\t\s]+/).map(x => x.trim()).filter(Boolean);
    if (!parts.length) return;
    if (parts.length === 1 && /^(男|女)(生|性)?[:：]?$/.test(parts[0])) {
      section = parts[0][0] as Gender;
      return;
    }
    const name = parts[0];
    if (existing.has(name) || out.some(o => o.name === name)) return;
    let gender: Gender = section;
    let level = 3;
    parts.slice(1).forEach(x => {
      if (x === '男' || x === '女') gender = x;
      else if (!isNaN(Number(x))) level = Number(x);
    });
    out.push({ name, gender, level });
  });
  return out;
}

/** 第一個沒被使用的「X 場」名稱 */
export function nextCourtName(used: string[]): string {
  const set = new Set(used);
  let i = 0;
  while (set.has(String.fromCharCode(65 + i) + ' 場')) i++;
  return String.fromCharCode(65 + i) + ' 場';
}

const pairKey = (x: string, y: string) => (x < y ? x + '|' + y : y + '|' + x);

/** 每兩位球員今天「在同一場」的次數（不論同隊或對手） */
export function pairCounts(history: Teams[]): Map<string, number> {
  const m = new Map<string, number>();
  history.forEach(h => {
    const ids = [...h.a, ...h.b];
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++) {
        const k = pairKey(ids[i], ids[j]);
        m.set(k, (m.get(k) || 0) + 1);
      }
  });
  return m;
}

export const getPairCount = (m: Map<string, number>, x: string, y: string) => m.get(pairKey(x, y)) || 0;

export interface PartnerWarning {
  id: string;
  partnerId: string;
  /** 指定隊友目前的狀況（在場上、在預備區），空字串代表可選但沒選 */
  where: string;
}

export interface RepeatWarning {
  a: string;
  b: string;
  count: number;
}

/** 勾選球員時的兩種警告：指定隊友沒一起選、兩人今天已同場過（綁定搭檔除外） */
export function selectionWarnings(
  sel: string[],
  P: PlayerMap,
  status: Status,
  pairs: Map<string, number>,
): { partner: PartnerWarning[]; repeat: RepeatWarning[] } {
  const partner: PartnerWarning[] = [];
  sel.forEach(id => {
    const pid = P[id]?.partner;
    if (!pid || !P[pid] || sel.includes(pid)) return;
    const where = status.playing[pid] ? '在 ' + status.playing[pid] + ' 比賽中' : status.queued.has(pid) ? '已在預備區' : '';
    partner.push({ id, partnerId: pid, where });
  });

  const repeat: RepeatWarning[] = [];
  for (let i = 0; i < sel.length; i++)
    for (let j = i + 1; j < sel.length; j++) {
      // 互相綁定的搭檔本來就會一起打，不列入重複警告
      if (P[sel[i]]?.partner === sel[j]) continue;
      const count = getPairCount(pairs, sel[i], sel[j]);
      if (count > 0) repeat.push({ a: sel[i], b: sel[j], count });
    }
  repeat.sort((x, y) => y.count - x.count);
  return { partner, repeat };
}

/** 個人應繳金額：依性別取價，優惠再扣折抵金額（最低 0） */
export function feeFor(p: Pick<Player, 'gender' | 'priceType'>, pr: Prices): number {
  const base = p.gender === '女' ? pr.female : pr.male;
  return Math.max(0, base - (p.priceType === 'discount' ? pr.discountOff : 0));
}
