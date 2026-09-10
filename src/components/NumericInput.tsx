import { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { cx } from './ui';

interface Props {
  unit?: string;
  revealed: boolean;
  correct?: boolean;
  disabled?: boolean;
  onSubmit: (value: number) => void;
  initial?: string;
}

export function NumericInput({ unit, revealed, correct, disabled, onSubmit, initial }: Props) {
  const [value, setValue] = useState(initial ?? '');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!revealed) ref.current?.focus();
  }, [revealed]);

  const submit = () => {
    const v = parseFloat(value.replace(/[$,%\s]/g, ''));
    if (!Number.isFinite(v)) return;
    onSubmit(v);
  };

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div
        className={cx(
          'flex flex-1 items-center gap-2 rounded-xl border bg-surface px-4 py-3',
          !revealed && 'border-line focus-within:border-accent',
          revealed && correct && 'border-good bg-good/10',
          revealed && correct === false && 'border-bad bg-bad/10',
        )}
      >
        <input
          ref={ref}
          inputMode="decimal"
          type="text"
          value={value}
          disabled={disabled || revealed}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type your answer"
          className="w-full bg-transparent font-mono text-lg outline-none placeholder:text-muted"
          aria-label="Numeric answer"
        />
        {unit && <span className="shrink-0 text-sm text-muted">{unit}</span>}
        {revealed && (correct ? <Check className="text-good" size={18} /> : <X className="text-bad" size={18} />)}
      </div>
      {!revealed && (
        <button type="submit" className="btn-primary" disabled={disabled || !value.trim()}>
          Check
        </button>
      )}
    </form>
  );
}
