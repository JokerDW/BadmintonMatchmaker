interface Props<K extends string> {
  name: string;
  value: K;
  options: [K, string][];
  onChange: (k: K) => void;
}

/** 分段單選（對應設計系統的 .seg） */
export function Segmented<K extends string>({ name, value, options, onChange }: Props<K>) {
  return (
    <div className="seg" role="radiogroup">
      {options.map(([k, label]) => (
        <label className="seg-opt" key={k}>
          <input type="radio" name={name} checked={value === k} onChange={() => onChange(k)} />
          <span>{label}</span>
        </label>
      ))}
    </div>
  );
}
