"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Mail, MessageSquare, Copy, ExternalLink, Check, Phone, 
  Clock, Bell, Ghost, ShieldAlert, Inbox, HelpCircle, 
  PhoneForwarded, RotateCcw, Search, Zap, UserCheck, Ban 
} from "lucide-react";

interface Lead {
  Email: string;
  "First Name": string;
  "Practice Name": string;
  Phone: string;
  City: string;
}

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  defaultTab?: "email" | "sms";
}

const SCENARIOS = [
  { id: "missed-call", label: "No Answer", icon: <Phone size={14}/>, subject: "Quick note about patient flow" },
  { id: "busy", label: "Spoke Briefly", icon: <Clock size={14}/>, subject: "Following up from my call" },
  { id: "interested-no-booking", label: "Interested", icon: <UserCheck size={14}/>, subject: "Next step for [Clinic Name]" },
  { id: "confirmation", label: "Confirmation", icon: <Check size={14}/>, subject: "Confirmed — [day/time]" },
  { id: "reminder", label: "Reminders", icon: <Bell size={14}/>, subject: "Reminder for today" },
  { id: "no-show", label: "No-Show", icon: <Ghost size={14}/>, subject: "Missed you" },
  { id: "send-info", label: "Sent Info", icon: <Inbox size={14}/>, subject: "Info you asked for" },
  { id: "gatekeeper-no-transfer", label: "GK Block", icon: <ShieldAlert size={14}/>, subject: "Tried reaching you at the clinic" },
  { id: "gatekeeper-email", label: "GK Email", icon: <Mail size={14}/>, subject: "For the owner / patient acquisition" },
  { id: "what-do-you-do", label: "Explain", icon: <HelpCircle size={14}/>, subject: "What we actually do" },
  { id: "call-later", label: "Call Later", icon: <PhoneForwarded size={14}/>, subject: "Following up as requested" },
  { id: "curious-skeptical", label: "Skeptical", icon: <Search size={14}/>, subject: "Fair skepticism" },
  { id: "not-interested", label: "Not Int.", icon: <Ban size={14}/>, subject: "One quick follow-up" },
  { id: "hard-no", label: "Hard No", icon: < Ban size={14} className="text-red-500"/>, subject: "Closing the loop for now" },
  { id: "fumble", label: "Recovery", icon: <RotateCcw size={14}/>, subject: "Following up more clearly" },
];

