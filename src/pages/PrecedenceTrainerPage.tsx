import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Shell } from '@/components/Layout';
import { PrecedenceBuilder } from '@/components/PrecedenceBuilder';
import { PrecedenceDiagram, DiagramLegend } from '@/components/PrecedenceDiagram';
import { QuizRunner, type SessionSummary } from '@/components/QuizRunner';
import { Results } from '@/components/Results';
import { GRAPHS } from '@/data/diagrams';
import { genPrecedenceRandom } from '@/generators/precedence';
import { PageTitle, cx } from '@/components/ui';

export function PrecedenceTrainerPage() {
  const nav = useNavigate();
  const [tab, setTab] = useState<'build' | 'explore' | 'drill'>('build');
  const [graphId, setGraphId] = useState('lab2');
  const [completed, setCompleted] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [seed, setSeed] = useState(0);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const g = GRAPHS[graphId];
  const source = useCallback(() => {
    void seed;
    return genPrecedenceRandom({ difficulty: 'medium' });
  }, [seed]);

  return (
    <Shell>
      <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft size={14} /> Home
      </Link>
      <PageTitle title="Visual Precedence Trainer" sub="Build a line, explore the diagrams, or drill precedence questions." />
      <div className="mb-4 flex gap-2">
        {(['build', 'explore', 'drill'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cx('rounded-full border px-4 py-1.5 text-sm font-semibold capitalize', tab === t ? 'border-violet bg-violet/15 text-violet' : 'border-line')}>
            {t === 'build' ? 'Build a line' : t === 'explore' ? 'Explore diagrams' : 'Drill'}
          </button>
        ))}
      </div>

      {tab === 'build' && <PrecedenceBuilder />}

      {tab === 'explore' && (
        <div className="card p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {Object.values(GRAPHS).map((x) => (
              <button key={x.id} onClick={() => { setGraphId(x.id); setCompleted([]); setSelected(null); }} className={cx('rounded-full border px-3 py-1 text-sm', graphId === x.id ? 'border-accent bg-accent/15 text-accent' : 'border-line')}>
                {x.name}
              </button>
            ))}
            <button className="btn-ghost ml-auto text-xs" onClick={() => setCompleted([])}>
              <RotateCcw size={12} /> Reset
            </button>
          </div>
          <p className="mb-2 text-sm text-muted">Click available (blue) tasks to complete them in a valid order. Click any node to see its prerequisites.</p>
          <PrecedenceDiagram
            graph={g}
            completed={completed}
            selected={selected}
            onNodeClick={(id) => {
              setSelected(id);
              const preds = g.edges.filter(([, b]) => b === id).map(([a]) => a);
              if (!completed.includes(id) && preds.every((p) => completed.includes(p))) setCompleted((c) => [...c, id]);
            }}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <DiagramLegend />
            <span className="text-xs text-muted">Total task time: {g.tasks.reduce((a, t) => a + t.time, 0)} sec</span>
          </div>
        </div>
      )}

      {tab === 'drill' &&
        (summary ? (
          <Results
            summary={summary}
            title="Precedence drill"
            showStars={false}
            actions={
              <>
                <button className="btn-primary" onClick={() => { setSummary(null); setSeed((s) => s + 1); }}>
                  <RotateCcw size={14} /> Again
                </button>
                <button className="btn-ghost" onClick={() => nav('/')}>Home</button>
              </>
            }
          />
        ) : (
          <QuizRunner key={seed} title="Precedence drill" subtitle="8 questions · next station, layout verdicts, eligible tasks" source={source} total={8} onFinish={setSummary} />
        ))}
    </Shell>
  );
}
