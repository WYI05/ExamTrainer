# SCM 300 · Exam 1 Training

A game-like **pre-exam** study app for Arizona State University SCM 300 (Modules 1–4).
Short lessons, one question at a time, instant feedback, streaks, XP, boss battles,
and a realistic 40-question / 60-minute exam simulator. Everything runs locally in the
browser; progress lives in `localStorage`. No backend, no login.

This is a practice tool only. It is not an exam overlay or a live exam assistant.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # type-check + production bundle into dist/
npm run preview    # serve the production bundle
npm test           # vitest: calculation, precedence, mastery and generator tests
```

## What is inside

| Area | Where |
|---|---|
| Home (readiness, 4 big modes, 4 worlds, tools) | `src/pages/Home.tsx` |
| First-run flow + 8-question diagnostic | `src/pages/Onboarding.tsx` |
| World map and levels (Learn → Easy → Mixed → Speed → Boss) | `src/pages/WorldPage.tsx`, `src/pages/LevelPage.tsx` |
| Exam Simulator / Final Boss (40 q, 60 min, 200 pts, flags, formula sheet, calculator) | `src/pages/ExamPage.tsx` |
| Cram Mode (weak-area drill) | `src/pages/CramPage.tsx` |
| Practice by Topic | `src/pages/PracticeByTopic.tsx` |
| Formula Sheet (clickable variables) + "Which formula?" game | `src/pages/FormulaSheet.tsx`, `src/pages/FormulaGame.tsx` |
| Mistake Notebook | `src/pages/MistakeNotebook.tsx` |
| Stats, Weak Areas, "Things I Cannot Forget", Flashcards | `src/pages/StatsPage.tsx`, `WeakAreasPage.tsx`, `ShortcutsPage.tsx`, `FlashcardsPage.tsx` |
| Exam in 30 Minutes crash course | `src/pages/CrashCourse.tsx` |
| Visual EOQ trainer, Visual precedence trainer (drag-and-drop line builder) | `src/pages/EOQTrainerPage.tsx`, `src/pages/PrecedenceTrainerPage.tsx` |
| 60-Second Sprint, 5-Minute Calculation Sprint | `src/pages/SprintPage.tsx` |
| Settings (dark mode, sound, reduced motion, reset) | `src/pages/SettingsPage.tsx` |

Reusable components live in `src/components/` (`QuizRunner` is the learn → answer → feedback loop,
`PrecedenceDiagram` is the SVG diagram, `PrecedenceBuilder` is the drag-and-drop game,
`Calculator` is the safe expression calculator, etc.).

## Where the question data lives

- **Concept question bank** — `src/data/concepts.ts`. Each template has prompt variants,
  the correct answer, a distractor pool, WHY lines, a fast rule and two hints. Only the
  course-supplied facts are used.
- **Flashcards** — `src/data/flashcards.ts`
- **Formula sheet** — `src/data/formulas.ts` (variable meanings in `VARIABLES`)
- **Mental shortcut cards** — `src/data/shortcuts.ts`
- **Precedence diagrams** — `src/data/diagrams.ts` (Practice Diagrams 1–3 and the SCM Lab 2 line, plus Lab 2 layouts A/B/C)
- **Lesson content (Level 1 of each world)** — `src/data/lessons.ts`
- **Boss battles** (Buckshot Electronics, SCM Lab 2) — `src/data/bosses.ts`
- **Mistake categories** — `src/data/mistakeCategories.ts`
- **Worlds, skills, levels, readiness weights** — `src/data/worlds.ts`

## Randomized generators

`src/generators/`:

- `eoq.ts` — EOQ, H from a holding rate, DC / AOC / AHC / TC, orders per year, weekly demand,
  time between orders, pipeline inventory, EOQ intuition (balance scale), ordering restrictions (Q*).
- `lineBalancing.ts` — cycle time (never round up), theoretical minimum (always round up),
  efficiency, idle time, effective cycle time, rounding-rule memory game, CT→TM two-step.
- `precedence.ts` — "valid next workstation", layout verdicts (valid / cycle-time / precedence / both),
  eligible-task, station checks, diagram-based calculations, plus the fixed course scenarios.
- `teu.ts` — TEU drills (forward and reverse).
- `formulaRecognition.ts` — "Which formula should you use?"
- `concept.ts` — turns concept templates into shuffled multiple-choice questions.
- `index.ts` — the registry: `questionForSkill`, `worldSet`, `mixedSet`, `examSet`,
  `diagnosticSet`, `sprintQuestion`, `bossSet`.
- `common.ts` — the MC/numeric builders. `mcCalc` guarantees the correct value is present,
  all four options are distinct, and options are shuffled.

All answers come from the pure functions in `src/utils/calc.ts` and `src/utils/precedence.ts`,
which are covered by `src/utils/*.test.ts`. `src/generators/generators.test.ts` builds thousands of
questions across every skill and difficulty and asserts they are well-formed.

## Where progress is stored

`localStorage` key `scm300.progress.v1` (see `src/utils/storage.ts` and `src/hooks/useProgress.tsx`):
XP, best streak, per-skill attempts/accuracy/recent results/recent times, level completion and stars,
per-world best streak, the mistake notebook, mistake-category counts, exam attempts, sprint results,
bosses beaten. Settings are in `scm300.settings.v1`. Mastery and readiness are computed from this in
`src/utils/mastery.ts`.

## Adding questions later

1. **Concept question:** add a template to `CONCEPTS` in `src/data/concepts.ts`
   (id, skill, world, difficulty, prompts, correct, distractors (≥3), why, fastRule, hints).
   It is picked up automatically by practice, bosses, sprints, cram and the exam.
2. **New calculation type:** add a `genXyz(opts)` function in the relevant generator file using
   `mcCalc` / `numeric` from `common.ts`, compute the answer with `utils/calc.ts`, then register it in
   `SKILL_GENERATORS` in `src/generators/index.ts`.
3. **New precedence diagram:** add a graph to `GRAPHS` in `src/data/diagrams.ts` and (optionally) to
   `PRACTICE_GRAPH_IDS` so the random generators use it.
4. **New skill:** add it to `SkillId` in `src/types/index.ts` and to `SKILLS` in `src/data/worlds.ts`.
5. Run `npm test` — the generator test will exercise the new material.
