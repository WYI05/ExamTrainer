import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Lightbulb, Timer, X } from 'lucide-react';
import type { AnswerRecord, Question } from '@/types';
import { isCorrect, mistakeFor, xpFor } from '@/generators/common';
import { useProgress } from '@/hooks/useProgress';
import { useSound } from '@/hooks/useSound';
import { choiceIndexFromKey, useKeyboard } from '@/hooks/useKeyboard';
import { useCountdown } from '@/hooks/useTimer';
import { secondsToClock } from '@/utils/format';
import { Explanation } from './Explanation';
import { QuestionView } from './QuestionView';
import { Hearts, StreakBadge, XPToast } from './Badges';
import { CalculatorButton } from './Calculator';
import { Kbd, Modal, ProgressBar, cx } from './ui';

export interface SessionSummary {
  records: AnswerRecord[];
  correct: number;
  total: number;
  accuracy: number;
  bestStreak: number;
  xp: number;
  avgMs: number;
  totalMs: number;
  timedOut?: boolean;
}

interface Props {
  title: string;
  subtitle?: string;
  source: Question[] | ((index: number) => Question | null);
  /** Number of questions; omit for unlimited (timed sprints). */
  total?: number;
  hearts?: boolean;
  hints?: boolean;
  /** Sprint mode: short feedback then auto-advance. */
  rapid?: boolean;
  timeLimitSec?: number;
  paceWarnSec?: number;
  record?: boolean;
  embedded?: boolean;
  intro?: ReactNode;
  onFinish: (s: SessionSummary) => void;
  onExit?: () => void;
}

const CORRECT_LINES: Record<string, string[]> = {
  precedence: ['Nice — you caught the predecessor.', 'Exactly. Arrows first, then time.', 'Clean. That station works.'],
  'effective-ct': ['Nice — you caught the bottleneck.', 'Yes. The slowest station sets the pace.'],
  'eoq-intuition': ['Exactly. Bigger Q means more holding cost.', 'Right — the heavy side tells you which way to move.'],
  eoq: ['Clean EOQ.', 'That’s the one. √(2DS/H).'],
  'holding-cost': ['Yes — rate × unit cost.', 'Exactly. Now that’s a real H.'],
  'cycle-time': ['Right. Never round cycle time up.', 'Exactly — round down to protect output.'],
  'theoretical-min': ['Right. Stations always round up.', 'Yes — you can’t build 0.07 of a station.'],
  teu: ['Yes — 40-ft counts double.', 'Clean TEU math.'],
  default: ['Correct.', 'Nice.', 'That’s it.', 'Fast and right.', 'Exactly.', 'Locked in.'],
};
const WRONG_LINES: Record<string, string[]> = {
  precedence: ['Almost. Check the predecessor first.', 'Not quite — trace the arrows into each task.'],
  'effective-ct': ['Almost. Which station is slowest?'],
  'eoq-intuition': ['Not quite. Which cost is heavier right now?'],
  'cycle-time': ['Careful — cycle time never rounds up.'],
  'theoretical-min': ['Careful — workstations always round up.'],
  'holding-cost': ['Almost. A percentage is not H until you multiply by unit cost.'],
  teu: ['Almost. A 40-ft container is 2 TEUs.'],
  default: ['Not quite. Here’s why.', 'Almost. Look at the steps.', 'Close — check the rule below.'],
};

function line(map: Record<string, string[]>, skill: string, streak: number) {
  const pool = map[skill] ?? map.default;
  const l = pool[streak % pool.length];
  return l;
}

