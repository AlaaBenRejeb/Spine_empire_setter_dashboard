"use client";

import { motion } from "framer-motion";
import { PhoneCall, Calendar, Search, Filter, Phone, PhoneOutgoing, User, MessageSquare, MapPin } from "lucide-react";
import { useCRM } from "@/context/CRMContext";

export default function CallHistoryPage() {
  const { leads, leadNotes } = useCRM();

  const callLogs = Object.entries(leadNotes)
    .filter(([_, notes]) => notes.status === "called" || notes.status === "booked")
    .map(([email, notes]) => {
      const lead = leads.find((l: any) => l.Email === email);
      return { ...lead, ...notes };
    })
    .reverse();

  return (
    <div className="flex-1 flex flex-col gap-10 p-8 md:p-12 overflow-y-auto hide-scrollbar h-screen">
      <header className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
        <div className="flex flex-col gap-1">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-5xl font-heading font-bold tracking-tight leading-none uppercase"
          >
            Call <span className="text-muted-foreground opacity-30 italic">Registry.</span>
          </motion.h1>
          <p className="text-muted-foreground font-bold text-[10px] tracking-widest uppercase opacity-40 ml-1">Elite Outreach Interaction Log</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="glass-card px-8 py-5 rounded-xl flex items-center gap-4 border border-glass-border">
            <PhoneOutgoing className="text-foreground opacity-30" size={20} strokeWidth={2.5} />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Total Logs</span>
              <span className="text-xs font-bold tracking-widest uppercase">{callLogs.length} INTERACTIONS</span>
            </div>
          </div>
        </div>
      </header>

      {/* Extreme Minimal Call Logs */}
      <div className="flex-1 flex flex-col gap-4 mb-20 max-w-5xl">
        {callLogs.length > 0 ? (
          callLogs.map((log, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-card p-6 flex flex-col md:flex-row items-center gap-8 group border border-glass-border hover:border-black transition-all"
            >
              <div className="w-16 h-16 bg-secondary/50 rounded-xl flex items-center justify-center text-center shrink-0">
                 <User size={24} className="text-muted-foreground opacity-40" />
              </div>
              
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-1">
                   <h3 className="text-xl font-bold tracking-tight uppercase leading-none">{log["Practice Name"]}</h3>
                   {log.status === 'booked' && (
                     <span className="px-3 py-1 bg-green-500 text-white text-[9px] font-black uppercase rounded-full shadow-lg">BOOKED</span>
                   )}
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 italic">
                   <span className="flex items-center gap-1.5"><MapPin size={12} /> {log.City}</span>
                   <span className="flex items-center gap-1.5 opacity-60"><PhoneOutgoing size={12} /> Outbound Call</span>
                </div>
              </div>

              <div className="flex-1 max-w-[400px]">
                 <div className="p-4 bg-secondary/30 rounded-lg border border-dashed border-glass-border">
                    <p className="text-xs text-muted-foreground font-bold italic line-clamp-2">
                       "{log.comment || "Direct call logged. No additional notes found for this interaction."}"
                    </p>
                 </div>
              </div>

              <div className="flex items-center gap-3">
                 <button className="p-4 bg-black text-white dark:bg-white dark:text-black rounded-xl hover:translate-y-[-2px] transition-all active:translate-y-0 shadow-lg">
                    <Phone size={18} strokeWidth={2.5} />
                 </button>
                 <button className="p-4 bg-secondary rounded-xl border border-glass-border hover:border-black transition-all">
                    <MessageSquare size={18} className="opacity-40" />
                 </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-20 opacity-20 border-2 border-dashed border-glass-border rounded-3xl">
             <PhoneCall size={64} strokeWidth={4} className="mb-6" />
             <span className="text-sm font-bold uppercase tracking-[0.4em] italic leading-none">NO INTERACTIONS LOGGED</span>
          </div>
        )}
      </div>
    </div>
  );
}
