"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createBrowserClient } from "@supabase/ssr";
import { motion } from "framer-motion";
import { User, Mail, Lock, MapPin, Save, Shield, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth();
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [city, setCity] = useState(profile?.city || "");
  const [email, setEmail] = useState(user?.email || "");
  const [newPassword, setNewPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // 1. Update Profile Metadata
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          first_name: firstName, 
          last_name: lastName, 
          city: city 
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Update Auth Email if changed
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) throw emailError;
        setMessage({ type: 'success', text: "Profile updated. Check your new email for verification." });
      } else {
        setMessage({ type: 'success', text: "Identity nodes synchronized successfully." });
      }
      
      // Reload profile data (handled by AuthContext on refresh or manual reload)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Failed to sync identity." });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMessage({ type: 'success', text: "Security credentials updated successfully." });
      setNewPassword("");
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Failed to update security." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 lg:p-12 font-sans select-none overflow-x-hidden">
      <div className="max-w-4xl mx-auto flex flex-col gap-12">
        
        {/* Header Node */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-5xl font-heading font-black tracking-tighter uppercase italic leading-none">
              Elite <span className="text-gradient">Identity.</span>
            </h1>
            <p className="text-white/30 font-black text-[10px] tracking-[0.6em] uppercase italic">Manage your operational credentials</p>
          </div>
          <button 
            onClick={() => window.history.back()}
            className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white hover:text-black transition-all group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-3xl border flex items-center gap-4 ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
          >
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="text-[10px] font-black uppercase tracking-widest">{message.text}</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Identity Form */}
          <section className="glass-card p-10 border-white/10 bg-white/5 flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-xl font-heading font-black uppercase italic tracking-tighter">Core Identity</h2>
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 italic">Internal Staff Metadata</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-2">First Name</label>
                  <input 
                    type="text" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-black/40 border border-white/5 rounded-2xl p-5 text-[11px] font-black tracking-widest uppercase focus:border-white transition-all outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-2">Last Name</label>
                  <input 
                    type="text" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-black/40 border border-white/5 rounded-2xl p-5 text-[11px] font-black tracking-widest uppercase focus:border-white transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-2">Operational Hub (City)</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" />
                  <input 
                    type="text" 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 pl-14 text-[11px] font-black tracking-widest uppercase focus:border-white transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-2">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 pl-14 text-[11px] font-black tracking-widest uppercase focus:border-white transition-all outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="mt-4 bg-white text-black py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] active:scale-95 transition-all disabled:opacity-50"
              >
                <Save size={16} />
                Sync Identity
              </button>
            </form>
          </section>

          {/* Security Form */}
          <section className="glass-card p-10 border-white/10 bg-white/5 flex flex-col gap-8 h-fit">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center border border-white/10">
                <Shield size={20} />
              </div>
              <div>
                <h2 className="text-xl font-heading font-black uppercase italic tracking-tighter">Operational Security</h2>
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 italic">Access Credentials</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-2">New Access Key (Password)</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" />
                  <input 
                    type="password" 
                    placeholder="ENTER NEW KEY"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 pl-14 text-[11px] font-black tracking-widest uppercase focus:border-white transition-all outline-none placeholder:text-white/5"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading || !newPassword}
                className="mt-4 bg-white/10 text-white border border-white/10 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-white hover:text-black transition-all disabled:opacity-50"
              >
                <Shield size={16} />
                Update Security
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-white/5">
               <button 
                onClick={signOut}
                className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500 hover:text-red-400 transition-all flex items-center gap-2"
              >
                Terminate Session
              </button>
            </div>
          </section>

        </div>

        <p className="text-center text-[8px] font-black uppercase tracking-[0.8em] text-white/5 italic">Nexus Identity Matrix • Spine Empire Core Security</p>
      </div>
    </div>
  );
}
