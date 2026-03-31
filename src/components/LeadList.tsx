"use client";

import { useState, useEffect } from "react";
import leadsData from "@/data/leads.json";
import { Search, Phone, CheckCircle2, User, Building2, MapPin, MessageSquare, AlertCircle, Bookmark, Trash2, ExternalLink } from "lucide-react";

type LeadStatus = "new" | "called" | "booked" | "ignored";

interface LeadNotes {
  status: LeadStatus;
  comment: string;
}

export default function LeadList({ onSelectLead, activeEmail }: { onSelectLead: (lead: any) => void, activeEmail?: string }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [leadNotes, setLeadNotes] = useState<Record<string, LeadNotes>>({});

  useEffect(() => {
    const saved = localStorage.getItem("spine-empire-lead-notes");
    if (saved) setLeadNotes(JSON.parse(saved));
  }, []);

  const updateLeadNote = (email: string, updates: Partial<LeadNotes>) => {
    const updated = { 
      ...leadNotes, 
      [email]: { ...(leadNotes[email] || { status: "new", comment: "" }), ...updates } 
    };
    setLeadNotes(updated);
    localStorage.setItem("spine-empire-lead-notes", JSON.stringify(updated));
  };

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case "booked": return "text-green-500 border-green-500/50 bg-green-500/10";
      case "ignored": return "text-red-500 border-red-500/50 bg-red-500/10";
      case "called": return "text-yellow-500 border-yellow-500/50 bg-yellow-500/10";
      default: return "text-primary border-primary/50 bg-primary/10";
    }
  };

  const formatGVPhone = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    return clean.startsWith('1') ? clean : `1${clean}`;
  };

  const filteredLeads = leadsData.filter((l) =>
    l["Practice Name"].toLowerCase().includes(searchTerm.toLowerCase()) ||
    l["Email"].toLowerCase().includes(searchTerm.toLowerCase()) ||
    l["First Name"].toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="relative group">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-primary transition-colors">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Search 982 leads by clinic, owner, or email..."
          className="w-full bg-glass border border-glass-border rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-primary transition-all backdrop-blur-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 hide-scrollbar pb-12">
        {filteredLeads.slice(0, 100).map((lead, idx) => {
          const email = lead["Email"];
          const notes = leadNotes[email] || { status: "new", comment: "" };
          const isActive = activeEmail === email;

          return (
            <div 
              key={idx} 
              onClick={() => onSelectLead(lead)}
              className={`glass-card p-6 grid grid-cols-1 md:grid-cols-3 gap-6 group hover:translate-x-1 transition-all cursor-pointer ${isActive ? 'border-primary ring-1 ring-primary/30 ring-inset' : ''}`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-black tracking-widest uppercase mb-1 border px-2 py-0.5 rounded-full w-fit ${getStatusColor(notes.status)}`}>
                      {notes.status}
                    </span>
                    <h3 className="font-black text-lg group-hover:text-primary transition-colors line-clamp-1">
                      {lead["Practice Name"]}
                    </h3>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-gray-500 font-medium">
                  <div className="flex items-center gap-2">
                    <User size={12} className="text-primary/70" />
                    <span className="font-bold text-foreground">{lead["First Name"]} (Owner)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={12} />
                    <span>{lead["City"]}, {lead["State"]}</span>
                  </div>
                  <div className="flex items-center gap-2 overflow-hidden">
                    <AlertCircle size={12} />
                    <span className="truncate opacity-80">{lead["Email"]}</span>
                  </div>
                </div>
                
                <a 
                  href={`https://voice.google.com/u/0/calls?a=nc,%2B${formatGVPhone(lead["Phone"])}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-2 w-full bg-primary text-black font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all shadow-lg hover:shadow-primary/20"
                >
                  <Phone size={14} />
                  GOOGLE VOICE <ExternalLink size={12} />
                </a>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase">Pipeline Stage</span>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); updateLeadNote(email, { status: "called" }); }}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-bold transition-all ${notes.status === 'called' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'border-glass-border text-gray-500 hover:text-white'}`}
                  >
                    <Bookmark size={12} /> Called
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); updateLeadNote(email, { status: "booked" }); }}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-bold transition-all ${notes.status === 'booked' ? 'bg-green-500/20 border-green-500 text-green-500' : 'border-glass-border text-gray-500 hover:text-white'}`}
                  >
                    <CheckCircle2 size={12} /> Booked
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); updateLeadNote(email, { status: "ignored" }); }}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-bold transition-all ${notes.status === 'ignored' ? 'bg-red-500/20 border-red-500 text-red-500' : 'border-glass-border text-gray-500 hover:text-white'}`}
                  >
                    <Trash2 size={12} /> Ignore
                  </button>
                  <button 
                     onClick={(e) => { e.stopPropagation(); updateLeadNote(email, { status: "new" }); }}
                     className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-bold transition-all ${notes.status === 'new' ? 'bg-primary/20 border-primary text-primary' : 'border-glass-border text-gray-500 hover:text-white'}`}
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase flex items-center gap-1">
                  <MessageSquare size={10} /> Call Notes
                </span>
                <textarea 
                  value={notes.comment}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => { e.stopPropagation(); updateLeadNote(email, { comment: e.target.value }); }}
                  placeholder="Note: Gatekeeper, best time, etc..."
                  className="w-full h-full min-h-[80px] bg-foreground/5 border border-glass-border rounded-xl p-3 text-xs text-foreground font-medium focus:outline-none focus:border-primary transition-all resize-none placeholder:opacity-50"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
