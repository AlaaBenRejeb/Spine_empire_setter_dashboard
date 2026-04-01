"use client"

import Link from "next/link"
import { 
  ChevronRight, 
  Target, 
  ArrowRight,
  ShieldCheck,
  FileText,
  Zap,
  MessageSquare,
  Trophy,
  History
} from "lucide-react"

const SETTER_CURRICULUM = [
  {
    phase: "Foundation",
    days: "1-2",
    title: "The Script & Mission",
    description: "Understand the Spine Empire offer and memorize the cold call engine.",
    details: [
      "The 4-Part System: Offer, Acquisition, Conversion, Ascension",
      "Chiropractor Pain Points: Over-reliance on referrals, no predictable growth",
      "Opener Excellence: Owner vs. Gatekeeper strategy",
      "Objection Bank: Handling 'Not Interested', 'Busy', and 'Send Info'"
    ]
  },
  {
    phase: "Delivery",
    days: "3-5",
    title: "Controlled Reps",
    description: "Turn memorization into delivery. Perfect your tone, pacing, and control.",
    details: [
      "Tone & Pacing: Sound like a peer, not a solicitor",
      "Objection Looping: Never stop at the first 'No'",
      "Roleplay standards: Rehearsing until it becomes second nature",
      "The Booking Test: Getting to the calendar in under 4 minutes"
    ]
  },
  {
    phase: "Live",
    days: "6-10",
    title: "Supervised Volume",
    description: "Create real conversations. Speed over perfection. Control the frame.",
    details: [
      "Daily Target: 50–100 dials to drive momentum",
      "Conversation Rate: Aim for 10+ real clinic owner talks daily",
      "Game Tape Review: Self-critique every non-booking call",
      "CRM Logging: If it isn't in the CRM, it didn't happen"
    ]
  },
  {
    phase: "Mastery",
    days: "11-14",
    title: "Consistency Standard",
    description: "Prove you can sustain performance. Feed the closers daily.",
    details: [
      "Show Rate Mastery: How to confirm calls so they actually show up",
      "Booking Quality: Never book garbage to hit a quota",
      "Graduation: Sustaining targets for 5 consecutive days"
    ]
  }
]

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12 relative overflow-hidden font-sans tracking-tight">
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.1),transparent)] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10 w-full pt-10">
        {/* Header Section */}
        <div className="text-center mb-20 space-y-6 animate-in fade-in slide-in-from-top-10 duration-1000">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] shadow-lg">
              <ShieldCheck size={14} /> Setter Training Portal
           </div>
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter uppercase italic leading-[0.85] text-white">
            Outbound <br/> <span className="text-emerald-500">Setting</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto font-bold uppercase tracking-widest opacity-80">
            One Objective: Book Calls, Not Close. <br/> Performance is measured in shows, not sounds.
          </p>
        </div>

        {/* The 14-Day Roadmap (Informational Only) */}
        <div className="grid grid-cols-1 gap-8 mb-20">
          {SETTER_CURRICULUM.map((phase, idx) => (
            <div key={idx} className="group relative">
               <div className="absolute -left-4 top-0 bottom-0 w-1 bg-emerald-500/20 group-hover:bg-emerald-500 transition-all rounded-full" />
               <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 hover:bg-white/[0.04] transition-all backdrop-blur-xl">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex-1">
                       <div className="flex items-center gap-4 mb-4">
                          <span className="text-emerald-500 font-black italic text-2xl uppercase tracking-tighter">Days {phase.days}</span>
                          <span className="text-slate-500 text-xs font-black uppercase tracking-[0.3em]">— {phase.phase}</span>
                       </div>
                       <h2 className="text-4xl font-black uppercase tracking-tighter italic mb-4">{phase.title}</h2>
                       <p className="text-slate-400 text-sm font-medium mb-8 max-w-2xl">{phase.description}</p>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
                          {phase.details.map((detail, i) => (
                            <div key={i} className="flex items-center gap-3 text-slate-300">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                               <span className="text-xs font-bold uppercase tracking-wider">{detail}</span>
                            </div>
                          ))}
                       </div>
                    </div>

                    <div className="flex flex-col gap-3 shrink-0">
                       <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all cursor-pointer">
                          <FileText size={20} />
                       </div>
                       <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
                          <History size={20} />
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 pb-20">
           <Link href="/deals" className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-center shadow-2xl transition-transform hover:scale-105">
              Open Lead Pipeline
           </Link>
           <Link href="/" className="w-full md:w-auto bg-white/5 hover:bg-white/10 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-center border border-white/10 backdrop-blur-md">
              KPI Leaderboard
           </Link>
        </div>

        <div className="text-center opacity-20 text-[10px] font-black uppercase tracking-[0.5em] pb-10">
           Spine Empire Revenue Engine | setter.spineempire.com
        </div>
      </div>
    </div>
  )
}