export function QuizRunner({ title, subtitle, source, total, hearts, hints = true, rapid, timeLimitSec, paceWarnSec = 90, record = true, embedded, intro, onFinish, onExit }: Props) {
  const { recordAnswer } = useProgress();
  const play = useSound();

  const [index, setIndex] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<string | number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [heartsModal, setHeartsModal] = useState(false);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [xpTrigger, setXpTrigger] = useState(0);
  const [lastXp, setLastXp] = useState(0);
  const [showIntro, setShowIntro] = useState(!!intro);
  const [finished, setFinished] = useState(false);
  const startRef = useRef(Date.now());
  const sessionStart = useRef(Date.now());
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const bestStreakRef = useRef(0);
  const finishedRef = useRef(false);

  const resolvedTotal = total ?? (Array.isArray(source) ? source.length : undefined);

  // Load question for index.
  useEffect(() => {
    const q = Array.isArray(source) ? (source[index] ?? null) : source(index);
    setQuestion(q);
    setSelected(null);
    setRevealed(false);
    setHintsUsed(0);
    startRef.current = Date.now();
    if (!q && !finished) finish(records, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, source]);

  const finish = useCallback((recs: AnswerRecord[], timedOut: boolean) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinished(true);
    const correctCount = recs.filter((r) => r.correct).length;
    const totalMs = recs.reduce((a, r) => a + r.timeMs, 0);
    finishRef.current({
      records: recs,
      correct: correctCount,
      total: recs.length,
      accuracy: recs.length ? correctCount / recs.length : 0,
      bestStreak: bestStreakRef.current,
      xp: recs.reduce((a, r) => a + r.xp, 0),
      avgMs: recs.length ? totalMs / recs.length : 0,
      totalMs,
      timedOut,
    });
  }, []);

  const running = !showIntro && !finished;
  const remaining = useCountdown(timeLimitSec ?? 0, !!timeLimitSec && running, () => finish(recordsRef.current, true));
  const recordsRef = useRef(records);
  recordsRef.current = records;

  const next = useCallback(() => {
    if (finished) return;
    if (resolvedTotal !== undefined && index + 1 >= resolvedTotal) {
      finish(recordsRef.current, false);
      return;
    }
    setIndex((i) => i + 1);
  }, [finished, index, resolvedTotal, finish]);

  const answer = useCallback(
    (value: string | number) => {
      if (!question || revealed) return;
      const ok = isCorrect(question, value);
      const timeMs = Date.now() - startRef.current;
      const xp = xpFor(question, ok, hintsUsed);
      const rec: AnswerRecord = { question, given: value, correct: ok, timeMs, hintsUsed, xp, mistake: ok ? undefined : mistakeFor(question, value) };
      const newStreak = ok ? streak + 1 : 0;
      setSelected(value);
      setRevealed(true);
      setCorrect(ok);
      setStreak(newStreak);
      bestStreakRef.current = Math.max(bestStreakRef.current, newStreak);
      setRecords((r) => [...r, rec]);
      recordsRef.current = [...recordsRef.current, rec];
      if (ok) {
        setLastXp(xp);
        setXpTrigger((t) => t + 1);
        play(newStreak > 0 && newStreak % 5 === 0 ? 'levelup' : 'correct');
      } else {
        play('wrong');
        if (hearts) {
          const left = lives - 1;
          setLives(Math.max(0, left));
          if (left <= 0) setHeartsModal(true);
        }
      }
      if (record) recordAnswer(rec, newStreak);
      if (rapid) window.setTimeout(() => next(), ok ? 550 : 1100);
    },
    [question, revealed, hintsUsed, streak, play, hearts, lives, record, recordAnswer, rapid, next],
  );

  useKeyboard(
    useCallback(
      (key: string, e: KeyboardEvent) => {
        if (showIntro) {
          if (key === 'Enter' || key === ' ') setShowIntro(false);
          return;
        }
        if (!question) return;
        if (!revealed && question.kind === 'mc') {
          const i = choiceIndexFromKey(key);
          if (i !== null && question.choices?.[i]) {
            e.preventDefault();
            answer(question.choices[i].id);
            return;
          }
        }
        if (revealed && !rapid && (key === 'Enter' || key === ' ' || key === 'ArrowRight')) {
          e.preventDefault();
          next();
        }
        if (!revealed && hints && (key === 'h' || key === 'H') && hintsUsed < 2) setHintsUsed((h) => h + 1);
      },
      [showIntro, question, revealed, rapid, answer, next, hints, hintsUsed],
    ),
    running || showIntro,
  );

  const answeredMs = records.reduce((a, r) => a + r.timeMs, 0);
  const avgSec = records.length ? answeredMs / records.length / 1000 : 0;
  const slow = records.length >= 3 && avgSec > paceWarnSec;
  const elapsed = useMemo(() => Math.floor((Date.now() - sessionStart.current) / 1000), [index, revealed]); // eslint-disable-line react-hooks/exhaustive-deps

  if (showIntro) {
    return (
      <div className="mx-auto max-w-2xl animate-rise">
        <div className="card p-6">
          {intro}
          <button className="btn-primary mt-5 w-full" onClick={() => setShowIntro(false)} autoFocus>
            Start <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const progressPct = resolvedTotal ? ((index + (revealed ? 1 : 0)) / resolvedTotal) * 100 : timeLimitSec ? (1 - remaining / timeLimitSec) * 100 : 0;

  return (
    <div className={cx('mx-auto w-full', embedded ? '' : 'max-w-2xl')}>
      {!embedded && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{title}</div>
              {subtitle && <div className="truncate text-xs text-muted">{subtitle}</div>}
            </div>
            <div className="flex items-center gap-2">
              {timeLimitSec ? (
                <span className={cx('chip font-mono', remaining <= 10 && 'border-bad text-bad')}>
                  <Timer size={12} /> {secondsToClock(remaining)}
                </span>
              ) : (
                <span className="chip font-mono">
                  <Timer size={12} /> {secondsToClock(elapsed)}
                </span>
              )}
              {hearts && <Hearts n={lives} />}
              <StreakBadge streak={streak} />
              {onExit && (
                <button className="btn-ghost h-8 w-8 !p-0" onClick={onExit} aria-label="Exit">
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
          <ProgressBar value={progressPct} />
          {resolvedTotal && (
            <div className="flex justify-between text-[11px] text-muted">
              <span>
                Question {Math.min(index + 1, resolvedTotal)} of {resolvedTotal}
              </span>
              {slow && <span className="text-warn">Pace check: avg {Math.round(avgSec)}s / question (target ≤ {paceWarnSec}s)</span>}
            </div>
          )}
        </div>
      )}

      <div className="relative">
        <XPToast amount={lastXp} trigger={xpTrigger} />
        <div key={question.id} className="card animate-pop p-5 md:p-6">
          <QuestionView question={question} selected={selected} revealed={revealed} correct={correct} onSelect={answer} />

          {!revealed && hints && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button className="btn-ghost text-xs" onClick={() => setHintsUsed((h) => Math.min(2, h + 1))} disabled={hintsUsed >= 2}>
                <Lightbulb size={14} className="text-warn" /> Hint {hintsUsed < 2 ? `(${2 - hintsUsed} left)` : ''}
              </button>
              {question.isCalc && <CalculatorButton className="text-xs" />}
              <span className="ml-auto hidden items-center gap-1 text-[11px] text-muted md:flex">
                {question.kind === 'mc' && (
                  <>
                    <Kbd>1</Kbd>–<Kbd>4</Kbd> or <Kbd>A</Kbd>–<Kbd>D</Kbd>
                  </>
                )}
                <Kbd>H</Kbd> hint
              </span>
            </div>
          )}
          {!revealed && hintsUsed > 0 && (
            <div className="mt-3 space-y-2">
              {question.hints.slice(0, hintsUsed).map((h, i) => (
                <div key={i} className="animate-rise rounded-lg border border-warn/40 bg-warn/5 px-3 py-2 text-sm">
                  <span className="mr-1 font-bold text-warn">Hint {i + 1}:</span> {h}
                </div>
              ))}
              <div className="text-[11px] text-muted">Using hints lowers XP a little.</div>
            </div>
          )}
        </div>

        {revealed && (
          <div className="mt-4 space-y-3">
            {rapid ? (
              <div className={cx('rounded-xl px-4 py-3 text-sm font-bold', correct ? 'bg-good/10 text-good' : 'bg-bad/10 text-bad')}>
                {correct ? line(CORRECT_LINES, question.skill, streak) : `${line(WRONG_LINES, question.skill, index)} Correct: ${question.correctText}`}
              </div>
            ) : (
              <>
                <Explanation question={question} given={selected} correct={correct} headline={correct ? line(CORRECT_LINES, question.skill, streak) : line(WRONG_LINES, question.skill, index)} />
                <button className="btn-primary w-full py-3 text-base" onClick={next} autoFocus>
                  {resolvedTotal !== undefined && index + 1 >= resolvedTotal ? 'See results' : 'Next'} <ArrowRight size={16} />
                  <span className="ml-1 hidden text-xs opacity-70 md:inline">Enter</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <Modal open={heartsModal} onClose={() => setHeartsModal(false)} title="Out of hearts">
        <p className="text-sm text-muted">No penalty — hearts are just a signal to slow down and read the explanation. Keep going.</p>
        <button
          className="btn-primary mt-4 w-full"
          onClick={() => {
            setLives(3);
            setHeartsModal(false);
          }}
        >
          Refill and continue
        </button>
      </Modal>
    </div>
  );
}
