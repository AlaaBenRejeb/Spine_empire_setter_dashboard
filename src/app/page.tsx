"use client";

import { motion } from "framer-motion";
import { PhoneCall, Calendar, Target, TrendingUp, BarChart3, Sun, Moon, CheckSquare, Zap, Activity } from "lucide-react";
import LeadList from "@/components/LeadList";
import PersonalTasks from "@/components/PersonalTasks";
import { useTheme } from "@/context/ThemeContext";
import { useCRM } from "@/context/CRMContext";

export default function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const { leadNotes } = useCRM();

  const notes = Object.values(leadNotes);
  const totalDials = notes.filter(n => n.status !== "new").length;
  const totalBooked = notes.filter(n => n.status === "booked").length;
  const totalLeads = 982;

  const stats = [
    { label: "Target Market", value: totalLeads.toString(), icon: <Target />, color: "text-foreground", desc: "Total Pool" },
    { label: "Dials Today", value: totalDials.toString(), icon: <PhoneCall />, color: "text-foreground", desc: "Outreach" },
    { label: "Demos Booked", value: totalBooked.toString(), icon: <Calendar />, color: "text-foreground", desc: "Success" },
    { label: "Win Opportunity", value: `$${(totalBooked * 4000).toLocaleString()}`, icon: <TrendingUp />, color: "text-foreground", desc: "Projected" }
  ];

  return (
    <div className="flex-1 flex flex-col gap-10 p-8 md:p-12 overflow-y-auto hide-scrollbar h-screen">
      {/* Minimal Elite Header */}
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
          <button 
            onClick={toggleTheme}
            className="glass-card p-5 rounded-xl border border-glass-border hover:border-foreground active:scale-95 transition-all"
          >
            {theme === "dark" ? (
              <Sun size={20} className="text-foreground" />
            ) : (
              <Moon size={20} className="text-foreground" />
            )}
          </button>
          <div className="glass-card px-8 py-5 rounded-xl flex items-center gap-4 border border-glass-border">
            <Zap className="text-foreground" size={20} strokeWidth={2.5} />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Status</span>
              <span className="text-xs font-bold tracking-widest uppercase">PRO ACTIVE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Minimal Stats Grid */}
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
               <div className={`p-4 bg-secondary/50 rounded-xl border border-glass-border ${stat.color}`}>
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
        <div className="lg:col-span-2 glass-card p-10 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-xl font-heading font-bold flex items-center gap-4 tracking-tight uppercase leading-none">
              <BarChart3 className="text-foreground opacity-20" size={24} />
              CRM TARGET LIST
            </h2>
          </div>
          
          <div className="flex-1 overflow-hidden transition-all">
            <LeadList />
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-8">
           <div className="glass-card p-10 flex flex-col overflow-hidden h-full">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-xl font-heading font-bold flex items-center gap-4 tracking-tight uppercase leading-none">
                  <CheckSquare className="text-foreground opacity-20" size={24} />
                  DAILY WINS
                </h2>
              </div>
              <div className="flex-1 overflow-hidden transition-all">
                <PersonalTasks theme={theme} />
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
      </div>
    </div>
  );
}
