"use client";

import { motion } from "framer-motion";
import { Calendar, ExternalLink, Mail, CheckCircle2 } from "lucide-react";

export default function BookingsPage() {
  return (
    <div className="flex-1 flex flex-col gap-8 p-4 md:p-8 overflow-y-auto h-screen hide-scrollbar">
      <header className="flex flex-col">
        <h1 className="text-4xl font-black tracking-tight mb-1 uppercase">
          Booking <span className="text-primary">Portal</span>
        </h1>
        <p className="text-gray-500 font-bold text-xs tracking-widest uppercase opacity-70">Schedule your chiropractic demos</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendly Integration Card */}
        <div className="glass-card p-10 flex flex-col items-center justify-center text-center gap-6 group hover:translate-y-[-2px] transition-all">
          <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10">
            <Calendar size={40} className="text-primary" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-black uppercase tracking-tight">Calendly Manager</h2>
            <p className="text-sm font-medium text-gray-500 italic max-w-xs mx-auto opacity-70 leading-relaxed">
              Open your Scheduling Page to book clinics immediately while on the call.
            </p>
          </div>
          <a 
            href="https://calendly.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-primary text-black font-black w-full py-4 rounded-2xl flex items-center justify-center gap-3 hover:brightness-110 active:scale-95 shadow-xl shadow-primary/20 transition-all uppercase tracking-widest text-xs"
          >
            Launch Calendly <ExternalLink size={16} />
          </a>
        </div>

        {/* Success / Stats Card */}
        <div className="glass-card p-10 flex flex-col gap-8">
           <h3 className="text-lg font-black tracking-widest uppercase flex items-center gap-3">
              <CheckCircle2 className="text-green-500" size={20} />
              Booking Checklist
           </h3>
           <div className="space-y-4">
              {[
                "Confirm Clinic Lead Name",
                "Validate Direct Number",
                "Pitch the Elite Review Flow",
                "Set Demo Date & Time",
                "Send Calendar Invitation",
                "Log Status as 'Booked'"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-foreground/5 p-4 rounded-xl border border-glass-border">
                   <div className="w-5 h-5 rounded-full border-2 border-primary/30 flex items-center justify-center">
                      <div className="w-2 h-2 bg-primary rounded-full scale-0 group-hover:scale-100 transition-transform" />
                   </div>
                   <span className="text-sm font-bold opacity-80 italic">{item}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Alternative Followup Card */}
      <div className="glass-card p-8 flex justify-between items-center bg-primary/5 border-primary/20 rounded-3xl">
         <div className="flex items-center gap-6">
            <div className="p-4 bg-primary/20 rounded-2xl border border-primary/10">
               <Mail size={24} className="text-primary" />
            </div>
            <div className="flex flex-col">
               <h4 className="text-lg font-black tracking-tight uppercase leading-none mb-1">In-Call Email Kit</h4>
               <p className="text-xs font-medium text-gray-500 italic opacity-70">Send info-packs directly from your dashboard.</p>
            </div>
         </div>
         <button className="bg-foreground text-background font-black text-[10px] px-6 py-2.5 rounded-xl uppercase tracking-widest hover:invert transition-all">
            Launch Emailer
         </button>
      </div>
    </div>
  );
}
