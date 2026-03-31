"use client";

import { useState, useMemo } from "react";
import { Search, Phone, Star, MapPin, ChevronRight, MessageSquare, Briefcase, Zap, Filter, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCRM } from "@/context/CRMContext";

export default function LeadList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "called" | "booked">("all");
  const { activeLead, setActiveLead, leadNotes, updateLeadNote, leads } = useCRM();

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = lead["Practice Name"].toLowerCase().includes(search.toLowerCase()) ||
                           lead.City.toLowerCase().includes(search.toLowerCase());
      
      if (!matchesSearch) return false;
      if (statusFilter === "all") return true;
      
      const status = leadNotes[lead.Email]?.status || "new";
      return status === statusFilter;
    });
  }, [search, leads, leadNotes, statusFilter]);

  return (
    <div className="flex flex-col h-full gap-8">
      {/* Minimal Elite Search Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search Target Clinics..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-secondary/50 border border-glass-border rounded-xl py-5 pl-14 pr-8 text-xs font-bold tracking-widest uppercase focus:border-foreground outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar min-w-[300px]">
          {(['all', 'new', 'called', 'booked'] as const).map((status) => (
             <button 
               key={status}
               onClick={() => setStatusFilter(status)}
               className={`px-4 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap border ${
                 statusFilter === status 
                 ? 'bg-black text-white border-black dark:bg-white dark:text-black' 
                 : 'bg-background border-glass-border text-muted-foreground hover:border-black'
               }`}
             >
               {status}
             </button>
          ))}
          <div className="px-6 py-4 bg-secondary/50 text-muted-foreground font-bold text-[10px] uppercase tracking-widest rounded-xl border border-glass-border whitespace-nowrap">
             {filteredLeads.length} Targets
          </div>
        </div>
      </div>

      {/* Grid of Minimal Lead Cards */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 hide-scrollbar">
        <AnimatePresence mode="popLayout">
          {filteredLeads.map((lead, idx) => {
             const isActive = activeLead?.Email === lead.Email;
             const notes = leadNotes[lead.Email];
             const status = notes?.status || "new";
             const reviews = parseInt(lead["Google Reviews"]?.toString() || "0");

             return (
               <motion.div
                 key={lead.Email}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.03 }}
                 onClick={() => setActiveLead(lead)}
                 className={`glass-card p-0 overflow-hidden cursor-pointer group border ${
                   isActive ? 'ring-2 ring-black dark:ring-white ring-offset-2 ring-offset-background' : ''
                 }`}
               >
                 <div className="flex flex-col md:flex-row items-stretch">
                    {/* Status Dot Logic */}
                    <div className={`w-1.5 md:w-2 ${
                      status === 'booked' ? 'bg-green-500' : 
                      status === 'called' ? 'bg-yellow-500' : 
                      status === 'ignored' ? 'bg-red-500' : 'bg-muted-foreground/10'
                    }`} />

                    <div className="flex-1 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                       <div className="flex items-center gap-6 flex-1">
                          <div className="w-16 h-16 bg-secondary/50 rounded-xl flex items-center justify-center text-center border border-glass-border">
                             <Briefcase size={24} className="text-muted-foreground" />
                          </div>

                          <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold tracking-tight uppercase leading-tight">{lead["Practice Name"]}</h3>
                                {reviews > 110 && (
                                   <Star size={12} className="text-black/20 dark:text-white/20 fill-current" />
                                )}
                             </div>
                             <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                                <span className="flex items-center gap-1.5"><MapPin size={12} /> {lead.City}</span>
                                <span className="flex items-center gap-1.5 opacity-80"><User size={12} /> {lead["First Name"] || "Owner"}</span>
                             </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-3 w-full md:w-auto">
                          {notes?.comment && (
                             <MessageSquare size={16} className="text-muted-foreground opacity-40" />
                          )}

                          <a 
                            href={`https://voice.google.com/u/0/calls?a=nc,%2B1${lead.Phone.replace(/\D/g, '')}`}
                            target="_blank"
                            className="flex-1 md:flex-none bg-black text-white dark:bg-white dark:text-black font-bold uppercase text-[10px] tracking-widest px-8 py-4 rounded-xl flex items-center gap-3 hover:translate-y-[-1px] transition-all shadow-sm active:translate-y-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                updateLeadNote(lead.Email, { status: "called" });
                            }}
                          >
                             <Phone size={16} strokeWidth={2.5} /> CALL 
                          </a>

                          <div className="p-4 bg-secondary rounded-xl border border-glass-border hover:border-black transition-all">
                             <ChevronRight size={20} className="text-muted-foreground" />
                          </div>
                       </div>
                    </div>
                 </div>
               </motion.div>
             );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
