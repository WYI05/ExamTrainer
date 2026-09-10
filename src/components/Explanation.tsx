import { Lightbulb, Sparkles } from 'lucide-react';
import type { Question } from '@/types';
import { givenText } from '@/generators/common';
import { Visual } from './Visuals';
import { cx } from './ui';

interface Props {
  question: Question;
  given: string | number | null;
  correct: boolean;
  headline: string;
  compact?: boolean;
}

export function Explanation({ question: q, given, correct, headline, compact }: Props) {
  const steps = q.explanation.steps;
  return (
    <div className={cx('card animate-rise overflow-hidden', correct ? 'border-good/50' : 'border-bad/50')}>
      <div className={cx('px-4 py-3 text-sm font-bold', correct ? 'bg-good/10 text-good' : 'bg-bad/10 text-bad')}>{headline}</div>
      <div className="space-y-3 p-4 text-sm">
        {!correct && (
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-bad/40 bg-bad/5 px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-wide text-bad">You chose</div>
              <div className="font-medium">{givenText(q, given)}</div>
            </div>
            <div className="rounded-lg border border-good/40 bg-good/5 px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-wide text-good">Correct</div>
              <div className="font-medium">{q.correctText}</div>
            </div>
          </div>
        )}
        {correct && !compact && (
          <div className="rounded-lg border border-good/40 bg-good/5 px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wide text-good">Correct</div>
            <div className="font-medium">{q.correctText}</div>
          </div>
        )}
        {q.visual && <Visual spec={q.visual} />}
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted">Why</div>
          <ol className="space-y-1">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-2">
                {q.isCalc && steps.length > 1 && <span className="shrink-0 font-mono text-xs text-muted">Step {i + 1}</span>}
                <span className="font-mono text-[13px] leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-raised px-3 py-2">
          <Lightbulb size={14} className="mt-0.5 shrink-0 text-warn" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted">Fast rule · </span>
            <span className="font-medium">{q.explanation.fastRule}</span>
          </div>
        </div>
        {q.explanation.memoryTrick && (
          <div className="flex items-start gap-2 px-1 text-muted">
            <Sparkles size={14} className="mt-0.5 shrink-0 text-violet" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wide">Memory trick · </span>
              {q.explanation.memoryTrick}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
