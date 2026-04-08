"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  MoreHorizontal,
  ChevronRight,
  Search,
  Plus,
  Target,
  MapPin,
  User,
  Mail,
  DollarSign,
  Phone,
  ArrowLeftRight,
  CheckCircle2,
  X,
  MessageSquare,
  Clock3,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import FollowUpModal from "@/components/FollowUpModal";
import { useEffect, useMemo, useState } from "react";

const COLUMNS = [
  { id: "new", title: "Market Targets", color: "bg-primary" },
  { id: "called", title: "Active Pipeline", color: "bg-yellow-500" },
  { id: "booked", title: "Elite Bookings", color: "bg-green-500" },
  { id: "ignored", title: "Archived Ops", color: "bg-red-500" },
];

const CALLED_DISPOSITIONS = ["hot", "cold", "followup"] as const;

const toFollowUpLead = (lead: any) => ({
  Email: lead.Email || "",
  "First Name": lead["First Name"] || "Doctor",
  "Practice Name": lead["Practice Name"] || "Clinic",
  Phone: lead.Phone || "",
  City: lead.City || "",
});

export default function DealsPage() {
  const { leads, leadNotes, updateLeadNote, startOutboundCall, logOutboundMessage } = useCRM();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [followUpTab, setFollowUpTab] = useState<"email" | "sms">("email");
  const [stageSelectorId, setStageSelectorId] = useState<string | null>(null);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [panelNote, setPanelNote] = useState("");

  const expandedLead = useMemo(
    () => leads.find((lead) => lead.id === expandedLeadId) || null,
    [leads, expandedLeadId],
  );

  useEffect(() => {
    if (!expandedLead) {
      setPanelNote("");
      return;
    }
    setPanelNote(leadNotes[expandedLead.id]?.comment || "");
  }, [expandedLead, leadNotes]);

  const getLeadsByStatus = (status: string) => {
    return leads.filter((lead) => {
      const notes = leadNotes[lead.id];
      const leadStatus = notes?.status || "new";
      return leadStatus === status;
    });
  };

  const updateCalledDisposition = async (lead: any, disposition: (typeof CALLED_DISPOSITIONS)[number]) => {
    await updateLeadNote(lead.id, {
      status: "called",
      called_disposition: disposition,
      comment: panelNote,
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-screen bg-transparent">
      <header className="flex justify-between items-end p-8 md:p-12 pb-2 shrink-0">
        <div className="flex flex-col gap-2">
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl font-heading font-black tracking-tighter uppercase leading-none"
          >
            Visual <span className="text-gradient">Pipeline.</span>
          </motion.h1>
          <p className="text-muted-foreground font-black text-[10px] tracking-[0.5em] uppercase opacity-40 ml-1">
            Total Market Control Manager
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative group hidden xl:block">
            <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-all" />
            <input
              type="text"
              placeholder="Search Deals..."
              className="bg-secondary/50 border-2 border-glass-border pl-16 pr-8 py-5 rounded-2xl text-xs font-black tracking-widest uppercase focus:border-primary outline-none transition-all w-96 shadow-xl focus:shadow-primary/5"
            />
          </div>
          <button className="bg-black text-white dark:bg-primary dark:text-black font-black text-xs px-10 py-5 rounded-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl uppercase tracking-widest border-2 border-glass-border">
            <Plus size={20} strokeWidth={3} /> Create Deal
          </button>
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden">
        <div
          className={`h-full overflow-x-auto overflow-y-hidden flex gap-8 p-8 md:p-12 pt-4 pb-16 scroll-smooth snap-x custom-scrollbar transition-all ${
            expandedLead ? "pr-[440px]" : ""
          }`}
        >
          {COLUMNS.map((col, colIdx) => {
            const leadsForColumn = getLeadsByStatus(col.id);
            return (
              <div key={col.id} className="min-w-[380px] max-w-[400px] flex-shrink-0 flex flex-col gap-6 snap-start">
                <div className="flex justify-between items-center px-4">
                  <div className="flex items-center gap-4 group">
                    <div className={`w-3 h-3 rounded-none ${col.color} animate-pulse border-2 border-black`} />
                    <h3 className="font-heading font-black text-sm tracking-widest uppercase italic group-hover:text-primary transition-colors">
                      {col.title}
                    </h3>
                    <span className="bg-black text-white px-3 py-1 text-[10px] font-black italic shadow-lg">
                      {leadsForColumn.length}
                    </span>
                  </div>
                  <button className="text-muted-foreground hover:text-foreground transition-colors p-2 bg-secondary/50 rounded-xl">
                    <MoreHorizontal size={18} />
                  </button>
                </div>

                <div className="flex-1 bg-secondary/30 rounded-3xl border-2 border-glass-border p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar group-hover:border-primary/20 transition-all hover:bg-secondary/50 shadow-inner translate-z-0">
                  {leadsForColumn.map((lead: any, idx) => (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, scale: 0.9, y: 30 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 + colIdx * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => setExpandedLeadId(lead.id)}
                      className={`glass-card p-0 overflow-hidden cursor-pointer group relative hover:z-50 flex-shrink-0 ${
                        expandedLeadId === lead.id ? "ring-2 ring-primary/50" : ""
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className={`h-2.5 w-full ${col.color} opacity-80 group-hover:opacity-100 transition-opacity`} />

                        <div className="p-8 flex flex-col gap-5">
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-muted-foreground font-black tracking-widest uppercase opacity-60 flex items-center gap-2">
                                <MapPin size={10} /> {lead.City}
                              </span>
                              <h4 className="font-heading font-black text-lg tracking-tight leading-[1.1] group-hover:text-primary transition-colors uppercase italic pt-2">
                                {lead["Practice Name"]}
                              </h4>
                              <span className="text-[9px] text-muted-foreground uppercase tracking-widest opacity-60">
                                Source: {lead.Source || "manual"}
                              </span>
                            </div>
                            <ChevronRight size={20} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>

                          <div className="flex items-center gap-4 pt-4 border-t border-glass-border">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/[0.03] dark:bg-white/5 border border-glass-border rounded-lg shadow-sm truncate max-w-[130px]">
                              <User size={12} className="text-primary shrink-0" />
                              <span className="text-[10px] font-black text-muted-foreground truncate">{lead["First Name"] || "Owner"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg shadow-sm group/val relative">
                              <DollarSign size={12} className="text-primary" />
                              <input
                                type="text"
                                defaultValue={leadNotes[lead.id]?.deal_value || lead.DealValue || 4000}
                                onBlur={(e) => {
                                  const val = parseInt(e.target.value.replace(/\D/g, ""), 10);
                                  updateLeadNote(lead.id, { deal_value: val || 4000 });
                                }}
                                className="text-[10px] font-black text-primary bg-transparent border-none outline-none w-14 focus:ring-0 p-0"
                              />
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] font-black uppercase px-2 py-1 rounded opacity-0 group-hover/val:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Edit Value
                              </div>
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await startOutboundCall(lead, { meta: { origin: "deals_card_call" } });
                                }}
                                className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg hover:scale-110 active:scale-95"
                                title="Call Lead"
                              >
                                <Phone size={14} strokeWidth={3} />
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await logOutboundMessage(lead, { kind: "email", meta: { origin: "deals_card_message" } });
                                  setSelectedLead(lead);
                                  setFollowUpTab("email");
                                  setIsFollowUpOpen(true);
                                }}
                                className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:scale-110 active:scale-95"
                                title="Email Script"
                              >
                                <Mail size={14} strokeWidth={3} />
                              </button>
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setStageSelectorId(stageSelectorId === lead.id ? null : lead.id);
                                  }}
                                  className={`p-2.5 rounded-xl transition-all shadow-lg hover:scale-110 active:scale-95 ${
                                    stageSelectorId === lead.id ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
                                  }`}
                                  title="Move Stage"
                                >
                                  <ArrowLeftRight size={14} strokeWidth={3} />
                                </button>
                                <AnimatePresence>
                                  {stageSelectorId === lead.id && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                      className="absolute bottom-12 right-0 bg-[#1a1a1a] border border-glass-border p-2 rounded-xl shadow-2xl z-[100] min-w-[160px] flex flex-col gap-1"
                                    >
                                      {COLUMNS.filter((column) => column.id !== (leadNotes[lead.id]?.status || "new")).map((column) => (
                                        <button
                                          key={column.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateLeadNote(lead.id, { status: column.id });
                                            setStageSelectorId(null);
                                          }}
                                          className="flex items-center justify-between px-3 py-2 hover:bg-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-all group"
                                        >
                                          {column.title}
                                          <CheckCircle2 size={12} className="opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                                        </button>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {leadsForColumn.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-10 filter grayscale group-hover:opacity-20 transition-all">
                      <Target size={64} strokeWidth={4} className="mb-6 animate-pulse" />
                      <span className="text-sm font-black uppercase tracking-[0.4em] italic">No active frequency detected</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <AnimatePresence>
          {expandedLead && (
            <motion.aside
              initial={{ x: 420, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 420, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="absolute top-0 right-0 h-full w-full max-w-[420px] border-l border-glass-border bg-[#0f0f0f]/95 backdrop-blur-xl p-6 overflow-y-auto custom-scrollbar z-40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-black">Lead Inspector</p>
                  <h3 className="text-2xl font-heading font-black uppercase italic leading-tight mt-1">{expandedLead["Practice Name"]}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2">
                    {expandedLead.City || "Unknown City"} • {expandedLead.Phone || "No Phone"}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                    Source: {expandedLead.Source || "manual"}
                  </p>
                </div>
                <button
                  onClick={() => setExpandedLeadId(null)}
                  className="p-2 rounded-xl border border-glass-border hover:border-white/40 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={async () => {
                    await startOutboundCall(expandedLead, { meta: { origin: "deals_drawer_call" } });
                  }}
                  className="px-4 py-3 rounded-xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors"
                >
                  <Phone size={14} /> Call
                </button>
                <button
                  onClick={async () => {
                    await logOutboundMessage(expandedLead, { kind: "email", meta: { origin: "deals_drawer_message" } });
                    setSelectedLead(expandedLead);
                    setFollowUpTab("email");
                    setIsFollowUpOpen(true);
                  }}
                  className="px-4 py-3 rounded-xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-500 transition-colors"
                >
                  <MessageSquare size={14} /> Message
                </button>
              </div>

              <div className="mt-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Pipeline Stage</p>
                <div className="grid grid-cols-2 gap-2">
                  {COLUMNS.map((column) => {
                    const active = (leadNotes[expandedLead.id]?.status || "new") === column.id;
                    return (
                      <button
                        key={column.id}
                        onClick={() => updateLeadNote(expandedLead.id, { status: column.id })}
                        className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                          active ? "bg-white text-black border-white" : "bg-transparent border-glass-border text-muted-foreground hover:border-white/40"
                        }`}
                      >
                        {column.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Called Disposition</p>
                <div className="grid grid-cols-3 gap-2">
                  {CALLED_DISPOSITIONS.map((disposition) => {
                    const active = (leadNotes[expandedLead.id]?.called_disposition || null) === disposition;
                    return (
                      <button
                        key={disposition}
                        onClick={() => updateCalledDisposition(expandedLead, disposition)}
                        className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                          active ? "bg-yellow-500 text-black border-yellow-500" : "bg-transparent border-glass-border text-muted-foreground hover:border-yellow-500/50"
                        }`}
                      >
                        {disposition}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => updateLeadNote(expandedLead.id, { called_disposition: null })}
                  className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-white transition-colors"
                >
                  Clear disposition
                </button>
              </div>

              <div className="mt-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Lead Notes</p>
                <textarea
                  value={panelNote}
                  onChange={(e) => setPanelNote(e.target.value)}
                  onBlur={() => updateLeadNote(expandedLead.id, { comment: panelNote })}
                  className="w-full h-44 rounded-xl bg-black/20 border border-glass-border p-4 text-sm font-medium placeholder:text-muted-foreground/40 outline-none focus:border-white/30 transition-colors resize-none"
                  placeholder="Log call context, objections, and next step..."
                />
              </div>

              <div className="mt-6 p-4 rounded-xl border border-glass-border bg-black/20">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Last Call Timestamp</p>
                <p className="text-xs font-bold mt-1">
                  {leadNotes[expandedLead.id]?.synced_at ? new Date(leadNotes[expandedLead.id].synced_at).toLocaleString() : "No call sync yet"}
                </p>
                <p className="text-[10px] mt-2 text-muted-foreground flex items-center gap-2">
                  <Clock3 size={11} /> Calls are now tracked in interaction history with exact times.
                </p>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <FollowUpModal
        isOpen={isFollowUpOpen}
        onClose={() => setIsFollowUpOpen(false)}
        lead={selectedLead ? toFollowUpLead(selectedLead) : null}
        defaultTab={followUpTab}
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </div>
  );
}