const SCRIPTS: Record<string, { email: string, sms: string }> = {
  "missed-call": {
    email: "Hi Dr. [Name],\n\nTried calling you just now.\n\nThe reason for the call was simple: I work with clinics to improve consistency in new patient flow and reduce dependence on one source like referrals alone.\n\nNot sure if it’s relevant for your clinic yet, but if you’re open to a quick 10-minute conversation, I can show you what that could look like specifically for [Clinic Name].\n\nAre you better on [option 1] or [option 2]?\n\n– [Setter Name]",
    sms: "Hey Dr. [Name], [Setter Name] here. Tried reaching you just now regarding patient acquisition for the clinic. Quick reason for the call: I believe there may be room to make new patient flow more predictable. Worth a quick 10-minute chat this week?"
  },
  "busy": {
    email: "Hi Dr. [Name],\n\nThanks for taking my call earlier.\n\nYou mentioned timing was tight, so I’ll keep this brief. The reason I reached out is that we help clinics improve consistency in booked patients without relying entirely on referrals.\n\nIf it makes sense, let’s keep it to 10 minutes and I’ll walk you through how this could apply to [Clinic Name].\n\nWould [time 1] or [time 2] work better?\n\n– [Setter Name]",
    sms: "Hey Dr. [Name], [Setter Name] here — as mentioned, this is about making patient flow more predictable for [Clinic Name]. You said timing was tight, so I’ll keep it simple: does [day/time 1] or [day/time 2] work better for a quick 10-minute call?"
  },
  "send-info": {
    email: "Hi Dr. [Name],\n\nAs requested, here’s the short version:\n\nWe help clinics make new patient flow more predictable by tightening the front-end patient acquisition system rather than leaving growth to referrals alone.\n\nThe reason I didn’t want to send a wall of text is simple: whether this is relevant depends on how [Clinic Name] is currently getting patients and where the leak is.\n\nIf helpful, I can walk you through it in 10 minutes and keep it specific to your clinic.\n\nWould [time 1] or [time 2] work?\n\n– [Setter Name]",
    sms: "Absolutely. High level: we help clinics improve consistency in new patient flow and reduce reliance on referrals alone. Easier to explain in context of your clinic. Worth a quick 10-minute call so I can tailor it properly?"
  },
  "not-interested": {
    email: "Hi Dr. [Name],\n\nCompletely fair.\n\nUsually when I hear “not interested,” it means one of two things: either patient flow is already consistent, or it just isn’t the right timing.\n\nOut of curiosity — is [Clinic Name] fully booked consistently, or does it fluctuate month to month?\n\nIf it’s already handled, great. If not, I may be able to help.\n\n– [Setter Name]",
    sms: "Understood. Usually when someone says that, it means either things are working well already or timing’s off. Out of curiosity — are you fully booked consistently, or does it fluctuate?"
  },
  "interested-no-booking": {
    email: "Hi Dr. [Name],\n\nGood speaking earlier.\n\nBased on what you shared around [insert situation], I do think there’s enough here to warrant a quick look.\n\nThe next step is simple: a short 10-minute call where I’ll show you how this could work specifically for [Clinic Name].\n\nI have [time 1] or [time 2] available. Which works better?\n\n– [Setter Name]",
    sms: "Hey Dr. [Name], [Setter Name] here. Enjoyed the quick chat earlier. Based on what you shared about [referrals/ads/inconsistent flow], I do think it’s worth a proper 10-minute look. I’ve got [time 1] or [time 2] open — which is better?"
  },
  "confirmation": {
    email: "Hi Dr. [Name],\n\nYou’re confirmed for [day] at [time].\n\nAgenda will be simple:\n1. how you’re currently getting patients\n2. where the leak likely is\n3. what a more predictable flow could look like\n\nI’ll keep it short and relevant.\n\nSee you then,\n[Setter Name]",
    sms: "Booked. You’re down for [day] at [time]. I’ll keep it tight and specific to [Clinic Name]. I’ll send the details here as well."
  },
  "reminder": {
    email: "Hi Dr. [Name],\n\nQuick reminder for our call today at [time].\n\nI’ll keep it brief and focused on patient acquisition and booked appointments for [Clinic Name].\n\nSpeak soon,\n[Setter Name]",
    sms: "Hey Dr. [Name], quick reminder for our call today at [time]. I’ll keep it to 10 minutes and focused on how to make patient flow more predictable for [Clinic Name]."
  },
  "no-show": {
    email: "Hi Dr. [Name],\n\nLooks like we missed each other.\n\nNo problem — happy to reschedule and keep it brief. The goal is still the same: show you whether there’s a way to make patient flow more predictable for [Clinic Name].\n\nWould [new time 1] or [new time 2] work better?\n\n– [Setter Name]",
    sms: "Hey Dr. [Name], looks like we missed each other. No problem. Still happy to keep this brief and show you what I meant regarding more predictable patient flow. Does [new time 1] or [new time 2] work better?"
  },
  "gatekeeper-no-transfer": {
    email: "Hi Dr. [Name],\n\nTried reaching you through the clinic earlier.\n\nReason for the outreach: I believe there may be room to improve consistency in new patient flow at [Clinic Name], especially if growth relies heavily on referrals or fluctuates month to month.\n\nIf you’re open to it, I’d be happy to show you what I mean in a quick 10-minute conversation.\n\nWould [time 1] or [time 2] work better?\n\n– [Setter Name]",
    sms: "Hi Dr. [Name], [Setter Name] here. I called the clinic earlier regarding patient acquisition and a possible opportunity to improve consistency in new patient flow. Not sure if it’s relevant yet, but worth a quick 10-minute chat?"
  },
  "gatekeeper-email": {
    email: "Hi [Gatekeeper Name],\n\nThanks for speaking with me.\n\nAs mentioned, the reason for the outreach is related to patient acquisition and improving consistency in new patient flow for the clinic.\n\nAt a high level, we help clinics reduce reliance on a single source of patients and create a more predictable front-end flow of booked appointments.\n\nIf appropriate, I’d appreciate the chance to speak briefly with Dr. [Name] to see whether this is even relevant.\n\nBest,\n[Setter Name]",
    sms: "Hi Dr. [Name], [Setter Name] here. I spoke with your team earlier and sent a short note over regarding patient acquisition for the clinic. If relevant, happy to walk you through it in 10 minutes."
  },
  "hard-no": {
    email: "Hi Dr. [Name],\n\nUnderstood.\n\nI’ll leave it here for now. If improving consistency in new patient flow becomes a priority later on, I’d be happy to revisit the conversation.\n\nBest,\n[Setter Name]",
    sms: "Understood. I’ll leave it there for now. If consistency in new patient flow ever becomes a priority, happy to revisit."
  },
  "what-do-you-do": {
    email: "Hi Dr. [Name],\n\nFair question.\n\nAt a high level, we help clinics improve revenue by fixing the front-end patient acquisition system and making booked appointments more predictable.\n\nThat usually means looking at:\n- how patients are currently acquired\n- where leads or bookings are leaking\n- what would make growth more consistent\n\nIf it makes sense after that, we show what the system would look like for the clinic specifically.\n\nIf you want, we can cover that in 10 minutes.\n\n– [Setter Name]",
    sms: "Fair to ask. High level: we help clinics improve consistency in new patient flow and reduce reliance on referrals. Worth a quick 10-min call so I can show you the system?"
  },
  "call-later": {
    email: "Hi Dr. [Name],\n\nFollowing up as requested.\n\nThis was regarding patient acquisition and whether there’s room to make patient flow more predictable for [Clinic Name].\n\nWould [time 1] or [time 2] work for a quick 10-minute conversation?\n\n– [Setter Name]",
    sms: "Will do. As promised, this is [Setter Name] following up about patient acquisition for [Clinic Name]. What’s better for a quick call — [time 1] or [time 2]?"
  },
  "curious-skeptical": {
    email: "Hi Dr. [Name],\n\nTotally fair to be skeptical.\n\nMost clinics get pitched constantly. The reason I reached out is not to throw generic marketing at you — it’s to see whether there’s actually a leak in patient acquisition worth fixing.\n\nThat’s also why I’d rather keep it to 10 minutes and make it specific to [Clinic Name].\n\nWould [time 1] or [time 2] work?\n\n– [Setter Name]",
    sms: "Fair to be skeptical. Most clinics hear a lot of noise. That’s exactly why I’d rather keep it to 10 minutes and make it specific to your clinic instead of pitching blindly."
  },
  "fumble": {
    email: "Hi Dr. [Name],\n\nAppreciate you taking my call earlier.\n\nI wanted to follow up more clearly. The reason I reached out is to see whether there’s room to improve consistency in new patient flow for [Clinic Name], especially if growth depends too heavily on referrals or fluctuates.\n\nIf it’s worth 10 minutes, I’d be happy to walk you through what I mean.\n\nBest,\n[Setter Name]",
    sms: "Hey Dr. [Name], [Setter Name] here — appreciate you taking the call earlier. I wanted to follow up more clearly: the reason I reached out is to see whether there’s room to make patient flow more predictable for [Clinic Name]. If it’s worth 10 minutes, I’d be happy to show you what I mean."
  },
};

