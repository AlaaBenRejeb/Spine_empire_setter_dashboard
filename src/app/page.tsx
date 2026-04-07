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
  Settings,
  Users
} from "lucide-react";
import LeadList from "@/components/LeadList";
import PersonalTasks from "@/components/PersonalTasks";
import AddLeadModal from "@/components/AddLeadModal";
import { useCRM } from "@/context/CRMContext";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

function formatTime12Hour(time24: string) {
  if (!time24) return "09:00 AM";
  let [hours, minutes] = time24.split(":");
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

export default function SetterDashboardContent() {
  const { activeLead, setActiveLead, leadNotes, updateLeadNote, assignedCloserName, leads, totalLeadsCount, user, userPerformance, liveMetrics, isSyncing } = useCRM();
  const { loading } = useAuth();
  const [noteText, setNoteText] = useState("");
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);

  const totalBooked = liveMetrics.totalBooked || 0;
  const powerScore = liveMetrics.powerScore || 0;
  const revenue = liveMetrics.projectedRevenue || 0;
  const conversionRate = liveMetrics.conversionRate || 0;

  const prevActiveLeadId = useRef<string | null>(null);

  useEffect(() => {
    // 1. Auto-save current notes for the PREVIOUS lead before switching
    if (prevActiveLeadId.current && prevActiveLeadId.current !== activeLead?.id) {
      const existingLead = leadNotes[prevActiveLeadId.current];
      const currentStatus = existingLead?.status || "called";
      updateLeadNote(prevActiveLeadId.current, { status: currentStatus, comment: noteText });
    }

    // 2. Load notes for the NEW active lead
    if (activeLead) {
      setNoteText(leadNotes[activeLead.id]?.comment || "");
      prevActiveLeadId.current = activeLead.id;
    } else {
      prevActiveLeadId.current = null;
    }
  }, [activeLead?.id]);

  const handleStatusUpdate = (status: string) => {
    if (activeLead) {
      const updates: any = { status, comment: noteText };
      if (status === "booked") {
        updates.scheduled_time = `${scheduledDate} @ ${formatTime12Hour(scheduledTime)}`; 
      }
      updateLeadNote(activeLead.id, updates);
    }
  };

  const stats = [
    { label: "Target Market", value: (totalLeadsCount || 0).toLocaleString(), icon: <Target size={18} />, desc: "Total Pool" },
    { label: "Power Score", value: powerScore, icon: <Activity size={18} />, desc: "Intel Score" },
    { label: "Demos Booked", value: totalBooked.toLocaleString(), icon: <Calendar size={18} />, desc: "Success" },
    { label: "Rev Collected", value: `$${revenue.toLocaleString()}`, icon: <TrendingUp size={18} />, desc: "Total" }
  ];

  if (loading) return null;

  return (
    <main className="flex-1 bg-[#050505] min-h-screen lg:h-screen p-4 md:p-6 lg:p-4 overflow-y-auto lg:overflow-hidden flex flex-col gap-4">
      {/* Header Section - Ultra Compact */}
      <div className="hidden lg:flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1.5">
            <img src="/logo.png" alt="Empire" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white uppercase italic leading-tight">Revenue Engine</h1>
            <p className="text-[9px] text-white/40 font-medium uppercase tracking-[0.2em]">Dialer Terminal Alpha</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAddLeadModalOpen(true)}
            className="px-4 py-2 bg-white text-black font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-white/90 transition-all flex items-center gap-2"
          >
            <UserPlus size={12} strokeWidth={3} /> Add Lead
          </button>
          <div className="h-8 w-[1px] bg-white/10 mx-1" />
          
          {assignedCloserName && (
            <div className="flex flex-col text-right">
              <div className="text-[8px] font-black uppercase text-emerald-500/60 tracking-widest leading-none">Flow Target</div>
              <div className="flex items-center justify-end gap-1 mt-1">
                <Users size={10} className="text-emerald-500" />
                <span className="text-[9px] font-black text-white uppercase italic tracking-tighter">Closer: {assignedCloserName}</span>
              </div>
            </div>
          )}

          <div className="h-8 w-[1px] bg-white/10 mx-1" />
          <div className="text-right">
            <div className="text-[8px] font-black uppercase text-white/20 tracking-widest leading-none">Intelligence Sync</div>
            <div className="flex items-center justify-end gap-1 mt-1">
              <div className={`w-1 h-1 rounded-full animate-pulse ${isSyncing ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <span className="text-[9px] font-bold text-white uppercase italic tracking-tighter">
                {isSyncing ? 'SYNCING...' : 'SYNCHRONIZED'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Ultra Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white/5 border border-white/10 p-3 rounded-xl group hover:bg-white/10 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="p-1.5 bg-white/5 rounded-lg text-white/40 group-hover:text-white transition-colors">
                {stat.icon}
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-white/10">{stat.desc}</span>
            </div>
            <div className="text-lg md:text-xl font-black text-white italic tracking-tighter leading-none">{stat.value}</div>
            <div className="text-[8px] font-bold uppercase text-white/30 mt-1 tracking-wider">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* CRM Workspace - Compact Layout */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0 overflow-hidden">
        {/* Main List Area */}
        <div className={`${activeLead ? 'col-span-12 lg:col-span-4' : 'col-span-12 lg:col-span-8'} flex flex-col min-h-0 transition-all duration-500`}>
           <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col h-full backdrop-blur-sm relative">
              <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-white/40" />
                  <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 italic">Target Grid</h2>
                </div>
              </div>
              <div className="flex-1 overflow-auto custom-scrollbar">
                <LeadList />
              </div>
           </div>
        </div>

        {/* Active Panel Area */}
        <div className={`${activeLead ? 'col-span-12 lg:col-span-8' : 'hidden lg:flex lg:col-span-4'} flex flex-col min-h-0 transition-all duration-500`}>
           <AnimatePresence mode="wait">
             {activeLead ? (
               <motion.div 
                 key={activeLead.id}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 20 }}
                 className="flex-1 flex flex-col gap-4 p-6 bg-white/5 border border-white/10 rounded-xl relative overflow-hidden"
               >
                   <button onClick={() => setActiveLead(null)} className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors">
                     <XCircle size={20} strokeWidth={2} />
                   </button>

                   <div className="flex flex-col gap-1">
                     <span className="text-[8px] font-black text-emerald-500/60 tracking-[0.4em] uppercase flex items-center gap-2 italic">
                       <Flame size={10} className="text-emerald-500" /> Active Intel Node
                     </span>
                     <h2 className="text-2xl md:text-3xl font-black tracking-tighter leading-tight uppercase italic text-white truncate pr-10">{activeLead["Practice Name"]}</h2>
                     <p className="text-[9px] text-white/20 uppercase tracking-[0.3em] font-bold">{activeLead.City} • {activeLead.Phone}</p>
                   </div>

                   <div className="grid grid-cols-4 gap-2 shrink-0">
                     {[
                       { id: 'booked', label: 'BOOKED', icon: CheckCircle2, color: 'bg-white text-black' },
                       { id: 'called', label: 'CALLED', icon: PhoneOutgoing, color: 'bg-white/10 text-white' },
                       { id: 'ignored', label: 'IGNORE', icon: XCircle, color: 'bg-white/5 text-white/40' },
                       { id: 'reset', label: 'RESET', icon: RotateCcw, color: 'bg-red-500/10 text-red-500' }
                     ].map((btn) => (
                       <button 
                         key={btn.id}
                         onClick={() => btn.id === 'reset' ? updateLeadNote(activeLead.id, { status: 'new', comment: '' }) : handleStatusUpdate(btn.id)}
                         className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border transition-all duration-300 ${leadNotes[activeLead.id]?.status === btn.id ? btn.color + ' border-transparent' : 'bg-transparent border-white/5 hover:border-white/20 text-white/40 hover:text-white'}`}
                       >
                          <btn.icon size={18} strokeWidth={2.5} />
                          <span className="text-[8px] font-black uppercase tracking-widest">{btn.label}</span>
                       </button>
                     ))}
                   </div>

                   <div className="flex flex-col gap-3 flex-1 min-h-0">
                     <div className="flex flex-col gap-2 p-4 bg-white rounded-lg text-black shrink-0">
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-40">System Scheduler</span>
                        <div className="grid grid-cols-2 gap-2">
                           <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="bg-black/5 border border-black/5 p-2 rounded text-[10px] font-bold outline-none" />
                           <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="bg-black/5 border border-black/5 p-2 rounded text-[10px] font-bold outline-none" />
                        </div>
                     </div>
                     
                     <textarea 
                       value={noteText}
                       onChange={(e) => setNoteText(e.target.value)}
                       onBlur={() => handleStatusUpdate(leadNotes[activeLead.id]?.status || "called")}
                       placeholder="Log intelligence..."
                       className="flex-1 bg-white/5 border border-white/10 p-4 rounded-lg text-xs font-medium text-white placeholder:text-white/10 focus:border-white/20 outline-none transition-all resize-none custom-scrollbar min-h-0"
                     />
                   </div>

                   <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg flex items-center justify-between shrink-0">
                     <div className="flex flex-col">
                       <span className="text-[7px] font-black uppercase tracking-widest text-emerald-400 leading-none">Security Node</span>
                       <span className="text-[9px] font-black text-white/60">ENCRYPTED NEXUS SYNC ACTIVE</span>
                     </div>
                     <Zap size={14} className="text-emerald-400 animate-pulse" />
                   </div>
               </motion.div>
             ) : (
               <motion.div 
                 key="tasks"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="flex-1 flex flex-col gap-3 bg-white/5 border border-white/10 p-5 rounded-xl min-h-0 overflow-hidden"
               >
                   <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 mb-2 italic">Ops Checklist</h2>
                   <div className="flex-1 overflow-auto custom-scrollbar">
                     <PersonalTasks theme="dark" />
                   </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
      
      <AddLeadModal isOpen={isAddLeadModalOpen} onClose={() => setIsAddLeadModalOpen(false)} />
    </main>
  );
}
