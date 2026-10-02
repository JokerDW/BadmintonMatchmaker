import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { byName, hm, mins, pad } from '../lib/format';
import { XIcon } from '../components/Icons';

type Tally = { id: string; n: number }[];

/** 統計某位球員今天的同隊與對手次數 */
function tally(rows: { a: string[]; b: string[] }[], who: string) {
  const mates: Record<string, number> = {};
  const opps: Record<string, number> = {};
  rows.forEach(h => {
    const mine = h.a.includes(who) ? h.a : h.b;
    const theirs = mine === h.a ? h.b : h.a;
    mine.filter(id => id !== who).forEach(id => (mates[id] = (mates[id] || 0) + 1));
    theirs.forEach(id => (opps[id] = (opps[id] || 0) + 1));
  });
  const sort = (m: Record<string, number>): Tally =>
    Object.entries(m).map(([id, n]) => ({ id, n })).sort((x, y) => y.n - x.n);
  return { mates: sort(mates), opps: sort(opps) };
}

export function HistoryPage() {
  const { data, P } = useStore();
  const [who, setWho] = useState('');
  // 刪除成員後歷史紀錄存的是姓名，所以查不到 id 時直接顯示原值
  const name = (id: string) => (P[id] ? P[id].name : id);

  // 下拉選單：今天有打過的人在前（附場次），其餘球員在後
  const options = useMemo(() => {
    const games: Record<string, number> = {};
    data.history.forEach(h => [...h.a, ...h.b].forEach(id => (games[id] = (games[id] || 0) + 1)));
    const ids = new Set([...Object.keys(games), ...data.players.map(p => p.id)]);
    return [...ids]
      .map(id => ({ id, name: name(id), n: games[id] || 0 }))
      .sort((x, y) => (y.n > 0 ? 1 : 0) - (x.n > 0 ? 1 : 0) || byName(x, y));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.history, data.players]);

  const all = [...data.history].reverse().map((h, i, arr) => ({ ...h, no: arr.length - i }));
  const rows = who ? all.filter(h => h.a.includes(who) || h.b.includes(who)) : all;
  const stats = who ? tally(rows, who) : null;

  const nameEl = (id: string) => (
    <button key={id} className={'name-link' + (id === who ? ' me' : '')} onClick={() => setWho(id === who ? '' : id)}
      title={id === who ? '取消篩選' : `只看 ${name(id)} 的場次`}>
      {name(id)}
    </button>
  );
  const team = (ids: string[]) => ids.map((id, i) => <span key={id}>{i > 0 && '、'}{nameEl(id)}</span>);
  const list = (t: Tally) =>
    t.length ? t.map(({ id, n }) => <span key={id} className="tally">{nameEl(id)} <b className="num">×{n}</b></span>) : <span className="muted">—</span>;

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: 1100, width: '100%' }}>
      <div className="section-head">
        <div className="title-group">
          <h2>對戰紀錄</h2>
          <span className="meta">今日已完成 {data.history.length} 場</span>
        </div>
        <div className="actions">
          <label className="small muted" htmlFor="hist-who">球員</label>
          <select id="hist-who" className="input" style={{ width: 'auto', minWidth: 160 }} value={who} onChange={e => setWho(e.target.value)}>
            <option value="">全部球員</option>
            {options.map(o => (
              <option key={o.id} value={o.id}>{o.name}{o.n ? `（${o.n} 場）` : '（未上場）'}</option>
            ))}
          </select>
          {who && (
            <button className="btn btn-ghost" onClick={() => setWho('')}><XIcon size={13} />清除</button>
          )}
        </div>
      </div>

      {stats && (
        <div className="hist-summary">
          <div className="hist-summary-title">
            <span className="heading-font" style={{ fontSize: 22 }}>{name(who)}</span>
            <span className="muted num">今天 {rows.length} 場</span>
          </div>
          <div className="hist-summary-row"><span className="card-kicker">同隊</span><div>{list(stats.mates)}</div></div>
          <div className="hist-summary-row"><span className="card-kicker">對手</span><div>{list(stats.opps)}</div></div>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="muted" style={{ margin: 0, fontStyle: 'italic' }}>
          {who ? `${name(who)} 今天還沒有完成的比賽` : '今天還沒有完成的比賽'}
        </p>
      ) : (
        <div className="table-wrap">
          <table className="table num">
            <thead>
              <tr><th>場次</th><th>場地</th><th>A 隊</th><th></th><th>B 隊</th><th>時間</th><th>時長</th><th>來源</th></tr>
            </thead>
            <tbody>
              {rows.map(h => (
                <tr key={h.id}>
                  <td style={{ fontFamily: 'var(--font-heading)', fontSize: 18 }}>{pad(h.no)}</td>
                  <td>{h.court}</td>
                  <td>{team(h.a)}</td>
                  <td className="vs">vs</td>
                  <td>{team(h.b)}</td>
                  <td>{hm(h.start)}–{hm(h.end)}</td>
                  <td>{mins(h.end - h.start)}</td>
                  <td><span className={'tag ' + (h.resId ? 'tag-accent' : 'tag-neutral')}>{h.resId ? '預約' : '手動'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!who && rows.length > 0 && <p className="small muted" style={{ margin: 0 }}>點表格裡的名字，可以只看那位球員的場次。</p>}
    </section>
  );
}
