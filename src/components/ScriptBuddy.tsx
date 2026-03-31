"use client";

import { useState, useMemo } from "react";
import { MessageSquare, X, ChevronRight, Check, User, ShieldCheck, UserCheck, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ScriptBuddy({ activeLead }: { activeLead: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isGatekeeper, setIsGatekeeper] = useState(false);

  const script = useMemo(() => {
    const name = activeLead?.["First Name"] || "the owner";
    const practice = activeLead?.["Practice Name"] || "the clinic";
    const reviews = activeLead?.["Google Reviews"] || "under 76";

    if (isGatekeeper) {
      return [
        { label: "OPENING", content: `Good morning — who handles patient growth decisions there at ${practice}?` },
        { label: "THE HOOK", content: `It’s regarding patient acquisition for the clinic. We help practices like yours improve consistency in new patient flow. Is the owner available to speak briefly?` },
        { label: "THE ROUTE", content: `Perfect. If they're busy, who would be the best person to schedule a quick 10-minute talk with regarding your patient acquisition flow?` },
        { label: "RESISTANCE", content: `I understand they're busy. That’s why I’m keeping it short. Should I speak with you to find a time on their calendar, or is there a direct extension?` }
      ];
    }

    return [
      { label: "OPENING", content: `Hey, am I speaking with ${name}? Perfect — I’ll keep this brief. My name’s Alex. I work with chiropractors who want more consistency in new patient flow.` },
      { label: "DIAGNOSTIC", content: `Quick question for you at ${practice} — are you getting most of your new patients from referrals, ads, or a mix? ... And is that actually predictable month to month, or does it fluctuate?` },
      { label: "THE PROBLEM", content: `Makes sense. I noticed you currently have ${reviews} reviews. We help clinics tighten patient acquisition so you're not just relying on one source.` },
      { label: "THE BOOKING", content: `If I could show you how that would look for ${practice} specifically, would you be open to a quick 10-minute call? I’ve got tomorrow at 11 AM or Thursday at 2 PM. Which works better?` }
    ];
  }, [activeLead, isGatekeeper]);

  return (
    <>
      <motion.button
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-10 right-10 bg-black text-white dark:bg-white dark:text-black p-6 rounded-2xl shadow-xl z-50 flex items-center gap-4 font-bold uppercase text-[10px] tracking-widest border border-black dark:border-white transition-all"
      >
        <Terminal size={20} />
        {!isOpen && <span>Script Buddy</span>}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-28 right-10 w-[500px] p-10 z-50 shadow-2xl bg-white border-2 border-black rounded-xl flex flex-col gap-8 transition-all"
          >
            {/* Minimal Header */}
            <div className="flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-black rounded-full" />
                  <h2 className="text-black font-heading font-black tracking-tight text-lg uppercase italic leading-none">BATTLE-CARD PRO</h2>
               </div>
               <button 
                  onClick={() => setIsOpen(false)} 
                  className="text-black hover:bg-black/5 p-2 rounded-lg transition-all"
                >
                  <X size={24} strokeWidth={2.5} />
               </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex w-full border border-black/10 bg-secondary/30 p-1 rounded-xl">
              <button 
                onClick={() => { setIsGatekeeper(false); setCurrentStep(0); }}
                className={`flex-1 py-3.5 flex items-center justify-center gap-2 transition-all font-bold text-[10px] uppercase tracking-widest rounded-lg ${!isGatekeeper ? 'bg-white text-black shadow-sm' : 'text-muted-foreground hover:text-black'}`}
              >
                <UserCheck size={16} /> OWNER
              </button>
              <button 
                onClick={() => { setIsGatekeeper(true); setCurrentStep(0); }}
                className={`flex-1 py-3.5 flex items-center justify-center gap-2 transition-all font-bold text-[10px] uppercase tracking-widest rounded-lg ${isGatekeeper ? 'bg-white text-black shadow-sm' : 'text-muted-foreground hover:text-black'}`}
              >
                <ShieldCheck size={16} /> GATEKEEPER
              </button>
            </div>

            {/* Progress */}
            <div className="flex gap-2">
              {script.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 transition-all duration-300 rounded-full ${i <= currentStep ? "bg-black" : "bg-black/5"}`} />
              ))}
            </div>

            {/* Context Profile */}
            {activeLead && (
              <div className="bg-secondary/30 p-6 rounded-xl flex items-center gap-5 border border-glass-border shadow-sm">
                <div className="bg-white text-black p-3 rounded-lg border border-black shadow-sm">
                  <User size={24} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest leading-none mb-2">TARGET CLINIC</span>
                  <span className="text-lg font-heading font-bold tracking-tight truncate uppercase leading-none">{activeLead["Practice Name"]}</span>
                </div>
              </div>
            )}

            {/* Clean Script Engine */}
            <div className="min-h-[220px] flex flex-col justify-center bg-white p-6 border-2 border-dashed border-black/10 rounded-xl">
              <h3 className="text-[10px] text-muted-foreground uppercase font-bold mb-6 tracking-widest opacity-60">
                PHASE {currentStep + 1}: {script[currentStep].label}
              </h3>
              <p className="text-black text-3xl font-heading font-bold leading-tight uppercase">
                 "{script[currentStep].content}"
              </p>
            </div>

            {/* Minimal Elite Controls */}
            <div className="flex justify-between items-center pt-6 border-t border-glass-border">
              <button 
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                className="text-[10px] text-muted-foreground hover:text-black transition-all font-bold uppercase tracking-widest disabled:opacity-20 flex items-center gap-2"
                disabled={currentStep === 0}
              >
                PREVIOUS
              </button>
              {currentStep < script.length - 1 ? (
                <button 
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="bg-black text-white px-10 py-4 font-bold text-xs flex items-center gap-3 hover:opacity-90 transition-all rounded-xl shadow-lg uppercase tracking-widest"
                >
                  NEXT STEP <ChevronRight size={18} strokeWidth={2.5} />
                </button>
              ) : (
                <button 
                  onClick={() => { setCurrentStep(0); setIsOpen(false); }}
                  className="bg-black text-white px-10 py-4 font-bold text-xs flex items-center gap-3 hover:opacity-90 transition-all rounded-xl shadow-lg uppercase tracking-widest"
                >
                  FINISH CALL <Check size={20} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
