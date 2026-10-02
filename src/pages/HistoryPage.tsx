import { useStore } from '../store';
import { hm, mins, pad } from '../lib/format';

export function HistoryPage() {
  const { data, P } = useStore();
  // 刪除成員後歷史紀錄存的是姓名，所以查不到 id 時直接顯示原值
  const name = (id: string) => (P[id] ? P[id].name : id);
  const rows = [...data.history].reverse();

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: 1100, width: '100%' }}>
      <div className="section-head" style={{ justifyContent: 'flex-start' }}>
        <h2>對戰紀錄</h2>
        <span className="meta">今日已完成 {data.history.length} 場</span>
      </div>
      {rows.length === 0 ? (
        <p className="muted" style={{ margin: 0, fontStyle: 'italic' }}>今天還沒有完成的比賽</p>
      ) : (
        <div className="table-wrap">
          <table className="table num">
            <thead>
              <tr><th>場次</th><th>場地</th><th>A 隊</th><th></th><th>B 隊</th><th>時間</th><th>時長</th><th>來源</th></tr>
            </thead>
            <tbody>
              {rows.map((h, i) => (
                <tr key={h.id}>
                  <td style={{ fontFamily: 'var(--font-heading)', fontSize: 18 }}>{pad(rows.length - i)}</td>
                  <td>{h.court}</td>
                  <td>{h.a.map(name).join('、')}</td>
                  <td className="vs">vs</td>
                  <td>{h.b.map(name).join('、')}</td>
                  <td>{hm(h.start)}–{hm(h.end)}</td>
                  <td>{mins(h.end - h.start)}</td>
                  <td><span className={'tag ' + (h.resId ? 'tag-accent' : 'tag-neutral')}>{h.resId ? '預約' : '手動'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
