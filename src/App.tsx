import { useState } from 'react';
import { Sidebar, MobileNav, type ViewId } from './components/Sidebar';
import { LiveThreatStream } from './components/LiveThreatStream';
import { DeveloperSandbox } from './components/DeveloperSandbox';
import { ThreatTelemetry } from './components/ThreatTelemetry';
import { useSecurityEvents } from './hooks/useSecurityEvents';
import { Shield, Activity, FlaskConical, BarChart3 } from 'lucide-react';

const VIEW_META: Record<ViewId, { title: string; sub: string; icon: typeof Shield }> = {
  stream: { title: 'Live Threat Stream', sub: 'Real-time M2M agent traffic & x402 settlement', icon: Activity },
  sandbox: { title: 'Interactive Developer Sandbox', sub: 'Test prompts against the guardrail', icon: FlaskConical },
  telemetry: { title: 'Threat Telemetry & Network Analytics', sub: 'Historical firewall performance', icon: BarChart3 },
};

function App() {
  const [view, setView] = useState<ViewId>('stream');
  const security = useSecurityEvents();
  const meta = VIEW_META[view];
  const Icon = meta.icon;

  return (
    <div className="app-backdrop flex min-h-screen text-ink-100">
      <Sidebar view={view} setView={setView} />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav view={view} setView={setView} />

        {/* Top bar */}
        <header className="sticky top-0 z-20 hidden border-b border-white/5 bg-ink-950/70 px-6 py-4 backdrop-blur-xl md:block">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg border border-white/8 bg-ink-850 text-emerald">
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white">{meta.title}</h1>
              <p className="text-[11px] text-ink-400">{meta.sub}</p>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-ink-850 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald animate-pulseEmerald" />
                <span className="text-[11px] text-ink-200">All systems operational</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full border border-white/8 bg-ink-850 font-mono text-[10px] text-ink-300">
                  SEC
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-ink-100">SecOps Console</span>
                  <span className="text-[9px] text-ink-500">Tier-1 Analyst</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-4 py-5 md:px-6 md:py-6">
          <div key={view} className="animate-[fadeIn_0.3s_ease-out]">
            {view === 'stream' && <LiveThreatStream rows={security.events} metrics={security.metrics} loading={security.loading} configured={security.configured} error={security.error} />}
            {view === 'sandbox' && <DeveloperSandbox />}
            {view === 'telemetry' && <ThreatTelemetry events={security.events} metrics={security.metrics} configured={security.configured} loading={security.loading} error={security.error} />}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/5 px-6 py-3 text-[10px] text-ink-500">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Vegiswall · AI Prompt Guardrail & Execution Firewall</span>
            <span className="font-mono">x402 protocol · Base mainnet · EIP-4361</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
