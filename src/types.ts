export type Gender = '男' | '女';
export type PriceType = 'normal' | 'discount';
export type PaidMethod = false | 'host' | 'onsite';

export interface Player {
  id: string;
  name: string;
  gender: Gender;
  level: number;
  /** 綁定同隊球員的 id，空字串代表未綁定 */
  partner: string;
  priceType?: PriceType;
  paid?: PaidMethod;
}

/** 兩隊，各兩位球員 id（刪除成員後，歷史紀錄會改存姓名） */
export interface Teams {
  a: string[];
  b: string[];
}

export interface Match extends Teams {
  start: number;
  resId: string | null;
}

export interface Court {
  id: string;
  name: string;
  match: Match | null;
}

export interface QueueItem extends Teams {
  id: string;
  createdAt: number;
  resId: string | null;
}

export interface HistoryItem extends Teams {
  id: string;
  court: string;
  start: number;
  end: number;
  resId: string | null;
}

export type ReservationStatus = 'pending' | 'queued' | 'playing' | 'done';

export interface Reservation {
  id: string;
  ids: string[];
  status: ReservationStatus;
}

export interface Prices {
  /** 男生費用 */
  male: number;
  /** 女生費用 */
  female: number;
  /** 優惠折抵金額（從原價扣掉） */
  discountOff: number;
}

/** 會寫入 localStorage 的資料 */
export interface PersistedData {
  players: Player[];
  history: HistoryItem[];
  courts: Court[];
  queue: QueueItem[];
  reservations: Reservation[];
  seq: number;
  prices: Prices;
}

export type TabKey = 'players' | 'courts' | 'history' | 'reserve' | 'fees';
export type SortKey = 'games' | 'level' | 'name';
export type FeeFilter = 'all' | 'unpaid' | 'paid';

export interface PlayerForm {
  mode: 'add' | 'edit';
  id: string | null;
  name: string;
  level: string;
  gender: Gender;
  partner: string;
}
