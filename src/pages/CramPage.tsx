import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, RotateCcw, Target } from 'lucide-react';
import type { Question, SkillId } from '@/types';
import { useProgress } from '@/hooks/useProgress';
import { weakAreas } from '@/utils/mastery';
import { questionForSkill } from '@/generators';
import { MISTAKE_MAP } from '@/data/mistakeCategories';
import { SKILLS } from '@/data/worlds';
import { Shell } from '@/components/Layout';
import { QuizRunner, type SessionSummary } from '@/components/QuizRunner';
import { Results } from '@/components/Results';
import { PageTitle, cx } from '@/components/ui';
import { pick, shuffle } from '@/utils/random';

/** Skills implied by the most frequent mistake categories. */
const CATEGORY_SKILLS: Record<string, SkillId[]> = {
  'ws-round-down': ['theoretical-min', 'rounding-rules'],
  'ct-round-up': ['cycle-time', 'rounding-rules'],
  'dq-vs-qd': ['orders-per-year', 'time-between-orders'],
  'teu-40': ['teu'],
  predecessor: ['precedence'],
  'exceeded-ct': ['precedence'],
  'unit-cost-as-h': ['holding-cost', 'eoq'],
  'rate-not-h': ['holding-cost', 'eoq', 'ahc'],
  'eoq-direction': ['eoq-intuition'],
  'effective-ct-confusion': ['effective-ct'],
  'formula-choice': ['formula-recognition'],
  vocab: ['procurement', 'po', 'rfq', 'tco', 'bulk', 'pallets', 'doublestack', 'central-return', 'line-flow'],
  arithmetic: ['eoq', 'total-cost', 'efficiency', 'idle-time'],
};

export function CramPage() {
  const nav = useNavigate();
  const { progress } = useProgress();
  const [phase, setPhase] = useState<'plan' | 'run' | 'done'>('plan');
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [seed, setSeed] = useState(0);

  const weak = useMemo(() => weakAreas(progress, 6), [progress]);
  const topCategories = useMemo(
    () =>
      Object.entries(progress.mistakeCategoryCounts)
        .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
        .slice(0, 3)
        .map(([id, n]) => ({ id, n: n ?? 0, label: MISTAKE_MAP[id as keyof typeof MISTAKE_MAP]?.label ?? id })),
    [progress.mistakeCategoryCounts],
  );

  // Priority queue: weakest skills, then confused categories, then slow skills, then defaults.
  const plan = useMemo<SkillId[]>(() => {
    const out: SkillId[] = [];
    for (const w of weak) out.push(w.skill, w.skill);
    for (const c of topCategories) for (const s of CATEGORY_SKILLS[c.id] ?? []) out.push(s);
    for (const w of weak.filter((x) => x.slow)) out.push(w.skill);
    const defaults: SkillId[] = ['eoq-intuition', 'precedence', 'eoq', 'cycle-time', 'theoretical-min', 'teu', 'time-between-orders', 'holding-cost'];
    while (out.length < 10) out.push(pick(defaults));
    return out.slice(0, 14);
  }, [weak, topCategories]);

  const questions = useMemo<Question[]>(() => {
    void seed;
    const skills = shuffle(plan).slice(0, 10);
    return skills.map((s) => questionForSkill(s, { difficulty: pick(['medium', 'hard']), numericChance: 0.2 }));
  }, [plan, seed]);

  if (phase === 'done' && summary) {
    return (
      <Shell focus>
        <Results
          summary={summary}
          title="Cram drill"
          showStars={false}
          actions={
            <>
              <button className="btn-primary" onClick={() => { setSeed((s) => s + 1); setSummary(null); setPhase('run'); }}>
                <RotateCcw size={14} /> Another 10
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

  if (phase === 'run') {
    return (
      <Shell focus>
        <QuizRunner
          key={seed}
          title="Cram Mode"
          subtitle="10 targeted questions from your weakest areas"
          source={questions}
          onFinish={(s) => { setSummary(s); setPhase('done'); }}
          onExit={() => setPhase('plan')}
        />
      </Shell>
    );
  }

  const skillLabel = (id: SkillId) => SKILLS.find((s) => s.id === id)?.label ?? id;

  return (
    <Shell>
      <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft size={14} /> Home
      </Link>
      <PageTitle title="Cram Mode" sub="Automatically prioritizes what you miss most, formulas you confuse, slow answers, precedence errors and EOQ mistakes." />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-warn">
            <Target size={14} /> Your top weak areas
          </div>
          {weak.length === 0 ? (
            <p className="text-sm text-muted">No data yet. Answer a few questions and Cram Mode will build a plan. For now it drills the highest-yield topics.</p>
          ) : (
            <ol className="space-y-2">
              {weak.map((w, i) => (
                <li key={w.skill} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm">
                  <span>
                    <span className="mr-2 font-mono text-muted">{i + 1}.</span>
                    {w.label}
                    {w.slow && <span className="ml-2 rounded-full bg-warn/15 px-2 py-0.5 text-[10px] font-bold text-warn">slow</span>}
                  </span>
                  <span className={cx('font-mono font-bold', w.accuracy < 0.6 ? 'text-bad' : w.accuracy < 0.8 ? 'text-warn' : 'text-good')}>{Math.round(w.accuracy * 100)}%</span>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="card p-5">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-muted">Repeated mistake patterns</div>
          {topCategories.length === 0 ? (
            <p className="text-sm text-muted">None recorded yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {topCategories.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
                  <span>{c.label}</span>
                  <span className="font-mono text-muted">×{c.n}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 text-[11px] font-bold uppercase tracking-wide text-muted">This drill will hit</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {Array.from(new Set(plan)).slice(0, 8).map((s) => (
              <span key={s} className="chip">{skillLabel(s)}</span>
            ))}
          </div>
        </div>
      </div>
      <button className="btn-primary mt-5 w-full py-3 text-base md:w-auto md:px-8" onClick={() => setPhase('run')}>
        Start 10-question drill <ArrowRight size={16} />
      </button>
    </Shell>
  );
}
