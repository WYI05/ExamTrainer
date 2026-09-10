import { useCallback } from 'react';
import { useSettings } from './useSettings';

// Tiny synthesized sounds via WebAudio — no asset files needed.
let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, durationMs: number, type: OscillatorType = 'sine', gain = 0.05, when = 0) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(ac.destination);
  const start = ac.currentTime + when;
  osc.start(start);
  g.gain.setValueAtTime(gain, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000);
  osc.stop(start + durationMs / 1000 + 0.02);
}

export type SoundName = 'correct' | 'wrong' | 'levelup' | 'tick' | 'click';

export function useSound() {
  const { settings } = useSettings();
  return useCallback(
    (name: SoundName) => {
      if (!settings.sound) return;
      switch (name) {
        case 'correct':
          tone(660, 90, 'sine', 0.05);
          tone(880, 140, 'sine', 0.05, 0.08);
          break;
        case 'wrong':
          tone(220, 160, 'triangle', 0.05);
          break;
        case 'levelup':
          tone(523, 100, 'sine', 0.05);
          tone(659, 100, 'sine', 0.05, 0.1);
          tone(784, 180, 'sine', 0.05, 0.2);
          break;
        case 'tick':
          tone(1000, 25, 'square', 0.015);
          break;
        case 'click':
          tone(500, 30, 'sine', 0.02);
          break;
      }
    },
    [settings.sound],
  );
}
