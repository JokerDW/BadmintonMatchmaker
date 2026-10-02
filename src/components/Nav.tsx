import { useStore } from '../store';
import type { TabKey } from '../types';
import { todayLabel } from '../lib/format';
import { GearIcon } from './Icons';

export function Nav() {
  const { data, ui, now, status, actions } = useStore();
  const tabs: [TabKey, string, number][] = [
    ['players', '球員管理', data.players.length - status.queued.size],
    ['courts', '場地管理', data.courts.length],
    ['history', '對戰紀錄', data.history.length],
    ['reserve', '預約紀錄', data.reservations.filter(r => r.status === 'pending').length],
    ['fees', '收費管理', data.players.filter(p => !p.paid).length],
  ];

  return (
    <nav className="nav app-nav">
      <div className="nav-brand" style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
        <span style={{ fontSize: 24 }}>羽球排場</span>
        <span className="num" style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 12, color: 'var(--color-neutral-700)' }}>
          {todayLabel(now)}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
        {tabs.map(([k, label, count]) => {
          const current = ui.tab === k;
          return (
            <a
              key={k}
              href={'#' + k}
              aria-current={current ? 'page' : undefined}
              onClick={e => { e.preventDefault(); actions.setTab(k); }}
              style={{
                display: 'flex', alignItems: 'baseline', gap: 6, padding: '4px 0',
                borderBottom: '1px solid ' + (current ? 'var(--color-accent)' : 'transparent'),
              }}
            >
              <span>{label}</span>
              <span className="num" style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>{count}</span>
            </a>
          );
        })}
        <button className="btn btn-ghost" title="設定" style={{ padding: '4px 6px' }} onClick={actions.openSettings}>
          <GearIcon size={16} />
          設定
        </button>
      </div>
    </nav>
  );
}
