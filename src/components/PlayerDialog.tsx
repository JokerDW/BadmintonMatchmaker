import { useEscape } from '../lib/useEscape';
import { useStore } from '../store';
import type { Gender } from '../types';
import { Segmented } from './Segmented';

export function PlayerDialog() {
  const { data, ui, nm, actions } = useStore();
  const d = ui.dialog;

  useEscape(!!d, actions.closeDialog);

  if (!d) return null;
  const invalid = !d.name.trim() || d.level === '' || isNaN(Number(d.level));
  const partnerOpts = data.players.filter(p => p.id !== d.id);

  return (
    <div className="dialog-backdrop" onClick={actions.closeDialog}>
      <form
        className="dialog"
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
        onSubmit={e => { e.preventDefault(); actions.saveDialog(); }}
      >
        <div className="dialog-title">{d.mode === 'edit' ? '編輯球員' : '新增球員'}</div>
        <div className="field">
          <label htmlFor="pd-name">姓名</label>
          <input id="pd-name" className="input" autoFocus value={d.name} placeholder="球員姓名"
            onChange={e => actions.setForm({ name: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="pd-level">程度</label>
          <input id="pd-level" className="input num" type="number" min={0} step={1} inputMode="numeric"
            value={d.level} placeholder="例如 3" onChange={e => actions.setForm({ level: e.target.value })} />
        </div>
        <div className="field">
          <label>性別</label>
          <Segmented<Gender> name="gd" value={d.gender} options={[['男', '男'], ['女', '女']]}
            onChange={g => actions.setForm({ gender: g })} />
        </div>
        <div className="field">
          <label htmlFor="pd-partner">綁定同隊球員</label>
          <select id="pd-partner" className="input" value={d.partner} onChange={e => actions.setForm({ partner: e.target.value })}>
            <option value="">不綁定</option>
            {partnerOpts.map(p => (
              <option key={p.id} value={p.id}>
                {p.name + (p.partner && p.partner !== d.id ? '（已綁定 ' + nm(p.partner) + '）' : '')}
              </option>
            ))}
          </select>
        </div>
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={actions.closeDialog}>取消</button>
          <button type="submit" className="btn btn-primary" disabled={invalid}>儲存</button>
        </div>
      </form>
    </div>
  );
}
