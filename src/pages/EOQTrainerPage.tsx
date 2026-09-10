import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Shell } from '@/components/Layout';
import { EOQVisual } from '@/components/EOQVisual';
import { BalanceScale } from '@/components/BalanceScale';
import { QuizRunner, type SessionSummary } from '@/components/QuizRunner';
import { Results } from '@/components/Results';
import { genEoqIntuition } from '@/generators/eoq';
import { PageTitle } from '@/components/ui';

export function EOQTrainerPage() {
  const nav = useNavigate();
  const [seed, setSeed] = useState(0);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [playing, setPlaying] = useState(false);
  const source = useCallback(() => {
    void seed;
    return genEoqIntuition({ difficulty: 'medium' });
  }, [seed]);

  if (playing) {
    return (
      <Shell focus>
        {summary ? (
          <Results
            summary={summary}
            title="Balance-scale mini-game"
            showStars={false}
            actions={
              <>
                <button className="btn-primary" onClick={() => { setSummary(null); setSeed((s) => s + 1); }}>
                  <RotateCcw size={14} /> Again
                </button>
                <button className="btn-ghost" onClick={() => { setPlaying(false); setSummary(null); }}>
                  Back to trainer
                </button>
              </>
            }
          />
        ) : (
          <QuizRunner key={seed} title="Balance-scale mini-game" subtitle="10 rounds · AHC vs AOC · which way is EOQ?" source={source} total={10} onFinish={setSummary} onExit={() => setPlaying(false)} />
        )}
      </Shell>
    );
  }

  return (
    <Shell>
      <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft size={14} /> Home
      </Link>
      <PageTitle title="Visual EOQ Trainer" sub="Ordering cost falls as Q grows. Holding cost rises. EOQ is where they cross." right={<button className="btn-primary" onClick={() => setPlaying(true)}>Play the balance game</button>} />
      <div className="grid gap-4 lg:grid-cols-2">
        <EOQVisual />
        <div className="space-y-4">
          <BalanceScale />
          <div className="card p-4 text-sm">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">Read the scale</div>
            <ul className="space-y-1.5">
              <li><span className="font-bold text-warn">AHC &gt; AOC</span> → holding too heavy → Q too BIG → EOQ is smaller than Q.</li>
              <li><span className="font-bold text-info">AOC &gt; AHC</span> → ordering too heavy → Q too SMALL → EOQ is larger than Q.</li>
              <li><span className="font-bold text-good">AHC = AOC</span> → you are at EOQ.</li>
            </ul>
          </div>
          <button className="btn-ghost w-full" onClick={() => nav('/practice?skill=eoq&difficulty=medium')}>
            Practice EOQ calculations
          </button>
        </div>
      </div>
    </Shell>
  );
}
