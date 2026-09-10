import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import { diagnosticSet } from '@/generators';
import { QuizRunner, type SessionSummary } from '@/components/QuizRunner';
import { Shell } from '@/components/Layout';
import { WORLDS } from '@/data/worlds';
import { SKILL_MAP } from '@/data/worlds';
import { cx } from '@/components/ui';

const LEVELS = [
  { id: 'nothing', label: 'I know basically nothing', sub: 'Start from zero. Every concept explained.' },
  { id: 'some', label: 'I know some of it', sub: 'Lessons plus lots of practice.' },
  { id: 'reviewing', label: "I'm reviewing", sub: 'Fast lessons, heavier on drills.' },
  { id: 'ready', label: "I'm almost exam ready", sub: 'Speed rounds, bosses, exam sims.' },
];

export function Onboarding() {
  const nav = useNavigate();
  const { setOnboarded } = useProgress();
  const [step, setStep] = useState<'welcome' | 'confidence' | 'diagnostic' | 'path'>('welcome');
  const [confidence, setConfidence] = useState<string | null>(null);
  const [questions] = useState(() => diagnosticSet());
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  const finish = (s: SessionSummary) => {
    setSummary(s);
    setStep('path');
  };

  if (step === 'welcome') {
    return (
      <Shell focus>
        <div className="mx-auto mt-10 max-w-lg animate-rise text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent">
            <Zap size={26} />
          </div>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight">Let’s get you ready for SCM 300.</h1>
          <p className="mt-3 text-muted">Short lessons. One question at a time. Instant feedback. No walls of text.</p>
          <button className="btn-primary mt-8 px-6 py-3 text-base" onClick={() => setStep('confidence')} autoFocus>
            Let’s go <ArrowRight size={16} />
          </button>
        </div>
      </Shell>
    );
  }

  if (step === 'confidence') {
    return (
      <Shell focus>
        <div className="mx-auto mt-6 max-w-lg animate-rise">
          <h1 className="text-2xl font-extrabold tracking-tight">How confident are you?</h1>
          <p className="mt-1 text-sm text-muted">No wrong answer. Everyone takes the same short 8-question diagnostic next.</p>
          <div className="mt-5 space-y-2">
            {LEVELS.map((l) => (
              <button key={l.id} onClick={() => setConfidence(l.id)} className={cx('card block w-full px-4 py-3 text-left transition-colors', confidence === l.id ? 'border-accent bg-accent/10' : 'hover:bg-raised')}>
                <div className="font-bold">{l.label}</div>
                <div className="text-xs text-muted">{l.sub}</div>
              </button>
            ))}
          </div>
          <button className="btn-primary mt-5 w-full py-3" disabled={!confidence} onClick={() => setStep('diagnostic')}>
            Start diagnostic <ArrowRight size={16} />
          </button>
        </div>
      </Shell>
    );
  }

  if (step === 'diagnostic') {
    return (
      <Shell focus>
        <QuizRunner
          title="Diagnostic"
          subtitle="8 questions · not scored against you · hints available"
          source={questions}
          record={false}
          hints
          onFinish={finish}
          intro={
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-muted">Diagnostic</div>
              <h2 className="mt-1 text-2xl font-extrabold">8 quick questions</h2>
              <p className="mt-2 text-sm text-muted">One from each key area. Wrong answers do not count against you — they just shape your learning path.</p>
            </div>
          }
        />
      </Shell>
    );
  }

  const byWorld = WORLDS.map((w) => {
    const recs = summary!.records.filter((r) => SKILL_MAP[r.question.skill].world === w.id);
    return { w, correct: recs.filter((r) => r.correct).length, total: recs.length };
  });
  const weakest = [...byWorld].sort((a, b) => a.correct / Math.max(1, a.total) - b.correct / Math.max(1, b.total))[0];

  return (
    <Shell focus>
      <div className="mx-auto mt-4 max-w-lg animate-rise">
        <div className="text-[11px] font-bold uppercase tracking-wide text-muted">Your learning path</div>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">
          {summary!.correct}/{summary!.total} on the diagnostic
        </h1>
        <p className="mt-1 text-sm text-muted">
          {summary!.correct >= 7 ? 'Strong start. We will push you into speed rounds and bosses quickly.' : summary!.correct >= 4 ? 'Good base. Lessons will move fast where you are solid and slow down where you missed.' : 'Perfect place to start. Every world begins with an "explain like I have never taken SCM" lesson.'}
        </p>
        <div className="mt-4 space-y-2">
          {byWorld.map(({ w, correct, total }) => (
            <div key={w.id} className={cx('card flex items-center justify-between px-4 py-3', weakest.w.id === w.id && 'border-warn/60')}>
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-muted">World {w.num}</div>
                <div className="font-bold">{w.title}</div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold">
                  {correct}/{total}
                </div>
                {weakest.w.id === w.id && <div className="text-[10px] font-bold uppercase text-warn">Focus here first</div>}
              </div>
            </div>
          ))}
        </div>
        <button
          className="btn-primary mt-5 w-full py-3"
          onClick={() => {
            setOnboarded(confidence ?? 'some', summary!.correct);
            nav('/', { replace: true });
          }}
        >
          Open my training map <ArrowRight size={16} />
        </button>
      </div>
    </Shell>
  );
}
