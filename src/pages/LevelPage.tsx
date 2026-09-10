import { useCallback, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Crown, RotateCcw } from 'lucide-react';
import type { Question, WorldId } from '@/types';
import { useProgress } from '@/hooks/useProgress';
import { WORLDS, WORLD_MAP, levelKey } from '@/data/worlds';
import { buildLesson } from '@/data/lessons';
import { FORMULA_MAP } from '@/data/formulas';
import { buckshotBoss, lab2Boss, type BossStage } from '@/data/bosses';
import { bossSet, randomFor, worldSet } from '@/generators';
import { Shell } from '@/components/Layout';
import { QuizRunner, type SessionSummary } from '@/components/QuizRunner';
import { Results } from '@/components/Results';
import { FlashCardView, PalletVisual, SequenceVisual, TeachCard, TeuVisual, WarningCard } from '@/components/LessonCards';
import { FormulaCard } from '@/components/FormulaCard';
import { EOQVisual } from '@/components/EOQVisual';
import { BalanceScale } from '@/components/BalanceScale';
import { PrecedenceDiagram, DiagramLegend } from '@/components/PrecedenceDiagram';
import { GRAPHS } from '@/data/diagrams';
import { ProgressBar, cx } from '@/components/ui';
import { useSound } from '@/hooks/useSound';
import { useKeyboard } from '@/hooks/useKeyboard';

