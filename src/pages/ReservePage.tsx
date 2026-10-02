import { useStore } from '../store';
import type { ReservationStatus } from '../types';
import { byName, pad } from '../lib/format';
import { makeTeams } from '../lib/logic';
import { TeamsView } from '../components/Teams';
import { CheckIcon } from '../components/Icons';

const ST: Record<ReservationStatus, [string, string]> = {
  pending: ['待安排', 'tag-outline'],
  queued: ['預備中', 'tag-accent'],
  playing: ['比賽中', 'tag-accent'],
  done: ['已完成', 'tag-neutral'],
};
const ORDER: Record<ReservationStatus, number> = { playing: 0, queued: 1, pending: 2, done: 3 };

export function ReservePage() {
  const { data, ui, P, status, nm, actions } = useStore();
  const { queued, playing, games } = status;
  const players = [...data.players].sort(byName);
  const doneCount = data.reservations.filter(r => r.status === 'done').length;

  const cards = data.reservations
    .map((r, i) => ({ r, no: pad(i + 1) }))
    .sort((x, y) => ORDER[x.r.status] - ORDER[y.r.status]);

  return (
    <div className="split">
      <section style={{ flex: '1 1 480px' }}>
        <div className="section-head">
          <h2>勾選球員</h2>
          <div className="actions">
            <span className="num muted" style={{ fontSize: 13 }}>已勾選 {ui.resSel.length} / 4</span>
            <button className="btn btn-ghost" disabled={ui.resSel.length === 0} onClick={actions.clearResSel}>清除</button>
            <button className="btn btn-primary" disabled={ui.resSel.length !== 4} onClick={actions.createReservation}>建立預約組合</button>
          </div>
        </div>
        {players.length === 0 && <p className="empty">還沒有球員</p>}
        <div className="res-grid">
          {players.map(p => {
            const on = ui.resSel.includes(p.id);
            return (
              <div key={p.id} className="res-row" role="checkbox" aria-checked={on}
                onClick={() => actions.toggleIn('resSel', p.id, () => true)}>
                <span className={'checkbox' + (on ? ' on' : '')}>{on && <CheckIcon size={13} />}</span>
                <span className="name">{p.name}</span>
                <span className="num muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                  Lv.{p.level} · {p.gender} · {games[p.id] || 0} 場
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <aside style={{ flex: '1 1 380px' }}>
        <div className="section-head">
          <h2>預約組合</h2>
          <span className="meta">共 {data.reservations.length} 組 · 已完成 {doneCount}</span>
        </div>
        {cards.length === 0 && <p className="empty">尚無預約組合</p>}
        {cards.map(({ r, no }) => {
          const t = makeTeams(r.ids, P);
          const clash = r.ids.find(id => queued.has(id) || playing[id]);
          const where = clash ? (playing[clash] ? '在 ' + playing[clash] + ' 比賽中' : '已在預備區') : '';
          const label = r.status === 'playing' ? '比賽中 · ' + (playing[r.ids[0]] || '') : ST[r.status][0];
          return (
            <div key={r.id} className="card" style={{ gap: 'var(--space-3)', opacity: r.status === 'done' ? 0.55 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span className="card-kicker num">預約 {no}</span>
                <span className={'tag ' + ST[r.status][1]}>{label}</span>
              </div>
              <TeamsView teams={t} nm={nm} />
              {r.status === 'pending' && (
                <div className="card-foot">
                  <span style={{ fontSize: 12, color: 'var(--color-accent-700)', fontStyle: 'italic' }}>
                    {clash ? nm(clash) + ' ' + where : ''}
                  </span>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button className="btn btn-ghost" onClick={() => actions.deleteReservation(r.id)}>刪除</button>
                    <button className="btn btn-primary" disabled={!!clash}
                      onClick={() => { if (!clash) actions.addQueue(r.ids, r.id); }}>加入預備區</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </aside>
    </div>
  );
}
