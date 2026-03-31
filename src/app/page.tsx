"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PhoneCall, Calendar, Target, TrendingUp, BarChart3, CheckSquare, Zap, Activity, MessageSquare, PhoneOutgoing, UserPlus, XCircle, CheckCircle2, RotateCcw } from "lucide-react";
import LeadList from "@/components/LeadList";
import PersonalTasks from "@/components/PersonalTasks";
import AddLeadModal from "@/components/AddLeadModal";
import LoginScreen from "@/components/LoginScreen";
import { useCRM } from "@/context/CRMContext";
import { useState, useEffect } from "react";

function formatTime12Hour(time24: string) {
  if (!time24) return "09:00 AM";
  let [hours, minutes] = time24.split(":");
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

function SetterDashboardContent() {
  const { activeLead, setActiveLead, leadNotes, updateLeadNote } = useCRM();
  const [noteText, setNoteText] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);

  const notes = Object.values(leadNotes);
  const totalDials = notes.filter(n => n.status !== "new").length;
  const totalBooked = notes.filter(n => n.status === "booked").length;
  const totalLeads = 982;

  // Sync noteText when activeLead changes
  useEffect(() => {
    if (activeLead) {
      setNoteText(leadNotes[activeLead.Email]?.comment || "");
    }
  }, [activeLead, leadNotes]);

  const handleStatusUpdate = (status: string) => {
    if (activeLead) {
      const updates: any = { status, comment: noteText };
      if (status === "booked") {
        updates.scheduled_time = formatTime12Hour(scheduledTime); 
      }
      updateLeadNote(activeLead.Email, updates);
    }
  };

  const stats = [
    { label: "Target Market", value: totalLeads.toString(), icon: <Target />, color: "text-foreground", desc: "Total Pool" },
    { label: "Dials Today", value: totalDials.toString(), icon: <PhoneCall />, color: "text-foreground", desc: "Outreach" },
    { label: "Demos Booked", value: totalBooked.toString(), icon: <Calendar />, color: "text-foreground", desc: "Success" },
    { label: "Win Opportunity", value: `$${(totalBooked * 4000).toLocaleString()}`, icon: <TrendingUp />, color: "text-foreground", desc: "Projected" }
  ];

  return (
    <div className="flex-1 flex flex-col gap-10 p-8 md:p-12 overflow-y-auto hide-scrollbar h-screen">
      {/* Minimal Elite Header (No Theme Toggle) */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col gap-1">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-heading font-bold tracking-tight leading-none"
          >
            Welcome, Alex.
          </motion.h1>
          <p className="text-muted-foreground font-bold text-[10px] tracking-widest uppercase opacity-40 ml-1">Spine Empire Sales Engine</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="glass-card px-8 py-5 rounded-xl flex items-center gap-4 border border-glass-border">
            <Zap className="text-foreground" size={20} strokeWidth={2.5} />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Status</span>
              <span className="text-xs font-bold tracking-widest uppercase">PRO ACTIVE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card p-8 flex flex-col gap-6"
          >
            <div className="flex justify-between items-start">
               <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase leading-none opacity-60">{stat.label}</span>
                  <div className="text-4xl font-heading font-bold tracking-tight">{stat.value}</div>
               </div>
               <div className="p-4 bg-secondary/50 rounded-xl border border-glass-border">
                {stat.icon}
              </div>
            </div>
            <div className="pt-4 border-t border-glass-border flex justify-between items-center text-[10px]">
              <span className="text-muted-foreground font-bold uppercase tracking-widest opacity-40">{stat.desc}</span>
              <div className="font-bold text-green-500 bg-green-500/5 px-3 py-1 rounded-full">+Active</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main CRM Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[700px] mb-20">
        
        {/* Lead List Column */}
        <div className={`lg:col-span-2 glass-card p-10 flex flex-col overflow-hidden transition-all duration-500 ${activeLead ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-xl font-heading font-bold flex items-center gap-4 tracking-tight uppercase leading-none">
              <BarChart3 className="text-foreground opacity-20" size={24} />
              CRM TARGET LIST
            </h2>
            <button 
              onClick={() => setIsAddLeadModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-green-400 transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)] active:scale-95"
            >
              <UserPlus size={14} strokeWidth={3} />
              QUICK ADD
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <LeadList />
          </div>
        </div>

        {/* Dynamic Outcome Logger (Alex's New Command Output) */}
        <AnimatePresence>
          {activeLead && (
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="lg:col-span-1 glass-card p-10 flex flex-col gap-8 bg-black/40 border-primary/20 shadow-2xl relative"
            >
               <button onClick={() => setActiveLead(null)} className="absolute top-6 right-6 text-muted-foreground hover:text-white transition-colors">
                 <XCircle size={24} />
               </button>

               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-primary tracking-widest uppercase">ACTIVE OUTREACH</span>
                  <h2 className="text-2xl font-heading font-black tracking-tight leading-none uppercase italic truncate">{activeLead["Practice Name"]}</h2>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-60 italic">{activeLead.City} • {activeLead.Phone}</span>
               </div>

               {/* Log Status Buttons */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button 
                    onClick={() => handleStatusUpdate("booked")}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${leadNotes[activeLead.Email]?.status === 'booked' ? 'bg-green-500 text-white border-green-500' : 'bg-secondary/50 border-glass-border hover:border-green-500/50'}`}
                  >
                     <CheckCircle2 size={24} />
                     <span className="text-[10px] font-black uppercase">BOOKED</span>
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate("called")}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${leadNotes[activeLead.Email]?.status === 'called' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-secondary/50 border-glass-border hover:border-yellow-500/50'}`}
                  >
                     <PhoneOutgoing size={24} />
                     <span className="text-[10px] font-black uppercase">CALLED</span>
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate("ignored")}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${leadNotes[activeLead.Email]?.status === 'ignored' ? 'bg-red-500 text-white border-red-500' : 'bg-secondary/50 border-glass-border hover:border-red-500/50'}`}
                  >
                     <XCircle size={24} />
                     <span className="text-[10px] font-black uppercase">IGNORE</span>
                  </button>
                  <button 
                    onClick={() => {
                        setNoteText("");
                        updateLeadNote(activeLead.Email, { status: "new", comment: "" });
                    }}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border bg-secondary/50 border-glass-border hover:border-white transition-all text-muted-foreground hover:text-white"
                  >
                     <RotateCcw size={24} />
                     <span className="text-[10px] font-black uppercase">RESET</span>
                  </button>
               </div>


               {/* Call Notes & Time Input */}
               <div className="flex flex-col md:flex-row gap-4 flex-1">
                  <div className="flex flex-col gap-4 flex-1">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Interaction Notes</span>
                      <MessageSquare size={14} className="opacity-20" />
                    </div>
                    <textarea 
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      onBlur={() => handleStatusUpdate(leadNotes[activeLead.Email]?.status || "called")}
                      placeholder="Log gatekeeper feedback, objections, or next steps..."
                      className="flex-1 bg-black/50 border-2 border-glass-border p-6 rounded-2xl text-sm font-bold placeholder:italic placeholder:opacity-30 focus:border-primary outline-none transition-all resize-none"
                    />
                  </div>
                  
                  {/* Time Picker Slider/Input */}
                  <div className="flex flex-col gap-4 w-full md:w-1/3">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40 text-primary">Demo Time</span>
                      <Calendar size={14} className="opacity-20" />
                    </div>
                    <input 
                      type="time" 
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="bg-black/50 border-2 border-primary/40 focus:border-primary p-6 rounded-2xl text-lg font-black text-white outline-none transition-all w-full leading-none"
                    />
                  </div>
               </div>

               <div className="p-6 bg-secondary/30 rounded-2xl border border-glass-border flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Persistence</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">LOCAL CRM SYNC ACTIVE</span>
                  </div>
                  <Zap size={18} className="text-primary animate-pulse" />
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Today's Wins Column (Hidden if Outcome Logger is active on small screens, or always secondary) */}
        {!activeLead && (
          <div className="lg:col-span-1 flex flex-col gap-8">
            <div className="glass-card p-10 flex flex-col overflow-hidden h-full">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-xl font-heading font-bold flex items-center gap-4 tracking-tight uppercase leading-none">
                    <CheckSquare className="text-foreground opacity-20" size={24} />
                    DAILY WINS
                  </h2>
                </div>
                <div className="flex-1 overflow-hidden transition-all">
                  <PersonalTasks theme="dark" />
                </div>
            </div>
            
            <div className="glass-card p-8 bg-secondary/30 flex items-center justify-between border-dashed border-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Session Goal</span>
                  <span className="text-sm font-bold uppercase tracking-widest leading-none">70 DIALS COMPLETE</span>
                </div>
                <Activity size={24} className="text-muted-foreground opacity-20" />
            </div>
          </div>
        )}
      </div>
      
      <AddLeadModal 
        isOpen={isAddLeadModalOpen} 
        onClose={() => setIsAddLeadModalOpen(false)} 
      />
    </div>
  );
}

function FinalDashboardWrapper() {
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  
  return (
    <>
      <SetterDashboardContent />
    </>
  );
}

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const authStatus = localStorage.getItem("spine_empire_setter_auth");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  const handleLoginSuccess = () => {
    localStorage.setItem("spine_empire_setter_auth", "true");
    setIsAuthenticated(true);
  };

  if (isChecking) {
    return <div className="h-screen w-full bg-[#0a0a0a]" />;
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLoginSuccess} />;
  }

  // Use a wrapper to handle the global modal state if needed, or just put it here
  return (
    <>
      <SetterDashboardContent />
    </>
  );
}
