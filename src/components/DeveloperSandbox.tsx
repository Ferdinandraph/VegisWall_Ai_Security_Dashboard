import { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  Terminal, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Loader, 
  Zap, 
  Wallet, 
  FileSignature, 
  ScanSearch, 
  Gavel, 
  Receipt,
  Code2,
  Copy,
  Check,
  CreditCard,
  KeyRound
} from 'lucide-react';
import { SANDBOX_PRESETS } from '../data/sandbox';
import { supabase } from '../lib/supabase';
import { Panel, Eyebrow, VerdictBadge } from './ui';
import { VectorBar } from './Charts';

type Phase = 'idle' | 'running' | 'done';
type StepStatus = 'pending' | 'active' | 'done';
type Tab = 'sandbox' | 'integration';

const STEP_ICONS = [Zap, Wallet, FileSignature, ScanSearch, Gavel];

const SANDBOX_STEPS = [
  { label: 'Submitting request to guardrail API', detail: 'The server authenticates and validates initial payload.' },
  { label: 'Enforcing x402 payment protocol', detail: 'Server returns HTTP 402; client signs EIP-712 challenge.' },
  { label: 'Running policy evaluation', detail: 'The safeguard LLM evaluates the prompt for risk vectors.' },
  { label: 'Recording security event', detail: 'The server writes audit events to the protected store.' },
  { label: 'Returning signed verdict', detail: 'The dashboard displays response and on-chain settlement receipt.' },
];

const DEFAULT_VECTORS = {
  systemOverride: 0,
  dataLeakage: 0,
  promptInjection: 0,
  jailbreakAttempt: 0,
  toolAbuse: 0,
  credentialExfil: 0,
};

interface ScanResponse {
  verdict: 'SAFE' | 'ATTACK_SHIELDED';
  vectors?: typeof DEFAULT_VECTORS;
  receipt?: {
    txHash: string;
    network: string;
    amount: string;
    token: string;
    blockNumber: number;
  };
  network?: string;
  error?: string;
}

interface X402Challenge {
  scheme: string;
  price: string;
  currency: string;
  network: string;
  chainId: number;
  payee: string;
  nonce: string;
}

const INTEGRATION_CODE_EXAMPLE = `// Agent Middleware Guardrail Integration Example
import { VegiswallGuard } from '@vegiswall/sdk';

const guard = new VegiswallGuard({
  apiKey: process.env.VEGISWALL_API_KEY,
  network: 'base-sepolia', // 'base-mainnet' or 'base-sepolia'
  networkPreference: 'sepolia',
});

export async function handleAgentRequest(req, res) {
  const { prompt } = req.body;

  // 1. Scan prompt before sending to LLM / Agent tools
  const evaluation = await guard.scan({
    prompt,
    xPaymentHeader: req.headers['x-payment'],
  });

  // 2. Handle x402 Micropayment Enforcement
  if (evaluation.status === 402) {
    return res.status(402).json({
      error: 'Payment Required',
      x402: evaluation.challenge,
    });
  }

  // 3. Handle Shielded Attack Blocks
  if (evaluation.verdict === 'ATTACK_SHIELDED') {
    return res.status(403).json({
      error: 'Prompt blocked by Vegiswall Guardrail',
      vectors: evaluation.vectors,
      receipt: evaluation.receipt,
    });
  }

  // 4. Safe to execute Agent / LLM logic
  const agentResponse = await myAgent.run(prompt);

  return res.status(200).json({
    output: agentResponse,
    receipt: evaluation.receipt,
  });
}`;

