// components/Sidebar.tsx
import { useState } from 'react';
import { Shield, Activity, FlaskConical, BarChart3, Radio, Lock, ChevronRight, Zap, Key } from 'lucide-react';
import { DEFAULT_SANDBOX_KEY } from '../config/keys';

export type ViewId = 'stream' | 'sandbox' | 'telemetry' | 'keys';

const NAV: { id: ViewId; label: string; sub: string; icon: typeof Shield }[] = [
  { id: 'stream', label: 'Live Threat Stream', sub: 'Real-time M2M traffic', icon: Activity },
  { id: 'sandbox', label: 'Developer Sandbox', sub: 'Test & simulate', icon: FlaskConical },
  { id: 'keys', label: 'API Keys', sub: 'Generate & manage', icon: Key },
  { id: 'telemetry', label: 'Threat Telemetry', sub: 'Network analytics', icon: BarChart3 },
];

export function Sidebar({
  view,
  setView,
}: {
  view: ViewId;
  setView: (v: ViewId) => void;
}) {
  return (
    <aside className="sticky top-0 z-30 hidden h-screen w-[260px] shrink-0 flex-col border-r border-white/5 bg-ink-900/80 backdrop-blur-xl md:flex">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="relative grid h-10 w-10 place-items-center rounded-xl border border-emerald/30 bg-emerald/10 shadow-glow-emerald">
          <Shield className="h-5 w-5 text-emerald" />
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald animate-pulseEmerald" />
        </div>
        <div>
          <div className="text-[15px] font-bold tracking-tight text-white">Vegiswall</div>
          <div className="eyebrow">Prompt Guardrail Firewall</div>
        </div>
      </div>

      {/* Status block */}
      <div className="mx-4 mb-4 rounded-xl border border-emerald/20 bg-emerald/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Radio className="h-3.5 w-3.5 text-emerald animate-pulseEmerald" />
          <span className="text-[11px] font-semibold text-emerald">FIREWALL ACTIVE</span>
          <span className="ml-auto h-2 w-2 rounded-full bg-emerald animate-pulseEmerald" />
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-ink-300">
          <span>x402 facilitator</span>
          <span className="font-mono text-emerald">online</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-ink-300">
          <span>Base mainnet</span>
          <span className="font-mono text-azure-glow">8453</span>
        </div>
        
        {/* Active API Key Indicator */}
        <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center gap-1.5 text-[10px] text-ink-300">
          <Key className="h-3 w-3 text-emerald" />
          <span className="truncate font-mono">{DEFAULT_SANDBOX_KEY.key.substring(0, 14)}...</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 px-3">
        <div className="eyebrow px-2 pb-2">Operations</div>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                active
                  ? 'bg-ink-700/70 text-white shadow-inset-line'
                  : 'text-ink-300 hover:bg-ink-800/60 hover:text-ink-100'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-emerald shadow-glow-emerald" />
              )}
              <Icon className={`h-4.5 w-4.5 ${active ? 'text-emerald' : 'text-ink-400 group-hover:text-ink-200'}`} />
              <span className="flex flex-col">
                <span className="text-[13px] font-medium">{item.label}</span>
                <span className="text-[10px] text-ink-400">{item.sub}</span>
              </span>
              {active && <ChevronRight className="ml-auto h-3.5 w-3.5 text-ink-400" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/5 px-4 py-4">
        <div className="flex items-center gap-2 text-[10px] text-ink-400">
          <Lock className="h-3 w-3" />
          <span>E2E encrypted · EIP-712</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[10px] text-ink-400">
          <Zap className="h-3 w-3 text-amber-glow" />
          <span>gasless micropayments</span>
        </div>
        <div className="mt-3 text-[9px] text-ink-500">v2.4.1 · build 0xAe9F1c0FFE</div>
      </div>
    </aside>
  );
}

export function MobileNav({ view, setView }: { view: ViewId; setView: (v: ViewId) => void }) {
  return (
    <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-white/5 bg-ink-900/90 px-3 py-2 backdrop-blur-xl md:hidden">
      <div className="flex items-center gap-2 pr-2">
        <div className="grid h-7 w-7 place-items-center rounded-lg border border-emerald/30 bg-emerald/10">
          <Shield className="h-3.5 w-3.5 text-emerald" />
        </div>
        <span className="text-sm font-bold text-white">Vegiswall</span>
      </div>
      <div className="ml-auto flex gap-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`grid h-8 w-8 place-items-center rounded-lg ${
                active ? 'bg-emerald/15 text-emerald' : 'text-ink-400'
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function useView() {
  return useState<ViewId>('stream');
}