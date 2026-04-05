"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

import { useAuth } from "@/context/AuthContext";
import { calculateSetterMetrics, SetterMetrics } from "@/lib/performanceUtils";

interface CRMContextType {
  activeLead: any;
  setActiveLead: (lead: any) => void;
  leadNotes: Record<string, any>;
  updateLeadNote: (email: string, updates: any) => void;
  addLead: (lead: any) => Promise<void>;
  assignedCloserName: string | null;
  leads: any[];
  totalLeadsCount: number;
  userPerformance: any | null;
  loading: boolean;
  user: any;
  userRole: string | null;
  liveMetrics: SetterMetrics;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const { user, profile: authProfile } = useAuth();
  const [activeLead, setActiveLead] = useState<any>(null);
  const [leadNotes, setLeadNotes] = useState<Record<string, any>>({});
  const [leads, setLeads] = useState<any[]>([]);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [assignedCloserId, setAssignedCloserId] = useState<string | null>(null);
  const [assignedCloserName, setAssignedCloserName] = useState<string | null>(null);
  const [userPerformance, setUserPerformance] = useState<any | null>(null);
  const fetchedRef = useRef(false);

  const transformLead = (lead: any) => ({
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
  });

  // 1. Initial Data Load — driven by auth state, no competing getSession() call
  useEffect(() => {
    const saved = localStorage.getItem("spine-empire-lead-notes");
    if (saved) setLeadNotes(JSON.parse(saved));

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

        const { data: dbLeads, error, count } = await supabase
          .from('leads')
          .select('*', { count: 'exact' });

        if (error) {
          console.error('❌ Leads fetch failed:', error.message, error.code, error.details);
        } else {
          console.log(`✅ Leads Sync: Fetched ${dbLeads?.length || 0} leads (Total Pool: ${count})`);
          if (dbLeads && dbLeads.length === 0) {
            console.warn("⚠️ Database returned 0 leads. Check RLS policies or if table is empty.");
          }
        }

        if (dbLeads) {
          if (count !== null) setTotalLeadsCount(count);
          const syncedNotes: Record<string, any> = {};
          const syncedLeads: any[] = dbLeads.map((lead: any) => ({
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
          }));
          dbLeads.forEach((lead: any) => {
            const key = lead.metadata?.email || lead.id;
            syncedNotes[key] = {
              id: lead.id,
              status: lead.status,
              comment: lead.metadata?.comment || "",
              deal_value: lead.metadata?.deal_value || 6500,
              synced_at: lead.metadata?.synced_at,
              setter_id: lead.setter_id
            };
          });
          setLeadNotes(prev => ({ ...prev, ...syncedNotes }));
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
      fetchedRef.current = false; // Reset if they log out
    }

    // 2. Real-time Lead Sync
    const channel = supabase
      .channel('leads-setter-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload: any) => {
        const updated = (payload.eventType === 'DELETE' ? payload.old : payload.new) as any;

        if (payload.eventType === 'DELETE') {
          const email = updated.metadata?.email || updated.id;
          setLeads(prev => prev.filter(l => l.Email !== email));
          setTotalLeadsCount(prev => Math.max(0, prev - 1));
          return;
        }

        const transformed = transformLead(updated);
        const email = transformed.Email;

        setLeadNotes(prev => ({
          ...prev,
          [email]: {
            status: updated.status,
            comment: updated.metadata?.comment || "",
            deal_value: updated.metadata?.deal_value || 6500,
            synced_at: updated.metadata?.synced_at,
            setter_id: updated.setter_id
          }
        }));

        setLeads(prev => {
          const exists = prev.find(l => l.Email === email);
          if (exists) {
            return prev.map(l => l.Email === email ? transformed : l);
          } else {
            setTotalLeadsCount(prev => prev + 1);
            return [transformed, ...prev];
          }
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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

  const updateLeadNote = async (email: string, updates: any) => {
    const leadId = leadNotes[email]?.id;

    const now = new Date().toISOString();
    const optimisticEntry = {
      ...(leadNotes[email] || { status: "new", comment: "" }),
      ...updates,
      synced_at: now,
      setter_id: user?.id
    };

    // Optimistic UI update (state only — NOT localStorage yet)
    setLeadNotes(prev => ({ ...prev, [email]: optimisticEntry }));

    try {
      let query = supabase.from('leads').update({
        status: updates.status,
        setter_id: user?.id,
        metadata: {
          ...(leadNotes[email] || {}),
          ...updates,
          email,
          synced_at: now
        }
      });

      if (leadId) {
        query = query.eq('id', leadId);
      } else {
        query = query.eq('metadata->>email', email);
      }

      const { data, error } = await query.select();

      if (error) {
        // Roll back optimistic update on failure
        setLeadNotes(prev => ({ ...prev, [email]: leadNotes[email] }));
        console.error(`❌ DB Sync Error [${updates.status}]:`, error.message, error.code, error.details);
      } else {
        if (data && data.length > 0) {
          // Only persist to localStorage after confirmed DB write
          const confirmed = { ...leadNotes, [email]: optimisticEntry };
          localStorage.setItem("spine-empire-lead-notes", JSON.stringify(confirmed));
          console.log(`✅ DB Status Synced: ${email} -> ${updates.status}`);
        } else {
          setLeadNotes(prev => ({ ...prev, [email]: leadNotes[email] }));
          console.warn(`⚠️ No rows updated for ${email}. Checked ID: ${leadId}`);
        }
      }
      
      // Automatic Handoff to Closer
      if (!error && updates.status === 'booked') {
        let closerId = assignedCloserId;
        
        if (!closerId && user) {
          const { data: mapping } = await supabase
            .from('setter_closer_mapping')
            .select('closer_id')
            .eq('setter_id', user.id)
            .maybeSingle();
          closerId = mapping?.closer_id;
        }

        if (closerId) {
          const targetId = leadId || data?.[0]?.id;
          if (targetId) {
            const { error: handoffError } = await supabase
              .from('leads')
              .update({ closer_id: closerId })
              .eq('id', targetId);
            if (handoffError) {
              console.error(`❌ HANDOFF FAILED: Lead ${targetId} booked but not routed to Closer ${closerId}:`, handoffError.message);
            } else {
              console.log(`📡 Flow Matrix: Routed lead ${targetId} → Closer ${closerId}`);
            }
          } else {
            console.error(`❌ HANDOFF FAILED: Lead booked but no target ID found to assign Closer ${closerId}`);
          }
        } else {
          console.warn(`⚠️ Lead booked but no Closer assigned in Flow Matrix for Setter ${user?.id}. Configure mapping in Admin Ops.`);
        }
      }
        
      if (error) {
        console.error("❌ Supabase update failed:", error.message);
      }
    } catch (err) {
      console.error("❌ Unexpected error during sync:", err);
    }
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
            google_reviews: "New"
          }
        }])
        .select();

      if (!error && data) {
        const newLeadRaw = data[0];
        const newLeadTransformed = {
          "Practice Name": newLeadRaw.business_name,
          "First Name": newLeadRaw.contact_name?.split(' ')[0] || "Owner",
          "Last Name": newLeadRaw.contact_name?.split(' ').slice(1).join(' ') || "",
          Phone: newLeadRaw.phone || "",
          City: newLeadRaw.metadata?.city || "",
          State: newLeadRaw.metadata?.state || "",
          "Google Reviews": newLeadRaw.metadata?.google_reviews || "0",
          Email: newLeadRaw.metadata?.email || newLeadRaw.id,
          "Revenue Range": newLeadRaw.revenue_range || "Unknown",
          "Main Challenge": newLeadRaw.main_challenge || "",
          DealValue: newLeadRaw.metadata?.deal_value || 6500
        };

        setLeads(prev => [newLeadTransformed, ...prev]);
        setTotalLeadsCount(prev => prev + 1);
        setLeadNotes(prev => ({ 
          ...prev, 
          [newLeadTransformed.Email]: { status: 'new', comment: "", deal_value: 6500 } 
        }));
      }
    } catch (err) {
      console.error("Unexpected error adding lead:", err);
    }
  };

  return (
    <CRMContext.Provider value={{ activeLead, setActiveLead, leadNotes, updateLeadNote, addLead, leads, totalLeadsCount, userPerformance, loading, user, userRole, assignedCloserName, liveMetrics }}>
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
