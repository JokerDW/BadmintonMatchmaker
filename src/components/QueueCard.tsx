import type { QueueItem } from '../types';
import { useStore } from '../store';
import { mins, pad } from '../lib/format';
import { TeamsView } from './Teams';
import { XIcon } from './Icons';

interface Props {
  q: QueueItem;
  index: number;
  /** 'manage' 顯示解除按鈕；'pick' 可點選以安排上場 */
  mode: 'manage' | 'pick';
}

export function QueueCard({ q, index, mode }: Props) {
  const { now, P, nm, ui, actions } = useStore();
  const picked = mode === 'pick' && ui.pickedQ === q.id;
  const levels = q.a.map(id => P[id]?.level).join('+') + ' 對 ' + q.b.map(id => P[id]?.level).join('+');
  const cls = ['card', mode === 'pick' && 'clickable', picked && 'selected'].filter(Boolean).join(' ');

  return (
    <div
      className={cls}
      style={{ gap: 'var(--space-3)' }}
      onClick={mode === 'pick' ? () => actions.pickQueue(q.id) : undefined}
      role={mode === 'pick' ? 'button' : undefined}
      aria-pressed={mode === 'pick' ? picked : undefined}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span className="card-kicker num">
          第 {pad(index + 1)} 組 · {q.resId ? '預約' : '手動'} · 等 {mins(now - q.createdAt)}
        </span>
        {mode === 'manage' && (
          <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => actions.removeQueue(q.id)}>
            <XIcon size={13} />
            解除
          </button>
        )}
        {picked && <span className="tag tag-outline">已選取</span>}
      </div>
      <TeamsView teams={q} nm={nm} />
      <div className="card-meta num">程度 {levels}</div>
    </div>
  );
}
