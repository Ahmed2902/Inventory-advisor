// @ts-nocheck
import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowLeft, ArrowRight, Check, CircleHelp, Gauge, GitBranch, Info, Lightbulb, Menu, Package, Search, Settings, ShieldAlert, SlidersHorizontal, TrendingUp, Zap } from 'lucide-react';
import { Link, useLocation } from 'wouter';

import App from './App';
import { getProduct, products, type Product, type Recommendation } from './data/mockData';
import './validation.css';

const statusClass: Record<Recommendation, string> = {
  SCALE: 'status-scale',
  INCREASE: 'status-increase',
  HOLD: 'status-hold',
  REDUCE: 'status-reduce',
  PAUSE: 'status-pause',
};

const roundToFive = (value: number) => Math.max(0, Math.round(value / 5) * 5);

function RecommendationBadge({ recommendation }: { recommendation: Recommendation }) {
  return <span className={`status ${statusClass[recommendation]}`}><span>{recommendation}</span></span>;
}

function ProductThumb({ large = false }: { large?: boolean }) {
  return <div className={large ? 'detail-thumb' : 'product-thumb'} aria-hidden="true" />;
}

function MetricCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return <div className="metric-card"><div className="eyebrow">{label}</div><div className="metric-value">{value}</div>{note && <div className="metric-note">{note}</div>}</div>;
}

function getSafetyStock(product: Product) {
  return Math.min(product.inventory, Math.max(1, Math.round(product.sales7d * 7)));
}

function inventoryPosition(product: Product, demand = product.sales7d, incomingQty = product.incomingInventory, restockDays = product.restockDays) {
  const safetyStock = getSafetyStock(product);
  const usableInventory = Math.max(0, product.inventory - safetyStock);
  const totalRunway = product.inventory / Math.max(.1, demand);
  const usableRunway = usableInventory / Math.max(.1, demand);
  const hasIncoming = incomingQty > 0 && restockDays > 0;
  const gapOrBuffer = hasIncoming ? usableRunway - restockDays : null;
  return { safetyStock, usableInventory, totalRunway, usableRunway, hasIncoming, gapOrBuffer };
}

function getSpendPlan(product: Product, recommendation: Recommendation) {
  const current = product.adSpendDaily;
  const multipliers: Record<Recommendation, [number, number, number]> = {
    SCALE: [1.18, 1.27, 1.4],
    INCREASE: [1.1, 1.15, 1.25],
    HOLD: [.95, 1.05, 1.1],
    REDUCE: [.7, .8, .85],
    PAUSE: [0, .25, .25],
  };
  const [lowM, highM, ceilingM] = multipliers[recommendation];
  let low = roundToFive(current * lowM);
  let high = roundToFive(current * highM);
  if (high === low && recommendation !== 'PAUSE') high += 5;
  const ceiling = roundToFive(current * ceilingM);
  const action: Record<Recommendation, string> = {
    SCALE: 'Test more demand while inventory headroom is healthy.',
    INCREASE: 'Raise spend carefully and watch sales velocity.',
    HOLD: 'Keep spend near the current level until inventory conditions improve.',
    REDUCE: 'Pull spend back until replenishment or demand changes the picture.',
    PAUSE: 'Pause or keep only minimal spend while inventory/economics are weak.',
  };
  return { current, low, high, ceiling, duration: 5, action: action[recommendation] };
}

function getScenarioRecommendation(product: Product, demand: number, incomingQty: number, restockDays: number): Recommendation {
  const position = inventoryPosition(product, demand, incomingQty, restockDays);
  const economicsStrong = product.roas >= 3.7 && product.grossMargin >= 55;
  const economicsExcellent = product.roas >= 4 && product.grossMargin >= 60;

  if (!position.hasIncoming) {
    if (position.totalRunway < 10) return 'PAUSE';
    if (position.usableRunway < 14) return 'REDUCE';
    if (position.usableRunway < 30) return 'HOLD';
    if (economicsExcellent && position.usableRunway >= 75) return 'SCALE';
    if (economicsStrong && position.usableRunway >= 45) return 'INCREASE';
    return 'HOLD';
  }

  if (position.gapOrBuffer! < -7) return 'REDUCE';
  if (position.gapOrBuffer! < 0) return 'HOLD';
  if (position.gapOrBuffer! <= 7) return economicsStrong ? 'INCREASE' : 'HOLD';
  if (position.gapOrBuffer! > 10 && incomingQty >= product.inventory && economicsStrong) return 'SCALE';
  return economicsStrong ? 'INCREASE' : 'HOLD';
}

