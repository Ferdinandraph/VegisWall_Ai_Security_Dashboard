import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { emptyMetrics, type DashboardMetrics, type SecurityVectors, type ThreatRow, type X402Receipt } from '../types/security';

type EventRecord = { 
  id: string; 
  created_at: string; 
  developer_id?: string; // Added developer_id
  agent_key: string; 
  flow: ThreatRow['flow']; 
  fee_usdc: number; 
  verdict: ThreatRow['verdict']; 
  prompt: string; 
  malicious_block: string | null; 
  vectors: SecurityVectors; 
  receipt: X402Receipt; 
  model: string; 
  endpoint: string; 
  source_ip: string; 
  geo: string; 
  latency_ms: number | null 
};

const shortKey = (key: string) => `${key.slice(0, 5)}...${key.slice(-3)}`;

export const formatUsd = (value: number, decimals = 5) => `$${value.toFixed(decimals)}`;

export function timeAgo(epoch: number) { 
  const seconds = Math.floor((Date.now() - epoch) / 1000); 
  return seconds < 1 ? 'just now' : seconds < 60 ? `${seconds}s ago` : `${Math.floor(seconds / 60)}m ${seconds % 60}s ago`; 
}

function toThreatRow(event: EventRecord): ThreatRow { 
  return { 
    id: event.id, 
    timestamp: event.created_at, 
    epoch: new Date(event.created_at).getTime(), 
    agentKey: shortKey(event.agent_key), 
    fullKey: event.agent_key, 
    flow: event.flow, 
    fee: Number(event.fee_usdc), 
    verdict: event.verdict, 
    prompt: event.prompt, 
    maliciousBlock: event.malicious_block ?? '', 
    vectors: event.vectors, 
    receipt: event.receipt, 
    model: event.model, 
    endpoint: event.endpoint, 
    ip: event.source_ip, 
    geo: event.geo, 
    latencyMs: event.latency_ms 
  }; 
}

export async function fetchThreatEvents(limit = 80): Promise<ThreatRow[]> { 
  if (!supabase) return []; 
  // RLS automatically filters results where developer_id = auth.uid()
  const { data, error } = await supabase.from('security_events').select('*').order('created_at', { ascending: false }).limit(limit); 
  if (error) throw error; 
  return (data as EventRecord[]).map(toThreatRow); 
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> { 
  if (!supabase) return emptyMetrics; 
  const { data, error } = await supabase.rpc('get_security_dashboard_metrics'); 
  if (error) throw error; 
  const metrics = Array.isArray(data) ? data[0] : data; 
  return { 
    totalRevenue: Number(metrics?.total_revenue ?? 0), 
    totalScans: Number(metrics?.total_scans ?? 0), 
    blockedAttacks: Number(metrics?.blocked_attacks ?? 0), 
    averageLatencyMs: metrics?.average_latency_ms === null ? null : Number(metrics?.average_latency_ms ?? 0) 
  }; 
}

export function subscribeToThreatEvents(onInsert: (event: ThreatRow) => void): RealtimeChannel | null { 
  if (!supabase) return null; 
  return supabase.channel('security-events').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'security_events' }, (payload) => onInsert(toThreatRow(payload.new as EventRecord))).subscribe(); 
}