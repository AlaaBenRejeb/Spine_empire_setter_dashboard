"use client";

import { useState } from "react";
import { X, UserPlus, Building2, User, DollarSign, Phone, Mail, MapPin, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCRM } from "@/context/CRMContext";

const REVENUE_OPTIONS = [
  "Under $20k/mo", "$20k - $50k/mo", "$50k - $100k/mo", "$100k+/mo", "Unknown"
];

export default function AddLeadModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addLead } = useCRM();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    contact_name: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    revenue_range: "Unknown",
    main_challenge: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.business_name || !form.contact_name) return;

    setIsSubmitting(true);
    try {
      await addLead(form);
      // Reset form
      setForm({
        business_name: "", contact_name: "",
        city: "", state: "", phone: "", email: "", revenue_range: "Unknown", main_challenge: "",
      });
      onClose();
    } catch (err) {
      console.error("Failed to add lead:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[600px] max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border border-white/10 rounded-3xl p-10 flex flex-col gap-8 shadow-[0_0_100px_rgba(34,197,94,0.1)] hide-scrollbar"
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-heading font-black tracking-tighter uppercase leading-none">
                  Inject <span className="text-green-500 italic">Lead</span>
                </h2>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.3em] opacity-40">Add a manually sourced target to CRM</p>
              </div>
              <button 
                onClick={onClose} 
                className="p-3 bg-secondary/50 rounded-xl border border-glass-border hover:border-green-500 hover:text-green-500 transition-all shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Practice Name */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                  <Building2 size={12} className="text-green-500" /> Practice Name *
                </label>
                <input
                  type="text"
                  value={form.business_name}
                  onChange={(e) => update("business_name", e.target.value)}
                  placeholder="e.g. Life Source Chiropractic"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-sm font-bold tracking-widest uppercase focus:border-green-500 outline-none transition-all placeholder:opacity-20"
                />
              </div>

              {/* Name Row */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                  <User size={12} className="text-green-500" /> Contact Name *
                </label>
                <input
                  type="text"
                  value={form.contact_name}
                  onChange={(e) => update("contact_name", e.target.value)}
                  placeholder="e.g. Dr. John Doe"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-sm font-bold tracking-widest uppercase focus:border-green-500 outline-none transition-all placeholder:opacity-20"
                />
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                    <MapPin size={12} className="text-green-500" /> City
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                    placeholder="Austin"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-sm font-bold tracking-widest uppercase focus:border-green-500 outline-none transition-all placeholder:opacity-20"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40">State</label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => update("state", e.target.value)}
                    placeholder="TX"
                    maxLength={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-sm font-bold tracking-widest uppercase focus:border-green-500 outline-none transition-all placeholder:opacity-20"
                  />
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                    <Phone size={12} className="text-green-500" /> Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-sm font-bold tracking-widest uppercase focus:border-green-500 outline-none transition-all placeholder:opacity-20"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                    <Mail size={12} className="text-green-500" /> Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="dr@spine.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-sm font-bold tracking-widest lowercase focus:border-green-500 outline-none transition-all placeholder:opacity-20"
                  />
                </div>
              </div>

              {/* Revenue */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                  <DollarSign size={12} className="text-green-500" /> Revenue Range
                </label>
                <select
                  value={form.revenue_range}
                  onChange={(e) => update("revenue_range", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-sm font-bold tracking-widest uppercase focus:border-green-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  {REVENUE_OPTIONS.map(r => <option key={r} value={r} className="bg-black">{r}</option>)}
                </select>
              </div>

              {/* Main Challenge */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                  <MessageSquare size={12} className="text-green-500" /> Main Challenge
                </label>
                <textarea
                  value={form.main_challenge}
                  onChange={(e) => update("main_challenge", e.target.value)}
                  placeholder="What is their primary frustration?"
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-sm font-bold placeholder:opacity-20 placeholder:italic focus:border-green-500 outline-none transition-all resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-500 text-black font-black text-sm uppercase tracking-[0.2em] py-5 rounded-xl hover:bg-green-400 active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(34,197,94,0.2)] flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
              >
                <UserPlus size={20} strokeWidth={3} /> {isSubmitting ? "Syncing..." : "Inject into Pipeline"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
