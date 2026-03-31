"use client";

import { motion } from "framer-motion";
import { PhoneCall, User, MapPin, Clock, MessageSquare, History } from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import leadsData from "@/data/leads.json";

export default function CallHistoryPage() {
  const { leadNotes } = useCRM();

  const historyLeads = Object.entries(leadNotes)
    .filter(([_, notes]) => notes.status !== "new")
    .map(([email, notes]) => {
      const lead = leadsData.find(l => l.Email === email);
      return { ...lead, ...notes };
    })
    .sort((a, b) => b.status === 'booked' ? 1 : -1); // Simple priority for now

  return (
    <div className="flex-1 flex flex-col gap-8 p-4 md:p-8 overflow-y-auto h-screen hide-scrollbar">
      <header className="flex flex-col">
        <h1 className="text-4xl font-black tracking-tight mb-1 uppercase">
          Call <span className="text-primary">History</span> Log
        </h1>
        <p className="text-gray-500 font-bold text-xs tracking-widest uppercase opacity-70">A complete record of your outreach volume</p>
      </header>

      <div className="space-y-4">
        {historyLeads.length > 0 ? (
          historyLeads.map((lead, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-card p-6 flex flex-col md:flex-row justify-between items-center gap-6"
            >
              <div className="flex items-center gap-6 w-full md:w-auto">
                <div className={`p-4 rounded-2xl ${lead.status === 'booked' ? 'bg-green-500/20 text-green-500' : 'bg-primary/20 text-primary'} border border-white/10`}>
                  <PhoneCall size={24} />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-lg font-black tracking-tight leading-none mb-1">{lead["Practice Name"]}</h3>
                  <div className="flex items-center gap-4 text-xs text-gray-500 font-bold">
                    <span className="flex items-center gap-1"><User size={12} /> {lead["First Name"]}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} /> {lead.City}</span>
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-foreground/5 border border-glass-border rounded-full text-[10px] uppercase text-primary tracking-widest">{lead.status}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex items-center gap-4 bg-foreground/5 p-4 rounded-xl border border-glass-border w-full">
                <MessageSquare size={14} className="text-primary shrink-0" />
                <p className="text-sm font-medium italic opacity-80 leading-relaxed truncate">
                  {lead.comment || "No specific notes recorded for this call."}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0 px-4">
                 <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest opacity-60">Last Interacted</span>
                 <span className="text-xs font-black">Just Now</span>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-24 opacity-20 filter grayscale">
             <History size={64} className="mb-4" />
             <span className="text-sm font-black uppercase tracking-widest">No calls logged in this session yet</span>
          </div>
        )}
      </div>
    </div>
  );
}
