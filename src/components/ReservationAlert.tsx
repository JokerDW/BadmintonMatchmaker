import { useStore } from '../store';
import { pendingResByPlayer, resLabel, sameGroup } from '../lib/logic';
import type { Reservation } from '../types';
import { BookmarkIcon } from './Icons';

/**
 * 選人時的預約提醒（比一般警告更醒目）：
 * - 已選的 4 人剛好是某組預約 → 告知加入預備區會算這組預約
 * - 已選的人有其他預約 → 列出預約內容，可一鍵改選那組
 */
export function ReservationAlert({ sel }: { sel: string[] }) {
  const { data, nm, actions } = useStore();
  const byPlayer = pendingResByPlayer(data.reservations);

  const exact = data.reservations.find(r => r.status === 'pending' && sameGroup(r.ids, sel));
  if (exact) {
    return (
      <div className="res-alert match" role="status">
        <BookmarkIcon size={16} />
        <span>這 4 人就是 <b>{resLabel(exact)}</b>，加入預備區後這組預約就算安排了</span>
      </div>
    );
  }

  // 依預約整理：哪些已選的人屬於哪組預約
  const hits = new Map<string, { r: Reservation; who: string[] }>();
  sel.forEach(id => (byPlayer[id] || []).forEach(r => {
    const h = hits.get(r.id) || { r, who: [] };
    h.who.push(id);
    hits.set(r.id, h);
  }));
  if (hits.size === 0) return null;

  return (
    <div className="res-alerts" role="alert">
      {[...hits.values()].sort((a, b) => a.r.no - b.r.no).map(({ r, who }) => (
        <div key={r.id} className="res-alert">
          <BookmarkIcon size={16} />
          <span className="text">
            <b>{who.map(nm).join('、')}</b> 有 <b>{resLabel(r)}</b>：{r.ids.map(nm).join('、')}
          </span>
          <button className="btn btn-primary" onClick={() => actions.selectIds(r.ids)}>改選{resLabel(r)}</button>
        </div>
      ))}
    </div>
  );
}
