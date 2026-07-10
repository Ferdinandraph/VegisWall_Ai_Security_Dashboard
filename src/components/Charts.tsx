import { useEffect, useState } from 'react';

// ---- Animated number ticker --------------------------------------------------
export function AnimatedNumber({
  value,
  format,
  className = '',
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    let raf = 0;
    const start = display;
    const end = value;
    const duration = 600;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(start + (end - start) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span className={className}>{format(display)}</span>;
}

// ---- Line chart (latency over time) -----------------------------------------
export function LineChart({
  data,
  height = 200,
  color = '#10e07a',
  secondaryColor = '#1ea8e8',
}: {
  data: { latency: number; p99: number; label: string }[];
  height?: number;
  color?: string;
  secondaryColor?: string;
}) {
  const w = 760;
  const h = height;
  const pad = { l: 36, r: 12, t: 14, b: 22 };
  const max = Math.max(...data.map((d) => d.p99)) * 1.15;
  const min = 0;
  const x = (i: number) => pad.l + (i / (data.length - 1)) * (w - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - min) / (max - min)) * (h - pad.t - pad.b);

  const linePath = (key: 'latency' | 'p99') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d[key]).toFixed(1)}`).join(' ');
  const areaPath = `${linePath('latency')} L ${x(data.length - 1)} ${h - pad.b} L ${x(0)} ${h - pad.b} Z`;

  const gridY = [0, 0.25, 0.5, 0.75, 1].map((p) => pad.t + p * (h - pad.t - pad.b));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="latArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridY.map((gy, i) => (
        <line key={i} x1={pad.l} y1={gy} x2={w - pad.r} y2={gy} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      <path d={areaPath} fill="url(#latArea)" />
      <path d={linePath('p99')} fill="none" stroke={secondaryColor} strokeWidth="1.4" strokeDasharray="4 4" opacity="0.7">
        <animate attributeName="stroke-dashoffset" from="200" to="0" dur="1.4s" fill="freeze" />
      </path>
      <path d={linePath('latency')} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
        <animate attributeName="stroke-dasharray" from="0 2000" to="2000 0" dur="1.2s" fill="freeze" />
      </path>
      {data.map((d, i) =>
        i % 6 === 0 ? (
          <text key={i} x={x(i)} y={h - 6} fontSize="9" fill="#5a6478" fontFamily="JetBrains Mono" textAnchor="middle">
            {d.label}
          </text>
        ) : null
      )}
      {[0, 0.5, 1].map((p, i) => (
        <text key={i} x={6} y={pad.t + p * (h - pad.t - pad.b) + 3} fontSize="9" fill="#5a6478" fontFamily="JetBrains Mono">
          {Math.round(max - p * (max - min))}
        </text>
      ))}
    </svg>
  );
}

// ---- Doughnut chart (attack vector profile) ---------------------------------
export function DoughnutChart({
  data,
  size = 240,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = size / 2 - 18;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14" />
        {data.map((d, i) => {
          const frac = d.value / total;
          const dash = frac * circumference;
          const seg = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              strokeLinecap="butt"
              style={{ filter: `drop-shadow(0 0 4px ${d.color}55)` }}
            >
              <animate attributeName="stroke-dasharray" from={`0 ${circumference}`} to={`${dash} ${circumference - dash}`} dur="0.9s" fill="freeze" />
            </circle>
          );
          offset += dash;
          return seg;
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="700" fill="#cdd4e2" fontFamily="Space Grotesk">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="#5a6478" fontFamily="JetBrains Mono" letterSpacing="1">
          TOTAL EVENTS
        </text>
      </svg>
      <div className="flex flex-col gap-2">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2.5 text-xs">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color, boxShadow: `0 0 8px ${d.color}88` }} />
            <span className="text-ink-200">{d.label}</span>
            <span className="ml-auto font-mono text-ink-300">
              {d.value} <span className="text-ink-400">({Math.round((d.value / total) * 100)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Bar chart (volume by agent key) ---------------------------------------
export function BarChart({
  data,
  height = 240,
}: {
  data: { key: string; full: string; safe: number; blocked: number }[];
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.safe + d.blocked));
  return (
    <div className="flex flex-col gap-3" style={{ minHeight: height }}>
      {data.map((d) => {
        const total = d.safe + d.blocked;
        const safePct = (d.safe / max) * 100;
        const blockedPct = (d.blocked / max) * 100;
        return (
          <div key={d.full} className="group">
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="font-mono text-ink-200">{d.key}</span>
              <span className="font-mono text-ink-400">
                {total.toLocaleString()} <span className="text-emerald">·{d.safe}</span>{' '}
                <span className="text-ruby">·{d.blocked}</span>
              </span>
            </div>
            <div className="flex h-3 items-center gap-0.5 overflow-hidden rounded-sm bg-ink-850">
              <div
                className="h-full rounded-l-sm bg-emerald/70 transition-all duration-700 group-hover:bg-emerald"
                style={{ width: `${safePct}%`, boxShadow: '0 0 8px rgba(16,224,122,0.4)' }}
              />
              <div
                className="h-full rounded-r-sm bg-ruby/70 transition-all duration-700 group-hover:bg-ruby"
                style={{ width: `${blockedPct}%`, boxShadow: '0 0 8px rgba(239,43,72,0.4)' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Radar chart (security vectors) ---------------------------------------
export function RadarChart({
  vectors,
  size = 260,
}: {
  vectors: { label: string; value: number }[];
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 34;
  const n = vectors.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, v: number) => {
    const rr = (v / 100) * r;
    return [cx + Math.cos(angle(i)) * rr, cy + Math.sin(angle(i)) * rr];
  };
  const polyPoints = vectors.map((v, i) => point(i, v.value).join(',')).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      {[0.25, 0.5, 0.75, 1].map((p, i) => (
        <polygon
          key={i}
          points={vectors.map((_, j) => point(j, p * 100).join(',')).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}
      {vectors.map((_, i) => {
        const [px, py] = point(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={px} y2={py} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
      })}
      <polygon points={polyPoints} fill="rgba(239,43,72,0.18)" stroke="#ef2b48" strokeWidth="1.6">
        <animate attributeName="opacity" from="0" to="1" dur="0.8s" fill="freeze" />
      </polygon>
      {vectors.map((v, i) => {
        const [px, py] = point(i, v.value);
        return <circle key={i} cx={px} cy={py} r="3" fill="#ef2b48" style={{ filter: 'drop-shadow(0 0 4px #ef2b48)' }} />;
      })}
      {vectors.map((v, i) => {
        const [lx, ly] = point(i, 122);
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            fontSize="8.5"
            fill="#7c8699"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {v.label}
          </text>
        );
      })}
    </svg>
  );
}

// ---- Progress bar (vector metric) ------------------------------------------
export function VectorBar({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  const color = danger ? '#ef2b48' : '#10e07a';
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-ink-200">{label}</span>
        <span className="font-mono" style={{ color }}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-ink-850">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: color, boxShadow: `0 0 8px ${color}aa` }}
        />
      </div>
    </div>
  );
}
