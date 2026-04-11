"use client";

import { Menu, X, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCRM } from "@/context/CRMContext";

interface MobileHeaderProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function MobileHeader({ isOpen, onToggle }: MobileHeaderProps) {
  const { metaPrioritySummary } = useCRM();
  const urgentMetaCount = metaPrioritySummary.overdueCount + metaPrioritySummary.escalatedCount;
  const badgeLabel =
    urgentMetaCount > 0
      ? `${urgentMetaCount} urgent`
      : metaPrioritySummary.totalCount > 0
        ? `${metaPrioritySummary.totalCount} live`
        : null;
  const badgeTone =
    metaPrioritySummary.escalatedCount > 0
      ? "border-red-500/20 bg-red-500/10 text-red-500"
      : metaPrioritySummary.overdueCount > 0
        ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-500";

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-glass-border z-[60] flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-black text-white dark:bg-white dark:text-black rounded-lg flex items-center justify-center border border-black shadow-sm">
          <Zap size={16} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-heading font-bold uppercase tracking-tight italic">Spine Engine</span>
          {badgeLabel && (
            <span className={`mt-1 inline-flex w-fit rounded-full border px-2 py-0.5 text-[7px] font-black uppercase tracking-widest ${badgeTone}`}>
              Meta {badgeLabel}
            </span>
          )}
        </div>
      </div>

      <button 
        onClick={onToggle}
        className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </header>
  );
}
