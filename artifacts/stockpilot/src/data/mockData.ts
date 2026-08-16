export type Recommendation = 'SCALE' | 'INCREASE' | 'HOLD' | 'REDUCE' | 'PAUSE';
export type Confidence = 'High' | 'Medium' | 'Low';

export type Product = {
  id: string;
  name: string;
  variant: string;
  sku: string;
  category: 'Apparel' | 'Footwear' | 'Accessories';
  inventory: number;
  incomingInventory: number;
  restockDate: string;
  restockDays: number;
  sales7d: number;
  sales30d: number;
  adSpendDaily: number;
  roas: number;
  grossMargin: number;
  inventoryCoverage: number;
  stockoutProbability: number;
  recommendation: Recommendation;
  confidence: Confidence;
  reason: string;
  history: { day: string; sales: number; spend: number; inventory: number }[];
};

const history = (base: number, recent: number, spend: number, inventory: number) =>
  Array.from({ length: 60 }, (_, i) => {
    const ramp = i > 45 ? (i - 45) / 15 : 0;
    const wobble = [0.92, 1.03, 1.08, 0.97, 1.01][i % 5];
    return {
      day: `Jun ${String(i + 1).padStart(2, '0')}`,
      sales: Number((base * (1 - ramp) + recent * ramp * wobble).toFixed(1)),
      spend: Math.round(spend * (i > 43 ? 1.3 : 0.75)),
      inventory: Math.max(0, Math.round(inventory - recent * i * 0.62)),
    };
  });

