import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useProgress } from '@/hooks/useProgress';
import { Home } from '@/pages/Home';
import { Onboarding } from '@/pages/Onboarding';
import { WorldPage } from '@/pages/WorldPage';
import { LevelPage } from '@/pages/LevelPage';
import { ExamPage } from '@/pages/ExamPage';
import { CramPage } from '@/pages/CramPage';
import { PracticeByTopic } from '@/pages/PracticeByTopic';
import { FormulaSheet } from '@/pages/FormulaSheet';
import { FormulaGame } from '@/pages/FormulaGame';
import { MistakeNotebook } from '@/pages/MistakeNotebook';
import { StatsPage } from '@/pages/StatsPage';
import { WeakAreasPage } from '@/pages/WeakAreasPage';
import { ShortcutsPage } from '@/pages/ShortcutsPage';
import { CrashCourse } from '@/pages/CrashCourse';
import { FlashcardsPage } from '@/pages/FlashcardsPage';
import { EOQTrainerPage } from '@/pages/EOQTrainerPage';
import { PrecedenceTrainerPage } from '@/pages/PrecedenceTrainerPage';
import { SprintPage } from '@/pages/SprintPage';
import { SettingsPage } from '@/pages/SettingsPage';

export default function App() {
  const { progress } = useProgress();
  const loc = useLocation();
  if (!progress.onboarded && loc.pathname !== '/welcome') return <Navigate to="/welcome" replace />;
  return (
    <Routes>
      <Route path="/welcome" element={<Onboarding />} />
      <Route path="/" element={<Home />} />
      <Route path="/world/:worldId" element={<WorldPage />} />
      <Route path="/world/:worldId/level/:level" element={<LevelPage />} />
      <Route path="/exam" element={<ExamPage mode="sim" />} />
      <Route path="/final-boss" element={<ExamPage mode="final" />} />
      <Route path="/cram" element={<CramPage />} />
      <Route path="/practice" element={<PracticeByTopic />} />
      <Route path="/formulas" element={<FormulaSheet />} />
      <Route path="/formula-game" element={<FormulaGame />} />
      <Route path="/notebook" element={<MistakeNotebook />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/weak-areas" element={<WeakAreasPage />} />
      <Route path="/shortcuts" element={<ShortcutsPage />} />
      <Route path="/crash-course" element={<CrashCourse />} />
      <Route path="/flashcards" element={<FlashcardsPage />} />
      <Route path="/eoq-trainer" element={<EOQTrainerPage />} />
      <Route path="/precedence-trainer" element={<PrecedenceTrainerPage />} />
      <Route path="/sprint/:kind" element={<SprintPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
