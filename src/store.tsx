import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  FeeFilter, PaidMethod, PersistedData, Player, PlayerForm, Prices, PriceType, SortKey, TabKey,
} from './types';
import { computeStatus, makeTeams, nextCourtName, toMap, type ImportRow, type PlayerMap, type Status } from './lib/logic';
import { loadData, saveData } from './lib/storage';

/** 只存在記憶體、不寫入 localStorage 的介面狀態 */
interface UiState {
  tab: TabKey;
  sort: SortKey;
  feeFilter: FeeFilter;
  /** 球員管理：已選取的球員 */
  sel: string[];
  /** 場地管理：已選取的預備組 */
  pickedQ: string | null;
  dialog: PlayerForm | null;
  settingsOpen: boolean;
}

const initialUi: UiState = {
  tab: 'players', sort: 'games', feeFilter: 'all',
  sel: [], pickedQ: null, dialog: null, settingsOpen: false,
};

let idCounter = 0;
const uid = (prefix: string) => prefix + ++idCounter + '_' + Date.now().toString(36);

function useSchedulerStore() {
  const [data, setData] = useState<PersistedData>(loadData);
  const [ui, setUi] = useState<UiState>(initialUi);
  const [now, setNow] = useState(() => Date.now());

  // 每秒更新，驅動比賽計時與等待時間
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => saveData(data), [data]);

  const P: PlayerMap = useMemo(() => toMap(data.players), [data.players]);
  const status: Status = useMemo(() => computeStatus(data), [data]);
  const nm = (id: string) => (P[id] ? P[id].name : '—');
  /** 可被選入新組合：不在預備區即可（正在場上的人也能先排進預備區） */
  const eligible = (id: string) => !status.queued.has(id);
  /** 這一組裡還在場上比賽的人 */
  const stillPlaying = (ids: string[]) => ids.filter(id => status.playing[id]);

  const patchUi = (p: Partial<UiState>) => setUi(u => ({ ...u, ...p }));

  const actions = {
    setTab: (tab: TabKey) => patchUi({ tab }),
    setSort: (sort: SortKey) => patchUi({ sort }),
    setFeeFilter: (feeFilter: FeeFilter) => patchUi({ feeFilter }),

    /** 點選球員；若有綁定搭檔且可選，會一併選入 */
    toggleIn(key: 'sel', id: string, canAddPartner: (id: string) => boolean) {
      setUi(u => {
        const sel = [...u[key]];
        if (sel.includes(id)) return { ...u, [key]: sel.filter(x => x !== id) };
        if (sel.length >= 4) return u;
        sel.push(id);
        const p = P[id];
        if (p && p.partner && P[p.partner] && !sel.includes(p.partner) && sel.length < 4 && canAddPartner(p.partner)) {
          sel.push(p.partner);
        }
        return { ...u, [key]: sel };
      });
    },
    clearSel: () => patchUi({ sel: [] }),
    /** 直接把已選換成某組預約的 4 人（已在預備區的人除外） */
    selectIds: (ids: string[]) => patchUi({ sel: ids.filter(id => !status.queued.has(id)) }),

    /** 四人組成一組加入預備區（resId 表示來自預約） */
    addQueue(ids: string[], resId: string | null = null) {
      const t = makeTeams(ids, P);
      const q = { id: uid('q'), a: t.a, b: t.b, createdAt: Date.now(), resId };
      setData(d => ({
        ...d,
        seq: d.seq + 1,
        queue: [...d.queue, q],
        reservations: d.reservations.map(r => (r.id === resId ? { ...r, status: 'queued' } : r)),
      }));
      setUi(u => ({ ...u, sel: resId ? u.sel.filter(x => !ids.includes(x)) : [] }));
    },

    removeQueue(qid: string) {
      setData(d => {
        const q = d.queue.find(x => x.id === qid);
        return {
          ...d,
          queue: d.queue.filter(x => x.id !== qid),
          reservations: d.reservations.map(r => (q && r.id === q.resId ? { ...r, status: 'pending' } : r)),
        };
      });
      setUi(u => ({ ...u, pickedQ: u.pickedQ === qid ? null : u.pickedQ }));
    },

    pickQueue: (qid: string) => setUi(u => ({ ...u, pickedQ: u.pickedQ === qid ? null : qid })),

    /** 把已選取的預備組安排到空場地 */
    assign(cid: string) {
      const qid = ui.pickedQ;
      if (!qid) return;
      setData(d => {
        const q = d.queue.find(x => x.id === qid);
        const court = d.courts.find(c => c.id === cid);
        if (!q || !court || court.match) return d;
        // 組內有人還在其他場地比賽，不能上場
        const onCourt = new Set(d.courts.flatMap(c => (c.match ? [...c.match.a, ...c.match.b] : [])));
        if ([...q.a, ...q.b].some(id => onCourt.has(id))) return d;
        return {
          ...d,
          queue: d.queue.filter(x => x.id !== qid),
          courts: d.courts.map(c => (c.id === cid ? { ...c, match: { a: q.a, b: q.b, start: Date.now(), resId: q.resId } } : c)),
          reservations: d.reservations.map(r => (r.id === q.resId ? { ...r, status: 'playing' } : r)),
        };
      });
      patchUi({ pickedQ: null });
    },

    endMatch(cid: string) {
      setData(d => {
        const c = d.courts.find(x => x.id === cid);
        if (!c || !c.match) return d;
        const m = c.match;
        return {
          ...d,
          seq: d.seq + 1,
          history: [...d.history, { id: uid('h'), court: c.name, a: m.a, b: m.b, start: m.start, end: Date.now(), resId: m.resId }],
          courts: d.courts.map(x => (x.id === cid ? { ...x, match: null } : x)),
          reservations: d.reservations.map(r => (r.id === m.resId ? { ...r, status: 'done' } : r)),
        };
      });
    },

    addCourt() {
      setData(d => ({
        ...d,
        seq: d.seq + 1,
        courts: [...d.courts, { id: uid('c'), name: nextCourtName(d.courts.map(c => c.name)), match: null }],
      }));
    },

    removeCourt(cid: string) {
      setData(d => ({ ...d, courts: d.courts.filter(x => x.id !== cid || x.match) }));
    },

    /** 把已選的 4 人存成預約 */
    createReservation(ids: string[]) {
      if (ids.length !== 4) return;
      setData(d => {
        const no = d.reservations.reduce((m, r) => Math.max(m, r.no || 0), 0) + 1;
        return { ...d, seq: d.seq + 1, reservations: [...d.reservations, { id: uid('r'), no, ids: [...ids], status: 'pending' }] };
      });
      patchUi({ sel: [] });
    },

    deleteReservation(rid: string) {
      setData(d => ({ ...d, reservations: d.reservations.filter(x => x.id !== rid) }));
    },

    // ── 球員編輯對話框 ──
    openDialog(p: Player | null) {
      patchUi({
        dialog: p
          ? { mode: 'edit', id: p.id, name: p.name, level: String(p.level), gender: p.gender, partner: p.partner || '' }
          : { mode: 'add', id: null, name: '', level: '3', gender: '男', partner: '' },
      });
    },
    setForm: (patch: Partial<PlayerForm>) => setUi(u => (u.dialog ? { ...u, dialog: { ...u.dialog, ...patch } } : u)),
    closeDialog: () => patchUi({ dialog: null }),

    /** 儲存球員；綁定關係為雙向，會自動解除舊的綁定 */
    saveDialog() {
      const f = ui.dialog;
      if (!f || !f.name.trim() || f.level === '' || isNaN(Number(f.level))) return;
      const id = f.id || uid('p');
      setData(d => {
        let players = f.id ? d.players : [...d.players, { id, name: '', gender: '男' as const, level: 3, partner: '' }];
        const old = players.find(p => p.id === id)?.partner || '';
        players = players.map(p => {
          if (p.id === id) return { ...p, name: f.name.trim(), level: Number(f.level) || 0, gender: f.gender, partner: f.partner };
          if (f.partner && p.id === f.partner) return { ...p, partner: id };
          if (p.partner === id && p.id !== f.partner) return { ...p, partner: '' };
          if (old && p.id === old && old !== f.partner) return { ...p, partner: '' };
          return p;
        });
        // 新搭檔原本綁定的人要解除
        players = players.map(p =>
          p.id !== id && p.id !== f.partner && f.partner && p.partner === f.partner ? { ...p, partner: '' } : p,
        );
        return { ...d, seq: d.seq + 1, players };
      });
      patchUi({ dialog: null });
    },

    // ── 收費 ──
    setPrice: (key: keyof Prices, v: number) =>
      setData(d => ({ ...d, prices: { ...d.prices, [key]: v } })),
    setPlayerFee: (id: string, patch: { priceType?: PriceType; paid?: PaidMethod }) =>
      setData(d => ({ ...d, players: d.players.map(x => (x.id === id ? { ...x, ...patch } : x)) })),
    resetFees: () => setData(d => ({ ...d, players: d.players.map(p => ({ ...p, paid: false })) })),

    // ── 設定 ──
    openSettings: () => patchUi({ settingsOpen: true }),
    closeSettings: () => patchUi({ settingsOpen: false }),

    importPlayers(rows: ImportRow[]) {
      const added: Player[] = rows.map(x => ({ id: uid('p'), name: x.name, gender: x.gender, level: x.level, partner: '' }));
      setData(d => ({ ...d, seq: d.seq + added.length, players: [...d.players, ...added] }));
      return added.length;
    },

    /** 清空對戰紀錄；已完成的預約退回待安排 */
    clearHistory() {
      setData(d => ({
        ...d,
        history: [],
        reservations: d.reservations.map(r => (r.status === 'done' ? { ...r, status: 'pending' } : r)),
      }));
    },

    /** 刪除所有成員；歷史紀錄改存姓名以保留可讀性 */
    deleteAllMembers() {
      setData(d => {
        const map = toMap(d.players);
        const name = (id: string) => (map[id] ? map[id].name : id);
        return {
          ...d,
          history: d.history.map(h => ({ ...h, a: h.a.map(name), b: h.b.map(name) })),
          players: [], queue: [], reservations: [],
          courts: d.courts.map(c => ({ ...c, match: null })),
        };
      });
      patchUi({ sel: [], pickedQ: null });
    },

    /** 從備份檔還原 */
    replaceData(d: PersistedData) {
      setData(d);
      setUi(u => ({ ...initialUi, tab: u.tab }));
    },
  };

  return { data, ui, now, P, status, nm, eligible, stillPlaying, actions };
}

export type Store = ReturnType<typeof useSchedulerStore>;

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useSchedulerStore();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore must be used inside <StoreProvider>');
  return s;
}
