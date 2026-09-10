// "Things I Cannot Forget" — large mental-shortcut cards.

export interface ShortcutCard {
  n: number;
  title: string;
  big: string;
  sub?: string;
  tone: 'good' | 'bad' | 'warn' | 'info' | 'violet';
}

export const SHORTCUTS: ShortcutCard[] = [
  { n: 1, title: 'EOQ', big: '√(2DS / H)', tone: 'good' },
  { n: 2, title: 'At EOQ', big: 'AOC = AHC', tone: 'good' },
  { n: 3, title: 'AHC > AOC', big: 'Q is too BIG', sub: 'EOQ is smaller', tone: 'warn' },
  { n: 4, title: 'AOC > AHC', big: 'Q is too SMALL', sub: 'EOQ is larger', tone: 'warn' },
  { n: 5, title: 'Orders / year', big: 'D / Q', tone: 'info' },
  { n: 6, title: 'Weeks / order', big: '(Q / D) × 52', tone: 'info' },
  { n: 7, title: 'Cycle time', big: 'DO NOT ROUND UP', sub: '77.84 → 77', tone: 'bad' },
  { n: 8, title: 'Theoretical workstations', big: 'ALWAYS ROUND UP', sub: '4.07 → 5', tone: 'bad' },
  { n: 9, title: 'Effective CT', big: 'Longest workstation', tone: 'violet' },
  { n: 10, title: 'Idle', big: 'nc − t', tone: 'violet' },
  { n: 11, title: 'Efficiency', big: 't / (nc)', tone: 'violet' },
  { n: 12, title: '20-foot container', big: '1 TEU', tone: 'info' },
  { n: 13, title: '40-foot container', big: '2 TEU', tone: 'info' },
  { n: 14, title: 'Forklift', big: 'Pallet', tone: 'good' },
  { n: 15, title: 'Loose coal', big: 'Bulk', tone: 'good' },
  { n: 16, title: 'Formal supplier order', big: 'PO', tone: 'warn' },
  { n: 17, title: 'Lifetime ownership cost', big: 'TCO', tone: 'warn' },
];
