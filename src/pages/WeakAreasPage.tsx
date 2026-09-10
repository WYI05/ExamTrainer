import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import { weakAreas } from '@/utils/mastery';
import { SKILLS } from '@/data/worlds';
import { skillMastery } from '@/utils/mastery';
import { Shell } from '@/components/Layout';
import { MasteryBadge } from '@/components/Badges';
import { PageTitle, cx } from '@/components/ui';

export function WeakAreasPage() {
  const nav = useNavigate();
  const { progress } = useProgress();
  const weak = weakAreas(progress, 10);
  const untouched = SKILLS.filter((s) => !progress.skills[s.id]?.attempts);
  return (
    <Shell>
      <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft size={14} /> Home
      </Link>
      <PageTitle title="Weak Areas" sub="Ranked by recent accuracy. Slow skills are flagged too." right={<button className="btn-primary" onClick={() => nav('/cram')}>Cram these <ArrowRight size={14} /></button>} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          {weak.length === 0 && <div className="card p-6 text-sm text-muted">Answer some questions first and your weak spots will show here.</div>}
          {weak.map((w, i) => (
            <button key={w.skill} onClick={() => nav(`/practice?skill=${w.skill}&difficulty=medium`)} className="card block w-full p-4 text-left transition-colors hover:border-muted">
              <div className="flex items-center justify-between">
                <div className="font-bold">
                  <span className="mr-2 font-mono text-muted">{i + 1}.</span>
                  {w.label}
                </div>
                <div className={cx('font-mono font-bold', w.accuracy < 0.6 ? 'text-bad' : w.accuracy < 0.8 ? 'text-warn' : 'text-good')}>{Math.round(w.accuracy * 100)}%</div>
              </div>
              <div className="mt-2">
                <MasteryBadge value={w.mastery} />
              </div>
              <div className="mt-2 flex gap-3 text-xs text-muted">
                <span>{w.attempts} attempts</span>
                {w.avgSec !== null && <span className={cx(w.slow && 'text-warn')}>avg {Math.round(w.avgSec)}s{w.slow && ' — too slow'}</span>}
              </div>
            </button>
          ))}
        </div>
        <div className="card h-fit p-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted">
            <AlertCircle size={13} /> Not yet attempted
          </div>
          {untouched.length === 0 ? (
            <p className="text-sm text-muted">You have touched every skill.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {untouched.map((s) => (
                <button key={s.id} onClick={() => nav(`/practice?skill=${s.id}&difficulty=easy`)} className="chip hover:border-accent hover:text-accent">
                  {s.label} · {skillMastery(progress.skills[s.id])}%
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
