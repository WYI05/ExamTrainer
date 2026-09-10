import { useCallback, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Zap } from 'lucide-react';
import { sprintQuestion } from '@/generators';
import { useProgress } from '@/hooks/useProgress';
import { Shell } from '@/components/Layout';
import { QuizRunner, type SessionSummary } from '@/components/QuizRunner';
import { Results } from '@/components/Results';
import { Stat } from '@/components/ui';

export function SprintPage() {
  const { kind } = useParams();
  const nav = useNavigate();
  const { addSprint, progress } = useProgress();
  const [seed, setSeed] = useState(0);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const k = kind === 'fiveMin' ? 'fiveMin' : kind === 'sixty' ? 'sixty' : null;
  const source = useCallback(() => {
    void seed;
    return sprintQuestion(k ?? 'sixty');
  }, [k, seed]);
  if (!k) return <Navigate to="/" replace />;

  const isSixty = k === 'sixty';
  const limit = isSixty ? 60 : 300;
  const best = [...progress.sprints[k]].sort((a, b) => b.correct - a.correct)[0];

  const finish = (s: SessionSummary) => {
    addSprint(k, { at: Date.now(), answered: s.total, correct: s.correct, bestStreak: s.bestStreak, perMinute: s.total / (limit / 60) });
    setSummary(s);
  };

  return (
    <Shell focus>
      <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft size={14} /> Home
      </Link>
      {summary ? (
        <div className="space-y-4">
          <div className="mx-auto grid max-w-2xl grid-cols-3 gap-2">
            <Stat label="Questions / minute" value={(summary.total / (limit / 60)).toFixed(1)} />
            <Stat label="Accuracy" value={`${Math.round(summary.accuracy * 100)}%`} />
            <Stat label="Best streak" value={summary.bestStreak} />
          </div>
          <Results
            summary={summary}
            title={isSixty ? '60-Second Sprint' : '5-Minute Calculation Sprint'}
            showStars={false}
            actions={
              <>
                <button className="btn-primary" onClick={() => { setSummary(null); setSeed((s) => s + 1); }}>
                  <RotateCcw size={14} /> Again
                </button>
                <button className="btn-ghost" onClick={() => nav('/')}>Home</button>
              </>
            }
          />
        </div>
      ) : (
        <QuizRunner
          key={seed}
          title={isSixty ? '60-Second Sprint' : '5-Minute Calculation Sprint'}
          subtitle={isSixty ? 'terminology · formula identification · simple calcs' : 'EOQ · costs · cycle time · stations · efficiency · TEU'}
          source={source}
          rapid={isSixty}
          hints={false}
          timeLimitSec={limit}
          onFinish={finish}
          onExit={() => nav('/')}
          intro={
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted">
                <Zap size={14} className="text-accent" /> {isSixty ? '60-Second Sprint' : '5-Minute Calculation Sprint'}
              </div>
              <h2 className="mt-1 text-2xl font-extrabold">{isSixty ? 'As many as you can in 60 seconds.' : 'Calculations under the clock.'}</h2>
              <p className="mt-2 text-sm text-muted">
                {isSixty ? 'Rapid feedback, auto-advance. Use keys 1–4 or A–D.' : 'Each question gets a full explanation. Calculator available. Pace target 90 seconds.'}
              </p>
              {best && (
                <p className="mt-2 text-xs text-muted">
                  Your best: {best.correct}/{best.answered} correct · {best.perMinute.toFixed(1)} q/min
                </p>
              )}
            </div>
          }
        />
      )}
    </Shell>
  );
}
