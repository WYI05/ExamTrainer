import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, RotateCcw, Shuffle, X } from 'lucide-react';
import { FLASHCARDS } from '@/data/flashcards';
import { WORLDS } from '@/data/worlds';
import { Shell } from '@/components/Layout';
import { PageTitle, ProgressBar, cx } from '@/components/ui';
import { useKeyboard } from '@/hooks/useKeyboard';
import { shuffle } from '@/utils/random';
import type { WorldId } from '@/types';

export function FlashcardsPage() {
  const [world, setWorld] = useState<WorldId | 'all'>('all');
  const [order, setOrder] = useState(() => shuffle(FLASHCARDS.map((c) => c.id)));
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [missed, setMissed] = useState<Set<string>>(new Set());

  const deck = useMemo(() => order.map((id) => FLASHCARDS.find((c) => c.id === id)!).filter((c) => world === 'all' || c.world === world), [order, world]);
  const card = deck[i];

  const reshuffle = () => {
    setOrder(shuffle(FLASHCARDS.map((c) => c.id)));
    setI(0);
    setFlipped(false);
    setKnown(new Set());
    setMissed(new Set());
  };

  const mark = useCallback(
    (ok: boolean) => {
      if (!card) return;
      (ok ? setKnown : setMissed)((s) => new Set(s).add(card.id));
      setFlipped(false);
      setI((x) => Math.min(deck.length, x + 1));
    },
    [card, deck.length],
  );

  useKeyboard(
    useCallback(
      (k: string) => {
        if (k === ' ' || k === 'Enter') setFlipped((f) => !f);
        if (flipped && (k === '1' || k === 'ArrowRight')) mark(true);
        if (flipped && (k === '2' || k === 'ArrowLeft')) mark(false);
      },
      [flipped, mark],
    ),
  );

  return (
    <Shell focus>
      <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft size={14} /> Home
      </Link>
      <PageTitle
        title="Flashcards"
        sub="Known course facts only. Space to flip, 1 = got it, 2 = missed."
        right={
          <button className="btn-ghost" onClick={reshuffle}>
            <Shuffle size={14} /> Shuffle
          </button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Pill active={world === 'all'} onClick={() => { setWorld('all'); setI(0); setFlipped(false); }}>All</Pill>
        {WORLDS.map((w) => (
          <Pill key={w.id} active={world === w.id} onClick={() => { setWorld(w.id); setI(0); setFlipped(false); }}>
            {w.title}
          </Pill>
        ))}
      </div>
      <ProgressBar value={(i / Math.max(1, deck.length)) * 100} className="mb-4" />
      {card ? (
        <div className="mx-auto max-w-xl">
          <button type="button" onClick={() => setFlipped((f) => !f)} className="card block min-h-[240px] w-full animate-pop p-8 text-center">
            <div className="text-[11px] font-bold uppercase tracking-wide text-muted">{flipped ? 'Definition' : `Term · ${i + 1} / ${deck.length}`}</div>
            <div className={cx('mt-4 flex min-h-[120px] items-center justify-center', flipped ? 'text-lg font-medium' : 'text-3xl font-extrabold')}>{flipped ? card.back : card.front}</div>
            {!flipped && <div className="text-xs text-accent">Tap or press Space to flip</div>}
          </button>
          {flipped && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="btn-ghost border-bad/50 py-3 text-bad" onClick={() => mark(false)}>
                <X size={16} /> Missed it (2)
              </button>
              <button className="btn-primary py-3" onClick={() => mark(true)}>
                <Check size={16} /> Got it (1)
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card mx-auto max-w-xl animate-rise p-8 text-center">
          <div className="text-2xl font-extrabold">Deck complete</div>
          <p className="mt-2 text-sm text-muted">
            {known.size} known · {missed.size} missed
          </p>
          {missed.size > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {[...missed].map((id) => (
                <span key={id} className="chip text-bad">{FLASHCARDS.find((c) => c.id === id)?.front}</span>
              ))}
            </div>
          )}
          <div className="mt-5 flex justify-center gap-2">
            <button className="btn-primary" onClick={reshuffle}>
              <RotateCcw size={14} /> Again
            </button>
            {missed.size > 0 && (
              <button
                className="btn-ghost"
                onClick={() => {
                  setOrder(shuffle([...missed]));
                  setI(0);
                  setFlipped(false);
                  setKnown(new Set());
                  setMissed(new Set());
                }}
              >
                Only the missed ones <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </Shell>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cx('rounded-full border px-3 py-1.5 text-sm font-medium', active ? 'border-accent bg-accent/15 text-accent' : 'border-line hover:bg-raised')}>
      {children}
    </button>
  );
}
