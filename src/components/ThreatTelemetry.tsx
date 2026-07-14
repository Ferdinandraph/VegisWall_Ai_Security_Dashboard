import { TrendingUp, Clock, Target, Users, Activity, Zap, ShieldOff, Gauge } from 'lucide-react';
import type { DashboardMetrics, ThreatRow } from '../types/security';
import { LineChart, DoughnutChart, BarChart } from './Charts';
import { Panel, Eyebrow } from './ui';

export function ThreatTelemetry({ events, metrics, configured, loading, error }: { events: ThreatRow[]; metrics: DashboardMetrics; configured: boolean; loading: boolean; error: string | null }) {
  const totalEvents = metrics.totalScans;
  const totalBlocked = metrics.blockedAttacks;
  const latencies = events.map((event) => event.latencyMs).filter((value): value is number => value !== null);
  const avgLatency = metrics.averageLatencyMs?.toFixed(1) ?? '—';
  const peakLatency = latencies.length ? Math.max(...latencies) : null;
  const latencySeries = latencies.length ? latencies.map((latency, index) => ({ latency, p99: latency, label: events[index].timestamp.slice(11, 16) })) : [{ latency: 0, p99: 0, label: 'No data' }];
  const attackVectorProfile = buildAttackVectorProfile(events);
  const agentVolume = buildAgentVolume(events);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Threat Telemetry & Network Analytics</h2>
          <p className="text-[12px] text-ink-400">Historical firewall performance · last 48 hours</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-ink-850 px-3 py-1.5 text-[11px] text-ink-300">
          <Activity className="h-3.5 w-3.5 text-emerald" />
          <span>Aggregating from 12 facilitator nodes</span>
        </div>
      </div>


      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={Zap} label="Total Events (48h)" value={totalEvents.toLocaleString()} sub="all registered agents" accent="azure" />
        <KpiCard icon={ShieldOff} label="Attacks Shielded" value={totalBlocked.toLocaleString()} sub={totalEvents ? `${((totalBlocked / totalEvents) * 100).toFixed(1)}% block rate` : 'no recorded events'} accent="ruby" />
        <KpiCard icon={Gauge} label="Avg Mitigation Latency" value={`${avgLatency}ms`} sub="median across nodes" accent="emerald" />
        <KpiCard icon={Clock} label="Peak Latency" value={peakLatency === null ? '—' : `${peakLatency}ms`} sub="recorded event window" accent="amber" />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Line chart - spans 2 */}
        <Panel className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald" />
              <span className="text-[13px] font-semibold text-white">API Mitigation Latency Over Time</span>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1.5 text-ink-300"><span className="h-2 w-3 rounded-sm bg-emerald" /> median</span>
              <span className="flex items-center gap-1.5 text-ink-300"><span className="h-2 w-3 rounded-sm bg-azure" /> p99</span>
            </div>
          </div>
          <div className="p-4">
            <LineChart data={latencySeries} />
          </div>
        </Panel>

        {/* Doughnut */}
        <Panel>
          <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
            <Target className="h-4 w-4 text-ruby" />
            <span className="text-[13px] font-semibold text-white">Attack Vector Profile</span>
          </div>
          <div className="flex items-center justify-center p-5">
            <DoughnutChart data={attackVectorProfile} />
          </div>
        </Panel>
      </div>

      {/* Bar chart full width */}
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-azure-glow" />
            <span className="text-[13px] font-semibold text-white">Request Volume by Registered Agent Key</span>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1.5 text-ink-300"><span className="h-2 w-3 rounded-sm bg-emerald" /> safe</span>
            <span className="flex items-center gap-1.5 text-ink-300"><span className="h-2 w-3 rounded-sm bg-ruby" /> shielded</span>
          </div>
        </div>
        <div className="p-5">
          <BarChart data={agentVolume} />
        </div>
      </Panel>

      {/* Footer stat strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat label="Data Source" value={configured ? 'Supabase' : 'Not connected'} accent="azure" />
        <MiniStat label="Event Window" value={`${events.length} events`} accent="emerald" />
        <MiniStat label="Avg Fee / Scan" value={totalEvents ? `$${(metrics.totalRevenue / totalEvents).toFixed(6)}` : '—'} accent="amber" />
        <MiniStat label="Revenue Recorded" value={`$${metrics.totalRevenue.toFixed(2)}`} accent="emerald" />
      </div>
    </div>
  );
}

// Revert back to using your camelCase types inside the component helpers:
function buildAttackVectorProfile(events: ThreatRow[]) {
  const attacks = events.filter((event) => event.verdict === 'ATTACK_SHIELDED');
  const definitions = [ 
    ['System Prompt Override', 'systemOverride', '#ef2b48'], 
    ['API / Data Exfiltration', 'dataLeakage', '#f59e0b'], 
    ['Jailbreak', 'jailbreakAttempt', '#ff3b5c'], 
    ['Tool Abuse', 'toolAbuse', '#1ea8e8'], 
    ['Credential Exfiltration', 'credentialExfil', '#a8b1c2'] 
  ] as const;

  return definitions.map(([label, field, color]) => ({ 
    label, 
    color, 
    value: attacks.reduce((sum, event) => sum + (event.vectors?.[field] ?? 0), 0) 
  }));
}

function buildAgentVolume(events: ThreatRow[]) {
  const grouped = new Map<string, { key: string; full: string; safe: number; blocked: number }>();
  for (const event of events) { 
    const item = grouped.get(event.fullKey) ?? { key: event.agentKey, full: event.fullKey, safe: 0, blocked: 0 }; 
    item[event.verdict === 'SAFE' ? 'safe' : 'blocked'] += 1; 
    grouped.set(event.fullKey, item); 
  }
  return [...grouped.values()].length ? [...grouped.values()] : [{ key: 'No data', full: 'No data', safe: 0, blocked: 0 }];
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  sub: string;
  accent: 'emerald' | 'amber' | 'ruby' | 'azure';
}) {
  const colorMap = { emerald: 'text-emerald', amber: 'text-amber-glow', ruby: 'text-ruby-glow', azure: 'text-azure-glow' };
  const glowMap = { emerald: 'shadow-glow-emerald', amber: 'shadow-glow-amber', ruby: 'shadow-glow-ruby', azure: 'shadow-glow-azure' };
  return (
    <Panel tight className="p-4">
      <div className="flex items-center gap-2">
        <div className={`grid h-8 w-8 place-items-center rounded-lg border border-white/8 bg-ink-850 ${colorMap[accent]} ${glowMap[accent]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <Eyebrow>{label}</Eyebrow>
      </div>
      <div className={`mt-3 font-mono text-2xl font-bold ${colorMap[accent]}`}>{value}</div>
      <div className="mt-0.5 text-[10px] text-ink-400">{sub}</div>
    </Panel>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent: 'emerald' | 'amber' | 'ruby' | 'azure' }) {
  const colorMap = { emerald: 'text-emerald', amber: 'text-amber-glow', ruby: 'text-ruby-glow', azure: 'text-azure-glow' };
  return (
    <Panel tight className="px-4 py-3">
      <Eyebrow>{label}</Eyebrow>
      <div className={`mt-1 font-mono text-base font-semibold ${colorMap[accent]}`}>{value}</div>
    </Panel>
  );
}
