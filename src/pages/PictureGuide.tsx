import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { VisualSpec } from '@/types';
import { Shell } from '@/components/Layout';
import { Visual } from '@/components/Visuals';
import { PrecedenceDiagram } from '@/components/PrecedenceDiagram';
import { GRAPHS } from '@/data/diagrams';
import { PageTitle, cx } from '@/components/ui';

interface Figure {
  title: string;
  caption: string;
  spec: VisualSpec;
  practice: string; // route
}

interface Section {
  id: string;
  title: string;
  tone: string;
  figures: Figure[];
}

const SECTIONS: Section[] = [
  {
    id: 'w2',
    title: 'Inventory & EOQ',
    tone: 'text-good',
    figures: [
      {
        title: 'The sawtooth: inventory over a year',
        caption: 'Each spike is an order of Q arriving; the slope is demand eating it. Orders per year = number of spikes = D/Q. Weeks between orders = the gap = (Q/D) × 52. Average inventory is the dashed line, Q/2.',
        spec: { kind: 'sawtooth', D: 3000, Q: 500, S: 400, H: 38 },
        practice: '/practice?skill=orders-per-year&difficulty=easy',
      },
      {
        title: 'Why EOQ exists: two curves that cross',
        caption: 'Ordering cost (D/Q)S falls as Q grows. Holding cost (Q/2)H rises. Their sum is lowest exactly where they are equal. That crossing is the EOQ.',
        spec: { kind: 'eoq-curve', D: 3000, S: 400, H: 38, Q: 251 },
        practice: '/eoq-trainer',
      },
      {
        title: 'The balance scale: which side is heavy?',
        caption: 'AHC heavier than AOC means you are holding too much, so Q is too big and EOQ is smaller. AOC heavier means the opposite.',
        spec: { kind: 'balance', AHC: 80000, AOC: 40000, Q: 500 },
        practice: '/practice?skill=eoq-intuition&difficulty=medium',
      },
      {
        title: 'Three cost pieces, to scale',
        caption: 'Buckshot at Q = 900. Purchase cost DC is enormous but never moves with Q. Only AOC and AHC change, which is why EOQ ignores DC.',
        spec: { kind: 'cost-stack', DC: 1365000, AOC: 4116.67, AHC: 27562.5, Q: 900 },
        practice: '/practice?skill=total-cost&difficulty=medium',
      },
      {
        title: 'H is a slice of unit cost',
        caption: 'A holding rate is a percentage of the unit cost. Multiply first: 30% of $100 is H = $30. Neither 30 nor 100 is H.',
        spec: { kind: 'holding', C: 100, rate: 0.3 },
        practice: '/practice?skill=holding-cost&difficulty=easy',
      },
      {
        title: 'When EOQ is not allowed',
        caption: 'Supplier only takes increments of 100. EOQ ≈ 348 falls between 300 and 400: check the total-cost curve at both marks and take the cheaper one.',
        spec: { kind: 'eoq-curve', D: 7800, S: 475, H: 61.25, Q: 300, marks: [300, 400] },
        practice: '/practice?skill=ordering-restrictions&difficulty=medium',
      },
      {
        title: 'Pipeline inventory: units on the road',
        caption: 'Every week of lead time holds a week of demand in transit. Pipeline = d × L.',
        spec: { kind: 'pipeline', d: 150, L: 2 },
        practice: '/practice?skill=pipeline&difficulty=easy',
      },
    ],
  },
  {
    id: 'w3',
    title: 'Line Balancing',
    tone: 'text-violet',
    figures: [
      {
        title: 'Cycle time: slice the day into units',
        caption: '8 hours is 28,800 seconds. Shared by 370 units, each unit gets 77.84 seconds. The course uses 77: never round cycle time up.',
        spec: { kind: 'day-split', OT: 28800, D: 370 },
        practice: '/practice?skill=cycle-time&difficulty=easy',
      },
      {
        title: 'Two opposite rounding rules',
        caption: 'Cycle time rounds DOWN (extra seconds per unit cost you output). Workstations round UP (a fraction of a station cannot exist).',
        spec: { kind: 'rounding', value: 4.07, mode: 'up' },
        practice: '/practice?skill=rounding-rules&difficulty=easy',
      },
      {
        title: 'Work versus capacity',
        caption: 'Each bar is one station with room up to the cycle time. Filled = work, empty = idle. Efficiency = t / (n × c); idle = n × c − t.',
        spec: { kind: 'station-bars', t: 224, n: 5, c: 95 },
        practice: '/practice?skill=efficiency&difficulty=easy',
      },
      {
        title: 'The bottleneck sets the pace',
        caption: 'For a line that already exists, the longest bar is the effective cycle time. No formula needed.',
        spec: { kind: 'station-bars', stationTimes: [45, 75, 45, 70, 55], highlightMax: true },
        practice: '/practice?skill=effective-ct&difficulty=easy',
      },
      {
        title: 'A valid layout',
        caption: 'Diagram 1 at CT 85 with WS1 = AE and WS2 = BC. Numbered badges show the station of each task. Every bar fits and every arrow points forward.',
        spec: { kind: 'layout-check', graphId: 'g1', layout: [['A', 'E'], ['B', 'C']], ct: 85 },
        practice: '/precedence-trainer',
      },
      {
        title: 'A precedence violation',
        caption: 'WS2 = DF has plenty of time, but D needs B and B is nowhere. The red arrow is the rule being broken.',
        spec: { kind: 'layout-check', graphId: 'g1', layout: [['A', 'E'], ['D', 'F']], ct: 85 },
        practice: '/practice?skill=precedence&difficulty=medium',
      },
      {
        title: 'A cycle-time violation',
        caption: 'WS2 = BCD respects every arrow but adds up to 95 seconds, over the 85-second cycle time. Both checks must pass.',
        spec: { kind: 'layout-check', graphId: 'g1', layout: [['A', 'E'], ['B', 'C', 'D']], ct: 85 },
        practice: '/practice?skill=precedence&difficulty=medium',
      },
    ],
  },
  {
    id: 'w4',
    title: 'Logistics & Transportation',
    tone: 'text-warn',
    figures: [
      {
        title: 'Counting containers in TEUs',
        caption: 'A 20-foot box is one TEU. A 40-foot box is two. 100 twenty-footers and 250 forty-footers make 600 TEUs.',
        spec: { kind: 'teu', twenty: 100, forty: 250 },
        practice: '/practice?skill=teu&difficulty=easy',
      },
    ],
  },
  {
    id: 'w1',
    title: 'Supply Chain Foundations',
    tone: 'text-info',
    figures: [
      {
        title: 'Total Cost of Ownership is the whole timeline',
        caption: 'One truck costs money the day it is bought and every year after, through disposal. TCO adds every column.',
        spec: { kind: 'tco' },
        practice: '/practice?skill=tco&difficulty=easy',
      },
    ],
  },
];

