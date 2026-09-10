import { Check, X } from 'lucide-react';
import type { Choice } from '@/types';
import { cx } from './ui';

interface Props {
  choices: Choice[];
  selected: string | null;
  correctId?: string; // shown after answering
  revealed: boolean;
  disabled?: boolean;
  onSelect: (id: string) => void;
  compact?: boolean;
}

const KEYS = ['A', 'B', 'C', 'D'];

export function MultipleChoice({ choices, selected, correctId, revealed, disabled, onSelect, compact }: Props) {
  return (
    <div className={cx('grid gap-2.5', compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2')}>
      {choices.map((c, i) => {
        const isSel = selected === c.id;
        const isCorrect = revealed && correctId === c.id;
        const isWrong = revealed && isSel && correctId !== c.id;
        return (
          <button
            key={c.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(c.id)}
            className={cx(
              'group flex min-h-[56px] w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[15px] font-medium transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              !revealed && !isSel && 'border-line bg-surface hover:border-muted hover:bg-raised',
              !revealed && isSel && 'border-accent bg-accent/10',
              isCorrect && 'border-good bg-good/10 text-fg',
              isWrong && 'animate-shake border-bad bg-bad/10',
              revealed && !isCorrect && !isWrong && 'border-line bg-surface opacity-60',
            )}
          >
            <span
              className={cx(
                'grid h-7 w-7 shrink-0 place-items-center rounded-md border font-mono text-xs font-bold',
                isCorrect ? 'border-good bg-good text-bg' : isWrong ? 'border-bad bg-bad text-bg' : 'border-line bg-raised text-muted group-hover:text-fg',
              )}
            >
              {isCorrect ? <Check size={14} /> : isWrong ? <X size={14} /> : KEYS[i]}
            </span>
            <span className="whitespace-pre-line">{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
