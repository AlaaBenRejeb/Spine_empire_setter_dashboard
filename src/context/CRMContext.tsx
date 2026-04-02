"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import leadsData from "@/data/leads.json";

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
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [activeLead, setActiveLead] = useState<any>(null);
  const [leadNotes, setLeadNotes] = useState<Record<string, any>>({});
  const [leads, setLeads] = useState<any[]>(leadsData);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [assignedCloserId, setAssignedCloserId] = useState<string | null>(null);

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
    DealValue: lead.metadata?.deal_value || 4000,
  });

  useEffect(() => {
    const initCRM = async () => {
      setLoading(true);
      
      // 0. Get Auth Session & Role
      const { data: { session } } = await supabase.auth.getSession();
      let currentUser = null;
      if (session?.user) {
        setUser(session.user);
        currentUser = session.user;
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        setUserRole(profile?.role || 'setter');
      }

      // 0.1 Fetch Assigned Closer (Pairing Matrix #1)
      if (currentUser) {
        const { data: mapping } = await supabase
          .from('setter_closer_mapping')
          .select('closer_id')
          .eq('setter_id', currentUser.id)
          .single();
        if (mapping?.closer_id) setAssignedCloserId(mapping.closer_id);
      }

      // 1. Load local notes for immediate UI responsiveness
      const saved = localStorage.getItem("spine-empire-lead-notes");
      if (saved) setLeadNotes(JSON.parse(saved));

      // 2. Sync with Supabase
      try {
        let query = supabase.from('leads').select('*');
        
        // Removed setter_id filter to allow global lead visibility for Setters
        // if (session?.user && (!userRole || userRole === 'setter')) {
        //   query = query.eq('setter_id', session.user.id);
        // }

        const { data: dbLeads, error } = await query;

        if (!error && (dbLeads && dbLeads.length > 0)) {
          // Merge DB statuses into local notes
          const syncedNotes: Record<string, any> = {};
          const syncedLeads: any[] = dbLeads.map(lead => ({
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
            DealValue: lead.metadata?.deal_value || 7500,
          }));

          dbLeads.forEach(lead => {
            const key = lead.metadata?.email || lead.id;
            syncedNotes[key] = { 
              id: lead.id,
              status: lead.status, 
              comment: lead.metadata?.comment || "",
              deal_value: lead.metadata?.deal_value || 7500
            };
          });
          setLeadNotes(prev => ({ ...prev, ...syncedNotes }));
          setLeads(syncedLeads);
        } else if (!error && (dbLeads && dbLeads.length === 0)) {
          // SEED DATABASE: If empty, push the 982 targets from leads.json
          console.log("Seeding Supabase with master target list...");
          const batch = (leadsData as any[]).slice(0, 100).map(l => ({
            business_name: l["Practice Name"],
            contact_name: `${l["First Name"]} ${l["Last Name"] || ""}`,
            phone: l.Phone,
            revenue_range: l["Revenue Range"] || "Unknown",
            main_challenge: l["Main Challenge"] || "",
            status: 'new',
            metadata: { 
              email: l.Email, 
              city: l.City, 
              state: l.State,
              google_reviews: l["Google Reviews"]
            }
          }));

          await supabase.from('leads').insert(batch);
        }
      } catch (err) {
        console.error("Setter sync failed:", err);
      } finally {
        setLoading(false);
      }
    };

    initCRM();

    // 3. Real-time Subscription
    const channel = supabase
      .channel('leads-setter-sync')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads'
      }, (payload) => {
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
            deal_value: updated.metadata?.deal_value || 4000
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
      supabase.removeChannel(channel);
    };
  }, []);

  const updateLeadNote = async (email: string, updates: any) => {
    // 1. Get the internal Supabase ID if we have it
    const leadId = leadNotes[email]?.id;

    // 2. Optimistic UI Update
    const updated = { 
      ...leadNotes, 
      [email]: { ...(leadNotes[email] || { status: "new", comment: "" }), ...updates } 
    };
    setLeadNotes(updated);
    localStorage.setItem("spine-empire-lead-notes", JSON.stringify(updated));

    // 3. Sync to Supabase
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

      // Use internal ID if available, fallback to email filter
      if (leadId) {
        query = query.eq('id', leadId);
      } else {
        query = query.eq('metadata->>email', email);
      }

      const { data, error } = await query.select();
      
      // 0. Automatically assign closer if status is booked (Flow Matrix #1)
      if (!error && updates.status === 'booked' && assignedCloserId) {
        await supabase
          .from('leads')
          .update({ closer_id: assignedCloserId })
          .eq('id', leadId || data?.[0]?.id);
        console.log(`📡 Flow Matrix: Automatically routed to Closer ${assignedCloserId}`);
      }
        
      if (error) {
        console.error("❌ Supabase update failed:", error.message);
      } else if (!data || data.length === 0) {
        console.warn(`⚠️ No rows updated for email/id: ${email} (ID: ${leadId})`);
      } else {
        console.log(`✅ Synchronized ${email} (ID: ${leadId}) to ${updates.status}`);
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
        // Update local state so it appears in the list
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
          DealValue: newLeadRaw.metadata?.deal_value || 7500
        };

        setLeads(prev => [newLeadTransformed, ...prev]);
        setLeadNotes(prev => ({ 
          ...prev, 
          [newLeadTransformed.Email]: { status: 'new', comment: "", deal_value: 7500 } 
        }));
      } else if (error) {
        console.error("Manual lead insert failed:", error);
      }
    } catch (err) {
      console.error("Unexpected error adding lead:", err);
    }
  };

  return (
    <CRMContext.Provider value={{ activeLead, setActiveLead, leadNotes, updateLeadNote, addLead, leads, loading, user, userRole }}>
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
