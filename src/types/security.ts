export type Verdict = 'SAFE' | 'ATTACK_SHIELDED';
export type FlowState = '402 CHALLENGE' | 'SIGNED' | 'SETTLED' | '200 OK';

export interface SecurityVectors {
  systemOverride: number;
  dataLeakage: number;
  promptInjection: number;
  jailbreakAttempt: number;
  toolAbuse: number;
  credentialExfil: number;
}

export interface X402Receipt {
  txHash: string;
  chainId: number;
  network: string;
  settlementStatus: 'SETTLED' | 'PENDING' | 'FAILED';
  signature: string;
  payer: string;
  payee: string;
  amount: string;
  token: string;
  blockNumber: number;
  gasUsed: string;
  timestamp: string;
  challengeNonce: string;
  scheme: string;
}

export interface ThreatRow {
  id: string;
  timestamp: string;
  epoch: number;
  agentKey: string;
  fullKey: string;
  flow: FlowState;
  fee: number;
  verdict: Verdict;
  prompt: string;
  maliciousBlock: string;
  vectors: SecurityVectors;
  receipt: X402Receipt;
  model: string;
  endpoint: string;
  ip: string;
  geo: string;
  latencyMs: number | null;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalScans: number;
  blockedAttacks: number;
  averageLatencyMs: number | null;
}

export const emptyMetrics: DashboardMetrics = {
  totalRevenue: 0,
  totalScans: 0,
  blockedAttacks: 0,
  averageLatencyMs: null,
};
