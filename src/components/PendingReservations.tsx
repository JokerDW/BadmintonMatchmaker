import { useState } from 'react';
import { useStore } from '../store';
import { resLabel } from '../lib/logic';

/** 球員管理右欄：待安排的預約，顯示能不能排、一鍵排入預備區 */
export function PendingReservations() {
  const { data, status, nm, actions } = useStore();
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const pending = data.reservations.filter(r => r.status === 'pending').sort((a, b) => a.no - b.no);
  if (pending.length === 0) return null;

  /** 同一場地的人合併：「王子豪、吳柏翰 在 A 場」；整組都在同一場就寫「4 人都在 A 場」 */
  const onCourtByCourt = (ids: string[]) => {
    const g: Record<string, string[]> = {};
    ids.forEach(id => (g[status.playing[id]] ||= []).push(id));
    return Object.entries(g)
      .map(([court, who]) => (who.length === 4 ? `4 人都在 ${court}` : `${who.map(nm).join('、')} 在 ${court}`))
      .join('；');
  };

  return (
    <>
      <div className="section-head">
        <h2>預約</h2>
        <span className="meta">{pending.length} 組待安排</span>
      </div>
      {pending.map(r => {
        const queued = r.ids.filter(id => status.queued.has(id));
        const onCourt = r.ids.filter(id => status.playing[id]);
        const ready = queued.length === 0 && onCourt.length === 0;
        const state = queued.length
          ? `${queued.map(nm).join('、')} 已在預備區`
          : onCourt.length
          ? onCourtByCourt(onCourt)
          : '4 人都有空';
        return (
          <div key={r.id} className={'card res-card' + (ready ? ' ready' : '')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span className="res-no">{resLabel(r)}</span>
              <span className={'tag ' + (ready ? 'tag-accent' : 'tag-neutral')}>{ready ? '可以上' : queued.length ? '有人在預備區' : '有人在場上'}</span>
            </div>
            <div className="res-names">{r.ids.map(id => <span key={id}>{nm(id)}</span>)}</div>
            <div className="card-foot">
              <span className="small muted">{state}</span>
              <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                <button className="btn btn-ghost" onBlur={() => setConfirmDel(null)}
                  onClick={() => (confirmDel === r.id ? actions.deleteReservation(r.id) : setConfirmDel(r.id))}>
                  {confirmDel === r.id ? '確定刪除？' : '刪除'}
                </button>
                <button className="btn btn-primary" disabled={queued.length > 0} onClick={() => actions.addQueue(r.ids, r.id)}>
                  排入預備區
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
