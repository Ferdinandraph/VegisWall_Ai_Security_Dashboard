// config/keys.ts
export interface ApiKeyConfig {
  id: string;
  key: string;
  name: string;
  tier: 'FREE_DEVELOPER' | 'PRODUCTION_PRO';
  created: string;
}

export const DEFAULT_SANDBOX_KEY: ApiKeyConfig = {
  id: 'key_sbx_01',
  key: 'vw_test_8f93e1a04bc920f18a',
  name: 'Default Sandbox Key',
  tier: 'FREE_DEVELOPER',
  created: new Date().toISOString(),
};

export const API_KEYS_STORAGE_KEY = 'vegiswall_api_keys_v1';

export function getStoredApiKeys(): ApiKeyConfig[] {
  if (typeof window === 'undefined') return [DEFAULT_SANDBOX_KEY];
  const saved = localStorage.getItem(API_KEYS_STORAGE_KEY);
  if (!saved) return [DEFAULT_SANDBOX_KEY];
  try {
    return JSON.parse(saved);
  } catch {
    return [DEFAULT_SANDBOX_KEY];
  }
}

export function generateNewApiKey(name: string): ApiKeyConfig {
  const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  
  return {
    id: `key_${Date.now()}`,
    key: `vw_live_${randomHex}`,
    name: name || 'Agent API Key',
    tier: 'PRODUCTION_PRO',
    created: new Date().toISOString(),
  };
}