import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import type { Difficulty, Question, SkillId, WorldId } from '@/types';
import { SKILLS, WORLDS } from '@/data/worlds';
import { questionForSkill, worldSet } from '@/generators';
import { useProgress } from '@/hooks/useProgress';
import { skillMastery } from '@/utils/mastery';
import { Shell } from '@/components/Layout';
import { QuizRunner, type SessionSummary } from '@/components/QuizRunner';
import { Results } from '@/components/Results';
import { MasteryBadge } from '@/components/Badges';
import { PageTitle, cx } from '@/components/ui';

const DIFFS: { id: Difficulty; label: string; sub: string }[] = [
  { id: 'easy', label: 'Easy', sub: 'obvious formula, clean numbers' },
  { id: 'medium', label: 'Medium', sub: 'identify variables, one extra step' },
  { id: 'hard', label: 'Hard', sub: 'multi-step, close distractors' },
  { id: 'exam', label: 'Exam', sub: 'course wording, minimal hints' },
];

export function PracticeByTopic() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { progress } = useProgress();
  const [world, setWorld] = useState<WorldId | 'all'>((params.get('world') as WorldId) ?? 'all');
  const [skill, setSkill] = useState<SkillId | 'all'>((params.get('skill') as SkillId) ?? 'all');
  const [difficulty, setDifficulty] = useState<Difficulty>((params.get('difficulty') as Difficulty) ?? 'medium');
  const [count, setCount] = useState(10);
  const [numeric, setNumeric] = useState(false);
  const [phase, setPhase] = useState<'pick' | 'run' | 'done'>(params.get('skill') ? 'run' : 'pick');
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [seed, setSeed] = useState(0);

  const skills = SKILLS.filter((s) => world === 'all' || s.world === world || s.world === 'all');

  const questions = useMemo<Question[]>(() => {
    void seed;
    if (skill !== 'all') return Array.from({ length: count }, () => questionForSkill(skill, { difficulty, numericChance: numeric ? 0.5 : 0.15 }));
    if (world !== 'all') return worldSet(world, count, difficulty, { numericChance: numeric ? 0.5 : 0.15 });
    const per = Math.ceil(count / 4);
    return WORLDS.flatMap((w) => worldSet(w.id, per, difficulty, { numericChance: numeric ? 0.5 : 0.15 })).sort(() => Math.random() - 0.5).slice(0, count);
  }, [skill, world, difficulty, count, numeric, seed]);

  const title = skill !== 'all' ? SKILLS.find((s) => s.id === skill)!.label : world !== 'all' ? WORLDS.find((w) => w.id === world)!.title : 'All topics';

  if (phase === 'done' && summary) {
    return (
      <Shell focus>
        <Results
          summary={summary}
          title={`${title} · ${difficulty}`}
          showStars={false}
          actions={
            <>
              <button className="btn-primary" onClick={() => { setSeed((s) => s + 1); setSummary(null); setPhase('run'); }}>
                <RotateCcw size={14} /> Same again
              </button>
              <button className="btn-ghost" onClick={() => setPhase('pick')}>
                Change topic
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
        <QuizRunner key={seed} title={`Practice · ${title}`} subtitle={`${difficulty} · ${count} questions`} source={questions} onFinish={(s) => { setSummary(s); setPhase('done'); }} onExit={() => setPhase('pick')} />
      </Shell>
    );
  }

  return (
    <Shell>
      <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft size={14} /> Home
      </Link>
      <PageTitle title="Practice by Topic" sub="Pick a world or a single skill. Every calculation question is freshly generated." />
      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="card p-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">World</div>
            <div className="flex flex-wrap gap-2">
              <Pill active={world === 'all'} onClick={() => { setWorld('all'); setSkill('all'); }}>All worlds</Pill>
              {WORLDS.map((w) => (
                <Pill key={w.id} active={world === w.id} onClick={() => { setWorld(w.id); setSkill('all'); }}>
                  {w.num} · {w.title}
                </Pill>
              ))}
            </div>
          </div>
          <div className="card p-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">Skill</div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              <button onClick={() => setSkill('all')} className={cx('rounded-lg border px-3 py-2 text-left text-sm', skill === 'all' ? 'border-accent bg-accent/10' : 'border-line hover:bg-raised')}>
                Mixed — every skill in the selection
              </button>
              {skills.map((s) => (
                <button key={s.id} onClick={() => setSkill(s.id)} className={cx('rounded-lg border px-3 py-2 text-left text-sm', skill === s.id ? 'border-accent bg-accent/10' : 'border-line hover:bg-raised')}>
                  <div className="flex items-center justify-between gap-2">
                    <span>{s.label}</span>
                    <span className="font-mono text-xs text-muted">{skillMastery(progress.skills[s.id])}%</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="card p-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">Difficulty</div>
            <div className="space-y-1.5">
              {DIFFS.map((d) => (
                <button key={d.id} onClick={() => setDifficulty(d.id)} className={cx('block w-full rounded-lg border px-3 py-2 text-left', difficulty === d.id ? 'border-accent bg-accent/10' : 'border-line hover:bg-raised')}>
                  <div className="text-sm font-bold">{d.label}</div>
                  <div className="text-xs text-muted">{d.sub}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="card p-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">Questions</div>
            <div className="flex gap-2">
              {[5, 10, 20].map((n) => (
                <Pill key={n} active={count === n} onClick={() => setCount(n)}>
                  {n}
                </Pill>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={numeric} onChange={(e) => setNumeric(e.target.checked)} className="accent-[rgb(var(--c-accent))]" />
              More type-in numeric answers
            </label>
          </div>
          {skill !== 'all' && (
            <div className="card p-4">
              <div className="mb-1 text-sm font-bold">{SKILLS.find((s) => s.id === skill)!.label}</div>
              <MasteryBadge value={skillMastery(progress.skills[skill])} size="md" />
            </div>
          )}
          <button className="btn-primary w-full py-3 text-base" onClick={() => { setSeed((s) => s + 1); setPhase('run'); }}>
            Start <ArrowRight size={16} />
          </button>
        </div>
      </div>
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
