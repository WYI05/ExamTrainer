import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Flame } from 'lucide-react';
import type { Question, WorldId } from '@/types';
import { conceptsForWorld } from '@/generators/concept';
import { genFormulaRecognition } from '@/generators/formulaRecognition';
import { mixedSet, randomFor } from '@/generators';
import { SHORTCUTS } from '@/data/shortcuts';
import { Shell } from '@/components/Layout';
import { QuizRunner, type SessionSummary } from '@/components/QuizRunner';
import { Results } from '@/components/Results';
import { mergeSummaries } from './LevelPage';
import { cx } from '@/components/ui';
import { pick } from '@/utils/random';

interface Segment {
  title: string;
  minutes: number;
  blurb: string;
  cards: number[]; // shortcut card numbers to flash first
  next: () => Question;
}

const SEGMENTS: Segment[] = [
  {
    title: 'Critical vocabulary',
    minutes: 5,
    blurb: 'PO vs RFQ, TCO, procurement, bulk, pallets, TEU, doublestack, returns.',
    cards: [14, 15, 16, 17, 12, 13],
    next: () => {
      const w = pick(['w1', 'w4', 'w1', 'w4'] as WorldId[]);
      return conceptsForWorld(w, 1)[0];
    },
  },
  {
    title: 'EOQ formulas',
    minutes: 8,
    blurb: 'EOQ, H from a rate, AOC / AHC / TC, D/Q vs (Q/D)×52, the balance rule.',
    cards: [1, 2, 3, 4, 5, 6],
    next: () => (Math.random() < 0.15 ? genFormulaRecognition({ difficulty: 'medium' }) : randomFor('w2', pick(['easy', 'medium']))),
  },
  {
    title: 'Line balancing',
    minutes: 8,
    blurb: 'Cycle time (round down), stations (round up), efficiency, idle, effective CT, precedence.',
    cards: [7, 8, 9, 10, 11],
    next: () => randomFor('w3', pick(['easy', 'medium'])),
  },
  {
    title: 'Logistics',
    minutes: 4,
    blurb: 'TEU math and the transportation terms.',
    cards: [12, 13, 14, 15],
    next: () => randomFor('w4', 'medium'),
  },
  {
    title: 'Final mixed sprint',
    minutes: 5,
    blurb: 'Everything, exam wording, no hints.',
    cards: [2, 7, 8],
    next: () => mixedSet(1, 'exam')[0],
  },
];

export function CrashCourse() {
  const nav = useNavigate();
  const [seg, setSeg] = useState(0);
  const [phase, setPhase] = useState<'start' | 'cards' | 'run' | 'done'>('start');
  const [summaries, setSummaries] = useState<SessionSummary[]>([]);
  const s = SEGMENTS[seg];
  const source = useCallback(() => SEGMENTS[seg].next(), [seg]);

  const finishSegment = (sum: SessionSummary) => {
    const next = [...summaries, sum];
    setSummaries(next);
    if (seg + 1 >= SEGMENTS.length) setPhase('done');
    else {
      setSeg(seg + 1);
      setPhase('cards');
    }
  };

  if (phase === 'done') {
    return (
      <Shell focus>
        <Results
          summary={mergeSummaries(summaries)}
          title="Exam in 30 Minutes — complete"
          showStars={false}
          actions={
            <>
              <button className="btn-primary" onClick={() => nav('/exam')}>
                Take the exam simulator <ArrowRight size={14} />
              </button>
              <button className="btn-ghost" onClick={() => nav('/')}>
                Home
              </button>
            </>
          }
        />
      </Shell>
    );
  }

  if (phase === 'start') {
    return (
      <Shell focus>
        <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
          <ArrowLeft size={14} /> Home
        </Link>
        <div className="card mx-auto max-w-xl animate-rise p-6">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-warn">
            <Flame size={14} /> Exam in 30 Minutes
          </div>
          <h1 className="mt-1 text-2xl font-extrabold">Highest-yield material only.</h1>
          <ol className="mt-4 space-y-2 text-sm">
            {SEGMENTS.map((x, i) => (
              <li key={x.title} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2">
                <span className="w-12 shrink-0 font-mono text-xs text-muted">{x.minutes} min</span>
                <span>
                  <span className="font-bold">{i + 1}. {x.title}</span>
                  <span className="block text-xs text-muted">{x.blurb}</span>
                </span>
              </li>
            ))}
          </ol>
          <button className="btn-primary mt-5 w-full py-3" onClick={() => setPhase('cards')} autoFocus>
            Start the clock <ArrowRight size={16} />
          </button>
        </div>
      </Shell>
    );
  }

  if (phase === 'cards') {
    const cards = SHORTCUTS.filter((c) => s.cards.includes(c.n));
    return (
      <Shell focus>
        <div className="mx-auto max-w-2xl animate-rise">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-muted">
            Segment {seg + 1} of {SEGMENTS.length} · {s.minutes} minutes
          </div>
          <h2 className="text-2xl font-extrabold">{s.title}</h2>
          <p className="text-sm text-muted">{s.blurb}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {cards.map((c) => (
              <div key={c.n} className={cx('card p-4', c.tone === 'bad' ? 'border-bad/50' : c.tone === 'warn' ? 'border-warn/50' : 'border-line')}>
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted">{c.title}</div>
                <div className="font-mono text-xl font-extrabold">{c.big}</div>
                {c.sub && <div className="text-xs text-muted">{c.sub}</div>}
              </div>
            ))}
          </div>
          <button className="btn-primary mt-4 w-full py-3" onClick={() => setPhase('run')} autoFocus>
            Drill for {s.minutes} minutes <ArrowRight size={16} />
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell focus>
      <QuizRunner
        key={seg}
        title={`Crash course · ${s.title}`}
        subtitle={`${s.minutes} minutes · answer until the clock runs out`}
        source={source}
        timeLimitSec={s.minutes * 60}
        hints={seg < SEGMENTS.length - 1}
        onFinish={finishSegment}
        onExit={() => nav('/')}
      />
    </Shell>
  );
}