function projectInventory(product: Product, dailyDemand: number, incomingQty = product.incomingInventory, restockDays = product.restockDays, days = 45) {
  let inventory = product.inventory;
  return Array.from({ length: days + 1 }, (_, day) => {
    if (day > 0) {
      inventory = Math.max(0, inventory - dailyDemand);
      if (incomingQty > 0 && restockDays > 0 && day === restockDays) inventory += incomingQty;
    }
    return { day: `+${day}`, inventory: Number(inventory.toFixed(1)) };
  });
}

function getHeadline(recommendation: Recommendation) {
  const headlines: Record<Recommendation, string> = {
    SCALE: 'This product has room to test more demand.',
    INCREASE: 'Inventory supports a careful increase.',
    HOLD: 'Keep spend steady until the inventory buffer improves.',
    REDUCE: 'Marketing is pushing harder than inventory can safely support.',
    PAUSE: 'Stop pushing this product until the constraint changes.',
  };
  return headlines[recommendation];
}

function EnhancedShell({ children, label }: { children: React.ReactNode; label: string }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = [
    ['/app/overview', 'Overview', Gauge],
    ['/app/products', 'Products', Package],
    ['/app/opportunities', 'Opportunities', Lightbulb],
    ['/app/risks', 'Risks', ShieldAlert],
    ['/app/simulator', 'Simulator', SlidersHorizontal],
  ] as const;
  return <div className={`shell ${menuOpen ? 'menu-open' : ''}`}>
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">S</div><div className="brand-name">StockPilot</div><button className="mobile-menu" onClick={() => setMenuOpen((open) => !open)}><Menu size={20} /></button></div>
      <div className="store-switcher"><div className="eyebrow">Store</div><div className="store-name">Aster & Co.</div><div className="connection-row"><span><i className="dot" /> Shopify</span><span><i className="dot" /> Meta</span></div></div>
      <nav className="nav-section"><div className="nav-label">Workspace</div>{nav.map(([href, text, Icon]) => <Link key={href} href={href} className={`nav-item ${location === href || (href === '/app/products' && location.startsWith('/app/products/')) ? 'active' : ''}`}><Icon /><span>{text}</span></Link>)}</nav>
      <div className="sidebar-footer"><nav className="nav-section"><div className="nav-label">Account</div><Link href="/app/integrations" className="nav-item"><GitBranch /><span>Integrations</span></Link><Link href="/app/settings" className="nav-item"><Settings /><span>Settings</span></Link></nav><div className="demo-label">Demo environment — sample data</div></div>
    </aside>
    <div className="app-main"><header className="topbar"><div className="breadcrumb"><span>Workspace</span><ArrowRight size={13} /><strong>{label}</strong></div><div className="top-actions"><span className="status status-hold"><CircleHelp size={13} /> Validation demo</span><div className="avatar">SC</div></div></header>{children}</div>
  </div>;
}

function InventoryTimeline({ product, demand, incomingQty, restockDays }: { product: Product; demand: number; incomingQty: number; restockDays: number }) {
  const position = inventoryPosition(product, demand, incomingQty, restockDays);
  const horizon = Math.max(30, Math.ceil(position.totalRunway + 7), restockDays + 7);
  const stockoutPct = Math.min(100, Math.max(0, position.totalRunway / horizon * 100));
  const safetyPct = Math.min(100, Math.max(0, position.usableRunway / horizon * 100));
  const restockPct = restockDays > 0 ? Math.min(100, restockDays / horizon * 100) : null;
  return <div className="inventory-timeline">
    <div className="timeline-scale"><span>Today</span><span>{horizon} days</span></div>
    <div className="timeline-track-wide">
      <div className="timeline-consumption" style={{ width: `${stockoutPct}%` }} />
      <span className="timeline-pin safety" style={{ left: `${safetyPct}%` }}><i />Safety stock</span>
      <span className="timeline-pin stockout" style={{ left: `${stockoutPct}%` }}><i />Projected zero</span>
      {restockPct !== null && incomingQty > 0 && <span className="timeline-pin restock" style={{ left: `${restockPct}%` }}><i />+{incomingQty} incoming</span>}
    </div>
    <div className={`timeline-summary ${position.gapOrBuffer !== null && position.gapOrBuffer < 0 ? 'danger' : 'safe'}`}>
      {position.gapOrBuffer === null
        ? `No incoming stock planned · about ${Math.round(position.totalRunway)} days to zero at this demand.`
        : position.gapOrBuffer < 0
          ? `Safety-stock pressure begins about ${Math.abs(Math.round(position.gapOrBuffer))} days before replenishment.`
          : `About ${Math.round(position.gapOrBuffer)} days of buffer remain before replenishment.`}
    </div>
  </div>;
}