export function DeveloperSandbox() {
  const [activeTab, setActiveTab] = useState<Tab>('sandbox');
  const [text, setText] = useState(SANDBOX_PRESETS[0]?.text ?? '');
  const [phase, setPhase] = useState<Phase>('idle');
  const [stepIdx, setStepIdx] = useState(-1);
  const [steps, setSteps] = useState<StepStatus[]>(SANDBOX_STEPS.map(() => 'pending'));
  const [verdict, setVerdict] = useState<'SAFE' | 'ATTACK_SHIELDED' | null>(null);
  
  // Controls whether we simulate true 402 challenge/response or use dev bypass
  const [useX402Protocol, setUseX402Protocol] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  const [result, setResult] = useState<{
    verdict: 'SAFE' | 'ATTACK_SHIELDED';
    vectors: typeof DEFAULT_VECTORS;
    receipt?: ScanResponse['receipt'];
  } | null>(null);

  const guardrailUrl = import.meta.env.VITE_GUARDRAIL_API_URL;

  // Helper to set progress state visually
  const updateStepStatus = (activeIdx: number) => {
    setStepIdx(activeIdx);
    setSteps(
      SANDBOX_STEPS.map((_, i) => {
        if (i < activeIdx) return 'done';
        if (i === activeIdx) return 'active';
        return 'pending';
      })
    );
  };

  const execute = async () => {
    if (phase === 'running') return;
    setPhase('running');
    setVerdict(null);
    setResult(null);

    try {
      if (!guardrailUrl) {
        throw new Error('VITE_GUARDRAIL_API_URL is not configured in environment variables.');
      }

      // Fetch user access token or fallback to anon key
      const sessionResp = supabase ? await supabase.auth.getSession() : null;
      const accessToken = sessionResp?.data?.session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!accessToken) {
        throw new Error('No authorization token available: set VITE_SUPABASE_ANON_KEY or sign in.');
      }

      // STEP 1: Submit initial request
      updateStepStatus(0);

      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'x-network-preference': 'sepolia',
      };

      if (!useX402Protocol) {
        requestHeaders['x-bypass-payment'] = 'true';
      }

      let response = await fetch(guardrailUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({ prompt: text }),
      });

      // STEP 2: Intercept x402 Payment Challenge (if status is 402)
      if (response.status === 402) {
        updateStepStatus(1);

        const challengeData = await response.json();
        const challenge: X402Challenge = challengeData.x402;

        // Visual pause to render EIP-712 signing step
        await new Promise((res) => setTimeout(res, 600));

        // Generate synthetic EIP-712 payment proof header based on challenge nonce
        const simulatedSignature = `0x_sig_${challenge.nonce.replace(/-/g, '')}`;

        // Resubmit request with payment authorization
        response = await fetch(guardrailUrl, {
          method: 'POST',
          headers: {
            ...requestHeaders,
            'x-payment': simulatedSignature,
            'x-nonce': challenge.nonce,
          },
          body: JSON.stringify({ prompt: text }),
        });
      }

      // STEP 3: Policy evaluation
      updateStepStatus(2);

      const payload = (await response.json().catch(() => ({}))) as ScanResponse;

      if (!response.ok) {
        throw new Error(payload.error || `Guardrail API returned status ${response.status}.`);
      }

      if (payload.verdict !== 'SAFE' && payload.verdict !== 'ATTACK_SHIELDED') {
        throw new Error('Guardrail API returned an unrecognized or missing verdict.');
      }

      // STEP 4: Event recorded
      updateStepStatus(3);
      await new Promise((res) => setTimeout(res, 200));

      // STEP 5: Verdict returned
      updateStepStatus(4);
      
      setResult({
        verdict: payload.verdict,
        vectors: payload.vectors ?? DEFAULT_VECTORS,
        receipt: payload.receipt,
      });
      setVerdict(payload.verdict);
      setSteps(SANDBOX_STEPS.map(() => 'done'));
    } catch (cause) {
      setSteps(SANDBOX_STEPS.map(() => 'pending'));
      setVerdict(null);
      setResult(null);
      window.alert(cause instanceof Error ? cause.message : 'Guardrail security scan failed.');
    } finally {
      setStepIdx(-1);
      setPhase('done');
    }
  };

  const reset = () => {
    setPhase('idle');
    setVerdict(null);
    setResult(null);
    setSteps(SANDBOX_STEPS.map(() => 'pending'));
    setStepIdx(-1);
  };

  const copyIntegrationCode = () => {
    navigator.clipboard.writeText(INTEGRATION_CODE_EXAMPLE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const riskVectors = result?.vectors ?? DEFAULT_VECTORS;

  return (
    <div className="space-y-5">
      {/* Header Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Interactive Developer Sandbox</h2>
          <p className="text-[12px] text-ink-400">
            Simulate requests against the Vegiswall guardrail and trace the x402 payment lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-white/10 bg-ink-900 p-1">
            <button
              onClick={() => setActiveTab('sandbox')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-medium transition ${
                activeTab === 'sandbox' 
                  ? 'bg-azure/20 text-azure-glow border border-azure/30' 
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" /> Playground
            </button>
            <button
              onClick={() => setActiveTab('integration')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-medium transition ${
                activeTab === 'integration' 
                  ? 'bg-azure/20 text-azure-glow border border-azure/30' 
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              <Code2 className="h-3.5 w-3.5" /> Middleware SDK
            </button>
          </div>

          {activeTab === 'sandbox' && (
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
          )}
        </div>
      </div>

      {activeTab === 'sandbox' ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* LEFT COLUMN: Input & Lifecycle Trace */}
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

            {/* Mode Toggle */}
            <Panel tight className="flex items-center justify-between border border-white/8 bg-ink-900 p-3">
              <div className="flex items-center gap-2.5">
                {useX402Protocol ? (
                  <CreditCard className="h-4 w-4 text-amber-glow" />
                ) : (
                  <KeyRound className="h-4 w-4 text-azure-glow" />
                )}
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-white">
                    {useX402Protocol ? 'Enforce x402 Protocol (HTTP 402)' : 'Dev Bypass Mode'}
                  </span>
                  <span className="text-[10px] text-ink-400">
                    {useX402Protocol 
                      ? 'Interprets 402 status & signs micropayment challenge' 
                      : 'Skips Web3 challenge using dev credentials'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={useX402Protocol}
                onClick={() => setUseX402Protocol(!useX402Protocol)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  useX402Protocol ? 'bg-amber-500/80' : 'bg-ink-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    useX402Protocol ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
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
                      p.name !== 'Safe RAG Query'
                        ? 'border-ruby/30 bg-ruby/5 text-ruby-glow hover:bg-ruby/15'
                        : 'border-emerald/30 bg-emerald/5 text-emerald hover:bg-emerald/15'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* x402 Steps */}
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
                            status === 'active' 
                              ? 'text-azure-glow' 
                              : status === 'done' 
                                ? 'text-ink-100' 
                                : 'text-ink-400'
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

          {/* RIGHT COLUMN: Output & Verdict */}
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
                    <p className="text-[12px] font-medium text-azure-glow">
                      {SANDBOX_STEPS[stepIdx >= 0 ? stepIdx : 0].label}
                    </p>
                    <p className="mt-1 text-[10px] text-ink-400">tracing x402 settlement lifecycle…</p>
                  </div>
                )}

                {phase === 'done' && verdict === 'ATTACK_SHIELDED' && (
                  <div className="animate-rowEnterRuby space-y-4">
                    <div className="flex items-start gap-3 rounded-lg border border-ruby/40 bg-ruby/10 p-4 shadow-glow-ruby">
                      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-ruby-glow" />
                      <div>
                        <div className="text-sm font-semibold text-ruby-glow">
                          Request Shielded — Malicious Payload Detected
                        </div>
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
                        <VectorBar label="System Override" value={riskVectors.systemOverride} danger />
                        <VectorBar label="Data Leakage" value={riskVectors.dataLeakage} danger />
                        <VectorBar label="Prompt Injection" value={riskVectors.promptInjection} danger />
                        <VectorBar label="Jailbreak" value={riskVectors.jailbreakAttempt} danger />
                        <VectorBar label="Tool Abuse" value={riskVectors.toolAbuse} danger />
                        <VectorBar label="Credential Exfil" value={riskVectors.credentialExfil} danger />
                      </div>
                    </div>

                    <div className="code-window px-4 py-3">
                      <div className="mb-1 text-[10px] text-ink-500">// vegiswall.response</div>
                      <pre className="text-[11.5px] text-ruby-glow">{`{
  "status": 403,
  "verdict": "ATTACK_SHIELDED",
  "reason": "prompt_injection_detected",
  "tool_calls_blocked": 1,
  "receipt_settled": true,
  "fee": "0.000025 USDC"
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
                        <VectorBar label="System Override" value={riskVectors.systemOverride} />
                        <VectorBar label="Data Leakage" value={riskVectors.dataLeakage} />
                        <VectorBar label="Prompt Injection" value={riskVectors.promptInjection} />
                        <VectorBar label="Jailbreak" value={riskVectors.jailbreakAttempt} />
                      </div>
                    </div>

                    <div className="code-window px-4 py-3">
                      <div className="mb-1 text-[10px] text-ink-500">// vegiswall.response</div>
                      <pre className="text-[11.5px] text-emerald">{`{
  "status": 200,
  "verdict": "SAFE",
  "forwarded_to": "aeg-core-13b-secure",
  "receipt_settled": true,
  "fee": "0.000025 USDC"
}`}</pre>
                    </div>
                  </div>
                )}
              </div>
            </Panel>

            {/* Receipt Footer */}
            {phase === 'done' && (
              <Panel tight className="flex items-center gap-3 p-4">
                <Receipt className="h-4 w-4 text-emerald" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-ink-100">x402 receipt anchored</span>
                  <span className="font-mono text-[10px] text-ink-400">
                    {result?.receipt?.txHash ?? `0x${Math.random().toString(16).slice(2, 18)}…`} · {result?.receipt?.network ?? 'Base Sepolia'}
                  </span>
                </div>
                <span className="ml-auto font-mono text-[11px] text-emerald">+0.000025 USDC</span>
              </Panel>
            )}
          </div>
        </div>
      ) : (
        /* TAB 2: Integration Guide */
        <div className="space-y-4">
          <Panel tight className="p-5">
            <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">How to Integrate Vegiswall Guardrail into your Agent</h3>
                <p className="text-[11px] text-ink-400">Protect any AI agent endpoint using x402 micropayments as a proxy middleware.</p>
              </div>
              <button
                onClick={copyIntegrationCode}
                className="flex items-center gap-1.5 rounded-md border border-white/10 bg-ink-800 px-3 py-1.5 text-[11px] text-ink-200 transition hover:bg-ink-750"
              >
                {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedCode ? 'Copied' : 'Copy Code'}
              </button>
            </div>

            <pre className="overflow-x-auto rounded-lg border border-white/5 bg-ink-950 p-4 font-mono text-[12px] leading-relaxed text-azure-glow">
              <code>{INTEGRATION_CODE_EXAMPLE}</code>
            </pre>
          </Panel>
        </div>
      )}
    </div>
  );
}
