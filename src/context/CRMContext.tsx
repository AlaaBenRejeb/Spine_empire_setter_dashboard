"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

import { useAuth } from "@/context/AuthContext";
import { calculateSetterMetrics, SetterMetrics } from "@/lib/performanceUtils";
import { normalizeDealValue } from "@/lib/dealValue";
import { buildGoogleMapsUrl, resolveGoogleMapsUrl } from "@/lib/googleMaps";
import { toast } from "sonner";
import {
  getPriorityLeadOriginLabel,
  getPriorityLeadReadinessLabel,
  META_PRIORITY_STATUS,
  isPriorityLeadSource,
  formatMetaPriorityAge,
  getMetaPrioritySlaState,
  isMetaPriorityLead,
  resolveMetaPriorityCreatedAt,
} from "@/lib/metaPriority";

type InteractionKind = "call" | "sms" | "email";
type CalledDisposition = "hot" | "cold" | "followup";

interface LeadInteraction {
  id: string;
  lead_id: string;
  actor_id: string;
  kind: InteractionKind;
  disposition: CalledDisposition | null;
  note: string | null;
  meta: Record<string, any>;
  occurred_at: string;
  created_at: string;
}

interface LeadStatusEvent {
  id: string;
  lead_id: string;
  actor_id: string;
  actor_role: string | null;
  from_status: string | null;
  to_status: string;
  value_snapshot: number | null;
  note: string | null;
  meta: Record<string, any>;
  occurred_at: string;
}

interface RecordInteractionInput {
  leadId: string;
  kind: InteractionKind;
  disposition?: CalledDisposition | null;
  note?: string;
  meta?: Record<string, any>;
}

interface RecordStatusEventInput {
  leadId: string;
  fromStatus?: string | null;
  toStatus: string;
  valueSnapshot?: number | null;
  note?: string;
  meta?: Record<string, any>;
}

interface LeadWriteOptions {
  claimIfUnclaimed?: boolean;
  claimOrigin?: string;
}

export interface MetaPrioritySummary {
  totalCount: number;
  freshCount: number;
  overdueCount: number;
  escalatedCount: number;
  newestLeadId: string | null;
  newestLeadName: string | null;
  newestLeadAgeLabel: string | null;
  oldestWaitingLeadId: string | null;
  oldestWaitingLeadName: string | null;
  oldestWaitingAgeLabel: string | null;
}

export interface MetaPriorityLiveAlert {
  leadId: string;
  practiceName: string;
  createdAt: string | null;
  ageLabel: string;
  originLabel: string;
  readinessLabel?: string | null;
}

