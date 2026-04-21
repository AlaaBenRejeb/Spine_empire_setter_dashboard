"use client";

import { useState, useMemo } from "react";
import { Search, Phone, Star, MapPin, ChevronRight, MessageSquare, Briefcase, User, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCRM } from "@/context/CRMContext";
import {
  getMetaPrioritySlaState,
  META_PRIORITY_LANE_LABEL,
  META_PRIORITY_STATUS,
  resolveMetaPriorityCreatedAt,
} from "@/lib/metaPriority";

const formatMetaPriorityAge = (value?: string | null) => {
  if (!value) return "Just in";

  const ageMs = Math.max(0, Date.now() - new Date(value).getTime());
  const ageMinutes = Math.floor(ageMs / 60000);

  if (ageMinutes < 1) return "Just in";
  if (ageMinutes < 60) return `${ageMinutes}m waiting`;

  const ageHours = Math.floor(ageMinutes / 60);
  return `${ageHours}h waiting`;
};

export default function LeadList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | typeof META_PRIORITY_STATUS | "new" | "called" | "booked">("all");
  const [calledDispositionFilter, setCalledDispositionFilter] = useState<"all" | "hot" | "cold" | "followup">("all");
  const { activeLead, setActiveLead, leadNotes, leads, startOutboundCall } = useCRM();

  const isSetterArchivedStatus = (status: string) => (
    status === "won" ||
    status === "closed_won" ||
    status === "active_client" ||
    status === "lost" ||
    status === "closed_lost" ||
    status === "noshow" ||
    status === "followup"
  );

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = lead["Practice Name"].toLowerCase().includes(search.toLowerCase()) ||
                           lead.City.toLowerCase().includes(search.toLowerCase());
      
      if (!matchesSearch) return false;
      const notes = leadNotes[lead.id];
      const status = notes?.status || "new";

      // Sold/closed outcomes are archived from the setter working list.
      // If closer resets a deal back to booked, it reappears automatically.
      if (isSetterArchivedStatus(status)) return false;

      if (statusFilter === "all") return true;

      if (status !== statusFilter) return false;

      if (statusFilter === "called" && calledDispositionFilter !== "all") {
        return (notes?.called_disposition || null) === calledDispositionFilter;
      }

      return true;
    });
  }, [search, leads, leadNotes, statusFilter, calledDispositionFilter]);

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Minimal Elite Search Header */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search Target Clinics..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-secondary/50 border border-glass-border rounded-xl py-4 pl-14 pr-8 text-[11px] font-bold tracking-widest uppercase focus:border-foreground outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar min-w-[300px]">
          {(['all', META_PRIORITY_STATUS, 'new', 'called', 'booked'] as const).map((status) => (
             <button 
               key={status}
               onClick={() => setStatusFilter(status)}
               className={`px-4 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap border ${
                 statusFilter === status 
                 ? 'bg-black text-white border-black dark:bg-white dark:text-black' 
                 : 'bg-background border-glass-border text-muted-foreground hover:border-black'
               }`}
             >
               {status === META_PRIORITY_STATUS ? 'priority intake' : status}
             </button>
          ))}
          <div className="px-5 py-3 bg-black text-white dark:bg-white dark:text-black font-bold text-[10px] uppercase tracking-widest rounded-xl border border-black dark:border-white whitespace-nowrap shadow-[0_10px_25px_rgba(0,0,0,0.08)]">
             {filteredLeads.length} Targets
          </div>
        </div>
      </div>

      {statusFilter === "called" && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {(["all", "hot", "cold", "followup"] as const).map((disposition) => (
            <button
              key={disposition}
              onClick={() => setCalledDispositionFilter(disposition)}
              className={`px-4 py-2.5 rounded-lg font-bold text-[9px] uppercase tracking-widest transition-all whitespace-nowrap border ${
                calledDispositionFilter === disposition
                  ? "bg-yellow-500 text-black border-yellow-500"
                  : "bg-background border-glass-border text-muted-foreground hover:border-yellow-500/60"
              }`}
            >
              {disposition}
            </button>
          ))}
        </div>
      )}

      {/* Grid of Minimal Lead Cards */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 hide-scrollbar">
        <AnimatePresence mode="popLayout">
          {filteredLeads.map((lead, idx) => {
             const isActive = activeLead?.id === lead.id;
             const notes = leadNotes[lead.id];
             const status = notes?.status || "new";
             const calledDisposition = notes?.called_disposition || null;
             const reviews = parseInt(lead["Google Reviews"]?.toString() || "0");
             const metaPriorityCreatedAt = resolveMetaPriorityCreatedAt(
               { meta_priority_created_at: lead.MetaPriorityCreatedAt },
               lead.CreatedAt,
             );
             const metaPrioritySla = getMetaPrioritySlaState(metaPriorityCreatedAt);

             return (
               <motion.div
                 key={lead.id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.03 }}
                 onClick={() => setActiveLead(lead)}
                 className={`glass-card relative p-0 overflow-hidden cursor-pointer group border transition-all duration-300 ${
                   isActive ? 'ring-2 ring-black dark:ring-white ring-offset-2 ring-offset-background shadow-[0_18px_50px_rgba(0,0,0,0.14)]' : 'hover:-translate-y-0.5 hover:shadow-[0_14px_38px_rgba(0,0,0,0.08)]'
                 }`}
               >
                 <div className={`pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent dark:via-white/25 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`} />
                 <div className="flex flex-col md:flex-row items-stretch">
                    {/* Status Dot Logic */}
                    <div className={`w-1.5 md:w-2 ${
                      status === META_PRIORITY_STATUS ? 'bg-orange-500' :
                      status === 'booked' ? 'bg-green-500' : 
                      status === 'called' ? 'bg-yellow-500' : 
                      status === 'ignored' ? 'bg-red-500' : 'bg-muted-foreground/10'
                    }`} />

                    <div className="flex-1 p-4 md:p-5 flex flex-col md:flex-row justify-between items-center gap-4">
                       <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 bg-secondary/50 rounded-xl flex items-center justify-center text-center border border-glass-border shrink-0">
                             <Briefcase size={18} className="text-muted-foreground" />
                          </div>

                          <div className="flex flex-col gap-1 min-w-0">
                             <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-bold tracking-tight uppercase leading-tight truncate max-w-full">{lead["Practice Name"]}</h3>
                                {reviews > 110 && (
                                   <Star size={12} className="text-black/20 dark:text-white/20 fill-current" />
                                )}
                                {isActive && (
                                  <div className="px-2 py-0.5 bg-black text-white dark:bg-white dark:text-black rounded text-[7px] font-black uppercase tracking-widest whitespace-nowrap">
                                    Active
                                  </div>
                                )}
                                {status === META_PRIORITY_STATUS && (
                                  <>
                                    <div className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-[7px] font-black text-orange-500 uppercase tracking-widest whitespace-nowrap">
                                      {META_PRIORITY_LANE_LABEL}
                                    </div>
                                    <div className="px-2 py-0.5 rounded border border-sky-500/20 bg-sky-500/10 text-[7px] font-black uppercase tracking-widest text-sky-400 whitespace-nowrap">
                                      {lead.PriorityOriginLabel || "Priority Lead"}
                                    </div>
                                    {lead.PriorityReadinessLabel && (
                                      <div className="px-2 py-0.5 rounded border border-white/10 bg-white/5 text-[7px] font-black uppercase tracking-widest text-white/65 whitespace-nowrap">
                                        {lead.PriorityReadinessLabel}
                                      </div>
                                    )}
                                    <div
                                      className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest whitespace-nowrap ${
                                        metaPrioritySla === "escalated"
                                          ? "bg-red-500/10 border border-red-500/20 text-red-500"
                                          : metaPrioritySla === "overdue"
                                            ? "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                                            : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
                                      }`}
                                    >
                                      {formatMetaPriorityAge(metaPriorityCreatedAt)}
                                    </div>
                                  </>
                                )}
                                {status === 'booked' && (
                                  <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[7px] font-black text-emerald-500 uppercase tracking-widest whitespace-nowrap">
                                    Booked
                                  </div>
                                )}
                                {status === 'called' && (
                                  <>
                                    <div className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[7px] font-black text-amber-500 uppercase tracking-widest whitespace-nowrap">
                                      Called
                                    </div>
                                    {calledDisposition && (
                                      <div className="px-2 py-0.5 bg-black/10 border border-glass-border rounded text-[7px] font-black text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                                        {calledDisposition}
                                      </div>
                                    )}
                                  </>
                                )}
                             </div>
                             <div className="flex flex-wrap items-center gap-3 text-[9px] font-bold text-muted-foreground uppercase tracking-[0.16em] leading-none">
                                <span className="flex items-center gap-1.5"><MapPin size={12} /> {lead.City}</span>
                                {lead["Google Maps URL"] && (
                                  <a
                                    href={lead["Google Maps URL"]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 opacity-60 transition-opacity hover:opacity-100"
                                  >
                                    <ExternalLink size={11} /> Maps
                                  </a>
                                )}
                                <span className="flex items-center gap-1.5 opacity-80"><User size={12} /> {lead["First Name"] || "Owner"}</span>
                                <span className="flex items-center gap-1.5 opacity-60">
                                  {status === META_PRIORITY_STATUS ? lead.PriorityOriginLabel || lead.Source || "manual" : lead.Source || "manual"}
                                </span>
                             </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                          {notes?.comment && (
                             <MessageSquare size={14} className="text-muted-foreground opacity-40" />
                          )}

                          <button
                            className="flex-1 md:flex-none bg-black text-white dark:bg-white dark:text-black font-bold uppercase text-[9px] tracking-[0.2em] px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:translate-y-[-1px] transition-all shadow-[0_10px_24px_rgba(0,0,0,0.12)] active:translate-y-0"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await startOutboundCall(lead);
                            }}
                          >
                             <Phone size={14} strokeWidth={2.5} /> Call
                          </button>

                          <div className="p-3 bg-secondary rounded-xl border border-glass-border group-hover:border-black transition-all">
                             <ChevronRight size={18} className="text-muted-foreground" />
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
