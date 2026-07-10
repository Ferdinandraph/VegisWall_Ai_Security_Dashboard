import { useState } from 'react';
import { Play, RotateCcw, Terminal, ShieldCheck, ShieldAlert, CheckCircle2, Loader, Zap, Wallet, FileSignature, Receipt, ScanSearch, Gavel } from 'lucide-react';
import { SANDBOX_PRESETS, SANDBOX_STEPS } from '../data/mock';
import { Panel, Eyebrow, VerdictBadge } from './ui';
import { VectorBar } from './Charts';

type Phase = 'idle' | 'running' | 'done';
type StepStatus = 'pending' | 'active' | 'done';

const STEP_ICONS = [Zap, Wallet, FileSignature, ScanSearch, Gavel];

export function DeveloperSandbox() {
  const [text, setText] = useState(SANDBOX_PRESETS[0].text);
  const [phase, setPhase] = useState<Phase>('idle');
  const [stepIdx, setStepIdx] = useState(-1);
  const [steps, setSteps] = useState<StepStatus[]>(SANDBOX_STEPS.map(() => 'pending'));
  const [verdict, setVerdict] = useState<'SAFE' | 'ATTACK_SHIELDED' | null>(null);

  const isAttack = /ignore|disregard|override|bypass|dump|exfiltrat|system prompt|jailbreak|unrestricted|base64|SWdub3Jl/i.test(text);

  const execute = async () => {
    if (phase === 'running') return;
    setPhase('running');
    setVerdict(null);
    setSteps(SANDBOX_STEPS.map(() => 'pending'));
    setStepIdx(0);

    for (let i = 0; i < SANDBOX_STEPS.length; i++) {
      setStepIdx(i);
      setSteps((prev) => prev.map((s, idx) => (idx === i ? 'active' : s)));
      await new Promise((res) => setTimeout(res, 620 + Math.random() * 280));
      setSteps((prev) => prev.map((s, idx) => (idx === i ? 'done' : s)));
    }
    setStepIdx(-1);
    setVerdict(isAttack ? 'ATTACK_SHIELDED' : 'SAFE');
    setPhase('done');
  };

  const reset = () => {
    setPhase('idle');
    setVerdict(null);
    setSteps(SANDBOX_STEPS.map(() => 'pending'));
    setStepIdx(-1);
  };

  const attackVectors = {
    systemOverride: isAttack ? 91 : 8,
    dataLeakage: isAttack ? 86 : 6,
    promptInjection: isAttack ? 94 : 11,
    jailbreakAttempt: isAttack ? 73 : 5,
    toolAbuse: isAttack ? 64 : 9,
    credentialExfil: isAttack ? 88 : 7,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Interactive Developer Sandbox</h2>
          <p className="text-[12px] text-ink-400">Simulate requests against the Vegiswall guardrail and trace the x402 payment lifecycle.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-ink-850 px-3 py-1.5 text-[11px] text-ink-300 transition hover:text-ink-100"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
          <button
            onClick={execute}
            disabled={phase === 'running'}
            className="flex items-center gap-1.5 rounded-lg border border-emerald/40 bg-emerald/15 px-3.5 py-1.5 text-[11px] font-semibold text-emerald transition hover:bg-emerald/25 disabled:opacity-50"
          >
            {phase === 'running' ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Execute Security Scan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* LEFT: input + lifecycle */}
        <div className="space-y-4">
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-azure-glow" />
                <span className="text-[12px] font-semibold text-white">Simulate Malicious Request</span>
              </div>
              <span className="font-mono text-[10px] text-ink-400">{text.length} chars</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
              className="h-40 w-full resize-none bg-transparent px-4 py-3 font-mono text-[12px] leading-relaxed text-ink-100 placeholder:text-ink-500 focus:outline-none"
              placeholder="Enter a prompt to test against the guardrail…"
            />
          </Panel>

          {/* Presets */}
          <div>
            <Eyebrow className="mb-2">Quick Attack Vectors</Eyebrow>
            <div className="flex flex-wrap gap-2">
              {SANDBOX_PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => {
                    setText(p.text);
                    reset();
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-[11px] transition ${
                    p.isAttack
                      ? 'border-ruby/30 bg-ruby/5 text-ruby-glow hover:bg-ruby/15'
                      : 'border-emerald/30 bg-emerald/5 text-emerald hover:bg-emerald/15'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Lifecycle steps */}
          <Panel tight className="p-4">
            <Eyebrow className="mb-3">x402 Request Lifecycle</Eyebrow>
            <div className="space-y-2.5">
              {SANDBOX_STEPS.map((step, i) => {
                const status = steps[i];
                const Icon = STEP_ICONS[i] ?? Zap;
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-all ${
                      status === 'active'
                        ? 'border-azure/40 bg-azure/10'
                        : status === 'done'
                          ? 'border-emerald/20 bg-emerald/5'
                          : 'border-white/5 bg-ink-850'
                    }`}
                  >
                    <div
                      className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md ${
                        status === 'active'
                          ? 'bg-azure/20 text-azure-glow'
                          : status === 'done'
                            ? 'bg-emerald/20 text-emerald'
                            : 'bg-ink-800 text-ink-500'
                      }`}
                    >
                      {status === 'active' ? (
                        <Loader className="h-3.5 w-3.5 animate-spin" />
                      ) : status === 'done' ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <Icon className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`text-[12px] font-medium ${
                          status === 'active' ? 'text-azure-glow' : status === 'done' ? 'text-ink-100' : 'text-ink-400'
                        }`}
                      >
                        {step.label}
                      </span>
                      <span className="text-[10px] text-ink-500">{step.detail}</span>
                      {status === 'active' && (
                        <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-ink-800">
                          <div className="h-full w-1/3 animate-shimmer rounded-full bg-azure-glow" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* RIGHT: output */}
        <div className="space-y-4">
          <Panel className="relative min-h-[420px] overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald" />
                <span className="text-[12px] font-semibold text-white">Filtered Output Response</span>
              </div>
              {verdict && <VerdictBadge verdict={verdict} />}
            </div>

            <div className="p-4">
              {phase === 'idle' && (
                <div className="flex h-[360px] flex-col items-center justify-center text-center text-ink-500">
                  <Terminal className="mb-3 h-10 w-10 opacity-30" />
                  <p className="text-[12px]">Awaiting execution. Configure a request and run a security scan.</p>
                </div>
              )}

              {phase === 'running' && (
                <div className="flex h-[360px] flex-col items-center justify-center text-center">
                  <div className="relative mb-4 grid h-16 w-16 place-items-center">
                    <div className="absolute inset-0 animate-spinSlow rounded-full border-2 border-azure/20 border-t-azure-glow" />
                    <ShieldCheck className="h-7 w-7 text-azure-glow" />
                  </div>
                  <p className="text-[12px] font-medium text-azure-glow">{SANDBOX_STEPS[stepIdx >= 0 ? stepIdx : 0].label}</p>
                  <p className="mt-1 text-[10px] text-ink-400">tracing x402 settlement lifecycle…</p>
                </div>
              )}

              {phase === 'done' && verdict === 'ATTACK_SHIELDED' && (
                <div className="animate-rowEnterRuby space-y-4">
                  <div className="flex items-start gap-3 rounded-lg border border-ruby/40 bg-ruby/10 p-4 shadow-glow-ruby">
                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-ruby-glow" />
                    <div>
                      <div className="text-sm font-semibold text-ruby-glow">Request Shielded — Malicious Payload Detected</div>
                      <p className="mt-1 text-[11px] text-ink-200">
                        The guardrail intercepted a prompt injection attempt. Inference was blocked before any tool dispatch.
                        The x402 micropayment was still settled (facilitator fee captured), and an immutable receipt was
                        recorded for forensic audit.
                      </p>
                    </div>
                  </div>

                  <div>
                    <Eyebrow className="mb-2">Detected Risk Vectors</Eyebrow>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <VectorBar label="System Override" value={attackVectors.systemOverride} danger />
                      <VectorBar label="Data Leakage" value={attackVectors.dataLeakage} danger />
                      <VectorBar label="Prompt Injection" value={attackVectors.promptInjection} danger />
                      <VectorBar label="Jailbreak" value={attackVectors.jailbreakAttempt} danger />
                      <VectorBar label="Tool Abuse" value={attackVectors.toolAbuse} danger />
                      <VectorBar label="Credential Exfil" value={attackVectors.credentialExfil} danger />
                    </div>
                  </div>

                  <div className="code-window px-4 py-3">
                    <div className="mb-1 text-[10px] text-ink-500">// vegiswall.response</div>
                    <pre className="text-[11.5px] text-ruby-glow">{`{
  "status": 403,
  "verdict": "ATTACK_SHIELDED",
  "reason": "prompt_injection_detected",
  "tool_calls_blocked": 0,
  "receipt_settled": true,
  "fee": "0.005 USDC"
}`}</pre>
                  </div>
                </div>
              )}

              {phase === 'done' && verdict === 'SAFE' && (
                <div className="animate-rowEnter space-y-4">
                  <div className="flex items-start gap-3 rounded-lg border border-emerald/40 bg-emerald/10 p-4 shadow-glow-emerald">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald" />
                    <div>
                      <div className="text-sm font-semibold text-emerald">Verified — Safe Request Passed</div>
                      <p className="mt-1 text-[11px] text-ink-200">
                        No guardrail violations detected. The request was forwarded to the downstream agent, the x402
                        micropayment settled, and a receipt was anchored on Base mainnet.
                      </p>
                    </div>
                  </div>

                  <div>
                    <Eyebrow className="mb-2">Risk Profile (nominal)</Eyebrow>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <VectorBar label="System Override" value={attackVectors.systemOverride} />
                      <VectorBar label="Data Leakage" value={attackVectors.dataLeakage} />
                      <VectorBar label="Prompt Injection" value={attackVectors.promptInjection} />
                      <VectorBar label="Jailbreak" value={attackVectors.jailbreakAttempt} />
                    </div>
                  </div>

                  <div className="code-window px-4 py-3">
                    <div className="mb-1 text-[10px] text-ink-500">// vegiswall.response</div>
                    <pre className="text-[11.5px] text-emerald">{`{
  "status": 200,
  "verdict": "SAFE",
  "forwarded_to": "aeg-core-13b-secure",
  "receipt_settled": true,
  "fee": "0.005 USDC"
}`}</pre>
                  </div>
                </div>
              )}
            </div>
          </Panel>

          {/* Receipt mini */}
          {phase === 'done' && (
            <Panel tight className="flex items-center gap-3 p-4">
              <Receipt className="h-4 w-4 text-emerald" />
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-ink-100">x402 receipt anchored</span>
                <span className="font-mono text-[10px] text-ink-400">0x{Math.random().toString(16).slice(2, 18)}… · Base · block 2,984,127</span>
              </div>
              <span className="ml-auto font-mono text-[11px] text-emerald">+0.005 USDC</span>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
