"use client";

import { motion } from "framer-motion";
import { Zap, Shield, ChevronRight, User, Target, Crosshair, Trophy, Building2, MapPin, CheckCircle2, UserCircle } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage({ user, onComplete }: { user: any, onComplete: () => void }) {
  const [supabase] = useState(() => createClient());

  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFinish = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          city: city,
          role: 'setter',
          updated_at: new Date().toISOString(),
        });

      if (upsertError) throw upsertError;
      
      onComplete();
    } catch (err: any) {
      setError(err.message || "Initialization failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 font-sans select-none relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05)_0%,transparent_100%)] opacity-50" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl grid grid-cols-12 gap-12 relative z-10"
      >
        {/* Progress Sidebar */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-10">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center border-2 border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                <Zap size={20} strokeWidth={3} />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-heading font-black tracking-tighter uppercase leading-none italic text-white">Initialization.</span>
                <span className="text-[8px] font-black tracking-[0.4em] text-white/30 uppercase">Node Deployment</span>
              </div>
           </div>

           <div className="flex flex-col gap-6">
              {[
                { s: 1, label: "Identity Node", icon: UserCircle },
                { s: 2, label: "Eco-Location", icon: MapPin },
                { s: 3, label: "Logic Lock", icon: Shield },
                { s: 4, label: "Setter Sync", icon: Zap }
              ].map((item) => (
                <div key={item.s} className={`flex items-center gap-4 transition-all duration-500 ${step >= item.s ? 'text-white' : 'text-white/10'}`}>
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${step === item.s ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]' : step > item.s ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-transparent border-white/5'}`}>
                      {step > item.s ? <CheckCircle2 size={24} strokeWidth={3} /> : <item.icon size={20} strokeWidth={step === item.s ? 3 : 2} />}
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Phase 0{item.s}</span>
                      <span className="text-xl font-heading font-black uppercase italic tracking-tighter leading-none">{item.label}</span>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Form Terminal */}
        <div className="col-span-12 lg:col-span-8 glass-card p-12 lg:p-16 flex flex-col gap-12 bg-white/5 border-white/10">
           {error && (
             <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest italic text-center">
               {error}
             </div>
           )}

           {step === 1 && (
             <motion.div 
               initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
               className="flex flex-col gap-10"
             >
                <div className="flex flex-col gap-2">
                   <h2 className="text-5xl font-heading font-black uppercase italic tracking-tighter leading-none text-white">Identity.</h2>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">Who is overseeing this terminal node?</p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="flex flex-col gap-4">
                      <span className="text-[10px] font-black tracking-widest text-white/20 uppercase ml-2">First Name</span>
                      <input 
                        placeholder="NEXUS FIRST" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-6 px-8 text-[12px] font-black tracking-widest uppercase focus:border-white focus:bg-white/10 outline-none transition-all placeholder:text-white/5 text-white"
                      />
                   </div>
                   <div className="flex flex-col gap-4">
                      <span className="text-[10px] font-black tracking-widest text-white/20 uppercase ml-2">Last Name</span>
                      <input 
                        placeholder="NEXUS LAST" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-6 px-8 text-[12px] font-black tracking-widest uppercase focus:border-white focus:bg-white/10 outline-none transition-all placeholder:text-white/5 text-white"
                      />
                   </div>
                </div>
                <button 
                  onClick={() => setStep(2)}
                  disabled={!firstName || !lastName}
                  className="w-full bg-white text-black py-6 mt-4 rounded-3xl font-black text-[12px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] active:scale-95 transition-all group disabled:opacity-20"
                >
                  Confirm Identity <ChevronRight size={18} strokeWidth={3} className="group-hover:translate-x-2 transition-transform" />
                </button>
             </motion.div>
           )}

           {step === 2 && (
             <motion.div 
               initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
               className="flex flex-col gap-10"
             >
                <div className="flex flex-col gap-2">
                   <h2 className="text-5xl font-heading font-black uppercase italic tracking-tighter leading-none text-white">Location.</h2>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">Map your operational node to the empire grid</p>
                </div>
                <div className="flex flex-col gap-6">
                   <div className="flex flex-col gap-4">
                      <span className="text-[10px] font-black tracking-widest text-white/20 uppercase ml-2">Primary City</span>
                      <div className="relative">
                        <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" />
                        <input 
                          placeholder="OPERATIONAL HUB" 
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-black/40 border border-white/5 rounded-2xl py-6 pl-16 pr-8 text-[12px] font-black tracking-widest uppercase focus:border-white focus:bg-white/10 outline-none transition-all text-white"
                        />
                      </div>
                   </div>
                </div>
                <div className="flex gap-6 mt-4">
                   <button onClick={() => setStep(1)} className="flex-1 bg-white/5 text-white/40 border border-white/5 py-6 rounded-3xl font-black text-[12px] uppercase tracking-[0.4em] hover:bg-white/10 transition-all italic">Back</button>
                   <button 
                     onClick={() => setStep(3)} 
                     disabled={!city}
                     className="flex-[2] bg-white text-black py-6 rounded-3xl font-black text-[12px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] transition-all italic disabled:opacity-20"
                   >
                     Lock Logic <ChevronRight size={18} strokeWidth={3} />
                   </button>
                </div>
             </motion.div>
           )}

           {step === 3 && (
             <motion.div 
               initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
               className="flex flex-col gap-10"
             >
                <div className="flex flex-col gap-2">
                   <h2 className="text-5xl font-heading font-black uppercase italic tracking-tighter leading-none text-white">Verification.</h2>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">Final structural checks before synchronization</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                   {[
                     "Biometric Identity Confirmed",
                     "Location Node Assigned",
                     "Security Protocols Active"
                   ].map((check, i) => (
                     <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60 italic">{check}</span>
                        <CheckCircle2 size={16} className="text-emerald-500" />
                     </div>
                   ))}
                </div>
                <div className="flex gap-6 mt-4">
                   <button onClick={() => setStep(2)} className="flex-1 bg-white/5 text-white/40 border border-white/5 py-6 rounded-3xl font-black text-[12px] uppercase tracking-[0.4em] hover:bg-white/10 transition-all italic">Back</button>
                   <button 
                     onClick={() => setStep(4)} 
                     className="flex-[2] bg-white text-black py-6 rounded-3xl font-black text-[12px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] transition-all italic"
                   >
                     Initiate Sync <ChevronRight size={18} strokeWidth={3} />
                   </button>
                </div>
             </motion.div>
           )}

           {step === 4 && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
               className="flex flex-col gap-10 items-center text-center"
             >
                <div className="w-24 h-24 bg-white text-black rounded-[2.5rem] flex items-center justify-center border-4 border-white shadow-[0_0_60px_rgba(255,255,255,0.2)] mb-4">
                   <Target size={40} className="animate-pulse" />
                </div>
                <div className="flex flex-col gap-2">
                   <h2 className="text-5xl font-heading font-black uppercase italic tracking-tighter leading-none text-white text-gradient">Sync Ready.</h2>
                   <p className="text-white/40 text-xs font-bold leading-relaxed max-w-sm uppercase tracking-widest">Lead Generation Node Activated. Your terminal is now authorized to generate leads and sync with the closer network.</p>
                </div>

                <button 
                  onClick={handleFinish}
                  disabled={loading}
                  className="w-full bg-white text-black py-6 mt-6 rounded-[2rem] font-black text-[14px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] active:scale-95 transition-all group disabled:opacity-30"
                >
                  {loading ? "Initializing..." : "Finalize Deployment"}
                </button>
                <p className="text-[8px] font-black tracking-[0.6em] text-white/5 uppercase mt-4 italic">Lead Hub V1.0 • ID: {user.id.slice(0,8)}</p>
             </motion.div>
           )}
        </div>
      </motion.div>
    </div>
  );
}
