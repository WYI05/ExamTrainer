import { useState } from 'react';
import { Calculator as CalcIcon, Delete } from 'lucide-react';
import { Modal, cx } from './ui';

// ---------------------------------------------------------------------------
// Safe expression evaluator: + − × ÷ √ ( ) decimals. No eval().
// ---------------------------------------------------------------------------
type Tok = { t: 'num'; v: number } | { t: 'op'; v: string } | { t: 'lp' } | { t: 'rp' } | { t: 'sqrt' };

function tokenize(src: string): Tok[] {
  const s = src.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/\s+/g, '');
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const v = parseFloat(s.slice(i, j));
      if (!Number.isFinite(v)) throw new Error('bad number');
      out.push({ t: 'num', v });
      i = j;
      continue;
    }
    if (ch === '√') {
      out.push({ t: 'sqrt' });
      i++;
      continue;
    }
    if (ch === '(') {
      out.push({ t: 'lp' });
      i++;
      continue;
    }
    if (ch === ')') {
      out.push({ t: 'rp' });
      i++;
      continue;
    }
    if ('+-*/^'.includes(ch)) {
      out.push({ t: 'op', v: ch });
      i++;
      continue;
    }
    throw new Error('bad char');
  }
  return out;
}

export function evaluate(src: string): number {
  const toks = tokenize(src);
  let pos = 0;
  const peek = () => toks[pos];
  const next = () => toks[pos++];

  function primary(): number {
    const tk = next();
    if (!tk) throw new Error('unexpected end');
    if (tk.t === 'num') return tk.v;
    if (tk.t === 'lp') {
      const v = expr();
      if (next()?.t !== 'rp') throw new Error('missing )');
      return v;
    }
    if (tk.t === 'sqrt') {
      const v = unary();
      return Math.sqrt(v);
    }
    if (tk.t === 'op' && tk.v === '-') return -unary();
    if (tk.t === 'op' && tk.v === '+') return unary();
    throw new Error('unexpected token');
  }
  function unary(): number {
    const base = primary();
    if (peek()?.t === 'op' && (peek() as { v: string }).v === '^') {
      next();
      return Math.pow(base, unary());
    }
    return base;
  }
  function term(): number {
    let v = unary();
    while (peek()?.t === 'op' && ['*', '/'].includes((peek() as { v: string }).v)) {
      const op = (next() as { v: string }).v;
      const r = unary();
      v = op === '*' ? v * r : v / r;
    }
    return v;
  }
  function expr(): number {
    let v = term();
    while (peek()?.t === 'op' && ['+', '-'].includes((peek() as { v: string }).v)) {
      const op = (next() as { v: string }).v;
      const r = term();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }
  const v = expr();
  if (pos !== toks.length) throw new Error('trailing input');
  if (!Number.isFinite(v)) throw new Error('not finite');
  return v;
}

const KEYS = ['7', '8', '9', '÷', '(', '4', '5', '6', '×', ')', '1', '2', '3', '−', '√', '0', '.', '=', '+', 'C'];

export function CalculatorPanel() {
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const press = (k: string) => {
    if (k === 'C') {
      setExpr('');
      setResult(null);
      return;
    }
    if (k === '=') {
      try {
        const v = evaluate(expr);
        const out = Number.isInteger(v) ? String(v) : v.toFixed(4).replace(/\.?0+$/, '');
        setResult(out);
        setHistory((h) => [`${expr} = ${out}`, ...h].slice(0, 6));
      } catch {
        setResult('Error');
      }
      return;
    }
    if (result !== null && !'+−×÷^'.includes(k)) {
      setExpr(k);
      setResult(null);
      return;
    }
    if (result !== null) {
      setExpr(result + k);
      setResult(null);
      return;
    }
    setExpr((e) => e + k);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-line bg-raised p-3 text-right">
        <input
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') press('=');
          }}
          className="w-full bg-transparent text-right font-mono text-lg outline-none"
          placeholder="e.g. √(2*7800*475/61.25)"
          aria-label="Calculator expression"
        />
        <div className={cx('mt-1 font-mono text-2xl font-bold', result === 'Error' ? 'text-bad' : 'text-accent')}>{result ?? ' '}</div>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            className={cx(
              'h-11 rounded-lg border border-line text-base font-semibold hover:bg-raised',
              k === '=' && 'bg-accent text-bg hover:brightness-110',
              k === 'C' && 'text-bad',
              '+−×÷√()'.includes(k) && 'text-info',
            )}
          >
            {k}
          </button>
        ))}
        <button type="button" onClick={() => setExpr((e) => e.slice(0, -1))} className="col-span-5 flex h-9 items-center justify-center gap-1 rounded-lg border border-line text-sm text-muted hover:bg-raised">
          <Delete size={14} /> backspace
        </button>
      </div>
      {history.length > 0 && (
        <div className="space-y-1 font-mono text-xs text-muted">
          {history.map((h, i) => (
            <div key={i}>{h}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CalculatorButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cx('btn-ghost', className)} aria-label="Open calculator">
        <CalcIcon size={15} /> Calculator
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Calculator">
        <CalculatorPanel />
      </Modal>
    </>
  );
}
