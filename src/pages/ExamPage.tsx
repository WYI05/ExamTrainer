import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Crown, Flag, RotateCcw, Sigma, Timer } from 'lucide-react';
import type { AnswerRecord, ExamAttempt, WorldId } from '@/types';
import { examSet } from '@/generators';
import { isCorrect, mistakeFor, xpFor } from '@/generators/common';
import { useProgress } from '@/hooks/useProgress';
import { useCountdown } from '@/hooks/useTimer';
import { choiceIndexFromKey, useKeyboard } from '@/hooks/useKeyboard';
import { SKILL_MAP, WORLDS } from '@/data/worlds';
import { FORMULAS } from '@/data/formulas';
import { Shell } from '@/components/Layout';
import { QuestionView } from '@/components/QuestionView';
import { ExamTimer } from '@/components/ExamTimer';
import { CalculatorButton } from '@/components/Calculator';
import { MistakeReview } from '@/components/Results';
import { Modal, Ring, Stat, cx } from '@/components/ui';
import { uid } from '@/utils/random';
import { secondsToClock } from '@/utils/format';

const TOTAL_SEC = 60 * 60;
const POINTS_PER_Q = 5;

export function ExamPage({ mode }: { mode: 'sim' | 'final' }) {
  const nav = useNavigate();
  const { recordAnswer, addExamAttempt, markBoss } = useProgress();
  const [phase, setPhase] = useState<'intro' | 'run' | 'done'>('intro');
  const [seed, setSeed] = useState(0);
  const questions = useMemo(() => {
    void seed;
    return examSet({ difficulty: 'exam' });
  }, [seed]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [times, setTimes] = useState<Record<string, number>>({});
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [result, setResult] = useState<{ attempt: ExamAttempt; records: AnswerRecord[] } | null>(null);
  const enteredAt = useRef(Date.now());
  const startedAt = useRef(Date.now());

  const q = questions[idx];

  const flushTime = useCallback(() => {
    const now = Date.now();
    const cur = questions[idx];
    if (cur) setTimes((t) => ({ ...t, [cur.id]: (t[cur.id] ?? 0) + (now - enteredAt.current) }));
    enteredAt.current = now;
  }, [idx, questions]);

  const goTo = (i: number) => {
    flushTime();
    setIdx(Math.max(0, Math.min(questions.length - 1, i)));
  };

  const finish = useCallback(
    (timedOut: boolean) => {
      const now = Date.now();
      const finalTimes = { ...times };
      const cur = questions[idx];
      if (cur) finalTimes[cur.id] = (finalTimes[cur.id] ?? 0) + (now - enteredAt.current);
      const records: AnswerRecord[] = questions.map((qq) => {
        const given = answers[qq.id] ?? null;
        const ok = isCorrect(qq, given);
        const rec: AnswerRecord = { question: qq, given, correct: ok, timeMs: finalTimes[qq.id] ?? 0, hintsUsed: 0, xp: xpFor(qq, ok, 0), mistake: ok ? undefined : mistakeFor(qq, given) };
        return rec;
      });
      let streak = 0;
      for (const r of records) {
        streak = r.correct ? streak + 1 : 0;
        recordAnswer(r, streak);
      }
      const correct = records.filter((r) => r.correct).length;
      const byWorld = { w1: { correct: 0, total: 0 }, w2: { correct: 0, total: 0 }, w3: { correct: 0, total: 0 }, w4: { correct: 0, total: 0 } } as Record<WorldId, { correct: number; total: number }>;
      for (const r of records) {
        const w = SKILL_MAP[r.question.skill].world;
        const key: WorldId = w === 'all' ? 'w2' : w;
        byWorld[key].total += 1;
        if (r.correct) byWorld[key].correct += 1;
      }
      const timeUsedSec = timedOut ? TOTAL_SEC : Math.min(TOTAL_SEC, Math.round((now - startedAt.current) / 1000));
      const attempt: ExamAttempt = {
        id: uid('exam'),
        at: now,
        mode,
        score: correct * POINTS_PER_Q,
        total: questions.length * POINTS_PER_Q,
        percent: Math.round((correct / questions.length) * 100),
        timeUsedSec,
        avgSecPerQuestion: Math.round(timeUsedSec / questions.length),
        byWorld,
      };
      addExamAttempt(attempt);
      if (mode === 'final' && attempt.percent >= 70) markBoss('final');
      setResult({ attempt, records });
      setPhase('done');
    },
    [answers, idx, mode, questions, recordAnswer, addExamAttempt, markBoss, times],
  );

  const remaining = useCountdown(TOTAL_SEC, phase === 'run', () => finish(true));

  useEffect(() => {
    if (phase === 'run') {
      startedAt.current = Date.now();
      enteredAt.current = Date.now();
    }
  }, [phase]);

  useKeyboard(
    useCallback(
      (key: string, e: KeyboardEvent) => {
        if (phase !== 'run' || !q || confirmSubmit || formulaOpen) return;
        const ci = choiceIndexFromKey(key);
        if (ci !== null && q.kind === 'mc' && q.choices?.[ci]) {
          e.preventDefault();
          setAnswers((a) => ({ ...a, [q.id]: q.choices![ci].id }));
          return;
        }
        if (key === 'ArrowRight' || key === 'Enter') goTo(idx + 1);
        if (key === 'ArrowLeft') goTo(idx - 1);
        if (key === 'f' || key === 'F') toggleFlag(q.id);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [phase, q, idx, confirmSubmit, formulaOpen],
    ),
    phase === 'run',
  );

  const toggleFlag = (id: string) =>
    setFlags((f) => {
      const n = new Set(f);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const answeredCount = Object.keys(answers).length;
  const isFinal = mode === 'final';

  if (phase === 'intro') {
    return (
      <Shell focus>
        <button className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg" onClick={() => nav('/')}>
          <ArrowLeft size={14} /> Home
        </button>
        <div className={cx('card mx-auto max-w-xl animate-rise p-6', isFinal && 'border-warn/60')}>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted">
            {isFinal ? <Crown size={14} className="text-warn" /> : <Timer size={14} />} {isFinal ? 'Final Boss' : 'Exam Simulator'}
          </div>
          <h1 className="mt-1 text-2xl font-extrabold">{isFinal ? 'The full exam. Everything at once.' : 'Realistic exam conditions'}</h1>
          <ul className="mt-4 space-y-1.5 text-sm">
            <li>• 40 questions · 60 minutes · 200 points (5 per question)</li>
            <li>• Modules 1–4 mixed: concepts, EOQ, line balancing, precedence, logistics</li>
            <li>• Formula sheet and calculator available (just like the real exam)</li>
            <li>• Flag questions, move back and forth, no answers shown until you submit</li>
            <li>• Pace target: 90 seconds per question</li>
          </ul>
          <button className="btn-primary mt-5 w-full py-3 text-base" onClick={() => setPhase('run')} autoFocus>
            Start exam <ArrowRight size={16} />
          </button>
        </div>
      </Shell>
    );
  }

  if (phase === 'done' && result) {
    const { attempt, records } = result;
    const missed = records.filter((r) => !r.correct);
    return (
      <Shell>
        <div className="mx-auto max-w-3xl animate-rise space-y-4">
          <div className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-muted">{isFinal ? 'Final Boss result' : 'Exam result'}</div>
                <div className="text-4xl font-extrabold tabular-nums">
                  {attempt.score} <span className="text-xl text-muted">/ {attempt.total}</span>
                </div>
                <div className="text-sm text-muted">{isFinal && attempt.percent >= 70 ? 'Final Boss defeated. You are exam ready.' : attempt.percent >= 90 ? 'A-range. Keep it sharp.' : attempt.percent >= 75 ? 'Solid pass. Tighten the misses.' : 'Below target. Run Cram Mode on the misses.'}</div>
              </div>
              <Ring value={attempt.percent} size={110} stroke={10} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Percent" value={`${attempt.percent}%`} />
              <Stat label="Time used" value={secondsToClock(attempt.timeUsedSec)} />
              <Stat label="Avg / question" value={`${attempt.avgSecPerQuestion}s`} tone={attempt.avgSecPerQuestion > 90 ? 'text-warn' : 'text-good'} />
              <Stat label="Pace target" value="90s" />
            </div>
            <div className="mt-4">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">Performance by topic</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {WORLDS.map((w) => {
                  const b = attempt.byWorld[w.id];
                  const pct = b.total ? Math.round((b.correct / b.total) * 100) : 0;
                  return (
                    <div key={w.id} className="rounded-lg border border-line px-3 py-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{w.title}</span>
                        <span className="font-mono">
                          {b.correct}/{b.total} · {pct}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-raised">
                        <div className={cx('h-full', pct >= 75 ? 'bg-good' : pct >= 50 ? 'bg-warn' : 'bg-bad')} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="btn-primary" onClick={() => { setSeed((s) => s + 1); setAnswers({}); setFlags(new Set()); setTimes({}); setIdx(0); setResult(null); setPhase('intro'); }}>
                <RotateCcw size={14} /> New exam
              </button>
              <button className="btn-ghost" onClick={() => nav('/cram')}>
                Cram the misses
              </button>
              <button className="btn-ghost" onClick={() => nav('/')}>
                Home
              </button>
            </div>
          </div>
          {missed.length > 0 ? <MistakeReview records={missed} title="Every missed question, explained" /> : <div className="card p-6 text-center font-bold text-good">Perfect score. Nothing to review.</div>}
        </div>
      </Shell>
    );
  }

  return (
    <Shell focus>
      <div className="mx-auto max-w-3xl">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-bold">
            {isFinal ? 'Final Boss' : 'Exam Simulator'} <span className="text-muted">· Q{idx + 1} / {questions.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <ExamTimer remaining={remaining} total={TOTAL_SEC} />
            <button className="btn-ghost" onClick={() => setFormulaOpen(true)}>
              <Sigma size={15} /> Formulas
            </button>
            <CalculatorButton />
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-1">
          {questions.map((qq, i) => (
            <button
              key={qq.id}
              onClick={() => goTo(i)}
              className={cx(
                'relative h-8 w-8 rounded-md border text-xs font-bold',
                i === idx ? 'border-accent bg-accent/20 text-accent' : answers[qq.id] !== undefined ? 'border-line bg-raised' : 'border-line text-muted',
              )}
              aria-label={`Go to question ${i + 1}`}
            >
              {i + 1}
              {flags.has(qq.id) && <Flag size={9} className="absolute -right-1 -top-1 fill-warn text-warn" />}
            </button>
          ))}
        </div>

        <div key={q.id} className="card animate-pop p-5 md:p-6">
          <QuestionView question={q} selected={answers[q.id] ?? null} revealed={false} onSelect={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} hideCorrect />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => goTo(idx - 1)} disabled={idx === 0}>
              <ArrowLeft size={14} /> Prev
            </button>
            <button className="btn-ghost" onClick={() => goTo(idx + 1)} disabled={idx === questions.length - 1}>
              Next <ArrowRight size={14} />
            </button>
            <button className={cx('btn-ghost', flags.has(q.id) && 'border-warn text-warn')} onClick={() => toggleFlag(q.id)}>
              <Flag size={14} /> {flags.has(q.id) ? 'Flagged' : 'Flag'}
            </button>
          </div>
          <button className="btn-primary" onClick={() => setConfirmSubmit(true)}>
            Submit exam
          </button>
        </div>
        <div className="mt-2 text-right text-xs text-muted">
          {answeredCount}/{questions.length} answered · {flags.size} flagged · ← → to move · F to flag
        </div>
      </div>

      <Modal open={formulaOpen} onClose={() => setFormulaOpen(false)} title="Formula sheet" wide>
        <div className="grid max-h-[70vh] gap-2 overflow-y-auto sm:grid-cols-2">
          {FORMULAS.map((f) => (
            <div key={f.id} className="rounded-lg border border-line px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted">{f.name}</div>
              <div className="font-mono font-bold">{f.formula}</div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal open={confirmSubmit} onClose={() => setConfirmSubmit(false)} title="Submit exam?">
        <p className="text-sm text-muted">
          {answeredCount < questions.length ? `${questions.length - answeredCount} questions are unanswered and will count as wrong.` : 'All questions answered.'}
          {flags.size > 0 && ` ${flags.size} flagged.`}
        </p>
        <div className="mt-4 flex gap-2">
          <button className="btn-ghost flex-1" onClick={() => setConfirmSubmit(false)}>
            Keep working
          </button>
          <button className="btn-primary flex-1" onClick={() => { setConfirmSubmit(false); finish(false); }}>
            Submit
          </button>
        </div>
      </Modal>
    </Shell>
  );
}
