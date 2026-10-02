import { useState } from 'react';
import { useStore } from '../store';
import type { ReservationStatus } from '../types';
import { resLabel } from '../lib/logic';

const ST: Record<ReservationStatus, [string, string]> = {
  pending: ['待安排', 'tag-res'],
  queued: ['預備中', 'tag-accent'],
  playing: ['比賽中', 'tag-accent'],
  done: ['已完成', 'tag-neutral'],
};
const ORDER: Record<ReservationStatus, number> = { pending: 0, queued: 1, playing: 2, done: 3 };

/** 預約紀錄：只用來看與刪除。建立預約在「球員管理」選好 4 人後按「存成預約」。 */
export function ReservePage() {
  const { data, status, nm, actions } = useStore();
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const list = [...data.reservations].sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.no - b.no);
  const count = (s: ReservationStatus) => data.reservations.filter(r => r.status === s).length;

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: 1100, width: '100%' }}>
      <div className="section-head">
        <div className="title-group">
          <h2>預約紀錄</h2>
          <span className="meta">
            待安排 {count('pending')} · 預備／比賽中 {count('queued') + count('playing')} · 已完成 {count('done')}
          </span>
        </div>
      </div>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>
        到「球員管理」選好 4 人後按「存成預約」即可新增；待安排的預約會顯示在球員管理右側，可一鍵排入預備區。
      </p>

      {list.length === 0 ? (
        <p className="empty">尚無預約</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>編號</th><th>球員</th><th>狀態</th><th style={{ textAlign: 'right' }}></th></tr>
            </thead>
            <tbody>
              {list.map(r => {
                const where = r.status === 'playing' ? status.playing[r.ids[0]] : '';
                return (
                  <tr key={r.id} style={{ opacity: r.status === 'done' ? 0.55 : 1 }}>
                    <td className="name-cell num" style={{ whiteSpace: 'nowrap' }}>{resLabel(r)}</td>
                    <td>{r.ids.map(nm).join('、')}</td>
                    <td><span className={'tag ' + ST[r.status][1]}>{ST[r.status][0]}{where && ' · ' + where}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      {r.status === 'pending' && (
                        <button className="btn btn-ghost" onBlur={() => setConfirmDel(null)}
                          onClick={() => (confirmDel === r.id ? actions.deleteReservation(r.id) : setConfirmDel(r.id))}>
                          {confirmDel === r.id ? '確定刪除？' : '刪除'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
