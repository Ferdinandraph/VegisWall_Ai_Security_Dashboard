import type { ReactNode } from 'react';

export function Panel({
  children,
  className = '',
  tight = false,
}: {
  children: ReactNode;
  className?: string;
  tight?: boolean;
}) {
  return <div className={`${tight ? 'panel-tight' : 'panel'} ${className}`}>{children}</div>;
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`eyebrow ${className}`}>{children}</div>;
}

export function VerdictBadge({ verdict }: { verdict: 'SAFE' | 'ATTACK_SHIELDED' }) {
  if (verdict === 'SAFE') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald/40 bg-emerald/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald animate-pulseEmerald" />
        SAFE
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-ruby/50 bg-ruby/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-ruby-glow animate-pulseRuby">
      <span className="h-1.5 w-1.5 rounded-full bg-ruby" />
      ATTACK SHIELDED
    </span>
  );
}

export function FlowBadge({ state }: { state: string }) {
  const steps = ['402 CHALLENGE', 'SIGNED', 'SETTLED', '200 OK'];
  const idx = steps.indexOf(state);
  return (
    <div className="flex items-center gap-1 font-mono text-[10px]">
      {steps.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <span key={s} className="flex items-center gap-1">
            <span
              className={
                done
                  ? 'text-emerald'
                  : active
                    ? 'text-azure-glow'
                    : 'text-ink-500'
              }
            >
              {s}
            </span>
            {i < steps.length - 1 && <span className={i < idx ? 'text-emerald/60' : 'text-ink-600'}>→</span>}
          </span>
        );
      })}
    </div>
  );
}

export function StatPill({ label, value, accent = 'emerald' }: { label: string; value: string; accent?: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald',
    amber: 'text-amber-glow',
    ruby: 'text-ruby-glow',
    azure: 'text-azure-glow',
  };
  return (
    <div className="flex flex-col">
      <span className="eyebrow">{label}</span>
      <span className={`font-mono text-lg font-semibold ${colorMap[accent]}`}>{value}</span>
    </div>
  );
}

export function CopyableMono({ children, className = '' }: { children: string; className?: string }) {
  return (
    <span className={`font-mono ${className}`}>
      {children}
    </span>
  );
}
