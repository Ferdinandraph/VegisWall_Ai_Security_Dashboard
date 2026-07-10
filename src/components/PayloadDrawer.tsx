import { X, ShieldAlert, Fingerprint, Network, Globe, Cpu, Hash, FileJson, CheckCircle2 } from 'lucide-react';
import type { ThreatRow } from '../data/mock';
import { Panel, Eyebrow, VerdictBadge } from './ui';
import { RadarChart, VectorBar } from './Charts';
import { useState } from 'react';

function KV({ k, v, mono = true }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 py-1.5 text-[11px] last:border-0">
      <span className="text-ink-400">{k}</span>
      <span className={`text-right text-ink-100 ${mono ? 'font-mono' : ''}`}>{v}</span>
    </div>
  );
}

function HighlightedPrompt({ prompt, block }: { prompt: string; block: string }) {
  if (!block) {
    return <pre className="whitespace-pre-wrap break-words text-ink-200">{prompt}</pre>;
  }
  const idx = prompt.indexOf(block);
  if (idx === -1) return <pre className="whitespace-pre-wrap break-words text-ink-200">{prompt}</pre>;
  const before = prompt.slice(0, idx);
  const after = prompt.slice(idx + block.length);
  return (
    <pre className="whitespace-pre-wrap break-words text-ink-200">
      {before}
      <span className="payload-highlight">{block}</span>
      {after}
    </pre>
  );
}

