import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, BarChart3, BookOpen, Crown, Eye, Flame, Gauge, GitBranch, Layers, Lock, Play, Sigma, Sparkles, Target, Timer, Trophy, Zap } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import { WORLDS, levelKey } from '@/data/worlds';
import { readiness, worldStats } from '@/utils/mastery';
import { Shell } from '@/components/Layout';
import { ProgressBar, Ring, Stars, cx } from '@/components/ui';
import { RadarChart } from '@/components/Visuals';
import type { Progress, WorldId } from '@/types';

const WORLD_TEXT: Record<WorldId, string> = { w1: 'text-info', w2: 'text-good', w3: 'text-violet', w4: 'text-warn' };

/** First incomplete level in world order. */
export function nextTrainingStep(p: Progress): { world: WorldId; level: number } | null {
  for (const w of WORLDS) {
    for (let l = 1; l <= 5; l++) {
      if (!p.levels[levelKey(w.id, l)]?.completed) return { world: w.id, level: l };
    }
  }
  return null;
}

export function allBossesBeaten(p: Progress): boolean {
  return WORLDS.every((w) => p.levels[levelKey(w.id, 5)]?.completed);
}

export function Home() {
  const { progress } = useProgress();
  const nav = useNavigate();
  const r = readiness(progress);
  const next = nextTrainingStep(progress);
  const finalUnlocked = allBossesBeaten(progress);

  const big = [
    {
      label: 'Continue Training',
      sub: next ? `${WORLDS.find((w) => w.id === next.world)!.title} · Level ${next.level}` : finalUnlocked ? 'All worlds cleared — take the Final Boss' : 'All levels complete',
      icon: Play,
      to: next ? `/world/${next.world}/level/${next.level}` : '/final-boss',
      tone: 'bg-accent text-bg',
    },
    { label: 'Cram Mode', sub: 'Targeted drill on your weakest areas', icon: Target, to: '/cram', tone: 'bg-warn/15 text-warn border border-warn/40' },
    { label: 'Practice by Topic', sub: 'Pick any skill, any difficulty', icon: Layers, to: '/practice', tone: 'bg-info/15 text-info border border-info/40' },
    { label: 'Exam Simulator', sub: '40 questions · 60 minutes · 200 points', icon: Timer, to: '/exam', tone: 'bg-violet/15 text-violet border border-violet/40' },
  ];

  const tools = [
    { label: 'Picture Guide', icon: Eye, to: '/guide' },
    { label: 'Formula Sheet', icon: Sigma, to: '/formulas' },
    { label: 'Formula Game', icon: Gauge, to: '/formula-game' },
    { label: 'Mistake Notebook', icon: BookOpen, to: '/notebook', badge: progress.mistakes.filter((m) => !m.resolvedAt).length || undefined },
    { label: 'Stats', icon: BarChart3, to: '/stats' },
    { label: 'Weak Areas', icon: AlertCircle, to: '/weak-areas' },
    { label: 'Things I Cannot Forget', icon: Sparkles, to: '/shortcuts' },
    { label: 'Flashcards', icon: Layers, to: '/flashcards' },
    { label: 'EOQ Trainer', icon: Gauge, to: '/eoq-trainer' },
    { label: 'Precedence Trainer', icon: GitBranch, to: '/precedence-trainer' },
    { label: '60-Second Sprint', icon: Zap, to: '/sprint/sixty' },
    { label: '5-Minute Calc Sprint', icon: Timer, to: '/sprint/fiveMin' },
    { label: 'Exam in 30 Minutes', icon: Flame, to: '/crash-course' },
  ];

  return (
    <Shell>
      <div className="grid gap-5 md:grid-cols-[1fr_auto]">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted">SCM 300</div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Exam 1 Training</h1>
          <p className="mt-1 text-sm text-muted">Modules 1–4 · short lessons · instant feedback · real exam pacing.</p>
        </div>
        <div className="card flex flex-wrap items-center gap-4 p-4">
          <Ring value={r.overall} size={84} stroke={8} sub="ready" />
          <div className="w-40 space-y-2 text-xs">
            <div className="text-[11px] font-bold uppercase tracking-wide text-muted">Exam readiness</div>
            <Row label="Knowledge" value={r.knowledge} />
            <Row label="Speed" value={r.speed} />
          </div>
          <RadarChart size={150} axes={WORLDS.map((w) => ({ label: ['Foundations', 'EOQ', 'Lines', 'Logistics'][w.num - 1], value: worldStats(progress, w.id).mastery }))} />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {big.map((b) => (
          <button key={b.label} onClick={() => nav(b.to)} className={cx('group flex min-h-[112px] flex-col justify-between rounded-2xl p-4 text-left transition-transform hover:-translate-y-0.5', b.tone)}>
            <b.icon size={22} />
            <div>
              <div className="text-base font-extrabold">{b.label}</div>
              <div className="text-xs opacity-80">{b.sub}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Worlds</h2>
        <Link to={finalUnlocked ? '/final-boss' : '#'} className={cx('chip', finalUnlocked ? 'border-warn text-warn hover:bg-warn/10' : 'opacity-60')} onClick={(e) => !finalUnlocked && e.preventDefault()}>
          {finalUnlocked ? <Crown size={12} /> : <Lock size={12} />} Final Boss {finalUnlocked ? 'unlocked' : '— clear all 4 bosses'}
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {WORLDS.map((w) => {
          const s = worldStats(progress, w.id);
          const bossDone = progress.levels[levelKey(w.id, 5)]?.completed;
          return (
            <Link key={w.id} to={`/world/${w.id}`} className="card group p-4 transition-colors hover:border-muted">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className={cx('text-[11px] font-bold uppercase tracking-widest', WORLD_TEXT[w.id])}>World {w.num}</div>
                  <div className="text-lg font-extrabold">{w.title}</div>
                  <div className="text-xs text-muted">{w.subtitle}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {bossDone && <Trophy size={16} className="text-warn" />}
                  <Stars n={Math.round(s.stars / 5)} />
                  <span className="text-[10px] text-muted">
                    {s.stars}/{s.maxStars} stars
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted">Mastery</span>
                  <span className="font-mono font-bold">{s.mastery}%</span>
                </div>
                <ProgressBar value={s.mastery} tone={w.color as 'info' | 'accent' | 'violet' | 'warn'} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <Mini label="Questions" value={s.attempts} />
                <Mini label="Accuracy" value={s.accuracy === null ? '—' : `${Math.round(s.accuracy * 100)}%`} />
                <Mini label="Best streak" value={s.bestStreak} />
              </div>
            </Link>
          );
        })}
      </div>

      <h2 className="mt-8 mb-3 text-lg font-bold">Tools</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {tools.map((t) => (
          <Link key={t.to} to={t.to} className="card flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors hover:border-muted">
            <t.icon size={16} className="text-muted" /> <span className="flex-1">{t.label}</span>
            {t.badge && <span className="rounded-full bg-bad/15 px-2 py-0.5 text-[10px] font-bold text-bad">{t.badge}</span>}
          </Link>
        ))}
      </div>
    </Shell>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between">
        <span className="text-muted">{label}</span>
        <span className="font-mono font-bold">{value}%</span>
      </div>
      <ProgressBar value={value} className="mt-1 h-1.5" tone={label === 'Speed' ? 'info' : 'accent'} />
    </div>
  );
}

function Mini({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-raised px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className="font-mono text-sm font-bold">{value}</div>
    </div>
  );
}