export const products: Product[] = [
  { id: 'black-hoodie-m', name: 'Black Essential Hoodie', variant: 'Medium', sku: 'HOD-BLK-M', category: 'Apparel', inventory: 94, incomingInventory: 300, restockDate: 'Sep 5', restockDays: 19, sales7d: 8.1, sales30d: 5.2, adSpendDaily: 210, roas: 4.6, grossMargin: 64, inventoryCoverage: 11, stockoutProbability: 86, recommendation: 'REDUCE', confidence: 'High', reason: 'Demand accelerated during the same period as higher Meta spend, leaving less coverage than the next shipment lead time.', history: history(5.1, 8.6, 210, 94) },
  { id: 'white-hoodie', name: 'Classic White Hoodie', variant: 'Core', sku: 'HOD-WHT-CORE', category: 'Apparel', inventory: 784, incomingInventory: 0, restockDate: '—', restockDays: 0, sales7d: 5.8, sales30d: 5.1, adSpendDaily: 45, roas: 4.3, grossMargin: 68, inventoryCoverage: 128, stockoutProbability: 3, recommendation: 'SCALE', confidence: 'High', reason: 'Healthy advertising efficiency and substantial stock leave room for measured campaign growth.', history: history(5, 5.8, 45, 784) },
  { id: 'running-shoe-42', name: 'Everyday Running Shoe', variant: 'Black / 42', sku: 'RUN-BLK-42', category: 'Footwear', inventory: 164, incomingInventory: 240, restockDate: 'Sep 14', restockDays: 28, sales7d: 6.2, sales30d: 5.8, adSpendDaily: 110, roas: 3.8, grossMargin: 57, inventoryCoverage: 26, stockoutProbability: 42, recommendation: 'HOLD', confidence: 'Medium', reason: 'Current demand and inventory are approximately balanced; wait for the incoming shipment before adding exposure.', history: history(5.5, 6.3, 110, 164) },
  { id: 'linen-shirt-sand', name: 'Linen Shirt', variant: 'Sand', sku: 'LIN-SND-01', category: 'Apparel', inventory: 423, incomingInventory: 0, restockDate: '—', restockDays: 0, sales7d: 2.8, sales30d: 2.3, adSpendDaily: 28, roas: 4.7, grossMargin: 71, inventoryCoverage: 135, stockoutProbability: 2, recommendation: 'INCREASE', confidence: 'High', reason: 'Strong margin and advertising efficiency with excess inventory make this a measured growth candidate.', history: history(2.2, 2.8, 28, 423) },
  { id: 'leather-wallet', name: 'Leather Wallet', variant: 'Cognac', sku: 'WAL-COG-01', category: 'Accessories', inventory: 612, incomingInventory: 120, restockDate: 'Oct 2', restockDays: 46, sales7d: 4.1, sales30d: 3.5, adSpendDaily: 38, roas: 4.5, grossMargin: 73, inventoryCoverage: 149, stockoutProbability: 2, recommendation: 'SCALE', confidence: 'High', reason: 'High coverage, dependable ROAS, and attractive margin create room to test more demand.', history: history(3.2, 4.1, 38, 612) },
  { id: 'canvas-tote', name: 'Canvas Market Tote', variant: 'Natural', sku: 'TOT-NAT-01', category: 'Accessories', inventory: 306, incomingInventory: 0, restockDate: '—', restockDays: 0, sales7d: 3.2, sales30d: 2.7, adSpendDaily: 24, roas: 3.9, grossMargin: 62, inventoryCoverage: 96, stockoutProbability: 6, recommendation: 'INCREASE', confidence: 'Medium', reason: 'Inventory is healthy and demand is trending up, but the modest ROAS suggests a measured increase.', history: history(2.5, 3.2, 24, 306) },
  { id: 'relaxed-jogger', name: 'Relaxed Jogger', variant: 'Charcoal / Large', sku: 'JOG-CHR-L', category: 'Apparel', inventory: 58, incomingInventory: 180, restockDate: 'Sep 9', restockDays: 23, sales7d: 4.7, sales30d: 3.2, adSpendDaily: 74, roas: 3.1, grossMargin: 52, inventoryCoverage: 12, stockoutProbability: 79, recommendation: 'REDUCE', confidence: 'High', reason: 'Recent velocity is above the long-term average and available stock is unlikely to bridge the shipment gap.', history: history(3.1, 5, 74, 58) },
  { id: 'trail-runner', name: 'Trail Runner', variant: 'Clay / 39', sku: 'TRL-CLY-39', category: 'Footwear', inventory: 88, incomingInventory: 0, restockDate: '—', restockDays: 0, sales7d: 1.1, sales30d: 1.5, adSpendDaily: 13, roas: 2.4, grossMargin: 48, inventoryCoverage: 61, stockoutProbability: 18, recommendation: 'HOLD', confidence: 'Medium', reason: 'Plenty of stock remains, but advertising economics are not strong enough to justify more spend.', history: history(1.6, 1.1, 13, 88) },
  { id: 'ribbed-tank', name: 'Ribbed Tank', variant: 'Oat / Small', sku: 'TNK-OAT-S', category: 'Apparel', inventory: 211, incomingInventory: 100, restockDate: 'Sep 21', restockDays: 35, sales7d: 3.9, sales30d: 3.1, adSpendDaily: 31, roas: 4.1, grossMargin: 66, inventoryCoverage: 54, stockoutProbability: 21, recommendation: 'INCREASE', confidence: 'Medium', reason: 'A good balance of margin and coverage leaves room for a careful increase while monitoring velocity.', history: history(3, 3.9, 31, 211) },
  { id: 'weekender-bag', name: 'Weekender Bag', variant: 'Olive', sku: 'BAG-OLV-01', category: 'Accessories', inventory: 42, incomingInventory: 160, restockDate: 'Aug 31', restockDays: 14, sales7d: 1.8, sales30d: 1.4, adSpendDaily: 36, roas: 2.9, grossMargin: 55, inventoryCoverage: 23, stockoutProbability: 64, recommendation: 'REDUCE', confidence: 'Medium', reason: 'The current campaign is consuming a short runway before restock with average efficiency.', history: history(1.3, 1.9, 36, 42) },
  { id: 'daily-tee', name: 'Daily Tee', variant: 'Stone / Medium', sku: 'TEE-STN-M', category: 'Apparel', inventory: 932, incomingInventory: 0, restockDate: '—', restockDays: 0, sales7d: 7.2, sales30d: 6.8, adSpendDaily: 52, roas: 3.6, grossMargin: 59, inventoryCoverage: 129, stockoutProbability: 1, recommendation: 'SCALE', confidence: 'Medium', reason: 'High stock coverage supports incremental testing, though ROAS is below the strongest opportunities.', history: history(6.6, 7.2, 52, 932) },
  { id: 'crossbody-pouch', name: 'Crossbody Pouch', variant: 'Ink', sku: 'POU-INK-01', category: 'Accessories', inventory: 75, incomingInventory: 0, restockDate: '—', restockDays: 0, sales7d: 0.9, sales30d: 1.2, adSpendDaily: 21, roas: 1.8, grossMargin: 43, inventoryCoverage: 63, stockoutProbability: 8, recommendation: 'PAUSE', confidence: 'High', reason: 'Slow demand and weak return make this a poor use of active ad spend despite healthy inventory.', history: history(1.3, .9, 21, 75) },
  { id: 'merino-crew', name: 'Merino Crew', variant: 'Moss / Medium', sku: 'MER-MOS-M', category: 'Apparel', inventory: 139, incomingInventory: 240, restockDate: 'Sep 18', restockDays: 32, sales7d: 2.1, sales30d: 2.4, adSpendDaily: 26, roas: 3.2, grossMargin: 61, inventoryCoverage: 58, stockoutProbability: 17, recommendation: 'HOLD', confidence: 'Medium', reason: 'Inventory is workable and demand is steady; maintain the current budget until the shipment lands.', history: history(2.5, 2.1, 26, 139) },
  { id: 'slide-sandal', name: 'Everyday Slide', variant: 'Bone / 8', sku: 'SLD-BON-08', category: 'Footwear', inventory: 368, incomingInventory: 0, restockDate: '—', restockDays: 0, sales7d: 3.4, sales30d: 2.9, adSpendDaily: 34, roas: 4, grossMargin: 58, inventoryCoverage: 108, stockoutProbability: 4, recommendation: 'INCREASE', confidence: 'Medium', reason: 'Healthy coverage and improving sales make this suitable for a controlled spend increase.', history: history(2.7, 3.4, 34, 368) },
  { id: 'utility-cap', name: 'Utility Cap', variant: 'Faded Navy', sku: 'CAP-NVY-01', category: 'Accessories', inventory: 47, incomingInventory: 0, restockDate: '—', restockDays: 0, sales7d: 0.7, sales30d: 0.8, adSpendDaily: 8, roas: 2.1, grossMargin: 46, inventoryCoverage: 59, stockoutProbability: 11, recommendation: 'PAUSE', confidence: 'Medium', reason: 'Low demand and low return suggest pausing promotion while existing stock sells organically.', history: history(.8, .7, 8, 47) },
];

export const getProduct = (id: string) => products.find((product) => product.id === id) ?? products[0];
export const actions = products.filter((p) => ['REDUCE', 'SCALE', 'HOLD', 'INCREASE'].includes(p.recommendation)).slice(0, 4);
export const opportunities = products.filter((p) => ['SCALE', 'INCREASE'].includes(p.recommendation)).sort((a, b) => (b.roas + b.grossMargin / 100) - (a.roas + a.grossMargin / 100)).slice(0, 5);
export const riskProducts = products.filter((p) => p.stockoutProbability >= 18).sort((a, b) => b.stockoutProbability - a.stockoutProbability);