export function PayloadDrawer({ row, onClose }: { row: ThreatRow; onClose: () => void }) {
  const [tab, setTab] = useState<'payload' | 'vectors' | 'receipt'>('payload');
  const isAttack = row.verdict === 'ATTACK_SHIELDED';

  const radarVectors = [
    { label: 'SYS OVERRIDE', value: row.vectors.systemOverride },
    { label: 'DATA LEAK', value: row.vectors.dataLeakage },
    { label: 'INJECTION', value: row.vectors.promptInjection },
    { label: 'JAILBREAK', value: row.vectors.jailbreakAttempt },
    { label: 'TOOL ABUSE', value: row.vectors.toolAbuse },
    { label: 'CRED EXFIL', value: row.vectors.credentialExfil },
  ];

  const receiptJson = JSON.stringify(
    {
      scheme: row.receipt.scheme,
      network: row.receipt.network,
      chainId: row.receipt.chainId,
      txHash: row.receipt.txHash,
      settlementStatus: row.receipt.settlementStatus,
      payment: {
        amount: row.receipt.amount,
        token: row.receipt.token,
        payer: row.receipt.payer,
        payee: row.receipt.payee,
      },
      blockNumber: row.receipt.blockNumber,
      gasUsed: row.receipt.gasUsed,
      challengeNonce: row.receipt.challengeNonce,
      signature: row.receipt.signature,
      timestamp: row.receipt.timestamp,
    },
    null,
    2,
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="drawerOverlay absolute inset-0" onClick={onClose} />
      <div className="relative h-full w-full max-w-[560px] animate-slideInRight overflow-y-auto border-l border-white/10 bg-ink-900/95 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/8 bg-ink-900/90 px-5 py-4 backdrop-blur-xl">
          <div className={`grid h-9 w-9 place-items-center rounded-lg ${isAttack ? 'bg-ruby/15 text-ruby' : 'bg-emerald/15 text-emerald'}`}>
            <ShieldAlert className="h-4.5 w-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">Attack Payload Inspector</span>
            <span className="font-mono text-[10px] text-ink-400">{row.id}</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <VerdictBadge verdict={row.verdict} />
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-800 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Meta strip */}
        <div className="grid grid-cols-2 gap-px border-b border-white/8 bg-white/5">
          {[
            { icon: Fingerprint, k: 'Agent Key', v: row.fullKey },
            { icon: Network, k: 'Endpoint', v: row.endpoint },
            { icon: Globe, k: 'Origin', v: `${row.ip} · ${row.geo}` },
            { icon: Cpu, k: 'Model', v: row.model },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.k} className="bg-ink-900 px-5 py-3">
                <div className="flex items-center gap-1.5 text-ink-400">
                  <Icon className="h-3 w-3" />
                  <span className="eyebrow">{m.k}</span>
                </div>
                <div className="mt-0.5 truncate font-mono text-[11px] text-ink-100">{m.v}</div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="sticky top-[73px] z-10 flex gap-1 border-b border-white/8 bg-ink-900/90 px-5 py-2 backdrop-blur-xl">
          {(['payload', 'vectors', 'receipt'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide transition ${
                tab === t ? 'bg-ink-700 text-white' : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              {t === 'payload' ? 'Payload' : t === 'vectors' ? 'Security Vectors' : 'x402 Receipt'}
            </button>
          ))}
        </div>

        <div className="px-5 py-5">
          {tab === 'payload' && (
            <div className="space-y-4">
              <Panel tight className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
                  <Eyebrow>Intercepted Prompt</Eyebrow>
                  <span className="font-mono text-[10px] text-ink-400">{row.prompt.length} chars</span>
                </div>
                <div className="code-window max-h-[340px] overflow-auto px-4 py-3">
                  <HighlightedPrompt prompt={row.prompt} block={row.maliciousBlock} />
                </div>
              </Panel>
              {isAttack && (
                <div className="flex items-start gap-2 rounded-lg border border-ruby/30 bg-ruby/5 px-3 py-2.5 text-[11px] text-ruby-glow">
                  <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Malicious payload block isolated at offset {row.prompt.indexOf(row.maliciousBlock)}. Request quarantined
                    before model inference. No tool calls dispatched.
                  </span>
                </div>
              )}
            </div>
          )}

          {tab === 'vectors' && (
            <div className="space-y-4">
              <Panel tight className="p-4">
                <Eyebrow className="mb-3">Threat Vector Radar</Eyebrow>
                <div className="flex justify-center">
                  <RadarChart vectors={radarVectors} />
                </div>
              </Panel>
              <Panel tight className="p-4">
                <Eyebrow className="mb-3">Vector Breakdown</Eyebrow>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <VectorBar label="System Override Certainty" value={row.vectors.systemOverride} danger={isAttack} />
                  <VectorBar label="Data Leakage Risk" value={row.vectors.dataLeakage} danger={isAttack} />
                  <VectorBar label="Prompt Injection" value={row.vectors.promptInjection} danger={isAttack} />
                  <VectorBar label="Jailbreak Attempt" value={row.vectors.jailbreakAttempt} danger={isAttack} />
                  <VectorBar label="Tool Abuse" value={row.vectors.toolAbuse} danger={isAttack} />
                  <VectorBar label="Credential Exfiltration" value={row.vectors.credentialExfil} danger={isAttack} />
                </div>
              </Panel>
            </div>
          )}

          {tab === 'receipt' && (
            <div className="space-y-4">
              <Panel tight className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald" />
                  <span className="text-xs font-semibold text-white">x402 Transaction Receipt</span>
                  <span className="ml-auto rounded-md border border-emerald/30 bg-emerald/10 px-2 py-0.5 text-[10px] font-semibold text-emerald">
                    SETTLED
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                  <KV k="Tx Hash" v={row.receipt.txHash.slice(0, 18) + '…'} />
                  <KV k="Network" v={row.receipt.network} />
                  <KV k="Chain ID" v={String(row.receipt.chainId)} />
                  <KV k="Block" v={row.receipt.blockNumber.toLocaleString()} />
                  <KV k="Amount" v={`${row.receipt.amount} ${row.receipt.token}`} />
                  <KV k="Gas Used" v={row.receipt.gasUsed} />
                  <KV k="Payer" v={row.receipt.payer.slice(0, 14) + '…'} />
                  <KV k="Payee" v={row.receipt.payee} />
                  <KV k="Scheme" v={row.receipt.scheme} />
                  <KV k="Nonce" v={row.receipt.challengeNonce.slice(0, 14) + '…'} />
                </div>
              </Panel>

              <Panel tight className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
                  <Eyebrow>Cryptographic Receipt (immutable)</Eyebrow>
                  <FileJson className="h-3.5 w-3.5 text-ink-400" />
                </div>
                <div className="code-window max-h-[300px] overflow-auto px-4 py-3">
                  <SyntaxJson json={receiptJson} />
                </div>
              </Panel>

              <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-ink-850 px-3 py-2 text-[10px] text-ink-400">
                <Hash className="h-3 w-3" />
                <span>Receipt anchored on-chain · verifiable via facilitator attestation</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SyntaxJson({ json }: { json: string }) {
  const lines = json.split('\n');
  return (
    <pre className="text-[11.5px] leading-relaxed">
      {lines.map((line, i) => {
        const colored = line
          .replace(/"([^"]+)":/g, '<span style="color:#7c8699">"$1"</span>:')
          .replace(/: "([^"]+)"/g, ': <span style="color:#10e07a">"$1"</span>')
          .replace(/: (\d+)/g, ': <span style="color:#ffb627">$1</span>')
          .replace(/: (true|false|null)/g, ': <span style="color:#1ea8e8">$1</span>');
        return (
          <div key={i} className="flex">
            <span className="mr-3 w-6 select-none text-right text-ink-600">{i + 1}</span>
            <span dangerouslySetInnerHTML={{ __html: colored }} />
          </div>
        );
      })}
    </pre>
  );
}
