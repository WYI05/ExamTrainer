import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Flame, Home, Settings as SettingsIcon, Sigma, Sparkles, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import { useProgress } from '@/hooks/useProgress';
import { cx } from './ui';

export function Shell({ children, focus }: { children: ReactNode; focus?: boolean }) {
  const { progress } = useProgress();
  const loc = useLocation();
  const nav = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/formulas', label: 'Formulas', icon: Sigma },
    { to: '/shortcuts', label: 'Shortcuts', icon: Sparkles },
    { to: '/notebook', label: 'Mistakes', icon: BookOpen },
  ];
  return (
    <div className="flex min-h-full flex-col">
      {!focus && (
        <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent">
                <Zap size={16} />
              </span>
              <span>
                SCM 300 <span className="text-muted">·</span> <span className="text-muted">Exam Training</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cx(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted hover:bg-raised hover:text-fg',
                    loc.pathname === n.to && 'bg-raised text-fg',
                  )}
                >
                  <n.icon size={15} /> {n.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <span className="chip" title="Best streak">
                <Flame size={12} className="text-warn" /> {progress.bestStreak}
              </span>
              <span className="chip" title="XP">
                <Zap size={12} className="text-accent" /> {progress.xp.toLocaleString()} XP
              </span>
              <Link to="/settings" className="btn-ghost h-8 w-8 !p-0" aria-label="Settings">
                <SettingsIcon size={15} />
              </Link>
            </div>
          </div>
        </header>
      )}
      <main className={cx('mx-auto w-full flex-1 px-4 py-6', focus ? 'max-w-3xl' : 'max-w-5xl')}>{children}</main>
      {!focus && (
        <footer className="border-t border-line py-4 text-center text-xs text-muted">
          Pre-exam practice only. Progress is saved in this browser.
        </footer>
      )}
    </div>
  );
}