interface CRMContextType {
  activeLead: any;
  setActiveLead: (lead: any) => void;
  leadNotes: Record<string, any>;
  updateLeadNote: (leadId: string, updates: any, options?: LeadWriteOptions) => Promise<void>;
  addLead: (lead: any) => Promise<void>;
  assignedCloserName: string | null;
  leads: any[];
  totalLeadsCount: number;
  userPerformance: any | null;
  loading: boolean;
  user: any;
  userRole: string | null;
  liveMetrics: SetterMetrics;
  isSyncing: boolean;
  interactions: LeadInteraction[];
  statusEvents: LeadStatusEvent[];
  metaPrioritySummary: MetaPrioritySummary;
  liveMetaPriorityAlert: MetaPriorityLiveAlert | null;
  dismissMetaPriorityLiveAlert: () => void;
  recordInteraction: (input: RecordInteractionInput) => Promise<void>;
  startOutboundCall: (lead: any, opts?: { disposition?: CalledDisposition | null; note?: string; meta?: Record<string, any> }) => Promise<void>;
  logOutboundMessage: (lead: any, opts?: { kind?: "sms" | "email"; disposition?: CalledDisposition | null; note?: string; meta?: Record<string, any> }) => Promise<void>;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const SETTER_MUTABLE_STATUSES = new Set([
  META_PRIORITY_STATUS,
  "new",
  "called",
  "contacted",
  "booked",
  "ignored",
]);

const isSetterStatusAllowed = (value: string): boolean => SETTER_MUTABLE_STATUSES.has(value);
const CLAIM_ON_STATUS_CHANGE = new Set(["called", "contacted", "booked", "ignored"]);
const CALLED_DISPOSITIONS = new Set<CalledDisposition>(["hot", "cold", "followup"]);
const normalizeCalledDisposition = (value: unknown): CalledDisposition | null => {
  if (typeof value !== "string") return null;
  return CALLED_DISPOSITIONS.has(value as CalledDisposition) ? (value as CalledDisposition) : null;
};

const shouldHideLeadFromSetter = (lead: any, currentUserId?: string | null): boolean => {
  if (!currentUserId) return false;

  if (lead?.setter_id && lead.setter_id !== currentUserId) {
    return true;
  }

  return false;
};

const buildLeadNoteEntry = (lead: any) => ({
  id: lead.id,
  status: lead.status,
  comment: lead.metadata?.comment || "",
  deal_value: normalizeDealValue(lead.metadata?.deal_value),
  called_disposition: normalizeCalledDisposition(lead.metadata?.called_disposition),
  scheduled_time: lead.metadata?.scheduled_time || "",
  synced_at: lead.metadata?.synced_at,
  setter_id: lead.setter_id,
});

const EMPTY_META_PRIORITY_SUMMARY: MetaPrioritySummary = {
  totalCount: 0,
  freshCount: 0,
  overdueCount: 0,
  escalatedCount: 0,
  newestLeadId: null,
  newestLeadName: null,
  newestLeadAgeLabel: null,
  oldestWaitingLeadId: null,
  oldestWaitingLeadName: null,
  oldestWaitingAgeLabel: null,
};

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeLead, setActiveLead] = useState<any>(null);
  const [leadNotes, setLeadNotes] = useState<Record<string, any>>({});
  const [leads, setLeads] = useState<any[]>([]);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [assignedCloserId, setAssignedCloserId] = useState<string | null>(null);
  const [assignedCloserName, setAssignedCloserName] = useState<string | null>(null);
  const [userPerformance, setUserPerformance] = useState<any | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [interactions, setInteractions] = useState<LeadInteraction[]>([]);
  const [statusEvents, setStatusEvents] = useState<LeadStatusEvent[]>([]);
  const [metaPriorityClock, setMetaPriorityClock] = useState(() => Date.now());
  const [liveMetaPriorityAlert, setLiveMetaPriorityAlert] = useState<MetaPriorityLiveAlert | null>(null);
  const fetchedRef = useRef(false);
  const notesStorageKey = user?.id ? `spine-empire-lead-notes-${user.id}` : null;

  // Bug #12 fix: Centralized channel registry to prevent subscription accumulation
  const activeChannelsRef = useRef<Set<any>>(new Set());

  const registerChannel = (channel: any) => {
    activeChannelsRef.current.add(channel);
    return channel;
  };

  // Master cleanup: remove all channels on unmount
  useEffect(() => {
    return () => {
      activeChannelsRef.current.forEach((ch) => {
        try { supabase.removeChannel(ch); } catch {}
      });
      activeChannelsRef.current.clear();
    };
  }, []);

  const dismissMetaPriorityLiveAlert = useCallback(() => {
    setLiveMetaPriorityAlert(null);
  }, []);

  const upsertInteractionInState = (entry: LeadInteraction) => {
    setInteractions((prev) => {
      const exists = prev.some((item) => item.id === entry.id);
      if (exists) {
        return prev
          .map((item) => (item.id === entry.id ? entry : item))
          .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
      }
      return [entry, ...prev].sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
    });
  };

  const upsertStatusEventInState = (entry: LeadStatusEvent) => {
    setStatusEvents((prev) => {
      const exists = prev.some((item) => item.id === entry.id);
      if (exists) {
        return prev
          .map((item) => (item.id === entry.id ? entry : item))
          .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
      }
      return [entry, ...prev].sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
    });
  };

  const removeLeadFromState = useCallback((leadId: string) => {
    setLeads((prev) => {
      const exists = prev.some((lead) => lead.id === leadId);
      if (exists) {
        setTotalLeadsCount((count) => Math.max(0, count - 1));
      }
      return exists ? prev.filter((lead) => lead.id !== leadId) : prev;
    });

    setLeadNotes((prev) => {
      if (!prev[leadId]) {
        return prev;
      }

      const next = { ...prev };
      delete next[leadId];
      if (notesStorageKey) {
        localStorage.setItem(notesStorageKey, JSON.stringify(next));
      }
      return next;
    });

    setActiveLead((current: any) => (current?.id === leadId ? null : current));
  }, [notesStorageKey]);

  const transformLead = (lead: any) => {
    const source = lead.source || lead.metadata?.source || "manual";
    const priorityOriginLabel = getPriorityLeadOriginLabel(source);
    const priorityReadinessLabel = getPriorityLeadReadinessLabel(lead.metadata?.readiness);

    return {
      id: lead.id,
      "Practice Name": lead.business_name,
      "First Name": lead.contact_name?.split(' ')[0] || "Owner",
      "Last Name": lead.contact_name?.split(' ').slice(1).join(' ') || "",
      Phone: lead.phone || "",
      City: lead.metadata?.city || "",
      State: lead.metadata?.state || "",
      "Google Reviews": lead.metadata?.google_reviews || "0",
      Email: lead.email || lead.metadata?.email || lead.id,
      "Revenue Range": lead.revenue_range || "Unknown",
      "Main Challenge": lead.main_challenge || "",
      DealValue: normalizeDealValue(lead.metadata?.deal_value),
      "Google Maps URL": resolveGoogleMapsUrl({
        existingUrl: lead.google_maps_url,
        practiceName: lead.business_name,
        city: lead.metadata?.city,
        state: lead.metadata?.state,
      }),
      Source: source,
      PriorityOriginLabel: priorityOriginLabel,
      PriorityReadinessLabel: priorityReadinessLabel,
      Status: lead.status || "new",
      SetterId: lead.setter_id || null,
      CloserId: lead.closer_id || null,
      MetaPriorityCreatedAt: resolveMetaPriorityCreatedAt(lead.metadata, lead.created_at),
      ClaimedAt: lead.metadata?.claimed_at || null,
      ClaimedBy: lead.metadata?.claimed_by || null,
      FirstOutreachAt: lead.metadata?.first_outreach_at || null,
      ImportedIntakeSummary: lead.metadata?.imported_intake_summary || "",
      CreatedAt: lead.created_at || null,
      UpdatedAt: lead.updated_at || null,
    };
  };

  // 1. Initial Data Load — driven by auth state, no competing getSession() call
  useEffect(() => {
    if (notesStorageKey) {
      const saved = localStorage.getItem(notesStorageKey);
      if (saved) {
        try {
          setLeadNotes(JSON.parse(saved));
        } catch {
          setLeadNotes({});
        }
      } else {
        setLeadNotes({});
      }
    }

    const fetchLeads = async (sessionUser: any) => {
      setLoading(true);
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', sessionUser.id)
          .single();
        setUserRole(profile?.role || 'setter');

        const { data: mapping } = await supabase
          .from('setter_closer_mapping')
          .select('closer_id')
          .eq('setter_id', sessionUser.id)
          .maybeSingle();
        if (mapping?.closer_id) setAssignedCloserId(mapping.closer_id);

        const pageSize = 500;
        let from = 0;
        const dbLeads: any[] = [];

        while (true) {
          const { data: pageLeads, error: pageError } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false })
            .range(from, from + pageSize - 1);

          if (pageError) {
            console.error('❌ Leads fetch failed:', pageError.message, pageError.code, pageError.details);
            break;
          }

          if (!pageLeads || pageLeads.length === 0) {
            break;
          }

          dbLeads.push(...pageLeads);

          if (pageLeads.length < pageSize) {
            break;
          }

          from += pageSize;
        }

        const visibleLeads = dbLeads.filter((lead: any) => !shouldHideLeadFromSetter(lead, sessionUser.id));
        const count = visibleLeads.length;

        console.log(`✅ Leads Sync: Fetched ${visibleLeads.length} visible leads (Raw Pool: ${dbLeads.length})`);
        if (visibleLeads.length === 0) {
          console.warn("⚠️ Database returned 0 leads. Check RLS policies or if table is empty.");
        }

        if (visibleLeads.length > 0 || count === 0) {
          setTotalLeadsCount(count);
          const syncedNotes: Record<string, any> = {};
          const syncedLeads: any[] = visibleLeads.map((lead: any) => transformLead(lead));
          visibleLeads.forEach((lead: any) => {
            syncedNotes[lead.id] = buildLeadNoteEntry(lead);
          });
          setLeadNotes((prev) => {
            const next = { ...prev, ...syncedNotes };
            if (notesStorageKey) {
              localStorage.setItem(notesStorageKey, JSON.stringify(next));
            }
            return next;
          });
          setLeads(syncedLeads);
        }
      } catch (err) {
        console.error("Setter sync failed:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchLeads(user);
    } else if (!user) {
      setLoading(false);
      setLeadNotes({});
      fetchedRef.current = false; // Reset if they log out
    }

    // 2. Real-time Lead Sync
    const channel = registerChannel(supabase
      .channel('leads-setter-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload: any) => {
        const updated = (payload.eventType === 'DELETE' ? payload.old : payload.new) as any;

        if (payload.eventType === 'DELETE' || shouldHideLeadFromSetter(updated, user?.id)) {
          removeLeadFromState(updated.id);
          return;
        }

        if (
          payload.eventType === "INSERT" &&
          isMetaPriorityLead({
            status: updated?.status,
            source: updated?.source || updated?.metadata?.source,
          })
        ) {
          const createdAt = resolveMetaPriorityCreatedAt(updated?.metadata, updated?.created_at);
          setLiveMetaPriorityAlert({
            leadId: updated.id,
            practiceName:
              updated?.business_name ||
              updated?.contact_name ||
              `Lead ${String(updated?.id || "").slice(0, 8)}`,
            createdAt,
            ageLabel: formatMetaPriorityAge(createdAt),
            originLabel: getPriorityLeadOriginLabel(updated?.source || updated?.metadata?.source),
            readinessLabel: getPriorityLeadReadinessLabel(updated?.metadata?.readiness),
          });
        }

        const transformed = transformLead(updated);

        setLeadNotes((prev) => {
          const next = {
            ...prev,
            [updated.id]: buildLeadNoteEntry(updated)
          };
          if (notesStorageKey) {
            localStorage.setItem(notesStorageKey, JSON.stringify(next));
          }
          return next;
        });

        setLeads(prev => {
          const exists = prev.find(l => l.id === updated.id);
          if (exists) {
            return prev.map(l => l.id === updated.id ? transformed : l);
          } else {
            setTotalLeadsCount(prev => prev + 1);
            return [{ ...transformed, id: updated.id }, ...prev];
          }
        });
      })
      .subscribe());

    return () => {
      activeChannelsRef.current.delete(channel);
      supabase.removeChannel(channel);
    };
  }, [removeLeadFromState, user, notesStorageKey]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setMetaPriorityClock(Date.now());
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!liveMetaPriorityAlert) return;

    const timeoutId = window.setTimeout(() => {
      setLiveMetaPriorityAlert(null);
    }, 12000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [liveMetaPriorityAlert]);

  useEffect(() => {
    if (!user?.id) {
      setInteractions([]);
      return;
    }

    const fetchInteractions = async () => {
      const { data, error } = await supabase
        .from("lead_interactions")
        .select("*")
        .order("occurred_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch lead interactions:", error.message);
        return;
      }

      setInteractions((data || []) as LeadInteraction[]);
    };

    fetchInteractions();

    const interactionsChannel = registerChannel(supabase
      .channel(`lead-interactions-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "lead_interactions" }, (payload: any) => {
        if (payload.eventType === "DELETE") {
          const deletedId = payload.old?.id as string;
          if (!deletedId) return;
          setInteractions((prev) => prev.filter((item) => item.id !== deletedId));
          return;
        }

        const entry = payload.new as LeadInteraction;
        if (!entry?.id) return;
        upsertInteractionInState(entry);
      })
      .subscribe());

    return () => {
      activeChannelsRef.current.delete(interactionsChannel);
      supabase.removeChannel(interactionsChannel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setStatusEvents([]);
      return;
    }

    const fetchStatusEvents = async () => {
      const { data, error } = await supabase
        .from("lead_status_events")
        .select("*")
        .order("occurred_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch lead status events:", error.message);
        return;
      }

      setStatusEvents((data || []) as LeadStatusEvent[]);
    };

    fetchStatusEvents();

    const statusEventsChannel = registerChannel(supabase
      .channel(`lead-status-events-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "lead_status_events" }, (payload: any) => {
        if (payload.eventType === "DELETE") {
          const deletedId = payload.old?.id as string;
          if (!deletedId) return;
          setStatusEvents((prev) => prev.filter((item) => item.id !== deletedId));
          return;
        }

        const entry = payload.new as LeadStatusEvent;
        if (!entry?.id) return;
        upsertStatusEventInState(entry);
      })
      .subscribe());

    return () => {
      activeChannelsRef.current.delete(statusEventsChannel);
      supabase.removeChannel(statusEventsChannel);
    };
  }, [user?.id]);

  // Update real-time performance metrics from Database "Intelligence Engine"
  useEffect(() => {
    if (!user?.id) return;

    const fetchCurrentMetrics = async () => {
      const { data } = await supabase
        .from('performance_metrics')
        .select('*')
        .eq('profile_id', user.id)
        .eq('role', 'setter')
        .eq('period', 'current')
        .maybeSingle();
      
      if (data) {
        setUserPerformance(data);
      }
    };

    fetchCurrentMetrics();

    // Subscribe to real-time intelligence updates
    const performanceChannel = registerChannel(supabase
      .channel(`performance-${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'performance_metrics',
        filter: `profile_id=eq.${user.id}`
      }, (payload: any) => {
        console.log("⚡ Intelligence Update:", payload.new);
        setUserPerformance(payload.new);
      })
      .subscribe());

    return () => {
      activeChannelsRef.current.delete(performanceChannel);
      supabase.removeChannel(performanceChannel);
    };
  }, [user?.id]);


  // 3. Real-time Flow Matrix Mapping Sync
  useEffect(() => {
    if (!user?.id) return;

    const fetchCloserName = async (closerId: string) => {
      const { data } = await supabase.from('profiles').select('first_name').eq('id', closerId).single();
      if (data?.first_name) setAssignedCloserName(data.first_name);
    };

    const mappingChannel = registerChannel(supabase.channel(`mapping-${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'setter_closer_mapping',
        filter: `setter_id=eq.${user.id}`
      }, (payload: any) => {
        console.log("📡 Flow Matrix Update:", payload);
        const newCloserId = payload.new?.closer_id || null;
        setAssignedCloserId(newCloserId);
        if (newCloserId) fetchCloserName(newCloserId);
        else setAssignedCloserName(null);
      })
      .subscribe());

    if (assignedCloserId) fetchCloserName(assignedCloserId);

    return () => {
      activeChannelsRef.current.delete(mappingChannel);
      supabase.removeChannel(mappingChannel);
    };
  }, [user?.id, assignedCloserId]);

  // 4. Live Metric Derivation (Failsafe for background table lag)
  const [liveMetrics, setLiveMetrics] = useState<SetterMetrics>({
    totalLeads: 0,
    totalDials: 0,
    totalBooked: 0,
    bookedWithoutValue: 0,
    conversionRate: 0,
    powerScore: 0,
    projectedRevenue: 0
  });

  useEffect(() => {
    if (!user?.id) return;
    const stats = calculateSetterMetrics(leads, leadNotes, user.id, 'all');
    
    // Merge Strategy: Prefer Live stats for active session counts, but 
    // allow Database metrics to override if they represent a wider historical context
    const hybridMetrics = {
      ...stats,
      // Use revenue from DB performance if it's higher (includes past sessions)
      projectedRevenue: Math.max(stats.projectedRevenue, userPerformance?.revenue || 0),
      // Power score from DB is usually more 'tempered' by history
      powerScore: userPerformance?.power_score || stats.powerScore
    };
    
    setLiveMetrics(hybridMetrics);
  }, [leads, leadNotes, user?.id, userPerformance]);

  const metaPrioritySummary = useMemo<MetaPrioritySummary>(() => {
    const queueLeads = leads
      .map((lead) => {
        const status = leadNotes[lead.id]?.status || lead.Status || "new";
        if (status !== META_PRIORITY_STATUS) return null;
        if (!isPriorityLeadSource(lead.Source)) return null;

        const createdAt = resolveMetaPriorityCreatedAt(
          { meta_priority_created_at: lead.MetaPriorityCreatedAt },
          lead.CreatedAt,
        );
        const state = getMetaPrioritySlaState(createdAt, metaPriorityClock);

        return {
          id: lead.id,
          practiceName: lead["Practice Name"] || lead["First Name"] || `Lead ${lead.id.slice(0, 8)}`,
          createdAt,
          state,
          timestamp: createdAt ? new Date(createdAt).getTime() : 0,
        };
      })
      .filter((lead): lead is NonNullable<typeof lead> => Boolean(lead));

    if (queueLeads.length === 0) {
      return EMPTY_META_PRIORITY_SUMMARY;
    }

    const newestLead = [...queueLeads].sort((a, b) => b.timestamp - a.timestamp)[0];
    const oldestLead = [...queueLeads].sort((a, b) => a.timestamp - b.timestamp)[0];

    return {
      totalCount: queueLeads.length,
      freshCount: queueLeads.filter((lead) => lead.state === "fresh").length,
      overdueCount: queueLeads.filter((lead) => lead.state === "overdue").length,
      escalatedCount: queueLeads.filter((lead) => lead.state === "escalated").length,
      newestLeadId: newestLead?.id || null,
      newestLeadName: newestLead?.practiceName || null,
      newestLeadAgeLabel: newestLead ? formatMetaPriorityAge(newestLead.createdAt, metaPriorityClock) : null,
      oldestWaitingLeadId: oldestLead?.id || null,
      oldestWaitingLeadName: oldestLead?.practiceName || null,
      oldestWaitingAgeLabel: oldestLead ? formatMetaPriorityAge(oldestLead.createdAt, metaPriorityClock) : null,
    };
  }, [leadNotes, leads, metaPriorityClock]);

  // 5. Intelligence Persistence Engine (Syncs Live Metrics to Database for Admin visibility) - REMOVED: Database Triggers now handle this source of truth exclusively to prevent synchronization drift.

  const recordInteraction = async (input: RecordInteractionInput) => {
    if (!user?.id || !input.leadId) return;

    const payload = {
      lead_id: input.leadId,
      actor_id: user.id,
      kind: input.kind,
      disposition: normalizeCalledDisposition(input.disposition ?? null),
      note: input.note?.trim() ? input.note.trim() : null,
      meta: input.meta || {},
    };

    const { data, error } = await supabase
      .from("lead_interactions")
      .insert([payload])
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Failed to write interaction log:", error.message);
      toast.error("Failed to log interaction");
      return;
    }

    if (data) {
      upsertInteractionInState(data as LeadInteraction);
    }
  };

  const recordStatusEvent = async (input: RecordStatusEventInput) => {
    if (!user?.id || !input.leadId || !input.toStatus) return;

    const payload = {
      lead_id: input.leadId,
      actor_id: user.id,
      actor_role: userRole,
      from_status: input.fromStatus || null,
      to_status: input.toStatus,
      value_snapshot: normalizeDealValue(input.valueSnapshot),
      note: input.note?.trim() ? input.note.trim() : null,
      meta: input.meta || {},
    };

    const { data, error } = await supabase
      .from("lead_status_events")
      .insert([payload])
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Failed to write lead status event:", error.message);
      toast.error("Failed to record status change");
      return;
    }

    if (data) {
      upsertStatusEventInState(data as LeadStatusEvent);
    }
  };

  const updateLeadNote = async (leadId: string, updates: any, options: LeadWriteOptions = {}) => {
    if (!leadId) return;

    const previousEntry = leadNotes[leadId];
    const hasCalledDispositionUpdate = Object.prototype.hasOwnProperty.call(updates || {}, "called_disposition");
    const hasExplicitStatusUpdate = Object.prototype.hasOwnProperty.call(updates || {}, "status");
    const requestedDealValueUpdate = Object.prototype.hasOwnProperty.call(updates || {}, "deal_value");
    const canEditDealValue = userRole === "admin" || userRole === "superadmin" || userRole === "closer";
    const hasDealValueUpdate = requestedDealValueUpdate && canEditDealValue;
    if (requestedDealValueUpdate && !canEditDealValue) {
      console.warn("⚠️ Setter-side deal value write blocked. Deal value is closer/admin controlled.");
    }
    const normalizedDisposition = hasCalledDispositionUpdate
      ? normalizeCalledDisposition(updates?.called_disposition)
      : normalizeCalledDisposition(previousEntry?.called_disposition);
    const normalizedDealValue = hasDealValueUpdate
      ? normalizeDealValue(updates?.deal_value)
      : normalizeDealValue(previousEntry?.deal_value);
    const now = new Date().toISOString();
    const shouldForceCalledStatus = hasCalledDispositionUpdate && normalizedDisposition !== null;
    const nextStatus = ((updates?.status || (shouldForceCalledStatus ? "called" : previousEntry?.status) || "new") as string);

    if (!isSetterStatusAllowed(nextStatus)) {
      console.warn(`⚠️ Blocked unsupported setter status write: ${nextStatus}`);
      return;
    }

    const shouldAttemptClaim =
      Boolean(options.claimIfUnclaimed) ||
      (hasExplicitStatusUpdate && CLAIM_ON_STATUS_CHANGE.has(nextStatus));

    const optimisticEntry = {
      ...(previousEntry || { status: "new", comment: "" }),
      ...updates,
      status: nextStatus,
      called_disposition: normalizedDisposition,
      deal_value: normalizedDealValue,
      synced_at: now,
      setter_id: shouldAttemptClaim ? user?.id : previousEntry?.setter_id || null,
      id: leadId,
    };

    setLeadNotes((prev) => {
      const next = { ...prev, [leadId]: optimisticEntry };
      if (notesStorageKey) {
        localStorage.setItem(notesStorageKey, JSON.stringify(next));
      }
      return next;
    });

    try {
      const { data: existingLead, error: existingLeadError } = await supabase
        .from("leads")
        .select("status, setter_id, metadata, closer_id")
        .eq("id", leadId)
        .maybeSingle();

      if (existingLeadError) {
        throw existingLeadError;
      }

      const existingStatus = (existingLead?.status || previousEntry?.status || "new") as string;
      const existingMetadata = existingLead?.metadata || {};
      const isUnclaimedLead = !existingLead?.setter_id;
      const shouldClaimLead = Boolean(user?.id) && isUnclaimedLead && shouldAttemptClaim;
      const alreadyOwnedByCurrentSetter = Boolean(user?.id) && existingLead?.setter_id === user?.id;

      let bookedCloserId: string | null = null;
      if (nextStatus === "booked") {
        bookedCloserId = existingLead?.closer_id || assignedCloserId;

        if (!bookedCloserId && user) {
          const { data: mapping } = await supabase
            .from("setter_closer_mapping")
            .select("closer_id")
            .eq("setter_id", user.id)
            .maybeSingle();
          bookedCloserId = mapping?.closer_id || null;
        }

        if (!bookedCloserId) {
          setLeadNotes((prev) => {
            const next = { ...prev };
            if (previousEntry) {
              next[leadId] = previousEntry;
            } else {
              delete next[leadId];
            }
            if (notesStorageKey) {
              localStorage.setItem(notesStorageKey, JSON.stringify(next));
            }
            return next;
          });
          console.warn(`⚠️ Lead ${leadId} cannot be marked booked without a mapped closer. Configure Flow Matrix first.`);
          return;
        }
      }

      const mergedMetadata: Record<string, any> = {
        ...existingMetadata,
        status: optimisticEntry.status,
        synced_at: now,
        setter_id: shouldClaimLead || alreadyOwnedByCurrentSetter ? user?.id : existingLead?.setter_id || null,
      };

      if (shouldClaimLead) {
        mergedMetadata.claimed_at = existingMetadata.claimed_at || now;
        mergedMetadata.claimed_by = existingMetadata.claimed_by || user?.id;
        mergedMetadata.first_outreach_at = existingMetadata.first_outreach_at || now;
        mergedMetadata.claim_origin = options.claimOrigin || existingMetadata.claim_origin || null;
      }

      Object.entries(updates || {}).forEach(([key, value]) => {
        if (key === "status") return;
        if (key === "called_disposition") {
          mergedMetadata.called_disposition = normalizedDisposition;
          return;
        }
        if (key === "deal_value") {
          if (hasDealValueUpdate) {
            mergedMetadata.deal_value = normalizedDealValue;
          }
          return;
        }
        mergedMetadata[key] = value;
      });

      const updatePayload: Record<string, any> = {
        status: optimisticEntry.status,
        metadata: mergedMetadata,
      };
      if (shouldClaimLead || alreadyOwnedByCurrentSetter) {
        updatePayload.setter_id = user?.id;
      }
      if (bookedCloserId) {
        updatePayload.closer_id = bookedCloserId;
      } else {
        // If a lead is un-booked by a setter, detach closer assignment so handoff views stay clean.
        updatePayload.closer_id = null;
      }

      let updateQuery = supabase.from("leads").update(updatePayload).eq("id", leadId);

      if (shouldClaimLead && !alreadyOwnedByCurrentSetter) {
        updateQuery = updateQuery.is("setter_id", null);
      }

      const { data, error } = await updateQuery.select();

      if (error || !data || data.length === 0) {
        if (shouldClaimLead) {
          removeLeadFromState(leadId);
          console.warn(`⚠️ Lead ${leadId} was claimed by another setter before your action synced.`);
          return;
        }

        setLeadNotes((prev) => {
          const next = { ...prev };
          if (previousEntry) {
            next[leadId] = previousEntry;
          } else {
            delete next[leadId];
          }
          if (notesStorageKey) {
            localStorage.setItem(notesStorageKey, JSON.stringify(next));
          }
          return next;
        });
        console.error(`❌ DB Sync Error [${updates.status}]:`, error?.message || "No rows updated");
        toast.error("Sync failed — changes reverted");
        return;
      }

      const persistedLead = data[0];
      const persistedMetadata = persistedLead?.metadata || {};
      const previousStatus = existingStatus;
      const persistedEntry = {
        ...(previousEntry || {}),
        ...optimisticEntry,
        id: leadId,
        status: persistedLead?.status || optimisticEntry.status,
        comment: persistedMetadata.comment || "",
        deal_value: normalizeDealValue(persistedMetadata.deal_value),
        called_disposition: normalizeCalledDisposition(persistedMetadata.called_disposition),
        scheduled_time: persistedMetadata.scheduled_time || "",
        synced_at: persistedMetadata.synced_at || now,
        setter_id: persistedLead?.setter_id || previousEntry?.setter_id || null,
      };

      setLeadNotes((prev) => {
        const next = { ...prev, [leadId]: persistedEntry };
        if (notesStorageKey) {
          localStorage.setItem(notesStorageKey, JSON.stringify(next));
        }
        return next;
      });

      if (previousStatus !== persistedEntry.status) {
        await recordStatusEvent({
          leadId,
          fromStatus: previousStatus,
          toStatus: persistedEntry.status,
          valueSnapshot: persistedEntry.deal_value,
          note: persistedEntry.comment,
          meta: {
            source: "setter_updateLeadNote",
            called_disposition: persistedEntry.called_disposition,
            scheduled_time: persistedEntry.scheduled_time || null,
          },
        });
      }
    } catch (err) {
      setLeadNotes((prev) => {
        const next = { ...prev };
        if (previousEntry) {
          next[leadId] = previousEntry;
        } else {
          delete next[leadId];
        }
        if (notesStorageKey) {
          localStorage.setItem(notesStorageKey, JSON.stringify(next));
        }
        return next;
      });
      console.error("❌ Unexpected error during sync:", err);
      toast.error("Sync failed — check connection");
    }
  };

  const startOutboundCall = async (
    lead: any,
    opts?: { disposition?: CalledDisposition | null; note?: string; meta?: Record<string, any> },
  ) => {
    if (!lead?.id) return;

    const number = (lead.Phone || "").replace(/\D/g, "");
    const disposition = normalizeCalledDisposition(opts?.disposition ?? leadNotes[lead.id]?.called_disposition);
    await updateLeadNote(
      lead.id,
      { status: "called", called_disposition: disposition },
      {
        claimIfUnclaimed: true,
        claimOrigin: "call",
      },
    );
    await recordInteraction({
      leadId: lead.id,
      kind: "call",
      disposition,
      note: opts?.note,
      meta: {
        phone: lead.Phone || "",
        source: "outbound_call",
        ...(opts?.meta || {}),
      },
    });

    if (typeof window !== "undefined" && number) {
      window.open(`https://voice.google.com/u/0/calls?a=nc,%2B1${number}`, "_blank", "noopener,noreferrer");
    }
  };

  const logOutboundMessage = async (
    lead: any,
    opts?: { kind?: "sms" | "email"; disposition?: CalledDisposition | null; note?: string; meta?: Record<string, any> },
  ) => {
    if (!lead?.id) return;

    const messageKind = opts?.kind || "sms";
    const disposition = normalizeCalledDisposition(opts?.disposition ?? leadNotes[lead.id]?.called_disposition);
    const currentSetterId = leadNotes[lead.id]?.setter_id || lead.SetterId || null;
    if (!currentSetterId) {
      await updateLeadNote(
        lead.id,
        {
          status: "contacted",
          called_disposition: disposition,
        },
        {
          claimIfUnclaimed: true,
          claimOrigin: messageKind,
        },
      );
    }
    await recordInteraction({
      leadId: lead.id,
      kind: messageKind,
      disposition,
      note: opts?.note,
      meta: {
        phone: lead.Phone || "",
        email: lead.Email || "",
        source: "message_workspace",
        ...(opts?.meta || {}),
      },
    });
  };

  const addLead = async (lead: any) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([{
          business_name: lead.business_name,
          contact_name: lead.contact_name,
          phone: lead.phone,
          revenue_range: lead.revenue_range || "Unknown",
          main_challenge: lead.main_challenge || "",
          status: 'new',
          setter_id: null,
          google_maps_url: buildGoogleMapsUrl({
            practiceName: lead.business_name,
            city: lead.city,
            state: lead.state,
          }),
          metadata: { 
            email: lead.email, 
            city: lead.city, 
            state: lead.state,
            google_reviews: "New",
            source: lead.source || "manual",
          }
        }])
        .select();

      if (!error && data) {
        const newLeadRaw = data[0];
        const newLeadTransformed = transformLead(newLeadRaw);

        setLeads(prev => [newLeadTransformed, ...prev]);
        setTotalLeadsCount(prev => prev + 1);
        setLeadNotes((prev) => {
          const next = {
            ...prev,
            [newLeadRaw.id]: {
              id: newLeadRaw.id,
              status: "new",
              comment: "",
              deal_value: null,
              called_disposition: null,
              scheduled_time: "",
              setter_id: null,
            },
          };
          if (notesStorageKey) {
            localStorage.setItem(notesStorageKey, JSON.stringify(next));
          }
          return next;
        });
      }
    } catch (err) {
      console.error("Unexpected error adding lead:", err);
      toast.error("Failed to add lead");
    }
  };

  return (
    <CRMContext.Provider
      value={{
        activeLead,
        setActiveLead,
        leadNotes,
        updateLeadNote,
        addLead,
        leads,
        totalLeadsCount,
        userPerformance,
        loading,
        user,
        userRole,
        assignedCloserName,
        liveMetrics,
        isSyncing,
        interactions,
        statusEvents,
        metaPrioritySummary,
        liveMetaPriorityAlert,
        dismissMetaPriorityLiveAlert,
        recordInteraction,
        startOutboundCall,
        logOutboundMessage,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (context === undefined) {
    throw new Error("useCRM must be used within a CRMProvider");
  }
  return context;
}
