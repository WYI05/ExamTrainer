import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AnswerRecord, ExamAttempt, MistakeCategoryId, MistakeEntry, Progress, SkillId, SprintResult, WorldId } from '@/types';
import { clearProgress, defaultProgress, loadProgress, saveProgress } from '@/utils/storage';
import { SKILL_MAP } from '@/data/worlds';
import { MISTAKE_MAP } from '@/data/mistakeCategories';
import { givenText } from '@/generators/common';
import { uid } from '@/utils/random';

interface ProgressApi {
  progress: Progress;
  /** Record one answered question (updates skill stats, XP, streaks, mistakes). */
  recordAnswer: (rec: AnswerRecord, streak: number) => void;
  completeLevel: (world: WorldId, level: number, accuracy: number) => void;
  markBoss: (id: string) => void;
  addExamAttempt: (a: ExamAttempt) => void;
  addSprint: (kind: 'sixty' | 'fiveMin', r: SprintResult) => void;
  setOnboarded: (confidence: string, diagnosticScore: number) => void;
  resolveMistake: (id: string) => void;
  reset: () => void;
  addXp: (n: number) => void;
}

const Ctx = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const ref = useRef(progress);
  ref.current = progress;

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const update = useCallback((fn: (p: Progress) => Progress) => {
    setProgress((p) => ({ ...fn(p), lastActive: Date.now() }));
  }, []);

  const recordAnswer = useCallback(
    (rec: AnswerRecord, streak: number) => {
      update((p) => {
        const q = rec.question;
        const prev = p.skills[q.skill] ?? { attempts: 0, correct: 0, recent: [], recentTimes: [], lastSeen: 0 };
        const recent = [...prev.recent, rec.correct ? 1 : 0].slice(-12);
        const recentTimes = [...prev.recentTimes, rec.timeMs].slice(-12);
        const skills = {
          ...p.skills,
          [q.skill]: {
            attempts: prev.attempts + 1,
            correct: prev.correct + (rec.correct ? 1 : 0),
            recent,
            recentTimes,
            lastSeen: Date.now(),
          },
        };
        const world = SKILL_MAP[q.skill].world;
        const worlds = { ...p.worlds };
        if (world !== 'all') worlds[world] = { bestStreak: Math.max(worlds[world]?.bestStreak ?? 0, streak) };

        let mistakes = p.mistakes;
        const counts = { ...p.mistakeCategoryCounts };
        if (!rec.correct) {
          const category: MistakeCategoryId = rec.mistake ?? q.mistakeCategory ?? (q.isCalc ? 'arithmetic' : 'vocab');
          counts[category] = (counts[category] ?? 0) + 1;
          const entry: MistakeEntry = {
            id: uid('m'),
            at: Date.now(),
            skill: q.skill,
            world: q.world,
            templateId: q.templateId,
            prompt: q.prompt,
            given: q.given,
            myAnswer: givenText(q, rec.given),
            correctAnswer: q.correctText,
            why: q.explanation.steps,
            rule: MISTAKE_MAP[category].rule,
            category,
          };
          mistakes = [entry, ...p.mistakes].slice(0, 300);
        }
        return {
          ...p,
          xp: p.xp + rec.xp,
          bestStreak: Math.max(p.bestStreak, streak),
          skills,
          worlds,
          mistakes,
          mistakeCategoryCounts: counts,
          totals: {
            attempts: p.totals.attempts + 1,
            correct: p.totals.correct + (rec.correct ? 1 : 0),
            timeMs: p.totals.timeMs + rec.timeMs,
          },
        };
      });
    },
    [update],
  );

  const completeLevel = useCallback(
    (world: WorldId, level: number, accuracy: number) => {
      update((p) => {
        const key = `${world}-L${level}`;
        const prev = p.levels[key] ?? { completed: false, stars: 0, bestAccuracy: 0, attempts: 0 };
        const stars = accuracy >= 0.9 ? 3 : accuracy >= 0.75 ? 2 : accuracy >= 0.5 ? 1 : level === 1 ? 1 : 0;
        return {
          ...p,
          levels: {
            ...p.levels,
            [key]: {
              completed: true,
              stars: Math.max(prev.stars, stars),
              bestAccuracy: Math.max(prev.bestAccuracy, accuracy),
              attempts: prev.attempts + 1,
            },
          },
        };
      });
    },
    [update],
  );

  const markBoss = useCallback((id: string) => update((p) => ({ ...p, bosses: { ...p.bosses, [id]: true } })), [update]);
  const addExamAttempt = useCallback((a: ExamAttempt) => update((p) => ({ ...p, examAttempts: [a, ...p.examAttempts].slice(0, 50) })), [update]);
  const addSprint = useCallback(
    (kind: 'sixty' | 'fiveMin', r: SprintResult) =>
      update((p) => ({ ...p, sprints: { ...p.sprints, [kind]: [r, ...p.sprints[kind]].slice(0, 50) } })),
    [update],
  );
  const setOnboarded = useCallback(
    (confidence: string, diagnosticScore: number) => update((p) => ({ ...p, onboarded: true, confidence, diagnosticScore })),
    [update],
  );
  const resolveMistake = useCallback(
    (id: string) => update((p) => ({ ...p, mistakes: p.mistakes.map((m) => (m.id === id ? { ...m, resolvedAt: Date.now() } : m)) })),
    [update],
  );
  const addXp = useCallback((n: number) => update((p) => ({ ...p, xp: p.xp + n })), [update]);
  const reset = useCallback(() => {
    clearProgress();
    setProgress(defaultProgress());
  }, []);

  const api = useMemo<ProgressApi>(
    () => ({ progress, recordAnswer, completeLevel, markBoss, addExamAttempt, addSprint, setOnboarded, resolveMistake, reset, addXp }),
    [progress, recordAnswer, completeLevel, markBoss, addExamAttempt, addSprint, setOnboarded, resolveMistake, reset, addXp],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}

export type { SkillId };
