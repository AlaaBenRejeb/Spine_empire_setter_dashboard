"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, TrendingUp, Target, Calendar, PhoneCall, ArrowUpRight, PieChart, Zap, Activity, Trophy, Clock } from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { useState, useMemo } from "react";

type Timeframe = 'today' | 'month' | 'all';

export default function PerformancePage() {
  const { leads, leadNotes } = useCRM();
  const [timeframe, setTimeframe] = useState<Timeframe>('all');

  const filteredNotes = useMemo(() => {
    const now = new Date();
    const allNotes = Object.values(leadNotes);
    
    if (timeframe === 'today') {
      return allNotes.filter((n: any) => n.synced_at && new Date(n.synced_at).toDateString() === now.toDateString());
    } else if (timeframe === 'month') {
      return allNotes.filter((n: any) => {
        if (!n.synced_at) return false;
        const d = new Date(n.synced_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    }
    return allNotes;
  }, [leadNotes, timeframe]);

  const totalDials = filteredNotes.filter((s: any) => s.status !== "new").length;
  const totalBooked = filteredNotes.filter((s: any) => s.status === "booked").length;
  const totalIgnored = filteredNotes.filter((s: any) => s.status === "ignored" || s.status === "archived").length;
  const totalLeads = leads.length;

  const conversionRate = totalDials > 0 ? (totalBooked / totalDials) * 100 : 0;
  const DEAL_VALUE = 6500;

  // Power Score = (ConvRate * 0.7) + (Bookings/10 * 30) - capped at 100
  const powerScore = Math.min(Math.round((conversionRate * 0.7) + (Math.min(totalBooked, 10) * 3)), 100);

  const metrics = [
    { label: "Elite Target Pool", value: totalLeads.toLocaleString(), icon: <Target className="text-primary" />, desc: "Total database nodes", trend: "Live" },
    { label: "Outreach Volume", value: totalDials.toLocaleString(), icon: <PhoneCall className="text-yellow-500" />, desc: "High-frequency dials", trend: "Active" },
    { label: "Qualified Demos", value: totalBooked.toLocaleString(), icon: <Calendar className="text-green-500" />, desc: "Total Booked Demos", trend: "Success" },
    { label: "CRM Win Rate", value: `${conversionRate.toFixed(1)}%`, icon: <TrendingUp className="text-purple-500" />, desc: "Direct conversion frequency", trend: "Elite" }
  ];

  const distribution = [
    { label: "Market Fresh", count: Math.max(0, totalLeads - totalDials), color: "bg-primary" },
    { label: "Active Pulse", count: Math.max(0, totalDials - totalBooked - totalIgnored), color: "bg-yellow-500" },
    { label: "Elite Booked", count: totalBooked, color: "bg-green-500" },
    { label: "Market Archive", count: totalIgnored, color: "bg-red-500" }
  ];

  return (
    <div className="flex-1 flex flex-col gap-10 p-8 md:p-12 overflow-y-auto hide-scrollbar h-screen bg-transparent">
      <header className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <motion.h1 
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-6xl font-heading font-black tracking-tighter uppercase leading-none"
          >
            Sales <span className="text-gradient">Performance.</span>
          </motion.h1>
          <p className="text-muted-foreground font-black text-[10px] tracking-[0.5em] uppercase opacity-40 ml-1">Real-time Frame Control Analytics</p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 mb-2">
          {(['today', 'month', 'all'] as Timeframe[]).map(t => (
            <button 
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-6 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${timeframe === t ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {metrics.map((m, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1, duration: 0.6, ease: "easeOut" }}
            className="glass-card p-10 flex flex-col gap-8 group hover:translate-y-[-10px] bg-secondary/20"
          >
            <div className="flex justify-between items-start">
              <div className="p-5 bg-black text-white dark:bg-white dark:text-black rounded-2xl shadow-xl transition-all border-2 border-black/10">
                {m.icon}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-green-500 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20 shadow-sm transition-all group-hover:scale-105">
                <ArrowUpRight size={12} strokeWidth={4} /> {m.trend}
              </div>
            </div>
            <div>
              <div className="text-5xl font-heading font-black mb-2 tracking-tighter group-hover:text-primary transition-colors">{m.value}</div>
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] block mb-3 opacity-60 italic">{m.label}</span>
              <p className="text-[10px] text-black/40 dark:text-white/40 font-bold leading-tight uppercase font-heading">/// DATA {m.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-10 mb-20 animate-float flex-1">
        {/* Power Score Ribbon */}
        <div className="col-span-12 glass-card p-12 bg-white text-black flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden group border-none shadow-[0_0_50px_rgba(255,255,255,0.05)]">
           <div className="absolute -top-10 -right-10 opacity-5 group-hover:scale-110 transition-transform">
              <Trophy size={240} strokeWidth={4} />
           </div>
           
           <div className="flex flex-col gap-4 relative z-10">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Intelligence Node Performance</span>
              </div>
              <h2 className="text-5xl font-heading font-black tracking-tighter uppercase italic">Current Power <span className="opacity-20 italic">/</span> Score.</h2>
              <div className="flex items-center gap-8">
                 <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Node Rank</span>
                    <span className="text-2xl font-heading font-black italic text-emerald-600">{powerScore >= 80 ? 'Elite' : powerScore >= 50 ? 'Standard' : 'Initial'}</span>
                 </div>
                 <div className="w-px h-10 bg-black/5" />
                 <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Synchronization</span>
                    <span className="text-2xl font-heading font-black italic text-black">Active Pulse</span>
                 </div>
              </div>
           </div>

           <div className="flex-1 max-w-md w-full flex flex-col gap-5 relative z-10 text-right">
              <div className="flex justify-between items-end">
                 <span className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">Global Sync Status</span>
                 <div className="flex items-center gap-2">
                    <span className="text-5xl font-heading font-black tracking-tighter italic leading-none">{powerScore}</span>
                    <span className="text-[10px] font-black tracking-[0.3em] opacity-20 uppercase">XP/100</span>
                 </div>
              </div>
              <div className="h-4 w-full bg-black/5 rounded-full p-1 border border-black/5 overflow-hidden shadow-inner flex items-center">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${powerScore}%` }}
                   transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                   className={`h-full ${powerScore >= 80 ? 'bg-emerald-500' : 'bg-black'} rounded-full shadow-[0_0_20px_rgba(0,0,0,0.1)]`} 
                 />
              </div>
           </div>
        </div>

        {/* Pipeline Distribution Chart Elite */}
        <div className="col-span-12 lg:col-span-6 glass-card p-12 flex flex-col gap-10 bg-secondary/30 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
              <PieChart size={300} strokeWidth={4} />
           </div>
           <div className="flex justify-between items-center relative z-10">
              <h3 className="text-2xl font-heading font-black tracking-tight flex items-center gap-5 uppercase leading-none italic underline decoration-primary/50 underline-offset-[12px]">
                 <Activity className="text-primary" size={32} />
                 MARKET VOLUME DISTRIBUTION
              </h3>
           </div>
           
           <div className="flex-1 flex flex-col gap-8 relative z-10">
              {distribution.map((d, dIdx) => {
                const percentage = totalLeads > 0 ? ((d.count / totalLeads) * 100).toFixed(1) : 0;
                return (
                  <div key={d.label} className="space-y-3 group">
                    <div className="flex justify-between text-xs font-black tracking-[0.2em] uppercase">
                       <span className="text-muted-foreground group-hover:text-primary transition-colors italic">{d.label}</span>
                       <span className="text-foreground opacity-80">{d.count} ({percentage}%)</span>
                    </div>
                    <div className="h-4 bg-black/5 dark:bg-white/5 p-1 rounded-none border-2 border-black/10 overflow-hidden shadow-inner flex items-center">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.5 + dIdx * 0.1, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                        className={`${d.color} h-full rounded-none border border-black/20`} 
                      />
                    </div>
                  </div>
                );
              })}
           </div>
        </div>

        {/* Sales Benchmarks Elite */}
        <div className="col-span-12 lg:col-span-6 glass-card p-12 flex flex-col gap-10 bg-secondary/30">
           <h3 className="text-2xl font-heading font-black tracking-tight flex items-center gap-5 uppercase leading-none italic underline decoration-primary/50 underline-offset-[12px]">
              <TrendingUp className="text-primary" size={32} />
              OUTREACH PERFORMANCE BENCHMARKS
           </h3>
           <div className="space-y-6 flex-1 flex flex-col justify-center">
              <div className="p-8 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border-2 border-glass-border flex justify-between items-center group hover:border-primary/30 transition-all">
                 <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-2">Efficiency Rating</span>
                    <span className="text-4xl font-heading font-black italic tracking-tighter group-hover:text-primary transition-colors">
                       ~{totalBooked > 0 ? (totalDials / totalBooked).toFixed(1) : "0"} DIALS/WIN
                    </span>
                 </div>
                 <div className="bg-primary/20 p-5 rounded-2xl border-2 border-primary/20 shadow-xl group-hover:bg-primary group-hover:text-black transition-all">
                    <PhoneCall size={28} />
                 </div>
              </div>

              <div className="p-8 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border-2 border-glass-border flex justify-between items-center group hover:border-green-500/30 transition-all">
                 <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-2">Pipeline Opportunity</span>
                    <span className="text-4xl font-heading font-black italic tracking-tighter group-hover:text-green-500 transition-colors">
                       ${(totalBooked * DEAL_VALUE).toLocaleString()} VALUATION
                    </span>
                 </div>
                 <div className="bg-green-500/20 p-5 rounded-2xl border-2 border-green-500/20 shadow-xl group-hover:bg-green-500 group-hover:text-black transition-all">
                    <Zap size={28} />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