export default function FollowUpModal({ isOpen, onClose, lead, defaultTab = "email" }: FollowUpModalProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState(SCENARIOS[0].id);
  const [activeTab, setActiveTab] = useState<"email" | "sms">(defaultTab);
  const [copiedType, setCopiedType] = useState<"email" | "sms" | null>(null);
  
  const [time1, setTime1] = useState("Tomorrow at 10 AM");
  const [time2, setTime2] = useState("Thursday at 2 PM");
  const [situation, setSituation] = useState("inconsistent referrals");
  const [setterName, setSetterName] = useState("Alex");

  useEffect(() => {
    if (isOpen && defaultTab) setActiveTab(defaultTab);
  }, [isOpen, defaultTab]);

  const scenario = useMemo(() => SCENARIOS.find(s => s.id === selectedScenarioId) || SCENARIOS[0], [selectedScenarioId]);
  const scripts = SCRIPTS[selectedScenarioId] || SCRIPTS["missed-call"];

  if (!lead) return null;

  const firstName = lead["First Name"] || lead.Email.split("@")[0];
  const practiceName = lead["Practice Name"] || "the clinic";

  const processText = (text: string) => {
    return text
      .replace(/\[Name\]/g, firstName)
      .replace(/\[Clinic Name\]/g, practiceName)
      .replace(/\[Setter Name\]/g, setterName)
      .replace(/Alex/g, setterName)
      .replace(/\[option 1\]/g, time1)
      .replace(/\[option 2\]/g, time2)
      .replace(/\[time 1\]/g, time1)
      .replace(/\[time 2\]/g, time2)
      .replace(/\[day\/time 1\]/g, time1)
      .replace(/\[day\/time 2\]/g, time2)
      .replace(/\[day\]/g, time1.split(" ")[0])
      .replace(/\[time\]/g, time1.split("at ")[1] || time1)
      .replace(/\[new time 1\]/g, time1)
      .replace(/\[new time 2\]/g, time2)
      .replace(/\[insert situation\]/g, situation)
      .replace(/\[referrals\/ads\/inconsistent flow\]/g, situation);
  };

  const emailSubject = processText(scenario.subject);
  const emailBody = processText(scripts.email);
  const smsBody = processText(scripts.sms);

  const handleCopy = (text: string, type: "email" | "sms") => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const openMail = () => window.location.href = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  const openGoogleVoice = () => window.open(`https://voice.google.com/u/0/messages?number=${lead.Phone.replace(/\D/g, "")}`, "_blank");

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-[1100px] h-[85vh] bg-[#0d0d0d] border-2 border-glass-border rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
          >
            {/* Left Column: Scenario Bank */}
            <div className="w-full md:w-[320px] bg-secondary/30 border-r border-glass-border flex flex-col overflow-hidden">
               <div className="p-8 bg-primary text-black shrink-0">
                  <h2 className="text-xl font-heading font-black uppercase tracking-tighter italic flex items-center gap-3">
                     <Zap size={22} fill="black" /> Script Bank
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mt-1">15 High-Speed Presets</p>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 space-y-2 hide-scrollbar">
                  {SCENARIOS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedScenarioId(s.id)}
                      className={`w-full text-left px-5 py-4 rounded-xl transition-all border-2 flex items-center gap-4 relative group ${
                        selectedScenarioId === s.id 
                          ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)] translate-x-1' 
                          : 'bg-transparent border-transparent hover:bg-white/5 text-muted-foreground'
                      }`}
                    >
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${selectedScenarioId === s.id ? 'bg-primary text-black' : 'bg-white/10 group-hover:bg-white/20'}`}>
                          {s.icon}
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-widest leading-none">{s.label}</span>
                       {selectedScenarioId === s.id && <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                    </button>
                  ))}
               </div>
            </div>

            {/* Right Column: Content & Controls */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
               <button 
                  onClick={onClose}
                  className="absolute top-6 right-8 text-muted-foreground hover:text-white transition-colors z-50 p-2 hover:bg-white/10 rounded-full"
               >
                  <X size={24} strokeWidth={3} />
               </button>

               {/* Top Bar: Lead Info */}
               <div className="p-8 border-b border-glass-border bg-black/40">
                  <div className="flex justify-between items-start pr-12">
                     <div>
                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mb-2">Active Lead Matrix</p>
                        <h3 className="text-3xl font-heading font-black text-white uppercase italic leading-none">{practiceName}</h3>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em] mt-2 opacity-60">Attn: {firstName} • {lead.Phone}</p>
                     </div>
                     
                     <div className="flex gap-4">
                        <div className="flex flex-col gap-1.5">
                           <span className="text-[8px] font-black uppercase text-muted-foreground opacity-60 tracking-widest">Time 1</span>
                           <input 
                              value={time1} 
                              onChange={(e) => setTime1(e.target.value)}
                              className="bg-white/5 border border-glass-border rounded-lg px-3 py-2 text-[10px] font-black uppercase text-white focus:border-primary outline-none transition-all w-32"
                           />
                        </div>
                        <div className="flex flex-col gap-1.5">
                           <span className="text-[8px] font-black uppercase text-muted-foreground opacity-60 tracking-widest">Time 2</span>
                           <input 
                              value={time2} 
                              onChange={(e) => setTime2(e.target.value)}
                              className="bg-white/5 border border-glass-border rounded-lg px-3 py-2 text-[10px] font-black uppercase text-white focus:border-primary outline-none transition-all w-32"
                           />
                        </div>
                     </div>
                  </div>
               </div>

               {/* Tab Switcher */}
               <div className="flex border-b border-glass-border bg-black/20">
                  <button 
                     onClick={() => setActiveTab("email")}
                     className={`flex-1 py-5 font-black text-[10px] uppercase tracking-[0.4em] transition-all border-b-2 ${activeTab === "email" ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-white"}`}
                  >
                     Email Matrix
                  </button>
                  <button 
                     onClick={() => setActiveTab("sms")}
                     className={`flex-1 py-5 font-black text-[10px] uppercase tracking-[0.4em] transition-all border-b-2 ${activeTab === "sms" ? "border-blue-500 text-blue-500 bg-blue-500/5" : "border-transparent text-muted-foreground hover:text-white"}`}
                  >
                     SMS / G-Voice
                  </button>
               </div>

               {/* Content Area */}
               <div className="flex-1 overflow-y-auto p-10 space-y-8 hide-scrollbar">
                  {activeTab === "email" ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                       <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl">
                          <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2">Subject Line</p>
                          <p className="text-sm font-black text-white italic">{emailSubject}</p>
                       </div>
                       
                       <div className="space-y-3">
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Message Body</p>
                          <div className="bg-white/5 border border-glass-border rounded-[2.5rem] p-10 text-sm font-medium leading-relaxed text-slate-300 relative group">
                             <pre className="whitespace-pre-wrap font-sans leading-[1.8]">{emailBody}</pre>
                             <button 
                                onClick={() => handleCopy(emailBody, "email")}
                                className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-primary hover:text-black rounded-xl transition-all border border-white/10 group-hover:scale-110 active:scale-95"
                             >
                                {copiedType === "email" ? <Check size={18} /> : <Copy size={18} />}
                             </button>
                          </div>
                       </div>

                       <div className="flex gap-4 pt-4">
                          <button 
                            onClick={() => handleCopy(emailBody, "email")}
                            className="flex-1 bg-white/5 border-2 border-glass-border hover:border-white text-white py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:bg-white hover:text-black shadow-xl"
                          >
                             {copiedType === "email" ? "Copied to Clipboard" : "Copy to Clipboard"}
                          </button>
                          <button 
                            onClick={openMail}
                            className="flex-1 bg-primary text-black py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(var(--primary),0.3)]"
                          >
                             Launch Email Engine
                          </button>
                       </div>
                    </div>
                  ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                       <div className="space-y-3">
                          <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">SMS Body</p>
                          <div className="bg-white/5 border border-glass-border rounded-[2.5rem] p-10 text-sm font-medium leading-relaxed text-slate-300 relative group">
                             <pre className="whitespace-pre-wrap font-sans leading-[1.8]">{smsBody}</pre>
                             <button 
                                onClick={() => handleCopy(smsBody, "sms")}
                                className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-blue-500 hover:text-white rounded-xl transition-all border border-white/10 group-hover:scale-110 active:scale-95"
                             >
                                {copiedType === "sms" ? <Check size={18} /> : <Copy size={18} />}
                             </button>
                          </div>
                       </div>

                       <div className="bg-blue-500/10 border border-blue-500/20 p-8 rounded-3xl flex gap-6 italic">
                          <div className="w-12 h-12 bg-blue-500/20 rounded-2xl border border-blue-500/40 flex items-center justify-center text-blue-500 shrink-0">
                             <ShieldAlert size={24} />
                          </div>
                          <div>
                             <h4 className="text-blue-500 font-black uppercase tracking-widest text-xs mb-2 leading-none">G-Voice Protocol Activated</h4>
                             <p className="text-slate-400 text-xs font-medium leading-relaxed">Paste the script exactly as generated. Do not deviate from the confirmed matrix. Launch below to sync immediately.</p>
                          </div>
                       </div>

                       <div className="flex gap-4 pt-4">
                          <button 
                            onClick={() => handleCopy(smsBody, "sms")}
                            className="flex-1 bg-white/5 border-2 border-glass-border hover:border-white text-white py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:bg-white hover:text-black"
                          >
                             {copiedType === "sms" ? "Copied" : "Copy Matrix SMS"}
                          </button>
                          <button 
                            onClick={openGoogleVoice}
                            className="flex-1 bg-blue-600 text-white py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(37,99,235,0.3)]"
                          >
                             Launch G-Voice Engine
                          </button>
                       </div>
                    </div>
                  )}
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
