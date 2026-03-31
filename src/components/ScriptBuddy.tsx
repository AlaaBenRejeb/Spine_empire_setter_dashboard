"use client";

import { useState } from "react";
import { MessageSquare, X, ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ScriptBuddy() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const script = [
    { label: "Opening", content: "Hey, am I speaking with the owner? Perfect — I’ll keep this brief. My name’s Alex. I work with chiropractors who want more consistency in new patient flow." },
    { label: "Diagnostic", content: "Quick question — are you getting most of your new patients from referrals, ads, or a mix? ... And is that predictable month to month, or does it fluctuate?" },
    { label: "The Problem", content: "Makes sense. The reason I called is we help clinics tighten patient acquisition so they’re not relying on one source and not guessing month to month." },
    { label: "The Close", content: "If I could show you how that would look for your clinic specifically, would you be open to a quick 10-minute call? I’ve got [Time 1] or [Time 2]. Which works better?" }
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-primary text-black p-4 rounded-full shadow-2xl shadow-primary/20 z-50 flex items-center gap-2 font-bold"
      >
        <MessageSquare size={20} />
        {!isOpen && <span>Script Buddy</span>}
      </motion.button>

      {/* Floating Script Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-24 right-8 w-96 glass-card p-6 z-50 shadow-2xl shadow-black/50 border-primary/30"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-primary font-bold tracking-widest text-sm glow-text">ELITE BATTLE-CARD</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex gap-2">
                {script.map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i <= currentStep ? "bg-primary glow-text shadow-sm shadow-primary/50" : "bg-white/10"}`} />
                ))}
              </div>

              <div className="min-h-[120px]">
                <h3 className="text-xs text-gray-500 uppercase font-bold mb-2 tracking-widest">{script[currentStep].label}</h3>
                <p className="text-white text-lg font-medium leading-relaxed italic border-l-2 border-primary pl-4">
                  "{script[currentStep].content}"
                </p>
              </div>

              <div className="flex justify-between items-center pt-4">
                <button 
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  className="text-xs text-gray-500 hover:text-white transition-colors font-bold uppercase tracking-wider"
                  disabled={currentStep === 0}
                >
                  PREV
                </button>
                {currentStep < script.length - 1 ? (
                  <button 
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="bg-primary/20 text-primary border border-primary/30 px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary hover:text-black transition-all"
                  >
                    NEXT <ChevronRight size={14} />
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                        setCurrentStep(0);
                        setIsOpen(false);
                    }}
                    className="bg-green-500 text-black px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:brightness-110 transition-all font-bold"
                  >
                    COMPLETE <Check size={14} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
