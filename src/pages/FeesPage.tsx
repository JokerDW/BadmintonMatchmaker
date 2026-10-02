import { useState } from 'react';
import { useStore } from '../store';
import type { FeeFilter, Player, PriceType } from '../types';
import { byName, money } from '../lib/format';
import { Segmented } from '../components/Segmented';

export function FeesPage() {
  const { data, ui, status, actions } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const pr = data.prices;
  const players = data.players;

  const price = (p: Player) => (p.priceType === 'discount' ? pr.discount : pr.normal);
  const total = players.reduce((a, p) => a + price(p), 0);
  const paid = players.filter(p => p.paid);
  const got = paid.reduce((a, p) => a + price(p), 0);
  const discN = players.filter(p => p.priceType === 'discount').length;
  const hostPs = players.filter(p => p.paid === 'host');
  const hostSum = hostPs.reduce((a, p) => a + price(p), 0);

  const rows = [...players]
    .sort((a, b) => (a.paid ? 1 : 0) - (b.paid ? 1 : 0) || byName(a, b))
    .filter(p => ui.feeFilter === 'all' || (ui.feeFilter === 'paid' ? p.paid : !p.paid));

  const stats = [
    { label: '應收', value: money(total), sub: `一般 ${players.length - discN} 人 · 優惠 ${discN} 人`, accent: false },
    { label: '已收', value: money(got), sub: `給團主 ${money(hostSum)}（${hostPs.length} 人）· 現場 ${money(got - hostSum)}（${paid.length - hostPs.length} 人）`, accent: true },
    { label: '未收', value: money(total - got), sub: `${players.length - paid.length} 人`, accent: false },
  ];

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 1100, width: '100%' }}>
      <div className="section-head">
        <div className="title-group">
          <h2>收費管理</h2>
          <span className="meta">已收 {paid.length} / {players.length} 人</span>
        </div>
        <div className="actions" style={{ gap: 'var(--space-3)' }}>
          {(['normal', 'discount'] as const).map(k => (
            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              {k === 'normal' ? '一般價' : '優惠價'}
              <input className="input num" type="number" min={0} step={10} value={pr[k]} style={{ width: 90 }}
                onChange={e => actions.setPrice(k, Number(e.target.value) || 0)} />
            </label>
          ))}
        </div>
      </div>

      <div className="stats">
        {stats.map(st => (
          <div key={st.label} className={'stat' + (st.accent ? ' accent' : '')}>
            <span className="card-kicker">{st.label}</span>
            <span className="value">{st.value}</span>
            <span className="num muted" style={{ fontSize: 12 }}>{st.sub}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <Segmented<FeeFilter> name="feeflt" value={ui.feeFilter}
          options={[['all', '全部'], ['unpaid', '未收'], ['paid', '已收']]} onChange={actions.setFeeFilter} />
        <button className="btn btn-ghost" disabled={paid.length === 0} onBlur={() => setConfirmReset(false)}
          onClick={() => {
            if (!confirmReset) { setConfirmReset(true); return; }
            actions.resetFees(); setConfirmReset(false);
          }}>
          {confirmReset ? '確定重置？' : '重置收費狀態'}
        </button>
      </div>

      {rows.length > 0 && (
        <div className="table-wrap">
          <table className="table num">
            <thead>
              <tr>
                <th>姓名</th><th>性別</th><th>今日場次</th><th>價格方案</th>
                <th style={{ textAlign: 'right' }}>金額</th><th style={{ textAlign: 'right' }}>收費</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(p => (
                <tr key={p.id} style={{ opacity: p.paid ? 0.6 : 1 }}>
                  <td className="name-cell">{p.name}</td>
                  <td>{p.gender}</td>
                  <td>{status.games[p.id] || 0}</td>
                  <td>
                    <Segmented<PriceType> name={'pt-' + p.id} value={p.priceType || 'normal'}
                      options={[['normal', '一般'], ['discount', '優惠']]}
                      onChange={k => actions.setPlayerFee(p.id, { priceType: k })} />
                  </td>
                  <td style={{ textAlign: 'right' }}>{money(price(p))}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 'var(--space-2)' }}>
                      {p.paid ? (
                        <>
                          <span className="tag tag-accent">✓ {p.paid === 'host' ? '已給團主' : '現場繳費'}</span>
                          <button className="btn btn-ghost" style={{ fontSize: 13 }}
                            onClick={() => actions.setPlayerFee(p.id, { paid: false })}>取消</button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-primary" onClick={() => actions.setPlayerFee(p.id, { paid: 'host' })}>給團主</button>
                          <button className="btn btn-primary" onClick={() => actions.setPlayerFee(p.id, { paid: 'onsite' })}>現場繳費</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length === 0 && <p className="muted" style={{ margin: 0, fontStyle: 'italic' }}>沒有符合的球員</p>}
    </section>
  );
}
