import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Check, Crown, Lock, Play, Swords, Timer, Zap } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import { LEVELS, SKILLS, WORLD_MAP, levelKey } from '@/data/worlds';
import { skillMastery, worldStats } from '@/utils/mastery';
import { Shell } from '@/components/Layout';
import { MasteryBadge } from '@/components/Badges';
import { PageTitle, Stars, Stat, cx } from '@/components/ui';
import type { WorldId } from '@/types';

const ICONS = [BookOpen, Play, Zap, Timer, Swords];

export function WorldPage() {
  const { worldId } = useParams();
  const { progress } = useProgress();
  const world = WORLD_MAP[worldId as WorldId];
  if (!world) return <Navigate to="/" replace />;
  const s = worldStats(progress, world.id);
  const skills = SKILLS.filter((k) => k.world === world.id);

  return (
    <Shell>
      <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft size={14} /> Home
      </Link>
      <PageTitle title={`World ${world.num} · ${world.title}`} sub={world.subtitle} right={<Stars n={Math.round(s.stars / 5)} size={20} />} />

      <div className="grid gap-2 sm:grid-cols-4">
        <Stat label="Mastery" value={`${s.mastery}%`} />
        <Stat label="Questions" value={s.attempts} />
        <Stat label="Accuracy" value={s.accuracy === null ? '—' : `${Math.round(s.accuracy * 100)}%`} />
        <Stat label="Best streak" value={s.bestStreak} />
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-[1fr_280px]">
        <div className="space-y-2">
          {LEVELS.map((l, i) => {
            const st = progress.levels[levelKey(world.id, l.num)];
            const unlocked = l.num === 1 || progress.levels[levelKey(world.id, l.num - 1)]?.completed;
            const Icon = ICONS[i];
            const isBoss = l.num === 5;
            return (
              <Link
                key={l.num}
                to={unlocked ? `/world/${world.id}/level/${l.num}` : '#'}
                onClick={(e) => !unlocked && e.preventDefault()}
                className={cx(
                  'card flex items-center gap-4 p-4 transition-colors',
                  unlocked ? 'hover:border-muted' : 'opacity-50',
                  isBoss && unlocked && 'border-warn/50',
                )}
              >
                <div className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-xl', st?.completed ? 'bg-good/15 text-good' : unlocked ? 'bg-accent/15 text-accent' : 'bg-raised text-muted')}>
                  {st?.completed ? <Check size={20} /> : unlocked ? <Icon size={20} /> : <Lock size={18} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Level {l.num}</span>
                    {isBoss && <Crown size={12} className="text-warn" />}
                  </div>
                  <div className="font-extrabold">{l.title}</div>
                  <div className="text-xs text-muted">{l.blurb}</div>
                </div>
                <div className="text-right">
                  <Stars n={st?.stars ?? 0} />
                  {st?.bestAccuracy ? <div className="text-[10px] text-muted">best {Math.round(st.bestAccuracy * 100)}%</div> : null}
                </div>
              </Link>
            );
          })}
        </div>
        <div className="card p-4">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-muted">Skills in this world</div>
          <div className="space-y-3">
            {skills.map((k) => (
              <div key={k.id}>
                <div className="mb-1 text-sm font-medium">{k.label}</div>
                <MasteryBadge value={skillMastery(progress.skills[k.id])} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
