import { useMemo } from 'react';
import { useStore } from '../store';
import { getPairCount, pairCounts } from '../lib/logic';
import { SelectionWarnings } from '../components/SelectionWarnings';
import type { Player, SortKey } from '../types';
import { byName } from '../lib/format';
import { Segmented } from '../components/Segmented';
import { QueueCard } from '../components/QueueCard';
import { ArrowRightIcon, LinkIcon, PencilIcon, PlusIcon } from '../components/Icons';

export function PlayersPage() {
  const { data, ui, P, status, nm, eligible, actions } = useStore();
  const { queued, playing, games } = status;
  const g = (id: string) => games[id] || 0;

  const sorters: Record<SortKey, (a: Player, b: Player) => number> = {
    games: (a, b) => g(a.id) - g(b.id) || b.level - a.level,
    level: (a, b) => b.level - a.level || g(a.id) - g(b.id),
    name: byName,
  };
  // 已在預備區的球員不顯示；場上的排到最後
  const visible = data.players.filter(p => !queued.has(p.id));
  const sorted = [...visible].sort(
    (a, b) => (playing[a.id] ? 1 : 0) - (playing[b.id] ? 1 : 0) || sorters[ui.sort](a, b),
  );
  const sel = ui.sel.filter(eligible);
  const pairs = useMemo(() => pairCounts(data.history), [data.history]);
  /** 這位球員和目前已選的人今天同場過幾次 */
  const meetWithSel = (id: string) =>
    sel.filter(x => x !== id && P[id]?.partner !== x).map(x => ({ x, n: getPairCount(pairs, id, x) })).filter(m => m.n > 0);

  return (
    <div className="split">
      <section>
        <div className="section-head">
          <div className="title-group">
            <h2>今日球員</h2>
            <span className="meta">可安排 {visible.filter(p => !playing[p.id]).length} · 場上 {Object.keys(playing).length}</span>
          </div>
          <div className="actions">
            <Segmented<SortKey> name="sort" value={ui.sort}
              options={[['games', '場次少優先'], ['level', '程度'], ['name', '姓名']]} onChange={actions.setSort} />
            <button className="btn btn-secondary" onClick={() => actions.openDialog(null)}>
              <PlusIcon />新增球員
            </button>
          </div>
        </div>

        <div className="sel-bar">
          <span className="count">已選 {sel.length} / 4</span>
          <div className="chips">
            {sel.map(id => <span key={id} className="tag tag-accent">{nm(id)}</span>)}
            {sel.length === 0 && (
              <span className="hint">點選四位球員組成一組</span>
            )}
          </div>
          <button className="btn btn-ghost" disabled={sel.length === 0} onClick={actions.clearSel}>清除</button>
          <button className="btn btn-primary" disabled={sel.length !== 4} onClick={() => actions.addQueue(sel)}>
            加入預備區<ArrowRightIcon />
          </button>
          <SelectionWarnings sel={sel} />
        </div>

        {data.players.length === 0 && <p className="empty">還沒有球員，按「新增球員」或到設定批次匯入</p>}

        <div className="player-grid">
          {sorted.map(p => {
            const on = sel.includes(p.id);
            const busy = !!playing[p.id];
            const partner = p.partner && P[p.partner];
            const meets = on ? [] : meetWithSel(p.id);
            return (
              <div
                key={p.id}
                className={['card', 'player-card', 'clickable', busy && 'busy', on && 'selected'].filter(Boolean).join(' ')}
                onClick={() => actions.toggleIn('sel', p.id, eligible)}
                aria-pressed={on}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div className="card-title" style={{ fontSize: 20 }}>{p.name}</div>
                  <button className="btn btn-ghost icon-btn" title="編輯"
                    onClick={e => { e.stopPropagation(); actions.openDialog(p); }}>
                    <PencilIcon size={13} />
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="tag tag-accent num">Lv.{p.level}</span>
                  <span className="tag tag-neutral">{p.gender}</span>
                  {busy && <span className="tag tag-outline">場上 · {playing[p.id]}</span>}
                </div>
                {meets.length > 0 && (
                  <div className="meet num">已同場：{meets.map(m => `${nm(m.x)} ${m.n} 次`).join('、')}</div>
                )}
                <div className="foot">
                  <span className="partner">
                    <LinkIcon size={12} />
                    <span title={partner ? '綁定 ' + partner.name : undefined}>{partner ? partner.name : '未綁定'}</span>
                  </span>
                  <span className="num" style={{ whiteSpace: 'nowrap' }}>
                    今日 <span className="games-num">{g(p.id)}</span> 場
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <aside>
        <div className="section-head">
          <h2>預備區</h2>
          <span className="meta">{data.queue.length} 組等待中</span>
        </div>
        {data.queue.length === 0 && <p className="empty">預備區是空的</p>}
        {data.queue.map((q, i) => <QueueCard key={q.id} q={q} index={i} mode="manage" />)}
      </aside>
    </div>
  );
}
