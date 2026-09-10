import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Check, RotateCcw } from 'lucide-react';
import type { MistakeEntry } from '@/types';
import { useProgress } from '@/hooks/useProgress';
import { MISTAKE_CATEGORIES, MISTAKE_MAP } from '@/data/mistakeCategories';
import { SKILL_MAP } from '@/data/worlds';
import { questionForMistake } from '@/generators';
import { Shell } from '@/components/Layout';
import { QuizRunner, type SessionSummary } from '@/components/QuizRunner';
import { Results } from '@/components/Results';
import { PageTitle, cx } from '@/components/ui';

export function MistakeNotebook() {
  const { progress, resolveMistake } = useProgress();
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  const [practice, setPractice] = useState<MistakeEntry | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [q, setQ] = useState<ReturnType<typeof questionForMistake>[] | null>(null);

  const list = useMemo(() => progress.mistakes.filter((m) => filter === 'all' || !m.resolvedAt), [progress.mistakes, filter]);
  const counts = useMemo(
    () => MISTAKE_CATEGORIES.map((c) => ({ ...c, n: progress.mistakeCategoryCounts[c.id] ?? 0 })).filter((c) => c.n > 0).sort((a, b) => b.n - a.n),
    [progress.mistakeCategoryCounts],
  );

  const startPractice = (m: MistakeEntry) => {
    setPractice(m);
    setSummary(null);
    setQ(Array.from({ length: 3 }, () => questionForMistake(m.skill, m.templateId)));
  };

  if (practice && q) {
    return (
      <Shell focus>
        {summary ? (
          <Results
            summary={summary}
            title={`Practice · ${SKILL_MAP[practice.skill].label}`}
            showStars={false}
            actions={
              <>
                <button className="btn-primary" onClick={() => startPractice(practice)}>
                  <RotateCcw size={14} /> 3 more
                </button>
                <button className="btn-ghost" onClick={() => { setPractice(null); setQ(null); }}>
                  Back to notebook
                </button>
              </>
            }
          />
        ) : (
          <QuizRunner
            title={`Practice this again · ${SKILL_MAP[practice.skill].label}`}
            subtitle="3 fresh questions on the same skill"
            source={q}
            onFinish={(s) => {
              if (s.accuracy >= 0.67) resolveMistake(practice.id);
              setSummary(s);
            }}
            onExit={() => { setPractice(null); setQ(null); }}
          />
        )}
      </Shell>
    );
  }

  return (
    <Shell>
      <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft size={14} /> Home
      </Link>
      <PageTitle
        title="Mistake Notebook"
        sub="Every missed question is saved automatically with the rule to remember."
        right={
          <div className="flex gap-2">
            <button onClick={() => setFilter('open')} className={cx('rounded-full border px-3 py-1 text-sm', filter === 'open' ? 'border-accent bg-accent/15 text-accent' : 'border-line')}>
              Open
            </button>
            <button onClick={() => setFilter('all')} className={cx('rounded-full border px-3 py-1 text-sm', filter === 'all' ? 'border-accent bg-accent/15 text-accent' : 'border-line')}>
              All
            </button>
          </div>
        }
      />
      <div className="grid gap-4 md:grid-cols-[1fr_300px]">
        <div className="space-y-3">
          {list.length === 0 && (
            <div className="card p-8 text-center text-muted">
              <BookOpen className="mx-auto mb-2" />
              {filter === 'open' ? 'No open mistakes. Nice.' : 'No mistakes recorded yet.'}
            </div>
          )}
          {list.map((m) => (
            <div key={m.id} className={cx('card p-4', !!m.resolvedAt && 'opacity-60')}>
              <div className="flex items-start justify-between gap-2">
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted">
                  {SKILL_MAP[m.skill].label} · {new Date(m.at).toLocaleDateString()}
                </div>
                {m.resolvedAt && (
                  <span className="chip text-good">
                    <Check size={11} /> practiced
                  </span>
                )}
              </div>
              <div className="mt-1 font-semibold">{m.prompt}</div>
              {m.given && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {m.given.map((g, i) => (
                    <span key={i} className="rounded bg-raised px-1.5 py-0.5 font-mono text-[11px]">{g}</span>
                  ))}
                </div>
              )}
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <Field label="My answer" tone="bad">{m.myAnswer}</Field>
                <Field label="Correct answer" tone="good">{m.correctAnswer}</Field>
              </div>
              <div className="mt-2 text-sm">
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted">Why I missed it</div>
                <ul className="mt-0.5 space-y-0.5 font-mono text-[12.5px]">
                  {m.why.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-2 rounded-lg bg-raised px-3 py-2 text-sm">
                <span className="text-[10px] font-bold uppercase tracking-wide text-warn">Rule to remember · </span>
                {m.rule}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="chip">{MISTAKE_MAP[m.category].label}</span>
                <button className="btn-soft text-xs" onClick={() => startPractice(m)}>
                  <RotateCcw size={12} /> Practice this again
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="card h-fit p-4">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">Repeated mistake categories</div>
          {counts.length === 0 ? (
            <p className="text-sm text-muted">Nothing yet.</p>
          ) : (
            <ul className="space-y-2">
              {counts.map((c) => (
                <li key={c.id} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span>{c.label}</span>
                    <span className="font-mono text-muted">×{c.n}</span>
                  </div>
                  <div className="text-[11px] text-muted">{c.rule}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Field({ label, tone, children }: { label: string; tone: 'bad' | 'good'; children: React.ReactNode }) {
  return (
    <div className={cx('rounded-lg border px-3 py-2', tone === 'bad' ? 'border-bad/40 bg-bad/5' : 'border-good/40 bg-good/5')}>
      <div className={cx('text-[10px] font-bold uppercase tracking-wide', tone === 'bad' ? 'text-bad' : 'text-good')}>{label}</div>
      <div className="font-medium">{children}</div>
    </div>
  );
}
