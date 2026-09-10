import type { Progress, SkillId, SkillStats, WorldId } from '@/types';
import { SKILLS, SKILL_MAP, WORLDS } from '@/data/worlds';

export type MasteryTier = 'Never attempted' | 'Learning' | 'Developing' | 'Exam Ready' | 'Mastered';

/**
 * Mastery 0-100 from recent accuracy weighted by how many attempts exist.
 * One correct answer cannot make a skill "Mastered": full weight needs ~8 attempts.
 */
export function skillMastery(stats?: SkillStats): number {
  if (!stats || stats.attempts === 0) return 0;
  const recent = stats.recent.length ? stats.recent : [stats.correct / stats.attempts];
  const recentAcc = recent.reduce((a, b) => a + b, 0) / recent.length;
  const confidence = Math.min(1, stats.attempts / 8);
  const overallAcc = stats.correct / stats.attempts;
  const blended = 0.7 * recentAcc + 0.3 * overallAcc;
  return Math.max(1, Math.round(blended * 100 * confidence));
}

export function masteryTier(m: number): MasteryTier {
  if (m <= 0) return 'Never attempted';
  if (m < 50) return 'Learning';
  if (m < 75) return 'Developing';
  if (m < 90) return 'Exam Ready';
  return 'Mastered';
}

export function tierColor(t: MasteryTier): string {
  switch (t) {
    case 'Mastered':
      return 'text-good';
    case 'Exam Ready':
      return 'text-info';
    case 'Developing':
      return 'text-warn';
    case 'Learning':
      return 'text-violet';
    default:
      return 'text-muted';
  }
}

export function skillAccuracy(stats?: SkillStats): number | null {
  if (!stats || stats.attempts === 0) return null;
  return stats.correct / stats.attempts;
}

/** Speed score 0-1 for a skill based on recent times vs the target. */
export function skillSpeed(skill: SkillId, stats?: SkillStats): number | null {
  if (!stats || !stats.recentTimes.length) return null;
  const target = SKILL_MAP[skill].targetSec * 1000;
  const avg = stats.recentTimes.reduce((a, b) => a + b, 0) / stats.recentTimes.length;
  return Math.max(0, Math.min(1, target / Math.max(avg, 1)));
}

export function worldMastery(p: Progress, world: WorldId): number {
  const skills = SKILLS.filter((s) => s.world === world);
  if (!skills.length) return 0;
  const total = skills.reduce((acc, s) => acc + skillMastery(p.skills[s.id]), 0);
  return Math.round(total / skills.length);
}

export function worldStats(p: Progress, world: WorldId) {
  const skills = SKILLS.filter((s) => s.world === world);
  let attempts = 0;
  let correct = 0;
  for (const s of skills) {
    const st = p.skills[s.id];
    if (!st) continue;
    attempts += st.attempts;
    correct += st.correct;
  }
  const stars = [1, 2, 3, 4, 5].reduce((acc, l) => acc + (p.levels[`${world}-L${l}`]?.stars ?? 0), 0);
  return {
    mastery: worldMastery(p, world),
    attempts,
    accuracy: attempts ? correct / attempts : null,
    stars,
    maxStars: 15,
    bestStreak: p.worlds[world]?.bestStreak ?? 0,
  };
}

export interface Readiness {
  knowledge: number;
  speed: number;
  overall: number;
}

export function readiness(p: Progress): Readiness {
  let knowledge = 0;
  for (const w of WORLDS) knowledge += w.weight * worldMastery(p, w.id);
  // Speed: average over skills with data, weighted by world weight.
  let speedSum = 0;
  let speedWeight = 0;
  for (const s of SKILLS) {
    const sp = skillSpeed(s.id, p.skills[s.id]);
    if (sp === null) continue;
    const w = s.world === 'all' ? 0.1 : WORLDS.find((x) => x.id === s.world)!.weight;
    speedSum += sp * w;
    speedWeight += w;
  }
  const speed = speedWeight ? Math.round((speedSum / speedWeight) * 100) : 0;
  const k = Math.round(knowledge);
  const overall = Math.round(0.5 * k + 0.5 * speed);
  return { knowledge: k, speed, overall };
}

export interface WeakArea {
  skill: SkillId;
  label: string;
  accuracy: number;
  mastery: number;
  attempts: number;
  avgSec: number | null;
  slow: boolean;
}

/** Weak areas ranked by lowest recent accuracy, with slow skills and untouched skills considered. */
export function weakAreas(p: Progress, limit = 8): WeakArea[] {
  const out: WeakArea[] = [];
  for (const s of SKILLS) {
    const st = p.skills[s.id];
    if (!st || st.attempts === 0) continue;
    const recent = st.recent.length ? st.recent.reduce((a, b) => a + b, 0) / st.recent.length : st.correct / st.attempts;
    const avgMs = st.recentTimes.length ? st.recentTimes.reduce((a, b) => a + b, 0) / st.recentTimes.length : null;
    const slow = avgMs !== null && avgMs > s.targetSec * 1000 * 1.2;
    out.push({
      skill: s.id,
      label: s.label,
      accuracy: recent,
      mastery: skillMastery(st),
      attempts: st.attempts,
      avgSec: avgMs !== null ? avgMs / 1000 : null,
      slow,
    });
  }
  out.sort((a, b) => a.accuracy - b.accuracy || (b.slow ? 1 : 0) - (a.slow ? 1 : 0) || a.mastery - b.mastery);
  return out.slice(0, limit);
}
