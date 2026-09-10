import type { Question } from '@/types';
import { GRAPHS } from '@/data/diagrams';
import { PrecedenceDiagram } from './PrecedenceDiagram';
import { MultipleChoice } from './MultipleChoice';
import { NumericInput } from './NumericInput';
import { cx } from './ui';

interface Props {
  question: Question;
  selected: string | number | null;
  revealed: boolean;
  correct?: boolean;
  onSelect: (value: string | number) => void;
  disabled?: boolean;
  /** Exam mode: no reveal styling, no correctness shown. */
  hideCorrect?: boolean;
  compactChoices?: boolean;
}

export function QuestionView({ question: q, selected, revealed, correct, onSelect, disabled, hideCorrect, compactChoices }: Props) {
  const graph = q.diagram ? GRAPHS[q.diagram.graphId] : null;
  const layout = q.diagram?.layout;
  const stationOf: Record<string, number> | undefined = layout
    ? Object.fromEntries(layout.flatMap((s, i) => s.map((id) => [id, i])))
    : undefined;
  return (
    <div className="space-y-4">
      {q.given && q.given.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {q.given.map((g, i) => (
            <span key={i} className="rounded-lg border border-line bg-raised px-2.5 py-1 font-mono text-[13px]">
              {g}
            </span>
          ))}
        </div>
      )}
      {graph && (
        <div className="card p-3">
          <PrecedenceDiagram graph={graph} completed={q.diagram?.completed ?? []} showStates={!!q.diagram?.completed} stationOf={stationOf} compact />
          <div className="mt-1 text-center text-[11px] text-muted">
            {graph.name} · total task time {graph.tasks.reduce((a, t) => a + t.time, 0)} sec
          </div>
        </div>
      )}
      <h2 className={cx('whitespace-pre-line text-lg font-bold leading-snug md:text-xl')}>{q.prompt}</h2>
      {q.kind === 'mc' ? (
        <MultipleChoice
          choices={q.choices!}
          selected={typeof selected === 'string' ? selected : null}
          correctId={hideCorrect ? undefined : (q.answer as string)}
          revealed={revealed && !hideCorrect}
          disabled={disabled}
          onSelect={onSelect}
          compact={compactChoices}
        />
      ) : (
        <NumericInput
          key={q.id}
          unit={q.unit}
          revealed={revealed}
          correct={correct}
          disabled={disabled}
          onSubmit={onSelect}
          initial={typeof selected === 'number' ? String(selected) : undefined}
        />
      )}
    </div>
  );
}
