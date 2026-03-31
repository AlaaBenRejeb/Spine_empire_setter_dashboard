"use client";

import { motion } from "framer-motion";
import { PhoneCall, Calendar, Target, TrendingUp, BarChart3, Settings, LogOut } from "lucide-react";
import LeadList from "@/components/LeadList";
import ScriptBuddy from "@/components/ScriptBuddy";
import PersonalTasks from "@/components/PersonalTasks";
import { ListTodo } from "lucide-react";

export default function Dashboard() {
  const stats = [
    { label: "Total Leads", value: "982", icon: <Target className="text-primary" />, desc: "High Potential Targets" },
    { label: "Dials Today", value: "24", icon: <PhoneCall className="text-green-500" />, desc: "Daily Goal: 70" },
    { label: "Demos Booked", value: "3", icon: <Calendar className="text-purple-500" />, desc: "Conversion: 12.5%" },
    { label: "Pipeline Value", value: "$12k", icon: <TrendingUp className="text-yellow-500" />, desc: "Projected MRR" }
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 flex gap-8">
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex w-64 flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center">
            <BarChart3 className="text-black" size={24} />
          </div>
          <span className="text-xl font-black tracking-tighter text-white glow-text uppercase">Spine Empire</span>
        </div>

        <nav className="flex flex-col gap-2 mt-8">
          <div className="bg-primary/10 text-primary p-3 rounded-xl flex items-center gap-3 font-bold border border-primary/20 transition-all cursor-pointer">
            <Target size={20} /> Dashboard
          </div>
          <div className="text-gray-500 p-3 rounded-xl flex items-center gap-3 font-bold hover:bg-white/5 hover:text-white transition-all cursor-pointer">
            <PhoneCall size={20} /> My Calls
          </div>
          <div className="text-gray-500 p-3 rounded-xl flex items-center gap-3 font-bold hover:bg-white/5 hover:text-white transition-all cursor-pointer">
            <Calendar size={20} /> Booked Demos
          </div>
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <div className="text-gray-500 p-3 rounded-xl flex items-center gap-3 font-bold hover:bg-white/5 hover:text-white transition-all cursor-pointer">
            <Settings size={20} /> Settings
          </div>
          <div className="text-gray-500 p-3 rounded-xl flex items-center gap-3 font-bold hover:bg-red-500/10 hover:text-red-500 transition-all cursor-pointer">
            <LogOut size={20} /> Logout
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-8 overflow-hidden">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl md:text-4xl font-black text-white glow-text mb-2 tracking-tight"
            >
              Welcome back, Alex.
            </motion.h1>
            <p className="text-gray-500 font-medium tracking-tight">Let's dominate the chiropractic market today.</p>
          </div>
          <div className="flex items-center gap-4 bg-glass border border-glass-border px-4 py-2 rounded-xl backdrop-blur-md">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-400" />
            <span className="text-sm font-bold text-gray-300">Live Backend Connected</span>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card p-6 flex flex-col gap-4 group"
            >
              <div className="flex justify-between items-start">
                <span className="text-gray-500 text-sm font-bold tracking-widest uppercase">{stat.label}</span>
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-primary/20 transition-colors">
                  {stat.icon}
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-black mb-1">{stat.value}</h2>
                <span className="text-xs text-gray-400 font-medium">{stat.desc}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Dashboard Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 h-[calc(100vh-450px)] lg:h-[calc(100vh-320px)] gap-6">
          {/* Leads Section (2/3 width) */}
          <div className="lg:col-span-2 glass-card p-8 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Target className="text-primary" size={20} />
                Chiropractic Leads Pipeline
              </h2>
              <div className="text-xs text-gray-500 font-bold uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:border-primary/50 transition-all cursor-crosshair">
                Priority Ranking Enabled
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <LeadList />
            </div>
          </div>

          {/* To-Do Section (1/3 width) */}
          <div className="lg:col-span-1 glass-card p-8 flex flex-col overflow-hidden">
             <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ListTodo className="text-primary" size={20} />
                Daily Priorities
              </h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <PersonalTasks />
            </div>
          </div>
        </div>
      </div>

      {/* Script Buddy Overlay */}
      <ScriptBuddy />
    </main>
  );
}
