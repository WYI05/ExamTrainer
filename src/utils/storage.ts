import type { Progress, Settings } from '@/types';

export const PROGRESS_KEY = 'scm300.progress.v1';
export const SETTINGS_KEY = 'scm300.settings.v1';

export function defaultProgress(): Progress {
  return {
    version: 1,
    onboarded: false,
    xp: 0,
    bestStreak: 0,
    skills: {},
    levels: {},
    worlds: { w1: { bestStreak: 0 }, w2: { bestStreak: 0 }, w3: { bestStreak: 0 }, w4: { bestStreak: 0 } },
    mistakes: [],
    mistakeCategoryCounts: {},
    examAttempts: [],
    sprints: { sixty: [], fiveMin: [] },
    bosses: {},
    totals: { attempts: 0, correct: 0, timeMs: 0 },
    lastActive: Date.now(),
  };
}

export function defaultSettings(): Settings {
  return { reducedMotion: false, sound: true, theme: 'dark' };
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return { ...defaultProgress(), ...parsed };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {
    // Storage may be unavailable (private mode); progress stays in memory.
  }
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    return { ...defaultSettings(), ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(PROGRESS_KEY);
  } catch {
    // ignore
  }
}
