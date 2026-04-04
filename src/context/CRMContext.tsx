"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface CRMContextType {
  activeLead: any;
  setActiveLead: (lead: any) => void;
  leadNotes: Record<string, any>;
  updateLeadNote: (email: string, updates: any) => void;
  addLead: (lead: any) => Promise<void>;
  leads: any[];
  loading: boolean;
  user: any;
  userRole: string | null;
  assignedCloserName: string | null;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [activeLead, setActiveLead] = useState<any>(null);
  const [leadNotes, setLeadNotes] = useState<Record<string, any>>({});
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [assignedCloserId, setAssignedCloserId] = useState<string | null>(null);
  const [assignedCloserName, setAssignedCloserName] = useState<string | null>(null);

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
          .single();
        if (mapping?.closer_id) setAssignedCloserId(mapping.closer_id);

        const { data: dbLeads, error } = await supabase.from('leads').select('*');

        if (error) {
          console.error('❌ Leads fetch failed:', error.message, error.code);
        } else if (dbLeads && dbLeads.length > 0) {
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
              deal_value: lead.metadata?.deal_value || 6500
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

    // Subscribe to auth state — fires with INITIAL_SESSION on load, no competing getSession()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) {
        setUser(session.user);
        fetchLeads(session.user);
      } else {
        setLoading(false);
      }
    });

    // 2. Real-time Lead Sync
    const channel = supabase
      .channel('leads-setter-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload: any) => {
        const updated = (payload.eventType === 'DELETE' ? payload.old : payload.new) as any;

        if (payload.eventType === 'DELETE') {
          const email = updated.metadata?.email || updated.id;
          setLeads(prev => prev.filter(l => l.Email !== email));
          return;
        }

        const transformed = transformLead(updated);
        const email = transformed.Email;

        setLeadNotes(prev => ({
          ...prev,
          [email]: {
            status: updated.status,
            comment: updated.metadata?.comment || "",
            deal_value: updated.metadata?.deal_value || 6500
          }
        }));

        setLeads(prev => {
          const exists = prev.find(l => l.Email === email);
          if (exists) {
            return prev.map(l => l.Email === email ? transformed : l);
          } else {
            return [transformed, ...prev];
          }
        });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

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

  const updateLeadNote = async (email: string, updates: any) => {
    const leadId = leadNotes[email]?.id;

    const updated = { 
      ...leadNotes, 
      [email]: { ...(leadNotes[email] || { status: "new", comment: "" }), ...updates } 
    };
    setLeadNotes(updated);
    localStorage.setItem("spine-empire-lead-notes", JSON.stringify(updated));

    try {
      let query = supabase.from('leads').update({ 
        status: updates.status,
        metadata: { 
          ...(leadNotes[email] || {}), 
          ...updates, 
          email,
          synced_at: new Date().toISOString()
        }
      });

      if (leadId) {
        query = query.eq('id', leadId);
      } else {
        query = query.eq('metadata->>email', email);
      }

      const { data, error } = await query.select();
      
      // Automatic Handoff to Closer
      if (!error && updates.status === 'booked') {
        let closerId = assignedCloserId;
        
        if (!closerId && user) {
          const { data: mapping } = await supabase
            .from('setter_closer_mapping')
            .select('closer_id')
            .eq('setter_id', user.id)
            .single();
          closerId = mapping?.closer_id;
        }

        if (closerId) {
          const targetId = leadId || data?.[0]?.id;
          if (targetId) {
            await supabase
              .from('leads')
              .update({ closer_id: closerId })
              .eq('id', targetId);
            console.log(`📡 Flow Matrix: Automatically routed to Closer ${closerId}`);
          }
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
    <CRMContext.Provider value={{ activeLead, setActiveLead, leadNotes, updateLeadNote, addLead, leads, loading, user, userRole, assignedCloserName }}>
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
