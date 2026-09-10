import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, Flame, RotateCcw, Timer, Zap } from 'lucide-react';
import type { AnswerRecord } from '@/types';
import type { SessionSummary } from './QuizRunner';
import { Explanation } from './Explanation';
import { Ring, Stars, Stat, cx } from './ui';
import { GRAPHS } from '@/data/diagrams';
import { PrecedenceDiagram } from './PrecedenceDiagram';

export function starsFor(accuracy: number): number {
  return accuracy >= 0.9 ? 3 : accuracy >= 0.75 ? 2 : accuracy >= 0.5 ? 1 : 0;
}

export function Results({ summary, title, actions, showStars = true }: { summary: SessionSummary; title: string; actions: ReactNode; showStars?: boolean }) {
  const missed = summary.records.filter((r) => !r.correct);
  const stars = starsFor(summary.accuracy);
  return (
    <div className="mx-auto max-w-2xl animate-rise space-y-4">
      <div className="card p-6 text-center">
        <div className="text-[11px] font-bold uppercase tracking-wide text-muted">{title}</div>
        <div className="mt-2 text-2xl font-extrabold">
          {summary.accuracy >= 0.9 ? 'Excellent.' : summary.accuracy >= 0.75 ? 'Solid.' : summary.accuracy >= 0.5 ? 'Getting there.' : 'Keep drilling.'}
        </div>
        {showStars && (
          <div className="mt-2 flex justify-center">
            <Stars n={stars} size={22} />
          </div>
        )}
        <div className="mt-4 flex justify-center">
          <Ring value={summary.accuracy * 100} size={120} stroke={10} label={`${summary.correct}/${summary.total}`} sub="correct" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="XP" value={<span className="flex items-center justify-center gap-1"><Zap size={16} className="text-accent" />+{summary.xp}</span>} />
          <Stat label="Best streak" value={<span className="flex items-center justify-center gap-1"><Flame size={16} className="text-warn" />{summary.bestStreak}</span>} />
          <Stat label="Avg / question" value={<span className="flex items-center justify-center gap-1"><Timer size={16} className="text-info" />{Math.round(summary.avgMs / 1000)}s</span>} />
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>
      </div>
      {missed.length > 0 && <MistakeReview records={missed} />}
    </div>
  );
}

export function MistakeReview({ records, title = 'Review your misses' }: { records: AnswerRecord[]; title?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-bold">
        <RotateCcw size={14} className="text-bad" /> {title} ({records.length})
      </div>
      {records.map((r, i) => {
        const graph = r.question.diagram ? GRAPHS[r.question.diagram.graphId] : null;
        return (
          <div key={r.question.id} className="card overflow-hidden">
            <button type="button" className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-raised" onClick={() => setOpen(open === i ? null : i)}>
              <span className="line-clamp-2 font-medium">{r.question.prompt}</span>
              {open === i ? <ChevronUp size={16} className="shrink-0 text-muted" /> : <ChevronDown size={16} className="shrink-0 text-muted" />}
            </button>
            {open === i && (
              <div className={cx('space-y-3 border-t border-line p-4')}>
                {r.question.given && (
                  <div className="flex flex-wrap gap-1.5">
                    {r.question.given.map((g, j) => (
                      <span key={j} className="rounded-md bg-raised px-2 py-0.5 font-mono text-xs">
                        {g}
                      </span>
                    ))}
                  </div>
                )}
                {graph && <PrecedenceDiagram graph={graph} completed={r.question.diagram?.completed ?? []} showStates={!!r.question.diagram?.completed} compact />}
                <Explanation question={r.question} given={r.given} correct={false} headline="What went wrong" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
