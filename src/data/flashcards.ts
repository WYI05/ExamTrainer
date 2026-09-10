import type { WorldId } from '@/types';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  world: WorldId;
}

// Known course-fact flashcards. Only facts supplied by the course are used.
export const FLASHCARDS: Flashcard[] = [
  { id: 'fc-procurement', front: 'Procurement', back: 'Finds suppliers and purchases goods from the company’s supplier network.', world: 'w1' },
  { id: 'fc-safety-stock', front: 'Safety Stock', back: 'Inventory used to account for variation / uncertainty. A cushion.', world: 'w2' },
  { id: 'fc-visibility', front: 'Supply Chain Visibility', back: 'Also referred to as Inventory Visibility.', world: 'w1' },
  { id: 'fc-business-model', front: 'Business Model', back: 'A company’s plan for buying materials, making products, selling goods, and transporting them to customers.', world: 'w1' },
  { id: 'fc-po', front: 'PO', back: 'Purchase Order — the formal document the BUYER issues to place an order with a supplier.', world: 'w1' },
  { id: 'fc-rfq', front: 'RFQ', back: 'Request for Quotation — asking suppliers for a price BEFORE a PO is issued.', world: 'w1' },
  { id: 'fc-tco', front: 'TCO', back: 'Total Cost of Ownership — ALL costs of an item across its entire lifetime.', world: 'w1' },
  { id: 'fc-bulk', front: 'Bulk', back: 'Loose, unpackaged cargo such as coal or rock salt (not in bags or boxes).', world: 'w4' },
  { id: 'fc-pallet', front: 'Pallet', back: 'Platform used to move multiple boxes at once using a forklift or reach truck.', world: 'w4' },
  { id: 'fc-teu', front: 'TEU', back: 'Twenty-foot Equivalent Unit.', world: 'w4' },
  { id: 'fc-20ft', front: '20-foot container', back: '1 TEU.', world: 'w4' },
  { id: 'fc-40ft', front: '40-foot container', back: '2 TEUs.', world: 'w4' },
  { id: 'fc-doublestack', front: 'Doublestack', back: 'A railcar carrying two standardized containers stacked vertically.', world: 'w4' },
  { id: 'fc-crc', front: 'Central Return Center', back: 'Destination for many returned / opened / broken retail goods (e.g. Walmart returns).', world: 'w4' },
  { id: 'fc-line-flow', front: 'Line-flow layout', back: 'Used when making the exact same product over and over. Products follow the same repeated sequence.', world: 'w4' },
  { id: 'fc-ct', front: 'Cycle Time', back: 'The most important number for an operations manager balancing an assembly line.', world: 'w3' },
  { id: 'fc-ect', front: 'Effective Cycle Time', back: 'The longest workstation time in an existing line (the bottleneck).', world: 'w3' },
  { id: 'fc-eoq', front: 'EOQ', back: 'Economic Order Quantity — the order size where AOC = AHC. √(2DS/H).', world: 'w2' },
  { id: 'fc-pipeline', front: 'Pipeline Inventory', back: 'Inventory currently traveling through the supply chain. Pipeline = d × L.', world: 'w2' },
];
