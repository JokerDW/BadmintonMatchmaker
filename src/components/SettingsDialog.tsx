import { useRef, useState } from 'react';
import { useStore } from '../store';
import { parseImport } from '../lib/logic';
import { isValidData, normalize } from '../lib/storage';
import { useEscape } from '../lib/useEscape';
import { XIcon } from './Icons';

const IMPORT_PLACEHOLDER = `男
阿滴 10
凱勛 10

女
小鹿 9
Rita 9`;

type ConfirmKind = 'history' | 'members' | null;

export function SettingsDialog() {
  const { data, ui, actions } = useStore();
  const open = ui.settingsOpen;
  const [importText, setImportText] = useState('');
  const [msg, setMsg] = useState('');
  const [confirm, setConfirm] = useState<ConfirmKind>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const close = () => { setConfirm(null); setMsg(''); actions.closeSettings(); };
  useEscape(open, close);
  if (!open) return null;

  const rows = parseImport(importText, data.players.map(p => p.name));

  /** 第一次按下變成「確定？」，第二次才執行 */
  const ask = (kind: Exclude<ConfirmKind, null>, fn: () => void) => {
    if (confirm !== kind) { setConfirm(kind); return; }
    fn();
    setConfirm(null);
  };

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    const d = new Date();
    a.href = URL.createObjectURL(blob);
    a.download = `羽球排場備份-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importBackup = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      if (!isValidData(parsed)) throw new Error('bad');
      actions.replaceData(normalize(parsed));
      setMsg('已從備份還原');
    } catch {
      setMsg('備份檔格式不正確');
    }
  };

  return (
    <div className="dialog-backdrop" onClick={close}>
      <div className="dialog settings-dialog" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div className="dialog-title">設定</div>
          <button className="btn btn-ghost" title="關閉" style={{ padding: '2px 4px' }} onClick={close}>
            <XIcon size={14} />
          </button>
        </div>

        <div className="settings-block">
          <span className="card-kicker">批次匯入球員</span>
          <p style={{ margin: 0, fontSize: 13 }} className="muted">
            單獨一行「男」或「女」作為分組標題，其下每行一位：姓名 程度。也可在同一行寫性別。已存在的姓名會略過。
          </p>
          <textarea
            className="input" rows={8} value={importText} placeholder={IMPORT_PLACEHOLDER}
            onChange={e => { setImportText(e.target.value); setMsg(''); }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span className="num" style={{ fontSize: 12, color: 'var(--color-accent-700)' }}>{msg}</span>
            <button
              className="btn btn-primary" disabled={rows.length === 0}
              onClick={() => { const n = actions.importPlayers(rows); setImportText(''); setMsg('已匯入 ' + n + ' 位球員'); }}
            >
              匯入 {rows.length} 位
            </button>
          </div>
        </div>

        <div className="settings-row">
          <div className="desc">
            <span className="card-kicker">備份與還原</span>
            <span>資料只存在這台裝置的瀏覽器，可匯出 JSON 帶到其他裝置</span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="btn btn-secondary" onClick={exportBackup}>匯出</button>
            <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>還原</button>
            <input
              ref={fileRef} type="file" accept="application/json,.json" hidden
              onChange={e => { const f = e.target.files?.[0]; if (f) importBackup(f); e.target.value = ''; }}
            />
          </div>
        </div>

        <div className="settings-row">
          <div className="desc">
            <span className="card-kicker">清空對戰紀錄</span>
            <span className="num">共 {data.history.length} 場，球員今日場次歸零</span>
          </div>
          <button className="btn btn-secondary" disabled={data.history.length === 0}
            onClick={() => ask('history', actions.clearHistory)}>
            {confirm === 'history' ? '確定清空？' : '清空'}
          </button>
        </div>

        <div className="settings-row">
          <div className="desc">
            <span className="card-kicker">刪除所有成員</span>
            <span className="num">共 {data.players.length} 位，同時清除預備區、場上比賽與預約</span>
          </div>
          <button className="btn btn-secondary" disabled={data.players.length === 0}
            onClick={() => ask('members', actions.deleteAllMembers)}>
            {confirm === 'members' ? '確定刪除？' : '全部刪除'}
          </button>
        </div>
      </div>
    </div>
  );
}
