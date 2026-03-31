"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PhoneCall, Calendar, Target, TrendingUp, BarChart3, Settings, LogOut, Sun, Moon, LayoutDashboard, CheckSquare } from "lucide-react";
import LeadList from "@/components/LeadList";
import ScriptBuddy from "@/components/ScriptBuddy";
import PersonalTasks from "@/components/PersonalTasks";

export default function Dashboard() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeLead, setActiveLead] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("spine-empire-theme") as "dark" | "light";
    if (saved) setTheme(saved);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("spine-empire-theme", newTheme);
  };

  const stats = [
    { label: "Total Leads", value: "982", icon: <Target className={`${theme === 'dark' ? 'text-primary' : 'text-blue-600'}`} />, desc: "High Potential Targets" },
    { label: "Dials Today", value: "24", icon: <PhoneCall className="text-green-500" />, desc: "Daily Goal: 70" },
    { label: "Demos Booked", value: "3", icon: <Calendar className="text-purple-500" />, desc: "Conversion: 12.5%" },
    { label: "Pipeline Value", value: "$12k", icon: <TrendingUp className="text-yellow-500" />, desc: "Projected MRR" }
  ];

  return (
    <main data-theme={theme} className="min-h-screen bg-background text-foreground p-4 md:p-8 flex gap-8 transition-all duration-500">
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex w-64 flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center border border-white/10 group hover:border-primary transition-all">
            <BarChart3 className="text-black group-hover:scale-110 transition-transform" size={24} />
          </div>
          <span className="text-xl font-black tracking-tighter glow-text uppercase">Spine Empire</span>
        </div>

        <nav className="flex flex-col gap-2 mt-8">
          <div className="bg-primary/10 text-primary p-3.5 rounded-xl flex items-center gap-3 font-black border border-primary/20 transition-all cursor-pointer">
            <LayoutDashboard size={20} /> Dashboard
          </div>
          <div className="text-gray-500 p-3.5 rounded-xl flex items-center gap-3 font-bold hover:bg-sidebar-item hover:text-foreground transition-all cursor-pointer">
            <PhoneCall size={20} /> My Calls
          </div>
          <div className="text-gray-500 p-3.5 rounded-xl flex items-center gap-3 font-bold hover:bg-sidebar-item hover:text-foreground transition-all cursor-pointer">
            <Calendar size={20} /> Booked Demos
          </div>
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <div className="text-gray-500 p-3.5 rounded-xl flex items-center gap-3 font-bold hover:bg-sidebar-item hover:text-foreground transition-all cursor-pointer">
            <Settings size={20} /> Settings
          </div>
          <div className="text-gray-500 p-3.5 rounded-xl flex items-center gap-3 font-bold hover:bg-red-500/10 hover:text-red-500 transition-all cursor-pointer">
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
              className="text-4xl md:text-5xl font-black mb-1 p-1 tracking-tight"
            >
              Welcome back, <span className="text-primary glow-text">Alex.</span>
            </motion.h1>
            <p className="text-gray-500 font-bold text-xs tracking-widest uppercase opacity-70 ml-1">Spine Empire Sales Command Center</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="bg-glass border border-glass-border p-3.5 rounded-2xl backdrop-blur-md hover:border-primary transition-all group active:scale-90 shadow-xl"
            >
              {theme === "dark" ? (
                <Sun size={20} className="text-yellow-500 group-hover:scale-110 transition-transform" />
              ) : (
                <Moon size={20} className="text-primary group-hover:scale-110 transition-transform" />
              )}
            </button>

            <div className="flex items-center gap-4 bg-glass border border-glass-border px-6 py-3 rounded-2xl backdrop-blur-md shadow-xl">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-400" />
              <span className="text-xs font-black tracking-widest uppercase opacity-70">Live CRM Active</span>
            </div>
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
                <span className="text-gray-500 text-[10px] font-black tracking-widest uppercase">{stat.label}</span>
                <div className="p-2.5 bg-foreground/5 rounded-xl group-hover:bg-primary/20 transition-all">
                  {stat.icon}
                </div>
              </div>
              <div>
                <h2 className="text-4xl font-black mb-1 leading-tight tracking-tighter">{stat.value}</h2>
                <span className="text-xs text-gray-500 font-bold opacity-70">{stat.desc}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Dashboard Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 h-[calc(100vh-480px)] lg:h-[calc(100vh-350px)] gap-6">
          {/* Leads CRM Section (2/3 width) - Click lead to select it */}
          <div className="lg:col-span-2 glass-card p-8 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black flex items-center gap-3 tracking-tighter uppercase">
                <BarChart3 className="text-primary" size={22} />
                CRM LEAD PIPELINE
              </h2>
              <div className="text-[10px] text-gray-500 font-black tracking-widest bg-foreground/5 px-5 py-2.5 rounded-full border border-glass-border hover:border-primary/50 transition-all cursor-crosshair">
                REAL-TIME DATA ENABLED
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <LeadList 
                onSelectLead={setActiveLead} 
                activeEmail={activeLead?.Email} 
              />
            </div>
          </div>

          {/* To-Do Section (1/3 width) */}
          <div className="lg:col-span-1 glass-card p-8 flex flex-col overflow-hidden">
             <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black flex items-center gap-3 tracking-tighter uppercase">
                <CheckSquare className="text-primary" size={22} />
                TODAY'S WINS
              </h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <PersonalTasks theme={theme} />
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Script Buddy Overlay */}
      <ScriptBuddy activeLead={activeLead} />
    </main>
  );
}
