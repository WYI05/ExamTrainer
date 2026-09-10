import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { genFormulaRecognition } from '@/generators/formulaRecognition';
import { Shell } from '@/components/Layout';
import { QuizRunner, type SessionSummary } from '@/components/QuizRunner';
import { Results } from '@/components/Results';

export function FormulaGame() {
  const nav = useNavigate();
  const [seed, setSeed] = useState(0);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const source = useCallback(
    (i: number) => {
      void seed;
      return genFormulaRecognition({ difficulty: i < 4 ? 'easy' : 'medium' });
    },
    [seed],
  );
  return (
    <Shell focus>
      <Link to="/formulas" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft size={14} /> Formula sheet
      </Link>
      {summary ? (
        <Results
          summary={summary}
          title="Formula recognition"
          showStars={false}
          actions={
            <>
              <button className="btn-primary" onClick={() => { setSummary(null); setSeed((s) => s + 1); }}>
                <RotateCcw size={14} /> Play again
              </button>
              <button className="btn-ghost" onClick={() => nav('/')}>
                Home
              </button>
            </>
          }
        />
      ) : (
        <QuizRunner
          key={seed}
          title="Which formula?"
          subtitle="12 rounds · read the ask, pick the formula · the exam is timed, so this matters"
          source={source}
          total={12}
          hints={false}
          onFinish={setSummary}
          onExit={() => nav('/formulas')}
        />
      )}
    </Shell>
  );
}