export function PictureGuide() {
  return (
    <Shell>
      <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft size={14} /> Home
      </Link>
      <PageTitle title="Picture Guide" sub="Every exam concept as one picture. If a formula will not stick, find its picture here." />
      <div className="mb-5 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#/guide#${s.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(`sec-${s.id}`)?.scrollIntoView({ behavior: 'smooth' }); }} className={cx('chip hover:border-muted', s.tone)}>
            {s.title}
          </a>
        ))}
      </div>
      <div className="space-y-10">
        {SECTIONS.map((s) => (
          <section key={s.id} id={`sec-${s.id}`}>
            <h2 className={cx('mb-3 text-lg font-bold', s.tone)}>{s.title}</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {s.figures.map((f) => (
                <div key={f.title} className="card flex flex-col p-4">
                  <div className="font-bold">{f.title}</div>
                  <div className="mt-3">
                    <Visual spec={f.spec} />
                  </div>
                  <p className="mt-3 flex-1 text-sm text-muted">{f.caption}</p>
                  <Link to={f.practice} className="mt-3 inline-flex items-center gap-1 self-start text-sm font-semibold text-accent hover:underline">
                    Practice this <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ))}
        <section>
          <h2 className="mb-3 text-lg font-bold text-violet">The four precedence diagrams</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {Object.values(GRAPHS).map((g) => (
              <div key={g.id} className="card p-4">
                <div className="font-bold">
                  {g.name} <span className="text-muted">· t = {g.tasks.reduce((a, t) => a + t.time, 0)} sec</span>
                </div>
                <div className="mt-2">
                  <PrecedenceDiagram graph={g} showStates={false} compact />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}
