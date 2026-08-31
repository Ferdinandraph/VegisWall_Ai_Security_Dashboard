import { useEffect, useMemo, useState } from 'react';
import { Sidebar, MobileNav, type ViewId } from './components/Sidebar';
import { LiveThreatStream } from './components/LiveThreatStream';
import { DeveloperSandbox } from './components/DeveloperSandbox';
import { ThreatTelemetry } from './components/ThreatTelemetry';
import { ApiKeyManager } from './components/ApiKeyManager';
import { useSecurityEvents } from './hooks/useSecurityEvents';
import {
  clearDeveloperSession,
  loginDeveloper,
  readDeveloperSession,
  signUpDeveloper,
  storeDeveloperSession,
  type DeveloperAccount,
} from './services/auth';
import { supabase } from './lib/supabase';
import { Shield, Activity, FlaskConical, BarChart3, Key, LogOut, UserPlus, LogIn } from 'lucide-react';

const VIEW_META: Record<ViewId, { title: string; sub: string; icon: typeof Shield }> = {
  stream: { title: 'Live Threat Stream', sub: 'Real-time M2M agent traffic & x402 settlement', icon: Activity },
  sandbox: { title: 'Interactive Developer Sandbox', sub: 'Test prompts against the guardrail', icon: FlaskConical },
  keys: { title: 'Developer API Keys', sub: 'Generate and manage agent keys', icon: Key },
  telemetry: { title: 'Threat Telemetry & Network Analytics', sub: 'Historical firewall performance', icon: BarChart3 },
};

function App() {
  const [view, setView] = useState<ViewId>('stream');
  const [developer, setDeveloper] = useState<DeveloperAccount | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const security = useSecurityEvents();
  const meta = VIEW_META[view];
  const Icon = meta.icon;

  useEffect(() => {
    // 1. Initial quick load from local storage
    const session = readDeveloperSession();
    if (session) {
      setDeveloper(session);
    }

    // 2. Validate session with Supabase auth status on load
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
        if (activeSession?.user) {
          const activeDev: DeveloperAccount = {
            id: activeSession.user.id,
            name:
              activeSession.user.user_metadata?.name ||
              activeSession.user.email?.split('@')[0] ||
              'Developer',
            email: activeSession.user.email || '',
            created_at: activeSession.user.created_at,
          };
          setDeveloper(activeDev);
          storeDeveloperSession(activeDev);
        }
      });
    }
  }, []);

  const headerLabel = useMemo(
    () => (developer ? `Signed in as ${developer.name}` : 'Developer access required'),
    [developer]
  );

  const developerInitials = useMemo(() => {
    if (!developer) return 'DV';
    const source = developer.name.trim() || developer.email;
    const parts = source.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
  }, [developer]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const nextDeveloper =
        mode === 'signup'
          ? await signUpDeveloper(name, email, password)
          : await loginDeveloper(email, password);

      storeDeveloperSession(nextDeveloper);
      setDeveloper(nextDeveloper);
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await clearDeveloperSession();
    setDeveloper(null);
  };

  if (!developer) {
    return (
      <div className="min-h-screen bg-ink-950 text-ink-100">
        <header className="border-b border-white/10 bg-ink-950/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-emerald/20 bg-emerald/10 text-emerald">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Vegiswall</h1>
                <p className="text-sm text-ink-400">AI prompt guardrail and execution firewall</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-ink-200 transition hover:text-white"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                className="rounded-lg bg-emerald px-3 py-2 text-sm font-semibold text-ink-950 transition hover:bg-emerald/90"
              >
                Sign up
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          <section className="space-y-6">
            <div className="inline-flex items-center rounded-full border border-emerald/20 bg-emerald/10 px-3 py-1 text-sm text-emerald">
              Developer-first security operations
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Secure every prompt, protect every workflow.
              </h2>
              <p className="max-w-2xl text-lg text-ink-400">
                Give developers their own secure workspace to inspect live threat traffic, test prompts, and monitor telemetry in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                className="rounded-lg bg-emerald px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-emerald/90"
              >
                Create developer account
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="rounded-lg border border-white/10 bg-ink-900 px-4 py-2.5 text-sm font-semibold text-ink-100 transition hover:text-white"
              >
                Open existing dashboard
              </button>
            </div>
          </section>

          <aside className="rounded-2xl border border-white/10 bg-ink-900/80 p-6 shadow-2xl shadow-black/30">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-emerald/20 bg-emerald/10 text-emerald">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Developer access</h3>
                <p className="text-sm text-ink-400">Create an account or sign in to open your dashboard.</p>
              </div>
            </div>

            <div className="mb-4 flex rounded-lg border border-white/10 bg-ink-850 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                  mode === 'login' ? 'bg-emerald text-ink-950' : 'text-ink-300 hover:text-white'
                }`}
              >
                <span className="mr-2 inline-flex">
                  <LogIn className="h-4 w-4" />
                </span>
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                  mode === 'signup' ? 'bg-emerald text-ink-950' : 'text-ink-300 hover:text-white'
                }`}
              >
                <span className="mr-2 inline-flex">
                  <UserPlus className="h-4 w-4" />
                </span>
                Sign up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <label className="block text-sm text-ink-300">
                  <span className="mb-1 block">Name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    className="w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-white outline-none ring-0"
                    placeholder="Alex Carter"
                  />
                </label>
              )}
              <label className="block text-sm text-ink-300">
                <span className="mb-1 block">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-white outline-none ring-0"
                  placeholder="dev@example.com"
                />
              </label>
              <label className="block text-sm text-ink-300">
                <span className="mb-1 block">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-white outline-none ring-0"
                  placeholder="Enter a password"
                />
              </label>

              {error ? <p className="text-sm text-rose-400">{error}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald px-3 py-2 text-sm font-semibold text-ink-950 transition hover:bg-emerald/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Working...' : mode === 'signup' ? 'Create account' : 'Log in'}
              </button>
            </form>
          </aside>
        </main>
      </div>
    );
  }

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
                  {developerInitials}
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-ink-100">{headerLabel}</span>
                  <span className="text-[9px] text-ink-500">{developer.email}</span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-ink-850 px-3 py-2 text-sm text-ink-200 transition hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-4 py-5 md:px-6 md:py-6">
          <div key={view} className="animate-[fadeIn_0.3s_ease-out]">
            {view === 'stream' && (
              <LiveThreatStream
                rows={security.events}
                metrics={security.metrics}
                loading={security.loading}
                configured={security.configured}
                error={security.error}
              />
            )}
            {view === 'sandbox' && <DeveloperSandbox />}
            {view === 'keys' && <ApiKeyManager />}
            {view === 'telemetry' && (
              <ThreatTelemetry
                events={security.events}
                metrics={security.metrics}
                configured={security.configured}
              />
            )}
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
