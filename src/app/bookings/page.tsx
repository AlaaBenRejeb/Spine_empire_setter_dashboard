"use client";

import { motion } from "framer-motion";
import { Calendar, CheckSquare, Zap, ExternalLink, Globe, UserCheck, MessageSquare, Briefcase } from "lucide-react";
import { useCRM } from "@/context/CRMContext";

export default function BookingsPage() {
  const { leadNotes } = useCRM();

  const bookedLeads = Object.entries(leadNotes)
    .filter(([_, notes]) => notes.status === "booked")
    .length;

  return (
    <div className="flex-1 flex flex-col gap-10 p-8 md:p-12 overflow-y-auto hide-scrollbar h-screen">
      <header className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
        <div className="flex flex-col gap-1">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-5xl font-heading font-bold tracking-tight leading-none uppercase"
          >
            Booking <span className="text-muted-foreground opacity-30 italic">HQ.</span>
          </motion.h1>
          <p className="text-muted-foreground font-bold text-[10px] tracking-widest uppercase opacity-40 ml-1">Elite Portal Sync Interface</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="glass-card px-8 py-5 rounded-xl flex items-center gap-4 border border-glass-border">
            <UserCheck className="text-foreground opacity-30" size={20} strokeWidth={2.5} />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Confirmed</span>
              <span className="text-xs font-bold tracking-widest uppercase">{bookedLeads} DEMOS</span>
            </div>
          </div>
        </div>
      </header>

      {/* Extreme Minimal Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-20 flex-1">
        
        {/* Calendly Bridge Minimal */}
        <div className="xl:col-span-2 glass-card p-10 flex flex-col gap-10 bg-secondary/30 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
              <Globe size={400} strokeWidth={2} />
           </div>
           <div className="flex justify-between items-center relative z-10">
              <h2 className="text-2xl font-heading font-black tracking-tight flex items-center gap-5 uppercase leading-none italic underline decoration-primary/50 underline-offset-[12px]">
                 <ExternalLink size={32} />
                 CALENDLY BRIDGE
              </h2>
           </div>
           
           <div className="flex-1 flex flex-col items-center justify-center p-20 border-2 border-dashed border-glass-border rounded-xl relative z-10 group-hover:border-black transition-all bg-white dark:bg-black/20">
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }} 
                transition={{ repeat: Infinity, duration: 4 }}
                className="w-24 h-24 bg-black text-white dark:bg-white dark:text-black rounded-3xl flex items-center justify-center mb-8 shadow-2xl"
              >
                 <Zap size={40} fill="currentColor" />
              </motion.div>
              <h3 className="text-3xl font-heading font-bold text-center mb-4 tracking-tighter uppercase italic">CALENDLY LINK READY</h3>
              <p className="text-muted-foreground text-sm font-bold tracking-widest uppercase mb-10 opacity-60">Sync your session flow to the elite schedule</p>
              <button 
                onClick={() => window.open("https://calendly.com", "_blank")}
                className="bg-black text-white dark:bg-white dark:text-black px-16 py-6 font-bold text-lg rounded-xl shadow-xl hover:translate-y-[-4px] active:translate-y-0 transition-all flex items-center gap-4 uppercase tracking-[0.2em]"
              >
                 OPEN BRIDGE <ExternalLink size={20} strokeWidth={2.5} />
              </button>
           </div>
        </div>

        {/* Minimal Prep List */}
        <div className="xl:col-span-1 glass-card p-10 flex flex-col gap-10 bg-secondary/30 border-2 border-glass-border">
           <div className="flex justify-between items-center relative z-10">
              <h2 className="text-2xl font-heading font-black tracking-tight flex items-center gap-5 uppercase leading-none italic underline decoration-primary/50 underline-offset-[12px]">
                 <CheckSquare size={32} />
                 SALES PREP
              </h2>
           </div>
           
           <div className="space-y-6 flex-1 flex flex-col justify-center">
              {[
                { title: "Review Clinic GMB", desc: "Check current photos/staff", icon: <Globe /> },
                { title: "Verify Owner Name", desc: "Confirm spelling/pronunciation", icon: <UserCheck /> },
                { title: "Personal Comment", desc: "Lead context sync", icon: <MessageSquare /> },
                { title: "Confirm Frame", desc: "Review industry data", icon: <Briefcase /> }
              ].map((item, i) => (
                <div key={i} className="glass-card p-6 border border-glass-border flex items-center gap-6 group hover:border-black transition-all bg-white dark:bg-black/20">
                   <div className="p-3 bg-secondary rounded-lg border border-glass-border text-muted-foreground opacity-40 group-hover:text-black group-hover:opacity-100 transition-all">
                      {item.icon}
                   </div>
                   <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-widest">{item.title}</span>
                      <span className="text-[10px] text-muted-foreground font-bold italic opacity-60 leading-none">{item.desc}</span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