function SpendPlanCard({ product, recommendation, title = 'Suggested next test' }: { product: Product; recommendation: Recommendation; title?: string }) {
  const plan = getSpendPlan(product, recommendation);
  return <div className="spend-plan">
    <div className="eyebrow">{title}</div>
    <div className="spend-plan-main"><div><span>Current</span><strong>${plan.current}/day</strong></div><ArrowRight size={17} /><div><span>Test range</span><strong>${plan.low}–${plan.high}/day</strong></div></div>
    <div className="spend-plan-grid"><div><span>Run for</span><strong>{plan.duration} days</strong></div><div><span>Inventory-safe ceiling</span><strong>~${plan.ceiling}/day</strong></div></div>
    <p>{plan.action} The range is a demo decision band, not an optimized or guaranteed budget.</p>
  </div>;
}

function EnhancedProductDetail({ id }: { id: string }) {
  const product = getProduct(id);
  const position = inventoryPosition(product);
  const safetyStock = position.safetyStock;
  const projection = projectInventory(product, product.sales7d);
  const velocityLift = Math.round((product.sales7d / product.sales30d - 1) * 100);
  const outrunning = product.restockDays > 0 && position.gapOrBuffer !== null && position.gapOrBuffer < 0 && velocityLift > 20;

  return <EnhancedShell label="Product analysis"><main className="page enhanced-page">
    <div className="page-header"><div><Link href="/app/products" className="breadcrumb"><ArrowLeft size={14} /> Products</Link><h1 className="page-title" style={{ marginTop: 12 }}>{product.name}</h1><p className="page-subtitle">{product.variant} · {product.sku}</p></div><RecommendationBadge recommendation={product.recommendation} /></div>

    <div className="detail-hero"><div className="panel detail-product"><ProductThumb large /><div className="detail-meta"><div className="eyebrow">{product.category}</div><h1>{product.name}</h1><div className="sku">{product.variant} · SKU {product.sku}</div><RecommendationBadge recommendation={product.recommendation} /></div></div><div className="recommend-panel enhanced-recommend"><div className="eyebrow">Recommendation · {product.confidence} confidence</div><h2>{getHeadline(product.recommendation)}</h2><p>{product.reason}</p><SpendPlanCard product={product} recommendation={product.recommendation} /></div></div>

    <section className="panel panel-pad inventory-position-panel">
      <div className="section-head"><div><h2 className="section-title">Inventory position</h2><div className="section-note">What is actually available to support more demand before the next replenishment.</div></div><span className="status status-hold">Balanced safety stock · 7 days</span></div>
      <div className="inventory-position-grid">
        <div><span>Sellable now</span><strong>{product.inventory} units</strong></div>
        <div><span>Safety stock</span><strong>{safetyStock} units</strong></div>
        <div className="accent"><span>Inventory available to push</span><strong>{position.usableInventory} units</strong></div>
        <div><span>Recent demand</span><strong>{product.sales7d}/day</strong></div>
        <div><span>Usable runway</span><strong>~{Math.round(position.usableRunway)} days</strong></div>
        <div><span>Incoming inventory</span><strong>{position.hasIncoming ? `+${product.incomingInventory} in ${product.restockDays}d` : 'None planned'}</strong></div>
      </div>
      <InventoryTimeline product={product} demand={product.sales7d} incomingQty={product.incomingInventory} restockDays={product.restockDays} />
    </section>

    {outrunning && <section className="callout enhanced-callout"><div><div className="eyebrow">Decision signal</div><div className="callout-value">Marketing is outrunning inventory</div><p>Recent sales velocity is {velocityLift}% above the 30-day baseline, while usable inventory reaches the safety reserve before replenishment.</p></div><div className="signal-grid"><div><span>Sales velocity</span><strong>+{velocityLift}%</strong></div><div><span>Usable runway</span><strong>{Math.round(position.usableRunway)}d</strong></div><div><span>Restock</span><strong>{product.restockDays}d</strong></div><div><span>Incoming</span><strong>+{product.incomingInventory}</strong></div></div><div className="signal-foot">Correlation shown for decision support; other factors may contribute.</div></section>}

    <div className="detail-metrics"><MetricCard label="Current inventory" value={`${product.inventory}`} note={`${position.usableInventory} above safety stock`} /><MetricCard label="Recent demand" value={`${product.sales7d}/day`} note={`30d avg ${product.sales30d}/day`} /><MetricCard label="Meta spend" value={`$${product.adSpendDaily}/day`} note={`${product.roas}x ROAS`} /><MetricCard label="Replenishment" value={position.hasIncoming ? `${product.restockDays} days` : 'Not planned'} note={position.hasIncoming ? `+${product.incomingInventory} units` : 'No incoming stock'} /></div>

    <section className="panel chart-panel"><div className="section-head"><div><h2 className="section-title">Inventory projection</h2><div className="section-note">Expected inventory at the current demand rate, including the known incoming shipment.</div></div><div className="eyebrow">Directional estimate</div></div><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><AreaChart data={projection}><CartesianGrid stroke="#ede9df" vertical={false} /><XAxis dataKey="day" interval={5} tick={{ fontSize: 10, fill: '#8c958e' }} /><YAxis tick={{ fontSize: 10, fill: '#8c958e' }} /><Tooltip contentStyle={{ border: '1px solid #e1dfd6', borderRadius: 6, fontSize: 11 }} /><Area type="linear" dataKey="inventory" stroke="#2e7560" fill="#dfece5" strokeWidth={2.4} /><ReferenceLine y={safetyStock} stroke="#d08d3e" strokeDasharray="4 4" label={{ value: `Safety stock · ${safetyStock}`, fill: '#a77034', fontSize: 10 }} />{position.hasIncoming && <ReferenceLine x={`+${product.restockDays}`} stroke="#5885ad" strokeDasharray="4 4" label={{ value: `+${product.incomingInventory} incoming`, fill: '#47749b', fontSize: 10 }} />}</AreaChart></ResponsiveContainer></div></section>
  </main></EnhancedShell>;
}

