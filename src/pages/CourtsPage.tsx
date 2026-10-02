import { useStore } from '../store';
import { hm, mmss, pad } from '../lib/format';
import { QueueCard } from '../components/QueueCard';
import { FlagIcon, PlusIcon, TrashIcon } from '../components/Icons';

export function CourtsPage() {
  const { data, ui, now, nm, stillPlaying, actions } = useStore();
  const pickedNo = data.queue.findIndex(q => q.id === ui.pickedQ);
  const picked = pickedNo >= 0 ? data.queue[pickedNo] : null;
  const pickedBusy = picked ? stillPlaying([...picked.a, ...picked.b]) : [];
  const pickedReady = !!picked && pickedBusy.length === 0;
  const freeCourts = data.courts.filter(c => !c.match).length;

  return (
    <div className="split">
      <section style={{ flex: '1 1 560px' }}>
        <div className="section-head">
          <div className="title-group">
            <h2>今日場地</h2>
            <span className="meta">空場 {freeCourts} · 比賽中 {data.courts.length - freeCourts}</span>
          </div>
          <button className="btn btn-secondary" onClick={actions.addCourt}><PlusIcon />新增場地</button>
        </div>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          {picked && !pickedReady
            ? `第 ${pad(pickedNo + 1)} 組的 ${pickedBusy.map(nm).join('、')} 還在場上，等他們的比賽結束後才能安排。`
            : picked
            ? `已選取第 ${pad(pickedNo + 1)} 組，點選任一空場地讓他們上場。`
            : '先在右側預備區點選一組，再點選空場地安排上場；比賽結束後按「結束比賽」讓球員下場。'}
        </p>
        {data.courts.length === 0 && <p className="empty">還沒有場地，按「新增場地」</p>}

        <div className="court-grid">
          {data.courts.map(c => {
            const m = c.match;
            const free = !m;
            const canDrop = free && pickedReady;
            return (
              <div
                key={c.id}
                className={'card' + (canDrop ? ' clickable selected' : '')}
                style={{ gap: 'var(--space-3)' }}
                onClick={() => { if (canDrop) actions.assign(c.id); }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <span className="card-title" style={{ fontSize: 22 }}>{c.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span className={'tag num ' + (free ? 'tag-neutral' : 'tag-accent')}>
                      {free ? '空場' : '比賽中 ' + mmss(now - m.start)}
                    </span>
                    {free && (
                      <button className="btn btn-ghost icon-btn" title="移除場地"
                        onClick={e => { e.stopPropagation(); actions.removeCourt(c.id); }}>
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                </div>

                <div
                  className={'court' + (free ? ' free' : '') + (canDrop ? ' droppable' : '')}
                  style={{ color: free && !canDrop ? 'var(--color-neutral-400)' : 'var(--color-accent)' }}
                >
                  <div className="line net" />
                  <div className="line service-l" />
                  <div className="line service-r" />
                  <div className="line center" />
                  {m ? (
                    <>
                      <div className="half" style={{ color: 'var(--color-text)' }}><span>{nm(m.a[0])}</span><span>{nm(m.a[1])}</span></div>
                      <div className="half" style={{ color: 'var(--color-text)' }}><span>{nm(m.b[0])}</span><span>{nm(m.b[1])}</span></div>
                    </>
                  ) : (
                    <div className="free-label">
                      <span>{canDrop ? `安排第 ${pad(pickedNo + 1)} 組上場` : '空場'}</span>
                    </div>
                  )}
                </div>

                {m && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span className="card-meta num">{hm(m.start)} 開始</span>
                    <button className="btn btn-primary" onClick={e => { e.stopPropagation(); actions.endMatch(c.id); }}>
                      <FlagIcon />結束比賽
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <aside style={{ flex: '1 1 340px' }}>
        <div className="section-head">
          <h2>預備區</h2>
          <span className="meta">點選一組以安排上場</span>
        </div>
        {data.queue.length === 0 && <p className="empty">預備區是空的，請先到球員管理組隊</p>}
        {data.queue.map((q, i) => <QueueCard key={q.id} q={q} index={i} mode="pick" />)}
      </aside>
    </div>
  );
}
