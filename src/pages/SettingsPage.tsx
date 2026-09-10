import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useProgress } from '@/hooks/useProgress';
import { Shell } from '@/components/Layout';
import { Modal, PageTitle, Toggle } from '@/components/ui';

export function SettingsPage() {
  const { settings, set } = useSettings();
  const { reset, progress } = useProgress();
  const nav = useNavigate();
  const [confirm, setConfirm] = useState(false);
  return (
    <Shell>
      <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft size={14} /> Home
      </Link>
      <PageTitle title="Settings" />
      <div className="mx-auto max-w-lg space-y-2">
        <Toggle label="Dark mode" checked={settings.theme === 'dark'} onChange={(v) => set({ theme: v ? 'dark' : 'light' })} />
        <Toggle label="Sound effects" checked={settings.sound} onChange={(v) => set({ sound: v })} />
        <Toggle label="Reduced motion" checked={settings.reducedMotion} onChange={(v) => set({ reducedMotion: v })} />

        <div className="card mt-6 p-4">
          <div className="text-sm font-bold">Progress</div>
          <p className="mt-1 text-xs text-muted">
            {progress.totals.attempts} questions answered · {progress.xp} XP · {progress.mistakes.length} mistakes saved · {progress.examAttempts.length} exam attempts. Stored in this browser only.
          </p>
          <button className="btn-ghost mt-3 border-bad/50 text-bad" onClick={() => setConfirm(true)}>
            <Trash2 size={14} /> Reset progress
          </button>
        </div>
      </div>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Reset all progress?">
        <p className="text-sm text-muted">This deletes XP, mastery, streaks, mistakes and exam history from this browser. It cannot be undone.</p>
        <div className="mt-4 flex gap-2">
          <button className="btn-ghost flex-1" onClick={() => setConfirm(false)}>
            Keep my progress
          </button>
          <button
            className="btn flex-1 bg-bad text-bg"
            onClick={() => {
              reset();
              setConfirm(false);
              nav('/welcome', { replace: true });
            }}
          >
            Reset everything
          </button>
        </div>
      </Modal>
    </Shell>
  );
}
