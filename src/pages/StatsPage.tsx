import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import { SKILLS, WORLDS } from '@/data/worlds';
import { readiness, skillAccuracy, skillMastery, skillSpeed, worldStats } from '@/utils/mastery';
import { Shell } from '@/components/Layout';
import { MasteryBadge } from '@/components/Badges';
import { PageTitle, Ring, Stat, cx } from '@/components/ui';
import { secondsToClock } from '@/utils/format';

export function StatsPage() {
  const { progress } = useProgress();
  const r = readiness(progress);
  const totalAcc = progress.totals.attempts ? progress.totals.correct / progress.totals.attempts : 0;
  const avgSec = progress.totals.attempts ? progress.totals.timeMs / progress.totals.attempts / 1000 : 0;
  return (
    <Shell>
      <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft size={14} /> Home
      </Link>
      <PageTitle title="Stats" sub="Everything is stored in this browser’s localStorage." />
      <div className="card flex flex-wrap items-center gap-6 p-5">
        <Ring value={r.overall} size={120} stroke={10} sub="overall" />
        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat label="Knowledge" value={`${r.knowledge}%`} />
          <Stat label="Speed" value={`${r.speed}%`} />
          <Stat label="Overall readiness" value={`${r.overall}%`} tone="text-accent" />
          <Stat label="Questions answered" value={progress.totals.attempts} />
          <Stat label="Accuracy" value={`${Math.round(totalAcc * 100)}%`} />
          <Stat label="Avg seconds / question" value={Math.round(avgSec)} tone={avgSec > 90 ? 'text-warn' : undefined} />
          <Stat label="XP" value={progress.xp.toLocaleString()} />
          <Stat label="Best streak" value={progress.bestStreak} />
          <Stat label="Exams taken" value={progress.examAttempts.length} />
        </div>
      </div>

      <h2 className="mt-6 mb-2 text-lg font-bold">Worlds</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {WORLDS.map((w) => {
          const s = worldStats(progress, w.id);
          return (
            <div key={w.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="font-bold">
                  World {w.num} · {w.title}
                </div>
                <span className="text-xs text-muted">weight {Math.round(w.weight * 100)}%</span>
              </div>
              <div className="mt-2">
                <MasteryBadge value={s.mastery} size="md" />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-raised py-1.5"><div className="text-muted">Questions</div><div className="font-mono font-bold">{s.attempts}</div></div>
                <div className="rounded-lg bg-raised py-1.5"><div className="text-muted">Accuracy</div><div className="font-mono font-bold">{s.accuracy === null ? '—' : `${Math.round(s.accuracy * 100)}%`}</div></div>
                <div className="rounded-lg bg-raised py-1.5"><div className="text-muted">Stars</div><div className="font-mono font-bold">{s.stars}/{s.maxStars}</div></div>
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="mt-6 mb-2 text-lg font-bold">Skills</h2>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[11px] uppercase tracking-wide text-muted">
            <tr className="border-b border-line">
              <th className="px-4 py-2">Skill</th>
              <th className="px-4 py-2">Mastery</th>
              <th className="px-4 py-2">Attempts</th>
              <th className="px-4 py-2">Accuracy</th>
              <th className="px-4 py-2">Speed</th>
            </tr>
          </thead>
          <tbody>
            {SKILLS.map((s) => {
              const st = progress.skills[s.id];
              const acc = skillAccuracy(st);
              const sp = skillSpeed(s.id, st);
              const m = skillMastery(st);
              return (
                <tr key={s.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-2">{s.label}</td>
                  <td className="w-40 px-4 py-2"><MasteryBadge value={m} /></td>
                  <td className="px-4 py-2 font-mono">{st?.attempts ?? 0}</td>
                  <td className={cx('px-4 py-2 font-mono', acc !== null && acc < 0.6 && 'text-bad')}>{acc === null ? '—' : `${Math.round(acc * 100)}%`}</td>
                  <td className="px-4 py-2 font-mono">{sp === null ? '—' : `${Math.round(sp * 100)}%`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {progress.examAttempts.length > 0 && (
        <>
          <h2 className="mt-6 mb-2 text-lg font-bold">Exam attempts</h2>
          <div className="space-y-2">
            {progress.examAttempts.map((a) => (
              <div key={a.id} className="card flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span className="text-muted">{new Date(a.at).toLocaleString()} · {a.mode === 'final' ? 'Final Boss' : 'Simulator'}</span>
                <span className="font-mono font-bold">{a.score}/{a.total} · {a.percent}%</span>
                <span className="font-mono text-muted">{secondsToClock(a.timeUsedSec)} · {a.avgSecPerQuestion}s/q</span>
              </div>
            ))}
          </div>
        </>
      )}

      {(progress.sprints.sixty.length > 0 || progress.sprints.fiveMin.length > 0) && (
        <>
          <h2 className="mt-6 mb-2 text-lg font-bold">Sprint bests</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {(['sixty', 'fiveMin'] as const).map((k) => {
              const best = [...progress.sprints[k]].sort((a, b) => b.correct - a.correct)[0];
              if (!best) return null;
              return (
                <div key={k} className="card px-4 py-3 text-sm">
                  <div className="font-bold">{k === 'sixty' ? '60-Second Sprint' : '5-Minute Calculation Sprint'}</div>
                  <div className="text-muted">
                    {best.correct}/{best.answered} correct · {best.perMinute.toFixed(1)} q/min · best streak {best.bestStreak}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Shell>
  );
}
