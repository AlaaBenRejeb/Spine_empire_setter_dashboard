"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

import { useAuth } from "@/context/AuthContext";
import { calculateSetterMetrics, SetterMetrics } from "@/lib/performanceUtils";

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

interface RecordInteractionInput {
  leadId: string;
  kind: InteractionKind;
  disposition?: CalledDisposition | null;
  note?: string;
  meta?: Record<string, any>;
}

interface CRMContextType {
  activeLead: any;
  setActiveLead: (lead: any) => void;
  leadNotes: Record<string, any>;
  updateLeadNote: (leadId: string, updates: any) => void;
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
  recordInteraction: (input: RecordInteractionInput) => Promise<void>;
  startOutboundCall: (lead: any, opts?: { disposition?: CalledDisposition | null; note?: string; meta?: Record<string, any> }) => Promise<void>;
  logOutboundMessage: (lead: any, opts?: { kind?: "sms" | "email"; disposition?: CalledDisposition | null; note?: string; meta?: Record<string, any> }) => Promise<void>;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const SETTER_MUTABLE_STATUSES = new Set([
  "new",
  "called",
  "contacted",
  "booked",
  "ignored",
]);

const isSetterStatusAllowed = (value: string): boolean => SETTER_MUTABLE_STATUSES.has(value);
const CALLED_DISPOSITIONS = new Set<CalledDisposition>(["hot", "cold", "followup"]);
const normalizeCalledDisposition = (value: unknown): CalledDisposition | null => {
  if (typeof value !== "string") return null;
  return CALLED_DISPOSITIONS.has(value as CalledDisposition) ? (value as CalledDisposition) : null;
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
  const fetchedRef = useRef(false);
  const notesStorageKey = user?.id ? `spine-empire-lead-notes-${user.id}` : null;

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

  const transformLead = (lead: any) => ({
    id: lead.id,
    "Practice Name": lead.business_name,
    "First Name": lead.contact_name?.split(' ')[0] || "Owner",
    "Last Name": lead.contact_name?.split(' ').slice(1).join(' ') || "",
    Phone: lead.phone || "",
    City: lead.metadata?.city || "",
    State: lead.metadata?.state || "",
    "Google Reviews": lead.metadata?.google_reviews || "0",
    Email: lead.metadata?.email || lead.id,
    "Revenue Range": lead.revenue_range || "Unknown",
    "Main Challenge": lead.main_challenge || "",
    DealValue: lead.metadata?.deal_value || 6500,
    Source: lead.metadata?.source || "manual",
  });

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
        let totalCount: number | null = null;
        const dbLeads: any[] = [];

        while (true) {
          const { data: pageLeads, error: pageError, count: pageCount } = await supabase
            .from('leads')
            .select('*', { count: from === 0 ? 'exact' : undefined })
            .order('created_at', { ascending: false })
            .range(from, from + pageSize - 1);

          if (pageError) {
            console.error('❌ Leads fetch failed:', pageError.message, pageError.code, pageError.details);
            break;
          }

          if (from === 0 && pageCount !== null) {
            totalCount = pageCount;
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

        const count = totalCount ?? dbLeads.length;

        console.log(`✅ Leads Sync: Fetched ${dbLeads.length} leads (Total Pool: ${count})`);
        if (dbLeads.length === 0) {
          console.warn("⚠️ Database returned 0 leads. Check RLS policies or if table is empty.");
        }

        if (dbLeads.length > 0 || count === 0) {
          setTotalLeadsCount(count);
          const syncedNotes: Record<string, any> = {};
          const syncedLeads: any[] = dbLeads.map((lead: any) => transformLead(lead));
          dbLeads.forEach((lead: any) => {
            syncedNotes[lead.id] = {
              id: lead.id,
              status: lead.status,
              comment: lead.metadata?.comment || "",
              deal_value: lead.metadata?.deal_value || 6500,
              called_disposition: normalizeCalledDisposition(lead.metadata?.called_disposition),
              synced_at: lead.metadata?.synced_at,
              setter_id: lead.setter_id,
            };
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
    const channel = supabase
      .channel('leads-setter-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload: any) => {
        const updated = (payload.eventType === 'DELETE' ? payload.old : payload.new) as any;

        if (payload.eventType === 'DELETE') {
          setLeads(prev => prev.filter(l => l.id !== updated.id));
          setLeadNotes((prev) => {
            if (!prev[updated.id]) {
              return prev;
            }
            const next = { ...prev };
            delete next[updated.id];
            if (notesStorageKey) {
              localStorage.setItem(notesStorageKey, JSON.stringify(next));
            }
            return next;
          });
          setTotalLeadsCount(prev => Math.max(0, prev - 1));
          return;
        }

        const transformed = transformLead(updated);

        setLeadNotes((prev) => {
          const next = {
            ...prev,
            [updated.id]: {
              status: updated.status,
              comment: updated.metadata?.comment || "",
              deal_value: updated.metadata?.deal_value || 6500,
              called_disposition: normalizeCalledDisposition(updated.metadata?.called_disposition),
              synced_at: updated.metadata?.synced_at,
              setter_id: updated.setter_id
            }
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, notesStorageKey]);

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

    const interactionsChannel = supabase
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
      .subscribe();

    return () => {
      supabase.removeChannel(interactionsChannel);
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
    const performanceChannel = supabase
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
      .subscribe();

    return () => {
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

    const mappingChannel = supabase.channel(`mapping-${user.id}`)
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
      .subscribe();

    if (assignedCloserId) fetchCloserName(assignedCloserId);

    return () => {
      supabase.removeChannel(mappingChannel);
    };
  }, [user?.id, assignedCloserId]);

  // 4. Live Metric Derivation (Failsafe for background table lag)
  const [liveMetrics, setLiveMetrics] = useState<SetterMetrics>({
    totalLeads: 0,
    totalDials: 0,
    totalBooked: 0,
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
      return;
    }

    if (data) {
      upsertInteractionInState(data as LeadInteraction);
    }
  };

  const updateLeadNote = async (leadId: string, updates: any) => {
    if (!leadId) return;

    const previousEntry = leadNotes[leadId];
    const hasCalledDispositionUpdate = Object.prototype.hasOwnProperty.call(updates || {}, "called_disposition");
    const normalizedDisposition = hasCalledDispositionUpdate
      ? normalizeCalledDisposition(updates?.called_disposition)
      : normalizeCalledDisposition(previousEntry?.called_disposition);
    const now = new Date().toISOString();
    const shouldForceCalledStatus = hasCalledDispositionUpdate && normalizedDisposition !== null;
    const nextStatus = ((updates?.status || (shouldForceCalledStatus ? "called" : previousEntry?.status) || "new") as string);

    if (!isSetterStatusAllowed(nextStatus)) {
      console.warn(`⚠️ Blocked unsupported setter status write: ${nextStatus}`);
      return;
    }

    const optimisticEntry = {
      ...(previousEntry || { status: "new", comment: "" }),
      ...updates,
      status: nextStatus,
      called_disposition: normalizedDisposition,
      synced_at: now,
      setter_id: user?.id,
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
        .select("metadata, closer_id")
        .eq("id", leadId)
        .maybeSingle();

      if (existingLeadError) {
        throw existingLeadError;
      }

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

      const mergedMetadata = {
        ...(existingLead?.metadata || {}),
        ...optimisticEntry,
      };

      const updatePayload: Record<string, any> = {
        status: optimisticEntry.status,
        setter_id: user?.id,
        metadata: mergedMetadata,
      };
      if (bookedCloserId) {
        updatePayload.closer_id = bookedCloserId;
      } else {
        // If a lead is un-booked by a setter, detach closer assignment so handoff views stay clean.
        updatePayload.closer_id = null;
      }

      const { data, error } = await supabase
        .from("leads")
        .update(updatePayload)
        .eq("id", leadId)
        .select();

      if (error || !data || data.length === 0) {
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
        return;
      }

      setLeadNotes((prev) => {
        const next = { ...prev, [leadId]: optimisticEntry };
        if (notesStorageKey) {
          localStorage.setItem(notesStorageKey, JSON.stringify(next));
        }
        return next;
      });
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
    }
  };

  const startOutboundCall = async (
    lead: any,
    opts?: { disposition?: CalledDisposition | null; note?: string; meta?: Record<string, any> },
  ) => {
    if (!lead?.id) return;

    const number = (lead.Phone || "").replace(/\D/g, "");
    const disposition = normalizeCalledDisposition(opts?.disposition ?? leadNotes[lead.id]?.called_disposition);
    await updateLeadNote(lead.id, { status: "called", called_disposition: disposition });
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
          setter_id: user?.id,
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
            [newLeadRaw.id]: { id: newLeadRaw.id, status: "new", comment: "", deal_value: 6500, called_disposition: null },
          };
          if (notesStorageKey) {
            localStorage.setItem(notesStorageKey, JSON.stringify(next));
          }
          return next;
        });
      }
    } catch (err) {
      console.error("Unexpected error adding lead:", err);
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
