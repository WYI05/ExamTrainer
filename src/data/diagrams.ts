import type { Graph } from '@/types';

// ---------------------------------------------------------------------------
// Precedence diagrams used throughout World 3. Edit here to add more.
// ---------------------------------------------------------------------------

export const GRAPHS: Record<string, Graph> = {
  g1: {
    id: 'g1',
    name: 'Practice Diagram 1',
    tasks: [
      { id: 'A', time: 44 },
      { id: 'B', time: 35 },
      { id: 'C', time: 35 },
      { id: 'D', time: 25 },
      { id: 'E', time: 40 },
      { id: 'F', time: 20 },
      { id: 'G', time: 25 },
    ],
    edges: [
      ['A', 'E'],
      ['B', 'D'],
      ['E', 'F'],
      ['C', 'F'],
      ['D', 'F'],
      ['F', 'G'],
    ],
  },
  g2: {
    id: 'g2',
    name: 'Practice Diagram 2',
    tasks: [
      { id: 'A', time: 30 },
      { id: 'B', time: 35 },
      { id: 'C', time: 35 },
      { id: 'D', time: 25 },
      { id: 'E', time: 40 },
      { id: 'F', time: 20 },
      { id: 'G', time: 25 },
    ],
    edges: [
      ['A', 'E'],
      ['B', 'D'],
      ['C', 'F'],
      ['D', 'F'],
      ['E', 'F'],
      ['F', 'G'],
    ],
  },
  g3: {
    id: 'g3',
    name: 'Practice Diagram 3',
    tasks: [
      { id: 'A', time: 35 },
      { id: 'B', time: 25 },
      { id: 'C', time: 32 },
      { id: 'D', time: 45 },
      { id: 'E', time: 17 },
      { id: 'F', time: 30 },
      { id: 'G', time: 25 },
      { id: 'H', time: 35 },
      { id: 'J', time: 27 },
    ],
    edges: [
      ['A', 'D'],
      ['A', 'B'],
      ['C', 'B'],
      ['C', 'F'],
      ['D', 'G'],
      ['B', 'G'],
      ['B', 'E'],
      ['F', 'E'],
      ['G', 'H'],
      ['E', 'H'],
      ['H', 'J'],
    ],
  },
  /**
   * SCM Lab 2 line (14 tasks, t = 537 sec). Individual task times are
   * reconstructed from the lab's workstation totals; the precedence edges are
   * built so that every known lab result holds (Layout A fails only on cycle
   * time, Layout B is valid, Layout C fails on precedence, WS1=ID/WS2=AC → BF
   * not acceptable, WS1=IB → ADJ not acceptable). See precedence.test.ts.
   */
  lab2: {
    id: 'lab2',
    name: 'SCM Lab 2 Line',
    tasks: [
      { id: 'A', time: 17 },
      { id: 'B', time: 9 },
      { id: 'C', time: 51 },
      { id: 'D', time: 10 },
      { id: 'E', time: 35 },
      { id: 'F', time: 32 },
      { id: 'G', time: 61 },
      { id: 'H', time: 29 },
      { id: 'I', time: 50 },
      { id: 'J', time: 25 },
      { id: 'K', time: 28 },
      { id: 'L', time: 59 },
      { id: 'M', time: 60 },
      { id: 'N', time: 71 },
    ],
    edges: [
      ['A', 'G'],
      ['I', 'D'],
      ['D', 'G'],
      ['B', 'E'],
      ['C', 'J'],
      ['E', 'F'],
      ['J', 'K'],
      ['F', 'H'],
      ['K', 'H'],
      ['G', 'N'],
      ['H', 'L'],
      ['L', 'M'],
      ['N', 'M'],
    ],
  },
};

export const LAB2_LAYOUTS: Record<'A' | 'B' | 'C', string[][]> = {
  A: [['C', 'B', 'A'], ['E', 'J'], ['I', 'F'], ['D', 'G'], ['K', 'H'], ['L'], ['N'], ['M']],
  B: [['A', 'I'], ['D', 'G'], ['N'], ['B', 'C'], ['J', 'E'], ['K'], ['F', 'H'], ['L'], ['M']],
  C: [['I', 'D', 'B'], ['E', 'J', 'A'], ['C'], ['F', 'H'], ['G'], ['N'], ['K'], ['L'], ['M']],
};

/** Graphs that the random generators may draw from. */
export const PRACTICE_GRAPH_IDS = ['g1', 'g2', 'g3'] as const;
