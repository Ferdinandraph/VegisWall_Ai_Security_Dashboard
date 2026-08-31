import { useEffect, useMemo, useState } from 'react';
import { Copy, KeyRound, Plus, ShieldCheck } from 'lucide-react';
import { Panel } from './ui';
import { API_KEYS_STORAGE_KEY, generateNewApiKey, getStoredApiKeys, type ApiKeyConfig } from '../config/keys';

export function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKeyConfig[]>([]);
  const [name, setName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setKeys(getStoredApiKeys());
  }, []);

  const saveKeys = (nextKeys: ApiKeyConfig[]) => {
    setKeys(nextKeys);
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(nextKeys));
  };

  const handleCreate = () => {
    const created = generateNewApiKey(name.trim());
    const nextKeys = [created, ...keys];
    saveKeys(nextKeys);
    setName('');
  };

  const handleCopy = async (key: string, id: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1800);
  };

  const activeKey = useMemo(() => keys[0], [keys]);

  return (
    <Panel className="overflow-hidden border border-white/10 bg-ink-900/70">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-emerald" />
          <div>
            <div className="text-sm font-semibold text-white">Developer API Keys</div>
            <div className="text-[11px] text-ink-400">Generate and reuse keys for agent integrations</div>
          </div>
        </div>
        <div className="rounded-full border border-emerald/20 bg-emerald/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald">
          {keys.length} active
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="My agent key"
            className="flex-1 rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-white outline-none"
          />
          <button
            type="button"
            onClick={handleCreate}
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald px-3 py-2 text-sm font-semibold text-ink-950 transition hover:bg-emerald/90"
          >
            <Plus className="h-4 w-4" />
            Generate key
          </button>
        </div>

        {activeKey && (
          <div className="rounded-xl border border-emerald/20 bg-emerald/10 p-3">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-emerald">
              <ShieldCheck className="h-3.5 w-3.5" />
              Active key
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <code className="break-all rounded-lg bg-ink-950/80 px-2.5 py-2 font-mono text-[11px] text-ink-100">
                {activeKey.key}
              </code>
              <button
                type="button"
                onClick={() => handleCopy(activeKey.key, activeKey.id)}
                className="rounded-lg border border-white/10 bg-ink-900 px-2.5 py-2 text-[11px] text-ink-200 transition hover:text-white"
              >
                {copiedId === activeKey.id ? 'Copied' : <span className="flex items-center gap-1"><Copy className="h-3.5 w-3.5" /> Copy</span>}
              </button>
            </div>
            <div className="mt-2 text-[11px] text-ink-400">
              {activeKey.name} · {activeKey.tier === 'FREE_DEVELOPER' ? 'Sandbox' : 'Production'} · {new Date(activeKey.created).toLocaleDateString()}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {keys.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-ink-950/70 px-3 py-2.5">
              <div>
                <div className="text-sm font-medium text-white">{item.name}</div>
                <div className="text-[11px] text-ink-400">{item.tier === 'FREE_DEVELOPER' ? 'Sandbox tier' : 'Production tier'} · {new Date(item.created).toLocaleDateString()}</div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(item.key, item.id)}
                className="rounded-lg border border-white/10 bg-ink-900 px-2.5 py-2 text-[11px] text-ink-200 transition hover:text-white"
              >
                {copiedId === item.id ? 'Copied' : 'Copy'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
