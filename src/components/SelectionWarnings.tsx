import { useMemo } from 'react';
import { useStore } from '../store';
import { pairCounts, selectionWarnings } from '../lib/logic';
import { AlertIcon } from './Icons';

/** 勾選球員時的警告：指定隊友沒一起選、兩人今天已同場幾次。只提醒，不會擋住操作。 */
export function SelectionWarnings({ sel }: { sel: string[] }) {
  const { data, P, status, nm } = useStore();
  const pairs = useMemo(() => pairCounts(data.history), [data.history]);
  const { partner, repeat } = selectionWarnings(sel, P, status, pairs);
  if (!partner.length && !repeat.length) return null;

  return (
    <ul className="warnings" role="status">
      {partner.map(w => (
        <li key={'p' + w.id}>
          <AlertIcon size={13} />
          <span>
            <b>{nm(w.id)}</b> 的指定隊友 <b>{nm(w.partnerId)}</b> 沒有一起選{w.where && `（${w.where}）`}
          </span>
        </li>
      ))}
      {repeat.map(w => (
        <li key={'r' + w.a + w.b}>
          <AlertIcon size={13} />
          <span>
            <b>{nm(w.a)}</b> 和 <b>{nm(w.b)}</b> 今天已經同場 <b className="num">{w.count}</b> 次
          </span>
        </li>
      ))}
    </ul>
  );
}
