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
  loading: boolean;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [activeLead, setActiveLead] = useState<any>(null);
  const [leadNotes, setLeadNotes] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initCRM = async () => {
      setLoading(true);
      
      // 1. Load local notes for immediate UI responsiveness
      const saved = localStorage.getItem("spine-empire-lead-notes");
      if (saved) setLeadNotes(JSON.parse(saved));

      // 2. Sync with Supabase
      try {
        const { data: dbLeads, error } = await supabase
          .from('leads')
          .select('*');

        if (!error && (dbLeads && dbLeads.length > 0)) {
          // Merge DB statuses into local notes
          const syncedNotes: Record<string, any> = {};
          dbLeads.forEach(lead => {
            const email = lead.metadata?.email || lead.id;
            syncedNotes[email] = { 
              status: lead.status, 
              comment: lead.metadata?.comment || "" 
            };
          });
          setLeadNotes(prev => ({ ...prev, ...syncedNotes }));
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
  }, []);

  const updateLeadNote = async (email: string, updates: any) => {
    // Optimistic UI Update
    const updated = { 
      ...leadNotes, 
      [email]: { ...(leadNotes[email] || { status: "new", comment: "" }), ...updates } 
    };
    setLeadNotes(updated);
    localStorage.setItem("spine-empire-lead-notes", JSON.stringify(updated));

    // Sync to Supabase
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({ 
          status: updates.status,
          metadata: { 
            ...(leadNotes[email] || {}), 
            ...updates, 
            email,
            synced_at: new Date().toISOString()
          }
        })
        .eq('metadata->>email', email)
        .select();
        
      if (error) {
        console.error("❌ Supabase update failed:", error.message);
      } else if (!data || data.length === 0) {
        console.warn(`⚠️ No rows updated for email: ${email}`);
      } else {
        console.log(`✅ [v0] Synchronized ${email} to ${updates.status}`);
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
        const newLead = data[0];
        const email = newLead.metadata?.email || newLead.id;
        setLeadNotes(prev => ({ 
          ...prev, 
          [email]: { status: 'new', comment: "" } 
        }));
      } else if (error) {
        console.error("Manual lead insert failed:", error);
      }
    } catch (err) {
      console.error("Unexpected error adding lead:", err);
    }
  };

  return (
    <CRMContext.Provider value={{ activeLead, setActiveLead, leadNotes, updateLeadNote, addLead, loading }}>
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
