// src/hooks/useSecurityEvents.ts
import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { fetchDashboardMetrics, fetchThreatEvents, subscribeToThreatEvents } from '../services/security';
import { emptyMetrics, type DashboardMetrics, type ThreatRow } from '../types/security';

export function useSecurityEvents() {
  const [events, setEvents] = useState<ThreatRow[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>(emptyMetrics);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;

    void Promise.all([fetchThreatEvents(), fetchDashboardMetrics()])
      .then(([newEvents, newMetrics]) => {
        if (active) {
          setEvents(newEvents);
          // Your service already cleanly formats this to DashboardMetrics shape!
          setMetrics(newMetrics);
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load security events.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    // cleanEvent here is ALREADY mapped via toThreatRow() in your service layer
    const channel = subscribeToThreatEvents((cleanEvent: ThreatRow) => {
      console.log("🔥 REALTIME EVENT RECEIVED:", cleanEvent);
      setEvents((current) => [...current, cleanEvent].slice(-80));
      
      setMetrics((current) => {
        const nextScans = current.totalScans + 1;
        const currentAvg = current.averageLatencyMs ?? 0;
        
        // Use cleanEvent properties directly since they are already camelCase numbers
        const incomingLatency = cleanEvent.latencyMs ?? 0;

        const nextAvgLatency = current.averageLatencyMs === 0 || current.averageLatencyMs === null
          ? incomingLatency 
          : currentAvg + (incomingLatency - currentAvg) / nextScans;

        const isAttack = cleanEvent.verdict === 'ATTACK_SHIELDED';

        return {
          totalRevenue: current.totalRevenue + cleanEvent.fee,
          totalScans: nextScans,
          blockedAttacks: current.blockedAttacks + (isAttack ? 1 : 0),
          averageLatencyMs: nextAvgLatency
        };
      });
    });

    return () => {
      active = false;
      if (channel && supabase) void supabase.removeChannel(channel);
    };
  }, []);

  return { events, metrics, loading, error, configured: isSupabaseConfigured };
}