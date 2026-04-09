"use client";

import { useState, useMemo } from "react";
import { X, ChevronRight, Check, User, ShieldCheck, UserCheck, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ActiveLead = Record<string, string | number | null | undefined>;

export default function ScriptBuddy({ activeLead }: { activeLead?: ActiveLead }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isGatekeeper, setIsGatekeeper] = useState(false);

  const script = useMemo(() => {
    const practice = activeLead?.["Practice Name"] || "the clinic";

    if (isGatekeeper) {
      return [
        { label: "OPENING", content: `Good morning — who handles patient growth decisions there at ${practice}?` },
        { label: "THE HOOK", content: `It’s regarding patient acquisition for the clinic. We help practices like yours improve consistency in new patient flow. Is the owner available to speak briefly?` },
        { label: "THE ROUTE", content: `Perfect. If they're busy, who would be the best person to schedule a quick 10-minute talk with regarding your patient acquisition flow?` },
        { label: "RESISTANCE", content: `I understand they're busy. That’s why I’m keeping it short. Should I speak with you to find a time on their calendar, or is there a direct extension?` }
      ];
    }

    return [
      {
        label: "OPENER",
        content:
          "Hey quick one — this isn't a sales call.\nI noticed something about your clinic that's costing you patients.\nNot sure if you want me to tell you or not?\n\nPause.",
      },
      {
        label: "THE PROBLEM",
        content:
          "You don't have a consistent patient acquisition system.\nSo your numbers depend on referrals, random ads, or slow days — which means revenue is unstable.\n\nPause again.\n\nLet them agree or react.",
      },
      {
        label: "POSITION",
        content:
          "What I do is install a system that brings patients in weekly.\nIf it doesn't work, I don't get paid.",
      },
      {
        label: "SOFT CLOSE",
        content:
          "If you want, I can show you how it works in 10 minutes.\nIf not, no problem.",
      },
      {
        label: "IF THEY SAY YES",
        content: "Perfect — I've got [time] or [time]. Which works?",
      },
      {
        label: "IF THEY HESITATE",
        content:
          "\"I'm busy\"\n\nMakes sense — that's exactly why I'm suggesting 10 minutes.\nIf it's not useful, you hang up.",
      },
    ];
  }, [activeLead, isGatekeeper]);

  return (
    <>
      <motion.button
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-10 right-10 bg-black text-white dark:bg-white dark:text-black p-6 rounded-2xl shadow-xl z-50 flex items-center gap-4 font-bold uppercase text-[10px] tracking-widest border border-black dark:border-white transition-all shadow-primary/20"
      >
        <Terminal size={20} />
        {!isOpen && <span>Script Buddy</span>}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="fixed bottom-28 right-10 w-[460px] p-8 z-50 shadow-2xl bg-[#0d0d0d] border-2 border-glass-border rounded-xl flex flex-col gap-6"
          >
            {/* Minimal Header */}
            <div className="flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-primary rounded-full" />
                  <h2 className="text-white font-heading font-black tracking-tight text-lg uppercase italic leading-none underline decoration-2 decoration-white/20 underline-offset-4">BATTLE-CARD</h2>
               </div>
               <button 
                  onClick={() => setIsOpen(false)} 
                  className="text-muted-foreground hover:bg-white/10 hover:text-white p-2 rounded-lg transition-all"
                >
                  <X size={24} strokeWidth={2.5} />
               </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex w-full border border-glass-border p-1 rounded-lg">
              <button 
                onClick={() => { setIsGatekeeper(false); setCurrentStep(0); }}
                className={`flex-1 py-3 flex items-center justify-center gap-2 transition-all font-bold text-[10px] uppercase tracking-widest rounded-md ${!isGatekeeper ? 'bg-white text-black' : 'text-muted-foreground hover:text-white'}`}
              >
                <UserCheck size={14} /> OWNER
              </button>
              <button 
                onClick={() => { setIsGatekeeper(true); setCurrentStep(0); }}
                className={`flex-1 py-3 flex items-center justify-center gap-2 transition-all font-bold text-[10px] uppercase tracking-widest rounded-md ${isGatekeeper ? 'bg-white text-black' : 'text-muted-foreground hover:text-white'}`}
              >
                <ShieldCheck size={14} /> GATEKEEPER
              </button>
            </div>

            {/* Context Profile */}
            {activeLead && (
              <div className="bg-white/5 p-5 rounded-xl flex items-center gap-4 border border-glass-border">
                <div className="bg-white text-black p-2.5 rounded-lg">
                  <User size={18} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest leading-none mb-1">TARGET</span>
                  <span className="text-sm font-heading text-white font-black tracking-tight truncate uppercase leading-none">{activeLead["Practice Name"]}</span>
                </div>
              </div>
            )}

            {/* Progress */}
            <div className="flex gap-1.5 px-1">
              {script.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 transition-all duration-300 rounded-full border border-glass-border ${i <= currentStep ? "bg-primary" : "bg-white/10"}`} />
              ))}
            </div>

            {/* Clean Script Engine - Resized Text */}
            <div className="min-h-[220px] max-h-[320px] overflow-y-auto flex flex-col justify-center bg-black p-6 border-2 border-dashed border-glass-border rounded-xl relative">
              <h3 className="text-[9px] text-muted-foreground uppercase font-black mb-5 tracking-widest opacity-60">
                 PHASE {currentStep + 1}: {script[currentStep].label}
              </h3>
              <p className="whitespace-pre-line text-white text-[18px] font-heading font-bold leading-snug uppercase italic text-center px-2">
                 &ldquo;{script[currentStep].content}&rdquo;
              </p>
            </div>

            {/* Minimal Elite Controls */}
            <div className="flex justify-between items-center pt-4">
              <button 
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                className="text-[10px] text-muted-foreground hover:text-white transition-all font-bold uppercase tracking-widest disabled:opacity-10 flex items-center gap-2"
                disabled={currentStep === 0}
              >
                PREV
              </button>
              {currentStep < script.length - 1 ? (
                <button 
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="bg-white text-black px-10 py-4 font-bold text-xs flex items-center gap-3 hover:opacity-90 transition-all rounded-xl shadow-lg uppercase tracking-widest"
                >
                  NEXT <ChevronRight size={18} strokeWidth={2.5} />
                </button>
              ) : (
                <button 
                  onClick={() => { setCurrentStep(0); setIsOpen(false); }}
                  className="bg-green-500 text-black px-10 py-4 font-bold text-xs flex items-center gap-3 hover:opacity-90 transition-all rounded-xl shadow-lg uppercase tracking-widest"
                >
                  WIN <Check size={20} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
