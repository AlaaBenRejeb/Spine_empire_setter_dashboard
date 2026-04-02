"use client";

import { motion } from "framer-motion";
import { Zap, Shield, ChevronRight, Mail, Lock, User, Target, Crosshair, Trophy } from "lucide-react";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function UnifiedLogin() {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      // Success will trigger AuthContext update
    } catch (err: any) {
      setError(err.message || "Nexus Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 font-sans select-none relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] animate-pulse delay-700" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg flex flex-col gap-12 relative z-10"
      >
        {/* Branding Node */}
        <div className="flex flex-col items-center gap-6 text-center">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-20 h-20 bg-white text-black rounded-[2rem] shadow-[0_0_50px_rgba(255,255,255,0.15)] flex items-center justify-center border-4 border-white"
          >
            <Zap size={40} strokeWidth={3} />
          </motion.div>
          <div className="flex flex-col gap-2">
            <h1 className="text-7xl font-heading font-black tracking-tighter uppercase leading-none italic text-white">
              Spine <span className="text-gradient">Empire.</span>
            </h1>
            <p className="text-white/30 font-black text-[12px] tracking-[0.8em] uppercase italic">Obsidian Elite Ecosystem</p>
          </div>
        </div>

        {/* Auth Matrix */}
        <div className="glass-card p-12 flex flex-col gap-8 border-white/10 bg-white/5 shadow-[0_0_80px_rgba(255,255,255,0.02)]">
          <div className="flex flex-col gap-2">
             <h2 className="text-2xl font-heading font-black uppercase italic tracking-tighter leading-none text-white">Authentication</h2>
             <p className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">Step into the Command Environment</p>
          </div>

          <div className="flex flex-col gap-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest italic text-center">
                {error}
              </div>
            )}
            <div className="relative group">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" size={18} />
              <input 
                type="email" 
                placeholder="NEXUS IDENTITY (EMAIL)" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-6 pl-16 pr-8 text-[12px] font-black tracking-widest uppercase focus:border-white focus:bg-white/10 outline-none transition-all placeholder:text-white/10 text-white"
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" size={18} />
              <input 
                type="password" 
                placeholder="ACCESS KEY" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-6 pl-16 pr-8 text-[12px] font-black tracking-widest uppercase focus:border-white focus:bg-white/10 outline-none transition-all placeholder:text-white/10 text-white"
              />
            </div>
          </div>

          <button 
            onClick={handleLogin}
            disabled={loading || !email || !password}
            className="w-full bg-white text-black py-6 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] active:scale-95 transition-all group disabled:opacity-30 disabled:pointer-events-none"
          >
            {loading ? "Engaging System..." : "Engage System"} 
            <ChevronRight size={18} strokeWidth={3} className="group-hover:translate-x-2 transition-transform" />
          </button>

          <p className="text-center text-[8px] font-black uppercase tracking-[0.6em] text-white/10 italic">Authorized Access Only • Nexus Security Active</p>
        </div>
      </motion.div>
    </div>
  );
}
