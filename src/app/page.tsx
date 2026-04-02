"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  PhoneCall, 
  Calendar, 
  Target, 
  TrendingUp, 
  BarChart3, 
  CheckSquare, 
  Zap, 
  Activity, 
  MessageSquare, 
  PhoneOutgoing, 
  UserPlus, 
  XCircle, 
  CheckCircle2, 
  RotateCcw,
  LayoutDashboard,
  ChevronRight,
  Flame,
  ArrowUpRight,
  LogOut,
  Settings
} from "lucide-react";
import LeadList from "@/components/LeadList";
import PersonalTasks from "@/components/PersonalTasks";
import AddLeadModal from "@/components/AddLeadModal";
import { useCRM } from "@/context/CRMContext";
import { useState, useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

function formatTime12Hour(time24: string) {
  if (!time24) return "09:00 AM";
  let [hours, minutes] = time24.split(":");
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

export default function SetterDashboardContent() {
  const { activeLead, setActiveLead, leadNotes, updateLeadNote } = useCRM();
  const [supabase] = useState(() => createClient());
  const [noteText, setNoteText] = useState("");
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);

  const notes = Object.values(leadNotes);
  const totalDials = notes.filter(n => n.status !== "new").length;
  const totalBooked = notes.filter(n => n.status === "booked").length;

  useEffect(() => {
    const fetchLeadCount = async () => {
      const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });
      if (count !== null) setTotalLeads(count);
    };
    fetchLeadCount();
  }, []);

  useEffect(() => {
    if (activeLead) {
      setNoteText(leadNotes[activeLead.Email]?.comment || "");
    }
  }, [activeLead, leadNotes]);

  const handleStatusUpdate = (status: string) => {
    if (activeLead) {
      const updates: any = { status, comment: noteText };
      if (status === "booked") {
        updates.scheduled_time = `${scheduledDate} @ ${formatTime12Hour(scheduledTime)}`; 
      }
      updateLeadNote(activeLead.Email, updates);
    }
  };

  const stats = [
    { label: "Target Market", value: totalLeads.toString(), icon: <Target size={20} />, desc: "Total Pool" },
    { label: "Dials Today", value: totalDials.toString(), icon: <PhoneCall size={20} />, desc: "Outreach" },
    { label: "Demos Booked", value: totalBooked.toString(), icon: <Calendar size={20} />, desc: "Success" },
    { label: "Win Opportunity", value: `$${(totalBooked * 4000 / 1000).toFixed(1)}K`, icon: <TrendingUp size={20} />, desc: "Projected" }
  ];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto hide-scrollbar custom-scrollbar bg-black">
      <header className="p-12 pb-6 flex justify-between items-end sticky top-0 bg-black/80 backdrop-blur-md z-40 border-b border-glass-border">
        <div className="flex flex-col gap-2">
           <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl font-heading font-black tracking-tighter uppercase leading-none"
          >
            Setter <span className="text-gradient">Empire.</span>
          </motion.h1>
          <p className="text-white/40 font-black text-[10px] tracking-[0.5em] uppercase ml-1 italic leading-none mt-1">Obsidian Elite Dialing Terminal</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="px-10 py-6 rounded-[2.5rem] border border-white/10 bg-white/5 flex flex-col items-center justify-center min-w-[160px]">
             <span className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-30 text-white">Status</span>
             <span className="text-2xl font-heading font-black italic tracking-tighter leading-none text-white animate-pulse">ACTIVE</span>
          </div>
        </div>
      </header>

      <div className="p-12 pt-12 flex flex-col gap-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-card p-10 flex flex-col gap-8 relative overflow-hidden group border-white/5 hover:border-white/20"
            >
               <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-2">
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 text-white">{stat.label}</span>
                     <div className="text-5xl font-heading font-black italic tracking-tighter leading-none text-white group-hover:text-gradient transition-all">{stat.value}</div>
                  </div>
                  <div className="p-5 text-white/10 group-hover:text-white transition-colors duration-500">
                    {stat.icon}
                  </div>
               </div>
               <div className="pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/30 italic">
                  {stat.desc}
                  <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-white" />
               </div>
            </motion.div>
          ))}
        </div>

        {/* CRM Workspace */}
        <div className="grid grid-cols-12 gap-12 min-h-[700px] mb-20">
          {/* Lead Matrix */}
          <div className={`${activeLead ? 'col-span-12 lg:col-span-5' : 'col-span-12 lg:col-span-8'} flex flex-col gap-8 transition-all duration-700`}>
              <div className="flex justify-between items-center px-2">
                <h2 className="text-sm font-heading font-black uppercase tracking-[0.4em] text-white flex items-center gap-4 italic">
                  <BarChart3 size={20} className="text-white/20" /> CRM Target Matrix
                </h2>
                <button 
                  onClick={() => setIsAddLeadModalOpen(true)}
                  className="px-8 py-5 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-3xl hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all active:scale-95 flex items-center gap-3"
                >
                  <UserPlus size={14} strokeWidth={3} /> Quick Add Lead
                </button>
              </div>
              <div className="glass-card p-0 flex-1 overflow-hidden transition-all duration-300">
                <LeadList />
              </div>
          </div>

          {/* Outcome Engine (Logger) */}
          <AnimatePresence mode="wait">
            {activeLead && (
              <motion.div 
                key={activeLead.Email}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="col-span-12 lg:col-span-7 flex flex-col gap-10 p-12 glass-card bg-white/5 border-white/10 relative overflow-hidden"
              >
                 <button onClick={() => setActiveLead(null)} className="absolute top-10 right-10 text-white/20 hover:text-white transition-colors duration-300">
                   <XCircle size={32} strokeWidth={1.5} />
                 </button>

                 <div className="flex flex-col gap-4">
                    <span className="text-[12px] font-black text-white/30 tracking-[0.6em] uppercase flex items-center gap-3 italic">
                      <Flame size={16} className="text-white" /> Active Intelligence Node
                    </span>
                    <h2 className="text-6xl font-heading font-black tracking-tighter leading-none uppercase italic truncate text-white">{activeLead["Practice Name"]}</h2>
                    <p className="text-[12px] text-white/20 uppercase tracking-[0.4em] font-black">{activeLead.City} • {activeLead.Phone}</p>
                 </div>

                 {/* Status Matrix */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { id: 'booked', label: 'BOOKED', icon: CheckCircle2, color: 'bg-white text-black' },
                      { id: 'called', label: 'CALLED', icon: PhoneOutgoing, color: 'bg-white/10 text-white' },
                      { id: 'ignored', label: 'IGNORE', icon: XCircle, color: 'bg-white/5 text-white/40' },
                    ].map((btn) => (
                      <button 
                        key={btn.id}
                        onClick={() => handleStatusUpdate(btn.id)}
                        className={`flex flex-col items-center justify-center gap-3 p-8 rounded-3xl border transition-all duration-500 overflow-hidden group ${leadNotes[activeLead.Email]?.status === btn.id ? btn.color + ' border-transparent shadow-[0_0_30px_rgba(255,255,255,0.15)]' : 'bg-transparent border-white/5 hover:border-white/20'}`}
                      >
                         <btn.icon size={28} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                         <span className="text-[10px] font-black uppercase tracking-[0.2em]">{btn.label}</span>
                      </button>
                    ))}
                    <button 
                      onClick={() => {
                          setNoteText("");
                          updateLeadNote(activeLead.Email, { status: "new", comment: "" });
                      }}
                      className="flex flex-col items-center justify-center gap-3 p-8 rounded-3xl border border-white/5 bg-transparent hover:border-red-500/50 hover:bg-red-500/5 transition-all text-white/20 hover:text-red-500 duration-500 group"
                    >
                       <RotateCcw size={28} strokeWidth={2} className="group-hover:rotate-180 transition-transform" />
                       <span className="text-[10px] font-black uppercase tracking-[0.2em]">RESET</span>
                    </button>
                 </div>

                 {/* Scheduler High-Fidelity */}
                 <div className="flex flex-col gap-6 p-10 glass-card bg-white text-black border-none shadow-[0_0_60px_rgba(255,255,255,0.05)]">
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-black uppercase tracking-widest text-black flex items-center gap-4 italic font-heading">
                        <Calendar size={20} strokeWidth={3} /> SYSTEM SCHEDULER
                      </span>
                      <div className="w-2 h-2 rounded-full bg-black animate-ping" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8">
                       <div className="flex flex-col gap-3">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Appointment Date</span>
                          <input 
                            type="date" 
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="bg-black/5 border border-black/5 focus:border-black p-6 rounded-2xl text-sm font-black text-black outline-none transition-all w-full font-sans"
                          />
                       </div>
                       <div className="flex flex-col gap-3">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Time Block</span>
                          <input 
                            type="time" 
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="bg-black/5 border border-black/5 focus:border-black p-6 rounded-2xl text-sm font-black text-black outline-none transition-all w-full font-sans"
                          />
                       </div>
                    </div>
                 </div>

                 {/* Interaction Matrix */}
                 <div className="flex flex-col gap-6 flex-1 min-h-[250px]">
                    <div className="flex justify-between items-end px-2">
                      <span className="text-[12px] font-black uppercase tracking-[0.4em] text-white/30 italic">Intelligence Log</span>
                      <MessageSquare size={16} className="text-white/10" />
                    </div>
                    <textarea 
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      onBlur={() => handleStatusUpdate(leadNotes[activeLead.Email]?.status || "called")}
                      placeholder="LOG OBJECTIONS, GATEKEEPER INTEL, OR NEXUS POINTS..."
                      className="flex-1 bg-white/5 border border-white/5 p-10 rounded-[2.5rem] text-lg font-bold text-white placeholder:italic placeholder:text-white/10 focus:border-white/20 outline-none transition-all resize-none shadow-inner custom-scrollbar font-sans"
                    />
                 </div>

                 <div className="p-10 glass-card bg-emerald-500/5 border-emerald-500/10 flex items-center justify-between group">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Persistence Engine</span>
                      <span className="text-sm font-heading font-black uppercase italic text-white/80">REAL-TIME NEXUS SYNC ACTIVE</span>
                    </div>
                    <Zap size={24} className="text-emerald-400 animate-pulse group-hover:scale-125 transition-transform" />
                 </div>
              </motion.div>
            )}

            {/* Today's Stats & Tasks */}
            {!activeLead && (
              <motion.div 
                key="tasks"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="col-span-12 lg:col-span-4 flex flex-col gap-10"
              >
                <div className="glass-card p-12 flex flex-col overflow-hidden h-full">
                    <div className="flex justify-between items-center mb-10">
                      <h2 className="text-sm font-heading font-black uppercase tracking-[0.4em] text-white flex items-center gap-4 italic">
                        <CheckSquare size={20} className="text-white/20" /> Operations
                      </h2>
                    </div>
                    <div className="flex-1 overflow-hidden transition-all custom-scrollbar">
                      <PersonalTasks theme="dark" />
                    </div>
                </div>
                
                <div className="glass-card p-10 bg-white text-black flex items-center justify-between border-none shadow-[0_0_50px_rgba(255,255,255,0.05)]">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Session Target</span>
                      <span className="text-2xl font-heading font-black uppercase italic tracking-tighter leading-none">100 DIALS GOAL</span>
                    </div>
                    <div className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center">
                      <Activity size={24} className="text-black" />
                    </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <AddLeadModal 
        isOpen={isAddLeadModalOpen} 
        onClose={() => setIsAddLeadModalOpen(false)} 
      />
    </div>
  );
}