function EnhancedSimulator() {
  const [id, setId] = useState('black-hoodie-m');
  const [change, setChange] = useState(0);
  const baseProduct = getProduct(id);
  const [incomingQty, setIncomingQty] = useState(baseProduct.incomingInventory);
  const [restockDays, setRestockDays] = useState(baseProduct.restockDays);

  const selectProduct = (nextId: string) => {
    const next = getProduct(nextId);
    setId(nextId);
    setChange(0);
    setIncomingQty(next.incomingInventory);
    setRestockDays(next.restockDays);
  };

  const calc = useMemo(() => {
    const effect = change >= 0 ? change / 100 * .55 : change / 100 * .4;
    const demand = Math.max(.1, baseProduct.sales7d * (1 + effect));
    const lowDemand = demand * .9;
    const highDemand = demand * 1.14;
    const position = inventoryPosition(baseProduct, demand, incomingQty, restockDays);
    const recommendation = getScenarioRecommendation(baseProduct, demand, incomingQty, restockDays);
    const spend = Math.round(baseProduct.adSpendDaily * (1 + change / 100));
    return { demand, lowDemand, highDemand, position, recommendation, spend };
  }, [baseProduct, change, incomingQty, restockDays]);

  const currentPosition = inventoryPosition(baseProduct);
  const plan = getSpendPlan(baseProduct, calc.recommendation);

  return <EnhancedShell label="Simulator"><main className="page enhanced-page">
    <div className="page-header"><div><div className="eyebrow">Decision sandbox</div><h1 className="page-title">How hard can I safely push this product?</h1><p className="page-subtitle">Change ad spend and inventory assumptions, then see when the recommendation changes.</p></div><div className="status status-hold"><CircleHelp size={13} /> Sample-data simulation</div></div>

    <div className="sim-layout enhanced-sim-layout"><section className="panel sim-control enhanced-controls">
      <div className="section-head"><h2 className="section-title">Scenario inputs</h2><Zap size={17} color="#d08d3e" /></div>
      <label className="sim-field"><span>Product</span><select className="select" value={id} onChange={(event) => selectProduct(event.target.value)}>{products.map((item) => <option key={item.id} value={item.id}>{item.name} / {item.variant}</option>)}</select></label>
      <div className="current-product"><div><div className="stat-label">Current Meta spend</div><div className="sim-number">${baseProduct.adSpendDaily}/day</div></div><div><div className="stat-label">Sellable stock</div><div className="sim-number">{baseProduct.inventory}</div></div><div><div className="stat-label">Safety reserve</div><div className="sim-number">{getSafetyStock(baseProduct)}</div></div><div><div className="stat-label">Recent sales</div><div className="sim-number">{baseProduct.sales7d}/day</div></div></div>

      <div className="section-head input-section-head"><h2 className="section-title">Meta budget change</h2><strong>{change > 0 ? '+' : ''}{change}%</strong></div>
      <input className="range" type="range" min="-50" max="100" step="5" value={change} onChange={(event) => setChange(Number(event.target.value))} />
      <div className="range-scale"><span>-50%</span><span>Current</span><span>+100%</span></div>
      <div className="preset-row">{[-50, -25, 0, 25, 50, 100].map((preset) => <button className={`preset ${change === preset ? 'active' : ''}`} key={preset} onClick={() => setChange(preset)}>{preset > 0 ? '+' : ''}{preset}%</button>)}</div>

      <div className="inventory-assumptions"><div className="eyebrow">Inventory assumptions</div><div className="assumption-grid"><label className="sim-field"><span>Incoming quantity</span><input className="input" type="number" min="0" value={incomingQty} onChange={(event) => setIncomingQty(Math.max(0, Number(event.target.value) || 0))} /></label><label className="sim-field"><span>Arrives in days</span><input className="input" type="number" min="0" value={restockDays} onChange={(event) => setRestockDays(Math.max(0, Number(event.target.value) || 0))} /></label></div><div className="sim-note"><Info size={15} />Try moving the shipment earlier or adding inventory. The recommendation should change because inventory headroom changes.</div></div>
    </section>

    <section className="sim-results">
      <div className="comparison enhanced-comparison"><div className="compare-card"><div className="eyebrow">Current plan</div><div className="compare-value">${baseProduct.adSpendDaily}/day</div><div className="stat-label block-gap">Demand</div><div className="strong">{baseProduct.sales7d}/day</div><div className="stat-label block-gap">Usable runway</div><div className="strong">~{Math.round(currentPosition.usableRunway)} days</div><div className="stat-label block-gap">Restock</div><div className="strong">{baseProduct.restockDays ? `${baseProduct.restockDays} days · +${baseProduct.incomingInventory}` : 'None planned'}</div></div><div className="compare-card highlight"><div className="eyebrow">Your scenario</div><div className="compare-value">${calc.spend}/day</div><div className="stat-label block-gap">Projected demand</div><div className="strong">{calc.lowDemand.toFixed(1)}–{calc.highDemand.toFixed(1)}/day</div><div className="stat-label block-gap">Usable runway</div><div className="strong">~{Math.round(calc.position.usableRunway)} days</div><div className="stat-label block-gap">Gap / buffer</div><div className={`strong ${calc.position.gapOrBuffer !== null && calc.position.gapOrBuffer < 0 ? 'risk-high' : 'risk-low'}`}>{calc.position.gapOrBuffer === null ? 'No incoming stock' : calc.position.gapOrBuffer < 0 ? `~${Math.abs(Math.round(calc.position.gapOrBuffer))}d gap` : `~${Math.round(calc.position.gapOrBuffer)}d buffer`}</div></div></div>

      <div className="recommend-hold enhanced-decision"><div className="decision-top"><RecommendationBadge recommendation={calc.recommendation} /><span className="decision-confidence">Directional demo recommendation</span></div><h3>{getHeadline(calc.recommendation)}</h3><SpendPlanCard product={baseProduct} recommendation={calc.recommendation} title="Recommended 5-day test" /><div className="safe-scale"><div><span>Current spend</span><strong>${baseProduct.adSpendDaily}/day</strong></div><ArrowRight size={16} /><div className="recommended"><span>Suggested test</span><strong>${plan.low}–${plan.high}/day</strong></div><ArrowRight size={16} /><div><span>Inventory-safe ceiling</span><strong>~${plan.ceiling}/day</strong></div></div></div>

      <section className="panel panel-pad simulator-inventory"><div className="section-head"><div><h2 className="section-title">Inventory effect</h2><div className="section-note">The simulator is not only changing ad spend; it is checking the spend against the inventory plan.</div></div></div><div className="inventory-position-grid compact"><div><span>Sellable now</span><strong>{baseProduct.inventory}</strong></div><div><span>Safety stock</span><strong>{calc.position.safetyStock}</strong></div><div className="accent"><span>Available to push</span><strong>{calc.position.usableInventory}</strong></div><div><span>Incoming</span><strong>{incomingQty || 'None'}</strong></div><div><span>Restock</span><strong>{restockDays ? `${restockDays} days` : 'None'}</strong></div><div><span>Projected demand</span><strong>{calc.demand.toFixed(1)}/day</strong></div></div><InventoryTimeline product={baseProduct} demand={calc.demand} incomingQty={incomingQty} restockDays={restockDays} /></section>
    </section></div>
  </main></EnhancedShell>;
}

export default function ValidationRoutes() {
  const [location] = useLocation();
  if (location === '/app/simulator') return <EnhancedSimulator />;
  const match = location.match(/^\/app\/products\/([^/]+)$/);
  if (match) return <EnhancedProductDetail id={decodeURIComponent(match[1])} />;
  return <App />;
}
