import { useState } from 'react';
import { Activity, DollarSign, Gauge, ScanLine, ArrowUpRight, Search } from 'lucide-react';
import type { DashboardMetrics, ThreatRow } from '../types/security';
import { formatUsd, timeAgo } from '../services/security';
import { Panel, Eyebrow, VerdictBadge, FlowBadge } from './ui';
import { AnimatedNumber } from './Charts';
import { PayloadDrawer } from './PayloadDrawer';

export function LiveThreatStream({ rows = [], metrics, loading, configured, error }: { rows: ThreatRow[]; metrics: DashboardMetrics; loading: boolean; configured: boolean; error: string | null }) {
  const [selected, setSelected] = useState<ThreatRow | null>(null);
  const [filter, setFilter] = useState<'all' | 'safe' | 'attack'>('all');
  const [query, setQuery] = useState('');
  const [paused, setPaused] = useState(false);
  
  // Guard against uninitialized or partial metrics payloads
  const revenue = metrics?.totalRevenue ?? 0;
  const scans = metrics?.totalScans ?? 0;

  const safeRows = Array.isArray(rows) ? rows : [];

  const filtered = safeRows.filter((r) => {
    if (!r) return false;
    if (filter === 'safe' && r.verdict !== 'SAFE') return false;
    if (filter === 'attack' && r.verdict !== 'ATTACK_SHIELDED') return false;
    
    // Fortified text matching strings against null/missing keys
    if (query) {
      const currentAgentKey = (r.agentKey || '').toLowerCase();
      const currentFullKey = (r.fullKey || '').toLowerCase();
      const matchQuery = query.toLowerCase();
      if (!currentAgentKey.includes(matchQuery) && !currentFullKey.includes(matchQuery)) return false;
    }
    return true;
  });

  const blockedCount = safeRows.filter((r) => r?.verdict === 'ATTACK_SHIELDED').length;
  const safeCount = Math.max(0, safeRows.length - blockedCount);
  const blockRate = safeRows.length > 0 ? Math.round((blockedCount / safeRows.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <Panel className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute inset-x-0 top-0 h-px animate-scanline bg-gradient-to-r from-transparent via-emerald/40 to-transparent" />
        </div>
        <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 text-ink-400">
              <DollarSign className="h-3.5 w-3.5 text-emerald" />
              <Eyebrow>Total Automated Micro-Revenue Settled</Eyebrow>
            </div>
            <div className="mt-1 font-mono text-3xl font-bold tracking-tight text-emerald-glow" style={{ textShadow: '0 0 18px rgba(0,255,163,0.35)' }}>
              <AnimatedNumber value={revenue} format={(n) => `$${(n || 0).toFixed(5)} USDC`} />
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald/70">
              <ArrowUpRight className="h-3 w-3" />
              <span>streaming · x402 settled</span>
            </div>
          </div>

          <MetricCard
            icon={Gauge}
            label="Average Mitigation Latency"
            value="42ms"
            sub="p99: 61ms"
            accent="azure"
          />
          <MetricCard
            icon={ScanLine}
            label="Total Scans Today"
            value={scans.toLocaleString()}
            sub="+1,204 / hr"
            accent="emerald"
            animated
            animatedValue={scans}
          />
          <MetricCard
            icon={Activity}
            label="Shielded Attacks (window)"
            value={blockedCount.toString()}
            sub={`${safeCount} safe · ${blockRate}% block rate`}
            accent="ruby"
          />
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-white/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald animate-pulseEmerald" />
            <span className="text-sm font-semibold text-white">Live M2M Traffic</span>
            <span className="font-mono text-[10px] text-ink-400">{filtered.length} events</span>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-ink-850 px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="filter by agent key…"
                className="w-40 bg-transparent text-[11px] text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-0.5 rounded-lg border border-white/8 bg-ink-850 p-0.5">
              {((['all', 'safe', 'attack'] as const)).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-md px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide transition ${
                    filter === f ? 'bg-ink-700 text-white' : 'text-ink-400 hover:text-ink-200'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'safe' ? 'Safe' : 'Attacks'}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPaused((p) => !p)}
              className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wide transition ${
                paused
                  ? 'border-amber/40 bg-amber/10 text-amber-glow'
                  : 'border-white/8 bg-ink-850 text-ink-300 hover:text-ink-100'
              }`}
            >
              {paused ? 'Resume' : 'Pause'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-2 border-b border-white/5 px-4 py-2 text-[10px] uppercase tracking-wider text-ink-400">
          <div className="col-span-2">Timestamp</div>
          <div className="col-span-2">Client Agent Key</div>
          <div className="col-span-4 hidden md:block">Flow State</div>
          <div className="col-span-2 hidden sm:block">Settled Fee</div>
          <div className="col-span-2 text-right">Verdict</div>
        </div>

        <div className="max-h-[560px] overflow-y-auto">
          {!configured && <div className="px-4 py-10 text-center text-xs text-ink-400">Connect Supabase to display live security events.</div>}
          {configured && loading && <div className="px-4 py-10 text-center text-xs text-ink-400">Loading verified security events…</div>}
          {configured && error && <div className="px-4 py-10 text-center text-xs text-ruby-glow">Event stream unavailable: {error}</div>}
          {configured && !loading && !error && filtered.length === 0 && <div className="px-4 py-10 text-center text-xs text-ink-400">No security events match this view.</div>}
          
          {configured && !loading && !error && filtered.map((r) => {
            const dateObj = new Date(r.epoch || 0);
            const formattedTime = isNaN(dateObj.getTime()) ? '--:--:--' : dateObj.toLocaleTimeString('en-US', { hour12: false });
            
            return (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`grid w-full grid-cols-12 items-center gap-2 border-b border-white/4 px-4 py-2.5 text-left transition hover:bg-ink-800/60 ${
                  r.verdict === 'ATTACK_SHIELDED' ? 'animate-rowEnterRuby' : 'animate-rowEnter'
                }`}
              >
                <div className="col-span-2 flex flex-col">
                  <span className="font-mono text-[11px] text-ink-100">{formattedTime}</span>
                  <span className="text-[9px] text-ink-500">{timeAgo(r.epoch || 0)}</span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-ink-850 font-mono text-[9px] text-ink-300">
                    {((r.agentKey || '')).slice(2, 4) || '??'}
                  </span>
                  <span className="font-mono text-[11px] text-ink-200">{r.agentKey || 'unknown'}</span>
                </div>
                <div className="col-span-4 hidden md:block">
                  <FlowBadge state={r.flow} />
                </div>
                <div className="col-span-2 hidden sm:block">
                  <span className="font-mono text-[11px] text-emerald">+{formatUsd(r.fee || 0, 6)}</span>
                  <span className="ml-1 text-[9px] text-ink-500">USDC</span>
                </div>
                <div className="col-span-2 flex justify-end">
                  <VerdictBadge verdict={r.verdict} />
                </div>
              </button>
            );
          })}
        </div>
      </Panel>

      {selected && <PayloadDrawer row={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  animated,
  animatedValue,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  sub: string;
  accent: 'emerald' | 'amber' | 'ruby' | 'azure';
  animated?: boolean;
  animatedValue?: number;
}) {
  const colorMap = {
    emerald: 'text-emerald',
    amber: 'text-amber-glow',
    ruby: 'text-ruby-glow',
    azure: 'text-azure-glow',
  };
  const glowMap = {
    emerald: 'shadow-glow-emerald',
    amber: 'shadow-glow-amber',
    ruby: 'shadow-glow-ruby',
    azure: 'shadow-glow-azure',
  };
  return (
    <div className="relative flex items-center gap-3 border-l border-white/5 pl-4 first:border-0 first:pl-0 lg:border-l lg:pl-4">
      <div className={`grid h-9 w-9 place-items-center rounded-lg border border-white/8 bg-ink-850 ${colorMap[accent]} ${glowMap[accent]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex flex-col">
        <Eyebrow>{label}</Eyebrow>
        {animated && animatedValue !== undefined ? (
          <span className={`font-mono text-xl font-bold ${colorMap[accent]}`}>
            <AnimatedNumber value={animatedValue} format={(n) => Math.floor(n || 0).toLocaleString()} />
          </span>
        ) : (
          <span className={`font-mono text-xl font-bold ${colorMap[accent]}`}>{value}</span>
        )}
        <span className="text-[10px] text-ink-400">{sub}</span>
      </div>
    </div>
  );
}