export function LevelPage() {
  const { worldId, level } = useParams();
  const world = WORLD_MAP[worldId as WorldId];
  const lvl = Number(level);
  if (!world || !(lvl >= 1 && lvl <= 5)) return <Navigate to="/" replace />;
  const key = `${world.id}-${lvl}`;
  return (
    <Shell focus>
      <div className="mb-3 flex items-center justify-between">
        <Link to={`/world/${world.id}`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
          <ArrowLeft size={14} /> World {world.num}
        </Link>
      </div>
      {lvl === 1 && <LessonRunner key={key} world={world.id} />}
      {(lvl === 2 || lvl === 3) && <PracticeLevel key={key} world={world.id} level={lvl} />}
      {lvl === 4 && <SpeedLevel key={key} world={world.id} />}
      {lvl === 5 && <BossLevel key={key} world={world.id} />}
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// Level 1 — Learn
// ---------------------------------------------------------------------------
function LessonRunner({ world }: { world: WorldId }) {
  const nav = useNavigate();
  const { completeLevel, addXp } = useProgress();
  const play = useSound();
  const [steps] = useState(() => buildLesson(world));
  const [i, setI] = useState(0);
  const [done, setDone] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [tries, setTries] = useState(0);
  const step = steps[i];
  const w = WORLD_MAP[world];

  const next = useCallback(() => {
    if (i + 1 >= steps.length) {
      const acc = tries ? correctCount / tries : 1;
      completeLevel(world, 1, Math.max(0.5, acc));
      addXp(25);
      play('levelup');
      setDone(true);
      return;
    }
    setI(i + 1);
  }, [i, steps.length, tries, correctCount, completeLevel, world, addXp, play]);

  useKeyboard(
    useCallback(
      (k: string) => {
        if (step && step.kind !== 'question' && (k === 'Enter' || k === ' ' || k === 'ArrowRight')) next();
      },
      [step, next],
    ),
    !done,
  );

  if (done) {
    return (
      <div className="mx-auto max-w-xl animate-rise text-center">
        <div className="card p-8">
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted">Level 1 complete</div>
          <h2 className="mt-2 text-2xl font-extrabold">You learned World {w.num}.</h2>
          <p className="mt-2 text-sm text-muted">
            Try-it questions: {correctCount}/{tries} correct. +25 XP for finishing the lesson.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button className="btn-primary" onClick={() => nav(`/world/${world}/level/2`)}>
              Level 2 · Easy Practice <ArrowRight size={16} />
            </button>
            <button className="btn-ghost" onClick={() => nav(`/world/${world}`)}>
              Back to world
            </button>
          </div>
        </div>
      </div>
    );
  }

  const questionSource = step.kind === 'question' ? [step.question] : null;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold">
            World {w.num} · Learn
          </span>
          <span className="text-xs text-muted">
            {i + 1} / {steps.length}
          </span>
        </div>
        <ProgressBar value={((i + 1) / steps.length) * 100} />
      </div>

      {step.kind === 'teach' && <TeachCard {...step} />}
      {step.kind === 'warning' && <WarningCard title={step.title} lines={step.lines} />}
      {step.kind === 'flash' && <FlashCardView front={step.front} back={step.back} />}
      {step.kind === 'formula' && <FormulaCard f={FORMULA_MAP[step.formulaId]} full />}
      {step.kind === 'visual' && <VisualStep visual={step.visual} />}
      {step.kind === 'question' && questionSource && (
        <LessonQuestion
          key={step.question.id}
          question={step.question}
          onDone={(ok) => {
            setTries((t) => t + 1);
            if (ok) setCorrectCount((c) => c + 1);
            next();
          }}
        />
      )}

      {step.kind !== 'question' && (
        <button className="btn-primary mt-4 w-full py-3 text-base" onClick={next} autoFocus>
          {i + 1 >= steps.length ? 'Finish lesson' : 'Next'} <ArrowRight size={16} />
          <span className="ml-1 hidden text-xs opacity-70 md:inline">Enter</span>
        </button>
      )}
    </div>
  );
}

function LessonQuestion({ question, onDone }: { question: Question; onDone: (ok: boolean) => void }) {
  const [src] = useState(() => [question]);
  return (
    <div>
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-accent">Try it</div>
      <QuizRunner title="Try it" source={src} embedded onFinish={(s) => onDone(s.correct === 1)} />
    </div>
  );
}

function VisualStep({ visual }: { visual: string }) {
  if (visual === 'eoq-slider') return <EOQVisual D={3000} S={400} H={38} />;
  if (visual === 'balance') return <BalanceScale />;
  if (visual === 'sequence') return <SequenceVisual />;
  if (visual === 'pallet') return <PalletVisual />;
  if (visual === 'teu') return <TeuVisual />;
  if (visual === 'precedence-intro') return <PrecedenceIntro />;
  return null;
}

function PrecedenceIntro() {
  const [completed, setCompleted] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const g = GRAPHS.g1;
  return (
    <div className="card animate-pop p-5">
      <div className="text-[11px] font-bold uppercase tracking-wide text-muted">Interactive · click tasks in a valid order</div>
      <p className="mt-1 text-sm text-muted">Blue tasks are available. Gray tasks are locked until every arrow into them is done. Click to complete.</p>
      <div className="mt-3">
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
      </div>
      <div className="mt-2 flex items-center justify-between">
        <DiagramLegend />
        <button className="btn-ghost text-xs" onClick={() => setCompleted([])}>
          <RotateCcw size={12} /> Reset
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Levels 2 & 3 — Practice
// ---------------------------------------------------------------------------
function PracticeLevel({ world, level }: { world: WorldId; level: number }) {
  const nav = useNavigate();
  const { completeLevel } = useProgress();
  const [seed, setSeed] = useState(0);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const questions = useMemo(() => {
    void seed;
    if (level === 2) return worldSet(world, 10, 'easy', { numericChance: 0.15 });
    const a = worldSet(world, 6, 'medium', { numericChance: 0.25 });
    const b = worldSet(world, 6, 'hard', { numericChance: 0.25 });
    return [...a, ...b].sort(() => Math.random() - 0.5);
  }, [world, level, seed]);
  const w = WORLD_MAP[world];

  if (summary) {
    return (
      <Results
        summary={summary}
        title={`World ${w.num} · Level ${level}`}
        actions={
          <>
            <button className="btn-ghost" onClick={() => { setSummary(null); setSeed((s) => s + 1); }}>
              <RotateCcw size={14} /> Retry
            </button>
            <button className="btn-primary" onClick={() => nav(`/world/${world}/level/${level + 1}`)}>
              Next level <ArrowRight size={14} />
            </button>
            <button className="btn-ghost" onClick={() => nav(`/world/${world}`)}>
              World map
            </button>
          </>
        }
      />
    );
  }

  return (
    <QuizRunner
      key={seed}
      title={`World ${w.num} · Level ${level} · ${level === 2 ? 'Easy Practice' : 'Mixed Practice'}`}
      subtitle={level === 2 ? 'Clean numbers · obvious formula · 3 hearts' : 'Identify the variables · one extra step · 3 hearts'}
      source={questions}
      hearts
      onFinish={(s) => {
        completeLevel(world, level, s.accuracy);
        setSummary(s);
      }}
      onExit={() => nav(`/world/${world}`)}
    />
  );
}

// ---------------------------------------------------------------------------
// Level 4 — Speed Round (60 seconds, this world only)
// ---------------------------------------------------------------------------
function SpeedLevel({ world }: { world: WorldId }) {
  const nav = useNavigate();
  const { completeLevel } = useProgress();
  const [seed, setSeed] = useState(0);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const source = useCallback(() => {
    void seed;
    return randomFor(world, 'easy');
  }, [world, seed]);
  const w = WORLD_MAP[world];

  if (summary) {
    return (
      <Results
        summary={summary}
        title={`World ${w.num} · Speed Round · ${summary.total} answered in 60s`}
        actions={
          <>
            <button className="btn-ghost" onClick={() => { setSummary(null); setSeed((s) => s + 1); }}>
              <RotateCcw size={14} /> Again
            </button>
            <button className="btn-primary" onClick={() => nav(`/world/${world}/level/5`)}>
              Boss Battle <Crown size={14} />
            </button>
          </>
        }
      />
    );
  }
  return (
    <QuizRunner
      key={seed}
      title={`World ${w.num} · Speed Round`}
      subtitle="60 seconds · as many as you can · no hints"
      source={source}
      rapid
      hints={false}
      timeLimitSec={60}
      onFinish={(s) => {
        completeLevel(world, 4, s.total >= 3 ? Math.max(0.5, s.accuracy) : s.accuracy);
        setSummary(s);
      }}
      onExit={() => nav(`/world/${world}`)}
      intro={
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted">Speed Round</div>
          <h2 className="mt-1 text-2xl font-extrabold">60 seconds. Go.</h2>
          <p className="mt-2 text-sm text-muted">Quick questions from World {w.num}. Answer fast with 1–4 or A–D. Misses are reviewed at the end.</p>
        </div>
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Level 5 — Boss Battle
// ---------------------------------------------------------------------------
function BossLevel({ world }: { world: WorldId }) {
  const nav = useNavigate();
  const { completeLevel, markBoss, progress } = useProgress();
  const [seed, setSeed] = useState(0);
  const stages = useMemo<BossStage[]>(() => {
    void seed;
    if (world === 'w2') return buckshotBoss();
    if (world === 'w3') return lab2Boss();
    return [{ title: `World ${WORLD_MAP[world].num} Boss`, intro: ['Everything from this world, mixed together.'], questions: bossSet(world) }];
  }, [world, seed]);
  const [stageIdx, setStageIdx] = useState(0);
  const [phase, setPhase] = useState<'intro' | 'run' | 'done'>('intro');
  const [all, setAll] = useState<SessionSummary[]>([]);
  const w = WORLD_MAP[world];
  const bossName = world === 'w2' ? 'Buckshot Electronics' : world === 'w3' ? 'SCM Lab 2 Line' : `${w.title} Boss`;
  const stage = stages[stageIdx];
  const beaten = progress.bosses[world];

  const finishStage = (s: SessionSummary) => {
    const next = [...all, s];
    setAll(next);
    if (stageIdx + 1 >= stages.length) {
      const merged = mergeSummaries(next);
      completeLevel(world, 5, merged.accuracy);
      if (merged.accuracy >= 0.7) markBoss(world);
      setPhase('done');
    } else {
      setStageIdx(stageIdx + 1);
      setPhase('intro');
    }
  };

  if (phase === 'done') {
    const merged = mergeSummaries(all);
    const won = merged.accuracy >= 0.7;
    const allBeaten = WORLDS.every((x) => x.id === world ? won || beaten : progress.levels[levelKey(x.id, 5)]?.completed);
    return (
      <Results
        summary={merged}
        title={won ? `${bossName} defeated` : `${bossName} — not yet (need 70%)`}
        actions={
          <>
            <button className="btn-ghost" onClick={() => { setAll([]); setStageIdx(0); setPhase('intro'); setSeed((s) => s + 1); }}>
              <RotateCcw size={14} /> Rematch
            </button>
            {allBeaten ? (
              <button className="btn-primary" onClick={() => nav('/final-boss')}>
                Final Boss unlocked <Crown size={14} />
              </button>
            ) : (
              <button className="btn-primary" onClick={() => nav('/')}>
                Home
              </button>
            )}
          </>
        }
      />
    );
  }

  if (phase === 'intro') {
    return (
      <div className="mx-auto max-w-2xl animate-rise">
        <div className={cx('card p-6', 'border-warn/50')}>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-warn">
            <Crown size={14} /> Boss Battle · {bossName}
          </div>
          <h2 className="mt-2 text-2xl font-extrabold">{stage.title}</h2>
          <div className="mt-2 space-y-1 text-sm text-muted">
            {stage.intro.map((l, i) => (
              <p key={i}>{l}</p>
            ))}
          </div>
          {stages.length > 1 && (
            <div className="mt-4 flex gap-1">
              {stages.map((s, i) => (
                <div key={i} className={cx('h-1.5 flex-1 rounded-full', i < stageIdx ? 'bg-good' : i === stageIdx ? 'bg-warn' : 'bg-raised')} title={s.title} />
              ))}
            </div>
          )}
          <button className="btn-primary mt-5 w-full py-3" onClick={() => setPhase('run')} autoFocus>
            {stageIdx === 0 ? 'Fight' : 'Continue'} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <QuizRunner
      key={`${seed}-${stageIdx}`}
      title={`${bossName} · ${stage.title}`}
      subtitle={`Stage ${stageIdx + 1} of ${stages.length}`}
      source={stage.questions}
      onFinish={finishStage}
      onExit={() => nav(`/world/${world}`)}
    />
  );
}

export function mergeSummaries(list: SessionSummary[]): SessionSummary {
  const records = list.flatMap((s) => s.records);
  const correct = records.filter((r) => r.correct).length;
  const totalMs = records.reduce((a, r) => a + r.timeMs, 0);
  return {
    records,
    correct,
    total: records.length,
    accuracy: records.length ? correct / records.length : 0,
    bestStreak: Math.max(0, ...list.map((s) => s.bestStreak)),
    xp: list.reduce((a, s) => a + s.xp, 0),
    avgMs: records.length ? totalMs / records.length : 0,
    totalMs,
  };
}
