import { useState } from 'react';
import { AlertTriangle, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { cx } from './ui';

export function TeachCard({ title, whatIsIt, whyCare, fastRule, example, memory }: { title: string; whatIsIt: string; whyCare: string; fastRule: string; example: string; memory?: string }) {
  return (
    <div className="card animate-pop p-6">
      <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted">
        <BookOpen size={14} /> Learn
      </div>
      <h2 className="text-2xl font-extrabold tracking-tight">{title}</h2>
      <div className="mt-5 space-y-4">
        <Section label="What is it?">{whatIsIt}</Section>
        <Section label="Why do I care?">{whyCare}</Section>
        <div className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-accent">Fast rule</div>
          <div className="mt-0.5 text-lg font-bold">{fastRule}</div>
        </div>
        <Section label="Example">
          <span className="font-mono text-[14px]">{example}</span>
        </Section>
        {memory && (
          <div className="flex items-start gap-2 text-sm text-muted">
            <Sparkles size={14} className="mt-0.5 shrink-0 text-violet" /> <span><span className="font-bold uppercase text-[10px] tracking-wide">Memory trick · </span>{memory}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-0.5 text-[15px] leading-relaxed">{children}</div>
    </div>
  );
}

export function WarningCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="card animate-pop border-warn/60 bg-warn/5 p-6 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-warn/20 text-warn">
        <AlertTriangle size={24} />
      </div>
      <div className="text-2xl font-extrabold uppercase tracking-tight text-warn">{title}</div>
      <div className="mt-4 space-y-2">
        {lines.map((l, i) => (
          <div key={i} className="text-lg font-bold">
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FlashCardView({ front, back }: { front: string; back: string }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button type="button" onClick={() => setFlipped((f) => !f)} className="card block w-full animate-pop p-8 text-center transition-transform hover:scale-[1.01]">
      <div className="text-[11px] font-bold uppercase tracking-wide text-muted">{flipped ? 'Definition' : 'Term · tap to flip'}</div>
      <div className={cx('mt-3 min-h-[80px] flex items-center justify-center', flipped ? 'text-lg font-medium' : 'text-3xl font-extrabold')}>{flipped ? back : front}</div>
      {!flipped && (
        <div className="mt-3 inline-flex items-center gap-1 text-xs text-accent">
          Flip <ArrowRight size={12} />
        </div>
      )}
    </button>
  );
}

/** Simple visuals for lesson steps. */
export function SequenceVisual() {
  const steps = ['Need', 'RFQ / quote', 'Supplier selected', 'PO issued', 'Goods delivered'];
  return (
    <div className="card animate-pop p-6">
      <div className="text-[11px] font-bold uppercase tracking-wide text-muted">Buying sequence</div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cx('rounded-xl border px-3 py-2 text-sm font-bold', i === 3 ? 'border-accent bg-accent/10 text-accent' : 'border-line bg-raised')}>{s}</div>
            {i < steps.length - 1 && <ArrowRight size={14} className="text-muted" />}
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-sm text-muted">RFQ asks the price. The PO is the actual order — issued by the buyer.</p>
    </div>
  );
}

export function PalletVisual() {
  return (
    <div className="card animate-pop p-6 text-center">
      <svg viewBox="0 0 240 150" className="mx-auto w-full max-w-xs">
        {[0, 1, 2].map((row) =>
          [0, 1, 2, 3].map((col) => (
            <rect key={`${row}-${col}`} x={40 + col * 40} y={20 + row * 30} width={36} height={26} rx={3} className="fill-info/30 stroke-info" />
          )),
        )}
        <rect x={30} y={112} width={180} height={10} rx={2} className="fill-warn/70" />
        {[36, 116, 196].map((x) => (
          <rect key={x} x={x} y={122} width={14} height={12} className="fill-warn/70" />
        ))}
        <path d="M 8 140 L 30 140 L 30 120 L 8 120 Z" className="fill-muted" />
      </svg>
      <div className="mt-2 text-lg font-bold">Boxes stacked on a pallet</div>
      <p className="text-sm text-muted">Forklift forks slide under the pallet and move all the boxes at once.</p>
    </div>
  );
}

export function TeuVisual() {
  return (
    <div className="card animate-pop p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="text-center">
          <div className="mx-auto h-12 w-24 rounded-md border-2 border-info bg-info/20" />
          <div className="mt-2 font-bold">20-foot container</div>
          <div className="text-2xl font-extrabold text-info">1 TEU</div>
        </div>
        <div className="text-center">
          <div className="mx-auto flex h-12 w-48 rounded-md border-2 border-violet bg-violet/20">
            <div className="w-1/2 border-r border-dashed border-violet" />
          </div>
          <div className="mt-2 font-bold">40-foot container</div>
          <div className="text-2xl font-extrabold text-violet">2 TEUs</div>
        </div>
      </div>
      <p className="mt-4 text-center font-mono text-sm">TEU = 20-ft count + 2 × 40-ft count</p>
    </div>
  );
}
